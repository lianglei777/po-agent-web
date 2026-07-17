import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const repositoryRoot = process.cwd();

function readWorkflow(name: string): string {
  return fs.readFileSync(
    path.join(repositoryRoot, ".github", "workflows", name),
    "utf8",
  );
}

describe("GitHub Actions workflows", () => {
  test("CI validates the application, Docker image, and Windows package", () => {
    const workflow = readWorkflow("ci.yml");
    const checkoutCount = workflow.match(/actions\/checkout@/g)?.length ?? 0;
    const disabledCredentialCount =
      workflow.match(/persist-credentials: false/g)?.length ?? 0;

    expect(workflow).toContain("pull_request:");
    expect(workflow).toContain("branches: [master]");
    expect(workflow).toContain("npm run check");
    expect(workflow).toContain("npm run build");
    expect(workflow).toContain("docker/build-push-action@");
    expect(workflow).toContain("push: false");
    expect(workflow).toContain("npm run desktop:pack");
    expect(workflow).toContain("Po Agent Web.exe");
    expect(workflow).not.toContain("DOCKERHUB_TOKEN");
    expect(disabledCredentialCount).toBe(checkoutCount);
  });

  test("release validates the version and publishes both deliverables", () => {
    const workflow = readWorkflow("release.yml");
    const windowsJobStart = workflow.indexOf("  windows-release:");
    const windowsStepsStart = workflow.indexOf("    steps:", windowsJobStart);
    const windowsJobHeader = workflow.slice(windowsJobStart, windowsStepsStart);
    const checkoutCount = workflow.match(/actions\/checkout@/g)?.length ?? 0;
    const disabledCredentialCount =
      workflow.match(/persist-credentials: false/g)?.length ?? 0;

    expect(workflow).toContain("tags: [\"v*.*.*\"]");
    expect(workflow).toContain(
      '[[ ! "$GITHUB_REF_NAME" =~ ^v[0-9]+\\.[0-9]+\\.[0-9]+$ ]]',
    );
    expect(workflow).toContain("npm run check");
    expect(workflow).toContain("npm run desktop:prepare");
    expect(workflow).toContain("npm exec -- electron-builder --publish never");
    expect(workflow).toContain("DOCKERHUB_USERNAME");
    expect(workflow).toContain("DOCKERHUB_TOKEN");
    expect(workflow).toContain("docker/metadata-action@");
    expect(workflow).toContain("docker/build-push-action@");
    expect(workflow).toContain("push: true");
    expect(workflow).toContain("type=semver,pattern={{version}}");
    expect(workflow).toContain("type=raw,value=latest");
    expect(workflow).toContain("gh release create");
    expect(workflow).toContain("SHA256SUMS.txt");
    expect(workflow).toContain('"v$packageVersion"');
    expect(windowsJobHeader).not.toContain("GH_TOKEN");
    expect(windowsJobHeader).not.toContain("WIN_CSC_LINK");
    expect(workflow).not.toMatch(/uses: [^\n]+@v\d/);
    expect(disabledCredentialCount).toBe(checkoutCount);
  });
});
