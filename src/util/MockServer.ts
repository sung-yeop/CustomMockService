export class CustomMockServer {
  private static getMockMapping = new Map<string, any>();

  static print() {
    console.log(this.getMockMapping);
  }

  run() {
    this.patchFetch();
    this.patchXHR();
    console.log("CustomMockServer is Running");
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
    this.getMockMapping.set(`GET:${endpoint}`, { params, returnData });
  }

  patchXHR() {
    const originalXHR = window.XMLHttpRequest;
  }

  patchFetch() {
    const originalFetch = window.fetch;
  }
}
