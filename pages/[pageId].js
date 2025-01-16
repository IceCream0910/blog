import dynamic from 'next/dynamic'
import { NotionAPI } from 'notion-client'
import { NotionRenderer } from '../packages/react-notion-x'
import 'prismjs/themes/prism-tomorrow.css'
import 'katex/dist/katex.min.css'
import { useEffect, useState } from 'react'
import { calculateReadingTime } from '../utils/readingTime'
import { Podcast } from '../components/Podcast'
import Comments from '../components/Comments'
import { Backlinks } from '../components/Backlinks'
import { PageHead } from '../components/PageHead'
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { Code, Collection, Equation, Pdf, Modal } from '../utils/notion-components'
import { getDatabase } from "../utils/get-database"

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
    const { pageId } = params;

    if (!pageId) {
        return {
            redirect: {
                destination: '/',
                permanent: true
            }
        }
    }

    const match = pageId.match(/^(.*)-([a-f0-9]{32})$/);
    if (pageId.length == 32) {
        const formattedPageId = pageId.replace(/-/g, '').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
        return {
            redirect: {
                destination: `/${formattedPageId}`,
                permanent: true
            }
        };
    } else if (match && match[2]) {
        const formattedPageId = match[2].replace(/-/g, '').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
        return {
            redirect: {
                destination: `/${formattedPageId}`,
                permanent: true
            }
        };
    } else {
        if (pageId.length != 36) {
            return {
                notFound: true
            }
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

        return {
            props: {
                pageId,
                recordMap
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

export default function Page({ pageId, recordMap }) {
    if (!recordMap || !recordMap.block || Object.keys(recordMap.block).length === 0) {
        return <div>Invalid page data</div>;
    }

    const properties = recordMap.block[pageId].value.properties;
    var title, category, tags;

    if (properties["fVc<"]) {
        title = properties.title[0][0];
        category = properties["fVc<"][0][0];
        tags = properties["f|n]"].toString().split(',')
    } else {
        title = properties.title[0][0];
        category = ""
        tags = []
    }

    const [readTime, setReadTime] = useState(0);
    const [darkmode, setDarkmode] = useState(false);

    useEffect(() => {
        const content = document.querySelector(".notion-page")?.innerText;
        const text = content
            // 이미지 제거
            .replaceAll(/!\[([^\]]+?)\]\([^)]+?\)/g, '')
            // 링크는 텍스트만 남기고 제거
            .replaceAll(/\[([^\]]+?)\]\([^)]+?\)/g, '$1')
            // 코드 블록 제거
            .replaceAll(/```[^\n]+?\n([\s\S]+?)\n```/g, '')
            // 불렛 제거
            .replaceAll(/- ([^\n]+?)\n/g, '$1\n')
            // 특수문자 제거
            .replaceAll(/([*_`~#>])/g, '')
            // '출처 : <링크>' 형태 제거
            .replaceAll(/출처\s*:\s*https?:\/\/[^\s]+/g, '')
            // 좌우 공백 제거
            .replaceAll("<", " ")
            .trim();

        const time = calculateReadingTime(text);
        setReadTime(time);

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setDarkmode(mediaQuery.matches);

        const handleColorSchemeChange = (e) => {
            setDarkmode(e.matches);
        };

        mediaQuery.addEventListener('change', handleColorSchemeChange);

        return () => {
            mediaQuery.removeEventListener('change', handleColorSchemeChange);
        };
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
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
                <motion.div
                    className='pt-6 pb-0 sticky z-10'
                    variants={containerVariants}
                >
                    <motion.div
                        variants={itemVariants}
                        className="flex items-center gap-2 mb-3 flex-wrap"
                    >
                        {category &&
                            <span
                                style={{
                                    background: category.includes('스터디') ? 'var(--category-bg-1)' : category.includes('프로젝트') ? 'var(--category-bg-2)' : 'var(--category-bg-3)',
                                    color: category.includes('스터디') ? 'var(--category-text-1)' : category.includes('프로젝트') ? 'var(--category-text-2)' : 'var(--category-text-3)',
                                }}
                                className="px-2 py-1 text-sm rounded-full"
                            >
                                <span>{category}</span>
                            </span>
                        }
                        {tags && tags.map((tag) => (
                            <span

                                key={tag}
                                style={{
                                    background: 'var(--tag-bg)',
                                    color: 'var(--tag-text)'
                                }}
                                className="px-2 py-1 text-sm rounded-full"
                            >#{tag}</span>
                        ))}
                    </motion.div>
                    <motion.h2
                        layoutId={`title-${pageId}`}
                        variants={itemVariants}
                        className='text-3xl font-bold m-0'
                    >
                        {title}
                    </motion.h2>

                    <motion.span
                        variants={itemVariants}
                        style={{ color: 'var(--date-text)' }}
                        className="text-sm m-0"
                    >
                        {properties["cwqu"] && properties["cwqu"][0][1][0][1].start_date + " | "}<span className='tossface'>🕒</span> 읽는 데 {readTime}분 예상
                    </motion.span>
                    <motion.div variants={itemVariants} className='m-8' />
                    <motion.div variants={itemVariants}>
                        <Podcast title={title} />
                    </motion.div>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <NotionRenderer
                        recordMap={recordMap}
                        components={{
                            Code,
                            Collection,
                            Equation,
                            Pdf,
                            Modal
                        }}
                        fullPage={false}
                        darkMode={darkmode}
                        showTableOfContents={true}
                        previewImages={!!recordMap.preview_images}
                    />
                </motion.div>

                <motion.div variants={itemVariants} className='m-16' />
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
