# refract-docs — Copilot Instructions

Documentation site for the Refract ecosystem. Static HTML from markdown sources.

## Quick Commands

```bash
npm install && npm run build   # Build static HTML
npm run lint                    # Biome check
npm run test                    # Vitest (verifies build)
```

## Key Paths

- `docs/` — Documentation source
- `static/` — Static assets
- `build.mjs` — Static site generator

## Conventions

- **Package manager:** npm
- **Linter/Formatter:** Biome
- **Tests:** Vitest
- **Pre-commit:** Husky runs Biome on staged files
- **CI:** CI + deploy
- **Commit style:** Conventional Commits

## Pre-Commit Rule

```bash
npm run lint   # Run before pushing.
```
