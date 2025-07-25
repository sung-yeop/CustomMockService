export declare class CustomMockServer {
    private static getMockMapping;
    private static postMockMapping;
    private static patchMockMapping;
    private static deleteMockMapping;
    private static isDevRun;
    static print(): void;
    static run(isDevRun?: boolean): void;
    private static validate;
    static get({ endPoint, params, returnData, }: {
        endPoint: string;
        params?: any;
        returnData: any;
    }): void;
    static post({ endPoint, requestBody, returnData, }: {
        endPoint: string;
        requestBody?: any;
        returnData?: any;
    }): void;
    static patch({ endPoint, requestBody, returnData, }: {
        endPoint: string;
        requestBody?: any;
        returnData?: any;
    }): void;
    static delete({ endPoint, requestBody, returnData, }: {
        endPoint: string;
        requestBody?: any;
        returnData?: any;
    }): void;
    static patchXHR(): void;
    static patchFetch(): void;
}
//# sourceMappingURL=MockServer.d.ts.map