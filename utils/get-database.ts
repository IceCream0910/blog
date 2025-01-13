export async function getDatabase(databaseId: string, body: any = {}) {
    if (!databaseId) {
        throw new Error('Database ID is required');
    }

    try {
        const options = {
            method: 'POST',
            headers: {
                'Notion-Version': '2022-06-28',
                Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
        };

        const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch data');
        }

        return data;
    } catch (error) {
        throw error;
    }
}