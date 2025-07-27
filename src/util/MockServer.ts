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

    if (this.isDevRun) {
      const result = process.env.NODE_ENV === "development";
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

      let httpMethod: string;
      let requestUrl: string;
      let urlParams: URLSearchParams;

      const originalOpen = xhr.open;
      xhr.open = function (
        m: string,
        u: string,
        async?: boolean,
        user?: string,
        password?: string
      ) {
        httpMethod = m;
        requestUrl = u;
        urlParams = new URLSearchParams(new URL(u).search);

        return originalOpen.call(this, m, u, async || true, user, password);
      };

      const originalSend = xhr.send;
      xhr.send = function (body?: any) {
        const requestBody = body; // 나중에 생각
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

  private static findMockData(httpMethod: string, requestUrl: string) {
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

  private static returnMockResponse = (xhr: XMLHttpRequest, mockData: any) => {
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

      const readystateEvent = new Event("readystatechange");
      if (xhr.onreadystatechange)
        xhr.onreadystatechange.call(xhr, readystateEvent);

      const loadEvent = new ProgressEvent("load");
      if (xhr.onload) xhr.onload.call(xhr, loadEvent);

      const loadendEvent = new ProgressEvent("loadend");
      if (xhr.onloadend) xhr.onloadend.call(xhr, loadendEvent);

      console.log("Mock 응답 완료");
    }, 50);
  };
}
