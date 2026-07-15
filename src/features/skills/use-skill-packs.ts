"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n/use-i18n";
import {
  installSkillPack as installSkillPackApi,
  installSkillPackSource as installSkillPackSourceApi,
  loadSkillPacks,
  removeSkillPack as removeSkillPackApi,
  repairSkillPack as repairSkillPackApi,
  updateSkillPack as updateSkillPackApi,
} from "./api";
import { reconcileSelectedSkillPack } from "./skill-state";
import type { SkillPackLoadResult } from "./types";

const EMPTY_RESULT: SkillPackLoadResult = { packs: [] };

type PackMutation = {
  operation: "install" | "install-source" | "remove" | "update" | "repair";
  packId: string | null;
} | null;

export function useSkillPacks(cwd: string) {
  const { t } = useI18n();
  const [result, setResult] = useState(EMPTY_RESULT);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutation, setMutation] = useState<PackMutation>(null);
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

  const runMutation = useCallback(
    async (
      nextMutation: NonNullable<PackMutation>,
      request: (signal: AbortSignal) => Promise<SkillPackLoadResult>,
      onSuccess?: (next: SkillPackLoadResult) => void,
    ): Promise<boolean> => {
      if (mutationRequestRef.current) return false;
      refreshRequestRef.current?.abort();
      refreshRequestRef.current = null;
      setLoading(false);
      const controller = new AbortController();
      mutationRequestRef.current = controller;
      setMutation(nextMutation);
      setError(null);
      try {
        const next = await request(controller.signal);
        applyResult(next);
        onSuccess?.(next);
        return true;
      } catch (nextError) {
        if (!controller.signal.aborted) {
          setError(errorMessage(nextError, t.skills.somethingWentWrong));
        }
        return false;
      } finally {
        if (mutationRequestRef.current === controller) {
          mutationRequestRef.current = null;
          setMutation(null);
        }
      }
    },
    [applyResult, t.skills.somethingWentWrong],
  );

  const install = useCallback(
    (packId: string, scope: "global" | "project") =>
      runMutation({ operation: "install", packId }, (signal) =>
        installSkillPackApi({ packId, scope, cwd }, signal),
      ),
    [cwd, runMutation],
  );

  const installSource = useCallback(
    (source: string, scope: "global" | "project") =>
      runMutation(
        { operation: "install-source", packId: null },
        (signal) =>
          installSkillPackSourceApi({ source, scope, cwd }, signal),
        (next) => {
          const installed = next.packs.find(
            (pack) => pack.scope !== null && pack.source === source.trim(),
          );
          if (installed) setSelectedPackId(installed.packId);
        },
      ),
    [cwd, runMutation],
  );

  const remove = useCallback(
    (packId: string) =>
      runMutation({ operation: "remove", packId }, (signal) =>
        removeSkillPackApi({ packId, cwd }, signal),
      ),
    [cwd, runMutation],
  );

  const update = useCallback(
    (packId: string) =>
      runMutation({ operation: "update", packId }, (signal) =>
        updateSkillPackApi({ packId, cwd }, signal),
      ),
    [cwd, runMutation],
  );

  const repair = useCallback(
    (packId: string) =>
      runMutation({ operation: "repair", packId }, (signal) =>
        repairSkillPackApi({ packId, cwd }, signal),
      ),
    [cwd, runMutation],
  );

  return {
    ...result,
    busy: mutation !== null,
    error,
    install,
    installSource,
    loading,
    mutation,
    refresh,
    remove,
    repair,
    selectedPack,
    selectedPackId,
    setSelectedPackId,
    update,
  };
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
