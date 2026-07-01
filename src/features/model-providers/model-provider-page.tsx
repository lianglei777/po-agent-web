"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/use-i18n";
import ApiKeyDetail from "./details/api-key-detail";
import ModelDetail from "./details/model-detail";
import OAuthDetail from "./details/oauth-detail";
import ProviderDetail from "./details/provider-detail";
import { ModelProviderSidebar } from "./sidebar/model-provider-sidebar";
import { useModelProviders } from "./use-model-providers";

export function ModelProviderPage({
  onDirtyChange,
  onSaved,
}: {
  onDirtyChange: (dirty: boolean) => void;
  onSaved?: () => void;
}) {
  const modelConfig = useModelProviders(onSaved);
  const { t } = useI18n();

  useEffect(() => {
    onDirtyChange(modelConfig.dirty);
    return () => onDirtyChange(false);
  }, [modelConfig.dirty, onDirtyChange]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-canvas">
      {modelConfig.loading ? (
        <div className="grid min-h-0 flex-1 place-items-center text-sm text-dim">
          {t.common.loading}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <ModelProviderSidebar
            apiKeyProviders={modelConfig.apiKeyProviders}
            config={modelConfig.config}
            onAddModel={modelConfig.addModel}
            onAddProvider={modelConfig.addCustomProvider}
            onSelect={modelConfig.setSelection}
            selection={modelConfig.selection}
          />
          <main className="min-w-0 flex-1 overflow-y-auto p-5">
            {modelConfig.loadError ? (
              <p className="text-[13px] text-destructive">
                {modelConfig.loadError}
              </p>
            ) : (
              <ModelsConfigDetail modelConfig={modelConfig} />
            )}
          </main>
        </div>
      )}

      <footer className="flex min-h-12 items-center justify-end gap-2 border-t border-line-strong px-[18px]">
        {modelConfig.saveError ? (
          <span className="mr-auto text-xs text-destructive">
            {modelConfig.saveError}
          </span>
        ) : null}
        <Button
          disabled={
            modelConfig.loading ||
            Boolean(modelConfig.loadError) ||
            modelConfig.saving ||
            modelConfig.savedOk
          }
          onClick={modelConfig.save}
          size="sm"
          type="button"
        >
          {modelConfig.savedOk
            ? t.common.saved
            : modelConfig.saving
              ? t.common.saving
              : t.common.save}
        </Button>
      </footer>
    </div>
  );
}

function ModelsConfigDetail({
  modelConfig,
}: {
  modelConfig: ReturnType<typeof useModelProviders>;
}) {
  const selection = modelConfig.selection;
  if (!selection) return <EmptySelection />;

  if (selection.type === "provider") {
    const provider = modelConfig.config.providers?.[selection.name];
    return provider ? (
      <ProviderDetail
        discovery={modelConfig.discovery}
        key={selection.name}
        name={selection.name}
        onAcceptDiscoveredModels={modelConfig.acceptDiscoveredModels}
        onChange={(next) => modelConfig.updateProvider(selection.name, next)}
        onDelete={modelConfig.deleteProvider}
        onDiscoverModels={modelConfig.discoverProviderModels}
        onRename={modelConfig.renameProvider}
        provider={provider}
      />
    ) : null;
  }

  if (selection.type === "model") {
    const provider = modelConfig.config.providers?.[selection.providerName];
    const model = provider?.models?.[selection.index];
    return provider && model ? (
      <ModelDetail
        config={modelConfig.config}
        key={`${selection.providerName}-${selection.index}`}
        model={model}
        onChange={(next) =>
          modelConfig.updateModel(
            selection.providerName,
            selection.index,
            next,
          )
        }
        onDelete={() =>
          modelConfig.removeModel(selection.providerName, selection.index)
        }
        providerName={selection.providerName}
      />
    ) : null;
  }

  if (selection.type === "oauth") {
    const provider = modelConfig.oauthProviders.find(
      (candidate) => candidate.id === selection.providerId,
    );
    return provider ? <OAuthDetail key={provider.id} provider={provider} /> : null;
  }

  const provider = modelConfig.apiKeyProviders.find(
    (candidate) => candidate.id === selection.providerId,
  );
  return provider ? (
    <ApiKeyDetail
      key={provider.id}
      onRefresh={() => modelConfig.refreshApiKeyProvider(provider.id)}
      provider={provider}
    />
  ) : null;
}

function EmptySelection() {
  const { t } = useI18n();
  return (
    <div className="grid h-full place-items-center text-[13px] text-dim">
      {t.models.selectProviderOrModel}
    </div>
  );
}
