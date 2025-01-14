import React from 'react';

const Triangle: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg
        className={`w-40 h-40 ${className}`}
        viewBox="0 0 100 100"
    >
        <polygon
            points="50,10 90,90 10,90"
            className="fill-white dark:fill-gray-800 stroke-gray-200 dark:stroke-gray-700 stroke-2 shadow-lg"
        />
    </svg>
);

export { Triangle };