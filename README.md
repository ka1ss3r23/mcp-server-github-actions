# mcp-server-github-actions

[![npm version](https://img.shields.io/npm/v/mcp-server-github-actions.svg)](https://www.npmjs.com/package/mcp-server-github-actions)
[![npm downloads](https://img.shields.io/npm/dm/mcp-server-github-actions.svg)](https://www.npmjs.com/package/mcp-server-github-actions)
[![CI](https://github.com/ofershap/mcp-server-github-actions/actions/workflows/ci.yml/badge.svg)](https://github.com/ofershap/mcp-server-github-actions/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Manage GitHub Actions workflows directly from your AI assistant — list runs, read logs, re-run failed jobs, cancel builds, and trigger deployments.

```bash
npx mcp-server-github-actions
```

> Works with Claude Desktop, Cursor, VS Code Copilot, and any MCP client. Requires a GitHub token with Actions read/write permissions.

![Demo](assets/demo.gif)

## Tools

| Tool                | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| `list_workflows`    | List all workflow files in a repository                      |
| `list_runs`         | List workflow runs (optionally filter by workflow or status) |
| `get_run`           | Get details of a specific workflow run                       |
| `get_run_logs`      | Get the logs URL for a run (zip file download)               |
| `rerun_workflow`    | Re-run an entire workflow run                                |
| `rerun_failed_jobs` | Re-run only the failed jobs from a run                       |
| `cancel_run`        | Cancel an in-progress or queued run                          |
| `list_artifacts`    | List artifacts produced by a workflow run                    |
| `trigger_workflow`  | Trigger a workflow via `workflow_dispatch`                   |

## Quick Start

### Cursor

Add to your Cursor MCP settings (e.g. `~/.cursor/mcp.json` or project-level):

```json
{
  "mcpServers": {
    "github-actions": {
      "command": "npx",
      "args": ["-y", "mcp-server-github-actions"],
      "env": {
        "GITHUB_TOKEN": "<your-token>"
      }
    }
  }
}
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "github-actions": {
      "command": "npx",
      "args": ["-y", "mcp-server-github-actions"],
      "env": {
        "GITHUB_TOKEN": "<your-token>"
      }
    }
  }
}
```

### VS Code (Continue / Aider / Copilot)

Configure your MCP client to run:

```bash
npx mcp-server-github-actions
```

Ensure `GITHUB_TOKEN` is set in the environment (e.g. in your shell profile or client config).

## Auth

Create a GitHub Personal Access Token:

1. **Settings** → **Developer settings** → **Personal access tokens**
2. Choose **Fine-grained tokens** (recommended) or **Tokens (classic)**
3. **Fine-grained**: Under "Repository access", select your repos. Under permissions, enable **Actions: Read and Write**
4. **Classic**: Enable the `repo` scope (includes Actions)

For fine-grained tokens: **Actions: Read and Write** is required for listing runs, re-running, cancelling, and triggering workflows.

## Example Prompts

- "List the last 5 workflow runs for ofershap/mcp-server-docker"
- "Show me the workflows in the microsoft/vscode repo"
- "Get details for run 12345 in owner/repo"
- "Re-run the failed jobs for run 67890 in my-org/my-repo"
- "Cancel the currently running workflow run 11111"
- "List artifacts from the latest run in owner/repo"
- "Trigger the deploy.yml workflow on the staging branch for my-org/my-app"
- "What’s the status of the most recent CI run for this project?"

## Development

```bash
npm install
npm run typecheck
npm run build
npm test
npm run lint
npm run format
```

## Author

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Ofer%20Shapira-0077B5?logo=linkedin)](https://www.linkedin.com/in/ofershapira)
[![GitHub](https://img.shields.io/badge/GitHub-ofershap-181717?logo=github)](https://github.com/ofershap)

## License

MIT
