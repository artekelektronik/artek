/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com',
  generateRobotsTxt: false, // We're using app/robots.ts instead
  generateIndexSitemap: false, // Single sitemap for now
  exclude: ['/api/*', '/_next/*', '/admin/*'],
  outDir: './public',
  changefreq: 'daily',
  priority: 0.7,
  
  // Transform function to add alternates for i18n
  transform: async (config, path) => {
    // Strip /en prefix for alternate languages
    const cleanPath = path.replace(/^\/en/, '');
    
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: [
        {
          href: `${config.siteUrl}${cleanPath}`,
          hreflang: 'tr',
        },
        {
          href: `${config.siteUrl}/en${cleanPath}`,
          hreflang: 'en',
        },
      ],
    };
  },
};
