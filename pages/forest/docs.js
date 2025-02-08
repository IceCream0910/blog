"use client";
import { useRouter } from "next/navigation";
import { useState, useContext } from "react";
import { getDatabase } from "../../utils/get-database";
import { motion } from 'framer-motion';
import { currentPostContext } from "../_app";

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
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);
  const { title, postId, setTitle, setPostId } = useContext(currentPostContext);

  const handleClick = (id, title) => {
    if (isAnimating) return;
    const articleTitle = title;
    if (articleTitle) {
      setTitle(articleTitle);
      setPostId(id);
    }
    setIsAnimating(true);
    setTimeout(() => {
      router.push(`/${id}`);
    }, 700);
  };


  if (isAnimating) {
    return (
      <motion.div
        layoutId={`container-${postId}`}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "var(--background)",
          overflow: "hidden",
          zIndex: 300,
        }}
        transition={{ layout: { duration: 0.5, ease: "easeInOut" } }}
        className="flex flex-col justify-center px-4 md:px-16"
      >
        <motion.h2
          layoutId={`title-${postId}`}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{
            color: "var(--foreground)",
            wordBreak: "keep-all",
            overflowWrap: "break-word",
            textWrap: "balance"
          }}
          className="shimmering w-fit text-3xl md:text-5xl font-black mt-2"
        >
          {title}
        </motion.h2>
      </motion.div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 ">
      <div className="flex items-center gap-4 flex-wrap mt-8">
        {list.map((post) => (
          <div onClick={() => handleClick(post.id, post.properties.이름.title[0]?.plain_text)} key={post.id} className="no-underline transition-all opacity-50 hover:opacity-100">
            <motion.h2
              style={{ color: 'var(--foreground)', wordBreak: 'keep-all', overflowWrap: 'break-word' }}
              className="text-lg m-0 h-full md:text-2xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}>
              {post.properties.이름.title[0]?.plain_text}
            </motion.h2>
          </div>
        ))}
      </div>
    </main>
  );
}


