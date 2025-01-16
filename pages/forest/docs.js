"use client";
import Link from "next/link";
import { getDatabase } from "../../utils/get-database";
import { motion } from 'framer-motion';

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
    <main className="container mx-auto px-4 py-8 pb-28">
      <div className="flex items-center gap-4 flex-wrap">
        {list.map((post) => (
          <Link href={`/${post.id}`} key={post.id} className="no-underline transition-all opacity-50 hover:opacity-100">
            <motion.h2
              style={{ color: 'var(--foreground)', wordBreak: 'keep-all', overflowWrap: 'break-word' }}
              className="text-lg m-0 h-full md:text-2xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}>
              {post.properties.이름.title[0]?.plain_text}
            </motion.h2>
          </Link>
        ))}
      </div>
    </main>
  );
}


