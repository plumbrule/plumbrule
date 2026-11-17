// 网站页面共用的数据和小函数。英文在根路径（默认），中文在 /zh/。
import { marked } from 'marked';
import {
  loadTopics, loadOwnership, loadVocab, topicGroups as rawTopicGroups, config,
  type Topic, type Rule, type Lang,
} from '../../tools/lib.ts';

export { config };
export type { Topic, Rule, Lang };

export const getLang = (path: string): Lang => (path === '/zh' || path.startsWith('/zh/') ? 'zh' : 'en');

/** 给站内路径加上语言前缀。 */
export const localize = (path: string, lang: Lang) => (lang === 'zh' ? (path === '/' ? '/zh/' : `/zh${path}`) : path);

type Site = {
  lang: Lang;
  topics: Topic[];
  topicById: Map<string, Topic>;
  topicNames: Record<string, { slug: string; 名称: string; 前缀: string }>;
  groups: { name: string; ids: string[] }[];
  allRules: (Rule & { topic: Topic })[];
  counts: { topics: number; rules: number; hard: number };
  vocab: any;
};

const cache = new Map<Lang, Site>();

export function getSite(lang: Lang = 'en'): Site {
  const hit = cache.get(lang);
  if (hit) return hit;
  const topics = loadTopics(lang);
  const topicById = new Map(topics.map((t) => [t.id, t]));
  const topicNames = loadOwnership(lang)['主题'];
  const groups = rawTopicGroups.map((g) => ({ name: lang === 'en' ? g.nameEn : g.name, ids: g.ids }));
  const allRules = topics.flatMap((t) => t.rules.map((r) => ({ ...r, topic: t })));
  const site: Site = {
    lang,
    topics,
    topicById,
    topicNames,
    groups,
    allRules,
    counts: {
      topics: topics.length,
      rules: allRules.length,
      hard: allRules.filter((r) => r.level === 'hard').length,
    },
    vocab: loadVocab(lang),
  };
  cache.set(lang, site);
  return site;
}

/** Markdown 转 HTML（内容来自本仓库，可信）。 */
export const md = (s?: string) => (s ? (marked.parse(s, { async: false }) as string) : '');
export const mdi = (s?: string) => (s ? (marked.parseInline(s, { async: false }) as string) : '');

export const topicHref = (id: string, lang: Lang = 'en') => {
  const t = getSite(lang).topicById.get(id);
  return t ? localize(`/topics/${t.slug}/`, lang) : undefined;
};
export const ruleAnchor = (id: string) => id.toLowerCase();

export const statusName = (s: string, lang: Lang = 'en') =>
  lang === 'en' ? (s === 'reviewed' ? 'Reviewed' : 'Draft') : (s === 'reviewed' ? '已复核' : '草稿');

export const scopeName = (a: string, lang: Lang = 'en') => getSite(lang).vocab['适用范围'][a] as string;
export const levelName = (l: string, lang: Lang = 'en') => getSite(lang).vocab['级别'][l]['名称'] as string;
export const checkName = (c: string, lang: Lang = 'en') => getSite(lang).vocab['检查方式'][c]['名称'] as string;
export const sourceKindName = (k: string, lang: Lang = 'en') => getSite(lang).vocab['来源类型'][k] as string;

/** 解析「另见」：主题编号（如 04）或规则编号（如 TST-012）。没整理的主题不给链接。 */
export function resolveSee(ref: string, lang: Lang = 'en'): { label: string; href?: string } {
  const site = getSite(lang);
  if (/^\d{2}$/.test(ref)) {
    const name = site.topicNames[ref]?.名称 ?? '';
    return { label: `${ref} ${name}`.trim(), href: topicHref(ref, lang) };
  }
  const m = ref.match(/^([A-Z0-9]+)-\d{3}$/);
  if (m) {
    const prefixToId = new Map(Object.entries(site.topicNames).map(([id, t]) => [t.前缀, id]));
    const id = prefixToId.get(m[1]);
    const base = id ? topicHref(id, lang) : undefined;
    return { label: ref, href: base ? `${base}#${ruleAnchor(ref)}` : undefined };
  }
  return { label: ref };
}

/** 给浏览器用的精简规则数据，结构与技能里的 data/rules.json 一致。 */
export function browserData(lang: Lang = 'en') {
  const site = getSite(lang);
  const base = lang === 'zh' ? `${config.siteUrl}/zh` : config.siteUrl;
  return {
    version: config.version,
    siteUrl: base,
    lang,
    tags: site.vocab['适用范围'] as Record<string, string>,
    rules: site.allRules.map((r) => ({
      id: r.id, topic: r.topic.id, topicTitle: r.topic.title, title: r.title, level: r.level, check: r.check,
      how: r.how, applies: r.applies, url: `${base}/topics/${r.topic.slug}/#${ruleAnchor(r.id)}`,
    })),
  };
}

/** 页面文案：中文/英文成对出现，避免散落在各页面里。 */
export const strings = {
  zh: {
    nav: { topics: '主题', rules: '全部规则', install: '安装', guide: '怎么读规则', changelog: '更新记录' },
    topics: '主题', topic: '主题',
    footerLicense: '内容按', footerLicenseLink: 'CC BY 4.0', footerLicenseAfter: '授权，代码按 MIT 授权',
    footerLegal: '涉及法律、合规和许可证的内容只是工程参考，不构成法律意见。',
  },
  en: {
    nav: { topics: 'Topics', rules: 'All rules', install: 'Install', guide: 'How to read', changelog: 'Changelog' },
    topics: 'Topics', topic: 'Topic',
    footerLicense: 'Content licensed under', footerLicenseLink: 'CC BY 4.0', footerLicenseAfter: ', code under MIT',
    footerLegal: 'Content about law, compliance, and licenses is engineering reference only and is not legal advice.',
  },
} satisfies Record<Lang, unknown>;
