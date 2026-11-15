#!/usr/bin/env node
/**
 * sys2mcp starter skeleton — minimal runnable MCP server (stdio).
 * Two read-only example tools: ping (health) + fetch_json (allowlisted HTTP GET).
 * Replace with your own system's tools; keep tools read-only until gated.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const ALLOWED_HOSTS = (process.env.SYS2MCP_ALLOW_HOSTS ?? "example.com")
  .split(",").map(s => s.trim()).filter(Boolean);

const server = new McpServer({ name: "sys2mcp-starter", version: "0.1.0" });

server.tool("ping", "Health check: returns server status and allowed hosts", {}, async () => ({
  content: [{ type: "text", text: JSON.stringify({ status: "ok", allowedHosts: ALLOWED_HOSTS }) }],
}));

server.tool(
  "fetch_json",
  "Read-only GET to an allowlisted host, returns JSON text",
  { url: z.string().url().describe("Full URL, host must be in SYS2MCP_ALLOW_HOSTS") },
  async ({ url }) => {
    const host = new URL(url).host;
    if (!ALLOWED_HOSTS.some(h => host === h || host.endsWith("." + h))) {
      return { content: [{ type: "text", text: `BLOCKED: host ${host} not in allowlist` }], isError: true };
    }
    const res = await fetch(url, { headers: { "user-agent": "sys2mcp-starter/0.1.0" } });
    const body = await res.text();
    return { content: [{ type: "text", text: `HTTP ${res.status}\n${body.slice(0, 4000)}` }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("sys2mcp-starter running on stdio");
