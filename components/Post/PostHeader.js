import { motion } from 'framer-motion';
import BlurText from "../BlurText";
import AISummary from "./AISummary";

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export const PostHeader = ({ title, category, tags, date, readTime, summary }) => {
    return (
        <div className='pt-6 pb-0 sticky z-10'>
            <motion.div
                variants={itemVariants}
                className="flex items-center gap-2 flex-wrap"
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
                layoutId={`title-${title}`}
                variants={itemVariants}
                className="mt-2"
            >
                <BlurText
                    text={title}
                    delay={50}
                    animateBy="words"
                    direction="bottom"
                    className="text-3xl font-bold m-0"
                />
            </motion.h2>

            <motion.span
                variants={itemVariants}
                style={{ color: 'var(--date-text)' }}
                className="text-sm m-0 block mt-2"
            >
                {date && `${date} | `}<span className='tossface'>🕒</span> 읽는 데 {readTime}분 예상
            </motion.span>
            <motion.div variants={itemVariants} className='m-8' />
            <AISummary summary={summary} />
        </div>
    );
};
