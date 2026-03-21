import { type PaymentPayload, type PaymentDetails, type SettleResponse } from "@ton-x402/core";
import { TonClient } from "@ton/ton";
export interface SettleOptions {
    client: TonClient;
    timeoutMs?: number;
    pollIntervalMs?: number;
}
export declare function settleBoc(paymentPayload: PaymentPayload, paymentDetails: PaymentDetails, options: SettleOptions): Promise<SettleResponse>;
//# sourceMappingURL=settle.d.ts.map