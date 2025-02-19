"use client";
import Link from "next/link";
import { getDatabase } from "../../utils/get-database";
import { motion } from 'framer-motion';
import IonIcon from "@reacticons/ionicons";
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';

export async function getStaticProps() {
  try {

    const data = await getDatabase("ff85c8c8bc3345babf2f7970d86506d4", {
      sorts: [
        {
          property: "title",
          direction: "ascending"
        }
      ],
      filter: {
        property: "Ra%5D%3B",
        select: {
          equals: "문서"
        }
      }
    });

    console.log(data)

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
  console.log(list)
  const router = useRouter();
  const [sortOption, setSortOption] = useState("date");

  const sortedList = useMemo(() => {
    if (sortOption === "title") {
      return [...list].sort((a, b) =>
        a.properties.이름.title[0]?.plain_text.localeCompare(b.properties.이름.title[0]?.plain_text)
      );
    } else {
      return [...list].sort((a, b) =>
        new Date(b.last_edited_time) - new Date(a.last_edited_time)
      );
    }
  }, [list, sortOption]);

  return (
    <main className="container mx-auto px-4 py-8 pb-20">

      <div className="flex rounded-xl mt-4 overflow-hidden w-fit backdrop-filter backdrop-blur border border-gray-300 dark:border-gray-800">
        <button
          onClick={() => setSortOption("date")}
          className={`flex items-center px-3 py-2 text-xs transition-colors ${sortOption === "date"
            ? "bg-[var(--primary)] text-white"
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
        >
          <IonIcon name="time-outline" className="mr-1.5" />
          최근 수정
        </button>

        <button
          onClick={() => setSortOption("title")}
          className={`flex items-center px-3 py-2 text-xs transition-colors ${sortOption === "title"
            ? "bg-[var(--primary)] text-white"
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
        >
          <IonIcon name="text-outline" className="mr-1.5" />
          이름

        </button>
      </div>

      <div className="grid grid-cols-1 mt-4 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedList.map((post) => (
          <Link href={`/${post.id}`} key={post.id} className="no-underline">
            <article
              className="rounded-xl overflow-hidden transition-all ease-in cursor-pointer flex flex-col h-full border-dashed border-2 border-gray-400 dark:border-gray-700 hover:shadow-lg hover:border-solid">
              <div className="flex-1 p-3 flex flex-col justify-start relative z-10">
                <h2 style={{ color: 'var(--foreground)', wordBreak: 'keep-all', overflowWrap: 'break-word' }}
                  className="text-lg m-0 h-full text-gray-0">
                  {post.properties.이름.title[0]?.plain_text}
                </h2>
                <span className="flex flex-col mt-1 h-full">
                  {post.properties.forest_articles.rich_text.length != 0 && JSON.parse(post.properties.forest_articles.rich_text.map(item => item.text.content).join('').replaceAll("”", "\"").replaceAll("“", "\"")).map((text, i) => (
                    <span key={i} className="text-sm text-gray-500 dark:text-gray-300">
                      <IonIcon name="reader-outline" className="relative top-[2px] mr-1" />
                      {text}</span>
                  ))}
                </span>
              </div>
            </article>
          </Link>
        ))}
      </div>

    </main>
  );
}

