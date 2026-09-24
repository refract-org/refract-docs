# Installation

## System requirements

- **Node.js** 20+ or **Bun** v1.2+
- **macOS** or **Linux** (Windows not yet supported)
- **Bun and a source checkout** for SQLite persistence (`--cache`): it needs `@refract-org/persistence`, which uses `bun:sqlite` and is not published to npm. Analysis-only workflows work with Node.js.

> **npm status, 2026-09-24.** `@refract-org/cli@0.5.7`, the newest CLI on npm, does
> not start: it was published against analyzer and ingestion code that never
> reached npm, so every command below except [from source](#from-source) fails with
> an import error until the next release is published. The library packages
> (`@refract-org/evidence-graph`, `@refract-org/ingestion`, `@refract-org/analyzers`)
> install and import normally. The release pipeline now checks that a release
> installs and runs before it publishes (refract-org/refract#23).

## Zero install

No download needed — runs directly from npm:

```bash
npx @refract-org/cli analyze "Earth" --depth brief
```

With bun (if installed):

```bash
bunx @refract-org/cli analyze "Earth" --depth brief
```

## Local install

```bash
# with bun
bun add -g @refract-org/cli

# with npm
npm install -g @refract-org/cli
```

Then use the `refract` command directly (or `wikihistory` as an alias):

```bash
refract analyze "Earth" --depth brief
```

## From source

```bash
git clone https://github.com/refract-org/refract.git
cd refract
bun install
bun run build
node packages/cli/dist/src/cli.js --version
```

Run the CLI as `node packages/cli/dist/src/cli.js <command>`, or put it on your
`PATH` with `bun link` inside `packages/cli`.

## Verify installation

```bash
refract --version
```

A version number means the CLI started. On npm's 0.5.7 this fails with
`SyntaxError: The requested module '@refract-org/analyzers' does not provide an
export named …` — see the status note above.
