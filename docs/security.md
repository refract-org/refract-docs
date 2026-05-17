# Security

## Credential exposure

CLI flags containing credentials (`--api-key`, `--api-password`) are visible in process listings. Use environment variables instead:

| CLI flag | Environment variable |
|----------|---------------------|
| `--api-key` | `REFRACT_INFERENCE_API_KEY` |
| `--endpoint` | `REFRACT_INFERENCE_ENDPOINT` |
| `--model` | `REFRACT_INFERENCE_MODEL` |

## Local storage

When using `--cache`, revision content is persisted to `~/.wikihistory/refract.db` (SQLite). This file contains full wikitext from every revision fetched. On shared machines, set `--cache-dir` to an encrypted volume.

## Network

Refract makes outbound HTTPS requests to the configured MediaWiki API. Authentication tokens are sent as `Authorization` or `x-api-key` headers. All traffic is encrypted in transit.

Bundled evidence files (`--bundle`) are signed but not encrypted — they contain plaintext event data with a SHA-256 hash for integrity verification.

## Data retention

Cached revision data persists indefinitely in `~/.wikihistory/refract.db`. Clear it manually:

```bash
rm -rf ~/.wikihistory/
```

There is no automatic data retention policy. The cache only contains data you explicitly fetched.
