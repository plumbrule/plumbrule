# plumbrule

[准绳 Plumbrule](https://plumbrule.dev) 的安装器：把通用工程规范作为技能（Agent Skills 格式）装到 Claude Code、Codex 等编码 Agent。

```sh
npx plumbrule install                    # 装到 Claude Code 和 Codex 的用户目录
npx plumbrule install --agent codex      # 只装一个：claude 或 codex
npx plumbrule install --project          # 装到当前项目
npx plumbrule agents-md --tags lang:go,kind:service   # 生成 AGENTS.md 片段（主题索引）
npx plumbrule agents-md --tags lang:go --full         # 逐条列出硬约束
npx plumbrule uninstall
```

代码采用 MIT 许可；规范内容（`skill/` 目录）采用 CC BY 4.0。
