const { createAuthProxy } = require("../services/authProxy");

async function fakeApiService(config) {
    console.log("API service received headers:", config.headers);

    return {
        status: 200,
        data: {
            message: "Request was accepted"
        }
    };
}

async function runApiKeyDemo() {
    console.log("Basic authentication proxy");

    const proxy = createAuthProxy({
        auth: {
            type: "apiKey",
            apiKey: "demo-api-key-123",
            headerName: "x-api-key"
        },
        sendRequest: fakeApiService
    });

    const response = await proxy.request({
        method: "GET",
        url: "https://api.example.com/weather"
    });

    console.log("Response:", response.data);
}

async function runSwitchAuthDemo() {
    console.log("\nSwitching authentication strategies");

    const proxy = createAuthProxy({
        auth: {
            type: "jwt",
            token: "demo-jwt-token"
        },
        sendRequest: fakeApiService,
        rateLimitMs: 500
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

async function runDemo() {
    await runApiKeyDemo();
    await runSwitchAuthDemo();
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
    runSwitchAuthDemo
};
