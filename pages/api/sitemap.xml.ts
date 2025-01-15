import { getDatabase } from '../../utils/get-database';
import { NextApiRequest, NextApiResponse } from 'next';

const generateSiteMap = (posts: any[]) => {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <!-- Add the home page -->
      <url>
        <loc>${process.env.NEXT_PUBLIC_SITE_URL}</loc>
        <priority>1.0</priority>
      </url>
      ${posts
            .map((post) => {
                return `
            <url>
              <loc>${`${process.env.NEXT_PUBLIC_SITE_URL}/${post.id}`}</loc>
              <lastmod>${new Date(post.properties.작성일.date?.start).toISOString()}</lastmod>
            </url>
          `;
            })
            .join('')}
    </urlset>`;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const posts = await getDatabase("1a346171ed574b0a9c1c3f5a29b39919", {
            sorts: [
                {
                    property: "cwqu",
                    direction: "descending"
                }
            ]
        });

        const sitemap = generateSiteMap(posts.results);

        res.setHeader('Content-Type', 'text/xml');
        res.write(sitemap);
        res.end();
    } catch (error) {
        console.error('Failed to generate sitemap:', error);
        res.status(500).json({ error: 'Failed to generate sitemap' });
    }
}
