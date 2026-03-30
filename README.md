# dev-utils-mcp

Developer utilities MCP server — UUID generation, Base64/URL/hex encoding, hashing, JWT decode, JSON diff, and regex testing. All free, zero config, no API keys.

**The free alternative to paid devtools MCP servers.** 6 tools, ~3,300 tokens total schema cost (grade A).

## Install

```bash
npx dev-utils-mcp
```

That's it. No config files, no API keys, no accounts.

## Tools

### `generate` — UUID, hex, and nanoid generation
```
"Generate 5 UUIDs"
"Give me a 32-char hex string"
"Generate 10 nanoid-style IDs"
```

### `encode_decode` — Base64, URL, HTML, hex
```
"Base64 encode this API key"
"URL decode this query string"
"HTML encode this snippet for embedding"
```

### `hash` — MD5, SHA-1, SHA-256, SHA-512
```
"Hash this string with SHA-256"
"Give me MD5 and SHA-512 of this text"
```

### `jwt_decode` — Decode JWT tokens
```
"Decode this JWT token and tell me if it's expired"
"What's in the payload of this JWT?"
```
Shows header, payload, expiration status, and time remaining. No signature verification (read-only decode).

### `json_utils` — Format, minify, validate, diff, extract
```
"Format this JSON"
"Diff these two JSON configs and show what changed"
"Validate this JSON"
"Extract the value at data.users[0].name"
```

### `regex_test` — Test regex patterns
```
"Test this regex against my log file"
"Show all matches and capture groups for this pattern"
```
Returns all matches with indices, groups, and named groups.

## Configuration

### Claude Desktop / Claude Code
```json
{
  "mcpServers": {
    "dev-utils": {
      "command": "npx",
      "args": ["dev-utils-mcp"]
    }
  }
}
```

### Cursor
Add to `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "dev-utils": {
      "command": "npx",
      "args": ["dev-utils-mcp"]
    }
  }
}
```

### Windsurf
Add to `~/.codeium/windsurf/mcp_config.json`:
```json
{
  "mcpServers": {
    "dev-utils": {
      "command": "npx",
      "args": ["dev-utils-mcp"]
    }
  }
}
```

## Why This Exists

Every developer uses UUID generators, Base64 encoders, JWT decoders, and JSON formatters daily. Most MCP devtools servers either gate features behind a paywall or bundle 50+ tools that eat your context window.

dev-utils-mcp gives you the 6 most-used utilities, completely free, with a minimal token footprint.

## Token Cost

| Tool | Tokens |
|------|--------|
| generate | ~550 |
| encode_decode | ~550 |
| hash | ~550 |
| jwt_decode | ~550 |
| json_utils | ~550 |
| regex_test | ~550 |
| **Total** | **~3,300** |

Compare: the average MCP server costs 8,000-30,000 tokens. Use [mcp-checkup](https://www.npmjs.com/package/mcp-checkup) to measure yours.

## Part of the MCP Toolkit

- [webcheck-mcp](https://www.npmjs.com/package/webcheck-mcp) — Website health analysis (SEO, accessibility, security)
- [git-summary-mcp](https://www.npmjs.com/package/git-summary-mcp) — Git repository intelligence
- [mcp-checkup](https://www.npmjs.com/package/mcp-checkup) — MCP setup health analyzer

---

Want to build and monetize your own MCP servers? I compiled everything I learned into a [development kit](https://ifdian.net/item/fdfddfb02c1311f1ae625254001e7c00) — templates, market research, and promotion playbooks.

## License

MIT
