import { CrosspostClient } from "@crosspost/sdk";
import {
  CreatePostRequestSchema,
  DeletePostRequestSchema,
  LikePostRequestSchema,
  QuotePostRequestSchema,
  ReplyToPostRequestSchema,
  RepostRequestSchema,
  UnlikePostRequestSchema,
} from "@crosspost/types";
import type { ActionArgs, DistributorPlugin } from "@curatedotfun/types";
import { type KeyPairString } from "@near-js/crypto";
import { sha256 } from "@noble/hashes/sha2";
import * as borsh from "borsh";
import * as near from "near-api-js";
import {
  generateNonce,
  NearAuthData,
  uint8ArrayToBase64,
} from "near-sign-verify";
import { z } from "zod";

// Define the allowed methods for the CrosspostPlugin
type CrosspostMethod =
  | "create"
  | "reply"
  | "delete"
  | "like"
  | "unlike"
  | "repost"
  | "quote";

interface CrosspostConfig {
  signerId: string;
  keyPair: string;
  method: CrosspostMethod;
  [key: string]: unknown | undefined;
}

export default class CrosspostPlugin
  implements DistributorPlugin<unknown, CrosspostConfig>
{
  readonly type = "distributor" as const;
  private config: CrosspostConfig | null = null;
  private client: CrosspostClient | null = null;

  // Map from config method name to actual client method name
  private readonly methodClientMap: Record<
    CrosspostMethod,
    keyof CrosspostClient["post"]
  > = {
    create: "createPost",
    reply: "replyToPost",
    delete: "deletePost",
    like: "likePost",
    unlike: "unlikePost",
    repost: "repost",
    quote: "quotePost",
  };

  async initialize(config?: CrosspostConfig): Promise<void> {
    if (!config) {
      throw new Error("Crosspost plugin requires configuration.");
    }

    if (!config.signerId) {
      throw new Error("Crosspost plugin requires signerId.");
    }

    if (!config.keyPair) {
      throw new Error("Crosspost plugin requires access key.");
    }

    if (!config.method) {
      throw new Error("Crosspost plugin requires 'method' in configuration.");
    }

    this.client = new CrosspostClient();

    const clientMethodName = this.methodClientMap[config.method];
    if (
      !clientMethodName ||
      typeof this.client.post[clientMethodName] !== "function"
    ) {
      throw new Error(`Unsupported or invalid method: ${config.method}`);
    }

    this.config = config;
  }

  async distribute({
    input,
  }: ActionArgs<unknown, CrosspostConfig>): Promise<void> {
    if (!this.config) {
      throw new Error("Crosspost plugin requires configuration.");
    }

    if (!this.client) {
      throw new Error("Crosspost plugin must be initialized.");
    }

    console.log("got input: ", input);

    const currentMethod = this.config.method;
    let validatedInput: any; // Will hold the sanitized input

    try {
      switch (currentMethod) {
        case "create":
          validatedInput = CreatePostRequestSchema.parse(input);
          break;
        case "reply":
          validatedInput = ReplyToPostRequestSchema.parse(input);
          break;
        case "delete":
          validatedInput = DeletePostRequestSchema.parse(input);
          break;
        case "like":
          validatedInput = LikePostRequestSchema.parse(input);
          break;
        case "unlike":
          validatedInput = UnlikePostRequestSchema.parse(input);
          break;
        case "repost":
          validatedInput = RepostRequestSchema.parse(input);
          break;
        case "quote":
          validatedInput = QuotePostRequestSchema.parse(input);
          break;
        default:
          throw new Error(
            `Schema validation not implemented for method: ${currentMethod}`,
          );
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new Error(
          `Invalid input for method '${currentMethod}': ${err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
        );
      }
      throw err; // Re-throw other errors
    }

    const message = "Post";
    const nonce = generateNonce();
    const recipient = "crosspost.near";
    const accountId = this.config.signerId;
    let authData: NearAuthData;

    try {
      const signer = near.KeyPair.fromString(
        this.config.keyPair as KeyPairString,
      );

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
      const payloadHash = sha256(serializedPayload);

      // Sign the hashed payload
      const signedMessage = signer.sign(
        payloadHash as unknown as Uint8Array<ArrayBuffer>,
      );

      authData = {
        message,
        // @ts-ignore nonce; this all should be moved to sign from near-sign-verify anyways
        nonce,
        recipient,
        callback_url: "",
        signature: uint8ArrayToBase64(signedMessage.signature),
        account_id: accountId,
        public_key: signedMessage.publicKey.toString(),
      };
    } catch (e) {
      console.log("Error creating auth token...", e);
      throw new Error("Error creating auth token.");
    }

    try {
      this.client.setAuthentication(authData);

      const clientMethodName = this.methodClientMap[currentMethod];

      // Call the appropriate method with the validated input
      await (
        this.client.post[clientMethodName] as (request: any) => Promise<any>
      )(validatedInput);
    } catch (e) {
      const err = e as Error;
      console.log(`Error during crosspost method '${currentMethod}':`, err);
      throw new Error(
        `Error performing crosspost method '${currentMethod}': ${err.message}`,
      );
    }
  }
}
