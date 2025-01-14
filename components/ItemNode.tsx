import React from 'react';
import { motion } from 'framer-motion';
import { Circle } from './shapes/Circle';
import { Triangle } from './shapes/Triangle';

interface Props {
    id: string;
    title: string;
    layout: {
        x: number;
        y: number;
        rotation: number;
        scale: number;
        zIndex: number;
        shape: 'circle' | 'rectangle' | 'triangle';
    };
}

export const ItemNode = React.memo(({ id, title, layout }: Props) => {
    const ShapeComponent = () => {
        switch (layout.shape) {
            case 'circle':
                return <Circle />;
            case 'triangle':
                return <Triangle />;
            default:
                return (
                    <div className="w-32 h-32 rounded-xl bg-white dark:bg-gray-800 shadow-lg border-2 border-gray-200 dark:border-gray-700" />
                );
        }
    };

    return (
        <motion.div
            data-id={id}
            className="absolute grid-item"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                x: layout.x,
                y: layout.y,
                rotate: layout.rotation,
                scale: layout.scale,
                zIndex: layout.zIndex,
            }}
            whileHover={{
                scale: layout.scale * 1.1,
                zIndex: 1000,
                transition: { duration: 0.2 }
            }}
            whileTap={{ scale: layout.scale * 0.95 }}
        >
            <div className="relative">
                <ShapeComponent />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-medium text-center px-2 transform-none select-none text-gray-800 dark:text-gray-200 pointer-events-none">
                        {title}
                    </span>
                </div>
            </div>
        </motion.div>
    );
});

ItemNode.displayName = 'ItemNode';
