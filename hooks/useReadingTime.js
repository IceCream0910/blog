import { useState, useEffect } from 'react';
import { calculateReadingTime } from '../utils/readingTime';
import { extractTextFromRecordMap } from '../utils/extract-text';

export const useReadingTime = (recordMap) => {
    const [readTime, setReadTime] = useState(0);

    useEffect(() => {
        if (!recordMap) return;

        const text = extractTextFromRecordMap(recordMap);
        const time = calculateReadingTime(text);
        setReadTime(time);
    }, [recordMap]);

    return readTime;
};
