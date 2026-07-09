# 启动 po-agent-web 的 Docker 部署：按宿主机 OS 自动把本机工作区挂进容器。
# 用法：
#   .\scripts\docker-up.ps1          # 生产模式（后台）
#   .\scripts\docker-up.ps1 dev      # 开发模式（前台，热更新）
param([string]$Mode = "prod")

$ErrorActionPreference = "Stop"

# 切到项目根目录（脚本在 scripts/ 下）
Set-Location (Split-Path -Parent $PSScriptRoot)

# Windows：挂载当前用户的 Desktop。归一化为正斜杠，避免 YAML 反斜杠转义、方便 compose 解析盘符。
$env:WORKSPACE_HOST_DIR = (Join-Path $env:USERPROFILE "Desktop") -replace '\\', '/'

if ($Mode -eq "dev") {
    docker compose -f docker-compose.dev.yml up --build
} else {
    docker compose up --build -d
}
