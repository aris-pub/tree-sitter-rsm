# tree-sitter-rsm

This is the reference implementation of the Readable Science Markup (RSM) language,
written as a tree-sitter grammar. RSM is one of the cornerstone components of the
[Aris](https://github.com/leotrs/aris) system. For more information [see
here](https://aris.pub).


## Development

The two main files are `grammar.js` and `src/scanner.c` which implement the language
grammar and the external scanner, respectively. The tests are defined in
`test/corpus/*.txt`, and can be executed via `npx tree-sitter test`.

Compile the grammar locally by executing
```bash
npx tree-sitter generate
```
and build locally by executing
```bash
npx tree-sitter build
```

Once development of a feature is complete, submit a PR.


## Publishing
The grammar is released as a PyPI package by following these
[intructions](https://tree-sitter.github.io/tree-sitter/creating-parsers/6-publishing.html).
At the time of writing, a summarized version of the instructions are the following:

`just release` in the RSM repository runs these steps. To release by hand:

+ Bump the grammar version with `npx tree-sitter version <version>`.
+ Update the version in `package-lock.json` with
  `npm install --package-lock-only --ignore-scripts`.
+ Regenerate the parser with `npx tree-sitter generate`, so that the version
  in `src/parser.c` matches. The workflow builds from the committed parser.
+ Commit the changes and tag the commit with `git tag -- v<version>`.
+ Push the commit and tag with `git push --tags origin main`.
+ The `publish.yml` GitHub workflow will take care of the rest.
