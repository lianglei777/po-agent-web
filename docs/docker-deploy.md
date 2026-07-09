# Po Agent Web Docker 部署手册

本手册说明如何把 po-agent-web 部署到本机 Docker Desktop（Windows）。按步骤操作即可跑起来。

## 1. 概述

- po-agent-web 是**单个 Next.js 应用**：前端和"后端"（`src/app/api/*` 的 Route Handlers）同进程，只需构建**一个镜像、跑一个容器**。
- Docker 部署统一用端口 **51732**，与本机 `npm run dev` 的 51731 错开，两者可同时运行。
- 应用状态（凭证、模型配置、项目列表、会话历史）通过数据卷持久化，容器删除不丢。
- 本方案**不挂载本机项目代码**，仅部署服务本身（见第 8 节限制）。

## 2. 前置条件

- 已安装并启动 **Docker Desktop**（Windows，WSL2 后端）。
- 建议在 `Docker Desktop -> Settings -> Docker Engine` 配置 `registry-mirrors`，拉基础镜像 `node:22-bookworm-slim` 更快。
- 仓库已包含部署所需文件（见下表），无需额外生成。

### 涉及的仓库文件

| 文件 | 作用 |
|---|---|
| [next.config.ts](../next.config.ts) | `output: "standalone"` 产出独立运行产物 |
| [Dockerfile](../Dockerfile) | 生产镜像（多阶段构建） |
| [Dockerfile.dev](../Dockerfile.dev) | 开发镜像（热更新） |
| [.dockerignore](../.dockerignore) | 构建上下文排除 |
| [docker-compose.yml](../docker-compose.yml) | 生产运行编排 |
| [docker-compose.dev.yml](../docker-compose.dev.yml) | 开发运行编排 |

## 3. 快速部署（生产）

一条命令构建并启动：

```bash
docker compose up --build -d
```

首次执行会拉基础镜像 + `npm ci` + `next build`，耗时较长；后续启动命中层缓存会快很多。

确认启动状态：

```bash
docker compose logs -f po-agent-web
```

看到 `Ready` 之类日志后，浏览器访问 **http://localhost:51732**。

## 4. 首次使用配置

容器跑起来后，在浏览器 UI 里完成：

1. **登录模型 provider**：走 device code 流程，页面上会显示授权码和链接，按提示在 provider 端完成授权。
2. **配置模型**：填入 API key 或选择已登录的 provider，配置要用的大模型。

这些凭证写入数据卷（见第 5 节），重启容器后仍在。

## 5. 数据持久化

环境变量 `PI_CODING_AGENT_DIR=/data/pi-agent`，挂命名卷 `po-agent-data`。该目录包含：

| 文件/目录 | 内容 |
|---|---|
| `auth.json` | provider 凭证 / API key |
| `models.json` | 模型配置 |
| `projects.json` | 已注册项目路径（workspace roots 启动时从这里回灌） |
| `sessions/` | 会话历史 |

`docker compose down` 只删容器，数据卷保留；`docker compose down -v` 才会连数据卷一起删（凭证会丢）。

## 6. 端口说明

| 场景 | 端口 |
|---|---|
| 本机 `npm run dev` | 51731 |
| Docker 生产容器 | 51732 |
| Docker 开发容器 | 51732 |

- 本机 dev 与 Docker 容器**可同时运行**（端口不冲突）。
- 生产容器与开发容器都占 51732，**不能同时运行**。

如需改端口：改 [docker-compose.yml](../docker-compose.yml) 的 `ports` 映射（左是宿主机端口）和 `PORT` 环境变量，以及 [Dockerfile](../Dockerfile) 的 `ENV PORT` / `EXPOSE`。

## 7. 开发模式（可选）

在容器里跑 `next dev`，改源码即热更新，适合不污染本机 Node 环境地开发 po-agent-web 本身：

```bash
docker compose -f docker-compose.dev.yml up --build
# 访问 http://localhost:51732
```

注意事项：

- **改了依赖要重建**：`package.json` / `package-lock.json` 变化后，重新 `up --build`；必要时先 `docker compose -f docker-compose.dev.yml down` 清掉旧的 `/app/node_modules` 匿名卷再重建。
- **Windows 文件监听**：跨 bind-mount 的文件监听偶有延迟，Fast Refresh 可能不灵；体验不佳时直接本机 `npm run dev`。
- 开发容器与生产容器共用 `po-agent-data` 数据卷，凭证互通。

## 8. 常用运维命令

```bash
# 启动（后台）
docker compose up -d

# 停止并删容器（保留数据卷）
docker compose down

# 查看日志
docker compose logs -f po-agent-web

# 重新构建（改了代码或依赖后）
docker compose up --build -d

# 连数据卷一起清空（慎用，凭证会丢）
docker compose down -v
```

## 9. 国内镜像源

[Dockerfile](../Dockerfile) 与 [Dockerfile.dev](../Dockerfile.dev) 通过 `NPM_REGISTRY` build-arg 控制 npm 源，默认 `https://registry.npmmirror.com`。切回官方源：

```bash
docker compose build --build-arg NPM_REGISTRY=https://registry.npmjs.org
# 开发模式
docker compose -f docker-compose.dev.yml build --build-arg NPM_REGISTRY=https://registry.npmjs.org
```

## 10. 已知限制

- **子进程在容器内执行**：agent 通过 `NodeProcessRunner` 跑的 `npm`、`git` 等命令在容器环境里执行，容器只有 Node 22，没有宿主机的其它工具链。当前部署不挂载项目代码，agent 没有可操作的文件。
- **无认证边界**：见 [architecture.md](architecture.md) 安全章节，当前服务面向本机单用户。本方案只在本机访问，不要把 51732 暴露到公网。
- **OAuth**：走 device code / 手动输入码流程，不需要回调端口，Docker 网络不影响登录。

## 11. 故障排查

| 现象 | 排查 |
|---|---|
| `docker compose up` 卡在拉镜像 | Docker Desktop 配置 `registry-mirrors`，或检查网络 |
| 构建时 `npm ci` 很慢 | 确认走的是 npmmirror（默认），或检查 build-arg 是否被覆盖 |
| 启动后访问 51732 无响应 | `docker compose logs` 看是否 `server.js` 起来；确认端口没被本机其它进程占用 |
| 端口 51732 被占用 | 停掉占用进程，或改 compose 的宿主机端口（见第 6 节） |
| 改代码后容器没更新 | 生产模式要 `docker compose up --build`；开发模式确认用的是 `docker-compose.dev.yml` |
| 凭证丢失 | 确认没有用 `down -v`；检查 `po-agent-data` 卷是否存在（`docker volume ls`） |

## 12. 验证清单

- [ ] `docker compose up --build -d` 启动，`http://localhost:51732` 可访问
- [ ] 登录一个 provider、配置一个模型
- [ ] `docker compose down && docker compose up -d` 后凭证仍在（数据卷生效）
- [ ] （可选）`docker compose -f docker-compose.dev.yml up --build` 启动，改源码后页面热更新
