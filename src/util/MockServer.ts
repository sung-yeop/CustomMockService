export class CustomMockServer {
  private static getMockMapping = new Map<string, any>();
  private static postMockMapping = new Map<string, any>();
  private static patchMockMapping = new Map<string, any>();
  private static deleteMockMapping = new Map<string, any>();
  private static isDevRun = true;

  static print() {
    console.log(this.getMockMapping);
  }

  static run(isDevRun: boolean = true) {
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

  private static validate(): boolean {
    if (typeof window === "undefined") {
      console.log("MockServer 검증 실패: window가 정의되지 않음");
      return false;
    }

    const isElectron =
      !!(window as any).electronAPI ||
      typeof (window as any).require === "function" ||
      navigator.userAgent.toLowerCase().indexOf("electron") > -1;

    console.log("MockServer 환경 검증:", {
      isDevRun: this.isDevRun,
      NODE_ENV: process.env.NODE_ENV,
      isElectron: isElectron,
      userAgent: navigator.userAgent,
    });

    if (this.isDevRun) {
      const result = process.env.NODE_ENV === "development" || isElectron;
      console.log("검증 결과:", result);
      return result;
    }
    return true;
  }

  static get({
    endPoint,
    params = null,
    response,
  }: {
    endPoint: string;
    params?: any;
    response: any;
  }) {
    this.getMockMapping.set(`${endPoint}`, { params, response });
  }

  static post({
    endPoint,
    request = null,
    response,
  }: {
    endPoint: string;
    request?: any;
    response: any;
  }) {
    this.postMockMapping.set(`${endPoint}`, { request, response });
  }

  static patch({
    endPoint,
    request = null,
    response,
  }: {
    endPoint: string;
    request?: any;
    response: any;
  }) {
    this.patchMockMapping.set(`${endPoint}`, { request, response });
  }

  static delete({
    endPoint,
    request = null,
    response,
  }: {
    endPoint: string;
    request?: any;
    response?: any;
  }) {
    this.deleteMockMapping.set(`${endPoint}`, { request, response });
  }

  static patchXHR() {
    const OriginalXHR = window.XMLHttpRequest;
    (window.XMLHttpRequest as any) = function () {
      const xhr = new OriginalXHR();

      let method: string;
      let url: string;

      const originalOpen = xhr.open;
      xhr.open = function (
        m: string,
        u: string,
        async?: boolean,
        user?: string,
        password?: string
      ) {
        method = m;
        url = u;
        console.log(`XHR Open: ${method} ${url}`);

        return originalOpen.call(this, m, u, async || true, user, password);
      };

      const originalSend = xhr.send;
      xhr.send = function (body?: any) {
        console.log(`XHR Send: ${method} ${url}`);
        console.log("Request Body:", body);
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

          setTimeout(() => {
            Object.defineProperty(xhr, "readyState", {
              value: 4,
              writable: false,
            });
            Object.defineProperty(xhr, "status", {
              value: 200,
              writable: false,
            });
            Object.defineProperty(xhr, "statusText", {
              value: "OK",
              writable: false,
            });
            Object.defineProperty(xhr, "responseText", {
              value: JSON.stringify(mockData.response),
              writable: false,
            });
            Object.defineProperty(xhr, "response", {
              value: JSON.stringify(mockData.response),
              writable: false,
            });

            if (xhr.onreadystatechange) {
              xhr.onreadystatechange.call(xhr, new Event("readystatechange"));
            }
            if (xhr.onload) {
              const progressEvent = new ProgressEvent("load", {
                lengthComputable: true,
                loaded: JSON.stringify(mockData.response).length,
                total: JSON.stringify(mockData.response).length,
              });
              xhr.onload.call(xhr, progressEvent);
            }
          }, 10);

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

    window.fetch = async function (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const url =
        typeof input === "string"
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
}
