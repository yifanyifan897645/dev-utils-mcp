#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { randomUUID, createHash } from "node:crypto";

const server = new McpServer({
  name: "dev-utils",
  version: "0.1.0",
});

// Tool 1: Generate UUIDs and random strings
server.tool(
  "generate",
  "Generate UUIDs (v4), random hex strings, or nanoid-style IDs",
  {
    type: z.enum(["uuid", "hex", "nanoid"]).default("uuid").describe("Type of ID to generate"),
    count: z.number().min(1).max(100).default(1).describe("How many to generate"),
    length: z.number().min(4).max(256).default(21).describe("Length for hex/nanoid types"),
  },
  async ({ type, count, length }) => {
    const results: string[] = [];
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
    for (let i = 0; i < count; i++) {
      if (type === "uuid") {
        results.push(randomUUID());
      } else if (type === "hex") {
        const bytes = new Uint8Array(Math.ceil(length / 2));
        crypto.getRandomValues(bytes);
        results.push(Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("").slice(0, length));
      } else {
        let id = "";
        const arr = new Uint8Array(length);
        crypto.getRandomValues(arr);
        for (let j = 0; j < length; j++) id += chars[arr[j] & 63];
        results.push(id);
      }
    }
    return { content: [{ type: "text", text: results.join("\n") }] };
  }
);

// Tool 2: Encode/decode (Base64, URL, HTML entities)
server.tool(
  "encode_decode",
  "Encode or decode text: Base64, URL encoding, HTML entities, hex",
  {
    text: z.string().describe("Text to encode or decode"),
    format: z.enum(["base64", "url", "html", "hex"]).describe("Encoding format"),
    direction: z.enum(["encode", "decode"]).default("encode").describe("Encode or decode"),
  },
  async ({ text, format, direction }) => {
    let result: string;
    try {
      if (format === "base64") {
        result = direction === "encode"
          ? Buffer.from(text).toString("base64")
          : Buffer.from(text, "base64").toString("utf-8");
      } else if (format === "url") {
        result = direction === "encode" ? encodeURIComponent(text) : decodeURIComponent(text);
      } else if (format === "html") {
        if (direction === "encode") {
          result = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
        } else {
          result = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x([0-9a-fA-F]+);/g,
              (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
            .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec)));
        }
      } else {
        result = direction === "encode"
          ? Buffer.from(text).toString("hex")
          : Buffer.from(text, "hex").toString("utf-8");
      }
    } catch (e: any) {
      result = `Error: ${e.message}`;
    }
    return { content: [{ type: "text", text: result }] };
  }
);

// Tool 3: Hash text
server.tool(
  "hash",
  "Generate hash digests: MD5, SHA-1, SHA-256, SHA-512",
  {
    text: z.string().describe("Text to hash"),
    algorithms: z.array(z.enum(["md5", "sha1", "sha256", "sha512"])).default(["md5", "sha256"]).describe("Hash algorithms"),
  },
  async ({ text, algorithms }) => {
    const results = algorithms.map(algo => {
      const hash = createHash(algo).update(text).digest("hex");
      return `${algo}: ${hash}`;
    });
    return { content: [{ type: "text", text: results.join("\n") }] };
  }
);

// Tool 4: JWT decode (no verification — just reads the payload)
server.tool(
  "jwt_decode",
  "Decode a JWT token and display header, payload, and expiration status (no signature verification)",
  {
    token: z.string().describe("The JWT token to decode"),
  },
  async ({ token }) => {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return { content: [{ type: "text", text: "Error: Invalid JWT format (expected 3 parts)" }] };

      const decode = (s: string) => JSON.parse(Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
      const header = decode(parts[0]);
      const payload = decode(parts[1]);

      let expInfo = "";
      if (payload.exp) {
        const expDate = new Date(payload.exp * 1000);
        const now = new Date();
        expInfo = expDate > now
          ? `\nExpires: ${expDate.toISOString()} (valid, ${Math.round((expDate.getTime() - now.getTime()) / 60000)} min remaining)`
          : `\nExpires: ${expDate.toISOString()} (EXPIRED ${Math.round((now.getTime() - expDate.getTime()) / 60000)} min ago)`;
      }
      if (payload.iat) {
        expInfo += `\nIssued: ${new Date(payload.iat * 1000).toISOString()}`;
      }

      return {
        content: [{
          type: "text",
          text: `Header:\n${JSON.stringify(header, null, 2)}\n\nPayload:\n${JSON.stringify(payload, null, 2)}${expInfo}`,
        }],
      };
    } catch (e: any) {
      return { content: [{ type: "text", text: `Error decoding JWT: ${e.message}` }] };
    }
  }
);

// Tool 5: JSON utilities (format, minify, diff, validate)
server.tool(
  "json_utils",
  "JSON utilities: format/prettify, minify, validate, diff two JSON objects, or extract a path",
  {
    action: z.enum(["format", "minify", "validate", "diff", "extract"]).describe("Action to perform"),
    json: z.string().describe("JSON string (for diff: first JSON)"),
    json2: z.string().optional().describe("Second JSON string (for diff action)"),
    path: z.string().optional().describe("JSON path to extract (dot notation, e.g. 'data.users[0].name')"),
  },
  async ({ action, json, json2, path }) => {
    try {
      if (action === "validate") {
        try { JSON.parse(json); return { content: [{ type: "text", text: "✓ Valid JSON" }] }; }
        catch (e: any) { return { content: [{ type: "text", text: `✗ Invalid JSON: ${e.message}` }] }; }
      }
      if (action === "format") {
        return { content: [{ type: "text", text: JSON.stringify(JSON.parse(json), null, 2) }] };
      }
      if (action === "minify") {
        return { content: [{ type: "text", text: JSON.stringify(JSON.parse(json)) }] };
      }
      if (action === "diff") {
        if (!json2) return { content: [{ type: "text", text: "Error: json2 required for diff" }] };
        const a = JSON.parse(json);
        const b = JSON.parse(json2);
        const diffs: string[] = [];
        function compare(obj1: any, obj2: any, prefix: string) {
          const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
          for (const key of keys) {
            const p = prefix ? `${prefix}.${key}` : key;
            if (!(key in obj1)) { diffs.push(`+ ${p}: ${JSON.stringify(obj2[key])}`); }
            else if (!(key in obj2)) { diffs.push(`- ${p}: ${JSON.stringify(obj1[key])}`); }
            else if (typeof obj1[key] === "object" && typeof obj2[key] === "object" && obj1[key] !== null && obj2[key] !== null && !Array.isArray(obj1[key])) {
              compare(obj1[key], obj2[key], p);
            } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
              diffs.push(`~ ${p}: ${JSON.stringify(obj1[key])} → ${JSON.stringify(obj2[key])}`);
            }
          }
        }
        compare(a, b, "");
        return { content: [{ type: "text", text: diffs.length ? diffs.join("\n") : "No differences found" }] };
      }
      if (action === "extract") {
        if (!path) return { content: [{ type: "text", text: "Error: path required for extract" }] };
        let obj = JSON.parse(json);
        const segments = path.replace(/\[(\d+)\]/g, ".$1").split(".");
        for (const seg of segments) {
          if (obj == null) break;
          obj = obj[seg];
        }
        return { content: [{ type: "text", text: obj === undefined ? "Path not found" : JSON.stringify(obj, null, 2) }] };
      }
      return { content: [{ type: "text", text: "Unknown action" }] };
    } catch (e: any) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }] };
    }
  }
);

// Tool 6: Regex tester
server.tool(
  "regex_test",
  "Test a regex pattern against text: shows all matches, groups, and indices",
  {
    pattern: z.string().describe("Regular expression pattern (without delimiters)"),
    text: z.string().describe("Text to test against"),
    flags: z.string().default("g").describe("Regex flags (default: 'g')"),
  },
  async ({ pattern, text, flags }) => {
    try {
      const re = new RegExp(pattern, flags);
      const matches: any[] = [];
      let match;
      if (flags.includes("g")) {
        while ((match = re.exec(text)) !== null) {
          matches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1).length ? match.slice(1) : undefined,
            namedGroups: match.groups || undefined,
          });
          if (matches.length >= 100) break;
        }
      } else {
        match = re.exec(text);
        if (match) {
          matches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1).length ? match.slice(1) : undefined,
            namedGroups: match.groups || undefined,
          });
        }
      }

      const result = {
        pattern,
        flags,
        totalMatches: matches.length,
        matches,
      };
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e: any) {
      return { content: [{ type: "text", text: `Regex error: ${e.message}` }] };
    }
  }
);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
