export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  instructions: string;
  mcp_sse_endpoints: string[];
  category: string;
  price: number;
  stars: number;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface UserAgent {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  instructions: string;
  mcp_sse_endpoints: string[];
  github_repo?: string;
  cloud_run_url?: string;
  github_username?: string;
  status: "active" | "inactive" | "paused" | "deploying";
  created_at: string;
  updated_at: string;
}
