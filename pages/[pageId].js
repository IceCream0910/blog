import dynamic from 'next/dynamic'
import { NotionAPI } from 'notion-client'
import { NotionRenderer } from '../packages/react-notion-x'
import 'prismjs/themes/prism-tomorrow.css'
import 'katex/dist/katex.min.css'
import { useEffect, useState } from 'react'
import { calculateReadingTime } from '../utils/readingTime'
import { loadPrismComponentsWithRetry } from '../utils/load-prism-components';
import { Podcast } from '../components/Podcast'
import Comments from '../components/Comments'
import { Backlinks } from '../components/Backlinks'
import { PageHead } from '../components/PageHead'
import { motion } from 'framer-motion';
import { useTransitionStore } from '../store/transition';
import { useRouter } from 'next/router';

const Code = dynamic(() =>
    import('../packages/react-notion-x/third-party/code').then(async m => {
        // add / remove any prism syntaxes here
        await loadPrismComponentsWithRetry([
            () => import('prismjs/components/prism-markup-templating.js'),
            () => import('prismjs/components/prism-markup.js'),
            () => import('prismjs/components/prism-bash.js'),
            () => import('prismjs/components/prism-c.js'),
            () => import('prismjs/components/prism-cpp.js'),
            () => import('prismjs/components/prism-csharp.js'),
            () => import('prismjs/components/prism-docker.js'),
            () => import('prismjs/components/prism-java.js'),
            () => import('prismjs/components/prism-js-templates.js'),
            () => import('prismjs/components/prism-coffeescript.js'),
            () => import('prismjs/components/prism-diff.js'),
            () => import('prismjs/components/prism-git.js'),
            () => import('prismjs/components/prism-go.js'),
            () => import('prismjs/components/prism-graphql.js'),
            () => import('prismjs/components/prism-handlebars.js'),
            () => import('prismjs/components/prism-less.js'),
            () => import('prismjs/components/prism-makefile.js'),
            () => import('prismjs/components/prism-markdown.js'),
            () => import('prismjs/components/prism-objectivec.js'),
            () => import('prismjs/components/prism-ocaml.js'),
            () => import('prismjs/components/prism-python.js'),
            () => import('prismjs/components/prism-reason.js'),
            () => import('prismjs/components/prism-rust.js'),
            () => import('prismjs/components/prism-sass.js'),
            () => import('prismjs/components/prism-scss.js'),
            () => import('prismjs/components/prism-solidity.js'),
            () => import('prismjs/components/prism-sql.js'),
            () => import('prismjs/components/prism-stylus.js'),
            () => import('prismjs/components/prism-swift.js'),
            () => import('prismjs/components/prism-wasm.js'),
            () => import('prismjs/components/prism-yaml.js'),
        ]);

        return m.Code;
    }),
);
const Collection = dynamic(() =>
    import('../packages/react-notion-x/third-party/collection').then(
        (m) => m.Collection
    )
)
const Equation = dynamic(() =>
    import('../packages/react-notion-x/third-party/equation').then((m) => m.Equation)
)
const Pdf = dynamic(
    () => import('../packages/react-notion-x/third-party/pdf').then((m) => m.Pdf),
    {
        ssr: false
    }
)
const Modal = dynamic(
    () => import('../packages/react-notion-x/third-party/modal').then((m) => m.Modal),
    {
        ssr: false
    }
)

export async function getStaticPaths() {
    return {
        paths: [],
        fallback: 'blocking'
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
    const router = useRouter();
    const transitionStore = useTransitionStore();
    const isTarget = pageId === transitionStore.targetId;

    useEffect(() => {
        // 컴포넌트 마운트 시 transition 데이터 초기화
        return () => {
            transitionStore.clearTransitionData();
        };
    }, []);

    // 뒤로가기 핸들러
    const handleBackNavigation = () => {
        router.back();
    };

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

    return (
        <motion.main
            transition={{ duration: 0.3 }}
            onAnimationComplete={() => {
                // 애니메이션 완료 후 스크롤 위치 초기화
                window.scrollTo(0, 0);
            }}
        >
            <PageHead
                title={title || "태인의 Blog"}
                url={`https://blog.yuntae.in/${pageId}`}
                description="새로움에 끊임없이 도전하는 태인의 Blog"
                image={`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/social-image?id=${pageId}`}
            />

            <div className='page-container'>
                <motion.div
                    layoutId={isTarget ? pageId : undefined}
                    className='pt-6 pb-0'
                >
                    <motion.div
                        layoutId={`category-${pageId}`}
                        className="flex items-center gap-2 mb-3"
                    >
                        {category &&
                            <span
                                style={{
                                    background: category.includes('스터디') ? 'var(--category-bg-1)' : category.includes('프로젝트') ? 'var(--category-bg-2)' : 'var(--category-bg-3)',
                                    color: category.includes('스터디') ? 'var(--category-text-1)' : category.includes('프로젝트') ? 'var(--category-text-2)' : 'var(--category-text-3)',
                                }}
                                className="px-2 py-1 text-sm rounded-full"
                            >
                                <span className='tossface'>{category.substring(0, 2)}</span>{category.substring(2)}
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
                        className='text-3xl font-bold m-0'
                    >
                        {title}
                    </motion.h2>

                    <motion.span
                        layoutId={`date-${pageId}`}
                        style={{ color: 'var(--date-text)' }}
                        className="text-sm m-0"
                    >
                        {properties["cwqu"] && properties["cwqu"][0][1][0][1].start_date + " | "}<span className='tossface'>🕒</span> 읽는 데 {readTime}분 예상
                    </motion.span>
                    <div className='m-8' />
                    <Podcast title={title} />
                </motion.div>


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

                <div className='m-16' />
                <Backlinks currentId={pageId} />
                <Comments pageId={pageId} />
            </div>
        </motion.main>
    );
}
