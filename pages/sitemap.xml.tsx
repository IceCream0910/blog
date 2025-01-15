import { getDatabase } from '../utils/get-database';
import { GetStaticProps } from 'next';

const Sitemap = () => null;

const generateSiteMap = (posts: any[]) => {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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

export const getServerSideProps = async ({ res }) => {
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

        return {
            props: {}
        };
    } catch (error) {
        console.error('Failed to generate sitemap:', error);
        return {
            props: {},
            revalidate: 10
        };
    }
};

export default Sitemap;
