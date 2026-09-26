# Export formats: bundles and manifests

## Signed evidence bundle (`--bundle`)

A signed evidence bundle contains all events for a page observation along with a SHA-256 hash of the complete payload. The hash lets downstream consumers verify that the data hasn't been modified since export.

![Merkle tree verification](merkle-tree.svg)

```bash
refract export "Earth" --bundle > earth-bundle.json
```

The bundle wraps the event array in a signed envelope:

```json
{
  "pageTitle": "Earth",
  "observationTimestamp": "2025-05-15T10:00:00Z",
  "events": [ ... ],
  "hash": "a1b2c3d4e5f6..."
}
```

Use bundles when you need an audit trail — submitting evidence to a third party, archiving for later verification, or passing events across trust boundaries.

## Replay manifest (`--manifest`)

A replay manifest is a Merkle tree of event hashes that lets you verify the exact set of events without sending the full payload. Each event's hash is a leaf in the tree; the root hash represents the complete observation.

```bash
refract export "Earth" --manifest > earth-manifest.json
```

```json
{
  "pageTitle": "Earth",
  "merkleRoot": "abc...",
  "eventCount": 47,
  "leaves": [ "hash1", "hash2", ... ]
}
```

Use manifests when you need lightweight integrity verification — for example, checking whether an observation has changed without re-downloading all events. The `@refract-org/evidence-graph` package exports `createReplayManifest`, `buildMerkleTree`, `getMerkleProof`, and `verifyMerkleProof` for programmatic use.

## Verification bundle with Merkle proofs (`--proof`)

A verification bundle is a self-contained, offline-verifiable package designed for high-stakes audits, legal submissions, and investigative reporting. It bundles:

1. The replay manifest (input revision hashes, analyzer versions, and computed Merkle root).
2. The full structured event array.
3. Individual cryptographic Merkle inclusion proofs for every event in the trajectory.

```bash
refract export "Earth" --proof > earth-proof.json
```

```json
{
  "format": "refract-verification-bundle/v1",
  "exportedAt": "2026-09-26T00:00:00Z",
  "manifest": {
    "pageTitle": "Earth",
    "merkleRoot": "a3b4c5...",
    "manifestHash": "d6e7f8...",
    "inputRevisionHashes": [ ... ],
    "outputEventHashes": [ ... ]
  },
  "events": [ ... ],
  "proofs": [
    {
      "leafHash": "e1...",
      "leafIndex": 0,
      "siblings": [ ... ],
      "rootHash": "a3b4c5..."
    }
  ]
}
```

### Verifying a bundle and generating audit receipts

Anyone can verify the cryptographic chain of custody offline using the CLI without connecting to any external network or database:

```bash
# Verify integrity
refract verify earth-proof.json

# Generate an interactive HTML audit receipt
refract verify earth-proof.json --html receipt.html
```

The resulting `receipt.html` is a standalone, single-file certificate displaying the verification badges, Merkle tree root, and each verified event — ready to be attached as an exhibit or published alongside an investigative article.
