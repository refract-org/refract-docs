# Refract: deterministic ground truth for model evaluation

**Refract reveals how claims change across public revision histories — and gives AI researchers reproducible evidence for model evaluation.**

```bash
npx @refract-org/cli analyze "Earth" --depth brief
```

<div class="hero-links">
  <a href="demo/" class="button primary">&#9654; Live Demo</a>
  <a href="quickstart/" class="button secondary">Quick Start</a>
</div>

Node.js 20+ or Bun 1.2+ · Git 2.x · Any MediaWiki instance

The printing press froze knowledge in editions. Wikipedia made it mutable. Refract makes the mutation legible — a deterministic event stream showing where every claim came from, what changed, what supported it, what challenged it, when it stabilized, and what context altered its meaning.

## Why Refract?

| | |
|---|---|
| 🔍 **Deterministic** — Same input, same output. Every run byte-for-byte identical. No model, no variance. | ⚙️ **Provenance-tagged** — Every event carries revision, section, timestamp, and analyzer identity. |
| 🔐 **Configurable heuristics** — Every threshold is a BYO-inference boundary. Plug a model where you need one; the defaults work offline. | 📊 **26 event types** — Sentence lifecycle, citations, templates, reverts, sections, categories, wikilinks, talk pages, clusters, protection changes. |
| 🔧 **Merkle-provable** — Signed bundles and replay manifests for audit trail integrity. | 🧩 **Pluggable architecture** — Swap analyzers and storage without changing the core pipeline. |
| 🤖 **AI agent integration** — Built-in MCP server. Claude Code, Cursor, VS Code call Refract tools directly. | |

## Quick start

```bash
# 1. Install (zero install also works via npx)
npx @refract-org/cli analyze "Earth" --depth brief

# 2. Explore results in the web UI
refract explore "Earth"

# 3. Connect an AI agent
refract mcp

# 4. Export as structured data
refract export "Earth" --format ndjson > earth-events.jsonl

# 5. Save as a signed evidence bundle
refract export "Earth" --bundle > earth-bundle.json

# 5. Output an ObservationReport with claim lifecycle
refract analyze "Earth" --report > earth-report.json
```

## What Refract does not do

- No model interpretation — semantic analysis of what a change means is handled by downstream systems
- No truth claims — Refract reports what changed, not whether the change is accurate
- No prediction, sentiment analysis, or editor scoring
- No claims about compliance, policy violations, or decision relevance

## By use case

| You are | Start here |
|---------|-----------|
| **Journalist or researcher** | [Live Demo](demo.md) → [Quick Start](quickstart.md) → [Wikipedia history](tutorials/wikipedia-history.md) |
| **Historian or fact-checker** | [Combat revisionism](tutorials/combating-revisionism.md) → [Event taxonomy](events.md) → [Bundle formats](bundle-manifest.md) |
| **Data scientist or OSINT analyst** | [Python SDK](tutorials/python-sdk.md) → [Analytics with DuckDB](analytics.md) → [Notebook analysis](notebooks.md) |
| **ML engineer building RAG** | [RAG provenance](tutorials/rag-provenance.md) → [Python SDK](tutorials/python-sdk.md) → [BYO-inference](tutorials/byo-inference.md) |
| **Regulatory or policy monitor** | [Scheduled monitoring](tutorials/scheduled-monitoring.md) → [CLI cron](cli.md) → [Citation churn](tutorials/citation-churn.md) |
| **AI agent developer** | [MCP agent tutorial](tutorials/mcp-agent.md) → [MCP reference](mcp.md) → [BYO-inference](tutorials/byo-inference.md) |
| **AI model evaluator** | [Model evaluation tutorial](tutorials/model-evaluation.md) → [RAG provenance](tutorials/rag-provenance.md) → [Frontier use cases](frontier-use-cases.md) |
| **System integrator** | [SDK reference](sdk.md) → [Production DDL](downstream.md) → [Private wikis](tutorials/private-wiki.md) |
| **Developer / contributor** | [Build a custom analyzer](tutorials/custom-analyzer.md) → [Custom eval labels](tutorials/custom-eval.md) → [Architecture decisions](architecture-decisions.md) |

## What's possible

Refract's deterministic event stream unlocks capabilities that go beyond observation.
These aren't tutorials — they're the frontier of what the architecture enables.

| Capability | Read |
|---|---|
| **Temporal leakage & recency** | [Model evaluation tutorial](tutorials/model-evaluation.md) — Test models against knowledge cutoffs. Prove leakage deterministically. Compare recency across frontier models. |
| **Provenance-aware RAG** | [RAG provenance tutorial](tutorials/rag-provenance.md) — Score claims by stability. Filter training data. Weight retrieval by source quality. |
| **BYO-inference at every boundary** | [BYO-inference tutorial](tutorials/byo-inference.md) — Replace heuristics with LLMs. Audit which path was taken. |
| **Claim-level search** | [Frontier use cases](frontier-use-cases.md) — Search claim histories, not documents. "Claims removed as unsourced." "Claims that softened after events." |
| **Temporal leakage detection** | [Frontier use cases](frontier-use-cases.md#ai-evaluation--temporal-leakage-detection) — Was this claim public before the model's knowledge cutoff? |
| **LLM summarization** | [Summarization tutorial](tutorials/summarization.md) — Pipe events through any model. Get human-readable change reports with audit trail. |
| **Non-Wikipedia sources** | [Custom adapter tutorial](tutorials/custom-adapter.md) — Confluence, GitHub wikis, Notion. Same analyzers, different data. |
| **Streaming and Parquet** | [Frontier use cases](frontier-use-cases.md) — Live ingestion, columnar export, HuggingFace datasets. |

## Contents

### Getting Started
- [Why Refract](why-refract.md) — [Compare to alternatives](compare.md)
- [Install](install.md) — [Concepts](concepts.md)
- [Common events](quickstart-events.md) — [Complete workflow](complete-workflow.md)

### Reference
- [CLI command reference](cli.md) — [SDK / package reference](sdk.md)
- [Event schema](schema.md) — [Event taxonomy](events.md)
- [Analysis depth levels](depth.md) — [Export formats](bundle-manifest.md)
- [Evaluation harness](eval.md) — [Architecture decisions](architecture-decisions.md)

### Integration
- [Integrations overview](integrations.md) — all supported tools and patterns
- [Downstream integration](downstream.md) — [MCP: AI agent integration](mcp.md)
- [Analytics with DuckDB](analytics.md) — [Notebook analysis](notebooks.md)
- [Scheduled monitoring](cron.md)

### Tutorials
- [Wikipedia history](tutorials/wikipedia-history.md) — [Fandom canon](tutorials/fandom-canon.md)
- [Citation churn](tutorials/citation-churn.md) — [Dispute timeline](tutorials/dispute-timeline.md)
- [Cross-wiki comparison](tutorials/cross-wiki-diff.md) — [Combat revisionism](tutorials/combating-revisionism.md)
- [RAG provenance](tutorials/rag-provenance.md) — [MCP agent](tutorials/mcp-agent.md)
- [Scheduled monitoring](tutorials/scheduled-monitoring.md) — [Python SDK](tutorials/python-sdk.md)
- [BYO-inference](tutorials/byo-inference.md) — [Custom analyzer](tutorials/custom-analyzer.md)
- [Custom eval labels](tutorials/custom-eval.md) — [Private wikis](tutorials/private-wiki.md)
- [Non-English wikis](tutorials/non-english.md) — [Summarization](tutorials/summarization.md)
- [Custom adapter](tutorials/custom-adapter.md) — [Model evaluation](tutorials/model-evaluation.md)

### Appendix
- [Glossary](glossary.md) — [Troubleshooting / FAQ](faq.md)
- [Interpreting output](interpretation.md) — [Security](security.md)
- [Naming conventions](naming.md) — [Boundary](boundary.md)
- [Contributing to docs](contributing-docs.md)

## License

AGPL-3.0. Built and maintained by [NextConsensus](https://nextconsensus.com).
