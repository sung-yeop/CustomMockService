'use strict';

class CustomMockServer {
    static print() {
        console.log(this.getMockMapping);
    }
    static run(isDevRun = true) {
        CustomMockServer.isDevRun = isDevRun;
        if (!CustomMockServer.validate()) {
            console.log("MockServer: 현재 환경에서는 실행되지 않습니다");
            return;
        }
        this.patchFetch();
        this.patchXHR();
        console.log("CustomMockServer is Running");
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
    static get({ endPoint, params = null, response, }) {
        this.getMockMapping.set(`${endPoint}`, { params, response });
    }
    static post({ endPoint, request = null, response, }) {
        this.postMockMapping.set(`${endPoint}`, { request, response });
    }
    static patch({ endPoint, request = null, response, }) {
        this.patchMockMapping.set(`${endPoint}`, { request, response });
    }
    static delete({ endPoint, request = null, response, }) {
        this.deleteMockMapping.set(`${endPoint}`, { request, response });
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
                const mockData = CustomMockServer.findMockData(httpMethod, requestUrl);
                if (mockData) {
                    console.log("Mock 데이터 존재 O -> 가짜 응답 반환", mockData);
                    CustomMockServer.returnMockResponse(xhr, mockData);
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
                    mockData = CustomMockServer.getMockMapping.get(url);
                    break;
                case "POST":
                    mockData = CustomMockServer.postMockMapping.get(url);
                    break;
                case "PATCH":
                    mockData = CustomMockServer.patchMockMapping.get(url);
                    break;
                case "DELETE":
                    mockData = CustomMockServer.deleteMockMapping.get(url);
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
                mapping = CustomMockServer.getMockMapping.get(requestUrl);
                break;
            case "POST":
                mapping = CustomMockServer.postMockMapping.get(requestUrl);
                break;
            case "PATCH":
                mapping = CustomMockServer.patchMockMapping.get(requestUrl);
                break;
            case "DELETE":
                mapping = CustomMockServer.deleteMockMapping.get(requestUrl);
                break;
        }
        return mapping;
    }
}
CustomMockServer.getMockMapping = new Map();
CustomMockServer.postMockMapping = new Map();
CustomMockServer.patchMockMapping = new Map();
CustomMockServer.deleteMockMapping = new Map();
CustomMockServer.isDevRun = true;
CustomMockServer.returnMockResponse = (xhr, mockData) => {
    console.log("Mock 응답 시작 - xhr 상태:", {
        readyState: xhr.readyState,
        onreadystatechange: !!xhr.onreadystatechange,
        onload: !!xhr.onload,
    });
    setTimeout(() => {
        Object.defineProperty(xhr, "readyState", {
            value: 4,
            configurable: true,
        });
        Object.defineProperty(xhr, "status", { value: 200, configurable: true });
        Object.defineProperty(xhr, "statusText", {
            value: "OK",
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
        console.log("Mock 응답 설정 후:", {
            readyState: xhr.readyState,
            status: xhr.status,
            hasOnreadystatechange: !!xhr.onreadystatechange,
            hasOnload: !!xhr.onload,
        });
        if (xhr.onreadystatechange) {
            console.log("onreadystatechange 호출 중");
            xhr.onreadystatechange.call(xhr, new Event("readystatechange"));
        }
        else {
            console.warn("onreadystatechange 리스너가 없음");
        }
        if (xhr.onload) {
            console.log("onload 이벤트 호출 중");
            const progressEvent = new ProgressEvent("load", {
                lengthComputable: true,
                loaded: JSON.stringify(mockData.response).length,
                total: JSON.stringify(mockData.response).length,
            });
            xhr.onload.call(xhr, progressEvent);
        }
        else {
            console.warn("onload 리스너가 없음");
        }
    }, 50);
};

exports.CustomMockServer = CustomMockServer;
//# sourceMappingURL=index.js.map
