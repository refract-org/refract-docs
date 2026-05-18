# Refract vs. Wikipedia's page history

If you're evaluating whether Refract is worth adopting, this page compares what you
get from Wikipedia's built-in tools vs. what Refract adds.

## Wikipedia's page history

| Capability | Wikipedia UI | Refract |
|---|---|---|
| **View a single revision diff** | Yes — click "prev" on any revision | Yes — every event carries `before`/`after` snapshots |
| **See who edited what** | Yes — username + timestamp per revision | No — Refract observes document change, not editor identity |
| **Find when a sentence first appeared** | Manual — search each revision sequentially | `refract claim "Page" --text "sentence"` → exact revision + timestamp |
| **Track a sentence across its entire lifecycle** | Manual — follow the page history | Automatic — first seen, modified, removed, reintroduced, all timestamped |
| **Detect citation swapping** | Manual — compare each diff's reference section | `citation_replaced` event — `before`/`after` show the old and new source |
| **Detect edit wars** | Manual — look for back-and-forth in history | `revert_detected` + `edit_cluster_detected` — automatic structural detection |
| **Correlate article edits with talk page discussion** | Manual — check Talk tab separately | `talk_page_correlated` — Refract checks 7 days before / 3 days after each edit |
| **Compare the same topic across language editions** | Manual — open each wiki separately | `refract diff` — cross-wiki comparison with z-score outlier detection |
| **Query with SQL** | No | DuckDB: `SELECT event_type, count(*) FROM 'events.jsonl' GROUP BY 1` |
| **Cryptographic audit trail** | No — screenshots are the only proof | `refract export --bundle` → Merkle root, reproducible by anyone |
| **Automated monitoring** | No — you check manually | `refract cron` + `refract watch` → Slack, email, webhook alerts |
| **AI agent integration** | No | `refract mcp` → Claude Code, Cursor, VS Code can call Refract tools directly |

## Refract vs. other tools

| Tool | What it does | Refract's difference |
|---|---|---|
| **Wikipedia API** | Raw revision data | Refract adds deterministic analysis, event typing, provenance metadata |
| **WikiWho** | Editor-level authorship attribution | Refract tracks claim lifecycle, not editor attribution. Different question. |
| **WhoColor / WikiBlame** | Visual diff highlighting | Refract structures the data for querying, not just viewing |
| **Wikimedia Enterprise** | Bulk API access, commercial licensing | Refract is open-source, deterministic, and runs locally |
| **Internet Archive** | Historical snapshots | Refract produces structured, queryable event streams, not page captures |
| **Custom scrapers** | Ad-hoc revision analysis | Refract has 26 event types, deterministic hashing, and a published SDK |

## What Refract deliberately doesn't do

| Capability | Why not |
|---|---|
| **Truth/fact-checking** | Refract observes change, not correctness. It answers "what changed?", not "is this true?" |
| **Sentiment analysis** | Refract doesn't judge editor intent or tone |
| **Editor scoring** | Refract tracks document change, not editor behavior |
| **Prediction** | Refract reports what happened, not what might happen |
| **Automated editing** | Refract is read-only observation |

## When to use Refract

- You need to **prove** when a claim appeared, not just screenshot it
- You're analyzing **patterns across many revisions** (citation churn, edit clusters, talk correlation)
- You need a **cryptographic audit trail** (Merkle-provable bundles)
- You want to **monitor pages automatically** (cron + notifications)
- You're building a **RAG pipeline** that needs claim stability signals
- You want **AI agents** to reason about page history with structured data

## Refract vs. AI evaluation tools

Refract's model evaluation capability — temporal leakage detection, provenance hallucination checking, retrieval quality scoring — has no direct competitor. Existing tools evaluate models on accuracy, safety, or reasoning. None evaluate models against deterministic ground truth about what was public knowledge and when.

| Capability | Existing tools | Refract |
|---|---|---|
| **Temporal leakage detection** | Heuristic: compare model output to training cutoff dates. No deterministic proof. | `refract_eval.build_leakage_benchmark()` — exact revision ID, timestamp, SHA-256 hash. Proves leakage deterministically. |
| **Provenance hallucination** | Manual: check model citations against sources one at a time. | `refract_eval.check_provenance()` — query citation_added/removed/replaced events. Classify: verified, outdated, hallucinated. |
| **Retrieval quality (stability-weighted)** | Embedding similarity only. Contested and stable passages score identically. | `refract_eval.score_retrieval_quality()` — each passage scored by revert count, citation churn, talk activity. |
| **Knowledge recency** | No standard tooling. Ad-hoc: "ask the model what date it thinks it is." | `refract snapshot "Page" --at <date>` — deterministic page state at any point. Compare model answer against ground truth. |
| **Standard benchmark** | No open benchmark for temporal ground truth. | `BENCHMARK.md` — 10 standard pages, submission format, reproducibility requirements. |
| **Reproducibility** | Most eval suites: "run our script, trust our numbers." | Every event has a deterministic SHA-256 hash. Reviewer runs same command, gets same hash. |

**The gap Refract fills**: every eval suite tests whether a model is *accurate*. None test whether a model *knows things it shouldn't*. Refract provides the ground truth for that test — and makes it reproducible.

## When Wikipedia's UI is enough

- You're checking **one revision diff** quickly
- You need to see **who** made an edit
- You're browsing page history casually

Refract doesn't replace Wikipedia's UI. It adds capabilities that the UI can't provide — deterministic reproducibility, SQL queryability, cryptographic verification, and automated monitoring.
