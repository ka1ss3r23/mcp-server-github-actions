import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  listWorkflows,
  listRuns,
  getRun,
  getRunLogs,
  rerunWorkflow,
  rerunFailedJobs,
  cancelRun,
  listArtifacts,
  triggerWorkflow,
} from "./github-actions.js";

const server = new McpServer({
  name: "mcp-server-github-actions",
  version: "1.0.0",
});

function getToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "GITHUB_TOKEN environment variable is required. Create a token at https://github.com/settings/tokens",
    );
  }
  return token;
}

server.tool(
  "list_workflows",
  "List all workflow files in a GitHub repository.",
  {
    owner: z.string().describe("Repository owner (username or org)"),
    repo: z.string().describe("Repository name"),
  },
  async ({ owner, repo }) => {
    const token = getToken();
    const workflows = await listWorkflows(token, owner, repo);
    const text =
      workflows.length === 0
        ? "No workflows found."
        : workflows
            .map((w) => `id: ${w.id}  name: ${w.name}  state: ${w.state}`)
            .join("\n");
    return { content: [{ type: "text", text }] };
  },
);

server.tool(
  "list_runs",
  "List workflow runs for a repository. Optionally filter by workflow or status.",
  {
    owner: z.string().describe("Repository owner (username or org)"),
    repo: z.string().describe("Repository name"),
    workflow_id: z
      .number()
      .optional()
      .describe("Workflow ID to filter runs (from list_workflows)"),
    status: z
      .string()
      .optional()
      .describe("Filter by status: completed, in_progress, queued, etc."),
    per_page: z
      .number()
      .optional()
      .default(10)
      .describe("Number of runs to return (default 10)"),
  },
  async ({ owner, repo, workflow_id, status, per_page }) => {
    const token = getToken();
    const runs = await listRuns(
      token,
      owner,
      repo,
      workflow_id,
      status,
      per_page,
    );
    const text =
      runs.length === 0
        ? "No runs found."
        : runs
            .map(
              (r) =>
                `#${r.run_number}  ${r.name}  status: ${r.status}  conclusion: ${r.conclusion ?? "—"}  branch: ${r.head_branch}  ${r.html_url}`,
            )
            .join("\n");
    return { content: [{ type: "text", text }] };
  },
);

server.tool(
  "get_run",
  "Get details of a specific workflow run.",
  {
    owner: z.string().describe("Repository owner (username or org)"),
    repo: z.string().describe("Repository name"),
    run_id: z.number().describe("Workflow run ID"),
  },
  async ({ owner, repo, run_id }) => {
    const token = getToken();
    const run = await getRun(token, owner, repo, run_id);
    const text = [
      `Run #${run.run_number}: ${run.name}`,
      `Status: ${run.status}  Conclusion: ${run.conclusion ?? "—"}`,
      `Branch: ${run.head_branch}`,
      `URL: ${run.html_url}`,
      `Created: ${run.created_at}  Updated: ${run.updated_at}`,
    ].join("\n");
    return { content: [{ type: "text", text }] };
  },
);

server.tool(
  "get_run_logs",
  "Get logs URL for a workflow run. GitHub returns a redirect to a zip file.",
  {
    owner: z.string().describe("Repository owner (username or org)"),
    repo: z.string().describe("Repository name"),
    run_id: z.number().describe("Workflow run ID"),
  },
  async ({ owner, repo, run_id }) => {
    const token = getToken();
    const logs = await getRunLogs(token, owner, repo, run_id);
    return { content: [{ type: "text", text: logs }] };
  },
);

server.tool(
  "rerun_workflow",
  "Re-run a complete workflow run.",
  {
    owner: z.string().describe("Repository owner (username or org)"),
    repo: z.string().describe("Repository name"),
    run_id: z.number().describe("Workflow run ID"),
  },
  async ({ owner, repo, run_id }) => {
    const token = getToken();
    const result = await rerunWorkflow(token, owner, repo, run_id);
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "rerun_failed_jobs",
  "Re-run only the failed jobs from a workflow run.",
  {
    owner: z.string().describe("Repository owner (username or org)"),
    repo: z.string().describe("Repository name"),
    run_id: z.number().describe("Workflow run ID"),
  },
  async ({ owner, repo, run_id }) => {
    const token = getToken();
    const result = await rerunFailedJobs(token, owner, repo, run_id);
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "cancel_run",
  "Cancel a workflow run that is in progress or queued.",
  {
    owner: z.string().describe("Repository owner (username or org)"),
    repo: z.string().describe("Repository name"),
    run_id: z.number().describe("Workflow run ID"),
  },
  async ({ owner, repo, run_id }) => {
    const token = getToken();
    const result = await cancelRun(token, owner, repo, run_id);
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "list_artifacts",
  "List artifacts produced by a workflow run.",
  {
    owner: z.string().describe("Repository owner (username or org)"),
    repo: z.string().describe("Repository name"),
    run_id: z.number().describe("Workflow run ID"),
  },
  async ({ owner, repo, run_id }) => {
    const token = getToken();
    const artifacts = await listArtifacts(token, owner, repo, run_id);
    const text =
      artifacts.length === 0
        ? "No artifacts found."
        : artifacts
            .map(
              (a) =>
                `name: ${a.name}  size: ${a.size_in_bytes} bytes  expired: ${a.expired ? "yes" : "no"}`,
            )
            .join("\n");
    return { content: [{ type: "text", text }] };
  },
);

server.tool(
  "trigger_workflow",
  "Trigger a workflow run via workflow_dispatch. Requires a workflow with workflow_dispatch enabled.",
  {
    owner: z.string().describe("Repository owner (username or org)"),
    repo: z.string().describe("Repository name"),
    workflow_id: z.string().describe("Workflow ID or filename (e.g. ci.yml)"),
    ref: z
      .string()
      .optional()
      .default("main")
      .describe("Branch or tag to run on (default: main)"),
    inputs: z
      .record(z.string())
      .optional()
      .describe("Optional workflow inputs as key-value pairs"),
  },
  async ({ owner, repo, workflow_id, ref, inputs }) => {
    const token = getToken();
    const result = await triggerWorkflow(
      token,
      owner,
      repo,
      workflow_id,
      ref,
      inputs,
    );
    return { content: [{ type: "text", text: result }] };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
