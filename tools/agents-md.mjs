#!/usr/bin/env node
// 按项目情况输出一份 AGENTS.md 片段。默认是精简版（适用主题的索引），--full 逐条列出硬约束，--soft 再加上软指导。
// 用法：node agents-md.mjs --tags lang:go,kind:service [--full] [--soft] [--data path/to/rules.json]
// 不依赖任何第三方包，随技能一起分发。
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderAgentsMd } from './agents-md-core.mjs';

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
console.log(renderAgentsMd(data, tags, { soft: args.includes('--soft'), full: args.includes('--full') }).text);
