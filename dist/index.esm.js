class CustomMockService {
    static getStatusText(statusCode) {
        const statusMap = {
            200: "OK",
            201: "Created",
            204: "No Content",
            301: "Moved Permanently",
            302: "Found",
            304: "Not Modified",
            400: "Bad Request",
            401: "Unauthorized",
            403: "Forbidden",
            404: "Not Found",
            409: "Conflict",
            422: "Unprocessable Entity",
            500: "Internal Server Error",
            502: "Bad Gateway",
            503: "Service Unavailable",
        };
        return statusMap[statusCode] || "Unknown";
    }
    static print() {
        console.log(this.getMockMapping);
    }
    static getHistory() {
        return [...this.history];
    }
    static clearHistory() {
        this.history = [];
    }
    static addToHistory(method, url, requestBody, mockData, startTime) {
        const entry = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            method,
            url,
            requestBody,
            status: mockData.status,
            statusText: this.getStatusText(mockData.status),
            responseBody: mockData.response,
            duration: Date.now() - startTime,
        };
        this.history.unshift(entry);
        if (this.history.length > 100) {
            this.history = this.history.slice(0, 100);
        }
    }
    static run(isDevRun = true) {
        CustomMockService.isDevRun = isDevRun;
        if (!CustomMockService.validate()) {
            console.log("MockServer: 현재 환경에서는 실행되지 않습니다");
            return;
        }
        this.patchFetch();
        this.patchXHR();
        console.log("CustomMockService is Running");
        console.log("등록된 Mock 데이터:", {
            GET: Array.from(this.getMockMapping.keys()),
            POST: Array.from(this.postMockMapping.keys()),
            PATCH: Array.from(this.patchMockMapping.keys()),
            DELETE: Array.from(this.deleteMockMapping.keys()),
        });
    }
    static validate() {
        if (typeof window === "undefined") {
            console.log("MockServer 검증 실패: window가 정의되지 않음");
            return false;
        }
        if (this.isDevRun) {
            const result = process.env.NODE_ENV === "development";
            console.log("검증 결과:", result);
            return result;
        }
        return true;
    }
    static get({ endPoint, status = 200, params = null, response, }) {
        this.getMockMapping.set(`${endPoint}`, {
            status,
            request: params,
            response,
        });
    }
    static post({ endPoint, status = 200, request = null, response, }) {
        this.postMockMapping.set(`${endPoint}`, { status, request, response });
    }
    static patch({ endPoint, status = 200, request = null, response, }) {
        this.patchMockMapping.set(`${endPoint}`, { status, request, response });
    }
    static delete({ endPoint, status = 200, request = null, response, }) {
        this.deleteMockMapping.set(`${endPoint}`, { status, request, response });
    }
    static patchXHR() {
        const OriginalXHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function () {
            const xhr = new OriginalXHR();
            let httpMethod;
            let requestUrl;
            const originalOpen = xhr.open;
            xhr.open = function (m, u, async, user, password) {
                httpMethod = m;
                requestUrl = u;
                new URLSearchParams(new URL(u).search);
                return originalOpen.call(this, m, u, async || true, user, password);
            };
            const originalSend = xhr.send;
            xhr.send = function (body) {
                const startTime = Date.now();
                const requestBody = body;
                const mockData = CustomMockService.findMockData(httpMethod, requestUrl);
                if (mockData) {
                    console.log("Mock 데이터 존재 O -> 가짜 응답 반환", mockData);
                    CustomMockService.addToHistory(httpMethod, requestUrl, requestBody, mockData, startTime);
                    CustomMockService.returnMockResponse(xhr, mockData);
                    return;
                }
                console.log("Mock 데이터 X -> 실제 요청 진행");
                return originalSend.call(this, body);
            };
            return xhr;
        };
    }
    static patchFetch() {
        const originalFetch = window.fetch;
        window.fetch = async function (input, init) {
            const url = typeof input === "string"
                ? input
                : input instanceof URL
                    ? input.href
                    : input.url;
            const method = init?.method?.toUpperCase() || "GET";
            console.log(`Fetch: ${method} ${url}`);
            let mockData;
            switch (method) {
                case "GET":
                    mockData = CustomMockService.getMockMapping.get(url);
                    break;
                case "POST":
                    mockData = CustomMockService.postMockMapping.get(url);
                    break;
                case "PATCH":
                    mockData = CustomMockService.patchMockMapping.get(url);
                    break;
                case "DELETE":
                    mockData = CustomMockService.deleteMockMapping.get(url);
                    break;
            }
            if (mockData) {
                console.log("Mock 데이터 존재 O -> 가짜 응답 반환", mockData);
                return new Response(JSON.stringify(mockData.response), {
                    status: 200,
                    statusText: "OK",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
            }
            console.log("Mock 데이터 X -> 실제 요청 진행");
            return originalFetch.call(window, input, init);
        };
    }
    static findMockData(httpMethod, requestUrl) {
        let mapping;
        switch (httpMethod) {
            case "GET":
                mapping = CustomMockService.getMockMapping.get(requestUrl);
                break;
            case "POST":
                mapping = CustomMockService.postMockMapping.get(requestUrl);
                break;
            case "PATCH":
                mapping = CustomMockService.patchMockMapping.get(requestUrl);
                break;
            case "DELETE":
                mapping = CustomMockService.deleteMockMapping.get(requestUrl);
                break;
        }
        return mapping;
    }
}
CustomMockService.getMockMapping = new Map();
CustomMockService.postMockMapping = new Map();
CustomMockService.patchMockMapping = new Map();
CustomMockService.deleteMockMapping = new Map();
CustomMockService.history = [];
CustomMockService.isDevRun = true;
CustomMockService.returnMockResponse = (xhr, mockData) => {
    setTimeout(() => {
        Object.defineProperty(xhr, "readyState", {
            value: 4,
            configurable: true,
        });
        Object.defineProperty(xhr, "status", {
            value: mockData.status,
            configurable: true,
        });
        Object.defineProperty(xhr, "statusText", {
            value: CustomMockService.getStatusText(mockData.status),
            configurable: true,
        });
        Object.defineProperty(xhr, "responseText", {
            value: JSON.stringify(mockData.response),
            configurable: true,
        });
        Object.defineProperty(xhr, "response", {
            value: JSON.stringify(mockData.response),
            configurable: true,
        });
        const readystateEvent = new Event("readystatechange");
        if (xhr.onreadystatechange)
            xhr.onreadystatechange.call(xhr, readystateEvent);
        const loadEvent = new ProgressEvent("load");
        if (xhr.onload)
            xhr.onload.call(xhr, loadEvent);
        const loadendEvent = new ProgressEvent("loadend");
        if (xhr.onloadend)
            xhr.onloadend.call(xhr, loadendEvent);
    }, 50);
};

export { CustomMockService };
//# sourceMappingURL=index.esm.js.map
