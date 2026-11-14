// 网站页面共用的数据和小函数。
import { marked } from 'marked';
import { loadTopics, topicNames, topicGroups, vocab, levelName, checkName, config, type Topic, type Rule } from '../../tools/lib.ts';

export { topicNames, topicGroups, vocab, levelName, checkName, config };
export type { Topic, Rule };

export const topics = loadTopics();
export const topicById = new Map(topics.map((t) => [t.id, t]));
const prefixToId = new Map(Object.entries(topicNames).map(([id, t]) => [t.前缀, id]));

/** Markdown 转 HTML（内容来自本仓库，可信）。 */
export const md = (s?: string) => (s ? (marked.parse(s, { async: false }) as string) : '');
export const mdi = (s?: string) => (s ? (marked.parseInline(s, { async: false }) as string) : '');

export const topicHref = (id: string) => (topicById.has(id) ? `/topics/${topicById.get(id)!.slug}/` : undefined);
export const ruleAnchor = (id: string) => id.toLowerCase();
export const statusName = (s: string) => (s === 'reviewed' ? '已复核' : '草稿');
export const scopeName = (a: string) => vocab['适用范围'][a] as string;

/** 解析「另见」：主题编号（如 04）或规则编号（如 TST-012）。没整理的主题不给链接。 */
export function resolveSee(ref: string): { label: string; href?: string } {
  if (/^\d{2}$/.test(ref)) {
    const name = topicNames[ref]?.名称 ?? '';
    return { label: `${ref} ${name}`.trim(), href: topicHref(ref) };
  }
  const m = ref.match(/^([A-Z0-9]+)-\d{3}$/);
  if (m) {
    const id = prefixToId.get(m[1]);
    const base = id ? topicHref(id) : undefined;
    return { label: ref, href: base ? `${base}#${ruleAnchor(ref)}` : undefined };
  }
  return { label: ref };
}

export const allRules = topics.flatMap((t) => t.rules.map((r) => ({ ...r, topic: t })));
export const counts = {
  topics: topics.length,
  rules: allRules.length,
  hard: allRules.filter((r) => r.level === 'hard').length,
};

/** 给浏览器用的精简规则数据，结构与技能里的 data/rules.json 一致。 */
export const browserData = {
  version: config.version,
  siteUrl: config.siteUrl,
  tags: vocab['适用范围'] as Record<string, string>,
  rules: allRules.map((r) => ({
    id: r.id, topic: r.topic.id, topicTitle: r.topic.title, title: r.title, level: r.level, check: r.check,
    how: r.how, applies: r.applies, url: `${config.siteUrl}/topics/${r.topic.slug}/#${ruleAnchor(r.id)}`,
  })),
};
