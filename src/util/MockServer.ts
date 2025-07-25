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
  }

  private static validate(): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    if (this.isDevRun) {
      return process.env.NODE_ENV === "development";
    }
    return true;
  }

  static get({
    endPoint,
    params,
    returnData,
  }: {
    endPoint: string;
    params?: any;
    returnData: any;
  }) {
    this.getMockMapping.set(`${endPoint}`, { params, returnData });
  }

  static post({
    endPoint,
    requestBody,
    returnData,
  }: {
    endPoint: string;
    requestBody?: any;
    returnData?: any;
  }) {
    this.postMockMapping.set(`${endPoint}`, { requestBody, returnData });
  }

  static patch({
    endPoint,
    requestBody,
    returnData,
  }: {
    endPoint: string;
    requestBody?: any;
    returnData?: any;
  }) {
    this.patchMockMapping.set(`${endPoint}`, { requestBody, returnData });
  }

  static delete({
    endPoint,
    requestBody,
    returnData,
  }: {
    endPoint: string;
    requestBody?: any;
    returnData?: any;
  }) {
    this.deleteMockMapping.set(`${endPoint}`, { requestBody, returnData });
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
        let returnData;

        switch (method) {
          case "GET":
            returnData = CustomMockServer.getMockMapping.get(url);
            break;
          case "POST":
            returnData = CustomMockServer.postMockMapping.get(url);
            break;
          case "PATCH":
            returnData = CustomMockServer.patchMockMapping.get(url);
            break;
          case "DELETE":
            returnData = CustomMockServer.deleteMockMapping.get(url);
            break;
        }

        if (returnData) {
          console.log("Mock 데이터 존재 O -> 가짜 응답 반환");
          return originalSend.call(this, returnData);
        }

        console.log("Mock 데이터 X -> 실제 요청 진행");
        return originalSend.call(this, body);
      };

      return xhr;
    };
  }

  static patchFetch() {
    const originalFetch = window.fetch;
  }
}
