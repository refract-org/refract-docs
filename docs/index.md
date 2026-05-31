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

<div class="features-grid">
  <div class="feature-card">
    <div class="feature-icon">🔍</div>
    <h3>Deterministic</h3>
    <p>Same input, same output. Every run byte-for-byte identical. No model, no variance.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">⚙️</div>
    <h3>Provenance-tagged</h3>
    <p>Every event carries revision, section, timestamp, and analyzer identity.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🔐</div>
    <h3>BYO-Inference Boundaries</h3>
    <p>Every threshold is a configurable boundary. Plug a model where you need one; defaults run offline.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">📊</div>
    <h3>26 Event Types</h3>
    <p>Sentence lifecycles, citations, reverts, talk pages, protection levels, and edit clusters.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🔧</div>
    <h3>Merkle-provable</h3>
    <p>Signed bundles and replay manifests for audit trail and dataset integrity.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🤖</div>
    <h3>AI Agent Integration</h3>
    <p>Built-in MCP server. Claude Code, Cursor, and VS Code call Refract tools natively.</p>
  </div>
</div>

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

<div class="split-columns">
  <div class="column-card focus">
    <h4>What Refract Is</h4>
    <ul>
      <li><strong>Deterministic:</strong> Guarantees same output for same input, offline.</li>
      <li><strong>Provenance-tagged:</strong> Identifies source revision, timestamp, and analyzer version.</li>
      <li><strong>Verifiable:</strong> Cryptographically proves claims using Merkle tree envelopes.</li>
      <li><strong>Open Layer:</strong> A raw observation feed designed for downstream processing.</li>
    </ul>
  </div>
  <div class="column-card out-of-scope">
    <h4>What Refract is Not</h4>
    <ul>
      <li><strong>No Model Interpretation:</strong> Does not decide semantic meaning or intent.</li>
      <li><strong>No Truth Claims:</strong> Observes <em>what</em> changed, not <em>which</em> version is correct.</li>
      <li><strong>No Editor Profiles:</strong> Does not rank, grade, score, or track editors.</li>
      <li><strong>No Policy Judgments:</strong> Leaves decision relevance and rules to downstream tools.</li>
    </ul>
  </div>
</div>

## By use case

<div class="usecase-grid">
  <div class="usecase-card">
    <div class="usecase-badge">Research</div>
    <h3>Journalist / Researcher</h3>
    <p>Trace claim evolution and sources across revision history.</p>
    <div class="usecase-steps">
      <a href="demo/">Demo</a> ➔ <a href="quickstart/">Quick Start</a> ➔ <a href="tutorials/wikipedia-history/">Wikipedia History</a>
    </div>
  </div>
  <div class="usecase-card">
    <div class="usecase-badge">Data Science</div>
    <h3>Data Scientist / OSINT</h3>
    <p>Extract NDJSON events and run columnar SQL analysis in DuckDB.</p>
    <div class="usecase-steps">
      <a href="tutorials/python-sdk/">Python SDK</a> ➔ <a href="analytics/">DuckDB</a> ➔ <a href="notebooks/">Notebooks</a>
    </div>
  </div>
  <div class="usecase-card">
    <div class="usecase-badge">Engineering</div>
    <h3>ML / RAG Engineer</h3>
    <p>Score retrieved texts by stability and provenance quality indicators.</p>
    <div class="usecase-steps">
      <a href="tutorials/rag-provenance/">RAG Provenance</a> ➔ <a href="tutorials/python-sdk/">Python SDK</a> ➔ <a href="tutorials/byo-inference/">BYO-Inference</a>
    </div>
  </div>
  <div class="usecase-card">
    <div class="usecase-badge">Automation</div>
    <h3>Policy / Compliance</h3>
    <p>Monitor pages on schedules, test documentation, and send webhooks.</p>
    <div class="usecase-steps">
      <a href="tutorials/scheduled-monitoring/">Monitoring</a> ➔ <a href="cli/">CLI Cron</a> ➔ <a href="tutorials/citation-churn/">Citation Churn</a>
    </div>
  </div>
  <div class="usecase-card">
    <div class="usecase-badge">Agents</div>
    <h3>AI Agent Developer</h3>
    <p>Expose CLI events natively to agents using the built-in MCP server.</p>
    <div class="usecase-steps">
      <a href="tutorials/mcp-agent/">MCP Tutorial</a> ➔ <a href="mcp/">MCP Reference</a> ➔ <a href="tutorials/byo-inference/">BYO-Inference</a>
    </div>
  </div>
  <div class="usecase-card">
    <div class="usecase-badge">Evaluation</div>
    <h3>AI Model Evaluator</h3>
    <p>Prove temporal leakage and recency cutoffs against revision histories.</p>
    <div class="usecase-steps">
      <a href="tutorials/model-evaluation/">Model Eval</a> ➔ <a href="tutorials/rag-provenance/">RAG Provenance</a> ➔ <a href="frontier-use-cases/">Frontier Cases</a>
    </div>
  </div>
</div>

<p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 1rem;">
  <strong>Other pathways:</strong> 
  System Integrators (<a href="sdk/">SDK Reference</a> · <a href="downstream/">Production DDL</a> · <a href="tutorials/private-wiki/">Private Wikis</a>) · 
  Engine Contributors (<a href="tutorials/custom-analyzer/">Custom Analyzer</a> · <a href="tutorials/custom-eval/">Custom Eval</a> · <a href="architecture-decisions/">Architecture Decisions</a>)
</p>

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
- [Refract UI](tutorials/refract-ui.md) — [Custom adapter](tutorials/custom-adapter.md) — [Model evaluation](tutorials/model-evaluation.md)

### Appendix
- [Glossary](glossary.md) — [Troubleshooting / FAQ](faq.md)
- [Interpreting output](interpretation.md) — [Security](security.md)
- [Naming conventions](naming.md) — [Boundary](boundary.md)
- [Contributing to docs](contributing-docs.md)

## License

AGPL-3.0. Built and maintained by [NextConsensus](https://nextconsensus.com).
