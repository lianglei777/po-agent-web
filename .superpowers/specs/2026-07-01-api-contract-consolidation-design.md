# 前后端 API 合同收口设计

## 目标

把 `src/contracts` 建立为浏览器与服务端之间公开协议的唯一 TypeScript 来源，覆盖现有全部 HTTP JSON 请求、JSON 响应和 SSE 事件。消除 `src/features` 与 `src/server/domain` 中重复维护的公开 DTO，确保合同变化会在 `npm run typecheck` 阶段暴露所有受影响调用方。

本次只收口类型，不改变 endpoint、状态码、响应结构、错误行为或业务逻辑，也不增加运行时 schema、代码生成器或第三方依赖。

## 已确认决策

- 使用共享 TypeScript 合同，不引入运行时响应校验。
- `src/contracts` 是不依赖 React、Next.js、Node.js、服务端模块或供应商 SDK 的最低共享层。
- 按能力拆分合同，不创建全局 endpoint 注册表。
- 保留各 feature 现有 API 模块和请求 helper，只替换它们使用的协议类型。
- 服务端业务专用类型继续位于 `src/server/domain`，UI 表单、展示和交互状态继续位于对应 feature。
- 公开 HTTP 形状保持不变，并与 `docs/agent-api-reference.md` 同步。

## 方案比较

### 方案 A：共享合同作为唯一来源

公开 DTO 位于 `src/contracts`，服务端和客户端共同引用。服务端现有 domain 文件可以重导出合同类型以减少迁移噪音，但不得保留重复定义。

结论：采用。它不增加依赖，并能让 TypeScript 直接发现跨层漂移。

### 方案 B：保留重复类型并增加一致性测试

改动较小，但合同仍有多个来源；每次新增字段都依赖维护者记得更新比较测试。

结论：不采用。

### 方案 C：OpenAPI 或代码生成

可以生成客户端类型，但需要新增工具链和生成文件，且当前项目仍需另外处理 SSE、domain 映射和生成物同步。

结论：当前不采用；出现独立外部客户端时再评估。

## 合同结构

`src/contracts` 按公开能力组织：

```text
src/contracts/
  common.ts
  system.ts
  agent.ts
  auth.ts
  files.ts
  models.ts
  projects.ts
  sessions.ts
  skills.ts
  model-compat.ts
```

- `common.ts`：统一错误响应和通用成功响应。
- `system.ts`：Home 等应用级环境信息响应。
- `agent.ts`：创建 Agent、命令及对应结果、运行时状态、消息和 Agent SSE 事件。
- `auth.ts`：OAuth/API Key provider、状态、请求响应和 OAuth SSE 事件。
- `files.ts`：目录项、文本读取响应、文件监听 SSE 事件。二进制流继续使用原生 `Response`，不伪造 JSON DTO。
- `models.ts`：模型列表、配置 bootstrap、发现、测试及相关诊断类型。
- `projects.ts`：项目列表、添加、删除、目录浏览请求响应。
- `sessions.ts`：Session 列表、详情、上下文、重命名和删除请求响应。
- `skills.ts`：加载、搜索、安装、移除和调用开关请求响应。
- `model-compat.ts`：保留现有模型兼容逻辑和类型。

合同文件只包含可序列化数据、字面量联合、常量和纯类型。不得包含 fetch、validator、React 状态或服务端实现。

## 类型所有权

以下类型必须迁入或由 `src/contracts` 唯一定义：

- HTTP body、query 解析后输入和 JSON 响应。
- SSE 线上发送的事件。
- 同时被浏览器和服务端理解的消息、命令、状态和错误结构。

以下类型不迁移：

- `AppError`、port、repository、service 和基础设施内部类型。
- React 组件 props、表单草稿、加载状态、选择状态和展示模型。
- 文件二进制流、Node.js stream、AbortSignal、Request、Response 等运行时对象。
- Pi SDK 或其他供应商类型。

服务端 domain 若需要公开合同类型，直接导入或重导出 `src/contracts`；不能复制字段。domain 仍可在公开 DTO 之外定义业务内部类型。

## 编译期数据流

每个 endpoint 使用同一合同贯穿调用链：

```text
feature API input
  -> shared Request type
  -> transport validator
  -> application/domain
  -> Route Handler handleRoute<Response type>
  -> feature API Promise<Response type>
```

具体约束：

- Transport validator 显式返回对应共享请求类型。
- JSON Route Handler 显式调用 `handleRoute<ResponseType>(...)`，让返回值在服务端编译期接受检查。
- SSE Route Handler 的 `createSseResponse<EventType>` 使用共享事件类型。
- 客户端 API 函数的参数和返回值使用共享合同，不再内联响应对象或引用 feature 镜像类型。
- Agent 命令使用命令判别联合及命令到结果的类型映射，删除允许调用方任意指定结果的 `sendCommand<T>`。
- 路径参数仍由 Next.js `Context` 描述；只有进入公开协议的数据形状进入 contracts。

## 错误合同

`common.ts` 定义现有错误响应：

```ts
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

各 feature 的请求 helper 使用该类型读取失败响应。此修改只统一编译期认识，不合并 helper，也不改变当前错误展示或异常类。

## 迁移顺序

迁移按依赖从低到高进行，保持每一步可通过类型检查：

1. 增加 `common` 及按能力拆分的合同文件。
2. 迁移 Agent、消息、Session 等被多处复用的基础公开类型。
3. 让 server domain 删除重复定义并改为导入或重导出合同。
4. 让 transport validator、SSE 和 Route Handler 显式绑定请求、响应与事件类型。
5. 让各 feature API 使用共享合同，并删除 feature 中重复 DTO。
6. 保留真正的 UI 状态类型，修复因命名相近而错误混入合同的引用。
7. 对照全部 Route Handler 更新 `docs/agent-api-reference.md` 中缺失或过期的字段。
8. 更新架构文档，明确 `contracts` 是 domain 和 UI 都可依赖的纯共享底层。

迁移不按文件行数触发额外拆分，不顺带统一 fetch helper，也不重写业务服务。

## 已知漂移修复

当前至少存在以下合同漂移，实施时必须修复并留下回归检查：

- 客户端 `AgentCommand` 缺少 `set_auto_compaction` 和 `set_auto_retry`。
- 客户端运行时状态缺少 `sessionFile`、`autoCompactionEnabled` 和 `autoRetryEnabled`。

实施盘点若发现文档、Route Handler 和客户端之间存在其他字段差异，以当前服务端实际响应和已记录的公共 API 为依据确认；不得静默改变运行时形状来迁就旧客户端类型。

## 测试与验证

- 使用 TypeScript 编译检查作为合同一致性的主要门禁。
- 更新现有 API adapter、transport validator、SSE 和相关 fixture 测试。
- 为 Agent 命令结果映射和运行时状态字段增加最小回归测试。
- 验证每个 JSON Route Handler 都显式绑定响应合同，每个 SSE Route Handler 都绑定事件合同。
- 运行 `npm run check`。
- 因 Route Handler 类型会被修改，运行 `npm run build` 验证 Next.js 生产编译。

## 非目标

- 不引入 Zod、Valibot、OpenAPI、tRPC 或其他协议框架。
- 不增加运行时响应解析。
- 不建立统一 API SDK、endpoint registry 或通用 repository。
- 不统一所有 feature 的错误 UI 或请求 helper。
- 不改变 HTTP 路径、方法、状态码、JSON 字段或 SSE 事件名。
- 不把 UI 专用状态、服务端内部对象或供应商类型放入共享合同。
