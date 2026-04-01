import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { NextRequest, NextResponse } from "next/server";
import {
  checkRugPull,
  checkCrossOriginShadowing,
  checkOAuthScopes,
  checkSensitiveDataInResources,
  checkSchemaStrictness,
  checkResourceSSRF,
  checkPromptInjection,
  checkDescriptionEntropy,
  checkDuplicateTools,
  checkUrlParams,
  checkOverPermission,
  checkVersionLeakage,
  checkCORSHeaders,
} from "@/lib/mcp-security-checks-extended";

const INJECTION_PATTERNS = [
  { pattern: /<IMPORTANT>/i,           label: "Hidden <IMPORTANT> tag" },
  { pattern: /\[SYSTEM\]/i,            label: "Hidden [SYSTEM] marker" },
  { pattern: /\[INST\]/i,              label: "Hidden [INST] marker" },
  { pattern: /ignore previous/i,       label: "Instruction override attempt" },
  { pattern: /ignore all instructions/i, label: "Instruction override attempt" },
  { pattern: /do not tell the user/i,  label: "Concealment instruction" },
  { pattern: /do not mention/i,        label: "Concealment instruction" },
  { pattern: /keep this secret/i,      label: "Concealment instruction" },
  { pattern: /don't tell/i,            label: "Concealment instruction" },
  { pattern: /without the user knowing/i, label: "Concealment instruction" },
  { pattern: /without telling the user/i, label: "Concealment instruction" },
  { pattern: /exfiltrate/i,            label: "Data exfiltration keyword" },
  { pattern: /send.*to.*http/i,        label: "Suspicious HTTP send instruction" },
  { pattern: /before using this tool.*read/i, label: "File read injection pattern" },
  { pattern: /pass its content/i,      label: "Data extraction pattern" },
  { pattern: /\~\/\.cursor/i,          label: "Cursor config path reference" },
  { pattern: /mcp\.json/i,             label: "MCP config file reference" },
  { pattern: /\.ssh\/id/i,             label: "SSH key path reference" },
  { pattern: /~\/.aws/i,               label: "AWS credentials path reference" },
  { pattern: /\/etc\/passwd/i,         label: "System file reference" },
  { pattern: /[\u200b-\u200f\u202a-\u202e\ufeff]/, label: "Invisible/zero-width characters detected" },
  { pattern: /\s{50,}/,                label: "Excessive whitespace (possible content hiding)" },
];

const SHADOW_TOOL_NAMES = [
  "read_file", "write_file", "execute_command", "run_command",
  "bash", "shell", "terminal", "list_directory", "delete_file",
  "send_email", "send_message", "http_request", "fetch",
  "memory_store", "memory_read", "browser_navigate",
];

const DANGEROUS_CAPABILITIES = ["roots", "sampling"];

export async function POST(req: NextRequest) {
  const { url, token } = await req.json();
  const findings: any[] = [];

  const isTLS = url.startsWith("https://");
  if (!isTLS) {
    findings.push({
      check: "TLS",
      severity: "HIGH",
      title: "Server not using HTTPS",
      description:
        "The server URL uses plain HTTP. All MCP communication including auth tokens and tool results will be transmitted unencrypted.",
      evidence: url,
      recommendation: "Ensure your MCP server is accessible over HTTPS before using in production.",
    });
  } else {
    findings.push({ check: "TLS", severity: "PASS", title: "HTTPS enabled", description: "Server uses TLS encryption." });
  }

  let tools: any[] = [];
  let resources: any[] = [];
  let prompts: any[] = [];
  let serverInfo: any = null;

  try {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const transport = new StreamableHTTPClientTransport(new URL(url), { requestInit: { headers } });
    const client = new Client({ name: "agentaim-security-scanner", version: "1.0.0" });
    await client.connect(transport);

    serverInfo = client.getServerVersion?.();

    if (token) {
      try {
        const unauthTransport = new StreamableHTTPClientTransport(new URL(url), {});
        const unauthClient = new Client({ name: "agentaim-security-scanner", version: "1.0.0" });
        await unauthClient.connect(unauthTransport);
        findings.push({
          check: "AUTH",
          severity: "HIGH",
          title: "Server accepts unauthenticated connections",
          description:
            "Even though a token was provided, the server also responds to requests without any authentication. Anyone can connect to this server.",
          recommendation: "Enforce authentication on all endpoints. Return 401 for unauthenticated requests.",
        });
        await unauthClient.close();
      } catch {
        findings.push({ check: "AUTH", severity: "PASS", title: "Authentication enforced", description: "Server correctly rejects unauthenticated connections." });
      }
    } else {
      findings.push({
        check: "AUTH",
        severity: "MEDIUM",
        title: "No authentication token provided",
        description:
          "No bearer token was supplied. If this server is public without auth, any client can connect and invoke tools.",
        recommendation: "Use a bearer token to authenticate. Check if the server requires auth.",
      });
    }

    try { const r = await client.listTools();     tools     = r.tools     || []; } catch {}
    try { const r = await client.listResources();  resources = r.resources || []; } catch {}
    try { const r = await client.listPrompts();    prompts   = r.prompts   || []; } catch {}

    const poisonedTools: string[] = [];
    for (const tool of tools) {
      const text = [ tool.description || "", JSON.stringify(tool.inputSchema || {}) ].join(" ");
      const hits: string[] = [];
      for (const { pattern, label } of INJECTION_PATTERNS) {
        if (pattern.test(text)) hits.push(label);
      }
      if (hits.length > 0) {
        poisonedTools.push(tool.name);
        findings.push({
          check: "TOOL_POISON",
          severity: "CRITICAL",
          title: `Prompt injection detected in tool: "${tool.name}"`,
          description:
            "This tool's description or schema contains patterns commonly used in tool poisoning attacks. These instructions are visible to LLMs but hidden from users, and can manipulate AI agents into exfiltrating data or performing unauthorized actions.",
          evidence: hits.join("\n"),
          recommendation:
            "Do not connect to this server. Report the server to the agentaim team for review.",
        });
      }
    }

    if (tools.length > 0 && poisonedTools.length === 0) {
      findings.push({ check: "TOOL_POISON", severity: "PASS", title: "No prompt injection patterns detected", description: `Scanned ${tools.length} tool description(s) — no known injection patterns found.` });
    }

    for (const tool of tools) {
      const props = tool.inputSchema?.properties || {};
      for (const [paramName, paramSchema] of Object.entries(props) as any[]) {
        const desc = paramSchema?.description || "";
        if (desc.length > 500) {
          findings.push({
            check: "SCHEMA_ABUSE",
            severity: "HIGH",
            title: `Oversized parameter description in "${tool.name}.${paramName}"`,
            description:
              `Parameter descriptions should be brief. A ${desc.length}-character description is highly unusual and may be hiding injected instructions.`,
            evidence: desc.slice(0, 200) + "…",
            recommendation: "Inspect the full description manually before using this tool.",
          });
        }
        const suspicious = ["sidenote", "context_hint", "extra", "metadata_pass", "internal_note"];
        if (suspicious.includes(paramName.toLowerCase())) {
          findings.push({
            check: "SCHEMA_ABUSE",
            severity: "HIGH",
            title: `Suspicious parameter name "${paramName}" in tool "${tool.name}"`,
            description:
              "This parameter name is commonly used in known tool poisoning proof-of-concept attacks to silently pass exfiltrated data.",
            recommendation: "Do not invoke this tool. Review the server source code.",
          });
        }
      }
    }

    const shadowHits = tools.filter((t) => SHADOW_TOOL_NAMES.includes(t.name.toLowerCase()));
    if (shadowHits.length > 0) {
      findings.push({
        check: "SHADOW_TOOLS",
        severity: "MEDIUM",
        title: `${shadowHits.length} tool(s) with privileged system-level names`,
        description:
          "Tools named after common system operations (file read/write, shell execution) may shadow trusted tools in multi-server setups, hijacking calls meant for other servers.",
        evidence: shadowHits.map((t) => t.name).join(", "),
        recommendation:
          "Verify these tools are from a trusted source. In multi-server agent setups, name collisions can be exploited.",
      });
    }

    const caps = (serverInfo as any)?.capabilities || {};
    const dangerousCaps = DANGEROUS_CAPABILITIES.filter((c) => caps[c]);
    if (dangerousCaps.length > 0) {
      findings.push({
        check: "CAPABILITY",
        severity: "MEDIUM",
        title: `Server exposes elevated capabilities: ${dangerousCaps.join(", ")}`,
        description:
          "These capability flags grant the server elevated access. 'roots' allows filesystem access; 'sampling' allows the server to invoke LLM calls itself.",
        recommendation: "Only enable these capabilities for servers you fully trust and control.",
      });
    }

    if (tools.length > 50) {
      findings.push({
        check: "ANOMALY",
        severity: "LOW",
        title: `Unusually high tool count (${tools.length} tools)`,
        description:
          "Servers with very large numbers of tools increase the attack surface and make manual review impractical. This is worth noting.",
        recommendation: "Review whether all tools are necessary.",
      });
    }

    // Run extended checks (additional static analyses)
    try {
      await checkRugPull(url, token, findings);
      checkCrossOriginShadowing(tools, findings);
      checkOAuthScopes(tools, findings);
      await checkSensitiveDataInResources(url, token, resources, findings);
      checkSchemaStrictness(tools, findings);
      checkResourceSSRF(resources, findings);
      checkPromptInjection(prompts, findings);
      checkDescriptionEntropy(tools, findings);
      checkDuplicateTools(tools, findings);
      checkUrlParams(tools, findings);
      checkOverPermission(tools, findings);
      checkVersionLeakage(serverInfo, findings);
      await checkCORSHeaders(url, findings);
    } catch (ex: any) {
      findings.push({ check: "EXTENDED_CHECKS_ERROR", severity: "INFO", title: "Extended checks error", description: ex?.message || String(ex) });
    }

    await client.close();
  } catch (e: any) {
    findings.push({
      check: "CONNECT",
      severity: "CRITICAL",
      title: "Failed to connect to server",
      description: `Could not establish a connection: ${e.message}`,
      recommendation:
        "Verify the server URL and that the server is running. If you supplied a token, check it is valid.",
    });
  }

  return NextResponse.json({
    url,
    serverInfo,
    toolCount: tools.length,
    resourceCount: resources.length,
    promptCount: prompts.length,
    findings,
    scannedAt: new Date().toISOString(),
  });
}
