import { NotionAPI } from 'notion-client'
import { NotionRenderer } from '../packages/notionx'
import 'prismjs/themes/prism-tomorrow.css'
import 'katex/dist/katex.min.css'
import { useEffect } from 'react'
import Comments from '../components/Comments'
import { Backlinks } from '../components/Backlinks'
import { PageHead } from '../components/PageHead'
import { motion } from 'framer-motion';
import { Code, Collection, Equation, Modal } from '../utils/notion-components'
import { getDatabase } from "../utils/get-database"
import { manageSummary } from '../utils/notion-summary-service'
import { extractTextFromRecordMap } from '../utils/extract-text'

import { usePostMetadata } from '../hooks/usePostMetadata'
import { useReadingTime } from '../hooks/useReadingTime'
import { useDarkMode } from '../hooks/useDarkMode'

import { PostHeader } from '../components/Post/PostHeader'
import { PostActions } from '../components/Post/PostActions'
import AISummary from '../components/Post/AISummary'

export async function getStaticPaths() {
    try {
        const [mainData, forestData] = await Promise.all([
            getDatabase("1a346171ed574b0a9c1c3f5a29b39919"),
            getDatabase("ff85c8c8bc3345babf2f7970d86506d4")
        ]);

        const paths = [...mainData.results, ...forestData.results].map((page) => ({
            params: { pageId: page.id }
        }));

        return {
            paths,
            fallback: 'blocking'
        }
    } catch (error) {
        console.error('Error fetching databases:', error);
        return {
            paths: [],
            fallback: 'blocking'
        }
    }
}

export async function getStaticProps({ params }) {
    const { pageId: rawPageId } = params;
    if (!rawPageId) {
        return {
            notFound: true
        };
    }

    const match = rawPageId.match(/^(.*)-([a-f0-9]{32})$/);
    let pageId = rawPageId;

    if (pageId.length === 32) {
        pageId = pageId.replace(/-/g, '').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
    } else if (match && match[2]) {
        pageId = match[2].replace(/-/g, '').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
    } else {
        if (pageId.length !== 36) {
            return {
                notFound: true
            };
        }
    }

    try {
        const notion = new NotionAPI()
        const recordMap = await notion.getPage(pageId)

        if (!recordMap || !recordMap.block || Object.keys(recordMap.block).length === 0) {
            return {
                notFound: true
            }
        }


        // Check if it's a post (has category)
        const block = recordMap.block[pageId].value;
        const isPost = block.properties && block.properties["fVc<"]; // Category property check

        let summary = null;
        if (isPost) {
            const text = extractTextFromRecordMap(recordMap);
            summary = await manageSummary(pageId, text);
        }

        return {
            props: {
                pageId,
                recordMap,
                summary
            },
            revalidate: 10
        }
    } catch (error) {
        console.error('Error fetching page:', error);
        return {
            notFound: true
        }
    }
}

export default function Page({ pageId, recordMap, summary }) {
    if (!recordMap || !recordMap.block || Object.keys(recordMap.block).length === 0) {
        return <div>Invalid page data</div>;
    }

    const { title, category, tags, date } = usePostMetadata(pageId, recordMap);
    const readTime = useReadingTime(recordMap);
    const darkMode = useDarkMode();

    useEffect(() => {
        return () => {
            speechSynthesis.cancel();
        };
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (window.location.pathname !== `/${pageId}`) {
                window.history.replaceState(null, '', `/${pageId}`);
            }
        }
    }, [pageId]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.25 } }
    };

    return (
        <motion.main
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={containerVariants}
        >
            <PageHead
                title={title || "태인의 Blog"}
                url={`https://blog.yuntae.in/${pageId}`}
                image={`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/social-image?id=${pageId}`}
            />

            <div className='page-container'>
                <PostHeader
                    title={title}
                    category={category}
                    tags={tags}
                    date={date}
                    readTime={readTime}
                />

                <motion.div variants={itemVariants}>
                    <AISummary summary={summary} />
                </motion.div>

                <motion.div variants={itemVariants}>
                    <NotionRenderer
                        recordMap={recordMap}
                        components={{
                            Code,
                            Collection,
                            Equation,
                            Modal
                        }}
                        fullPage={false}
                        darkMode={darkMode}
                        showTableOfContents={true}
                        previewImages={!!recordMap.preview_images}
                    />
                </motion.div>

                <motion.div variants={itemVariants} className='m-16' />

                <PostActions title={title} pageId={pageId} />

                <motion.div variants={itemVariants}>
                    <Backlinks currentId={pageId} />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <Comments pageId={pageId} />
                </motion.div>
            </div>
        </motion.main>
    );
}
