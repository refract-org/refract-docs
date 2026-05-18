# Agent instructions for refract-docs

Refract-docs is the public documentation site for the Refract project — an open-source deterministic observation engine for public revision histories.

## Repository structure

```
README.md                     # Landing page
AGENTS.md                     # This file
docs/
  index.md                    # Homepage
  quickstart.md               # Quick start guide
  concepts.md                 # Architecture concepts
  schema.md                   # Event schema reference
  cli.md                      # CLI command reference
  sdk.md                      # SDK / package reference
  boundary.md                 # What Refract is and is not
  tutorials/
    wikipedia-history.md      # Tutorial: Track Wikipedia changes
    fandom-canon.md           # Tutorial: Track Fandom canon changes
    citation-churn.md         # Tutorial: Monitor citation churn
    dispute-timeline.md       # Tutorial: Build a dispute timeline
```

## Documentation principles

- **Tagline**: "Refract answers: 'What changed?'"
- **Boundary statement**: "Refract does not decide what is true. Refract makes visible how public knowledge changes."
- **Open source framing**: "What changed?" for what Refract does. "Not included: Domain-specific decision judgment." for what Refract excludes.
- **Tone**: technical, neutral, precise. No marketing language.
- **CLI examples**: always use `refract` as the command name (`wikihistory` works as a backward-compat alias).

## Copy conventions

- Use `Refract` (capital R) as the project name. Always use `Refract`, never `Varia`.
- Reference packages as `@refract-org/<name>`.
- Reference the CLI as `refract` (`wikihistory` works as a backward-compat alias).
- Use `refract` as the command name in all code examples.
- Describe Refract as a deterministic observation engine.
- L1/L2/L3 references are legacy — prefer "deterministic" / "ground truth".

## Build

```bash
node build.mjs      # builds static HTML from docs/ → dist/
```
