import { NextApiRequest, NextApiResponse } from 'next';

interface PodcastItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  duration: string;
  enclosure: {
    url: string;
    length: string;
    type: string;
  };
}

function parseXMLToJSON(xml: string): PodcastItem[] {
  const items: PodcastItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const matches = xml.match(itemRegex);

  if (!matches) return [];

  matches.forEach(itemXml => {
    const title = itemXml.match(/<title>\s*<!\[CDATA\[(.*?)\]\]>\s*<\/title>/)?.[1] || '';
    const description = itemXml.match(/<description>\s*<!\[CDATA\[(.*?)\]\]>\s*<\/description>/)?.[1] || '';
    const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';
    const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
    const duration = itemXml.match(/<itunes:duration>(.*?)<\/itunes:duration>/)?.[1] || '';

    const enclosureMatch = itemXml.match(/<enclosure\s+url="([^"]*?)"\s+length="([^"]*?)"\s+type="([^"]*?)"/);
    const enclosure = enclosureMatch ? {
      url: enclosureMatch[1],
      length: enclosureMatch[2],
      type: enclosureMatch[3]
    } : null;

    items.push({
      title,
      description,
      link,
      pubDate,
      duration,
      enclosure
    });
  });

  return items;
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'method not allowed' });
  }

  const { title } = req.body;

  try {
    const rss = await fetch('https://podcast.yuntae.in/rss', {
      method: 'GET',
      headers: {
        'allowed-request': 'true'
      }
    }).then((res) => res.text());

    const items = parseXMLToJSON(rss);
    const foundItem = items.find(item => item.title.replace(/_/g, "-") === title);

    if (!foundItem) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    res.setHeader('Cache-Control', 'public, s-maxage=60, max-age=60, stale-while-revalidate=60');
    res.status(200).json(foundItem);

  } catch (error) {
    console.error('Error processing podcast RSS:', error);
    res.status(500).json({ error: 'Failed to process podcast feed' });
  }
};