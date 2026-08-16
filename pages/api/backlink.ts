import { NextApiRequest, NextApiResponse } from 'next';
import { fetchNotionBacklinks } from '../../utils/backlink-graph';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'method not allowed' });
  }

  const { currentId } = req.body;
  if (!currentId || typeof currentId !== 'string') {
    return res.status(400).json({ error: 'currentId is required' });
  }

  try {
    const results = await fetchNotionBacklinks(currentId);
    res.setHeader('Cache-Control', 'public, s-maxage=60, max-age=60, stale-while-revalidate=60');
    res.status(200).json(results);
  } catch (error) {
    res.status(502).json({ error: 'failed to fetch backlinks' });
  }
};
