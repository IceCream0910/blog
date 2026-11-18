
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
    async headers() {
        return [{
            source: "/interactive-sandbox.html",
            headers: [{
                key: "Content-Security-Policy",
                value: "sandbox allow-scripts",
            }],
        }];
    },
    staticPageGenerationTimeout: 300,
};