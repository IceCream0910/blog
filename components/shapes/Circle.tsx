import React from 'react';

export const Circle: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`w-32 h-32 rounded-full bg-white dark:bg-gray-800 shadow-lg border-2 border-gray-200 dark:border-gray-700 ${className}`} />
);
