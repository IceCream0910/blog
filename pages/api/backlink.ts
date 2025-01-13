import { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'method not allowed' });
  }

  const { currentId } = req.body;

  const body = {
    block: {
      id: currentId,
      spaceId: "efee2221-b063-4e3f-b2ba-7931ce73adb9"
    }
  };

  const results = await fetch('https://www.notion.so/api/v3/getBacklinksForBlockInitial', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: `token_v2=${process.env.NOTION_TOKEN};`
    },
    body: JSON.stringify(body)
  }).then((res) => res.json());

  res.setHeader('Cache-Control', 'public, s-maxage=60, max-age=60, stale-while-revalidate=60');
  res.status(200).json(results);
};
