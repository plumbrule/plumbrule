// 校验英文版规则文件：结构、编号、机器可读字段必须与中文版一致，且不能残留中文。
// 用法：node tools/check-i18n.ts [--allow-missing]
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const zhDir = join(root, 'rules');
const enDir = join(root, 'rules/en');
const allowMissing = process.argv.includes('--allow-missing');
const load = (p: string) => parse(readFileSync(p, 'utf8'));
const cjk = /[\u3000-\u303f\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]/;
const errors: string[] = [];
const err = (file: string, msg: string) => errors.push(`${file}: ${msg}`);

const files = readdirSync(zhDir).filter((f) => /^\d{2}-[a-z0-9-]+\.yaml$/.test(f)).sort();
const missing: string[] = [];

const same = (file: string, path: string, a: unknown, b: unknown) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) err(file, `${path} 与中文版不一致`);
};

for (const file of files) {
  const enFile = join(enDir, file);
  if (!existsSync(enFile)) { missing.push(file); continue; }
  let zh: any, en: any;
  try { zh = load(join(zhDir, file)); } catch (e) { err(file, `中文版解析失败：${(e as Error).message}`); continue; }
  try { en = load(enFile); } catch (e) { err(file, `英文版解析失败：${(e as Error).message}`); continue; }

  const walk = (a: any, b: any, path: string) => {
    if (typeof a !== typeof b) { err(file, `${path} 类型不一致`); return; }
    if (Array.isArray(a)) {
      if (!Array.isArray(b)) { err(file, `${path} 应为数组`); return; }
      if (a.length !== b.length) err(file, `${path} 长度 ${a.length} → ${b.length}`);
      for (let i = 0; i < Math.min(a.length, b.length); i++) walk(a[i], b[i], `${path}[${i}]`);
      return;
    }
    if (a && typeof a === 'object') {
      const ak = Object.keys(a), bk = Object.keys(b ?? {});
      const missingKeys = ak.filter((k) => !bk.includes(k));
      const extraKeys = bk.filter((k) => !ak.includes(k));
      if (missingKeys.length) err(file, `${path} 缺少字段 ${missingKeys.join(',')}`);
      if (extraKeys.length) err(file, `${path} 多出字段 ${extraKeys.join(',')}`);
      for (const k of ak) if (k in b) walk(a[k], b[k], path ? `${path}.${k}` : k);
      return;
    }
    if (typeof b === 'string' && cjk.test(b)) err(file, `${path} 残留中文：${JSON.stringify((b as string).slice(0, 60))}`);
  };
  walk(zh, en, '');

  for (const k of ['id', 'slug', 'status', 'reviewed_on', 'next_review', 'legal_notice']) same(file, k, zh[k], en[k]);
  same(file, 'scope.excludes.see', zh.scope?.excludes?.map((e: any) => e.see), en.scope?.excludes?.map((e: any) => e.see));
  const meta = (s: any) => ({ id: s.id, url: s.url, date: s.date, kind: s.kind, checked: s.checked });
  same(file, 'sources', zh.sources.map(meta), en.sources.map(meta));
  if (zh.rules.length !== en.rules?.length) err(file, `规则数 ${zh.rules.length} → ${en.rules?.length}`);
  for (let i = 0; i < Math.min(zh.rules.length, en.rules?.length ?? 0); i++) {
    for (const k of ['id', 'level', 'check', 'applies', 'sources', 'see']) same(file, `rules[${i}].${k}`, zh.rules[i][k], en.rules[i][k]);
  }
  for (let i = 0; i < Math.min(zh.choices?.length ?? 0, en.choices?.length ?? 0); i++) same(file, `choices[${i}].sources`, zh.choices[i].sources, en.choices[i].sources);
}

if (missing.length) {
  if (allowMissing) console.warn(`英文版还缺 ${missing.length} 个主题：${missing.join(', ')}`);
  else for (const f of missing) err(f, '缺少英文版 rules/en/' + f);
}

if (errors.length) {
  console.error(`英文版发现 ${errors.length} 个问题：\n` + errors.slice(0, 80).map((e) => '  - ' + e).join('\n'));
  if (errors.length > 80) console.error(`  ……还有 ${errors.length - 80} 个问题`);
  process.exit(1);
}
console.log(`英文版通过：${files.length - missing.length}/${files.length} 个主题。`);
