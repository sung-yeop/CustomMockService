'use strict';

var jsxRuntime = require('react/jsx-runtime');
var react = require('react');

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

const styles = {
    panel: {
        position: "fixed",
        bottom: 0,
        right: 0,
        width: "100%",
        maxWidth: "500px",
        height: "400px",
        background: "#1a1a1a",
        border: "1px solid #333",
        borderRadius: "8px 8px 0 0",
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.3)",
        fontFamily: '"Monaco", "Menlo", "Ubuntu Mono", monospace',
        fontSize: "12px",
        zIndex: 999999,
        transition: "transform 0.3s ease",
        boxSizing: "border-box",
    },
    panelCollapsed: {
        transform: "translateY(calc(100% - 40px))",
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        background: "#2d2d2d",
        borderBottom: "1px solid #444",
        borderRadius: "8px 8px 0 0",
        cursor: "pointer",
        userSelect: "none",
    },
    titleContainer: {
        display: "flex",
        alignItems: "center",
    },
    title: {
        color: "#00d4aa",
        fontWeight: "bold",
        fontSize: "13px",
    },
    badge: {
        background: "#ff6b6b",
        color: "white",
        padding: "2px 6px",
        borderRadius: "10px",
        fontSize: "10px",
        marginLeft: "8px",
    },
    controls: {
        display: "flex",
        gap: "8px",
    },
    btn: {
        background: "#444",
        border: "none",
        color: "#ccc",
        padding: "4px 8px",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "11px",
        transition: "background 0.2s",
    },
    btnClear: {
        background: "#ff6b6b",
        color: "white",
    },
    btnToggle: {
        background: "#00d4aa",
        color: "white",
    },
    content: {
        height: "calc(100% - 40px)",
        overflowY: "auto",
        background: "#1a1a1a",
    },
    empty: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        color: "#666",
        fontStyle: "italic",
    },
    requestList: {
        padding: 0,
        margin: 0,
        listStyle: "none",
    },
    requestItem: {
        borderBottom: "1px solid #333",
        padding: "8px 12px",
        cursor: "pointer",
        transition: "background 0.2s",
    },
    requestItemSelected: {
        background: "#2a3f5f",
    },
    requestHeader: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "4px",
    },
    method: {
        padding: "2px 6px",
        borderRadius: "3px",
        fontWeight: "bold",
        fontSize: "10px",
        textTransform: "uppercase",
        color: "white",
    },
    methodGET: { background: "#61affe" },
    methodPOST: { background: "#49cc90" },
    methodPUT: { background: "#fca130" },
    methodDELETE: { background: "#f93e3e" },
    methodPATCH: { background: "#50e3c2" },
    status: {
        padding: "2px 6px",
        borderRadius: "3px",
        fontWeight: "bold",
        fontSize: "10px",
    },
    statusSuccess: { background: "#28a745", color: "white" },
    statusError: { background: "#dc3545", color: "white" },
    statusRedirect: { background: "#ffc107", color: "black" },
    url: {
        color: "#ccc",
        fontSize: "11px",
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    time: {
        color: "#888",
        fontSize: "10px",
    },
    meta: {
        display: "flex",
        gap: "12px",
        color: "#888",
        fontSize: "10px",
    },
    duration: {
        color: "#00d4aa",
    },
    details: {
        padding: "12px",
        background: "#222",
        borderTop: "1px solid #444",
        maxHeight: "200px",
        overflowY: "auto",
    },
    tabs: {
        display: "flex",
        gap: "8px",
        marginBottom: "12px",
        borderBottom: "1px solid #444",
    },
    tab: {
        background: "none",
        border: "none",
        color: "#888",
        padding: "6px 12px",
        cursor: "pointer",
        borderBottom: "2px solid transparent",
        fontSize: "11px",
        transition: "all 0.2s",
    },
    tabActive: {
        color: "#00d4aa",
        borderBottomColor: "#00d4aa",
    },
    detailContent: {
        color: "#ccc",
    },
    json: {
        background: "#1a1a1a",
        padding: "8px",
        borderRadius: "4px",
        border: "1px solid #333",
        fontFamily: '"Monaco", "Menlo", "Ubuntu Mono", monospace',
        fontSize: "11px",
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
        maxHeight: "150px",
        overflowY: "auto",
    },
};
const MockNetwork = () => {
    const [isCollapsed, setIsCollapsed] = react.useState(false);
    const [history, setHistory] = react.useState([]);
    const [selectedRequest, setSelectedRequest] = react.useState(null);
    const [activeTab, setActiveTab] = react.useState("response");
    react.useEffect(() => {
        const interval = setInterval(() => {
            const currentHistory = CustomMockService.getHistory();
            setHistory(currentHistory);
        }, 100);
        return () => clearInterval(interval);
    }, []);
    const handleClear = () => {
        CustomMockService.clearHistory();
        setHistory([]);
        setSelectedRequest(null);
    };
    const handleToggle = () => {
        setIsCollapsed(!isCollapsed);
    };
    const handleRequestClick = (request) => {
        setSelectedRequest(selectedRequest?.id === request.id ? null : request);
    };
    const getStatusStyle = (status) => {
        if (status >= 200 && status < 300)
            return { ...styles.status, ...styles.statusSuccess };
        if (status >= 300 && status < 400)
            return { ...styles.status, ...styles.statusRedirect };
        return { ...styles.status, ...styles.statusError };
    };
    const getMethodStyle = (method) => {
        const methodKey = `method${method}`;
        return { ...styles.method, ...(styles[methodKey] || {}) };
    };
    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString();
    };
    const formatJson = (obj) => {
        try {
            return JSON.stringify(obj, null, 2);
        }
        catch {
            return String(obj);
        }
    };
    return (jsxRuntime.jsxs("div", { style: {
            ...styles.panel,
            ...(isCollapsed ? styles.panelCollapsed : {}),
        }, children: [jsxRuntime.jsxs("div", { style: styles.header, onClick: handleToggle, children: [jsxRuntime.jsxs("div", { style: styles.titleContainer, children: [jsxRuntime.jsx("span", { style: styles.title, children: "Mock Network" }), history.length > 0 && (jsxRuntime.jsx("span", { style: styles.badge, children: history.length }))] }), jsxRuntime.jsxs("div", { style: styles.controls, onClick: (e) => e.stopPropagation(), children: [jsxRuntime.jsx("button", { style: { ...styles.btn, ...styles.btnClear }, onClick: handleClear, children: "Clear" }), jsxRuntime.jsx("button", { style: { ...styles.btn, ...styles.btnToggle }, children: isCollapsed ? "▲" : "▼" })] })] }), jsxRuntime.jsx("div", { style: styles.content, children: history.length === 0 ? (jsxRuntime.jsx("div", { style: styles.empty, children: "No mock requests yet" })) : (jsxRuntime.jsx("ul", { style: styles.requestList, children: history.map((request) => (jsxRuntime.jsxs("li", { children: [jsxRuntime.jsxs("div", { style: {
                                    ...styles.requestItem,
                                    ...(selectedRequest?.id === request.id
                                        ? styles.requestItemSelected
                                        : {}),
                                    ...(selectedRequest?.id !== request.id
                                        ? { ":hover": { background: "#252525" } }
                                        : {}),
                                }, onClick: () => handleRequestClick(request), onMouseEnter: (e) => {
                                    if (selectedRequest?.id !== request.id) {
                                        e.currentTarget.style.background = "#252525";
                                    }
                                }, onMouseLeave: (e) => {
                                    if (selectedRequest?.id !== request.id) {
                                        e.currentTarget.style.background = "transparent";
                                    }
                                }, children: [jsxRuntime.jsxs("div", { style: styles.requestHeader, children: [jsxRuntime.jsx("span", { style: getMethodStyle(request.method), children: request.method }), jsxRuntime.jsx("span", { style: getStatusStyle(request.status), children: request.status }), jsxRuntime.jsx("span", { style: styles.url, children: request.url }), jsxRuntime.jsx("span", { style: styles.time, children: formatTime(request.timestamp) })] }), jsxRuntime.jsxs("div", { style: styles.meta, children: [jsxRuntime.jsxs("span", { style: styles.duration, children: [request.duration, "ms"] }), jsxRuntime.jsx("span", { children: request.statusText })] })] }), selectedRequest?.id === request.id && (jsxRuntime.jsxs("div", { style: styles.details, children: [jsxRuntime.jsxs("div", { style: styles.tabs, children: [jsxRuntime.jsx("button", { style: {
                                                    ...styles.tab,
                                                    ...(activeTab === "response" ? styles.tabActive : {}),
                                                }, onClick: () => setActiveTab("response"), children: "Response" }), jsxRuntime.jsx("button", { style: {
                                                    ...styles.tab,
                                                    ...(activeTab === "request" ? styles.tabActive : {}),
                                                }, onClick: () => setActiveTab("request"), children: "Request" }), jsxRuntime.jsx("button", { style: {
                                                    ...styles.tab,
                                                    ...(activeTab === "headers" ? styles.tabActive : {}),
                                                }, onClick: () => setActiveTab("headers"), children: "Headers" })] }), jsxRuntime.jsxs("div", { style: styles.detailContent, children: [activeTab === "response" && (jsxRuntime.jsx("div", { style: styles.json, children: formatJson(request.responseBody) })), activeTab === "request" && (jsxRuntime.jsx("div", { style: styles.json, children: request.requestBody
                                                    ? formatJson(request.requestBody)
                                                    : "No request body" })), activeTab === "headers" && (jsxRuntime.jsx("div", { style: styles.json, children: formatJson({
                                                    request: request.requestHeaders || {},
                                                    response: request.responseHeaders || {},
                                                }) }))] })] }))] }, request.id))) })) })] }));
};

exports.CustomMockService = CustomMockService;
exports.MockNetwork = MockNetwork;
//# sourceMappingURL=index.js.map
