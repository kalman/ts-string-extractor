import ts from 'typescript';

export type FunctionCall = {
  error?: string;
  lineAndCharacter: ts.LineAndCharacter;
  literal?: string;
  sourceFile: ts.SourceFile;
};

export function findFunctionCalls(
  sourceFile: ts.SourceFile,
  name: string,
  checkPolyglot: boolean
): FunctionCall[] {
  const functionCalls: FunctionCall[] = [];

  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      if (node.expression.getText(sourceFile) === name) {
        const functionCall: FunctionCall = {
          lineAndCharacter: ts.getLineAndCharacterOfPosition(sourceFile, node.pos),
          sourceFile,
        };

        functionCalls.push(functionCall);

        if (node.arguments.length === 0) {
          functionCall.error = `${name} must have 1 or more arguments`;
        } else {
          const firstArg = node.arguments[0];

          functionCall.lineAndCharacter = ts.getLineAndCharacterOfPosition(
            sourceFile,
            firstArg.pos
          );

          if (!ts.isStringLiteral(firstArg)) {
            const source = node.getText(sourceFile);
            functionCall.error = `First argument of ${source} must be a string literal`;
          } else {
            functionCall.literal = firstArg.text;

            const textSubKeys = subKeysFromText(firstArg.text);
            const argSubKeys = subKeysFromObjectLiteral(node.arguments[1]);

            if (checkPolyglot && !listsEqualUnordered(textSubKeys, argSubKeys)) {
              functionCall.error =
                `Mismatched Polyglot substitution, text has [${textSubKeys}] ` +
                `but object has [${argSubKeys}]`;
            }
          }
        }
      }
    }

    node.forEachChild(visit);
  };

  sourceFile.forEachChild(visit);

  return functionCalls;
}

function subKeysFromText(text: string): string[] {
  const keys: string[] = [];
  let index = text.indexOf('{');
  while (index !== -1) {
    const closeIndex = text.indexOf('}', index);
    keys.push(text.slice(index + 1, closeIndex));
    index = text.indexOf('{', index + 1);
  }
  return keys;
}

function subKeysFromObjectLiteral(node: ts.Expression | undefined): string[] {
  const keys: string[] = [];
  if (node && ts.isObjectLiteralExpression(node)) {
    for (const prop of node.properties) {
      if (ts.isPropertyAssignment(prop)) {
        if (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)) {
          keys.push(prop.name.text);
        }
      }
    }
  }
  return keys;
}

function listsEqualUnordered(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every(item => b.includes(item));
}
