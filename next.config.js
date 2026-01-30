
module.exports = {
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                worker_threads: false,
            };
        }
        return config;
    },
    staticPageGenerationTimeout: 300,
};