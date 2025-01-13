import { motion } from 'framer-motion';

const pageMotion = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
    transition: { duration: 0.3 }
};

const PageTransition = ({ children }) => {
    return (
        <motion.div {...pageMotion}>
            {children}
        </motion.div>
    );
};

export default PageTransition;