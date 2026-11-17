// 网站配置。规则内容来自 rules/*.yaml，由 src/pages 下的页面在构建时读取。
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { loadTopics, topicGroups, config } from './tools/lib.ts';

const zhTopics = new Map(loadTopics('zh').map((t) => [t.id, t]));
const enTopics = new Map(loadTopics('en').map((t) => [t.id, t]));
const sidebar = topicGroups
  .map((g) => ({
    label: g.nameEn,
    translations: { 'zh-CN': g.name },
    items: g.ids.filter((id) => enTopics.has(id)).map((id) => {
      const zh = zhTopics.get(id);
      const en = enTopics.get(id);
      return {
        label: `${id} ${en.title}`,
        translations: zh ? { 'zh-CN': `${id} ${zh.title}` } : undefined,
        link: `/topics/${en.slug}/`,
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
      description: 'Engineering standards for software: a general engineering standard, readable on the web and usable by coding agents.',
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        zh: { label: '简体中文', lang: 'zh-CN' },
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
