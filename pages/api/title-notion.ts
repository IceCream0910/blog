import { NextApiRequest, NextApiResponse } from 'next';
import {normalizeTitle} from 'notion-utils';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'method not allowed' });
  }
  res.setHeader('Cache-Control', 'public, s-maxage=60, max-age=60, stale-while-revalidate=60');

  const { block, recordMap } = req.body;

let currentBlock = block;
  
  while (currentBlock) {
    // parent_table이 collection인 경우 title 반환
    if (currentBlock.type === 'page') {
      const title = currentBlock.properties?.title?.[0]?.[0].toString();
      const link = normalizeTitle(title) + '-' + currentBlock.id + '#' + block.id.replaceAll('-', '');
      return res.status(200).json({ title, link });
    }

    // 다음 parent block 찾기
    const parentId = currentBlock.parent_id;
    currentBlock = recordMap.block[parentId]?.value;

    // parent block을 찾을 수 없는 경우 종료
    if (!currentBlock) {
      return res.status(404).json({ error: 'Root block not found' });
    }
  }

  return res.status(404).json({ error: 'Collection block not found' });
};
