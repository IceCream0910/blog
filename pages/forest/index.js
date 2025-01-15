"use client";
import Link from "next/link";
import { getDatabase } from "../../utils/get-database";
import { motion } from 'framer-motion';
import IonIcon from "@reacticons/ionicons";
import { useRouter } from 'next/navigation';
import { SliderTabBar } from "../../components/SliderTabBar";

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
  const router = useRouter();
  return (
    <main className="container mx-auto px-4 py-8 pb-20">
      <motion.h1 layoutId="page-hero" className="text-2xl text-gray-400 font-bold mb-4 md:text-4xl text-balance" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
        저의 <span style={{ color: 'var(--foreground)' }}>디지털 숲🌳</span>에 오신 것을 환영합니다.<br />
      </motion.h1>

      <motion.button
        onClick={() => router.push('/44aa36ff-4af7-4228-98c0-bea7d2246d5e')}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="text-white font-bold py-2 px-4 rounded-2xl mb-14"
        style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
        Intro <IonIcon name="chevron-forward" className="relative top-0.5" />
      </motion.button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((post) => (
          <Link href={`/${post.id}`} key={post.id} className="no-underline">
            <article
              className="rounded-xl overflow-hidden transition-all ease-in cursor-pointer flex flex-col border-dashed border-2 border-gray-400 dark:border-gray-700 opacity-40 dark:opacity-60 hover:shadow-lg hover:border-solid hover:opacity-100">
              <div className="flex-1 p-3 flex flex-col justify-start relative z-10">
                <motion.h2 style={{ color: 'var(--foreground)', wordBreak: 'keep-all', overflowWrap: 'break-word' }}
                  className="text-lg m-0  h-full" layoutId={`title-${post.id}`}>
                  {post.properties.이름.title[0]?.plain_text}
                </motion.h2>
              </div>
            </article>
          </Link>
        ))}
      </div>

    </main>
  );
}


