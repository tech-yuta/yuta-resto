import { readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const sourceRoot = new URL('../src/', import.meta.url);

describe('Next.js server action modules', () => {
  it('exports only async functions and erased TypeScript declarations', () => {
    const violations: string[] = [];

    for (const filePath of listTypeScriptFiles(sourceRoot)) {
      const sourceText = readFileSync(filePath, 'utf8');
      const source = ts.createSourceFile(
        filePath,
        sourceText,
        ts.ScriptTarget.Latest,
        true,
      );
      if (!hasUseServerDirective(source)) continue;

      for (const statement of source.statements) {
        if (!hasExportModifier(statement)) continue;
        if (
          ts.isTypeAliasDeclaration(statement) ||
          ts.isInterfaceDeclaration(statement)
        ) {
          continue;
        }
        if (
          ts.isFunctionDeclaration(statement) &&
          hasAsyncModifier(statement)
        ) {
          continue;
        }
        if (
          ts.isVariableStatement(statement) &&
          statement.declarationList.declarations.every((declaration) => {
            const initializer = declaration.initializer;
            return (
              initializer !== undefined &&
              (ts.isArrowFunction(initializer) ||
                ts.isFunctionExpression(initializer)) &&
              hasAsyncModifier(initializer)
            );
          })
        ) {
          continue;
        }
        violations.push(
          `${filePath}:${source.getLineAndCharacterOfPosition(statement.getStart()).line + 1}`,
        );
      }
    }

    expect(violations).toEqual([]);
  });
});

function listTypeScriptFiles(root: URL): string[] {
  const rootPath = fileURLToPath(root);
  const files: string[] = [];
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const entryPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
      } else if (['.ts', '.tsx'].includes(extname(entry.name))) {
        files.push(entryPath);
      }
    }
  };
  visit(rootPath);
  return files;
}

function hasUseServerDirective(source: ts.SourceFile): boolean {
  const statement = source.statements[0];
  return (
    statement !== undefined &&
    ts.isExpressionStatement(statement) &&
    ts.isStringLiteral(statement.expression) &&
    statement.expression.text === 'use server'
  );
}

function hasExportModifier(node: ts.Node): boolean {
  return (
    ts.canHaveModifiers(node) &&
    (ts
      .getModifiers(node)
      ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ??
      false)
  );
}

function hasAsyncModifier(node: ts.Node): boolean {
  return (
    ts.canHaveModifiers(node) &&
    (ts
      .getModifiers(node)
      ?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword) ??
      false)
  );
}
