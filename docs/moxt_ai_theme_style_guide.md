# Moxt.ai 网站主题风格与配色方案调研文档

## 1. 调研目标

本文档基于 Moxt.ai 官网公开页面的视觉风格、产品表达、页面结构和功能模块进行整理，目标是提炼一套可迁移到其他 AI Agent / Workflow / Workspace 类产品中的主题风格方案。

该方案并不是 Moxt.ai 官方设计 token，而是根据页面视觉效果和产品设计语言总结出的近似风格规范，可作为其他项目的主题设计参考。

---

## 2. Moxt.ai 网站整体定位

Moxt.ai 的官网不是传统 SaaS 工具站，而是围绕 **AI-Native Team / Agent-Native Workspace** 构建叙事。

它传达的核心不是“用户和 AI 聊天”，而是：

> 用户可以组建 AI 团队，编排 Workflow，让多个 Agent 长时间执行任务，并通过 Workspace、Mini App、Automation 等能力完成复杂工作。

从公开页面来看，Moxt.ai 的产品表达主要围绕以下方向展开：

| 页面 / 模块 | 核心表达 |
|---|---|
| 首页 | 总体介绍 Workflow、Agent Board、Mini App、Workspace、AI Teammates、Pricing |
| Multi-agent Orchestration | 多 Agent 工作流、看板、列表、流程图、活动流、人类审批节点 |
| AI Teammates | AI teammate、记忆、技能、工具调用、浏览器、文件、代码能力 |
| Mini Apps | Workspace 内自定义全栈应用、数据库、权限、实时协作、Agent 可读写 |
| Agent-native Workspace | 文件系统、Markdown、HTML、CSV、JSON、YAML 等 Agent 友好格式 |
| Automations | 定时任务、Webhook 触发、自动响应、活动日志、人类审批门 |
| Integrations | Slack、GitHub、Notion、Gmail、Linear、Google Drive、Stripe、Airtable 等集成 |
| Browser Operator | 浏览器插件，让 Agent 使用当前浏览器登录态执行网页任务 |
| CLI & MCP | 通过 CLI / MCP 连接外部 Agent 和 Workspace |
| Pricing | Credits 计费、模型官方价格、无座席订阅叙事 |
| Blog / What’s New | 内容营销、产品理念、AI-native team 理念输出 |

---

## 3. 整体设计风格关键词

Moxt.ai 的视觉风格可以概括为：

> **极简白底 + 高对比黑字 + 友好绿色 AI 感 + 轻量卡片系统 + 产品界面截图驱动叙事**

它不是典型的深色科技风，也不是强渐变赛博风，而更接近以下几种风格的结合：

- Notion 式文档感
- Linear 式产品秩序感
- Arc / Dia 式轻盈科技感
- AI 产品常用的绿色生命体识别
- 轻卡片、轻阴影、轻动效

整体气质是：

> **干净、聪明、可信、轻松、有一点可爱，但不幼稚。**

---

## 4. 主题配色方案

### 4.1 主色板

| 用途 | 色值 | 说明 |
|---|---:|---|
| Brand Green / 主品牌绿 | `#22E68A` | 核心 AI 生命感颜色，适合 logo、Agent 状态、主视觉高亮 |
| Brand Green Deep | `#16C978` | hover、active、进度、成功状态 |
| Brand Green Soft | `#DDFBEA` | 浅绿色背景、提示块、AI 状态区域 |
| Brand Mint Surface | `#F1FFF7` | 大面积浅绿背景、hero 氛围光 |
| Black / 主文本 | `#0A0A0A` | 标题、主按钮、核心文字 |
| Ink Gray | `#2A2A2A` | 正文文本 |
| Muted Gray | `#6B7280` | 辅助说明、二级导航、caption |
| Border Gray | `#E5E7EB` | 卡片边框、分割线 |
| Surface White | `#FFFFFF` | 页面主体背景 |
| Warm Off-white | `#FAFAF7` | 比纯白更柔和的页面底色 |
| Code / Workspace Surface | `#F7F7F4` | 文档、表格、workspace 预览区域 |
| Danger Red | `#EF4444` | 错误、失败、删除 |
| Warning Amber | `#F59E0B` | 等待、人类审批、告警 |
| Info Blue | `#3B82F6` | 链接、信息状态，不建议作为品牌主色 |

---

## 5. 推荐 CSS Design Tokens

```css
:root {
  /* Base */
  --background: #fbfbf8;
  --foreground: #0a0a0a;

  /* Surface */
  --surface: #ffffff;
  --surface-soft: #f7f7f4;
  --surface-muted: #f1f1ed;
  --surface-mint: #f1fff7;
  --surface-code: #f6f6f2;

  /* Brand */
  --brand: #22e68a;
  --brand-hover: #16c978;
  --brand-active: #0fb86b;
  --brand-soft: #ddfbea;
  --brand-faint: #effff6;

  /* Text */
  --text-primary: #0a0a0a;
  --text-secondary: #3f3f46;
  --text-muted: #71717a;
  --text-faint: #a1a1aa;
  --text-inverse: #ffffff;

  /* Border */
  --border: #e7e5df;
  --border-muted: #eeeeea;
  --border-strong: #d6d3ca;

  /* Status */
  --success: #22c55e;
  --success-soft: #dcfce7;
  --warning: #f59e0b;
  --warning-soft: #fef3c7;
  --danger: #ef4444;
  --danger-soft: #fee2e2;
  --info: #3b82f6;
  --info-soft: #dbeafe;

  /* Radius */
  --radius-xs: 6px;
  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --radius-pill: 999px;

  /* Shadow */
  --shadow-xs: 0 1px 2px rgba(10, 10, 10, 0.04);
  --shadow-sm: 0 4px 16px rgba(10, 10, 10, 0.06);
  --shadow-md: 0 12px 40px rgba(10, 10, 10, 0.08);
  --shadow-lg: 0 20px 70px rgba(10, 10, 10, 0.12);
}
```

---

## 6. Tailwind 主题配置建议

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        background: "#fbfbf8",
        foreground: "#0a0a0a",
        surface: {
          DEFAULT: "#ffffff",
          soft: "#f7f7f4",
          muted: "#f1f1ed",
          mint: "#f1fff7",
          code: "#f6f6f2",
        },
        brand: {
          DEFAULT: "#22e68a",
          hover: "#16c978",
          active: "#0fb86b",
          soft: "#ddfbea",
          faint: "#effff6",
        },
        ink: {
          DEFAULT: "#0a0a0a",
          secondary: "#3f3f46",
          muted: "#71717a",
          faint: "#a1a1aa",
        },
        border: {
          DEFAULT: "#e7e5df",
          muted: "#eeeeea",
          strong: "#d6d3ca",
        },
      },
      borderRadius: {
        xs: "6px",
        sm: "10px",
        md: "14px",
        lg: "20px",
        xl: "28px",
        pill: "999px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(10, 10, 10, 0.04)",
        sm: "0 4px 16px rgba(10, 10, 10, 0.06)",
        md: "0 12px 40px rgba(10, 10, 10, 0.08)",
        lg: "0 20px 70px rgba(10, 10, 10, 0.12)",
      },
    },
  },
};
```

---

## 7. 页面设计模式总结

### 7.1 Hero 区设计

Moxt.ai 的 Hero 区通常具备以下特征：

- 顶部极简导航
- 中央大标题
- 一句短副标题
- 黑色主 CTA
- 绿色描边或浅绿次 CTA
- 下方产品截图或 Agent 可视化模块

推荐结构：

```tsx
<section className="bg-background px-6 pt-28 pb-20">
  <div className="mx-auto max-w-5xl text-center">
    <h1 className="text-6xl font-semibold tracking-tight text-foreground">
      Build your AI-native team.
    </h1>

    <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-muted">
      Build workflows, apps, and context. Let your agent team handle long-horizon work.
    </p>

    <div className="mt-8 flex justify-center gap-3">
      <button className="rounded-pill bg-foreground px-6 py-3 text-white shadow-sm">
        Get Started
      </button>
      <button className="rounded-pill border border-brand/40 bg-brand-faint px-6 py-3 text-foreground">
        See how it works
      </button>
    </div>
  </div>
</section>
```

---

### 7.2 产品截图卡片

Moxt.ai 经常将复杂功能包装成“产品界面卡片”，例如：

- Workflow Board
- Mini App 数据表
- Workspace 文件系统
- Automation Timeline
- Agent Activity Stream

推荐组件风格：

```css
.product-card {
  background: #ffffff;
  border: 1px solid #e7e5df;
  border-radius: 28px;
  box-shadow: 0 20px 70px rgba(10, 10, 10, 0.08);
  overflow: hidden;
}
```

核心原则：

- 不使用厚重阴影
- 不使用强烈玻璃拟态
- 以细边框、大圆角、轻阴影制造高级感
- 产品截图本身承担主要解释功能

---

### 7.3 Agent 状态标签

Moxt.ai 这类 Agent 产品中常见状态包括：

- Running
- Done
- Awaiting you
- Approved
- Back to WIP
- In progress
- Up next
- Queued

这类状态适合设计成小型 pill 标签：

```css
.status-running {
  color: #0f7a4f;
  background: #ddfbea;
  border: 1px solid #b8f3d2;
}

.status-waiting {
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fde68a;
}

.status-done {
  color: #166534;
  background: #dcfce7;
  border: 1px solid #bbf7d0;
}
```

---

## 8. 绿色使用原则

Moxt.ai 的高级感并不来自绿色本身，而是来自以下组合：

1. 大面积留白
2. 高对比黑色标题
3. 绿色只做少量关键高亮
4. 组件边框很轻
5. 产品截图承担解释功能
6. 文案短、直接、有动词
7. AI 元素拟人化，但不过度卡通

推荐绿色使用比例：

```txt
白 / 米白：70%
黑 / 深灰：15%
浅灰边框：10%
品牌绿：5%
```

绿色适合用于：

- Logo
- CTA 辅助按钮
- Agent 在线状态
- Running / Done 状态
- 关键数字增长
- Hero 装饰光晕
- Workflow 进度节点

不建议将绿色大面积铺满页面，否则容易削弱高级感，使页面显得廉价。

---

## 9. 可复用主题命名建议

如果要将这套主题迁移到其他项目，不建议直接命名为 `moxt-theme`，更适合抽象成独立主题。

### 方案 A：Agent Mint

适合 AI Agent、Workflow、自动化平台。

```txt
Agent Mint Theme
白底、黑字、薄荷绿高亮、文档感卡片、轻量 AI 氛围
```

### 方案 B：Workspace Minimal

适合知识库、文档系统、团队协作工具。

```txt
Workspace Minimal Theme
温白背景、低饱和灰边框、黑色 CTA、绿色状态提示
```

### 方案 C：Human AI Soft Tech

适合强调“人机协作”的产品。

```txt
Human AI Soft Tech
不像传统 B 端后台那么硬，也不像消费产品那么软，介于二者之间
```

最推荐使用：

> **Agent Mint**

---

## 10. 用于 Po Agent Web 的适配建议

如果这套方案用于 Po Agent Web 这类本地 AI Agent 产品，建议优先采用以下策略：

| 设计项 | 推荐方案 |
|---|---|
| 页面背景 | `#fbfbf8` 温白背景 |
| 主文本 | `#0a0a0a` 高对比黑色 |
| 主品牌色 | `#22e68a` 薄荷绿 |
| 主按钮 | 黑底白字，而不是绿色按钮 |
| Agent 运行状态 | 使用绿色状态标识 |
| Workflow 节点状态 | 绿色 / 琥珀色 / 灰色 |
| 卡片 | 白底、细边框、大圆角、轻阴影 |
| 空状态 | 使用简洁文案 + Agent 动效 + 轻量卡片 |
| 功能区 | 以 Workflow、Skill、Memory、File、Automation 作为一级概念 |

推荐最终主题：

```txt
Theme Name: Agent Mint

Primary:      #22E68A
Primary Dark: #16C978
Primary Soft: #DDFBEA

Background:   #FBFBF8
Surface:      #FFFFFF
Surface Soft: #F7F7F4

Text Main:    #0A0A0A
Text Sub:     #3F3F46
Text Muted:   #71717A

Border:       #E7E5DF
Shadow:       rgba(10, 10, 10, 0.06 ~ 0.12)

CTA Primary:  黑底白字
CTA Secondary: 浅绿底 / 绿色描边 / 黑字

Visual Mood:
极简、轻盈、可信、聪明、Agent-native、Workspace-first
```

---

## 11. 最终结论

Moxt.ai 的主题风格值得借鉴的地方，不是单纯的绿色配色，而是它围绕 AI Agent 产品建立了一套轻盈、可信、可操作的界面语言。

对于 Po Agent Web 或其他 AI Workflow 产品，最值得借鉴的是：

- 用温白背景替代冷白或深黑背景
- 用黑色按钮承担主 CTA，而不是过度依赖品牌色
- 用绿色表达 Agent 状态和智能生命感
- 用大圆角卡片承载复杂功能
- 用产品界面截图或可视化模块解释能力
- 用状态标签和活动流增强“Agent 正在工作”的感知
- 用 Workspace / Workflow / Automation / Mini App 这些概念组织产品信息架构

最终可沉淀为一套适用于 AI Agent 产品的主题：

> **Agent Mint：温白背景、黑色主控、薄荷绿智能状态、轻量卡片、Agent-native 工作空间风格。**
