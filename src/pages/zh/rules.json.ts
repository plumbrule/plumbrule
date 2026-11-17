import { browserData } from '../../lib/site.ts';

export const GET = () => new Response(JSON.stringify(browserData('zh'), null, 1), { headers: { 'content-type': 'application/json; charset=utf-8' } });
