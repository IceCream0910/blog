import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    const body = req.body;

    if (!id) {
        return res.status(400).json({ error: 'Database ID is required' });
    }

    try {
        const options = {
            method: 'POST',
            headers: {
                'Notion-Version': '2022-06-28',
                Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: body,
        };

        const response = await fetch(`https://api.notion.com/v1/databases/${id}/query`, options);
        const data = await response.json();

        return res.json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch data' });
    }
}