"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n/use-i18n";
import {
  installSkillPack as installSkillPackApi,
  loadSkillPacks,
  removeSkillPack as removeSkillPackApi,
} from "./api";
import { reconcileSelectedSkillPack } from "./skill-state";
import type { SkillPackLoadResult } from "./types";

const EMPTY_RESULT: SkillPackLoadResult = { packs: [] };

export function useSkillPacks(cwd: string) {
  const { t } = useI18n();
  const [result, setResult] = useState(EMPTY_RESULT);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [installingPackId, setInstallingPackId] = useState<string | null>(null);
  const [removingPackId, setRemovingPackId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refreshRequestRef = useRef<AbortController | null>(null);
  const mutationRequestRef = useRef<AbortController | null>(null);

  const applyResult = useCallback((next: SkillPackLoadResult) => {
    setResult(next);
    setSelectedPackId((current) =>
      reconcileSelectedSkillPack(next.packs, current),
    );
  }, []);

  const refresh = useCallback(async () => {
    refreshRequestRef.current?.abort();
    const controller = new AbortController();
    refreshRequestRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      applyResult(await loadSkillPacks(cwd, controller.signal));
    } catch (nextError) {
      if (!controller.signal.aborted) {
        setError(errorMessage(nextError, t.skills.somethingWentWrong));
      }
    } finally {
      if (refreshRequestRef.current === controller) {
        refreshRequestRef.current = null;
        setLoading(false);
      }
    }
  }, [applyResult, cwd, t.skills.somethingWentWrong]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => {
      window.clearTimeout(timer);
      refreshRequestRef.current?.abort();
      mutationRequestRef.current?.abort();
    };
  }, [refresh]);

  const selectedPack = useMemo(
    () => result.packs.find((pack) => pack.packId === selectedPackId) ?? null,
    [result.packs, selectedPackId],
  );

  const install = useCallback(
    async (
      packId: string,
      scope: "global" | "project",
    ): Promise<boolean> => {
      if (mutationRequestRef.current) return false;
      refreshRequestRef.current?.abort();
      refreshRequestRef.current = null;
      setLoading(false);
      const controller = new AbortController();
      mutationRequestRef.current = controller;
      setInstallingPackId(packId);
      setError(null);
      try {
        applyResult(
          await installSkillPackApi({ packId, scope, cwd }, controller.signal),
        );
        return true;
      } catch (nextError) {
        if (!controller.signal.aborted) {
          setError(errorMessage(nextError, t.skills.somethingWentWrong));
        }
        return false;
      } finally {
        if (mutationRequestRef.current === controller) {
          mutationRequestRef.current = null;
          setInstallingPackId(null);
        }
      }
    },
    [applyResult, cwd, t.skills.somethingWentWrong],
  );

  const remove = useCallback(
    async (packId: string): Promise<boolean> => {
      if (mutationRequestRef.current) return false;
      refreshRequestRef.current?.abort();
      refreshRequestRef.current = null;
      setLoading(false);
      const controller = new AbortController();
      mutationRequestRef.current = controller;
      setRemovingPackId(packId);
      setError(null);
      try {
        applyResult(
          await removeSkillPackApi({ packId, cwd }, controller.signal),
        );
        return true;
      } catch (nextError) {
        if (!controller.signal.aborted) {
          setError(errorMessage(nextError, t.skills.somethingWentWrong));
        }
        return false;
      } finally {
        if (mutationRequestRef.current === controller) {
          mutationRequestRef.current = null;
          setRemovingPackId(null);
        }
      }
    },
    [applyResult, cwd, t.skills.somethingWentWrong],
  );

  return {
    ...result,
    error,
    install,
    installingPackId,
    loading,
    refresh,
    remove,
    removingPackId,
    selectedPack,
    selectedPackId,
    setSelectedPackId,
  };
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
