import { motion } from 'framer-motion';
import { useState } from 'react';
import BlurText from "../BlurText";

const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function AISummary({ summary }) {
    if (!summary) return null;

    return (
        <motion.div
            variants={containerVariants}
            className="my-8 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800"
        >
            <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">✨</span>
                <span className="text-lg font-bold">AI 요약</span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-200 dark:bg-zinc-900">
                <BlurText
                    text={summary}
                    delay={50}
                    animateBy="words"
                    direction="bottom"
                    className="text-base leading-7 m-0 opacity-90"
                />
            </div>

        </motion.div>
    );
}
