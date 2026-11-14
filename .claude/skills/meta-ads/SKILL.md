---
name: meta-ads
description: Use when creating, launching, monitoring, or troubleshooting Meta (Facebook/Instagram) ad campaigns through the Meta Ads MCP server (mcp.facebook.com/ads) or Meta's Ads CLI — campaigns, ad sets, creatives, ads, budgets, insights queries, location and radius targeting, ad copy in any language, and errors like "socket connection was closed", INTERNAL create failures, "app that is in development mode", "No permissions available" during token generation, or "prohibited from advertising".
---

# Meta Ads (MCP-first)

## Local notes for this project (added on install, 2026-11-14)

Upstream: github.com/sepivip/meta-ads-skill @ 15f61cf (MIT). Reviewed before install; see SOURCE.md.
The upstream text below is unchanged. These notes record where it disagrees with the Meta Ads
connector this project actually uses (checked against the live tool schemas on 2026-11-14):

- **The connected tools' own descriptions win.** Wherever a tool description and this skill
  disagree, follow the tool description.
- **Draft mode may be on.** Create tools can stage objects as `DRAFT` instead of creating them
  PAUSED, and `ads_activate_entity` then *publishes* the draft (a staged campaign publishes its
  whole subtree in one call). Read `ads_activate_entity`'s description before using it. Never call
  it without the user's explicit approval of exactly what goes live, including budget and dates.
- **Media upload:** `ads_creative_upload_image` does not exist in this connector. Use
  `ads_creative_upload_media` (`upload_source: URL` + `media_type` + `media_url`), or for a file in
  the sandbox `ads_create_upload_url` → curl upload → `ads_finalize_upload`. Local files *are*
  supported, so ignore the "URL-only" advice here and in troubleshooting §Images.
- **Advantage+ Audience:** do not add `targeting_automation.advantage_audience: 0` just to make an
  age range a hard cap (the playbook's example does this). Use 0 only for one of the reasons
  `ads_create_ad_set` lists, and send `advantage_audience_off_reason` with it.
- **Async reports:** `ads_entity_schedule_report` / `ads_entity_get_report` are not in this
  connector. Use `ads_get_ad_entities`; use `ads_get_async_result` only with a `job_id` a tool returned.
- **Setup/auth sections** (`claude mcp add`, system-user tokens, Ads CLI, `.env`): not needed here.
  The Meta connector is already connected. Never ask the user to paste a token or app secret.

## Overview

Core principle: **the Meta Ads MCP's tool contracts are NOT the Graph API you remember.** Parameter names, shapes, and field lists differ exactly where it breaks calls. Never write a call from memory — check [references/tool-contracts.md](references/tool-contracts.md) first, and when a VALIDATION error returns a "Supported fields are:" list, treat that list as the source of truth over anything you believed.

## When to use

- Launching a campaign end-to-end via MCP tools (`ads_create_campaign` → `ads_create_ad_set` → `ads_create_creative` → `ads_create_ad` → `ads_activate_entity`)
- Querying performance (`ads_get_ad_entities`, reports)
- Recovering from MCP/API errors mid-flight
- Setting up auth: official MCP (preferred, no developer app) vs Ads CLI / system-user token (headless fallback)
- NOT for: organic page posting, Instagram content management

## The launch pipeline (each step's landmine)

| Step | Tool | Landmine |
|---|---|---|
| 1. Account | `ads_get_ad_accounts` | Check `is_ads_mcp_enabled`, `is_queryable`, AND `has_payment_method` — creation without a payment method fails at delivery |
| 2. Page | `ads_get_ad_account_pages` | A Facebook Page is mandatory ad identity |
| 3. Images | `ads_creative_upload_image` | **URL-only** — cannot read local files. Local file? See troubleshooting §Images |
| 4. Campaign | `ads_create_campaign` | `buying_type` is REQUIRED (`AUCTION`). Budgets in **cents** of account currency. CBO = budget here; lifetime budget needs `campaign_stop_time` |
| 5. Ad set | `ads_create_ad_set` | `targeting` is a **JSON string**, required. NO budget fields under a CBO parent (pre-validated rejection). Hard age caps need `targeting_automation.advantage_audience: 0` |
| 6. Creative | `ads_create_creative` | **Flat params** (`page_id`, `image_hash`, `link_url`, `message`, `headline`, `call_to_action_type`) — NOT `object_story_spec` |
| 7. Ad | `ads_create_ad` | `creative` is a **JSON string** `"{\"creative_id\":\"...\"}"`; name param is `ad_name` |
| 8. Preview | `ads_get_ad_preview` | Include the returned `preview_url` as a link for the user |
| 9. Activate | `ads_activate_entity` | ONLY after explicit user confirmation. Top-down: campaign → ad set → every ad. `entity_type` is `ad_set` (underscore), not `adset` |

Everything creates PAUSED by default — that's the safety model. Build the whole structure, show previews, get the user's explicit go, then activate.

## Insights in one line

Metrics require `date_preset` (or `time_range`). Field names: `name` (not `ad_name`), `amount_spent` (not `spend`), link clicks = `actions:link_click`, cost = `cost_per_link_click` — bare `actions` is invalid. Sort = `<field>_descending`. Full list: [references/tool-contracts.md](references/tool-contracts.md).

## Targeting quick recipes

Radius around any point (no city-key lookup needed — the MCP has no targeting-search tool):
```json
{"geo_locations":{"custom_locations":[{"latitude":51.5074,"longitude":-0.1278,"radius":25,"distance_unit":"kilometer"}]},"age_min":18,"age_max":55}
```
`distance_unit` is `kilometer` or `mile`. Whole country: `{"geo_locations":{"countries":["GB"]}}` (ISO country codes). Ad copy in any language or script in `message`/`headline` is plain UTF-8 — works as-is. Budget is in the ad account's fixed currency (check `currency` on step 1; "$100" in a EUR account is a conversion conversation, not a relabel).

## Errors — first aid

| Symptom | Do |
|---|---|
| "socket connection was closed unexpectedly" | Retry once — transient, common on first call after idle |
| INTERNAL error on a create, `is_retryable: false` | **List entities first** to check it wasn't created server-side, then retry once. Never blind-retry a create |
| VALIDATION "Unsupported field(s)" | The error's "Supported fields are:" list is authoritative — fix and retry |
| "This tool is new and is being gradually rolled out" | Feature-gate per account (e.g. `ads_get_ig_accounts`). Work without it; note the limitation |
| "app that is in development mode" / token permission walls / "prohibited from advertising" | [references/troubleshooting.md](references/troubleshooting.md) |

Full playbook with the worked end-to-end example: [references/launch-playbook.md](references/launch-playbook.md).
