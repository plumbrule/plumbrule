// 生成 AGENTS.md 片段的纯函数：命令行脚本和网站共用，不依赖 Node 内置模块。
/**
 * @param {{version:string, siteUrl:string, tags:Record<string,string>, rules:any[]}} data
 * @param {Set<string>} tags 适用范围标签
 * @param {boolean} withSoft 是否带上软指导
 */
export function renderAgentsMd(data, tags, withSoft) {
  const applies = (r) => r.applies.some((a) => a === 'all' || tags.has(a));
  const picked = data.rules.filter((r) => applies(r) && (withSoft || r.level === 'hard'));
  const byTopic = new Map();
  for (const r of picked) {
    if (!byTopic.has(r.topic)) byTopic.set(r.topic, { title: r.topicTitle, rules: [] });
    byTopic.get(r.topic).rules.push(r);
  }
  const out = [];
  out.push(`## 工程规范（准绳 ${data.version}）`, '');
  out.push(`以下是适用于本项目的${withSoft ? '规则' : '硬约束'}，来自准绳（${data.siteUrl}）。与本文件其他内容冲突时，以本项目的约定为准。`);
  out.push(`适用范围：${tags.size ? [...tags].map((t) => data.tags[t]).join('、') : '所有项目通用部分'}`, '');
  for (const [id, t] of [...byTopic].sort()) {
    out.push(`### ${id} ${t.title}`, '');
    for (const r of t.rules) out.push(`- ${r.level === 'soft' ? '（建议）' : ''}${r.title}〔${r.id}〕`);
    out.push('');
  }
  out.push(`细则和理由：${data.siteUrl}`);
  return { text: out.join('\n'), count: picked.length };
}
