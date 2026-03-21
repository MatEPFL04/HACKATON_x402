import { type SettlementResponse } from "@ton-x402/core";
import { internal, Address } from "@ton/core";
import { WalletContractV4, WalletContractV5R1, TonClient } from "@ton/ton";
import type { KeyPair } from "@ton/crypto";
type WalletContract = WalletContractV4 | WalletContractV5R1 | {
    createTransfer(args: {
        seqno: number;
        secretKey: Buffer;
        messages: ReturnType<typeof internal>[];
        sendMode: number;
    }): unknown;
    address: Address;
};
export interface X402ClientConfig {
    wallet: WalletContract;
    keypair: KeyPair;
    seqno?: number;
    client?: TonClient;
    amount?: string;
    payTo?: string;
    verbose?: boolean;
}
export interface X402FetchResult {
    response: Response;
    settlement?: SettlementResponse;
    paid: boolean;
}
/**
 * Wraps native fetch to handle x402 payment flow transparently.
 *
 * 1. Makes the initial request
 * 2. If 402 → reads PAYMENT-REQUIRED, signs BOC, retries with PAYMENT-SIGNATURE
 * 3. Returns the final response with settlement info
 *
 * Pass `verbose: true` in config to log the full HTTP + payment flow.
 * The client NEVER broadcasts — the signed BOC goes to the facilitator.
 */
export declare function x402Fetch(url: string | URL, config: X402ClientConfig, init?: RequestInit): Promise<X402FetchResult>;
export default x402Fetch;
//# sourceMappingURL=index.d.ts.map