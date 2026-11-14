// 校验 rules/ 下所有主题文件。用法：pnpm check
// 失败时逐条列出问题并以非零状态退出。
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { topicGroups } from './lib.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rulesDir = join(root, 'rules');
const load = (p: string) => parse(readFileSync(p, 'utf8'));

const vocab = load(join(rulesDir, '_词表.yaml'));
const owners = load(join(rulesDir, '_归属.yaml'));
const schema = JSON.parse(readFileSync(join(root, 'schema/topic.schema.json'), 'utf8'));

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const appliesOk = new Set(Object.keys(vocab['适用范围']));
const topicMeta: Record<string, { slug: string; 前缀: string }> = owners['主题'];
// 硬约束里不该出现的软措辞
const softWords = ['尽量', '尽可能', '可行时', '如可能', '酌情', '视情况', '原则上', '一般应'];

const errors: string[] = [];
const err = (file: string, msg: string) => errors.push(`${file}: ${msg}`);

const files = readdirSync(rulesDir).filter((f) => /^\d{2}-[a-z0-9-]+\.yaml$/.test(f)).sort();
const topics = new Map<string, any>();
const ruleIds = new Map<string, string>();

for (const file of files) {
  const t = load(join(rulesDir, file));
  if (!validate(t)) {
    for (const e of validate.errors ?? []) err(file, `格式：${e.instancePath || '/'} ${e.message}`);
    continue;
  }
  const meta = topicMeta[t.id];
  if (!meta) { err(file, `主题编号 ${t.id} 不在 _归属.yaml`); continue; }
  if (file !== `${t.id}-${t.slug}.yaml`) err(file, `文件名应为 ${t.id}-${t.slug}.yaml`);
  if (t.slug !== meta.slug) err(file, `slug 应为 ${meta.slug}`);
  if (t.next_review <= t.reviewed_on) err(file, 'next_review 必须晚于 reviewed_on');
  topics.set(t.id, t);

  const srcIds = new Set<string>();
  const urls = new Map<string, string>();
  for (const s of t.sources) {
    if (srcIds.has(s.id)) err(file, `来源编号重复：${s.id}`);
    srcIds.add(s.id);
    if (urls.has(s.url)) err(file, `来源 ${s.id} 与 ${urls.get(s.url)} 是同一链接`);
    urls.set(s.url, s.id);
  }

  const used = new Set<string>();
  for (const r of t.rules) {
    if (!r.id.startsWith(meta.前缀 + '-')) err(file, `${r.id}：编号前缀应为 ${meta.前缀}`);
    if (ruleIds.has(r.id)) err(file, `${r.id}：编号与 ${ruleIds.get(r.id)} 重复`);
    ruleIds.set(r.id, file);
    for (const a of r.applies) if (!appliesOk.has(a)) err(file, `${r.id}：适用范围「${a}」不在词表`);
    for (const s of r.sources ?? []) { used.add(s); if (!srcIds.has(s)) err(file, `${r.id}：引用的来源 ${s} 不存在`); }
    if (r.level === 'hard') {
      for (const w of softWords) if (r.title.includes(w)) err(file, `${r.id}：硬约束标题含软措辞「${w}」`);
      if (!(r.sources?.length) && !r.why) err(file, `${r.id}：硬约束必须有来源或理由`);
    }
  }
  for (const c of t.choices ?? []) for (const s of c.sources ?? []) {
    used.add(s);
    if (!srcIds.has(s)) err(file, `选型「${c.category}」引用的来源 ${s} 不存在`);
  }
  for (const s of srcIds) if (!used.has(s)) err(file, `来源 ${s} 从未被引用`);
}

// 跨主题引用：see 里写主题编号（如 "16"）或规则编号（如 "API-003"）
for (const [id, t] of topics) {
  const file = `${id}-${t.slug}.yaml`;
  for (const r of t.rules) for (const ref of r.see ?? []) {
    if (/^\d{2}$/.test(ref)) { if (!topicMeta[ref]) err(file, `${r.id}：引用的主题 ${ref} 不存在`); }
    else if (!ruleIds.has(ref) && topics.has(Object.entries(topicMeta).find(([, m]) => ref.startsWith(m.前缀 + '-'))?.[0] ?? '')) {
      err(file, `${r.id}：引用的规则 ${ref} 不存在`);
    }
  }
}

// 编号台账：发布过的编号不能消失；删掉的写进「已废弃」，且不能再分配给新规则。
const ledger = load(join(rulesDir, '_编号台账.yaml'));
const L = '_编号台账.yaml';
const released = new Set<string>(ledger['已发布'] ?? []);
const retired: Record<string, { 版本?: string; 改用?: string[]; 原因?: string }> = ledger['已废弃'] ?? {};
for (const [id, d] of Object.entries(retired)) {
  if (ruleIds.has(id)) err(ruleIds.get(id)!, `${id}：这个编号已废弃，不能再用；新规则请续编新号`);
  if (!d?.版本 || !d?.原因) err(L, `已废弃的 ${id} 要写明「版本」和「原因」`);
  for (const to of d?.改用 ?? []) if (!ruleIds.has(to)) err(L, `已废弃的 ${id} 改用的 ${to} 不存在`);
}
for (const id of released) {
  if (!ruleIds.has(id) && !retired[id]) err(L, `${id} 已经发布过，不能直接删除；请写进「已废弃」并注明改用哪条和原因`);
}

// 网站侧栏：每个主题都要放进一个分组（分组在 tools/lib.ts 的 topicGroups）
const grouped = new Set(topicGroups.flatMap((g) => g.ids));
for (const id of Object.keys(topicMeta)) if (!grouped.has(id)) err('tools/lib.ts', `主题 ${id} 没有放进 topicGroups 的任何分组，网站侧栏里会看不到`);

// 版本号：网站和 npm 包两处必须一致（用 pnpm release 统一修改）
const cfgVersion = JSON.parse(readFileSync(join(root, 'plumbrule.config.json'), 'utf8')).version;
const cliVersion = JSON.parse(readFileSync(join(root, 'cli/package.json'), 'utf8')).version;
if (cfgVersion !== cliVersion) err('plumbrule.config.json', `版本 ${cfgVersion} 与 cli/package.json 的 ${cliVersion} 不一致；请用 pnpm release 统一修改`);

const ruleCount = [...topics.values()].reduce((n, t) => n + t.rules.length, 0);
const hard = [...topics.values()].reduce((n, t) => n + t.rules.filter((r: any) => r.level === 'hard').length, 0);
if (errors.length) {
  console.error(`发现 ${errors.length} 个问题：\n` + errors.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log(`通过：${topics.size} 个主题，${ruleCount} 条规则（硬约束 ${hard} 条）。`);
