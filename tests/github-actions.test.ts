import { describe, it, expect, vi, beforeEach } from "vitest";
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
} from "../src/github-actions.js";

const TOKEN = "test-token";

describe("github-actions API", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("listWorkflows returns workflows array", async () => {
    const workflows = [
      { id: 1, name: "CI", path: ".github/workflows/ci.yml", state: "active" },
    ];
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ workflows }),
    });

    const result = await listWorkflows(TOKEN, "owner", "repo");
    expect(result).toEqual(workflows);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("id", 1);
    expect(result[0]).toHaveProperty("name", "CI");
    expect(result[0]).toHaveProperty("state", "active");
  });

  it("listRuns returns workflow runs array", async () => {
    const runs = [
      {
        id: 123,
        name: "CI",
        status: "completed",
        conclusion: "success",
        head_branch: "main",
        html_url: "https://github.com/owner/repo/actions/runs/123",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:01:00Z",
        run_number: 42,
      },
    ];
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ workflow_runs: runs }),
    });

    const result = await listRuns(TOKEN, "owner", "repo");
    expect(result).toEqual(runs);
    expect(result[0]).toHaveProperty("run_number", 42);
    expect(result[0]).toHaveProperty("status", "completed");
    expect(result[0]).toHaveProperty("conclusion", "success");
  });

  it("listRuns with workflow_id filters by workflow", async () => {
    const runs = [] as unknown[];
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ workflow_runs: runs }),
    });

    await listRuns(TOKEN, "owner", "repo", 123);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/workflows/123/runs"),
      expect.any(Object),
    );
  });

  it("getRun returns single workflow run", async () => {
    const run = {
      id: 456,
      name: "Deploy",
      status: "in_progress",
      conclusion: null,
      head_branch: "main",
      html_url: "https://github.com/owner/repo/actions/runs/456",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:02:00Z",
      run_number: 10,
    };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(run),
    });

    const result = await getRun(TOKEN, "owner", "repo", 456);
    expect(result).toEqual(run);
    expect(result.id).toBe(456);
  });

  it("getRunLogs returns logs URL message", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      url: "https://api.github.com/download/123/logs",
    });

    const result = await getRunLogs(TOKEN, "owner", "repo", 123);
    expect(result).toContain("Logs URL:");
    expect(result).toContain("https://api.github.com/download/123/logs");
  });

  it("rerunWorkflow returns success message", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.resolve({}),
    });

    const result = await rerunWorkflow(TOKEN, "owner", "repo", 789);
    expect(result).toBe("Workflow run 789 re-run triggered");
  });

  it("rerunFailedJobs returns success message", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.resolve({}),
    });

    const result = await rerunFailedJobs(TOKEN, "owner", "repo", 789);
    expect(result).toBe("Failed jobs for run 789 re-run triggered");
  });

  it("cancelRun returns success message", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.resolve({}),
    });

    const result = await cancelRun(TOKEN, "owner", "repo", 789);
    expect(result).toBe("Workflow run 789 cancelled");
  });

  it("listArtifacts returns artifacts array", async () => {
    const artifacts = [
      {
        id: 1,
        name: "build",
        size_in_bytes: 1024,
        created_at: "2026-01-01T00:00:00Z",
        expired: false,
      },
    ];
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ artifacts }),
    });

    const result = await listArtifacts(TOKEN, "owner", "repo", 123);
    expect(result).toEqual(artifacts);
    expect(result[0]).toHaveProperty("name", "build");
    expect(result[0]).toHaveProperty("size_in_bytes", 1024);
    expect(result[0]).toHaveProperty("expired", false);
  });

  it("triggerWorkflow returns success message with ref and inputs", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.resolve({}),
    });

    const result = await triggerWorkflow(
      TOKEN,
      "owner",
      "repo",
      "ci.yml",
      "main",
      { env: "staging" },
    );
    expect(result).toBe("Workflow ci.yml triggered on main");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/dispatches"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ ref: "main", inputs: { env: "staging" } }),
      }),
    );
  });

  it("throws on API error", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve("Not Found"),
    });

    await expect(listWorkflows(TOKEN, "owner", "repo")).rejects.toThrow(
      "GitHub API error 404",
    );
  });
});
