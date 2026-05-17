# Troubleshooting / FAQ

## Rate limits

Refract respects the MediaWiki API's `maxlag` parameter and backs off automatically. If you see `429 Too Many Requests`, wait a few minutes before retrying. Use `-c` / `--cache` to avoid re-fetching pages you've already analyzed.

## "Page too large" errors

Wikipedia pages with thousands of revisions may exceed the default fetch limit. Use `--from <revId> --to <revId>` to scope to a specific range, or increase depth gradually:

```bash
# Start with the last 50 revisions
refract analyze "Earth" --from <recent-rev-id>
```

## Authentication errors

| Error | Likely cause | Fix |
|-------|-------------|-----|
| `401 Unauthorized` | Missing or invalid `--api-key` | Check the API token is correct |
| `403 Forbidden` | Token lacks permission | Verify token scope with wiki admin |
| Connection refused | Wrong API URL | Ensure URL ends in `/api.php` |

## Private wikis

For private or authenticated MediaWiki instances, provide credentials:

```bash
refract analyze "Page" \
  --api https://internal.wiki/api.php \
  --api-key <token>
```

Supported auth methods: bearer token (`--api-key`), basic auth (`--api-user` + `--api-password`), OAuth2.

## Cache issues

If results seem stale, clear the cache:

```bash
rm -rf ~/.wikihistory/
```

Or use `--cache-dir` to point at a fresh location. The default cache directory is `~/.wikihistory/`.

## No events produced

If `refract analyze` returns no events, the page may not have changed in the requested revision range. Try expanding the range or removing `--from`/`--to` to fetch the most recent revisions.

## Cross-wiki diff returns no results

`refract diff` compares a topic across two MediaWiki instances. Each wiki must have a page with the given title. Verify:

```bash
refract analyze "Topic" --api <wiki-a-url>
refract analyze "Topic" --api <wiki-b-url>
```

## Performance and scaling

### How many revisions per page?

`brief` depth (section differ only) processes ~50 revisions per second. `detailed`
depth (all standard analyzers) processes ~20 revisions per second. `forensic` depth
(with talk page correlation and edit cluster detection) processes ~10 revisions per
second. These are single-core measurements on an M-series Mac; results scale linearly
with additional pages (Refract processes pages sequentially).

### Memory usage

Memory is proportional to revision count, not revision size. Each revision's wikitext
is held in memory during diff comparison, then discarded. A page with 500 revisions at
`detailed` depth uses ~200 MB peak memory. For very large pages (5,000+ revisions),
use `--from` / `--to` to paginate into batches of ~500 revisions.

### When to paginate

Use `--from` / `--to` or `--since` when:
- The page has more than 1,000 revisions
- You need faster processing (narrower ranges process faster)
- You're running on a resource-constrained machine
- You want to process the page in parallel across multiple ranges

For batch processing many pages, use `--pages-file`:

```bash
refract analyze --pages-file topics.txt --depth detailed -c
```

### Cache behavior

The cache stores fetched revisions in `~/.wikihistory/` (default: `~/.wikihistory/refract.db`). Each revision costs
~2–10 KB of disk space. A page with 500 revisions uses ~5 MB of cache. The cache is
persistent — clear it with `rm -rf ~/.wikihistory/` when disk space is tight.

### API rate limits

Wikipedia enforces `maxlag` (default: 5 seconds). Refract respects this and backs off
automatically. Expect ~5–10 requests per second to Wikipedia. For non-Wikipedia
MediaWiki instances, rate limits vary. If you hit 429 errors consistently, increase
poll intervals or contact the wiki's administrator.
