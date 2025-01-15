import { motion } from "framer-motion"

export const Spinner = () => {
    return (
        <div className="flex justify-center items-center h-screen bg-opacity-0">
            <div className="flex items-center justify-center space-x-1">
                {[0, 1, 2].map((index) => (
                    <motion.div
                        key={index}
                        className="w-3 h-3 bg-blue-500 rounded-full"
                        animate={{
                            y: ["0%", "-50%", "0%"],
                        }}
                        transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            repeatType: "loop",
                            ease: "easeInOut",
                            delay: index * 0.2,
                        }}
                    />
                ))}
            </div>
        </div>
    );
};
