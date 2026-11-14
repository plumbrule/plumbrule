// 准备发布一个新版本。用法：pnpm release 0.2.0
//
// 做这些事：
//   1. 检查新版本号比当前的大，且更新记录里已经写了「## 0.2.0」这一节；
//   2. 统一修改 plumbrule.config.json 和 cli/package.json 的版本号，更新记录里的「（未发布）」换成今天的日期；
//   3. 把当前全部规则编号并进编号台账的「已发布」；
//   4. 校验、构建网站、打包 npm 包。
// 不部署、不发布 npm、不提交，也不打标签：这些由维护者确认后手动执行，最后会打印出命令。
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { parse } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fail = (msg: string): never => { console.error(`没有发布：${msg}`); process.exit(1); };

const next = process.argv[2] ?? fail('请给出新版本号，如：pnpm release 0.2.0');
if (!/^\d+\.\d+\.\d+$/.test(next)) fail(`版本号「${next}」格式不对，应为 主.次.修订，如 0.2.0`);

const cfgPath = join(root, 'plumbrule.config.json');
const cliPath = join(root, 'cli/package.json');
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
const cli = JSON.parse(readFileSync(cliPath, 'utf8'));
const cur: string = cfg.version;
const num = (v: string) => v.split('.').map(Number);
const newer = (a: string, b: string) => { const [x, y] = [num(a), num(b)]; for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]; return false; };
if (!newer(next, cur)) fail(`新版本 ${next} 必须比当前的 ${cur} 大`);

const logPath = join(root, 'src/content/docs/changelog.md');
let log = readFileSync(logPath, 'utf8');
const head = new RegExp(`^## ${next.replaceAll('.', '\\.')}(（[^）]*）)?[ \\t]*$`, 'm');
if (!head.test(log)) fail(`更新记录（src/content/docs/changelog.md）里还没有「## ${next}」这一节，请先写清这个版本改了什么`);
const today = new Date().toISOString().slice(0, 10);
log = log.replace(head, `## ${next}（${today}）`);

// 编号台账：已发布 = 原有的 ∪ 当前规则里的，按主题顺序、编号大小排列
const rulesDir = join(root, 'rules');
const ledgerPath = join(rulesDir, '_编号台账.yaml');
const ledgerText = readFileSync(ledgerPath, 'utf8');
const ledger = parse(ledgerText);
const ids = new Set<string>(ledger['已发布'] ?? []);
const order: string[] = [];
for (const f of readdirSync(rulesDir).filter((f) => /^\d{2}-[a-z0-9-]+\.yaml$/.test(f)).sort()) {
  const t = parse(readFileSync(join(rulesDir, f), 'utf8'));
  const p = t.rules[0]?.id.split('-')[0];
  if (p && !order.includes(p)) order.push(p);
  for (const r of t.rules) ids.add(r.id);
}
const added = ids.size - (ledger['已发布'] ?? []).length;
const byPrefix = new Map<string, string[]>();
for (const id of ids) {
  const p = id.split('-')[0];
  if (!order.includes(p)) order.push(p);
  if (!byPrefix.has(p)) byPrefix.set(p, []);
  byPrefix.get(p)!.push(id);
}
let list = '';
for (const p of order) {
  const l = (byPrefix.get(p) ?? []).sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]));
  if (l.length) list += `  # ${p}\n` + l.map((i) => `  - ${i}\n`).join('');
}
const cut = ledgerText.indexOf('\n已发布:');
if (cut < 0) fail('编号台账里找不到「已发布:」这一行');

writeFileSync(ledgerPath, ledgerText.slice(0, cut) + '\n已发布:\n' + list);
cfg.version = next;
cli.version = next;
writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');
writeFileSync(cliPath, JSON.stringify(cli, null, 2) + '\n');
writeFileSync(logPath, log);
console.log(`版本 ${cur} → ${next}；编号台账新增 ${added} 个编号。`);

const run = (cmd: string) => { console.log(`\n$ ${cmd}`); execSync(cmd, { cwd: root, stdio: 'inherit' }); };
try {
  run('pnpm -s build');
  run('pnpm -s pack:cli');
} catch {
  fail('校验或构建失败，见上面的输出。版本号和台账已经改了，修好后重新运行同一条命令即可');
}

console.log(`
准备好了：网站在 dist/site，npm 包是 dist/plumbrule-${next}.tgz。下面几步请确认后手动执行：

  git add rules/ plumbrule.config.json cli/package.json src/content/docs/changelog.md   # 连同本次改过的规则
  git commit -m "发布 ${next}"
  pnpm run deploy                                        # 部署网站
  cd dist && npm publish plumbrule-${next}.tgz --access public   # 要两步验证；之后到 npmjs.com 批准
  git tag -a v${next} -m "准绳 ${next}" && git push && git push origin v${next}
`);
