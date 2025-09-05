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
      ]
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
  const [sortOption, setSortOption] = useState("date");
  const [filterOption, setFilterOption] = useState("all"); // "all", "일지", "문서"

  const sortedList = useMemo(() => {
    let filtered = list;

    if (filterOption !== "all") {
      filtered = list.filter(post =>
        post.properties["forest_분류"]?.select?.name === filterOption
      );
    }

    if (sortOption === "title") {
      return [...filtered].sort((a, b) =>
        a.properties.이름.title[0]?.plain_text.localeCompare(b.properties.이름.title[0]?.plain_text)
      );
    } else {
      return [...filtered].sort((a, b) =>
        new Date(b.last_edited_time) - new Date(a.last_edited_time)
      );
    }
  }, [list, sortOption, filterOption]);

  const handleFilterToggle = (type) => {
    if (filterOption === type) {
      setFilterOption("all");
    } else {
      setFilterOption(type);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.9
    },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 200
      }
    }
  };

  return (
    <main className="mx-auto px-4 py-8 pb-20">
      <motion.h1
        layoutId="page-hero"
        className="text-3xl md:text-5xl text-gray-400 font-bold mt-16 md:text-4xl text-center text-balance mb-20"
        style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}
      >
        저의 <span style={{ color: "var(--foreground)" }}>디지털 숲🌳</span>에<br />오신 것을 환영합니다
        <br />
      </motion.h1>

      <div className="fixed top-8 right-8 flex justify-center z-99">
        <div className="flex rounded-3xl overflow-hidden w-fit backdrop-filter backdrop-blur border border-gray-300 dark:border-gray-800 backdrop-blur shadow-lg">
          <button
            onClick={() => handleFilterToggle("일지")}
            className={`flex items-center p-4 text-sm transition-colors rounded-3xl ${filterOption === "일지"
              ? "bg-[var(--primary)] text-white"
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
          >
            <IonIcon name="book-outline" />
          </button>

          <button
            onClick={() => handleFilterToggle("문서")}
            className={`flex items-center p-4 text-sm transition-colors rounded-3xl ${filterOption === "문서"
              ? "bg-[var(--primary)] text-white"
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
          >
            <IonIcon name="document-outline" />
          </button>
        </div>
      </div>

      <motion.div
        key={filterOption}
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-3 gap-5 mt-6"
      >
        {sortedList.map((post, index) => (
          <motion.div
            key={post.id}
            variants={itemVariants}
            className="relative"
          >
            <Link href={`/${post.id}`} className="no-underline">
              {post.properties["forest_분류"]?.select?.name === "일지" ? (
                <Folder title={post.properties.이름.title[0]?.plain_text} desc={"일지"} />
              ) : (
                <article className="bg-gray-50 dark:bg-[--card-bg] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200 h-full flex flex-col">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white m-0 mb-4 leading-tight">
                      {post.properties.이름.title[0]?.plain_text}
                    </h2>

                    <div className="mb-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-2">
                        {post.properties.forest_articles.rich_text.length != 0 && JSON.parse(post.properties.forest_articles.rich_text.map(item => item.text.content).join('').replaceAll("”", "\"").replaceAll("“", "\"")).map((text, i) => (
                          <span key={i} className="text-sm text-gray-500 dark:text-gray-300">
                            <IonIcon name="reader-outline" className="relative top-[2px] mr-1" />
                            {text}<br /></span>
                        ))}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      {new Date(post.last_edited_time).toLocaleDateString('ko-KR').toUpperCase()}
                    </span>
                    <div className="flex space-x-1 opacity-60">
                      <IonIcon name="expand-outline" className="text-gray-400" />
                    </div>
                  </div>
                </article>
              )}
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </main>
  );
}

function Folder({ title, desc }) {
  const colorPalette = [
    { from: '#d65858', to: '#f54e4e' }, // Red
    { from: '#8534bf', to: '#8b5cf6' }, // Purple
    { from: '#ffc870', to: '#ffbf00' }, // Orange
    { from: '#2ee8ab', to: '#09b881' }, // Emerald
    { from: '#3b82f6', to: '#2563eb' }, // Blue
    { from: '#f29a3d', to: '#faa748' }, // Amber
    { from: '#ffa6d2', to: '#f06eae' }, // Pink
  ];

  const getColorFromTitle = (title) => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colorPalette[Math.abs(hash) % colorPalette.length];
  };

  const getTextColor = (colorObj) => {
    const hex = colorObj.from.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  };

  const selectedColor = getColorFromTitle(title);
  const textColor = getTextColor(selectedColor);
  console.log(selectedColor, textColor);
  const gradientId = `gradient-${title.replace(/\s+/g, '-')}`;

  return (
    <div className="relative w-full h-full hover:scale-[1.02] transition-all duration-300 ">
      <svg
        viewBox="0 0 200 140"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={selectedColor.from} />
            <stop offset="100%" stopColor={selectedColor.to} />
          </linearGradient>
        </defs>
        <path
          d="M0 40 Q0 10 30 10 H80 Q100 10 110 25 Q115 35 130 35 H180 Q200 35 200 55 V120 Q200 140 180 140 H20 Q0 140 0 120 Z"
          fill={`url(#${gradientId})`}
        />
      </svg>

      <div className="absolute bottom-4 left-4" style={{ color: textColor }}>
        <p className="font-semibold text-lg m-0">{title}</p>
        <p className="text-sm opacity-60 mt-0 mb-2">{desc}</p>
      </div>

      <div className="absolute bottom-4 right-4 text-xl" style={{ color: textColor }}>⋯</div>
    </div>
  )
}