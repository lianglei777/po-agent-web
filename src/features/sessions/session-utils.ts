import type { Project, SessionInfo, SessionTreeNode } from "./types";

export function getSessionTitle(session: SessionInfo) {
  return (
    session.name?.trim() ||
    session.firstMessage.trim().slice(0, 50) ||
    session.id.slice(0, 12)
  );
}

export function groupSessionsByProject(
  projects: Project[],
  sessions: SessionInfo[],
) {
  return projects.map((project) => ({
    cwd: project.path,
    nodes: buildSessionTree(
      sessions.filter((session) => project.aliases.includes(session.cwd)),
    ),
  }));
}

export function getProjectName(cwd: string) {
  const segments = cwd.split(/[\\/]+/).filter(Boolean);
  return segments[segments.length - 1] ?? cwd;
}

export function shortenCwd(cwd: string, home = "") {
  const normalizedHome = home.replace(/[\\/]+$/, "");
  let display =
    normalizedHome &&
    (cwd === normalizedHome ||
      cwd.startsWith(`${normalizedHome}\\`) ||
      cwd.startsWith(`${normalizedHome}/`))
      ? `~${cwd.slice(normalizedHome.length)}`
      : cwd;
  const prefix = display.startsWith("~") ? "~" : "";
  const segments = display.split(/[\\/]+/).filter(Boolean);
  if (segments.length > 2) {
    display = `${prefix ? "~/.../" : ".../"}${segments.slice(-2).join("/")}`;
  }
  return display;
}

export function buildSessionTree(sessions: SessionInfo[]): SessionTreeNode[] {
  const allById = new Map(sessions.map((session) => [session.id, session]));
  const nodes = new Map<string, SessionTreeNode>(
    sessions.map((session) => [
      session.id,
      { session, children: [] } satisfies SessionTreeNode,
    ]),
  );
  const roots: SessionTreeNode[] = [];

  for (const session of sessions) {
    const node = nodes.get(session.id);
    if (!node) continue;
    let parentId = session.parentSessionId;
    const visited = new Set([session.id]);
    let survivingParent: string | undefined;
    while (parentId) {
      if (visited.has(parentId)) {
        survivingParent = undefined;
        break;
      }
      visited.add(parentId);
      if (nodes.has(parentId)) {
        survivingParent = parentId;
      }
      parentId = allById.get(parentId)?.parentSessionId;
    }
    if (survivingParent) {
      nodes.get(survivingParent)?.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (items: SessionTreeNode[]) => {
    items.sort((left, right) =>
      right.session.modified.localeCompare(left.session.modified),
    );
    items.forEach((item) => sortNodes(item.children));
  };
  sortNodes(roots);
  return roots;
}
