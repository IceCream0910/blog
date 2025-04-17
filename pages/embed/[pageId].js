import dynamic from 'next/dynamic'
import { NotionAPI } from 'notion-client'
import { NotionRenderer } from '../../packages/react-notion-x'
import 'prismjs/themes/prism-tomorrow.css'
import 'katex/dist/katex.min.css'
import { useEffect, useState } from 'react'
import { calculateReadingTime } from '../../utils/readingTime'
import { Podcast } from '../../components/Podcast'
import Comments from '../../components/Comments'
import { Backlinks } from '../../components/Backlinks'
import { PageHead } from '../../components/PageHead'
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { Code, Collection, Equation, Pdf, Modal } from '../../utils/notion-components'
import { getDatabase } from "../../utils/get-database"
import IonIcon from '@reacticons/ionicons'

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

    const [content, setContent] = useState('');
    const [readTime, setReadTime] = useState(0);
    const [darkmode, setDarkmode] = useState(false);

    useEffect(() => {
        const notionPage = document.querySelector(".notion-page");
        const codeBlocks = notionPage?.querySelectorAll('.notion-code');
        let body = notionPage?.innerText || '';

        // Remove text content from code blocks
        codeBlocks?.forEach(codeBlock => {
            body = body.replace(codeBlock.innerText, '');
        });

        const text = body
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
        setContent(text);

        const time = calculateReadingTime(text);
        setReadTime(time);

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setDarkmode(mediaQuery.matches);

        const handleColorSchemeChange = (e) => {
            setDarkmode(e.matches);
        };

        mediaQuery.addEventListener('change', handleColorSchemeChange);

        const contentContainer = document.querySelector(".custom-content");
        if (contentContainer) {
            const links = contentContainer.querySelectorAll('a');
            links.forEach(link => {
                if (!link.getAttribute('href')?.startsWith('#')) {
                    link.setAttribute('target', '_blank');
                }
            });
        }


        console.log('send message to parent')
        let message = { height: document.body.scrollHeight };
        window.top.postMessage(message, "*");

        return () => {
            mediaQuery.removeEventListener('change', handleColorSchemeChange);
        };
    }, []);

    return (
        <div className="custom-content">
            <NotionRenderer
                recordMap={recordMap}
                components={{
                    Code,
                    Collection,
                    Equation,
                    Modal
                }}
                fullPage={false}
                darkMode={darkmode}
                showTableOfContents={true}
                previewImages={!!recordMap.preview_images}
            />
            <style jsx global>{`
            html, body {
                background: none;
                overflow: hidden !important;
            }

    header, aside {
        display: none !important;
    }

    .custom-content {
        width: 100dvw;
        max-width: 100dvw;
    }
    `}
            </style>
        </div>
    );
}
