import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSummary(text) {
    if (!text) return "";

    try {

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that summarizes blog posts. Create a concise, engaging summary of the provided text in Korean. The summary should be around 3-5 sentences."
                },
                {
                    role: "user",
                    content: `${text}`
                }
            ],
            temperature: 0.7,
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error("Error generating AI summary:", error);
        return "";
    }
}
