// 读取规则库的公共函数，供生成器使用。
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
// @ts-ignore 纯 JS 模块
import { appliesTo } from './agents-md-core.mjs';

// 网站构建时本文件会被打包到别处，找不到规则目录就退回到当前工作目录（仓库根）。
const guess = join(dirname(fileURLToPath(import.meta.url)), '..');
export const root = existsSync(join(guess, 'rules/_词表.yaml')) ? guess : process.cwd();
const rulesDir = join(root, 'rules');
const load = (p: string) => parse(readFileSync(p, 'utf8'));

export type Lang = 'zh' | 'en';
const rulesDirFor = (lang: Lang = 'zh') => (lang === 'en' ? join(rulesDir, 'en') : rulesDir);

export type Rule = {
  id: string; title: string; level: 'hard' | 'soft'; check: 'auto' | 'semi' | 'manual';
  how: string; applies: string[]; why: string; detail?: string; ref_value?: string;
  sources?: string[]; see?: string[];
};
export type Choice = {
  category: string; pick: string; when?: string;
  alternatives?: { name: string; when: string }[];
  avoid?: { name: string; why: string }[];
  license?: string; notes?: string; sources?: string[];
};
export type Source = { id: string; title: string; url: string; publisher?: string; date: string | null; kind: string; checked: string };
export type Topic = {
  id: string; slug: string; title: string; summary: string; status: string;
  reviewed_on: string; next_review: string; legal_notice?: boolean;
  scope?: { includes?: string[]; excludes?: { what: string; see: string }[] };
  overview: string; rules: Rule[]; choices?: Choice[];
  antipatterns?: { bad: string; instead: string }[];
  sources: Source[]; open_questions?: string[];
};

export const config: { siteUrl: string; repoUrl: string; version: string } = JSON.parse(readFileSync(join(root, 'plumbrule.config.json'), 'utf8'));

const vocabCache = new Map<Lang, any>();
export function loadVocab(lang: Lang = 'zh'): any {
  if (!vocabCache.has(lang)) vocabCache.set(lang, load(join(rulesDirFor(lang), '_词表.yaml')));
  return vocabCache.get(lang);
}
export const vocab = loadVocab();

export function loadTopics(lang: Lang = 'zh'): Topic[] {
  return readdirSync(rulesDirFor(lang))
    .filter((f) => /^\d{2}-[a-z0-9-]+\.yaml$/.test(f))
    .sort()
    .map((f) => load(join(rulesDirFor(lang), f)) as Topic);
}

const ownershipCache = new Map<Lang, any>();
export function loadOwnership(lang: Lang = 'zh'): any {
  if (!ownershipCache.has(lang)) ownershipCache.set(lang, load(join(rulesDirFor(lang), '_归属.yaml')));
  return ownershipCache.get(lang);
}

export const levelName = (l: string, lang: Lang = 'zh') => loadVocab(lang)['级别'][l]['名称'] as string;
export const checkName = (c: string, lang: Lang = 'zh') => loadVocab(lang)['检查方式'][c]['名称'] as string;
export const ruleUrl = (t: Topic, r: Rule, lang: Lang = 'zh') => `${config.siteUrl}${lang === 'zh' ? '/zh' : ''}/topics/${t.slug}/#${r.id.toLowerCase()}`;
export const topicUrl = (t: Topic, lang: Lang = 'zh') => `${config.siteUrl}${lang === 'zh' ? '/zh' : ''}/topics/${t.slug}/`;

/** 规则是否适用于给定的范围标签集合，规则见 agents-md-core.mjs 的 appliesTo。 */
export const ruleApplies = (r: Rule, tags: Set<string>) => appliesTo(r.applies, tags);

export const ownership = loadOwnership();
/** 主题名称表（含还没整理的主题）。 */
export const topicNames: Record<string, { slug: string; 名称: string; 前缀: string }> = ownership['主题'];

/** 网站和技能里主题的分组。 */
export const topicGroups: { name: string; nameEn: string; ids: string[] }[] = [
  { name: '工程基础', nameEn: 'Engineering Foundations', ids: ['01', '02', '03', '04', '05', '06'] },
  { name: 'Web 与交互', nameEn: 'Web and Interaction', ids: ['07', '08', '09'] },
  { name: '编码 Agent 与大模型', nameEn: 'Coding Agents and LLMs', ids: ['23', '24', '32'] },
  { name: '语言', nameEn: 'Languages', ids: ['10', '11', '12', '13', '14', '15'] },
  { name: '后端与数据', nameEn: 'Backend and Data', ids: ['16', '17', '18', '19', '20', '21', '22'] },
  { name: '安全、运维与合规', nameEn: 'Security, Operations, and Compliance', ids: ['25', '26', '27'] },
  { name: '移动与桌面', nameEn: 'Mobile and Desktop', ids: ['28', '29', '30', '31'] },
];
