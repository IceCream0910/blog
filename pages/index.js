"use client";
import { PageHead } from "../components/PageHead";
import Link from "next/link";
import { motion, AnimatePresence } from 'framer-motion';
import { ArticleCard } from '../components/ArticleCard';
import { getDatabase } from "../utils/get-database";

export async function getStaticProps() {
  try {
    const data = await getDatabase("1a346171ed574b0a9c1c3f5a29b39919", {
      sorts: [
        {
          property: "cwqu",
          direction: "descending"
        }
      ]
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

export default function Home({ list }) {
  return (
    <motion.main
      className="container mx-auto px-4 py-8"
    >
      <PageHead
        title="태인의 Blog"
        url="https://blog.yuntae.in"
        description="새로움에 끊임없이 도전하는 태인의 Blog"
        image={`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/social-image`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {list.map((post) => (
            <Link href={`/${post.id}`} key={post.id} className="no-underline">
              <ArticleCard post={post} />
            </Link>
          ))}
        </AnimatePresence>
      </div>
    </motion.main>
  );
}
