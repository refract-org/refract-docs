# Tutorial: Scheduled monitoring with cron, watch, and notifications

## Goal

Set up Refract to re-observe Wikipedia pages on a schedule, detect when claims change,
and notify you via Slack, email, or webhook. Catch citation removal, template disputes,
and section reorganization as they happen — not when someone notices.

## Two monitoring modes

| Mode | How it works | Use when |
|---|---|---|
| `refract cron` | One-shot re-observation for cron scheduling | Batch monitoring of many pages on a fixed schedule |
| `refract watch` | Live polling daemon for a single page/section | Real-time monitoring of a specific page |

## Step 1: Create your pages file

List the pages you want to monitor, one per line:

```bash
cat > watch-pages.txt << EOF
COVID-19
SARS-CoV-2
COVID-19_pandemic
COVID-19_vaccine
mRNA_vaccine
EOF
```

Pages can be any valid MediaWiki page title. Use underscores for spaces.

## Step 2: Run a one-shot re-observation

```bash
refract cron watch-pages.txt --interval 24
```

This re-observes every page in the file, fetching revisions from the last 24 hours
(since the last observation). Pages with no new revisions are skipped. Pages with new
revisions are analyzed and events are emitted.

Use `-c` to cache revisions and avoid re-fetching:

```bash
refract cron watch-pages.txt --interval 24 -c
```

The cache stores revision content in `~/.wikihistory/refract.db`. Subsequent runs only
fetch new revisions.

## Step 3: Schedule it with cron

Add to your crontab:

```bash
# Run every 6 hours
0 */6 * * * refract cron /path/to/watch-pages.txt --interval 6 -c
```

Or with GitHub Actions:

```yaml
name: Refract Monitor
on:
  schedule:
    - cron: '0 */6 * * *'
jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun add -g @refract-org/cli
      - run: refract cron watch-pages.txt --interval 6 -c
```

Refract respects MediaWiki rate limits automatically (maxlag backoff). No additional
configuration needed.

## Step 4: Set up notifications

### Slack

```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."

refract cron watch-pages.txt --interval 24 --notify-slack
```

Refract POSTs a summary to the webhook when new events are detected:

```
Refract detected 12 new events on 3 pages:
- COVID-19: 2 citation_removed, 1 template_added (NPOV)
- mRNA_vaccine: 4 sentence_modified, 1 citation_replaced
- SARS-CoV-2: 3 revert_detected, 1 edit_cluster_detected
```

### Email

```bash
export SMTP_HOST="smtp.example.com"
export SMTP_PORT="587"
export SMTP_USER="alerts@example.com"
export SMTP_PASS="your-password"
export NOTIFY_EMAIL_TO="researcher@example.com"

refract cron watch-pages.txt --interval 24 --notify-email
```

### Webhook

```bash
refract cron watch-pages.txt --interval 24 --notify-webhook https://your-server.com/hooks/refract
```

Refract POSTs a JSON payload with event summaries. Integrate with PagerDuty, Opsgenie,
or any webhook consumer.

## Step 5: Live polling with watch

For real-time monitoring of a single page:

```bash
refract watch "COVID-19" --interval 60000
```

Polls every 60 seconds for new revisions. When a new revision appears, Refract analyzes
it and emits events. Combine with Unix pipes for custom notification:

```bash
refract watch "COVID-19" --section "Vaccine safety" | while read event; do
  if echo "$event" | grep -q "citation_removed"; then
    echo "⚠️ Citation removed from COVID-19 Vaccine safety section" | \
      mail -s "Refract Alert" researcher@example.com
  fi
done
```

## Step 6: Detect specific patterns

Filter for high-signal events:

```bash
# Watch for citation removal — the most common prelude to content change
refract cron watch-pages.txt --interval 24 | \
  grep "citation_removed"

# Watch for template disputes — NPOV, citation needed, dispute tags
refract cron watch-pages.txt --interval 24 | \
  grep "template_added"
```

The output is NDJSON — pipe it into `jq`, DuckDB, or your own analysis pipeline.

## Step 7: Integrate with your own alerts

The cron output is machine-readable JSON. Parse it programmatically:

```bash
refract cron watch-pages.txt --interval 24 --format ndjson | while read event; do
  event_type=$(echo "$event" | jq -r '.eventType')
  page=$(echo "$event" | jq -r '.pageTitle')
  section=$(echo "$event" | jq -r '.section')

  if [ "$event_type" = "citation_removed" ]; then
    echo "ALERT: Citation removed from $page / $section"
    # Trigger your alerting pipeline
  fi
done
```

## Next steps

- [CLI cron reference](../cron.md) — all flags and environment variables
- [Citation churn tutorial](citation-churn.md) — interpreting citation patterns
- [Dispute timeline tutorial](dispute-timeline.md) — detecting edit wars
- [Downstream integration](../downstream.md) — production patterns for consuming events
