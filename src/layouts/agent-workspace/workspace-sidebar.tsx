import {
  Cpu,
  MessageSquarePlus,
  Moon,
  Sparkles,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SessionSidebar,
  type SessionSidebarProps,
} from "@/features/sessions/session-sidebar";
import { useI18n } from "@/i18n/use-i18n";
import type { WorkspaceView } from "./workspace-navigation";

export type WorkspaceSidebarProps = {
  activeView: WorkspaceView;
  dark: boolean;
  onNewChat: () => void;
  onOpenModelProvider: () => void;
  onOpenSkills: () => void;
  onToggleTheme: () => void;
  sessionProps: SessionSidebarProps;
};

export function WorkspaceSidebar({
  activeView,
  dark,
  onNewChat,
  onOpenModelProvider,
  onOpenSkills,
  onToggleTheme,
  sessionProps,
}: WorkspaceSidebarProps) {
  const { locale, setLocale, t } = useI18n();
  const nextLocale = locale === "zh" ? "en" : "zh";
  const selectedCwd = sessionProps.selectedCwd;

  return (
    <div className="flex h-full min-h-0 flex-col bg-panel p-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              aria-current={activeView === "chat" ? "page" : undefined}
              className="w-full justify-start"
              disabled={!selectedCwd}
              onClick={onNewChat}
              type="button"
              variant="ghost"
            >
              <MessageSquarePlus />
              {t.workspace.newChat}
            </Button>
          </span>
        </TooltipTrigger>
        {!selectedCwd ? (
          <TooltipContent>{t.chat.input.selectProjectBeforeStart}</TooltipContent>
        ) : null}
      </Tooltip>

      <Button
        aria-current={activeView === "model-provider" ? "page" : undefined}
        className="mt-0.5 w-full justify-start"
        onClick={onOpenModelProvider}
        type="button"
        variant={activeView === "model-provider" ? "secondary" : "ghost"}
      >
        <Cpu />
        {t.workspace.modelProvider}
      </Button>

      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              aria-current={activeView === "skills" ? "page" : undefined}
              className="mt-0.5 w-full justify-start"
              disabled={!selectedCwd}
              onClick={onOpenSkills}
              type="button"
              variant={activeView === "skills" ? "secondary" : "ghost"}
            >
              <Sparkles />
              {t.workspace.skills}
            </Button>
          </span>
        </TooltipTrigger>
        {!selectedCwd ? (
          <TooltipContent>{t.workspace.selectProjectForSkills}</TooltipContent>
        ) : null}
      </Tooltip>

      <SessionSidebar {...sessionProps} />

      <div className="mt-auto flex gap-1 border-t border-line-subtle pt-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={
                dark ? t.workspace.useLightTheme : t.workspace.useDarkTheme
              }
              aria-pressed={dark}
              onClick={onToggleTheme}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              {dark ? <Sun /> : <Moon />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {dark ? t.workspace.useLightTheme : t.workspace.useDarkTheme}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={
                nextLocale === "zh"
                  ? t.common.switchToChinese
                  : t.common.switchToEnglish
              }
              onClick={() => setLocale(nextLocale)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <span className="font-ui-mono text-[10px] font-semibold">
                {locale === "zh" ? "中" : "EN"}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {nextLocale === "zh"
              ? t.common.switchToChinese
              : t.common.switchToEnglish}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
