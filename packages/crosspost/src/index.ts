import { CrosspostClient } from "@crosspost/sdk";
import { Platform } from "@crosspost/types";
import type { ActionArgs, DistributorPlugin } from "@curatedotfun/types";
import * as near from "near-api-js";
import {
  type KeyPairString,
} from '@near-js/crypto';
import { sha256 } from '@noble/hashes/sha2';
import { generateNonce, NearAuthData, uint8ArrayToBase64 } from "near-sign-verify";
import * as borsh from "borsh";

interface CrosspostConfig {
  keyPair: string;
  [key: string]: string | undefined;
}

export default class CrosspostPlugin
  implements DistributorPlugin<string, CrosspostConfig> {
  readonly type = "distributor" as const;
  private config: CrosspostConfig | null = null;
  private client: CrosspostClient | null = null;

  async initialize(config?: CrosspostConfig): Promise<void> {
    if (!config) {
      throw new Error("Crosspost plugin requires configuration.");
    }

    if (!config.keyPair) {
      throw new Error("Crosspost plugin requires access key.");
    }

    this.client = new CrosspostClient({
      baseUrl: "https://open-crosspost-proxy.deno.dev"
    });
    this.config = config;
  }

  async distribute({
    input
  }: ActionArgs<string, CrosspostConfig>): Promise<void> {
    console.log("input", input);
    if (!this.config) {
      throw new Error("Crosspost plugin requires configuration.");
    }

    if (!this.client) {
      throw new Error("Crosspost plugin must be intiailized.")
    }

    const message = "Post";
    const nonce = generateNonce();
    const recipient = "crosspost.near";
    const accountId = this.config.accountId;
    let authData: NearAuthData;

    try {
      const signer = near.KeyPair.fromString(this.config.keyPair as KeyPairString);
      
      // Create the payload with the same structure as in verifySignature
      const TAG = 2147484061; // Same TAG value used in the backend
      
      const payload = {
        tag: TAG,
        message,
        nonce: Array.from(nonce),
        receiver: recipient,
        callback_url: null,
      };
      
      // Use the same Borsh schema as in serializePayload
      const schema = {
        struct: {
          tag: "u32",
          message: "string",
          nonce: { array: { type: "u8", len: 32 } },
          receiver: "string",
          callback_url: { option: "string" },
        },
      };
      
      // Serialize the payload
      const serializedPayload = borsh.serialize(schema, payload);
      
      // Hash the serialized payload
      const payloadHash = new Uint8Array(sha256(serializedPayload));
      
      // Sign the hashed payload
      const signedMessage = signer.sign(payloadHash);
      
      authData = {
        message,
        nonce,
        recipient,
        callback_url: "",
        signature: uint8ArrayToBase64(signedMessage.signature),
        account_id: accountId,
        public_key: signedMessage.publicKey.toString(),
      };
    } catch (e) {
      console.log("Error creating auth token...", e)
      throw new Error("Error creating auth token.")
    }

    try {
      this.client.setAuthentication(authData);

      this.client.post.createPost({
        targets: [{
          platform: Platform.TWITTER,
          userId: "1603425135356157953"
        }],
        content: [{
          text: String(input)
        }]
      })

    } catch (e) {
      console.log("Error crossposting...", e)
      throw new Error("Error crossposting message.")
    }
  }
}
