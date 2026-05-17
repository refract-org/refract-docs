# SDK / package reference

## Overview

Refract's SDK is a set of packages that compose into a pipeline: ingest → analyze → persist.

![Package dependency graph](packages.svg)

Packages are published on npm under the `@refract-org` scope. All packages are ESM-only and written in TypeScript.

## Basic pipeline

```typescript
import { MediaWikiClient } from "@refract-org/ingestion";
import { sectionDiffer, citationTracker } from "@refract-org/analyzers";
import type { EvidenceEvent } from "@refract-org/evidence-graph";

const client = new MediaWikiClient({ apiUrl: "https://en.wikipedia.org/w/api.php" });
const revisions = await client.fetchRevisions("Earth");

const events: EvidenceEvent[] = [];
for (let i = 1; i < revisions.length; i++) {
  events.push(...sectionDiffer.diffSections(
    sectionDiffer.extractSections(revisions[i - 1].content),
    sectionDiffer.extractSections(revisions[i].content),
  ));
  events.push(...citationTracker.diffCitations(
    citationTracker.extractCitations(revisions[i - 1].content),
    citationTracker.extractCitations(revisions[i].content),
  ));
}
```

## Storage

```typescript
import { Persistence } from "@refract-org/persistence";

const db = new Persistence({ dbPath: "refract.db" });
await db.insertEvents(events);
const saved = await db.getEvents({ pageTitle: "Earth" });
```

## Package reference

### `@refract-org/evidence-graph`

Core types, event schemas, and utilities. Zero runtime dependencies.

```typescript
import type { EvidenceEvent, EventType, Revision, ClaimLedger, ClaimLedgerEntry, ObservationReport } from "@refract-org/evidence-graph";
import { createClaimIdentity, createEventIdentity } from "@refract-org/evidence-graph";
```

`EventType` now includes `sentence_modified` (26 event types total).

Key exports:
- Interfaces: `EvidenceEvent`, `Revision`, `DeterministicFact`, `ModelInterpretation`, `ClaimLedger`, `ClaimLedgerEntry`, `ObservationReport`
- Types: `EventType`, `EvidenceLayer`, `PolicyDimension`, `Depth`, `AnalyzerConfig`
- Utilities: `createClaimIdentity`, `createEventIdentity`
- Merkle tree: `createReplayManifest`, `buildMerkleTree`, `getMerkleProof`, `verifyMerkleProof`
- `AnalyzerConfig`: configurable thresholds and windows for analyzers — similarity threshold for sentence matching, time windows for clusters and talk correlation, revert patterns, spike factors. Consumers pass their own config at each boundary; Refract records the effective parameters in `FactProvenance.parameters`.
- `DEFAULT_ANALYZER_CONFIG`: frozen default values for all configurable parameters
- `FactProvenance.parameters`: optional record of analyzer parameters (strings, numbers, booleans) — set when non-default config is used, enabling transparent provenance

No prompt engineering, no interpretation schema — consumers define their own taxonomy at each configurable boundary.

### `@refract-org/ingestion`

Wikimedia API adapters. Fetches revision history and parses wikitext.

```typescript
import { MediaWikiClient } from "@refract-org/ingestion";
import type { RevisionFetcher, AuthConfig } from "@refract-org/ingestion";

const client = new MediaWikiClient({ apiUrl: "https://en.wikipedia.org/w/api.php" });
const revisions = await client.fetchRevisions("Earth");
```

Key exports: `MediaWikiClient` (class), `RevisionFetcher` (interface), `AuthConfig`

**Wikidata entity mapping** (new):

```typescript
import { fetchWikidataId, mapPageToEntity, mapPagesToEntities } from "@refract-org/ingestion";
import type { PageToEntityMap, WikidataEntity, WikidataClaim } from "@refract-org/ingestion";

const qid = await fetchWikidataId("Douglas_Adams"); // "Q42"
const mapping = await mapPageToEntity("Douglas_Adams"); // { pageTitle, qid, entity }
```

Key exports: `fetchWikidataId`, `fetchWikidataEntity`, `mapPageToEntity`, `mapPagesToEntities`, `wikidataEntityToEvents`

### `@refract-org/analyzers`

Deterministic analyzers for section diffs, citation tracking, revert detection, and template analysis. Exported as lowercase singleton instances — no construction needed.

```typescript
import { sectionDiffer, citationTracker, revertDetector, templateTracker } from "@refract-org/analyzers";
import type { SectionDiffer, CitationTracker, RevertDetector, TemplateTracker } from "@refract-org/analyzers";
```

All analyzers share a common pattern — extract from wikitext, diff across revisions, produce `EvidenceEvent` arrays. Every analyzer accepts an optional `AnalyzerConfig` — thresholds, patterns, and windows that can be tuned per domain. The effective config is recorded in each event's `FactProvenance.parameters` when non-default values are used.

```typescript
import { sectionDiffer, citationTracker, revertDetector, templateTracker, detectEditClusters } from "@refract-org/analyzers";
import type { SectionDiffer, CitationTracker, RevertDetector, TemplateTracker } from "@refract-org/analyzers";
import type { AnalyzerConfig } from "@refract-org/evidence-graph";

// Configure per-domain thresholds
const config: AnalyzerConfig = {
  section: { similarityThreshold: 0.8 },
  editCluster: { windowMs: 30 * 60 * 1000, minSize: 2 },
};

// Pass alongside standard calls
const changes = sectionDiffer.diffSections(before, after, config.section);
```

Key exports:
- Instances: `sectionDiffer`, `citationTracker`, `revertDetector`, `templateTracker`, `protectionTracker`
- Builders: `buildSectionLineage`, `buildSourceLineage`, `buildClaimLineage`, `buildWikilinkEvents`, `buildPageMoveEvents`, `buildTalkThreadEvents`, `buildCategoryEvents`, `buildParamChangeEvents`
- Classifiers: `classifyHeuristic`
- Parsers: `sanitizeWikitext`, `extractHeadingMap`, `extractWikilinks`, `extractCategories`, `countCitations`, `countKeywordMentions`, `deriveSectionHeading`
- Cross-revision: `correlateTalkRevisions`, `diffObservations`, `parseTalkThreads`, `diffTalkThreads`, `diffTemplateParams`, `diffCategories`, `diffWikilinks`
- Clusters & activity: `detectEditClusters`, `detectTalkActivitySpikes`

### `@refract-org/cli`

The `refract` / `wikihistory` CLI tool (10 commands: analyze, claim, cron, diff, eval, explore, export, mcp, visualize, watch). See [CLI reference](./cli).

### `@refract-org/persistence`

SQLite storage adapter (uses `bun:sqlite`).

```typescript
import { Persistence } from "@refract-org/persistence";

const db = new Persistence({ dbPath: "refract.db" });
await db.insertEvents(events);
const events = await db.getEvents({ pageTitle: "Earth" });
```

Key exports: `Persistence` (class), `PersistenceAdapter` (interface), `PersistenceConfig`

### `@refract-org/observable`

Observable Framework data loader for embedding Refract queries in Observable dashboards.

```typescript
import { RefractDataLoader } from "@refract-org/observable";
```

This package is designed for use with [Observable Framework](https://observablehq.com/framework/) data loaders. It is not published to npm — use from source or copy the loader pattern directly.

---

### `@refract-org/eval`

Evaluation harness for measuring analyzer accuracy against ground truth labels.

```typescript
import { createEvalHarness, validateAgainstGroundTruth } from "@refract-org/eval";
```

Key exports: `createEvalHarness`, `validateAgainstGroundTruth`, `EvalHarness`, `GROUND_TRUTH_LABELS`, `getGroundTruthById`, `getGroundTruthForPage`
