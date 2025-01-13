import { motion } from 'framer-motion';
import { useTransitionStore } from '../store/transition';

export const ArticleCard = ({ post, onClick }) => {
    const transitionStore = useTransitionStore();

    const handleClick = (e) => {
        transitionStore.setTransitionData(e.currentTarget.getBoundingClientRect(), post.id);
        onClick && onClick();
    };

    return (
        <motion.article
            layout
            layoutId={post.id}
            onClick={handleClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                background: 'var(--card-bg)',
                position: 'relative',
            }}
            className="rounded-3xl overflow-hidden hover:shadow-lg transition-all ease-in cursor-pointer aspect-square flex flex-col p-6"
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
                        <span className='tossface'>{post.properties.카테고리.select?.name.substring(0, 2)}</span>
                        {post.properties.카테고리.select?.name.substring(2)}
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
                        overflowWrap: 'break-word'
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
                        className="absolute bottom-0 right-0 w-2/5"
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
