"use client";
import { PageHead } from "../components/PageHead";
import Link from "next/link";
import { motion, AnimatePresence } from 'framer-motion';
import { ArticleCard } from '../components/ArticleCard';
import { getDatabase } from "../utils/get-database";
import IonIcon from "@reacticons/ionicons";
import { useRouter } from 'next/router';

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
  const router = useRouter();

  return (
    <motion.main
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      className="container mx-auto px-4 py-8"
    >
      <PageHead
        title="태인의 Blog"
        url="https://blog.yuntae.in"
        image={`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/social-image`}
      />

      <motion.h1 layoutId="page-hero" className="text-2xl text-gray-400 font-bold mb-4 md:text-4xl text-balance" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
        안녕하세요, <span style={{ color: 'var(--foreground)' }}>윤태인</span>입니다.<br />
        <span style={{ color: 'var(--foreground)' }}>코드</span>, 그 사이의 <span style={{ color: 'var(--foreground)' }}>생각</span>을 기록합니다.
      </motion.h1>
      <motion.button
        onClick={() => window.open('https://yuntae.in', '_blank')}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="text-white font-bold py-2 px-4 rounded-2xl mb-16"
        style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
        About Me <IonIcon name="chevron-forward" className="relative top-0.5" />
      </motion.button>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {list.map((post) => (
            <div key={post.id} className="no-underline">
              <ArticleCard
                post={post}
                onClick={() => router.push(`/${post.id}`)}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </motion.main>
  );
}
