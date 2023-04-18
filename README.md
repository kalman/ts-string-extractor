Extracts the string literal contents of TypeScript function calls.

Can also check that the function calls are valid calls to [`polyglot.t`](https://github.com/airbnb/polyglot.js#translation).

## Usage

```sh
npm run ts-string-extractor -- -n function_name [-p tsconfig.json] [--check-polyglot] [--check-only] [file ...]
```

## Example

Given a TypeScript file `file.ts`:

```typescript
polyglot.t('hello');
polyglot.t('world');
polyglot.t('not' + 'valid');
polyglot.t("has a {name} but it's {missing}", {enam: 'whoops'});
```

Then running:

```sh
bin/ts-string-extractor -n polyglot.t --check-polyglot file.ts
```

Will yield JSON output:

```json
{
  "hello": {
    "file": "file.ts",
    "line": 1,
    "column": 12
  },
  "world": {
    "file": "file.ts",
    "line": 2,
    "column": 12
  },
  "has a {name} but it's {missing}": {
    "file": "file.ts",
    "line": 4,
    "column": 12
  }
}
```

and errors:

```
Error in file.ts:3:12: First argument of polyglot.t('not' + 'valid') must be a string literal
Error in file.ts:4:12: Mismatched Polyglot substitution, text has [name,missing] but object literal has [enam]
```

## Notes

- Works with any file that the TypeScript compiler is able to understand, including .js, .jsx, and .tsx.
- If `-p tsconfig.json` isn't specified then the tsconfig.json file in the current directory will be used, otherwise the default configuration.
- A `--check-only` flag is provided that runs only the checkers, it doesn't generate any json output.
