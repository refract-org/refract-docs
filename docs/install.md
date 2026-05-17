# Installation

## System requirements

- **Node.js** 20+ or **Bun** v1.2+
- **macOS** or **Linux** (Windows not yet supported)

## Zero install (recommended)

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
```

## Verify installation

```bash
refract --version
```
