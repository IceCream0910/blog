"use client";
import Link from "next/link";
import { getDatabase } from "../../utils/get-database";
import { motion } from "framer-motion";
import IonIcon from "@reacticons/ionicons";
import { useRouter } from "next/navigation";
import { useState, useRef, useContext, useEffect } from "react";
import { currentPostContext } from "../_app";
import gsap from "gsap";

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
    console.error("Failed to fetch database:", error);
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragIndex, setDragIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { setTitle, setPostId, title, postId } = useContext(currentPostContext);
  const [showGuide, setShowGuide] = useState(true);

  const [maxCard, setMaxCard] = useState(5);
  useEffect(() => {
    setTitle("");
    setPostId("");

    const savedPosition = sessionStorage.getItem('journalScrollPosition');
    if (savedPosition) {
      setCurrentIndex(parseInt(savedPosition));
    }

    const updateMaxCard = () => {
      const height = window.innerHeight;
      let cardCount = Math.floor(height / 200);
      cardCount = Math.max(3, Math.min(cardCount, 10));
      setMaxCard(cardCount);
    };
    updateMaxCard();
    window.addEventListener("resize", updateMaxCard);
    return () => window.removeEventListener("resize", updateMaxCard);
  }, []);

  const scrollObj = useRef({ value: currentIndex });
  const wheelDelta = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const dragStartIndex = useRef(0);
  const dragObj = useRef({ value: 0 });

  const GAP = 50;
  const SENSITIVITY = 30; // 픽셀 당 인덱스 변화량
  const MOMENTUM_MULTIPLIER = 50;

  useEffect(() => {
    setDragIndex(currentIndex);
    scrollObj.current.value = currentIndex;
  }, [currentIndex]);

  const handleClick = (id, articleTitle) => {
    if (isLoading) return;
    if (articleTitle) {
      setTitle(articleTitle);
      setPostId(id);
    }
    sessionStorage.setItem('journalScrollPosition', currentIndex);
    setIsLoading(true);
    setTimeout(() => {
      router.push(`/${id}`);
    }, 700);
  };

  const tweenToIndex = (newIndex) => {
    gsap.to(scrollObj.current, {
      value: newIndex,
      duration: 0.3,
      ease: "power2.out",
      onUpdate: () => {
        setCurrentIndex(Math.round(scrollObj.current.value));
      }
    });
  };

  const handleWheel = (e) => {
    const WHEEL_THRESHOLD = 30;
    wheelDelta.current += e.deltaY;
    if (Math.abs(wheelDelta.current) > WHEEL_THRESHOLD) {
      const steps = Math.floor(Math.abs(wheelDelta.current) / WHEEL_THRESHOLD);
      const maxIndex = Math.max(list.length - maxCard - 1, 0);
      let newIndex;
      if (wheelDelta.current > 0) {
        newIndex = Math.min(currentIndex + steps, maxIndex);
      } else {
        newIndex = Math.max(currentIndex - steps, 0);
      }
      wheelDelta.current = 0;
      tweenToIndex(newIndex);
    }
    setShowGuide(false);
  };

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    dragStartIndex.current = dragIndex;
  };

  const handleTouchMove = (e) => {
    const diff = e.touches[0].clientY - touchStartY.current; // 이동 방향 반전
    let newDragIndex = dragStartIndex.current + diff / SENSITIVITY;
    const maxIndex = Math.max(list.length - maxCard - 1, 0);
    newDragIndex = Math.max(0, Math.min(newDragIndex, maxIndex));
    setDragIndex(newDragIndex);
    setCurrentIndex(newDragIndex);
    setShowGuide(false);
  };

  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const elapsed = Date.now() - touchStartTime.current || 1;
    const diff = touchEndY - touchStartY.current;
    const velocity = diff / elapsed;
    const momentumOffset = (velocity * MOMENTUM_MULTIPLIER) / SENSITIVITY;
    let finalIndex = Math.round(dragIndex + momentumOffset);
    const maxIndex = Math.max(list.length - maxCard - 1, 0);
    finalIndex = Math.max(0, Math.min(finalIndex, maxIndex));

    dragObj.current.value = finalIndex;
    gsap.to(dragObj.current, {
      value: finalIndex,
      duration: 0.3,
      ease: "power2.out",
      onUpdate: () => {
        setDragIndex(dragObj.current.value);
        setCurrentIndex(dragObj.current.value);
      },
      onComplete: () => {
        setCurrentIndex(finalIndex);
      },
    });
  };

  const baseIndex = Math.floor(dragIndex);
  const fraction = dragIndex - baseIndex;
  const visibleCards = list
    .slice(baseIndex, baseIndex + maxCard + 1)
    .reverse();

  if (isLoading) {
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
    <main className="container mx-auto px-4 py-8">
      <motion.h1
        layoutId="page-hero"
        className="text-3xl md:text-5xl text-gray-400 font-bold mt-16 md:text-4xl text-center text-balance"
        style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}
      >
        저의 <span style={{ color: "var(--foreground)" }}>디지털 숲🌳</span>에<br />오신 것을 환영합니다
        <br />
      </motion.h1>


      <div
        className="fixed bottom-0 left-0 right-0 h-full flex flex-col items-center justify-end p-4 box-border z-1"
        style={{ touchAction: "none" }}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {visibleCards.map((post, i) => {
          const bottomOffset = (maxCard - i) * GAP - fraction * GAP;
          return (
            <motion.div
              layoutId={`container-${post.id}`}
              key={post.id}
              initial={{ bottom: (maxCard - i) * GAP }}
              animate={{ bottom: bottomOffset }}
              transition={{ duration: 0.1 }}
              className="w-[92%] md:w-[var(--max-width)]"
              style={{
                zIndex: (maxCard - i) / 10,
                position: "absolute",
                height: "200px",
              }}
            >
              <article
                onClick={() =>
                  handleClick(
                    post.id,
                    post.properties.이름.title[0]?.plain_text
                  )
                }
                className="rounded-t-3xl overflow-hidden transition-all duration-300 ease-out cursor-pointer flex flex-col border-t-2 border-s-2 border-t-gray-200 dark:border-t-gray-700 dark:border-s-gray-600"
                style={{
                  background: "var(--card-bg)",
                  transform: `scale(${1 - (maxCard - i) * 0.05})`,
                  height: "200px",
                  opacity: 1 - (maxCard - i) * 0.15
                }}
              >
                <div className="flex-1 p-3 flex flex-col justify-start relative z-10">
                  <motion.h2
                    style={{
                      color: "var(--foreground)",
                      wordBreak: "keep-all",
                      overflowWrap: "break-word",
                    }}
                    className="text-lg m-0 h-full"
                    layoutId={`title-${post.id}`}
                  >
                    {post.properties.이름.title[0]?.plain_text}
                  </motion.h2>
                </div>
              </article>
            </motion.div>
          );
        })}

        {showGuide && (
          <motion.div
            className="fixed bottom-5 left-0 right-0 z-[999] flex flex-col gap-2 items-center justify-center opacity-50 text-sm"
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <IonIcon name="chevron-expand" className="text-2xl" />
            위 아래로 스크롤하여 탐색
          </motion.div>
        )}
      </div>
    </main>
  );
}
