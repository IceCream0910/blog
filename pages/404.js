"use client";
import { PageHead } from "../components/PageHead";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="container mx-auto px-4 py-8">
      <PageHead
        title="404 Not Found"
        url="https://blog.yuntae.in"
      />
      <h1>이런 {':{'}</h1>
      <h2 className="m-0 text-xl">찾으시는 페이지가 없네요.</h2>
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => router.push('/')}
        style={{
          background: 'var(--primary-light)',
          color: 'var(--primary)',
        }}
        className="text-white font-bold py-2 px-4 rounded-xl mt-4"
      >
        홈으로 가기
      </motion.button>
    </main>
  );
}
