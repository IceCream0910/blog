import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import BlurText from "../BlurText";

const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function AISummary({ summary }) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!summary) return null;

    return (
        <motion.div
            variants={containerVariants}
            className="my-8 p-1 rounded-3xl bg-zinc-100 dark:bg-zinc-800 relative z-0"
        >
            <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2 cursor-pointer focus:outline-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-1">
                    <span className="text-sm">✨</span>
                    <span className="text-sm font-bold">AI 요약</span>
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-zinc-500 dark:text-zinc-400"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </motion.div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div className="mt-1 p-5 text-gray-300 rounded-3xl bg-zinc-200 dark:bg-zinc-900">
                            <BlurText
                                text={summary}
                                delay={50}
                                animateBy="words"
                                direction="bottom"
                                className="text-base leading-7 m-0 opacity-90"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </motion.div>
    );
}
