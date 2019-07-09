"use strict";
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");

const { spawnSync } = require("../process");
const output = require("../output");
const { getConfig, replaceFileExtension } = require("../util");

module.exports = function compile({ debug = false, useStartUp = false } = {}) {
  const config = getConfig();
  output.clear();
  output.show();

  const outDir = "bin";
  const currentFile = vscode.window.activeTextEditor.document.fileName;
  const fileToCompile = (useStartUp && findStartUp(currentFile)) || currentFile;
  const workDir = path.dirname(fileToCompile);
  const outputDir = path.join(workDir, outDir);
  const buildLog = path.join(outputDir, "buildlog.txt");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  output.appendLine(`Compiling ${fileToCompile}`);

  const debugArgs = debug ? ["-debugdump", "-vicesymbols"] : [];
  const args = ["-jar", config.kickAssJar, "-odir", outDir, "-log", buildLog, "-showmem"];
  const process = spawnSync(config.javaBin, [...args, ...debugArgs, fileToCompile], { cwd: workDir });
  output.append(process.stdout.toString());

  let outputFile;

  if (process.status === 0) {
    outputFile = replaceFileExtension(fileToCompile, ".prg");
  } else {
    vscode.window.showErrorMessage("Compilation failed with errors.");
    output.append(process.stderr.toString());
  }

  return {
    outputFile,
    outputDir,
    debug,
  };
};

function findStartUp(file) {
  const fileDir = path.dirname(file);
  const startUp = fs.readdirSync(fileDir).find((fileName) => /^startup\..*$/i.test(fileName));

  if (startUp) {
    return path.join(fileDir, startUp);
  }
}
