export interface FacilitatorConfig {
    tonRpcUrl: string;
    tonApiKey?: string;
    timeoutMs?: number;
}
export declare function createVerifyHandler(config: FacilitatorConfig): (request: Request) => Promise<Response>;
export declare function createSettleHandler(config: FacilitatorConfig): (request: Request) => Promise<Response>;
//# sourceMappingURL=handler.d.ts.map