// 网站配置。规则内容来自 rules/*.yaml，由 src/pages 下的页面在构建时读取。
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { loadTopics, topicGroups, config } from './tools/lib.ts';

const zhTopics = new Map(loadTopics('zh').map((t) => [t.id, t]));
const enTopics = new Map(loadTopics('en').map((t) => [t.id, t]));
const sidebar = topicGroups
  .map((g) => ({
    label: g.name,
    translations: { en: g.nameEn },
    items: g.ids.filter((id) => zhTopics.has(id)).map((id) => {
      const zh = zhTopics.get(id);
      const en = enTopics.get(id);
      return {
        label: `${id} ${zh.title}`,
        translations: en ? { en: `${id} ${en.title}` } : undefined,
        link: `/topics/${zh.slug}/`,
      };
    }),
  }))
  .filter((g) => g.items.length);

export default defineConfig({
  site: config.siteUrl,
  outDir: './dist/site',
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: 'Plumbrule',
      description: '做软件的准绳：一套通用的工程规范，网页可查，编码 Agent 可用。',
      defaultLocale: 'root',
      locales: {
        root: { label: '简体中文', lang: 'zh-CN' },
        en: { label: 'English', lang: 'en' },
      },
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
