// 读取规则库的公共函数，供生成器使用。
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rulesDir = join(root, 'rules');
const load = (p: string) => parse(readFileSync(p, 'utf8'));

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

export const config: { siteUrl: string; version: string } = JSON.parse(readFileSync(join(root, 'plumbrule.config.json'), 'utf8'));
export const vocab = load(join(rulesDir, '_词表.yaml'));

export function loadTopics(): Topic[] {
  return readdirSync(rulesDir)
    .filter((f) => /^\d{2}-[a-z0-9-]+\.yaml$/.test(f))
    .sort()
    .map((f) => load(join(rulesDir, f)) as Topic);
}

export const levelName = (l: string) => vocab['级别'][l]['名称'] as string;
export const checkName = (c: string) => vocab['检查方式'][c]['名称'] as string;
export const ruleUrl = (t: Topic, r: Rule) => `${config.siteUrl}/topics/${t.slug}/#${r.id.toLowerCase()}`;
export const topicUrl = (t: Topic) => `${config.siteUrl}/topics/${t.slug}/`;

/** 规则是否适用于给定的范围标签集合（all 总是适用）。 */
export const ruleApplies = (r: Rule, tags: Set<string>) => r.applies.some((a) => a === 'all' || tags.has(a));
