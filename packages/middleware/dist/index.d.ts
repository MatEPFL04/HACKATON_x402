import { type PaymentConfig } from "@ton-x402/core";
export type RouteHandler = (request: Request) => Response | Promise<Response>;
export interface PaymentGateOptions {
    config: PaymentConfig;
    description?: string;
}
export declare function paymentGate(handler: RouteHandler, options: PaymentGateOptions): RouteHandler;
export { type PaymentConfig } from "@ton-x402/core";
//# sourceMappingURL=index.d.ts.map