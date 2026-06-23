# Compact Context 功能设计文档

## 概述

Compact Context（上下文压缩）允许用户在对话过程中主动压缩当前会话的上下文，将历史消息生成摘要后替换为精简版本，从而释放 token 空间、降低成本、避免上下文窗口溢出。

## 架构

```
用户点击 Compact 按钮
        │
        ▼
  compact() 发送 HTTP POST { type: "compact" }
        │
        ├── 成功 ──► HTTP 响应 { summary, tokensBefore, firstKeptEntryId, details }
        │              │
        │              ├── setIsCompacting(false)
        │              ├── setCompactResult({ tokensBefore, summary }) → 绿色成功横幅
        │              └── reloadHistory() → 消息列表刷新，compactionSummary 进入 messages
        │                    │
        │                    └── runtime state 刷新 compactionAvailable → 按钮禁用
        │
        └── 不可用 ──► COMPACTION_NOT_AVAILABLE (409)
                      │
                      └── setCompactNotice(t.chat.input.alreadyCompacted) → 灰色 info 横幅
```

## 后端实现

### 错误码映射

`src/server/infrastructure/pi/pi-agent-runtime.ts`

后端使用 Pi SDK 的 `findCutPoint` 和当前 compaction settings 预检是否存在会被移除的历史内容。没有可压缩内容时，在调用摘要模型前返回 `COMPACTION_NOT_AVAILABLE`（HTTP 409）；同时仍兼容映射 SDK 的 `"Already compacted"` 错误：

```typescript
case "compact":
  try {
    if (!hasCompactableHistory(...)) {
      throw new AppError(
        "COMPACTION_NOT_AVAILABLE",
        "No older context is available to compact",
        409,
      );
    }
    return (await this.session.compact(command.customInstructions)) as T;
  } catch (cause) {
    if (cause instanceof Error && /already compacted/i.test(cause.message)) {
      throw new AppError("COMPACTION_NOT_AVAILABLE", "Context already compacted", 409);
    }
    throw cause;
  }
```

### 消息结构

`src/server/domain/message.ts`

compact 完成后，会话的 messages 数组中会插入一条 `CompactionSummaryMessage`：

```typescript
interface CompactionSummaryMessage {
  role: "compactionSummary";
  summary: string;        // LLM 生成的压缩摘要
  tokensBefore: number;   // 压缩前的 token 数量
  timestamp?: number;     // 压缩操作的时间戳
}
```

### 消息排列顺序

`src/server/infrastructure/pi/pi-session-repository.ts` — `contextEntryIds` 函数

compact 后的 messages 数组结构为：

```
[compactionSummary, ...compact前保留的旧消息, ...compact后的新消息]
```

- `compactionSummary` 始终在数组**开头**（index 0）
- compact 前保留的旧消息紧跟其后，其 `timestamp` **小于** compaction 的 `timestamp`
- compact 后的新消息排在最后，其 `timestamp` **大于** compaction 的 `timestamp`

### compactionSummary 不在 UI 中渲染

`src/features/chat/message-presentation.ts` 会静默过滤 `compactionSummary`。压缩摘要内容是给 LLM 看的上下文压缩结果，不需要在对话列表中展示。

## 前端实现

### 状态管理

`src/features/chat/use-chat-controller.ts`

| 状态 | 类型 | 说明 |
|------|------|------|
| `isCompacting` | `boolean` (useState) | 是否正在压缩 |
| `compactError` | `string` (useState) | 压缩错误信息（红色横幅） |
| `compactResult` | `boolean` (useState) | 压缩成功反馈（绿色横幅，6 秒自动消失） |
| `compactNotice` | `string` (useState) | info 级提示（灰色横幅，6 秒自动消失） |
| `compactionAvailable` | `boolean` (useState) | 后端按真实 SDK 切分规则计算的可用性 |
| `canCompact` | `boolean` | `compactionAvailable` 与运行/压缩状态组合后的按钮状态 |

### canCompact 派生逻辑

`compactionAvailable` 来自 `AgentRuntimeState`，因此前端不复制 `keepRecentTokens` 或切分算法：

```typescript
const canCompact =
  compactionAvailable && !running && !isCompacting;
```

打开尚未加载 runtime 的历史 session 时，前端发送一次 `get_state` 命令恢复 runtime，再同步 `compactionAvailable`。每轮 Agent 结束、压缩完成和切换分支后都会重新读取 runtime state。

### compact() 函数

```typescript
async function compact() {
  const id = sessionIdRef.current;
  if (!id) return;
  setCompactError("");
  const aborting = isCompacting;
  if (!aborting) setIsCompacting(true);  // 仅发起压缩时设置 loading
  try {
    if (aborting) {
      await sendCommand(id, { type: "abort_compaction" });
      setIsCompacting(false);
      return;
    }
    await sendCommand(id, { type: "compact" });
    setIsCompacting(false);
    setCompactResult(true);
    void reloadHistory();  // 刷新消息列表，canCompact 通过 useMemo 自动派生
  } catch (cause) {
    setIsCompacting(false);
    const code = cause instanceof ApiRequestError ? cause.code : undefined;
    const message = cause instanceof Error ? cause.message : "Compact failed";
    if (!aborting && (code === "COMPACTION_NOT_AVAILABLE" || /already compacted/i.test(message))) {
      setCompactNotice(t.chat.input.alreadyCompacted);  // info 提示，非红色错误
    } else {
      setCompactError(message);
    }
  }
}
```

**关键设计点**：
- 手动 compact 只在 agent 不运行时触发（按钮在 `running` 时禁用），此时 SSE 连接已断开
- `isCompacting` 在 HTTP 响应返回后**显式重置**，不依赖 SSE `compaction_end` 事件（因 SSE 已断开）
- compact 成功后调用 `reloadHistory()` 刷新消息列表，使 `compactionSummary` 进入 messages，`canCompact` 自动派生为 `false`
- 后端使用 Pi SDK 的切分规则预检；没有旧消息或 turn prefix 会被移除时返回 `COMPACTION_NOT_AVAILABLE`，不调用摘要模型，也不写入空 `compactionSummary`

### SSE 事件处理（自动压缩场景）

自动压缩（auto compaction）在 agent 运行时触发，此时 SSE 连接活跃：

```typescript
case "compaction_start":
case "auto_compaction_start":
  setIsCompacting(true);
  setCompactError("");
  break;
case "compaction_end":
case "auto_compaction_end":
  setIsCompacting(false);
  if (event.errorMessage) setCompactError(event.errorMessage);
  else if (!event.aborted) void reloadHistory();
  break;
```

### API 客户端

`src/features/chat/agent-api.ts`

`ApiRequestError` 类携带后端 `error.code`，使前端能按错误码分支处理：

```typescript
export class ApiRequestError extends Error {
  readonly code: string | undefined;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
  }
}
```

## UI 交互

### Compact 按钮（`src/features/chat/chat-input.tsx`）

按钮文字保持稳定，可用性由后端 runtime state 的 `compactionAvailable` 决定：

| 状态 | 按钮文字 | disabled | title |
|------|---------|----------|-------|
| 默认 | Compact | false | Compact context |
| 压缩中 | Abort compact | false | Compact context |
| 无可压缩历史 | Compact | true | 当前没有可压缩的较早上下文 |

```tsx
<Button
  disabled={running || (!canCompact && !isCompacting)}
  title={!canCompact && !isCompacting ? t.chat.input.alreadyCompacted : t.chat.input.compactContext}
>
  <Minimize2 className="size-3.5" />
  {isCompacting
    ? t.chat.input.abortCompact
    : t.chat.input.compact}
</Button>
```

移动端 `SettingsMenu` 使用相同的可用性和稳定文案。

### 状态横幅

在输入框上方按顺序展示（互不排斥，可同时显示）：

| 横幅 | tone | 触发条件 | 自动消失 | 可手动关闭 |
|------|------|---------|---------|-----------|
| 压缩中 | warning (橙色) + 脉冲动画 | `isCompacting === true` | 否（压缩完成后消失） | 否 |
| 压缩成功 | success (绿色) | `compactResult === true` | 6 秒 | 是 |
| 已压缩提示 | info (灰色) | `compactNotice !== ""` | 6 秒 | 是 |
| 压缩错误 | error (红色) | `compactError !== ""` | 否 | 否 |

**压缩中横幅**使用脉冲动画圆点（复用 `running` 状态的动画样式），与文字水平排列：

```tsx
<InlineStatus tone="warning">
  <span className="flex items-center gap-2">
    <span className="relative flex size-2 shrink-0">
      <span className="absolute inline-flex size-full rounded-full bg-warning/35 motion-safe:animate-ping" />
      <span className="relative inline-flex size-2 rounded-full bg-warning" />
    </span>
    {t.chat.input.compacting}
  </span>
</InlineStatus>
```

## 完整状态流转

```
┌─────────────────────────────────────────────────────────────────────┐
│                        用户点击 Compact                              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
                    isCompacting = true
                    按钮文字 → "Abort compact"
                    横幅 → 🟠 脉冲 "正在压缩上下文..."
                               │
                               ▼
                    HTTP POST { type: "compact" }
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
         成功返回         "Already compacted"   其他错误
              │                │                │
              ▼                ▼                ▼
    isCompacting=false   isCompacting=false   isCompacting=false
    setCompactResult()   setCompactNotice()   setCompactError()
    reloadHistory()      横幅 → ⚪ info        横幅 → 🔴 error
    横幅 → 🟢 success    "上下文已压缩..."    显示错误信息
    "上下文已压缩 ·      6 秒后消失
     N tokens"
    6 秒后消失
              │
              ▼
    messages 刷新，compactionSummary 进入数组
              │
              ▼
    canCompact (useMemo) 派生为 false
    按钮文字 → "Compacted"
    按钮禁用
              │
              ▼
    ┌─────────────────────────────────────────┐
    │ 用户发送新消息并完成一轮 Agent           │
    │   → runtime 重新执行真实压缩预检         │
    │   → compactionAvailable 更新             │
    │   → 有可移除历史时按钮可点击             │
    └─────────────────────────────────────────┘
```

## 切换 Session / 刷新页面的状态恢复

`canCompact` 从 runtime state 恢复：

| 场景 | 行为 |
|------|------|
| 切换到已 compact 的 session | runtime 返回 `compactionAvailable: false`，按钮保持“Compact”并禁用 |
| 刷新页面 | 若 runtime 未加载，通过 `get_state` 恢复并读取可用性 |
| 切换到未 compact 的小 session | `compactionAvailable: false`，避免无效模型调用 |
| 切换到存在可移除历史的 session | `compactionAvailable: true`，按钮可用 |
| 切换分支 | `changeLeaf` 刷新 runtime state，使用目标分支的 `compactionAvailable` |

## i18n 字典键

`src/i18n/dictionaries/zh.ts` / `en.ts`

| 键 | zh | en |
|----|----|----|
| `compact` | Compact | Compact |
| `compactContext` | Compact context | Compact context |
| `abortCompact` | Abort compact | Abort compact |
| `compacting` | 正在压缩上下文... | Compacting context... |
| `compactSuccess` | 上下文已压缩 | Context compacted |
| `alreadyCompacted` | 当前没有可压缩的较早上下文。 | There is no older context available to compact. |
| `dismissNotice` | 关闭提示 | Dismiss notice |

## 涉及文件

| 文件 | 职责 |
|------|------|
| `src/server/infrastructure/pi/pi-agent-runtime.ts` | 预检压缩可用性、暴露 `compactionAvailable` 并映射错误 |
| `src/server/domain/app-error.ts` | `COMPACTION_NOT_AVAILABLE` 错误码定义 |
| `src/server/domain/message.ts` | `CompactionSummaryMessage` 类型定义 |
| `src/server/infrastructure/pi/message-mapper.ts` | Pi SDK 消息映射为 `compactionSummary` |
| `src/server/infrastructure/pi/pi-session-repository.ts` | `buildAlignedContext` 构建 compact 后的消息列表 |
| `src/features/chat/agent-api.ts` | `ApiRequestError` 携带错误码 |
| `src/features/chat/agent-types.ts` | `CompactionSummaryMessage` 前端类型 |
| `src/features/chat/use-chat-controller.ts` | `compact()` 函数、`canCompact` 派生、状态管理、SSE 事件处理 |
| `src/features/chat/chat-input.tsx` | Compact 按钮、状态横幅、`InlineStatus` 组件 |
| `src/features/chat/message-view.tsx` | 消息列表过滤（`compactionSummary` 不渲染） |
| `src/i18n/dictionaries/zh.ts` / `en.ts` | i18n 字典 |
