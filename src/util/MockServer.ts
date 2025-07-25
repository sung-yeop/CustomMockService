export class CustomMockServer {
  private static getMockMapping = new Map<string, any>();
  private static isDevRun = true;

  static print() {
    console.log(this.getMockMapping);
  }

  run(isDevRun: boolean = true) {
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
    if (this.isDevRun) {
      return process.env.NODE_ENV === "development";
    }
    return true;
  }

  static get({
    endpoint,
    params,
    returnData,
  }: {
    endpoint: string;
    params?: any;
    returnData: any;
  }) {
    this.getMockMapping.set(`${endpoint}`, { params, returnData });
  }

  patchXHR() {
    const originalXHR = window.XMLHttpRequest;
  }

  patchFetch() {
    const originalFetch = window.fetch;
  }
}
