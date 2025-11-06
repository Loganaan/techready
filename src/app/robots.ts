export default function robots() {
  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/login', '/test-api'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/login', '/test-api'],
      },
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai', 'Claude-Web', 'cohere-ai', 'Omgilibot', 'FacebookBot', 'Diffbot', 'Bytespider', 'ImagesiftBot', 'PerplexityBot', 'YouBot'],
        disallow: ['/'],
      },
      {
        userAgent: ['AhrefsBot', 'SemrushBot', 'DotBot', 'MJ12bot', 'BLEXBot', 'DataForSeoBot', 'PetalBot', 'MegaIndex', 'ZoominfoBot'],
        disallow: ['/'],
      },
      {
        userAgent: '*',
        disallow: ['/'],
      },
    ],
    sitemap: 'https://techready.tech/sitemap.xml',
  }
}
