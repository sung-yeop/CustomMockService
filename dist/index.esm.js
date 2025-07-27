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
    }
    static validate() {
        if (typeof window === "undefined") {
            return false;
        }
        const isElectron = !!window.electronAPI ||
            typeof window.require === "function" ||
            navigator.userAgent.toLowerCase().indexOf("electron") > -1;
        if (this.isDevRun) {
            return process.env.NODE_ENV === "development" || isElectron;
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
            let method;
            let url;
            const originalOpen = xhr.open;
            xhr.open = function (m, u, async, user, password) {
                method = m;
                url = u;
                console.log(`XHR Open: ${method} ${url}`);
                return originalOpen.call(this, m, u, async || true, user, password);
            };
            const originalSend = xhr.send;
            xhr.send = function (body) {
                console.log(`XHR Send: ${method} ${url}`);
                console.log("Request Body:", body);
                let response;
                switch (method) {
                    case "GET":
                        response = CustomMockServer.getMockMapping.get(url);
                        break;
                    case "POST":
                        response = CustomMockServer.postMockMapping.get(url);
                        break;
                    case "PATCH":
                        response = CustomMockServer.patchMockMapping.get(url);
                        break;
                    case "DELETE":
                        response = CustomMockServer.deleteMockMapping.get(url);
                        break;
                }
                if (response) {
                    console.log("Mock 데이터 존재 O -> 가짜 응답 반환");
                    return originalSend.call(this, response);
                }
                console.log("Mock 데이터 X -> 실제 요청 진행");
                return originalSend.call(this, body);
            };
            return xhr;
        };
    }
    static patchFetch() {
    }
}
CustomMockServer.getMockMapping = new Map();
CustomMockServer.postMockMapping = new Map();
CustomMockServer.patchMockMapping = new Map();
CustomMockServer.deleteMockMapping = new Map();
CustomMockServer.isDevRun = true;

export { CustomMockServer };
//# sourceMappingURL=index.esm.js.map
