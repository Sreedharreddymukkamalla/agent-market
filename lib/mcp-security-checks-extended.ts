import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import crypto from "crypto";

// ── Helpers ───────────────────────────────────────────────────────────────────

export function hashToolDefinition(tool: any): string {
  const canonical = JSON.stringify({
    name: tool.name,
    description: tool.description ?? "",
    inputSchema: tool.inputSchema ?? {},
  });
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

const SSRF_PATTERNS = [
  /169\.254\.169\.254/,
  /metadata\.google\.internal/i,
  /fd00:/i,
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\./,
  /^https?:\/\/0\.0\.0\.0/,
  /^https?:\/\/10\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
  /^file:\/\//i,
];

const BROAD_SCOPE_PATTERNS = [
  /\bfull.access\b/i,
  /\badmin\b/i,
  /\bwrite:?\*\b/i,
  /\bread:?\*\b/i,
  /\bscope.*all\b/i,
  /\ball.scopes?\b/i,
  /offline_access/i,
  /openid.*profile.*email.*address/i,
];

const OVER_PERMISSION_PATTERNS = [
  /\broot\b/i,
  /\bsuperuser\b/i,
  /\badmin\b.*\baccess\b/i,
  /\bbypass.*auth/i,
  /\bunrestricted\b/i,
  /\bgod.?mode\b/i,
  /\ball.permissions?\b/i,
  /\belevated.privileges?\b/i,
];

const SECRET_PATTERNS = [
  { pattern: /sk-[a-zA-Z0-9]{20,}/,          label: "OpenAI API key" },
  { pattern: /AKIA[0-9A-Z]{16}/,              label: "AWS Access Key ID" },
  { pattern: /ghp_[a-zA-Z0-9]{36}/,           label: "GitHub Personal Access Token" },
  { pattern: /gho_[a-zA-Z0-9]{36}/,           label: "GitHub OAuth Token" },
  { pattern: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/, label: "JWT token" },
  { pattern: /-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----/, label: "Private key" },
  { pattern: /password\s*[:=]\s*[^\s]{6,}/i,  label: "Password literal" },
  { pattern: /api[_-]?key\s*[:=]\s*[^\s]{8,}/i, label: "API key literal" },
  { pattern: /secret\s*[:=]\s*[^\s]{8,}/i,    label: "Secret literal" },
  { pattern: /bearer\s+[a-zA-Z0-9._-]{20,}/i, label: "Bearer token" },
];

const TRUSTED_TOOL_NAMES_TO_SHADOW = [
  "create_issue", "create_pull_request", "push_files", "get_file_contents",
  "list_repositories", "search_repositories",
  "read_file", "write_file", "list_directory", "create_directory", "delete_file",
  "send_message", "list_channels", "get_messages",
  "create_payment", "list_customers", "create_customer",
  "execute_sql", "list_tables", "insert_rows",
  "create_entities", "add_observations", "search_nodes",
];

// ── CHECK 8: RUG PULL DETECTION ───────────────────────────────────────────────
export async function checkRugPull(url: string, token: string | undefined, findings: any[]) {
  const makeClient = async () => {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const transport = new StreamableHTTPClientTransport(new URL(url), { requestInit: { headers } });
    const client = new Client({ name: "agentaim-security-scanner", version: "1.0.0" });
    await client.connect(transport);
    return client;
  };

  try {
    const c1 = await makeClient();
    const { tools: tools1 } = await c1.listTools();
    const hashes1 = Object.fromEntries((tools1 || []).map((t: any) => [t.name, hashToolDefinition(t)]));
    await c1.close();

    await new Promise((r) => setTimeout(r, 800));

    const c2 = await makeClient();
    const { tools: tools2 } = await c2.listTools();
    const hashes2 = Object.fromEntries((tools2 || []).map((t: any) => [t.name, hashToolDefinition(t)]));
    await c2.close();

    const changed: string[] = [];
    const added: string[] = [];
    const removed: string[] = [];

    for (const name of Object.keys(hashes1)) {
      if (!hashes2[name]) removed.push(name);
      else if (hashes1[name] !== hashes2[name]) changed.push(name);
    }
    for (const name of Object.keys(hashes2)) {
      if (!hashes1[name]) added.push(name);
    }

    if (changed.length > 0 || added.length > 0 || removed.length > 0) {
      findings.push({
        check: "RUG_PULL",
        severity: "CRITICAL",
        title: "Tool definitions changed between two consecutive fetches",
        description:
          "This server returned different tool definitions within the same scan session. This is the defining characteristic of a rug pull attack — tools can be silently mutated after user approval.",
        evidence: [
          changed.length > 0 ? `Changed: ${changed.join(", ")}` : null,
          added.length > 0   ? `Added:   ${added.join(", ")}` : null,
          removed.length > 0 ? `Removed: ${removed.join(", ")}` : null,
        ].filter(Boolean).join("\n"),
        recommendation:
          "Do not trust this server. Pin tool definition hashes at approval time and re-verify before every tool call.",
      });
    } else {
      findings.push({ check: "RUG_PULL", severity: "PASS", title: "Tool definitions stable across two fetches", description: `${tools1?.length ?? 0} tool(s) re-verified — no changes detected within this scan.` });
    }
  } catch (e: any) {
    findings.push({ check: "RUG_PULL", severity: "INFO", title: "Rug pull check could not complete", description: e.message });
  }
}

// ── CHECK 9: CROSS-ORIGIN TOOL SHADOWING ──────────────────────────────────────
export function checkCrossOriginShadowing(tools: any[], findings: any[]) {
  const shadowedNames = tools.map((t) => t.name).filter((name) => TRUSTED_TOOL_NAMES_TO_SHADOW.includes(name));
  if (shadowedNames.length > 0) {
    findings.push({
      check: "CROSS_ORIGIN",
      severity: "HIGH",
      title: `${shadowedNames.length} tool(s) shadow well-known trusted server tools`,
      description:
        "This server exposes tools with names identical to widely-used MCP servers (GitHub, Filesystem, Slack, Stripe, Supabase). In multi-server agent setups, this can intercept calls intended for legitimate servers, a technique known as cross-origin tool shadowing.",
      evidence: shadowedNames.join(", "),
      recommendation:
        "Only use this server in isolation. Never connect it alongside the official servers whose tool names it shares.",
    });
  }

  const serverRefs = ["github mcp", "filesystem mcp", "slack mcp", "stripe mcp", "memory mcp", "brave", "puppeteer", "playwright"];
  const descRefs: string[] = [];
  for (const tool of tools) {
    const desc = (tool.description || "").toLowerCase();
    for (const ref of serverRefs) {
      if (desc.includes(ref)) {
        descRefs.push(`${tool.name} mentions "${ref}"`);
        break;
      }
    }
  }
  if (descRefs.length > 0) {
    findings.push({
      check: "CROSS_ORIGIN",
      severity: "MEDIUM",
      title: "Tool descriptions reference other known MCP servers",
      description:
        "Tool descriptions mentioning other server names can be used to redirect or override agent behaviour toward those servers.",
      evidence: descRefs.join("\n"),
      recommendation: "Inspect these tool descriptions carefully before use.",
    });
  }
}

// ── CHECK 10: OAUTH SCOPE ABUSE ───────────────────────────────────────────────
export function checkOAuthScopes(tools: any[], findings: any[]) {
  const hits: string[] = [];
  for (const tool of tools) {
    const text = tool.description || "";
    for (const pattern of BROAD_SCOPE_PATTERNS) {
      if (pattern.test(text)) {
        hits.push(`${tool.name}: matched "${pattern.source}"`);
        break;
      }
    }
  }
  if (hits.length > 0) {
    findings.push({
      check: "OAUTH_SCOPE",
      severity: "HIGH",
      title: "Tool descriptions reference overly broad OAuth scopes",
      description:
        "Tool descriptions contain language suggesting broad or unrestricted OAuth permissions. This increases the blast radius of any compromise — a single leaked token grants wide access.",
      evidence: hits.join("\n"),
      recommendation:
        "Request only the minimum OAuth scopes needed. Audit what scopes the server actually requires at runtime.",
    });
  }
}

// ── CHECK 11: SENSITIVE DATA IN RESOURCES ─────────────────────────────────────
export async function checkSensitiveDataInResources(url: string, token: string | undefined, resources: any[], findings: any[]) {
  if (resources.length === 0) return;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const transport = new StreamableHTTPClientTransport(new URL(url), { requestInit: { headers } });
  const client = new Client({ name: "agentaim-security-scanner", version: "1.0.0" });
  const secretHits: string[] = [];
  try {
    await client.connect(transport);
    const sample = resources.slice(0, 5);
    for (const resource of sample) {
      try {
        const result = await client.readResource({ uri: resource.uri });
        const content = result.contents?.map((c: any) => c.text || c.blob || "").join(" ") ?? "";
        for (const { pattern, label } of SECRET_PATTERNS) {
          if (pattern.test(content)) {
            secretHits.push(`Resource "${resource.uri}" → ${label}`);
            break;
          }
        }
      } catch {
      }
    }
    await client.close();
  } catch {
  }
  if (secretHits.length > 0) {
    findings.push({
      check: "SENSITIVE_DATA",
      severity: "CRITICAL",
      title: "Sensitive credentials found in server resources",
      description:
        "One or more resources exposed by this server appear to contain secrets such as API keys, tokens, or private keys. This is an immediate data exposure risk.",
      evidence: secretHits.join("\n"),
      recommendation:
        "Immediately rotate any exposed credentials. Server resources should never contain raw secrets.",
    });
  } else if (resources.length > 0) {
    findings.push({ check: "SENSITIVE_DATA", severity: "PASS", title: "No obvious secrets detected in sampled resources", description: `Sampled ${Math.min(5, resources.length)} of ${resources.length} resource(s) — no known secret patterns found.` });
  }
}

// ── CHECK 12: SCHEMA STRICTNESS ───────────────────────────────────────────────
export function checkSchemaStrictness(tools: any[], findings: any[]) {
  const laxTools: string[] = [];
  for (const tool of tools) {
    const schema = tool.inputSchema;
    if (!schema) continue;
    if (schema.additionalProperties !== false) {
      laxTools.push(tool.name);
    }
  }
  if (laxTools.length > 0) {
    findings.push({
      check: "SCHEMA_STRICT",
      severity: "LOW",
      title: `${laxTools.length} tool(s) missing additionalProperties:false in schema`,
      description:
        "Tools without strict JSON schemas accept arbitrary extra parameters. This allows parameter injection attacks where malicious additional arguments are passed to the underlying function.",
      evidence: laxTools.slice(0, 10).join(", ") + (laxTools.length > 10 ? ` +${laxTools.length - 10} more` : ""),
      recommendation:
        'Set "additionalProperties": false on all tool input schemas to reject unexpected parameters.',
    });
  } else if (tools.length > 0) {
    findings.push({ check: "SCHEMA_STRICT", severity: "PASS", title: "All tool schemas use strict additionalProperties:false", description: "Tool input schemas correctly reject unexpected parameters." });
  }
}

// ── CHECK 13: RESOURCE SSRF VECTORS ──────────────────────────────────────────
export function checkResourceSSRF(resources: any[], findings: any[]) {
  const ssrfHits: string[] = [];
  for (const resource of resources) {
    const uri = resource.uri || "";
    for (const pattern of SSRF_PATTERNS) {
      if (pattern.test(uri)) {
        ssrfHits.push(`${uri}`);
        break;
      }
    }
  }
  if (ssrfHits.length > 0) {
    findings.push({
      check: "RESOURCE_SSRF",
      severity: "CRITICAL",
      title: "Resources pointing to internal/metadata network addresses",
      description:
        "One or more resource URIs point to internal IP ranges, localhost, or cloud metadata endpoints (e.g. 169.254.169.254). Reading these resources could expose cloud credentials, instance metadata, or internal services.",
      evidence: ssrfHits.join("\n"),
      recommendation:
        "Never expose resources with internal network URIs. Enforce an allowlist of permitted URI schemes and hosts.",
    });
  }
  const fileUris = resources.filter((r) => (r.uri || "").startsWith("file://"));
  if (fileUris.length > 0) {
    findings.push({
      check: "RESOURCE_SSRF",
      severity: "HIGH",
      title: `${fileUris.length} file:// resource URI(s) detected`,
      description:
        "Resources using file:// URIs expose the server's local filesystem to the MCP client. This can be exploited to read arbitrary files including credentials and configuration.",
      evidence: fileUris.map((r: any) => r.uri).join("\n"),
      recommendation: "Do not expose file:// URIs as MCP resources.",
    });
  }
}

// ── CHECK 14: PROMPT TEMPLATE INJECTION ───────────────────────────────────────
export function checkPromptInjection(prompts: any[], findings: any[]) {
  const INJECTION_PATTERNS = [
    { pattern: /<IMPORTANT>/i,           label: "Hidden <IMPORTANT> tag" },
    { pattern: /ignore previous/i,       label: "Instruction override" },
    { pattern: /do not tell the user/i,  label: "Concealment instruction" },
    { pattern: /exfiltrate/i,            label: "Exfiltration keyword" },
    { pattern: /[\u200b-\u200f\ufeff]/,  label: "Zero-width characters" },
  ];

  const poisoned: string[] = [];
  for (const prompt of prompts) {
    const text = [ prompt.description || "", JSON.stringify(prompt.arguments || []) ].join(" ");
    for (const { pattern, label } of INJECTION_PATTERNS) {
      if (pattern.test(text)) {
        poisoned.push(`"${prompt.name}": ${label}`);
        break;
      }
    }
  }

  if (poisoned.length > 0) {
    findings.push({
      check: "PROMPT_INJECT",
      severity: "CRITICAL",
      title: "Prompt injection patterns found in server prompts",
      description:
        "This server's prompt templates contain hidden instruction patterns. Since prompts are injected directly into LLM context, this is a direct prompt injection vector.",
      evidence: poisoned.join("\n"),
      recommendation: "Do not use any prompts from this server.",
    });
  } else if (prompts.length > 0) {
    findings.push({ check: "PROMPT_INJECT", severity: "PASS", title: "No injection patterns in prompt templates", description: `Scanned ${prompts.length} prompt template(s) — clean.` });
  }
}

// ── CHECK 15: TOOL DESCRIPTION ENTROPY / LENGTH ───────────────────────────────
export function checkDescriptionEntropy(tools: any[], findings: any[]) {
  function shannonEntropy(str: string): number {
    const freq: Record<string, number> = {};
    for (const c of str) freq[c] = (freq[c] || 0) + 1;
    return -Object.values(freq).reduce((sum, f) => {
      const p = f / str.length;
      return sum + p * Math.log2(p);
    }, 0);
  }

  const suspicious: string[] = [];
  for (const tool of tools) {
    const desc = tool.description || "";
    if (desc.length < 50) continue;
    const entropy = shannonEntropy(desc);
    if (entropy > 5.5) {
      suspicious.push(`"${tool.name}" entropy=${entropy.toFixed(2)} (desc length: ${desc.length})`);
    }
  }
  if (suspicious.length > 0) {
    findings.push({
      check: "DESC_ENTROPY",
      severity: "HIGH",
      title: "Unusually high entropy in tool description(s)",
      description:
        "Tool descriptions with abnormally high character entropy may contain base64-encoded payloads, obfuscated instructions, or encoded binary data. Normal prose has entropy ~4.0-4.5 bits/char; these exceed 5.5.",
      evidence: suspicious.join("\n"),
      recommendation:
        "Inspect the raw description content of these tools. High entropy descriptions are a red flag for encoded injection payloads.",
    });
  }
}

// ── CHECK 16: DUPLICATE TOOL NAMES ───────────────────────────────────────────
export function checkDuplicateTools(tools: any[], findings: any[]) {
  const seen: Record<string, number> = {};
  for (const tool of tools) seen[tool.name] = (seen[tool.name] || 0) + 1;
  const dupes = Object.entries(seen).filter(([, count]) => count > 1).map(([name, count]) => `${name} (×${count})`);
  if (dupes.length > 0) {
    findings.push({
      check: "DUPLICATE_TOOLS",
      severity: "HIGH",
      title: "Duplicate tool names within the same server",
      description:
        "This server exposes multiple tools with identical names. MCP clients typically use the last definition, which could be exploited to shadow a legitimate tool with a malicious one.",
      evidence: dupes.join(", "),
      recommendation:
        "All tool names must be unique. Duplicate names indicate a misconfigured or malicious server.",
    });
  }
}

// ── CHECK 17: URL PARAMETERS (SSRF SURFACE) ───────────────────────────────────
export function checkUrlParams(tools: any[], findings: any[]) {
  const urlParams: string[] = [];
  const URL_PARAM_NAMES = ["url", "endpoint", "uri", "target", "host", "webhook", "callback", "redirect", "src", "href"];
  for (const tool of tools) {
    const props = tool.inputSchema?.properties || {};
    for (const paramName of Object.keys(props)) {
      if (URL_PARAM_NAMES.includes(paramName.toLowerCase())) urlParams.push(`${tool.name}.${paramName}`);
    }
  }
  if (urlParams.length > 0) {
    findings.push({
      check: "URL_PARAMS",
      severity: "MEDIUM",
      title: `${urlParams.length} tool parameter(s) accept raw URLs`,
      description:
        "Tools with URL-type parameters are potential SSRF vectors. If an agent passes an attacker-controlled URL (e.g. from a prompt-injected web page or document), the server may fetch internal resources.",
      evidence: urlParams.join(", "),
      recommendation:
        "Validate URL parameters against a strict allowlist on the server side. Never fetch arbitrary URLs provided by LLM-generated input.",
    });
  }
}

// ── CHECK 18: OVER-PERMISSION CLAIMS ─────────────────────────────────────────
export function checkOverPermission(tools: any[], findings: any[]) {
  const hits: string[] = [];
  for (const tool of tools) {
    const text = `${tool.name} ${tool.description || ""}`;
    for (const pattern of OVER_PERMISSION_PATTERNS) {
      if (pattern.test(text)) { hits.push(`"${tool.name}": matched "${pattern.source}"`); break; }
    }
  }
  if (hits.length > 0) {
    findings.push({
      check: "OVER_PERMISSION",
      severity: "MEDIUM",
      title: "Tool(s) claiming elevated/admin permissions",
      description:
        "Tool names or descriptions contain language implying root, admin, or unrestricted access. Legitimate tools should follow least-privilege — broad permission claims warrant scrutiny.",
      evidence: hits.join("\n"),
      recommendation:
        "Verify whether these tools genuinely require elevated permissions. Prefer scoped, minimal-privilege tools.",
    });
  }
}

// ── CHECK 19: SERVER VERSION / STACK FINGERPRINTING ─────────────────────────
export function checkVersionLeakage(serverInfo: any, findings: any[]) {
  if (!serverInfo) return;
  const version = serverInfo.version || "";
  const name = serverInfo.name || "";
  const stackIndicators = ["fastapi", "express", "flask", "django", "rails", "spring", "node", "python", "ruby", "java", "php", "dotnet", ".net"];
  const leaked = stackIndicators.filter((s) => name.toLowerCase().includes(s) || version.toLowerCase().includes(s));
  if (leaked.length > 0) {
    findings.push({
      check: "VERSION_LEAK",
      severity: "LOW",
      title: "Server name/version leaks internal stack information",
      description:
        "The server's name or version string reveals implementation details (framework, runtime). This aids attackers in targeting known CVEs for that stack.",
      evidence: `name="${name}" version="${version}" → reveals: ${leaked.join(", ")}`,
      recommendation:
        "Use a generic server name and version string. Do not expose framework or runtime details.",
    });
  }
  const semverMatch = version.match(/(\d+)\.(\d+)\.(\d+)/);
  if (semverMatch) {
    const major = parseInt(semverMatch[1]);
    if (major === 0) {
      findings.push({
        check: "VERSION_LEAK",
        severity: "LOW",
        title: "Server is pre-1.0 / alpha version",
        description:
          "Version strings below 1.0.0 typically indicate unstable or early-stage software. Security practices are often not yet mature in pre-release software.",
        evidence: `version="${version}"`,
        recommendation: "Prefer stable, production-grade server versions for use in agent workflows.",
      });
    }
  }
}

// ── CHECK 20: CORS HEADERS ───────────────────────────────────────────────────
export async function checkCORSHeaders(url: string, findings: any[]) {
  try {
    const res = await fetch(url, {
      method: "OPTIONS",
      headers: {
        Origin: "https://evil.attacker.com",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, Authorization",
      },
      signal: AbortSignal.timeout(5000),
    });

    const acao = res.headers.get("access-control-allow-origin") || "";
    const acac = res.headers.get("access-control-allow-credentials") || "";

    if (acao === "*") {
      findings.push({
        check: "CORS",
        severity: "HIGH",
        title: "Wildcard CORS (Access-Control-Allow-Origin: *)",
        description:
          "The server allows requests from any origin. Combined with missing auth, this means any website can make authenticated-looking requests to this server from a victim's browser.",
        evidence: `Access-Control-Allow-Origin: ${acao}`,
        recommendation:
          "Restrict CORS to known trusted origins. Never use wildcard (*) on endpoints that accept credentials.",
      });
    } else if (acao.toLowerCase().includes("evil.attacker.com")) {
      findings.push({
        check: "CORS",
        severity: "CRITICAL",
        title: "CORS reflects arbitrary Origin header",
        description:
          "The server mirrors back any Origin header as the allowed origin. This is equivalent to wildcard CORS but bypasses some protections — any origin can make credentialed cross-origin requests.",
        evidence: `Sent Origin: evil.attacker.com → Got: ${acao}`,
        recommendation: "Use a strict allowlist of permitted origins. Never reflect the incoming Origin header.",
      });
    } else if (acao && acac.toLowerCase() === "true") {
      findings.push({
        check: "CORS",
        severity: "LOW",
        title: "CORS with credentials enabled",
        description:
          "The server allows credentialed cross-origin requests. Verify the allowed origin is strictly controlled.",
        evidence: `ACAO: ${acao} | ACAC: ${acac}`,
        recommendation: "Ensure the allowed origin is a specific, trusted domain — not dynamic.",
      });
    } else if (!acao) {
      findings.push({ check: "CORS", severity: "PASS", title: "No permissive CORS headers detected", description: "Server did not return a wildcard or reflective CORS header." });
    }
  } catch {
    findings.push({ check: "CORS", severity: "INFO", title: "CORS preflight check skipped", description: "OPTIONS request timed out or was not supported by the server." });
  }
}
