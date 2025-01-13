"use client";
import Link from "next/link";
import { getDatabase } from "../utils/get-database";

export async function getStaticProps() {
  try {
    const data = await getDatabase("ff85c8c8bc3345babf2f7970d86506d4", {
      sorts: [
        {
          property: "~h%3F%5E",
          direction: "descending"
        }
      ],
      filter: {
        property: "Ra%5D%3B",
        select: {
          equals: "일지"
        }
      }
    });

    return {
      props: {
        list: data.results,
      },
      revalidate: 10
    };
  } catch (error) {
    console.error('Failed to fetch database:', error);
    return {
      props: {
        list: [],
      },
      revalidate: 60
    };
  }
}

export default function Forest({ list }) {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map((post) => (
          <Link href={`/${post.id}`} key={post.id} className="no-underline">
            <article
              style={{
                background: 'var(--card-bg)',
                position: 'relative',
              }}
              className="rounded-3xl overflow-hidden hover:shadow-lg transition-all ease-in cursor-pointer flex flex-col hover:scale-105 active:scale-95"
            >
              <div className="flex-1 p-6 flex flex-col justify-start relative z-10">

                <h2 style={{ color: 'var(--foreground)', wordBreak: 'keep-all', overflowWrap: 'break-word' }}
                  className="text-2xl font-bold m-0 w-2/3 h-full">
                  {post.properties.이름.title[0]?.plain_text}
                </h2>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </main>
  );
}
