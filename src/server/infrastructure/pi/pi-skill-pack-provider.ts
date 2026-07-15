import { createHash } from "node:crypto";
import path from "node:path";
import {
  DefaultPackageManager,
  getAgentDir,
  type PackageManager,
  type ResolvedPaths,
  SettingsManager,
} from "@earendil-works/pi-coding-agent";
import { AppError } from "@/server/domain/app-error";
import type {
  InstallSkillPackInput,
  RemoveSkillPackInput,
  SkillPackInfo,
  SkillPackLoadResult,
  SkillPackResources,
} from "@/server/domain/skill-pack";
import type { SkillPackProvider } from "@/server/ports/skill-pack-provider";
import {
  getOfficialSkillPacks,
  type OfficialSkillPackDefinition,
} from "./official-skill-packs";

type PackageManagerFactory = (cwd: string) => PackageManager;

export class PiSkillPackProvider implements SkillPackProvider {
  private running = false;

  constructor(
    private readonly createManager: PackageManagerFactory = createDefaultManager,
    private readonly catalog = getOfficialSkillPacks(),
  ) {}

  async list(cwd: string): Promise<SkillPackLoadResult> {
    const manager = this.createManager(cwd);
    const configured = manager.listConfiguredPackages();
    let resolved = emptyResources();
    try {
      resolved = await manager.resolve(async () => "skip");
    } catch {
      // 配置仍需展示为 broken，具体安装错误由后续安装或移除操作返回。
    }
    return { packs: mapPacks(this.catalog, configured, resolved) };
  }

  async install(input: InstallSkillPackInput): Promise<SkillPackLoadResult> {
    return this.withMutation(
      "SKILL_PACK_INSTALL_FAILED",
      async () => {
        const definition = this.catalog.find(
          (item) => catalogPackId(item.id) === input.packId,
        );
        if (!definition) {
          throw new AppError(
            "SKILL_PACK_NOT_FOUND",
            "Skill Pack was not found.",
            404,
          );
        }

        const manager = this.createManager(input.cwd);
        if (
          manager
            .listConfiguredPackages()
            .some((item) => sameSource(item.source, definition.source))
        ) {
          throw new AppError(
            "VALIDATION_ERROR",
            "Skill Pack is already installed.",
            409,
          );
        }

        const local = input.scope === "project";
        await manager.installAndPersist(definition.source, { local });
        const result = await this.list(input.cwd);
        const installed = result.packs.find(
          (pack) => pack.catalogId === definition.id,
        );
        if (
          installed?.status !== "installed" ||
          !definition.expectedSkills.every((name) =>
            installed.resources.skills.includes(name),
          )
        ) {
          try {
            await manager.removeAndPersist(definition.source, { local });
          } catch (cleanupError) {
            console.error("Failed to clean up an invalid Skill Pack", cleanupError);
          }
          throw new AppError(
            "SKILL_PACK_INSTALL_FAILED",
            "Installed Skill Pack could not be verified.",
            500,
          );
        }
        return result;
      },
    );
  }

  async remove(input: RemoveSkillPackInput): Promise<SkillPackLoadResult> {
    return this.withMutation("SKILL_PACK_REMOVE_FAILED", async () => {
      const manager = this.createManager(input.cwd);
      const configured = manager.listConfiguredPackages();
      const target = configured.find(
        (item) => configuredPackId(item, this.catalog) === input.packId,
      );
      if (!target) {
        throw new AppError(
          "SKILL_PACK_NOT_FOUND",
          "Skill Pack was not found.",
          404,
        );
      }

      await manager.removeAndPersist(target.source, {
        local: target.scope === "project",
      });
      const result = await this.list(input.cwd);
      if (result.packs.some((pack) => pack.packId === input.packId && pack.scope)) {
        throw new AppError(
          "SKILL_PACK_REMOVE_FAILED",
          "Skill Pack is still installed after removal.",
          500,
        );
      }
      return result;
    });
  }

  private async withMutation<T>(
    failureCode: "SKILL_PACK_INSTALL_FAILED" | "SKILL_PACK_REMOVE_FAILED",
    work: () => Promise<T>,
  ): Promise<T> {
    if (this.running) {
      throw new AppError(
        "SKILL_PACK_INSTALL_BUSY",
        "Another Skill Pack operation is running.",
        409,
      );
    }
    this.running = true;
    try {
      return await work();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        failureCode,
        error instanceof Error ? error.message : String(error),
        500,
      );
    } finally {
      this.running = false;
    }
  }
}

function createDefaultManager(cwd: string): PackageManager {
  const agentDir = getAgentDir();
  return new DefaultPackageManager({
    cwd,
    agentDir,
    settingsManager: SettingsManager.create(cwd, agentDir),
  });
}

function mapPacks(
  catalog: OfficialSkillPackDefinition[],
  configured: ReturnType<PackageManager["listConfiguredPackages"]>,
  resolved: ResolvedPaths,
): SkillPackInfo[] {
  const official = catalog.map((definition) => {
    const installed = configured.find((item) =>
      sameSource(item.source, definition.source),
    );
    const resolvedResources = resourcesForSource(resolved, definition.source);
    const resources = installed
      ? resolvedResources
      : {
          ...resolvedResources,
          skills: [...definition.expectedSkills].sort(),
        };
    const verified = definition.expectedSkills.every((name) =>
      resolvedResources.skills.includes(name),
    );
    return {
      packId: catalogPackId(definition.id),
      catalogId: definition.id,
      name: definition.name,
      description: definition.description,
      source: definition.source,
      scope: installed?.scope ?? null,
      status: installed
        ? installed.installedPath && verified
          ? ("installed" as const)
          : ("broken" as const)
        : ("available" as const),
      resources,
      containsExtensions:
        definition.containsExtensions || resources.extensions.length > 0,
    };
  });
  const thirdParty = configured
    .filter(
      (item) => !catalog.some((definition) => sameSource(item.source, definition.source)),
    )
    .map((item) => {
      const resources = resourcesForSource(resolved, item.source);
      const hasResources = Object.values(resources).some((values) => values.length);
      return {
        packId: configuredPackId(item, catalog),
        name: packageLabel(item.source),
        description: "",
        source: item.source,
        scope: item.scope,
        status:
          item.installedPath && hasResources
            ? ("installed" as const)
            : ("broken" as const),
        resources,
        containsExtensions: resources.extensions.length > 0,
      };
    });
  return [...official, ...thirdParty];
}

function resourcesForSource(
  resolved: ResolvedPaths,
  source: string,
): SkillPackResources {
  return {
    skills: resourceNames(resolved.skills, source, true),
    extensions: resourceNames(resolved.extensions, source),
    prompts: resourceNames(resolved.prompts, source),
    themes: resourceNames(resolved.themes, source),
  };
}

function resourceNames(
  resources: ResolvedPaths["skills"],
  source: string,
  skill = false,
): string[] {
  return resources
    .filter((item) => item.enabled && sameSource(item.metadata.source, source))
    .map((item) =>
      skill && path.basename(item.path).toLowerCase() === "skill.md"
        ? path.basename(path.dirname(item.path))
        : path.basename(item.path, path.extname(item.path)),
    )
    .sort((left, right) => left.localeCompare(right));
}

function configuredPackId(
  configured: ReturnType<PackageManager["listConfiguredPackages"]>[number],
  catalog: OfficialSkillPackDefinition[],
): string {
  const official = catalog.find((item) => sameSource(item.source, configured.source));
  return official
    ? catalogPackId(official.id)
    : opaqueId(`configured:${configured.scope}:${configured.source}`);
}

function catalogPackId(id: string): string {
  return opaqueId(`catalog:${id}`);
}

function opaqueId(value: string): string {
  return `pack_${createHash("sha256").update(value).digest("hex").slice(0, 16)}`;
}

function sameSource(left: string, right: string): boolean {
  if (path.isAbsolute(left) && path.isAbsolute(right)) {
    const normalizedLeft = path.resolve(left);
    const normalizedRight = path.resolve(right);
    return process.platform === "win32"
      ? normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()
      : normalizedLeft === normalizedRight;
  }
  return left === right;
}

function packageLabel(source: string): string {
  return path.isAbsolute(source) ? path.basename(source) : source;
}

function emptyResources(): ResolvedPaths {
  return { extensions: [], skills: [], prompts: [], themes: [] };
}
