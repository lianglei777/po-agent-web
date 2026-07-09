#!/usr/bin/env bash
# 启动 po-agent-web 的 Docker 部署：按宿主机 OS 自动把本机工作区挂进容器。
# 用法：
#   ./scripts/docker-up.sh          # 生产模式（后台）
#   ./scripts/docker-up.sh dev      # 开发模式（前台，热更新）
set -euo pipefail

# 切到项目根目录（脚本在 scripts/ 下）
cd "$(dirname "$0")/.."

MODE="${1:-prod}"

case "$(uname -s)" in
    Darwin)
        # Mac：挂载当前用户的 Desktop
        WORKSPACE_HOST_DIR="$HOME/Desktop"
        ;;
    Linux)
        # Linux：用家目录下的工作区（免 sudo、用户可写）
        WORKSPACE_HOST_DIR="$HOME/po-agent-user-workspace"
        mkdir -p "$WORKSPACE_HOST_DIR"
        ;;
    *)
        echo "不支持的系统：$(uname -s)" >&2
        exit 1
        ;;
esac

export WORKSPACE_HOST_DIR

if [ "$MODE" = "dev" ]; then
    docker compose -f docker-compose.dev.yml up --build
else
    docker compose up --build -d
fi
