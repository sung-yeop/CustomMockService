interface MockHistoryEntry {
    id: string;
    timestamp: number;
    method: string;
    url: string;
    requestBody?: any;
    requestHeaders?: Record<string, string>;
    status: number;
    statusText: string;
    responseBody: any;
    responseHeaders?: Record<string, string>;
    duration: number;
}
export declare class CustomMockService {
    private static getMockMapping;
    private static postMockMapping;
    private static patchMockMapping;
    private static deleteMockMapping;
    private static history;
    private static isDevRun;
    private static getStatusText;
    static print(): void;
    static getHistory(): MockHistoryEntry[];
    static clearHistory(): void;
    private static addToHistory;
    static run(isDevRun?: boolean): void;
    private static validate;
    static get({ endPoint, status, params, response, }: {
        endPoint: string;
        status?: number;
        params?: any;
        response: any;
    }): void;
    static post({ endPoint, status, request, response, }: {
        endPoint: string;
        status?: number;
        request?: any;
        response: any;
    }): void;
    static patch({ endPoint, status, request, response, }: {
        endPoint: string;
        status?: number;
        request?: any;
        response: any;
    }): void;
    static delete({ endPoint, status, request, response, }: {
        endPoint: string;
        status?: number;
        request?: any;
        response?: any;
    }): void;
    static patchXHR(): void;
    static patchFetch(): void;
    private static findMockData;
    private static returnMockResponse;
}
export {};
//# sourceMappingURL=CustomMockService.d.ts.map