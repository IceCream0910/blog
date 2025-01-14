import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

interface Props {
    id: string;
    title: string;
    position: { x: number; y: number };
    gridSize: number;
}

export const GridItem: React.FC<Props> = ({ id, title, position, gridSize }) => {
    const router = useRouter();
    const itemSize = gridSize - 20;
    const itemRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = itemRef.current;
        if (!element) return;

        const handleNavigate = (e: any) => {
            router.push(`/${e.detail.id}`);
        };

        element.addEventListener('navigate', handleNavigate as EventListener);
        return () => element.removeEventListener('navigate', handleNavigate as EventListener);
    }, [id, router]);

    return (
        <motion.div
            ref={itemRef}
            data-id={id}
            className="grid-item no-underline absolute"
            style={{
                left: position.x * gridSize + 10,
                top: position.y * gridSize + 10,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onContextMenu={e => e.preventDefault()}
        >
            <div
                className="rounded-xl overflow-hidden cursor-pointer flex flex-col border-solid border-2 border-gray-400 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-200 ease-in-out opacity-60 hover:opacity-100"
                style={{
                    width: itemSize,
                    height: itemSize,
                }}
            >
                <h2 className="text-sm max-w-4/5 m-3 pointer-events-none truncate">
                    {title}
                </h2>
            </div>
        </motion.div>
    );
};
