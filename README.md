# 准绳 · Plumbrule

一套通用的软件工程规范，同一份源文件有三种用法：

- **网站**：给人查阅，可以搜索、筛选，每条规则有固定链接。
- **技能**：采用 Agent Skills 格式，Claude Code、Codex 等编码 Agent 写代码时会按需查阅。
- **生成 AGENTS.md 片段**：按项目用到的语言和端，挑出适用的硬约束。

每条规则都写明是硬约束还是软指导、怎么检查、为什么，以及出处在哪。网站提供中文（`/`）和英文（`/en/`）两个版本。

## 安装技能

```sh
npx plumbrule install                 # 装到 Claude Code 和 Codex 的用户目录
npx plumbrule install --agent codex   # 只装 Codex
npx plumbrule install --project       # 装到当前项目（.claude/skills、.agents/skills）
npx plumbrule agents-md --tags lang:go,kind:service   # 生成 AGENTS.md 片段
```

## 仓库结构

```text
rules/            规范源文件：每个主题一份 YAML，另有 _词表.yaml 和 _归属.yaml
rules/en/         英文版源文件，结构与中文版一一对应，编号相同
schema/           主题文件的 JSON Schema
tools/            校验、技能生成、AGENTS.md 生成、构建后打包
src/              网站（Astro Starlight），页面在构建时读取 rules/
cli/              安装器（npm 包 plumbrule）
.agents/skills/   维护技能 plumbrule-maintain（.claude/skills 里是指向它的链接）
docs/             编写指南、计划文档
```

## 常用命令

需要 Node.js 22.22 或更新版本，以及 pnpm。

```sh
pnpm install
pnpm check        # 校验全部规则：结构、编号、引用、软措辞，以及英文版完整性和一致性
pnpm dev          # 本地预览网站
pnpm build        # 校验 → 生成技能 → 构建网站 → 打包技能 zip（输出在 dist/site）
pnpm pack:cli     # 生成安装器的 npm 包（dist/plumbrule-<版本>.tgz）
pnpm release 0.2.0  # 准备发布：统一版本号、更新编号台账、构建打包
pnpm run deploy   # 构建并部署到 Cloudflare Workers（静态资源）；注意 `pnpm deploy` 是 pnpm 自带命令，要加 run
```

## 维护

先读 [docs/编写指南.md](docs/编写指南.md)，改完运行 `pnpm check`。每类事项只归一个主题管，归属见 `rules/_归属.yaml`。已发布的规则编号不能删、不能复用，删掉的登记在 `rules/_编号台账.yaml`。

修改规则时同步改 `rules/en/` 里的英文版，两边的编号和机器可读字段必须一致。修改、新增、废弃规则，新增主题，吸收调研，定期复核，发布新版本，这些事的完整步骤写在维护技能 [.agents/skills/plumbrule-maintain/SKILL.md](.agents/skills/plumbrule-maintain/SKILL.md) 里。在本仓库里打开 Claude Code 或 Codex 就能用：Claude Code 输入 `/plumbrule-maintain`，Codex 输入 `$plumbrule-maintain`；也可以直接说要做什么。

发布：先在更新记录里写好「## 新版本号（未发布）」，再运行 `pnpm release <新版本号>`。部署网站和发布 npm 由维护者手动执行。

## 授权

规范内容采用 CC BY 4.0 授权（见 [LICENSE-CONTENT.md](LICENSE-CONTENT.md)），代码采用 MIT 授权（见 [LICENSE](LICENSE)）。涉及法律、合规和许可证的内容只是工程参考，不构成法律意见。
