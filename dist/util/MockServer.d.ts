export declare class CustomMockServer {
    private static getMockMapping;
    private static postMockMapping;
    private static patchMockMapping;
    private static deleteMockMapping;
    private static isDevRun;
    static print(): void;
    static run(isDevRun?: boolean): void;
    private static validate;
    static get({ endPoint, params, response, }: {
        endPoint: string;
        params?: any;
        response: any;
    }): void;
    static post({ endPoint, request, response, }: {
        endPoint: string;
        request?: any;
        response: any;
    }): void;
    static patch({ endPoint, request, response, }: {
        endPoint: string;
        request?: any;
        response: any;
    }): void;
    static delete({ endPoint, request, response, }: {
        endPoint: string;
        request?: any;
        response?: any;
    }): void;
    static patchXHR(): void;
    static patchFetch(): void;
    private static findMockData;
    private static returnMockResponse;
}
//# sourceMappingURL=MockServer.d.ts.map