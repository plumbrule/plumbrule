// 网站构建后：把技能打成 zip 放进 downloads/，并写出 SHA-256 校验值。
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { root, config } from './lib.ts';

const skillDir = join(root, 'dist/skill');
if (!existsSync(join(skillDir, 'plumbrule/SKILL.md'))) throw new Error('先运行 pnpm gen:skill');
const outDir = join(root, 'dist/site/downloads');
mkdirSync(outDir, { recursive: true });
const name = `plumbrule-skill-${config.version}.zip`;
const zip = join(outDir, name);
rmSync(zip, { force: true });
execFileSync('zip', ['-qrX', zip, 'plumbrule'], { cwd: skillDir });
const sum = createHash('sha256').update(readFileSync(zip)).digest('hex');
writeFileSync(`${zip}.sha256`, `${sum}  ${name}\n`);
console.log(`已打包：downloads/${name}（sha256 ${sum.slice(0, 12)}…）`);
