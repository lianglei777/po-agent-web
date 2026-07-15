import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
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
  InstallSkillPackSourceInput,
  MaintainSkillPackInput,
  RemoveSkillPackInput,
  SkillPackInfo,
  SkillPackLoadResult,
  SkillPackResources,
} from "@/server/domain/skill-pack";
import type { WorkspaceRootProvider } from "@/server/ports/file-system";
import type { SkillPackProvider } from "@/server/ports/skill-pack-provider";
import {
  getOfficialSkillPacks,
  type OfficialSkillPackDefinition,
} from "./official-skill-packs";
import {
  canUpdatePackageSource,
  isLocalPackageSource,
  normalizeManualPackageSource,
  packageSourceIdentity,
  safePackageSource,
} from "./package-source";

type PackageManagerFactory = (cwd: string) => PackageManager;
type ConfiguredPackage = ReturnType<PackageManager["listConfiguredPackages"]>[number];
type MutationFailureCode =
  | "SKILL_PACK_INSTALL_FAILED"
  | "SKILL_PACK_UPDATE_FAILED"
  | "SKILL_PACK_REPAIR_FAILED"
  | "SKILL_PACK_REMOVE_FAILED";

export class PiSkillPackProvider implements SkillPackProvider {
  private running = false;

  constructor(
    private readonly createManager: PackageManagerFactory = createDefaultManager,
    private readonly catalog = getOfficialSkillPacks(),
    private readonly agentDir = getAgentDir(),
    private readonly roots?: WorkspaceRootProvider,
  ) {}

  async list(cwd: string): Promise<SkillPackLoadResult> {
    const manager = this.createManager(cwd);
    const configured = manager.listConfiguredPackages();
    this.registerConfiguredRoots(configured, cwd);
    let resolved = emptyResources();
    let resolutionSucceeded = true;
    try {
      resolved = await manager.resolve(async () => "skip");
    } catch {
      resolutionSucceeded = false;
    }
    return {
      packs: await mapPacks(
        this.catalog,
        configured,
        resolved,
        cwd,
        this.agentDir,
        resolutionSucceeded,
      ),
    };
  }

  async install(input: InstallSkillPackInput): Promise<SkillPackLoadResult> {
    return this.withMutation("SKILL_PACK_INSTALL_FAILED", async () => {
      const definition = this.catalog.find(
        (item) => catalogPackId(item.id) === input.packId,
      );
      if (!definition) notFound();

      const manager = this.createManager(input.cwd);
      if (
        manager
          .listConfiguredPackages()
          .some((item) =>
            configuredMatchesDefinition(
              item,
              definition,
              input.cwd,
              this.agentDir,
            ),
          )
      ) {
        alreadyInstalled();
      }

      this.registerLocalSource(definition.source);
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
        await cleanupInstall(manager, definition.source, local);
        throw new AppError(
          "SKILL_PACK_INSTALL_FAILED",
          "Installed Skill Pack could not be verified.",
          500,
        );
      }
      return result;
    });
  }

  async installSource(
    input: InstallSkillPackSourceInput,
  ): Promise<SkillPackLoadResult> {
    return this.withMutation("SKILL_PACK_INSTALL_FAILED", async () => {
      const source = normalizeManualPackageSource(input.source);
      await validateLocalPackageDirectory(source);
      const manager = this.createManager(input.cwd);
      if (
        manager
          .listConfiguredPackages()
          .some((item) =>
            configuredMatchesSource(item, source, input.cwd, this.agentDir),
          )
      ) {
        alreadyInstalled();
      }

      this.registerLocalSource(source);
      const local = input.scope === "project";
      await manager.installAndPersist(source, { local });
      const configured = manager
        .listConfiguredPackages()
        .find((item) =>
          configuredMatchesSource(item, source, input.cwd, this.agentDir),
        );
      if (!configured) {
        await cleanupInstall(manager, source, local);
        throw new AppError(
          "SKILL_PACK_INSTALL_FAILED",
          "Installed Skill Pack could not be verified.",
          500,
        );
      }

      const packId = configuredPackId(
        configured,
        this.catalog,
        input.cwd,
        this.agentDir,
      );
      const result = await this.list(input.cwd);
      const installed = result.packs.find((pack) => pack.packId === packId);
      if (installed?.status !== "installed" || !hasResources(installed.resources)) {
        await cleanupInstall(manager, source, local);
        throw new AppError(
          "SKILL_PACK_INSTALL_FAILED",
          "Installed Skill Pack does not expose an enabled resource.",
          500,
        );
      }
      return result;
    });
  }

  async update(input: MaintainSkillPackInput): Promise<SkillPackLoadResult> {
    return this.withMutation("SKILL_PACK_UPDATE_FAILED", async () => {
      const manager = this.createManager(input.cwd);
      const target = findConfigured(
        manager.listConfiguredPackages(),
        input.packId,
        this.catalog,
        input.cwd,
        this.agentDir,
      );
      if (!target) notFound();
      if (!canUpdatePackageSource(target.source)) {
        throw new AppError(
          "VALIDATION_ERROR",
          "Local Skill Packs must be refreshed from their source directory.",
          409,
        );
      }

      await manager.update(target.source);
      return this.verifyConfiguredPack(input, "SKILL_PACK_UPDATE_FAILED");
    });
  }

  async repair(input: MaintainSkillPackInput): Promise<SkillPackLoadResult> {
    return this.withMutation("SKILL_PACK_REPAIR_FAILED", async () => {
      const before = await this.list(input.cwd);
      const pack = before.packs.find((item) => item.packId === input.packId);
      if (!pack) notFound();
      if (pack.status !== "broken") {
        throw new AppError(
          "VALIDATION_ERROR",
          "Only a broken Skill Pack can be repaired.",
          409,
        );
      }

      const manager = this.createManager(input.cwd);
      const target = findConfigured(
        manager.listConfiguredPackages(),
        input.packId,
        this.catalog,
        input.cwd,
        this.agentDir,
      );
      if (!target) notFound();
      const localPath = configuredLocalPath(target, input.cwd, this.agentDir);
      if (localPath) this.registerLocalSource(localPath);
      await manager.install(localPath ?? target.source, {
        local: target.scope === "project",
      });
      return this.verifyConfiguredPack(input, "SKILL_PACK_REPAIR_FAILED");
    });
  }

  async remove(input: RemoveSkillPackInput): Promise<SkillPackLoadResult> {
    return this.withMutation("SKILL_PACK_REMOVE_FAILED", async () => {
      const manager = this.createManager(input.cwd);
      const targets = manager.listConfiguredPackages().filter(
        (item) =>
          configuredPackId(
            item,
            this.catalog,
            input.cwd,
            this.agentDir,
          ) === input.packId,
      );
      if (targets.length === 0) notFound();

      for (const target of targets) {
        const removeSource =
          configuredLocalPath(target, input.cwd, this.agentDir) ?? target.source;
        await manager.removeAndPersist(removeSource, {
          local: target.scope === "project",
        });
      }
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

  private async verifyConfiguredPack(
    input: MaintainSkillPackInput,
    code: Extract<MutationFailureCode, "SKILL_PACK_UPDATE_FAILED" | "SKILL_PACK_REPAIR_FAILED">,
  ): Promise<SkillPackLoadResult> {
    const result = await this.list(input.cwd);
    const pack = result.packs.find((item) => item.packId === input.packId);
    if (pack?.status !== "installed" || !hasResources(pack.resources)) {
      throw new AppError(code, "Skill Pack could not be verified.", 500);
    }
    return result;
  }

  private registerConfiguredRoots(
    configured: ConfiguredPackage[],
    cwd: string,
  ): void {
    for (const item of configured) {
      const localPath = configuredLocalPath(item, cwd, this.agentDir);
      if (localPath) this.registerLocalSource(localPath);
    }
  }

  private registerLocalSource(source: string): void {
    if (isLocalPackageSource(source)) this.roots?.addRoot(path.resolve(source));
  }

  private async withMutation<T>(
    failureCode: MutationFailureCode,
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
      throw new AppError(failureCode, failureMessage(failureCode), 500);
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

async function mapPacks(
  catalog: OfficialSkillPackDefinition[],
  configured: ConfiguredPackage[],
  resolved: ResolvedPaths,
  cwd: string,
  agentDir: string,
  resolutionSucceeded: boolean,
): Promise<SkillPackInfo[]> {
  const official = await Promise.all(
    catalog.map(async (definition): Promise<SkillPackInfo> => {
      const installed = configured.find((item) =>
        configuredMatchesDefinition(item, definition, cwd, agentDir),
      );
      const resolvedResources = resourcesForSource(
        resolved,
        installed?.source ?? definition.source,
      );
      const resources = installed
        ? resolvedResources
        : {
            ...resolvedResources,
            skills: [...definition.expectedSkills].sort(),
          };
      const verified = definition.expectedSkills.every((name) =>
        resolvedResources.skills.includes(name),
      );
      const metadata = await packageMetadata(installed?.installedPath);
      const version = metadata.version;
      const canUpdate = Boolean(
        installed && canUpdatePackageSource(installed.source),
      );
      return {
        packId: catalogPackId(definition.id),
        catalogId: definition.id,
        name: definition.name,
        description: definition.description,
        source: safePackageSource(definition.source),
        scope: installed?.scope ?? null,
        status: installed
          ? installed.installedPath && verified
            ? "installed"
            : "broken"
          : "available",
        version,
        availableVersion: definition.version,
        updateAvailable: Boolean(
          canUpdate && version && definition.version && version !== definition.version,
        ),
        canUpdate,
        resources,
        containsExtensions:
          definition.containsExtensions || resources.extensions.length > 0,
      };
    }),
  );
  const thirdParty = await Promise.all(
    configured
      .filter(
        (item) =>
          !catalog.some((definition) =>
            configuredMatchesDefinition(item, definition, cwd, agentDir),
          ),
      )
      .map(async (item): Promise<SkillPackInfo> => {
        const resources = resourcesForSource(resolved, item.source);
        const displaySource = safePackageSource(item.source);
        const metadata = await packageMetadata(item.installedPath);
        const healthy = Boolean(
          item.installedPath &&
            resolutionSucceeded &&
            (item.filtered || hasResources(resources)),
        );
        return {
          packId: configuredPackId(item, catalog, cwd, agentDir),
          name: metadata.name ?? packageLabel(displaySource),
          description: "",
          source: displaySource,
          scope: item.scope,
          status: healthy ? "installed" : "broken",
          version: metadata.version,
          updateAvailable: false,
          canUpdate: canUpdatePackageSource(item.source),
          resources,
          containsExtensions: resources.extensions.length > 0,
        };
      }),
  );
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

function findConfigured(
  configured: ConfiguredPackage[],
  packId: string,
  catalog: OfficialSkillPackDefinition[],
  cwd: string,
  agentDir: string,
): ConfiguredPackage | undefined {
  return configured.find(
    (item) => configuredPackId(item, catalog, cwd, agentDir) === packId,
  );
}

function configuredPackId(
  configured: ConfiguredPackage,
  catalog: OfficialSkillPackDefinition[],
  cwd: string,
  agentDir: string,
): string {
  const official = catalog.find((item) =>
    configuredMatchesDefinition(configured, item, cwd, agentDir),
  );
  return official
    ? catalogPackId(official.id)
    : opaqueId(`configured:${configured.scope}:${configured.source}`);
}

function configuredMatchesDefinition(
  configured: ConfiguredPackage,
  definition: OfficialSkillPackDefinition,
  cwd: string,
  agentDir: string,
): boolean {
  return configuredMatchesSource(
    configured,
    definition.source,
    cwd,
    agentDir,
  );
}

function configuredMatchesSource(
  configured: ConfiguredPackage,
  source: string,
  cwd: string,
  agentDir: string,
): boolean {
  const configuredIdentity = packageSourceIdentity(configured.source);
  const sourceIdentity = packageSourceIdentity(source);
  if (configuredIdentity && configuredIdentity === sourceIdentity) return true;
  if (sameSource(configured.source, source)) return true;
  if (configured.installedPath && sameSource(configured.installedPath, source)) {
    return true;
  }
  const localPath = configuredLocalPath(configured, cwd, agentDir);
  return Boolean(localPath && sameSource(localPath, source));
}

function configuredLocalPath(
  configured: ConfiguredPackage,
  cwd: string,
  agentDir: string,
): string | undefined {
  if (path.isAbsolute(configured.source)) return configured.source;
  if (packageSourceIdentity(configured.source)) return undefined;
  const baseDir =
    configured.scope === "project" ? path.join(cwd, ".pi") : agentDir;
  return path.resolve(baseDir, configured.source);
}

async function packageMetadata(
  installedPath?: string,
): Promise<{ name?: string; version?: string }> {
  if (!installedPath) return {};
  try {
    const content = await fs.readFile(path.join(installedPath, "package.json"), "utf8");
    const value: unknown = JSON.parse(content);
    if (typeof value !== "object" || value === null) return {};
    const record = value as Record<string, unknown>;
    return {
      name:
        typeof record.name === "string" && record.name.trim()
          ? record.name
          : undefined,
      version:
        typeof record.version === "string" && record.version.trim()
          ? record.version
          : undefined,
    };
  } catch {
    return {};
  }
}

async function validateLocalPackageDirectory(source: string): Promise<void> {
  if (!isLocalPackageSource(source)) return;
  try {
    if ((await fs.stat(source)).isDirectory()) return;
  } catch {
    // 统一映射为不包含系统路径细节的输入错误。
  }
  throw new AppError(
    "VALIDATION_ERROR",
    "Local Skill Pack source must be an existing directory.",
    400,
  );
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

function hasResources(resources: SkillPackResources): boolean {
  return Object.values(resources).some((items) => items.length > 0);
}

async function cleanupInstall(
  manager: PackageManager,
  source: string,
  local: boolean,
): Promise<void> {
  try {
    await manager.removeAndPersist(source, { local });
  } catch {
    // 清理失败不覆盖原始安装校验错误，也不向响应泄露底层命令信息。
  }
}

function notFound(): never {
  throw new AppError("SKILL_PACK_NOT_FOUND", "Skill Pack was not found.", 404);
}

function alreadyInstalled(): never {
  throw new AppError(
    "VALIDATION_ERROR",
    "Skill Pack is already installed.",
    409,
  );
}

function failureMessage(code: MutationFailureCode): string {
  const messages: Record<MutationFailureCode, string> = {
    SKILL_PACK_INSTALL_FAILED: "Skill Pack installation failed.",
    SKILL_PACK_UPDATE_FAILED: "Skill Pack update failed.",
    SKILL_PACK_REPAIR_FAILED: "Skill Pack repair failed.",
    SKILL_PACK_REMOVE_FAILED: "Skill Pack removal failed.",
  };
  return messages[code];
}

function emptyResources(): ResolvedPaths {
  return { extensions: [], skills: [], prompts: [], themes: [] };
}
