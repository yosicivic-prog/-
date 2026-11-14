# Source and security review

- Upstream: https://github.com/sepivip/meta-ads-skill
- Commit: 15f61cf62b01f1a49702b9c8f2c3131bea5e9f36 (2026-10-02)
- License: MIT (copied as LICENSE)
- Installed: 2026-11-14

## Installed files
`SKILL.md`, `references/launch-playbook.md`, `references/tool-contracts.md`,
`references/troubleshooting.md`, `LICENSE`. The upstream README was not copied.

## Review performed before install
- Read every installed file in full.
- No scripts, executables, symlinks or binaries. Markdown instructions only.
- No hidden or invisible Unicode, HTML comments, encoded blobs or prompt-injection phrasing.
- Only URL referenced: `https://mcp.facebook.com/ads` (Meta's official Ads MCP). Nothing
  sends data to third parties.
- Safety model: builds everything paused or draft and asks for explicit approval before going live.

## Local changes
A "Local notes for this project" section at the top of SKILL.md, recording where the
upstream text differs from the connected Meta Ads tool schemas. The upstream text is unchanged.
