export async function getDatabase(databaseId, body = {}) {
    if (!databaseId) {
        throw new Error('Database ID is required');
    }

    let results = [];
    let cursor = null;
    let hasMore = true;

    const pageSize = 100;

    try {
        while (hasMore) {
            const requestBody = {
                ...body,
                page_size: pageSize,
                ...(cursor && { start_cursor: cursor }),
            };

            const options = {
                method: 'POST',
                headers: {
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
                },
                body: JSON.stringify(requestBody),
            };

            const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, options);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch data');
            }

            results = [...results, ...data.results];

            hasMore = data.has_more;
            cursor = data.next_cursor;
        }

        return { results };
    } catch (error) {
        throw error;
    }
}
