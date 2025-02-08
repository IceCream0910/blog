import { motion, useAnimation } from 'framer-motion';
import { useState, useContext } from 'react';
import { currentPostContext } from '../pages/_app';

export const ArticleCard = ({ post, onClick }) => {
    const controls = useAnimation();
    const [isAnimating, setIsAnimating] = useState(false);
    const { setTitle, setPostId } = useContext(currentPostContext);

    const handleClick = (e) => {
        e.preventDefault();
        if (isAnimating) return;
        const articleTitle = post.properties.이름.title[0]?.plain_text;
        if (articleTitle) {
            setTitle(articleTitle);
            setPostId(post.id);
        }
        setIsAnimating(true);
        setTimeout(() => {
            if (onClick) onClick();
        }, 700);
    };

    if (isAnimating) {
        return (
            <motion.div
                layoutId={`container-${post.id}`}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'var(--background)',
                    overflow: 'hidden',
                    zIndex: 300,
                }}
                transition={{ layout: { duration: 0.5, ease: "easeInOut" } }}
                className="flex flex-col justify-center px-4 md:px-16"
            >
                <motion.h2
                    layoutId={`title-${post.id}`}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    style={{
                        color: 'var(--foreground)',
                        wordBreak: 'keep-all',
                        overflowWrap: 'break-word',
                        textWrap: 'balance'
                    }}
                    className="shimmering w-fit text-3xl md:text-5xl font-black mt-2"
                >
                    {post.properties.이름.title[0]?.plain_text}
                </motion.h2>
            </motion.div>
        );
    }

    return (
        <motion.article
            layoutId={`container-${post.id}`}
            onClick={handleClick}
            style={{
                background: 'var(--card-bg)',
                position: 'relative',
            }}
            className="rounded-3xl overflow-hidden hover:shadow-lg transition-all ease-in cursor-pointer aspect-none flex flex-col p-6 md:aspect-square"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            exit={{
                scale: 1,
                filter: "blur(0px)",
                transition: { duration: 0.3 }
            }}
        >
            <motion.div
                layoutId={`cover-${post.id}`}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `url(${post.cover && (post.cover.file?.url || post.cover.external?.url || '')})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                    opacity: 0.1,
                    transition: 'opacity 0.3s ease',
                }}
                className="hover:display-none"
            />

            <motion.div className="relative z-10 flex flex-col h-full">
                <motion.div
                    layoutId={`category-${post.id}`}
                    className="flex items-center gap-2 mb-4"
                >
                    <span
                        style={{
                            color: post.properties.카테고리.select?.name.includes('스터디')
                                ? 'var(--category-text-1)'
                                : post.properties.카테고리.select?.name.includes('프로젝트')
                                    ? 'var(--category-text-2)'
                                    : 'var(--category-text-3)',
                        }}
                        className="text-sm"
                    >
                        <span>{post.properties.카테고리.select?.name}</span>

                        &nbsp;&nbsp;
                        {post.properties.태그.multi_select.map((tag) => (
                            <span
                                key={tag.id}
                                style={{
                                    color: 'var(--tag-text)',
                                    opacity: .7
                                }}
                                className="text-sm"
                            >
                                #{tag.name}&nbsp;
                            </span>
                        ))}
                    </span>
                </motion.div>

                <motion.h2
                    layoutId={`title-${post.id}`}
                    style={{
                        color: 'var(--foreground)',
                        wordBreak: 'keep-all',
                        overflowWrap: 'break-word',
                    }}
                    className="text-2xl font-bold m-0 w-2/3 h-full"
                >
                    {post.properties.이름.title[0]?.plain_text}
                </motion.h2>

                <motion.span
                    layoutId={`date-${post.id}`}
                    style={{ color: 'var(--date-text)' }}
                    className="text-sm mt-auto"
                >
                    {new Date(post.properties.작성일.date?.start).toLocaleDateString()}
                </motion.span>

                {post.icon && (
                    <motion.div
                        layoutId={`icon-${post.id}`}
                        className="absolute bottom-0 right-0 w-1/5 md:w-2/5"
                    >
                        <img
                            src={post.icon.emoji || post.icon.file?.url || post.icon.external?.url}
                            alt="Post icon"
                            id="post-icon"
                            className="w-full rounded-none aspect-square grayscale transition-all ease-in"
                        />
                    </motion.div>
                )}
            </motion.div>
        </motion.article>
    );
};
