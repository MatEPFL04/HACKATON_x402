import type { PaymentRequired, PaymentPayload, SettlementResponse } from "./types.js";
export declare function encodeHeader<T>(data: T): string;
export declare function decodeHeader<T>(header: string): T;
export declare function encodePaymentRequired(data: PaymentRequired): string;
export declare function decodePaymentRequired(header: string): PaymentRequired;
export declare function encodePaymentPayload(data: PaymentPayload): string;
export declare function decodePaymentPayload(header: string): PaymentPayload;
export declare function encodeSettlementResponse(data: SettlementResponse): string;
export declare function decodeSettlementResponse(header: string): SettlementResponse;
export declare const HEADER_PAYMENT_REQUIRED = "PAYMENT-REQUIRED";
export declare const HEADER_PAYMENT_SIGNATURE = "PAYMENT-SIGNATURE";
export declare const HEADER_PAYMENT_RESPONSE = "PAYMENT-RESPONSE";
export declare const ONE_TON = 1000000000n;
export declare function tonToNano(ton: number | string): string;
export declare function nanoToTon(nanoTon: string | bigint): string;
export declare function jettonToAtomic(amount: number | string, decimals: number): string;
export declare function atomicToJetton(atomicAmount: string | bigint, decimals: number): string;
export declare function generateQueryId(): string;
//# sourceMappingURL=utils.d.ts.map