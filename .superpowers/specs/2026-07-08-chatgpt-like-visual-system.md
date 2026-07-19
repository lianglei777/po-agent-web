# ChatGPT-like Visual System Spec

## Goal

将 Po Agent 的浅色视觉系统尽量向 ChatGPT Web 靠近，优先改善配色、基础控件质感和聊天工作区的视觉舒适度。此次不支持暗色模式，不重做业务流程，不引入新依赖。

## Design Direction

采用接近 ChatGPT Web 的中性浅灰体系：白色主画布、浅灰侧栏、柔和边界、低饱和 hover 和 selected 状态。当前 mint 绿色从品牌主视觉降级为状态色，仅用于运行中、成功、焦点等需要明确反馈的位置。

界面应保留 Po Agent 的开发者工具密度和项目/会话工作流，但视觉上减少“表单面板感”和强边框，让主聊天内容、输入区和侧边栏更轻。

## Scope

- 更新 `DESIGN.md` 的浅色 token，记录新的 ChatGPT-like 视觉方向。
- 更新全局 CSS token，使画布、面板、边框、hover、selected、focus、shadow 更接近 ChatGPT Web。
- 调整共享 UI primitives 的视觉状态，优先覆盖 Button、Input、Textarea、Select、Dropdown、Tooltip、Card、Badge 等已有组件。
- 调整侧边栏的灰阶背景、选中态、hover 态、边框强度和列表密度。
- 调整聊天区的消息、代码块、工具过程和 composer 视觉，使它们更接近 ChatGPT 的浅灰容器、柔和圆角和弱边界。
- 保留现有 i18n 文案和 API 合约。

## Non-goals

- 不做 ChatGPT 商标、Logo、专有图形资产或品牌命名复刻。
- 不实现暗色模式，也不专门优化现有暗色 token。
- 不重写会话、模型、技能、文件工作区等业务逻辑。
- 不引入 Tailwind、Radix 之外的新 UI 库或图标库。
- 不做大规模布局重构；若需要对齐 composer 和内容列，只做完成视觉目标所需的最小结构调整。

## Visual Requirements

- 主背景接近白色，侧栏使用浅灰，面板边界用极浅灰线。
- selected 状态默认使用浅灰块，不再使用显眼 mint 填充。
- focus-visible 仍必须清晰，允许使用低饱和状态色或黑色 ring。
- primary action 使用黑色或接近黑色；secondary/ghost action 使用灰阶。
- composer 应具有 ChatGPT-like floating/pill 质感：更柔和圆角、轻阴影、弱边框、紧凑工具栏。
- 代码块和工具过程使用浅灰容器，避免重边框和高对比装饰。
- 右侧 minimap/进度标记若保留，应显著弱化，不能抢主聊天区视觉焦点。

## Interaction Requirements

- hover 只改变色调或阴影，不改变布局尺寸。
- disabled 状态必须保持可解释性；已有 tooltip 行为不能退化。
- keyboard focus 必须可见。
- composer 的发送、附件、模型选择、thinking、compact 等现有操作入口保持可用。
- 视觉改造不能改变 SSE、取消、压缩、会话切换等流程。

## Implementation Shape

最小实现路径：

1. 先更新设计 token 和 `globals.css` 变量。
2. 再调整共享 UI primitives，让通用控件自动继承新视觉。
3. 最后只在 chat/sidebar/layout 的局部 CSS 中处理无法通过 token 覆盖的视觉差异。

避免新增抽象。已有组件能通过 className 或 token 解决的地方，不拆新组件。

## Verification

- 运行 `npm run check`。
- 如果改动影响 Next.js routing、rendering、configuration 或 production behavior，再运行 `npm run build`。
- 对受影响 UI，在浏览器检查 1024px、1440px、1920px 宽度。
- 检查中文和英文界面，确保文本不溢出、按钮不跳动、focus 可见。

## Open Decision

本规格默认采用“尽量复刻 ChatGPT Web 的视觉感受，但保留 Po Agent 的产品结构”。如果后续需要更接近 1:1 的布局复刻，应另开布局规格。
