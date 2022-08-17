# GitHub Action: Fetch Circle CI Insights Summary

Fetches [Insights Summary](https://circleci.com/docs/api/v2/index.html#operation/getProjectWorkflowsPageData) data from Circle CI using the V2 API.

## Usage

```yaml
- name: Fetch Circle CI Insights Summary
  uses: jpdillingham/circleci-insights-summary@v1
  with:
    api-key: ${{ secrets.CIRCLE_CI_API_KEY }}
    project-slug: github/my-cool-repo
    reporting-window: last-24-hours
```

## Example: Sending total credits used over the past 24 hours to Datadog

```yaml
on:
  workflow_dispatch:

jobs:
  send_datadog_metrics:
    runs-on: ubuntu-latest
    name: Collects Circle CI metrics and sends them to DataDog
    steps:
      - name: Fetch Circle CI Insights Summary
        id: fetch
        uses: jpdillingham/circleci-insights-summary@v0.5
        with:
          api-key: ${{ secrets.CIRCLE_CI_API_KEY }}
          project-slug: github/my_cool_org
          reporting-window: last-24-hours
      - name: Dump output
        run: echo "summary ${{ steps.fetch.outputs.summary }}"
      - name: Send metrics to Datadog
        uses: masci/datadog@v1
        with:
          api-key: ${{ secrets.DATADOG_API_KEY }}
          metrics: |
            - type: "count"
              name: "circleci.org_data.metrics.total_credits-used"
              value: ${{ steps.fetch.outputs.org_data-metrics-total_credits_used }}
```

## Why do this?

Circle CI doesn't give you a great way to track changes in your metrics over time.  This action lets you extract point-in-time data and send it somewhere else for analysis and trending.  This action only solves the "extraction" part of the equation; you're on the hook for the "send it somewhere else" part.

## What does it do?

Specifically, it makes this call:

```bash
curl -H "Circle-Token: <your Circle CI API token>" \
  "https://circleci.com/api/v2/insights/<vcs>/<project>/summary?reporting-window=<timeframe>"
```

Which outputs something like:

```json
{
  "org_data" : {
    "trends" : {
      "success_rate" : 1.00,
      "total_credits_used" : 2.00,
      "throughput" : 3.00,
      "total_duration_secs" : 4.00,
      "total_runs" : 5.00
    },
    "metrics" : {
      "success_rate" : 6.00,
      "total_credits_used" : 7,
      "throughput" : 8.00,
      "total_duration_secs" : 9,
      "total_runs" : 10
    }
  },
  "all_projects" : [ "project_1", "project_2" ],
  "org_project_data" : [ {
    "metrics" : {
      "total_credits_used" : 11,
      "total_duration_secs" : 12,
      "total_runs" : 13,
      "success_rate" : 14.00
    },
    "trends" : {
      "total_credits_used" : 15.00,
      "total_duration_secs" : 16.00,
      "total_runs" : 17.00,
      "success_rate" : 18.00
    },
    "project_name" : "project_1"
  }, {
    "metrics" : {
      "total_credits_used" : 19,
      "total_duration_secs" : 20,
      "total_runs" : 21,
      "success_rate" : 22.00
    },
    "trends" : {
      "total_credits_used" : 23.00,
      "total_duration_secs" : 24.00,
      "total_runs" : 25.00,
      "success_rate" : 26.00
    },
    "project_name" : "project_2"
  } ]
}
```

And then it flattens and groups the data for output like:

```
'org_data-trends-success_rate': 1,
'org_data-trends-total_credits_used': 2,
'org_data-trends-throughput': 3,
'org_data-trends-total_duration_secs': 4,
'org_data-trends-total_runs': 5,
'org_data-metrics-success_rate': 6,
'org_data-metrics-total_credits_used': 7,
'org_data-metrics-throughput': 8,
'org_data-metrics-total_duration_secs': 9,
'org_data-metrics-total_runs': 10,
'project_1-metrics-total_credits_used': 11,
'project_1-metrics-total_duration_secs': 12,
'project_1-metrics-total_runs': 13,
'project_1-metrics-success_rate': 14,
'project_1-trends-total_credits_used': 15,
'project_1-trends-total_duration_secs': 16,
'project_1-trends-total_runs': 17,
'project_1-trends-success_rate': 18,
'project_2-metrics-total_credits_used': 19,
'project_2-metrics-total_duration_secs': 20,
'project_2-metrics-total_runs': 21,
'project_2-metrics-success_rate': 22,
'project_2-trends-total_credits_used': 23,
'project_2-trends-total_duration_secs': 24,
'project_2-trends-total_runs': 25,
'project_2-trends-success_rate': 26
```

Alternatively, the entire flattened object is output as JSON in `summary`.