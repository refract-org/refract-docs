# Refract Docs

Public documentation for [Refract](https://github.com/refract-org/refract), a deterministic observation engine for public revision histories.

---

**Live at:** [refract-org.github.io/refract-docs](https://refract-org.github.io/refract-docs/)

## Quick start

```bash
# From the next release; until then build from source (see Project status)
npx @refract-org/cli analyze "Earth" --depth brief
```

See [quickstart](https://refract-org.github.io/refract-docs/quickstart/) for a full walkthrough.

## Packages

| Package | Status | License | Description |
|---|---|---|---|
| `@refract-org/evidence-graph` | [![npm](https://img.shields.io/npm/v/@refract-org/evidence-graph)](https://www.npmjs.com/package/@refract-org/evidence-graph) | CC0-1.0 | Core types, schemas, BYO-inference boundaries |
| `@refract-org/ingestion` | [![npm](https://img.shields.io/npm/v/@refract-org/ingestion)](https://www.npmjs.com/package/@refract-org/ingestion) | AGPL-3.0 | Wikimedia API adapters |
| `@refract-org/analyzers` | [![npm](https://img.shields.io/npm/v/@refract-org/analyzers)](https://www.npmjs.com/package/@refract-org/analyzers) | AGPL-3.0 | Deterministic analyzers |
| `@refract-org/cli` | [![npm](https://img.shields.io/npm/v/@refract-org/cli)](https://www.npmjs.com/package/@refract-org/cli) | AGPL-3.0 | CLI tool (`refract` / `wikihistory`) |
| `@refract-org/mcp` | Not published | AGPL-3.0 | MCP tool definitions and server; the executable is `refract mcp` in `@refract-org/cli` |
| `@refract-org/eval` | [![npm](https://img.shields.io/npm/v/@refract-org/eval)](https://www.npmjs.com/package/@refract-org/eval) | AGPL-3.0 | Evaluation harness |
| `@refract-org/persistence` | Not published | AGPL-3.0 | SQLite storage |
| Observable recipe | — | — | [Copy-paste pattern](./docs/sdk.md#observable-framework-data-loader) for Observable Framework data loaders |

## Project status

Refract is actively developed by [NextConsensus](https://nextconsensus.com). The newest CLI on npm, 0.5.7, does not start — it was published against library code that never reached npm — so until the next release, [build from source](docs/install.md#from-source). The library packages on npm install and import normally.

## License

CC-BY-4.0
