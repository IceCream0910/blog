import { PageHead } from "../../components/PageHead";
import { ForestExplorer } from "../../components/Forest/ForestExplorer";
import { getDatabase } from "../../utils/get-database";

const FOREST_DATABASE_ID = "ff85c8c8bc3345babf2f7970d86506d4";

function propertyText(property) {
  if (!property) return "";
  const values = property.type === "title" ? property.title : property.rich_text;
  return values?.map((item) => item.plain_text || item.text?.content || "").join("") || "";
}

export async function getStaticProps() {
  try {
    const data = await getDatabase(FOREST_DATABASE_ID, {
      filter: {
        property: "forest_분류",
        select: { equals: "문서" },
      },
      sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
    });

    const documents = data.results.map((page) => ({
      id: page.id,
      title: propertyText(page.properties?.["이름"]) || "제목 없는 문서",
      lastEditedTime: page.last_edited_time,
      createdTime: page.created_time,
    }));

    return { props: { documents }, revalidate: 10 };
  } catch (error) {
    console.error("Failed to fetch forest documents:", error);
    return { props: { documents: [] }, revalidate: 60 };
  }
}

export default function Forest({ documents }) {
  return (
    <>
      <PageHead title="문서 | 태인의 Blog" url="https://blog.yuntae.in/forest" />
      <ForestExplorer documents={documents} />
    </>
  );
}
