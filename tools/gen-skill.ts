// 从规则表生成 Agent 技能：dist/skill/plumbrule/
//   SKILL.md                 何时用、怎么查
//   references/NN-slug.md    每个主题的精简规则与选型
//   data/rules.json          给脚本用的规则数据
//   scripts/agents-md.mjs    按项目情况生成 AGENTS.md 片段
// 用法：pnpm gen:skill
import { mkdirSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { root, config, vocab, loadTopics, levelName, checkName, ruleUrl, topicUrl, type Topic } from './lib.ts';

const out = join(root, 'dist/skill/plumbrule');
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'references'), { recursive: true });
mkdirSync(join(out, 'data'), { recursive: true });
mkdirSync(join(out, 'scripts'), { recursive: true });

const topics = loadTopics();
const refName = (t: Topic) => `references/${t.id}-${t.slug}.md`;

// ── 每个主题一份参考文件 ──
for (const t of topics) {
  const lines: string[] = [];
  lines.push(`# ${t.id} ${t.title}`, '', t.summary, '', `网页版：${topicUrl(t)}　复核日期：${t.reviewed_on}（下次 ${t.next_review}）`, '');
  if (t.legal_notice) lines.push('> 本主题涉及法规，内容不构成法律意见。', '');
  if (t.scope?.excludes?.length) {
    lines.push('不在本主题：' + t.scope.excludes.map((e) => `${e.what}（见 ${e.see}）`).join('；'), '');
  }
  for (const level of ['hard', 'soft'] as const) {
    const rs = t.rules.filter((r) => r.level === level);
    if (!rs.length) continue;
    lines.push(`## ${levelName(level)}`, '');
    for (const r of rs) {
      const scope = r.applies.includes('all') ? '' : `　适用：${r.applies.map((a) => vocab['适用范围'][a]).join('、')}`;
      lines.push(`- **${r.id}** ${r.title}`);
      lines.push(`  - 检查（${checkName(r.check)}）：${r.how}${scope}`);
      if (r.ref_value) lines.push(`  - 参考值：${r.ref_value}`);
      if (r.see?.length) lines.push(`  - 另见：${r.see.join('、')}`);
    }
    lines.push('');
  }
  if (t.choices?.length) {
    lines.push('## 选型', '', '| 类别 | 默认 | 备选 | 不推荐 |', '|---|---|---|---|');
    for (const c of t.choices) {
      const alt = (c.alternatives ?? []).map((a) => `${a.name}（${a.when}）`).join('；') || '—';
      const avoid = (c.avoid ?? []).map((a) => `${a.name}（${a.why}）`).join('；') || '—';
      lines.push(`| ${c.category} | ${c.pick}${c.license ? `〔${c.license}〕` : ''} | ${alt} | ${avoid} |`);
    }
    lines.push('');
  }
  if (t.open_questions?.length) {
    lines.push('## 待确认（不要当成规则执行）', '', ...t.open_questions.map((q) => `- ${q}`), '');
  }
  writeFileSync(join(out, refName(t)), lines.join('\n'));
}

// ── SKILL.md ──
const description =
  '通用工程规范「准绳」。写代码、选依赖和框架、设计接口或数据库、写测试、配置 CI 与发布、处理安全隐私许可、开发 Web/移动/桌面应用、' +
  '调用大模型、或作为编码 Agent 在仓库里工作时，用它查对应主题的规则和推荐选型；也可以为项目生成 AGENTS.md。项目自己的规范优先。与软件工程无关的问题不要用。';
if (description.length > 1024) throw new Error('description 超过 1024 字符');

const index = topics.map((t) => `| ${t.id} | ${t.title} | \`${refName(t)}\` | ${t.summary} |`).join('\n');
const skill = `---
name: plumbrule
description: ${description}
license: CC-BY-4.0
metadata:
  version: "${config.version}"
  site: "${config.siteUrl}"
---

# 准绳（Plumbrule）

一套通用工程规范。每条规则有编号（如 \`AGT-013\`）、级别和检查方法。

## 怎么用

1. 先看下面的索引，按当前任务找到相关主题，**只读需要的那一两份** \`references/\` 文件，不要全部读。
2. **硬约束**：必须遵守。做不到时停下来，说明是哪条规则、为什么做不到。
3. **软指导**：默认照做；有理由不照做时，在交付说明里写明规则编号和理由。
4. **项目优先**：仓库自己的 AGENTS.md、CLAUDE.md、CONTRIBUTING 等与本规范冲突时，以项目为准，并在交付说明里指出冲突。
5. 「待确认」里的内容还没核实，不要当成规则执行。
6. 引用规则时写编号，方便人到网站上查：${config.siteUrl}

## 为项目生成 AGENTS.md

用户要求「按准绳给项目写 AGENTS.md」时：

1. 看仓库用了哪些语言和端（package.json、go.mod、pyproject.toml、Cargo.toml、build.gradle、*.xcodeproj 等）；
2. 运行 \`node scripts/agents-md.mjs --tags <标签,逗号分隔>\`，标签取值：${Object.keys(vocab['适用范围']).filter((k) => k !== 'all').join('、')}；
3. 默认输出精简版：适用主题的索引和链接，合并进仓库的 AGENTS.md（已有的内容保留，项目约定优先），补上本项目的构建、测试命令。用户明确要把规则逐条写进仓库时才加 \`--full\`；入口文件要短，逐条列出几百条规则会被忽略。

没有 Node 时，直接从相关 \`references/\` 文件里挑出硬约束手写。

## 主题索引

| 编号 | 主题 | 文件 | 管什么 |
|---|---|---|---|
${index}
`;
writeFileSync(join(out, 'SKILL.md'), skill);

// ── 数据和脚本 ──
const data = {
  version: config.version,
  siteUrl: config.siteUrl,
  tags: vocab['适用范围'],
  rules: topics.flatMap((t) =>
    t.rules.map((r) => ({ id: r.id, topic: t.id, topicTitle: t.title, title: r.title, level: r.level, how: r.how, applies: r.applies, url: ruleUrl(t, r) })),
  ),
};
writeFileSync(join(out, 'data/rules.json'), JSON.stringify(data));
copyFileSync(join(root, 'tools/agents-md.mjs'), join(out, 'scripts/agents-md.mjs'));
copyFileSync(join(root, 'tools/agents-md-core.mjs'), join(out, 'scripts/agents-md-core.mjs'));

console.log(`技能已生成：${out}（${topics.length} 个主题，${data.rules.length} 条规则）`);
