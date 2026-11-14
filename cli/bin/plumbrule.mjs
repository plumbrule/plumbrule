#!/usr/bin/env node
// 准绳安装器：把随包附带的技能复制到 Agent 的技能目录。没有第三方依赖，可离线使用。
//
//   plumbrule install [--agent claude|codex|all] [--project] [--dir <目录>]
//   plumbrule uninstall [同上]
//   plumbrule agents-md --tags lang:go,kind:service [--full] [--soft]
//   plumbrule where
import { cpSync, existsSync, rmSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const skillSrc = join(here, '../skill/plumbrule');
const [cmd, ...args] = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const flag = (name) => args.includes(name);

// 各 Agent 读取技能的位置（以官方文档为准，2026-11-14 核实）
const TARGETS = {
  claude: { name: 'Claude Code', user: join(homedir(), '.claude/skills'), project: '.claude/skills' },
  codex: { name: 'Codex', user: join(homedir(), '.agents/skills'), project: '.agents/skills' },
};

function targets() {
  if (opt('--dir')) return [{ name: '指定目录', dir: resolve(opt('--dir')) }];
  const agent = opt('--agent') ?? 'all';
  const keys = agent === 'all' ? Object.keys(TARGETS) : agent.split(',');
  for (const k of keys) if (!TARGETS[k]) die(`不认识的 Agent：${k}（可选：${Object.keys(TARGETS).join('、')}、all）`);
  return keys.map((k) => ({ name: TARGETS[k].name, dir: flag('--project') ? resolve(TARGETS[k].project) : TARGETS[k].user }));
}

function die(msg, code = 1) { console.error(msg); process.exit(code); }

function version() {
  const m = readFileSync(join(skillSrc, 'SKILL.md'), 'utf8').match(/version:\s*"([^"]+)"/);
  return m ? m[1] : '未知';
}

switch (cmd) {
  case 'install': {
    if (!existsSync(skillSrc)) die('安装包里缺少技能文件，请重新下载。');
    for (const t of targets()) {
      const dest = join(t.dir, 'plumbrule');
      mkdirSync(t.dir, { recursive: true });
      rmSync(dest, { recursive: true, force: true });
      cpSync(skillSrc, dest, { recursive: true });
      console.log(`已安装准绳 ${version()} → ${t.name}：${dest}`);
    }
    console.log('重启 Agent 后生效。');
    break;
  }
  case 'uninstall': {
    for (const t of targets()) {
      const dest = join(t.dir, 'plumbrule');
      if (existsSync(dest)) { rmSync(dest, { recursive: true }); console.log(`已移除：${dest}`); }
      else console.log(`没有安装：${dest}`);
    }
    break;
  }
  case 'agents-md': {
    const r = spawnSync(process.execPath, [join(skillSrc, 'scripts/agents-md.mjs'), ...args], { stdio: 'inherit' });
    process.exit(r.status ?? 1);
  }
  case 'where': {
    for (const [k, t] of Object.entries(TARGETS)) console.log(`${t.name}（--agent ${k}）：用户级 ${t.user}　项目级 ./${t.project}`);
    break;
  }
  default:
    console.log(`准绳（Plumbrule）${existsSync(skillSrc) ? version() : ''}

用法：
  plumbrule install [--agent claude|codex|all] [--project] [--dir <目录>]
      安装技能。默认装到所有支持的 Agent 的用户目录；--project 装到当前项目。
  plumbrule uninstall [同上参数]
  plumbrule agents-md --tags <标签,…> [--full] [--soft]
      输出适用于本项目的规则，合并进 AGENTS.md。
  plumbrule where
      显示各 Agent 的技能目录。`);
    if (cmd && cmd !== 'help' && cmd !== '--help' && cmd !== '-h') process.exit(2);
}
