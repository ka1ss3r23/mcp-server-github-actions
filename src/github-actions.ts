const API_BASE = "https://api.github.com";

interface RequestOptions {
  method?: string;
  body?: unknown;
}

async function ghFetch<T>(
  token: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${text}`);
  }
  if (response.status === 204) return {} as T;
  return response.json() as Promise<T>;
}

export interface Workflow {
  id: number;
  name: string;
  path: string;
  state: string;
}

export interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  head_branch: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  run_number: number;
}

export interface Artifact {
  id: number;
  name: string;
  size_in_bytes: number;
  created_at: string;
  expired: boolean;
}

export async function listWorkflows(
  token: string,
  owner: string,
  repo: string,
): Promise<Workflow[]> {
  const data = await ghFetch<{ workflows: Workflow[] }>(
    token,
    `/repos/${owner}/${repo}/actions/workflows`,
  );
  return data.workflows;
}

export async function listRuns(
  token: string,
  owner: string,
  repo: string,
  workflowId?: number,
  status?: string,
  perPage = 10,
): Promise<WorkflowRun[]> {
  const params = new URLSearchParams({ per_page: String(perPage) });
  if (status) params.set("status", status);
  const path = workflowId
    ? `/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs?${params}`
    : `/repos/${owner}/${repo}/actions/runs?${params}`;
  const data = await ghFetch<{ workflow_runs: WorkflowRun[] }>(token, path);
  return data.workflow_runs;
}

export async function getRun(
  token: string,
  owner: string,
  repo: string,
  runId: number,
): Promise<WorkflowRun> {
  return ghFetch<WorkflowRun>(
    token,
    `/repos/${owner}/${repo}/actions/runs/${runId}`,
  );
}

export async function getRunLogs(
  token: string,
  owner: string,
  repo: string,
  runId: number,
): Promise<string> {
  const response = await fetch(
    `${API_BASE}/repos/${owner}/${repo}/actions/runs/${runId}/logs`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      redirect: "follow",
    },
  );
  if (!response.ok) {
    throw new Error(
      `GitHub API error ${response.status}: ${await response.text()}`,
    );
  }
  return `Logs URL: ${response.url}\n(GitHub returns a redirect to a zip file — download it to inspect logs)`;
}

export async function rerunWorkflow(
  token: string,
  owner: string,
  repo: string,
  runId: number,
): Promise<string> {
  await ghFetch(token, `/repos/${owner}/${repo}/actions/runs/${runId}/rerun`, {
    method: "POST",
  });
  return `Workflow run ${runId} re-run triggered`;
}

export async function rerunFailedJobs(
  token: string,
  owner: string,
  repo: string,
  runId: number,
): Promise<string> {
  await ghFetch(
    token,
    `/repos/${owner}/${repo}/actions/runs/${runId}/rerun-failed-jobs`,
    { method: "POST" },
  );
  return `Failed jobs for run ${runId} re-run triggered`;
}

export async function cancelRun(
  token: string,
  owner: string,
  repo: string,
  runId: number,
): Promise<string> {
  await ghFetch(token, `/repos/${owner}/${repo}/actions/runs/${runId}/cancel`, {
    method: "POST",
  });
  return `Workflow run ${runId} cancelled`;
}

export async function listArtifacts(
  token: string,
  owner: string,
  repo: string,
  runId: number,
): Promise<Artifact[]> {
  const data = await ghFetch<{ artifacts: Artifact[] }>(
    token,
    `/repos/${owner}/${repo}/actions/runs/${runId}/artifacts`,
  );
  return data.artifacts;
}

export async function triggerWorkflow(
  token: string,
  owner: string,
  repo: string,
  workflowId: number | string,
  ref: string,
  inputs?: Record<string, string>,
): Promise<string> {
  await ghFetch(
    token,
    `/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
    {
      method: "POST",
      body: { ref, inputs: inputs ?? {} },
    },
  );
  return `Workflow ${workflowId} triggered on ${ref}`;
}
