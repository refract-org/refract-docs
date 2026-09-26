# Python SDK

The official Python SDK for Refract — wraps the CLI via subprocess and provides typed dataclasses, pandas integration, and notebook support.

## Install

```bash
pip install git+https://github.com/refract-org/refract-py.git  # not on PyPI
```

Requires the Refract CLI (the SDK calls it via subprocess):

```bash
npm install -g @refract-org/cli
```

`npx @refract-org/cli` is used as a fallback if `refract` is not on PATH.

Until the next CLI release reaches npm (0.5.7 does not start — see
[installation](install.md)), point the SDK at a [source build](install.md#from-source):

```python
from refract import Refract

r = Refract(binary="/path/to/refract/packages/cli/dist/src/cli.js")  # run with node
```

## Quick start

```python
from refract import Refract

r = Refract()

# Analyze — get typed dataclasses
events = r.analyze("Bitcoin", depth="brief")
for event in events:
    print(event.eventType, event.timestamp)

# Export as pandas DataFrame
df = r.analyze("Bitcoin", depth="forensic", as_frame=True)
print(df.groupby("event_type").size())
```

## API reference

### `Refract`

The main client. No constructor arguments needed — it auto-detects the CLI.

```python
r = Refract()
```

### `analyze(page, depth, as_frame, flatten)`

Run a full page analysis. Returns `list[EvidenceEvent]` or `DataFrame` if `as_frame=True`.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `str` | required | Page title |
| `depth` | `str` | `"detailed"` | `"brief"`, `"detailed"`, or `"forensic"` |
| `as_frame` | `bool` | `False` | Return a pandas DataFrame |
| `flatten` | `bool` | `False` | Flatten nested provenance fields into flat columns |

```python
events = r.analyze("Climate_change", depth="forensic")
df = r.analyze("Climate_change", depth="forensic", as_frame=True, flatten=True)
```

### `claim(page, text, as_frame)`

Track a specific claim across all revisions.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `str` | required | Page title |
| `text` | `str` | required | Claim text to track (partial match) |
| `as_frame` | `bool` | `False` | Return a pandas DataFrame |

```python
lifecycle = r.claim("Bitcoin", "decentralized")
print(lifecycle.status, lifecycle.first_seen)
```

### `export(page, format, flatten, as_frame)`

Export analysis to a file or DataFrame.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `str` | required | Page title |
| `format` | `str` | `"ndjson"` | `"json"`, `"ndjson"`, `"csv"` |
| `flatten` | `bool` | `False` | Flatten nested fields |
| `as_frame` | `bool` | `False` | Return a pandas DataFrame |

```python
df = r.export("Bitcoin", format="ndjson", flatten=True, as_frame=True)
```

### `EvidenceEvent` dataclass

```python
@dataclass
class EvidenceEvent:
    eventType: str
    fromRevisionId: int
    toRevisionId: int
    section: str
    before: str
    after: str
    timestamp: str
    eventId: str = ""
    claimId: str = ""
    layer: str = ""
    deterministicFacts: list[DeterministicFact] = field(default_factory=list)
```

## Integrations

### pandas & polars

Methods accept `as_frame=True` for a pandas DataFrame, or `as_polars=True` for a high-performance polars DataFrame with flattened provenance fields:

```python
# pandas
df_pandas = r.analyze("Bitcoin", depth="forensic", as_frame=True)

# polars
df_polars = r.analyze("Bitcoin", depth="forensic", as_polars=True)
print(df_polars.group_by("event_type").len())
```

### Survival & Duration Analysis (`compute_survival_records`)

For empirical studies measuring claim persistence, qualifier erosion, or institutional lag duration:

```python
from refract import compute_survival_records

events = r.analyze("Quantum_computing", depth="detailed")
survival_data = compute_survival_records(events)

# Returns structured duration records with right-censoring flags:
# [
#   {
#     "statement_key": "Lead::Quantum computers use superposition...",
#     "section": "Lead",
#     "start_time": "2020-01-01T00:00:00Z",
#     "end_time": "2022-06-15T00:00:00Z",
#     "duration_days": 896.0,
#     "event_observed": 1
#   },
#   ...
# ]
```

### NetworkX (`to_networkx`)

Export citation references and revision transitions into a directed graph for network analysis, community detection, or centrality calculations:

```python
from refract import to_networkx

events = r.analyze("Artificial_intelligence", depth="forensic")
G = to_networkx(events)

import networkx as nx
print(f"Nodes: {G.number_of_nodes()}, Edges: {G.number_of_edges()}")
```

### LangChain

`refract_langchain.py` loads events as `Document` objects with stability metadata for provenance-aware RAG:

```python
from refract_langchain import RefractLoader

loader = RefractLoader(page="Bitcoin", depth="forensic")
documents = loader.load()

for doc in documents:
    print(doc.metadata["event_type"], doc.metadata["stability_score"])
```

### Jupyter / Marimo

Combine with `pandas` and `matplotlib` or `altair` for interactive exploration:

```python
df = r.analyze("Bitcoin", depth="forensic", as_frame=True, flatten=True)
citations = df[df["event_type"].str.startswith("citation_")]
citations.groupby("event_type").size().plot(kind="bar")
```

## Domain boundary

This SDK wraps the Refract CLI. It does not add model logic, interpretation, or domain-specific judgment. It provides typed Python access to deterministic observation output.

## Source

[github.com/refract-org/refract-py](https://github.com/refract-org/refract-py)
