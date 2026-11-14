# Source and security review

- Upstream: https://github.com/mathiaschu/meta-ads-analyzer
- Commit: 9088472ddacdb89f3c5943c3db6be7b8ee25c922 (2026-02-26)
- License: MIT (copied as LICENSE)
- Installed: 2026-11-14

## Installed files
Only the upstream `skill/` folder (`SKILL.md` + 9 `references/*.md`) and `LICENSE`.

**Deliberately NOT installed:** `scripts/setup.sh` and `scripts/refresh_token.sh` (they ask
for a Meta access token and app secret and write them to a local `.env`), and the `mcp/` config.
None of these are needed: the Meta Ads connector is already connected.

## Review performed before install
- Read every installed file in full.
- No scripts, executables, symlinks or binaries in the installed files. Markdown only.
- No hidden or invisible Unicode, HTML comments, encoded blobs, URLs or prompt-injection phrasing.
- Content: Meta delivery-system concepts (Breakdown Effect, learning phase, pacing, auctions,
  bid strategies, relevance diagnostics, auction overlap, normal vs. concerning fluctuations).

## Local changes
A "Local notes for this project" section at the top of SKILL.md. The upstream text is unchanged.
