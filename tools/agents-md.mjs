#!/usr/bin/env node
// 按项目情况输出一份 AGENTS.md 片段：只含适用的硬约束。
// 用法：node agents-md.mjs --tags lang:go,kind:service [--soft] [--data path/to/rules.json]
// 不依赖任何第三方包，随技能一起分发。
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const here = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(opt('--data') ?? join(here, '../data/rules.json'), 'utf8'));

const tags = new Set((opt('--tags') ?? '').split(',').map((s) => s.trim()).filter(Boolean));
const unknown = [...tags].filter((t) => !(t in data.tags));
if (unknown.length) {
  console.error(`不认识的标签：${unknown.join('、')}\n可用标签：${Object.keys(data.tags).filter((k) => k !== 'all').join('、')}`);
  process.exit(2);
}
const withSoft = args.includes('--soft');
const applies = (r) => r.applies.some((a) => a === 'all' || tags.has(a));
const picked = data.rules.filter((r) => applies(r) && (withSoft || r.level === 'hard'));

const byTopic = new Map();
for (const r of picked) {
  if (!byTopic.has(r.topic)) byTopic.set(r.topic, { title: r.topicTitle, rules: [] });
  byTopic.get(r.topic).rules.push(r);
}

const out = [];
out.push(`## 工程规范（准绳 ${data.version}）`, '');
out.push(`以下是适用于本项目的${withSoft ? '规则' : '硬约束'}，来自准绳（${data.siteUrl}）。与本文件其他内容冲突时，以本项目的约定为准。`);
out.push(`适用范围：${tags.size ? [...tags].map((t) => data.tags[t]).join('、') : '所有项目通用部分'}`, '');
for (const [id, t] of [...byTopic].sort()) {
  out.push(`### ${id} ${t.title}`, '');
  for (const r of t.rules) out.push(`- ${r.level === 'soft' ? '（建议）' : ''}${r.title}〔${r.id}〕`);
  out.push('');
}
out.push(`细则和理由：${data.siteUrl}`);
console.log(out.join('\n'));
