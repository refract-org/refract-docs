# Scheduled monitoring with cron

`refract cron` runs one-shot re-observation for pages in a batch file. It detects new
events since the last observation and optionally sends notifications. Designed for
scheduling via system cron, CI workflows, or serverless triggers.

## Basic usage

```bash
refract cron topics.txt
```

Where `topics.txt` contains one page title per line:

```
Bitcoin
COVID-19
Climate_change
Global_warming
```

Refract re-observes each page and reports new events since the last observation.

## Scheduling with system cron

```bash
# /etc/cron.d/refract-observation
# Run every 6 hours
0 */6 * * * user refract cron /path/to/pages.txt
```

## Scheduling with GitHub Actions

```yaml
name: Refract Observation
on:
  schedule:
    - cron: '0 */6 * * *'  # every 6 hours
  workflow_dispatch:

jobs:
  observe:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npx @refract-org/cli cron pages.txt
```

## Lookback window

By default, Refract looks back to the last observation timestamp (recorded in
`~/.wikihistory/cron-state.json`). Override with `--interval`:

```bash
# Look back 24 hours regardless of last observation
refract cron topics.txt --interval 24
```

## Notifications

### Slack

```bash
refract cron topics.txt --notify-slack
```

Requires `SLACK_WEBHOOK_URL` environment variable. Refract POSTs a summary of new
events (page, event types, counts, affected sections) to the webhook URL.

### Email

```bash
refract cron topics.txt --notify-email
```

Requires environment variables:
- `SMTP_HOST` — SMTP server hostname
- `SMTP_PORT` — SMTP server port
- `SMTP_USER` — SMTP username
- `SMTP_PASS` — SMTP password
- `NOTIFY_FROM` — sender address
- `NOTIFY_TO` — recipient address(es)

### Webhook

```bash
refract cron topics.txt --notify-webhook https://hooks.example.com/refract
```

POSTs a JSON payload with new events to the given URL. Use this to integrate with
PagerDuty, Zapier, custom dashboards, or internal monitoring systems.

Webhook payload format:

```json
{
  "observationTimestamp": "2025-05-16T12:00:00Z",
  "pagesObserved": 4,
  "totalNewEvents": 23,
  "events": [
    {
      "pageTitle": "Bitcoin",
      "eventType": "citation_removed",
      "section": "Regulation",
      "timestamp": "2025-05-16T10:30:00Z"
    }
  ]
}
```

## Monitoring specific page sections

To monitor only a specific section, add section names to the pages file:

```
Bitcoin#Regulation
Climate_change#Scientific_consensus
```

Refract re-observes only the named section for each page.

## Archiving observations

Export each observation to a timestamped file for archival:

```bash
refract cron topics.txt --notify-slack --export ~/observations/
```

Each observation exports to `~/observations/<page>/<timestamp>.jsonl`.

## Running on serverless platforms

### Cloudflare Workers (scheduled trigger)

```javascript
export default {
  async scheduled(event, env, ctx) {
    const result = await npx(["@refract-org/cli", "cron", "pages.txt"]);
    await env.REFRACT_KV.put(`observation-${Date.now()}`, JSON.stringify(result));
  },
};
```

### AWS Lambda (EventBridge schedule)

Refract can run in a Lambda function with a 15-minute timeout. Use `npx` or bundle
Refract as a layer. Trigger via EventBridge schedule:

```json
{
  "schedule": "rate(6 hours)",
  "target": {
    "arn": "arn:aws:lambda:us-east-1:123456789:function:refract-cron"
  }
}
```

## Running in CI/CD pipelines

### PR checks: detect documentation degradation

Run `refract analyze` in a GitHub Actions workflow to detect when a PR changes an
observed page in unexpected ways (citation loss, template removal, revert spike):

```yaml
name: Documentation Health
on:
  pull_request:
    paths:
      - 'docs/**/*.md'

jobs:
  check-changes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - name: Analyze observed pages
        run: |
          npx @refract-org/cli analyze "Page_Name" --depth detailed -c > pr-events.jsonl
      - name: Compare with baseline
        run: |
          duckdb -c "
            SELECT event_type, count(*) - (SELECT count(*) FROM 'baseline-events.jsonl' WHERE event_type = e.event_type) as delta
            FROM 'pr-events.jsonl' e
            GROUP BY event_type
            HAVING delta < 0
            ORDER BY delta;
          "
      - name: Alert on citation loss
        if: failure()
        run: |
          echo "Citation count decreased in this PR. Review sourcing changes before merging."
```

### Scheduled observation with artifact storage

Store each observation as a build artifact for historical comparison:

```yaml
name: Scheduled Observation
on:
  schedule:
    - cron: '0 */6 * * *'
  workflow_dispatch:

jobs:
  observe:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - name: Run observation
        run: |
          npx @refract-org/cli cron pages.txt > observation-$(date +%Y%m%d-%H%M).jsonl
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: observation-${{ github.run_id }}
          path: observation-*.jsonl
```

### Compare across CI runs

```bash
# Download last known good observation
gh run download -n observation-latest

# Compare with current observation
duckdb -c "
  SELECT e1.event_type,
         e1.cnt as previous,
         e2.cnt as current,
         e2.cnt - e1.cnt as delta
  FROM (SELECT event_type, count(*) as cnt FROM 'observation-latest.jsonl' GROUP BY 1) e1
  FULL OUTER JOIN (SELECT event_type, count(*) as cnt FROM 'observation-current.jsonl' GROUP BY 1) e2
    ON e1.event_type = e2.event_type
  ORDER BY abs(delta) DESC;
"
```

### GitLab CI

```yaml
refract-observation:
  image: node:22
  script:
    - npx @refract-org/cli cron pages.txt --notify-webhook https://hooks.example.com/refract
  only:
    - schedules
```
