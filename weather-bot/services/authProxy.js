const axios = require("axios");

function addAuthHeader(config, auth) {
    const requestConfig = {
        ...config,
        headers: {
            ...(config.headers || {})
        }
    };

    if (auth.type === "apiKey") {
        requestConfig.headers[auth.headerName || "x-api-key"] = auth.apiKey;
    }

    if (auth.type === "jwt") {
        requestConfig.headers.Authorization = `Bearer ${auth.token}`;
    }

    if (auth.type === "oauth") {
        requestConfig.headers.Authorization = `Bearer ${auth.accessToken}`;
    }

    return requestConfig;
}

function createAuthProxy(options) {
    let auth = options.auth;
    const sendRequest = options.sendRequest || axios;
    const logger = options.logger || console;
    const rateLimitMs = options.rateLimitMs || 0;
    let lastRequestTime = 0;

    async function waitForRateLimit() {
        if (rateLimitMs === 0) {
            return;
        }

        const now = Date.now();
        const timeFromLastRequest = now - lastRequestTime;

        if (timeFromLastRequest < rateLimitMs) {
            await new Promise((resolve) => {
                setTimeout(resolve, rateLimitMs - timeFromLastRequest);
            });
        }

        lastRequestTime = Date.now();
    }

    async function request(config) {
        await waitForRateLimit();

        let requestConfig = addAuthHeader(config, auth);
        logger.log("Request:", requestConfig.method || "GET", requestConfig.url);

        try {
            return await sendRequest(requestConfig);
        } catch (error) {
            const status = error.response && error.response.status;

            if (status === 401 && typeof options.refreshToken === "function") {
                logger.log("Token expired. Refreshing token...");
                auth = await options.refreshToken(auth);
                requestConfig = addAuthHeader(config, auth);
                return sendRequest(requestConfig);
            }

            throw error;
        }
    }

    function setAuth(newAuth) {
        auth = newAuth;
    }

    return {
        request,
        setAuth
    };
}

module.exports = {
    addAuthHeader,
    createAuthProxy
};
