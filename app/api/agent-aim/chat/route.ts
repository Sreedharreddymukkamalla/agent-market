import { createClient } from "@/utils/supabase/server";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createMCPClient } from "@ai-sdk/mcp";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages, mcpEndpoints } = body;

  const allClients: any[] = [];
  const allTools: any = {};

  if (Array.isArray(mcpEndpoints) && mcpEndpoints.length > 0) {
    for (const url of mcpEndpoints) {
      try {
        const transport = new SSEClientTransport(new URL(url));
        await transport.start();
        // createMCPClient returns a Promise<MCPClient>
        const client = await createMCPClient({ transport });
        // Fetch tools from the remote server
        const remoteTools = await client.tools();
        Object.assign(allTools, remoteTools);
        allClients.push(client);
      } catch (e) {
        console.error(`Failed to load MCP tools from ${url}:`, e);
      }
    }
  }

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    system: "You are Agent Aim, a concise assistant inside Agent Market. Use the provided tools if needed to answer the user's questions.",
    messages: (messages || []).map((m: any) => ({
      role: m.role,
      content: m.content,
    })),
    tools: allTools,
    // @ts-ignore - maxSteps is supported in runtime for AI SDK 3.x+
    maxSteps: 5,
    onFinish: async () => {
      // Cleanup connections
      for (const client of allClients) {
        try {
          await client.close();
        } catch (e) {
          console.error("Error closing MCP client:", e);
        }
      }
    },
  });

  // @ts-ignore - toDataStreamResponse is the standard way to return a stream in AI SDK 3.x+
  return result.toDataStreamResponse();
}
