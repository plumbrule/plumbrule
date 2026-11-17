// 生成 AGENTS.md 片段的纯函数：命令行脚本和网站共用，不依赖 Node 内置模块。
//
// 默认输出精简版：只列适用的主题、链接和硬约束条数，让 Agent 按需查技能或网站。
// 入口文件每次都进上下文，逐条列出几百条规则会挤占上下文、反而被忽略（见 AGT-002）。
// full 为真时逐条列出规则，适合确实要把规则写进仓库的场合。

/**
 * @param {{version:string, siteUrl:string, tags:Record<string,string>, rules:any[]}} data
 * @param {Set<string>} tags 适用范围标签
 * @param {{soft?: boolean, full?: boolean}} [opts] soft：带上软指导；full：逐条列出
 */
/**
 * 规则是否适用于给定的项目标签。
 * 同一类标签（lang:、platform:、kind:）之间是「或」，不同类之间是「且」：
 * [lang:python, kind:service] 只适用于 Python 写的服务；[lang:go, lang:rust] 适用于 Go 或 Rust 项目。
 * 含 all 的规则总是适用。
 * @param {string[]} applies
 * @param {Set<string>} tags
 */
export function appliesTo(applies, tags) {
  if (applies.includes('all')) return true;
  const groups = new Map();
  for (const a of applies) {
    const g = a.split(':')[0];
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(a);
  }
  return [...groups.values()].every((list) => list.some((a) => tags.has(a)));
}

export function renderAgentsMd(data, tags, opts = {}) {
  const { soft = false, full = false, lang = 'zh' } = typeof opts === 'boolean' ? { soft: opts, full: true } : opts;
  const applies = (r) => appliesTo(r.applies, tags);
  const picked = data.rules.filter((r) => applies(r) && (soft || r.level === 'hard'));
  const byTopic = new Map();
  for (const r of picked) {
    if (!byTopic.has(r.topic)) byTopic.set(r.topic, { title: r.topicTitle, url: r.url.split('#')[0], rules: [] });
    byTopic.get(r.topic).rules.push(r);
  }
  const topics = [...byTopic].sort(([a], [b]) => a.localeCompare(b));
  const scope = tags.size ? [...tags].map((t) => data.tags[t]).join(lang === 'en' ? ', ' : '、') : (lang === 'en' ? 'common to all projects' : '所有项目通用部分');
  const out = lang === 'en' ? [`## Engineering standards (Plumbrule ${data.version})`, ''] : [`## 工程规范（准绳 ${data.version}）`, ''];
  if (!full) {
    if (lang === 'en') {
      out.push(
        'This project follows the Plumbrule engineering standards. Before changing anything covered by the topics below, read the rules for those topics: use the plumbrule skill if it is installed, otherwise open the links.',
        'Hard constraints must be followed; if you cannot comply, stop and explain. Soft guidance is followed by default; if you deviate, state the reason and cite the rule ID. If this file conflicts with the project\'s own conventions, the project conventions win.',
        `Applies to: ${scope}`,
        '',
      );
      for (const [id, t] of topics) {
        const hard = t.rules.filter((r) => r.level === 'hard').length;
        out.push(`- ${id} ${t.title} (${hard} hard constraint${hard === 1 ? '' : 's'}${soft ? `, ${t.rules.length} total` : ''}): ${t.url}`);
      }
    } else {
      out.push(
        '本项目遵循准绳（Plumbrule）工程规范。改动涉及下列主题时，先查对应主题的规则：装了 plumbrule 技能就用技能，否则看链接。',
        '硬约束必须遵守，做不到就停下来说明；软指导默认照做，不照做时写明理由并引用规则编号。与本文件其他内容冲突时，以本项目的约定为准。',
        `适用范围：${scope}`,
        '',
      );
      for (const [id, t] of topics) {
        const hard = t.rules.filter((r) => r.level === 'hard').length;
        out.push(`- ${id} ${t.title}（硬约束 ${hard} 条${soft ? `，共 ${t.rules.length} 条` : ''}）：${t.url}`);
      }
    }
    return { text: out.join('\n'), count: picked.length, topics: topics.length };
  }
  if (lang === 'en') {
    out.push(`The following ${soft ? 'rules' : 'hard constraints'} apply to this project, from Plumbrule (${data.siteUrl}). If they conflict with anything else in this file, the project conventions win.`);
    out.push(`Applies to: ${scope}`, '');
    for (const [id, t] of topics) {
      out.push(`### ${id} ${t.title}`, '');
      for (const r of t.rules) out.push(`- ${r.level === 'soft' ? '(Recommended) ' : ''}${r.title} [${r.id}]`);
      out.push('');
    }
    out.push(`Details and rationale: ${data.siteUrl}`);
  } else {
    out.push(`以下是适用于本项目的${soft ? '规则' : '硬约束'}，来自准绳（${data.siteUrl}）。与本文件其他内容冲突时，以本项目的约定为准。`);
    out.push(`适用范围：${scope}`, '');
    for (const [id, t] of topics) {
      out.push(`### ${id} ${t.title}`, '');
      for (const r of t.rules) out.push(`- ${r.level === 'soft' ? '（建议）' : ''}${r.title}〔${r.id}〕`);
      out.push('');
    }
    out.push(`细则和理由：${data.siteUrl}`);
  }
  return { text: out.join('\n'), count: picked.length, topics: topics.length };
}
