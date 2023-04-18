import arg from 'arg';
import ts from 'typescript';
import {FunctionCall, findFunctionCalls} from './find-function-calls';

function main(): number {
  const args = arg({
    '--check-only': Boolean,
    '--check-polyglot': Boolean,
    '--name': String,
    '-n': '--name',
    '--project': String,
    '-p': '--project',
  });

  const checkOnly = args['--check-only'] ?? false;
  const checkPolyglot = args['--check-polyglot'] ?? false;
  const name = args['--name'];
  let configPath = args['--project'];
  const files = args._;

  if (!name) {
    throw new Error('must provide a --name');
  }

  if (!configPath) {
    configPath = ts.findConfigFile('./', ts.sys.fileExists, 'tsconfig.json');
  }

  if (files.length === 0) {
    throw new Error('must provide at least one file');
  }

  let compilerOptions: ts.CompilerOptions = {};

  if (configPath) {
    const config = ts.readConfigFile(configPath, ts.sys.readFile);
    compilerOptions = config.config!.compilerOptions as ts.CompilerOptions;
    if ((compilerOptions.moduleResolution as any) === 'node') {
      compilerOptions.moduleResolution = ts.ModuleResolutionKind.Node16;
    }
  }

  const program = ts.createProgram({
    rootNames: files,
    options: compilerOptions,
  });

  const functionCalls: FunctionCall[] = [];

  for (const file of files) {
    if (!file.endsWith('.ts') && !file.endsWith('.tsx')) {
      console.log('fyi ignoring non-TypeScript file', file);
      continue;
    }

    const sourceFile = program.getSourceFile(file);

    if (sourceFile) {
      functionCalls.push(...findFunctionCalls(sourceFile, name, checkPolyglot));
    }
  }

  let hasErrors = false;
  const functionCallJSON: Record<string, any> = {};

  for (const {error, lineAndCharacter: lc, literal, sourceFile} of functionCalls) {
    if (error) {
      hasErrors = true;
      console.error(`Error in ${sourceFile.fileName}:${lc.line + 1}:${lc.character + 1}: ${error}`);
    }

    if (literal) {
      functionCallJSON[literal] = {
        file: sourceFile.fileName,
        line: lc.line + 1,
        column: lc.character + 1,
      };
    }
  }

  if (!checkOnly) {
    console.log(JSON.stringify(functionCallJSON, undefined, 2));
  }

  return hasErrors ? 1 : 0;
}

process.exit(main());
