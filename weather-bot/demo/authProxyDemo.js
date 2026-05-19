const { createAuthProxy } = require("../services/authProxy");

let fakeServiceCallCount = 0;

async function fakeApiService(config) {
    fakeServiceCallCount += 1;
    console.log("API service received url:", config.url);
    console.log("API service received headers:", config.headers);

    if (config.url.includes("/protected") && config.headers.Authorization === "Bearer expired-token") {
        const error = new Error("Unauthorized");
        error.response = { status: 401 };
        throw error;
    }

    return {
        status: 200,
        data: {
            message: "Request accepted",
            request: {
                url: config.url,
                method: config.method || "GET",
                headers: config.headers
            }
        }
    };
}

async function runApiKeyDemo() {
    console.log("Basic authentication proxy demo");

    const proxy = createAuthProxy({
        auth: {
            type: "apiKey",
            apiKey: "demo-api-key-123",
            headerName: "x-api-key"
        },
        sendRequest: fakeApiService,
        rateLimitMs: 0,
        logger: console
    });

    const response = await proxy.request({
        method: "GET",
        url: "https://api.example.com/weather"
    });

    console.log("Response:", response.data);
}

async function runSwitchAuthDemo() {
    console.log("\nSwitching authentication strategies demo");

    const proxy = createAuthProxy({
        auth: {
            type: "jwt",
            token: "demo-jwt-token"
        },
        sendRequest: fakeApiService,
        rateLimitMs: 500,
        logger: console
    });

    await proxy.request({
        method: "POST",
        url: "https://api.example.com/profile",
        data: {
            city: "Kyiv"
        }
    });

    proxy.setAuth({
        type: "oauth",
        accessToken: "demo-oauth-access-token"
    });

    await proxy.request({
        method: "GET",
        url: "https://api.example.com/forecast"
    });
}

async function runTokenRefreshDemo() {
    console.log("\nToken refresh demo");

    const proxy = createAuthProxy({
        auth: {
            type: "oauth",
            accessToken: "expired-token"
        },
        sendRequest: fakeApiService,
        rateLimitMs: 200,
        logger: console,
        refreshToken: async (currentAuth) => {
            console.log("Refreshing token for auth type:", currentAuth.type);
            return {
                ...currentAuth,
                accessToken: "new-token-456"
            };
        }
    });

    const response = await proxy.request({
        method: "GET",
        url: "https://api.example.com/protected/resource"
    });

    console.log("Response after refresh:", response.data);
}

async function runDemo() {
    await runApiKeyDemo();
    await runSwitchAuthDemo();
    await runTokenRefreshDemo();
}

if (require.main === module) {
    runDemo().catch((error) => {
        console.error("Demo failed:", error.message);
        process.exitCode = 1;
    });
}

module.exports = {
    runDemo,
    runApiKeyDemo,
    runSwitchAuthDemo,
    runTokenRefreshDemo
};
