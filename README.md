# AgentMarket

AgentMarket is a comprehensive platform for discovering, deploying, and managing AI agents. Built using **Next.js 15** and **HeroUI**, it features a robust marketplace, a powerful dashboard for agent management, and integration with the **Model Context Protocol (MCP)**.

## 🚀 Technologies Used

- **Framework**: [Next.js 15](https://nextjs.org/docs/getting-started) (App Router)
- **UI Components**: [HeroUI v3](https://heroui.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Tailwind Variants](https://tailwind-variants.org), React Hooks
- **Database**: [Supabase](https://supabase.com/)
- **AI Integration**: [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## 📂 Project Structure & Pages

The application is organized into three main areas: **Marketing**, **Marketplace**, and **Dashboard**.

### 🌐 Public Marketing Site (`app/(marketing)`)
Designed for discovery and user onboarding.
- **Home (`/`)**: High-impact landing page showcasing the platform's core value.
- **About (`/about`)**: Background information and vision for the Agent Market.
- **Auth (`/auth`)**: Complete authentication flow including login and signup.
- **Blog (`/blog`)**: Platform updates, news, and technical articles.
- **Docs (`/docs`)**: Comprehensive guides and documentation for users and developers.
- **Pricing (`/pricing`)**: Detailed breakdown of subscription tiers and features.
- **Verify (`/verify`)**: Account and email verification processing.

### 🛒 Agent Marketplace (`app/agent-market`)
The central hub for exploring and selecting AI agents.
- **Browse (`/agent-market`)**: A searchable, filterable gallery of all available agents.
- **Agent Detail (`/agent-market/[agent]`)**: Deep-dive page for a specific agent, including its capabilities, metadata, and reviews.

### 📊 User Dashboard (`app/dashboard`)
The administrative area for managing deployed agents and account settings.
- **Overview (`/dashboard/overview`)**: Personal stats, activity summaries, and recent deployments.
- **My Agents (`/dashboard/agents`)**: Central management for your deployed and personal AI agents.
- **Marketplace Tool (`/dashboard/marketplace`)**: A specialized version of the marketplace optimized for quick deployment.
- **MCP Scanner (`/dashboard/mcp-scanner`)**: Utility for discovering and scanning new MCP endpoints.
- **MCP Inspection (`/dashboard/mcp-inspection`)**: Advanced tool for inspecting and debugging MCP configurations.
- **Agent AIM (`/dashboard/agent-aim`)**: Advanced AI management interface for interacting with "Agent AIM" features.
- **Billing (`/dashboard/billing`)**: Manage subscriptions, payment methods, and invoices.
- **Settings (`/dashboard/settings`)**: Customize your profile, notifications, and security preferences.

### 🔌 API Routes (`app/api`)
Backend logic powering the platform.
- **`/api/agent-aim`**: Interactions and management for AI Agent AIM.
- **`/api/agent-market`**: Data fetching and management for marketplace operations.
- **`/api/mcp`**: Core logic for handling Model Context Protocol integrations.

## 🛠️ Development

### Getting Started
1. **Clone the repository**
2. **Install dependencies**: `npm install`, `pnpm install`, or `yarn install`.
3. **Set up Environment Variables**: Create a `.env.local` file with your credentials (Supabase, API keys).
4. **Run the development server**:
   ```bash
   npm run dev
   ```

### Folder Overview
- **`components/`**: Reusable UI components, including dashboard-specific controls.
- **`lib/`**: Business logic, API clients, and shared library code.
- **`config/`**: Global configuration files and site metadata.
- **`hooks/`**: Custom React hooks for data fetching and state logic.
- **`types/`**: TypeScript interfaces and types across the project.
- **`public/`**: Static assets like logos, images, and fonts.

## 📜 License
Licensed under the [MIT license](LICENSE).
