import { TonClient } from "@ton/ton";
import { verifyBoc } from "./verify.js";
import { settleBoc } from "./settle.js";
function createClient(config) {
    return new TonClient({
        endpoint: config.tonRpcUrl,
        apiKey: config.tonApiKey,
    });
}
export function createVerifyHandler(config) {
    return async (request) => {
        try {
            const body = (await request.json());
            if (!body.paymentPayload || !body.paymentDetails) {
                return Response.json({ valid: false, reason: "Missing paymentPayload or paymentDetails" }, { status: 400 });
            }
            const client = createClient(config);
            const result = await verifyBoc(body.paymentPayload, body.paymentDetails, client);
            return Response.json(result);
        }
        catch (err) {
            return Response.json({ valid: false, reason: `Server error: ${err.message}` }, { status: 500 });
        }
    };
}
export function createSettleHandler(config) {
    const client = createClient(config);
    return async (request) => {
        try {
            const body = (await request.json());
            if (!body.paymentPayload || !body.paymentDetails) {
                return Response.json({ success: false, error: "Missing paymentPayload or paymentDetails" }, { status: 400 });
            }
            // Verify locally before broadcasting
            const verifyResult = await verifyBoc(body.paymentPayload, body.paymentDetails, client);
            if (!verifyResult.valid) {
                return Response.json({ success: false, error: `Pre-settle verification failed: ${verifyResult.reason}` }, { status: 400 });
            }
            const settleOptions = {
                client,
                timeoutMs: config.timeoutMs ?? 60_000,
            };
            const result = await settleBoc(body.paymentPayload, body.paymentDetails, settleOptions);
            const status = result.success ? 200 : 500;
            return Response.json(result, { status });
        }
        catch (err) {
            return Response.json({ success: false, error: `Server error: ${err.message}` }, { status: 500 });
        }
    };
}
//# sourceMappingURL=handler.js.map