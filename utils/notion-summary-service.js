import { Client } from '@notionhq/client';
import crypto from 'crypto';
import { generateSummary } from './ai-service';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

function createHash(text) {
    return crypto.createHash('md5').update(text).digest('hex');
}

export async function manageSummary(pageId, contentText) {
    if (!contentText) return null;

    try {
        const currentHash = createHash(contentText);

        const response = await notion.pages.retrieve({ page_id: pageId });
        const properties = response.properties;

        const getRichTextValue = (prop) => {
            if (!prop || prop.type !== 'rich_text' || !prop.rich_text || prop.rich_text.length === 0) {
                return "";
            }
            return prop.rich_text.map(t => t.plain_text).join("");
        };

        const summaryPropKey = Object.keys(properties).find(
            key => key.toLowerCase().replace(/_/g, '') === 'aisummary' || key === 'ai_summary'
        );

        let cachedValue = "";
        if (summaryPropKey) {
            cachedValue = getRichTextValue(properties[summaryPropKey]);
        }

        const match = cachedValue.match(/^\[([a-f0-9]{32})\]\s([\s\S]*)$/);

        if (match) {
            const cachedHash = match[1];
            const cachedSummary = match[2];

            if (cachedHash === currentHash) {
                console.log(`[ManageSummary] Cache Hit for ${pageId}`);
                return cachedSummary;
            }
        }

        console.log(`[ManageSummary] Cache Miss for ${pageId}. Generating...`);
        const newSummary = await generateSummary(contentText);

        if (!newSummary) return null;

        if (summaryPropKey) {
            const newValue = `[${currentHash}] ${newSummary}`;

            await notion.pages.update({
                page_id: pageId,
                properties: {
                    [summaryPropKey]: {
                        rich_text: [
                            {
                                text: {
                                    content: newValue
                                }
                            }
                        ]
                    }
                }
            });
            console.log(`[ManageSummary] Updated Notion property for ${pageId}`);
        } else {
            console.warn(`[ManageSummary] Property 'ai_summary' not found in Notion page ${pageId}. Cannot cache.`);
        }

        return newSummary;

    } catch (error) {
        console.error("[ManageSummary] Error:", error);
        return null;
    }
}
