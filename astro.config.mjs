// 网站配置。规则内容来自 rules/*.yaml，由 src/pages 下的页面在构建时读取。
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { loadTopics, topicGroups, config } from './tools/lib.ts';

const topics = new Map(loadTopics().map((t) => [t.id, t]));
const sidebar = topicGroups
  .map((g) => ({
    label: g.name,
    items: g.ids.filter((id) => topics.has(id)).map((id) => ({ label: `${id} ${topics.get(id).title}`, link: `/topics/${topics.get(id).slug}/` })),
  }))
  .filter((g) => g.items.length);

export default defineConfig({
  site: config.siteUrl,
  outDir: './dist/site',
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: '准绳',
      description: '做软件的准绳：一套通用的工程规范，网页可查，编码 Agent 可用。',
      defaultLocale: 'root',
      locales: { root: { label: '简体中文', lang: 'zh-CN' } },
      favicon: '/favicon.svg',
      social: [{ icon: 'github', label: 'GitHub', href: config.repoUrl }],
      customCss: ['./src/styles/site.css'],
      components: { Header: './src/components/Header.astro', Footer: './src/components/Footer.astro', PageTitle: './src/components/PageTitle.astro', SiteTitle: './src/components/SiteTitle.astro' },
      sidebar,
      lastUpdated: false,
      pagination: false,
    }),
  ],
});
