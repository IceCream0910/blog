import { PageHead } from "../../components/PageHead";
import { RecapViewer } from "../../components/Recap/RecapViewer";
import { getDatabase } from "../../utils/get-database";

const FOREST_DATABASE_ID = "ff85c8c8bc3345babf2f7970d86506d4";

function propertyText(property) {
  if (!property) return "";
  if (property.type === "rich_text") return property.rich_text?.map((item) => item.plain_text || item.text?.content || "").join("") || "";
  if (property.type === "title") return property.title?.map((item) => item.plain_text || item.text?.content || "").join("") || "";
  return "";
}

function parseObjects(property) {
  const text = propertyText(property).replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\r?\n/g, "").trim();
  if (!text) return [];
  try {
    const value = JSON.parse(text);
    return (Array.isArray(value) ? value : [value])
      .filter((item) => item && typeof item === "object")
      .map((item) => Object.fromEntries(Object.entries(item).map(([key, itemValue]) => [key, typeof itemValue === "string" ? itemValue.trim() : itemValue])));
  } catch (error) {
    console.warn("Invalid recap property JSON:", error.message);
    return [];
  }
}

function namedProperty(properties, name) {
  const key = Object.keys(properties || {}).find((candidate) => candidate.toLowerCase() === name);
  return key ? properties[key] : undefined;
}

function monthKey(value) {
  if (typeof value === "string") {
    const dateOnly = value.match(/^(\d{4})-(\d{2})-\d{2}$/);
    if (dateOnly) return `${dateOnly[1]}-${dateOnly[2]}`;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return year && month ? `${year}-${month}` : "";
}

export async function getStaticProps() {
  try {
    const data = await getDatabase(FOREST_DATABASE_ID, {
      filter: { property: "forest_분류", select: { equals: "일지" } },
    });
    const currentMonth = monthKey(new Date());
    const posts = data.results.map((page) => ({
      id: page.id,
      title: propertyText(page.properties?.["이름"]) || "월말결산",
      date: page.properties?.["forest_날짜"]?.date?.start || page.created_time,
      properties: {
        music: parseObjects(namedProperty(page.properties, "music")),
        watching: parseObjects(namedProperty(page.properties, "watching")),
        reading: parseObjects(namedProperty(page.properties, "reading")),
      },
    }))
      .filter((post) => monthKey(post.date) !== currentMonth)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return { props: { posts }, revalidate: 10 };
  } catch (error) {
    console.error("Failed to fetch recap:", error);
    return { props: { posts: [] }, revalidate: 60 };
  }
}

export default function Recap({ posts }) {
  return (
    <>
      <PageHead title="월말결산 | 태인의 Blog" url="https://blog.yuntae.in/recap" />
      <RecapViewer posts={posts} />
    </>
  );
}
