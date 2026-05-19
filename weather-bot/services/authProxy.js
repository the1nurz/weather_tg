const axios = require("axios");

function buildAuthHeaders(auth) {
    if (!auth || !auth.type) {
        return {};
    }

    switch (auth.type) {
        case "apiKey":
            return {
                [auth.headerName || "x-api-key"]: auth.apiKey
            };
        case "jwt":
            return {
                Authorization: `Bearer ${auth.token || ""}`
            };
        case "oauth":
            return {
                Authorization: `Bearer ${auth.accessToken || ""}`
            };
        default:
            return {};
    }
}

function addAuthHeader(config, auth) {
    return {
        ...config,
        headers: {
            ...(config.headers || {}),
            ...buildAuthHeaders(auth)
        }
    };
}

function createAuthProxy(options = {}) {
    let auth = options.auth || {};
    const sendRequest = options.sendRequest || axios;
    const logger = options.logger || console;
    const rateLimitMs = Number(options.rateLimitMs) || 0;
    let lastRequestTime = 0;

    async function waitForRateLimit() {
        if (rateLimitMs <= 0) {
            return;
        }

        const now = Date.now();
        const elapsed = now - lastRequestTime;

        if (elapsed < rateLimitMs) {
            const delay = rateLimitMs - elapsed;
            logger.log(`[AuthProxy] waiting ${delay}ms for rate limit`);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }

        lastRequestTime = Date.now();
    }

    async function request(config = {}) {
        await waitForRateLimit();

        const requestConfig = addAuthHeader(config, auth);
        logger.log("[AuthProxy] Request:", requestConfig.method || "GET", requestConfig.url, "auth=" + (auth.type || "none"));

        if (typeof logger.debug === "function") {
            logger.debug("[AuthProxy] headers:", requestConfig.headers);
        }

        try {
            const response = await sendRequest(requestConfig);
            logger.log("[AuthProxy] Response:", response.status || "unknown", requestConfig.url);
            return response;
        } catch (error) {
            const status = error.response && error.response.status;
            logger.log("[AuthProxy] Error:", status || error.message, requestConfig.url);

            if (status === 401 && typeof options.refreshToken === "function") {
                logger.log("[AuthProxy] token expired, attempting refresh...");
                auth = await options.refreshToken(auth);
                const retryConfig = addAuthHeader(config, auth);
                logger.log("[AuthProxy] retrying request with refreshed credentials");
                return sendRequest(retryConfig);
            }

            throw error;
        }
    }

    function setAuth(newAuth) {
        auth = newAuth;
    }

    function getAuth() {
        return auth;
    }

    return {
        request,
        setAuth,
        getAuth
    };
}

module.exports = {
    addAuthHeader,
    buildAuthHeaders,
    createAuthProxy
};
