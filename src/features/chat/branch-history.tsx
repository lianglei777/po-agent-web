"use client";

import { Check, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/i18n/use-i18n";
import { collectLeaves } from "./branch-leaves";
import type { SessionTreeNode } from "./agent-types";

// 取叶子节点上可读的首行摘要,用于下拉项标签;无法提取时回退到短 id。
function leafSummary(node: SessionTreeNode): string {
  const fallback = node.label ?? node.entry.id.slice(0, 8);
  const message = node.entry.message;
  if (!message || typeof message !== "object" || !("content" in message)) {
    return fallback;
  }
  const content = (message as { content: unknown }).content;
  let text = "";
  if (typeof content === "string") {
    text = content;
  } else if (Array.isArray(content)) {
    text = content
      .filter(
        (block): block is { type: "text"; text: string } =>
          typeof block === "object" &&
          block !== null &&
          (block as { type?: string }).type === "text" &&
          typeof (block as { text?: unknown }).text === "string",
      )
      .map((block) => block.text)
      .join(" ");
  }
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  return firstLine.slice(0, 60) || fallback;
}

export function BranchHistory({
  tree,
  activeLeafId,
  onChangeLeaf,
}: {
  tree: SessionTreeNode[];
  activeLeafId: string | null;
  onChangeLeaf: (leafId: string) => void;
}) {
  const { t } = useI18n();
  const leaves = collectLeaves(tree);
  if (leaves.length <= 1) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="h-7 gap-1.5 px-2 text-[11px]"
          size="sm"
          type="button"
          variant="ghost"
        >
          <GitBranch className="size-3.5" />
          {t.chat.message.branchHistory}
          <span className="text-dim">{leaves.length}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom">
        {leaves.map((node) => {
          const active = node.entry.id === activeLeafId;
          return (
            <DropdownMenuItem
              key={node.entry.id}
              onSelect={() => onChangeLeaf(node.entry.id)}
            >
              <Check className={active ? "size-3.5" : "size-3.5 opacity-0"} />
              <span className="min-w-0 truncate">
                {leafSummary(node) || node.entry.id.slice(0, 8)}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
