import type { ActionArgs, DistributorPlugin } from "@curatedotfun/types";
import { KeyPairString } from "@near-js/crypto";
import { connect, KeyPair, keyStores, providers } from "near-api-js";

interface NearSocialConfig {
  accountId: string;
  privateKey: string;
  networkId?: "mainnet" | "testnet";
  [key: string]: string | undefined;
}

const SOCIAL_CONTRACT = {
  mainnet: "social.near",
  testnet: "v1.social08.testnet"
};

const GAS_FEE_IN_ATOMIC_UNITS = "300000000000000";
const NO_DEPOSIT = "0";

export default class NearSocialPlugin
  implements DistributorPlugin<string, NearSocialConfig> {
  readonly type = "distributor" as const;
  private accountId: string | null = null;
  private privateKey: string | null = null;
  private networkId: "mainnet" | "testnet" = "mainnet";
  private near: any = null;

  async initialize(config?: NearSocialConfig): Promise<void> {
    if (!config) {
      throw new Error("NEAR Social plugin requires configuration.");
    }

    // Validate required config
    if (!config.accountId) {
      throw new Error("NEAR Social plugin requires accountId");
    }
    if (!config.privateKey) {
      throw new Error("NEAR Social plugin requires privateKey");
    }

    this.accountId = config.accountId;
    this.privateKey = config.privateKey;
    this.networkId = config.networkId || "mainnet";

    // Initialize NEAR connection
    const keyPair = KeyPair.fromString(this.privateKey as KeyPairString);
    const keyStore = new keyStores.InMemoryKeyStore();
    await keyStore.setKey(this.networkId, this.accountId, keyPair);

    this.near = connect({
      networkId: this.networkId,
      nodeUrl: this.networkId === "mainnet"
        ? "https://rpc.mainnet.near.org"
        : "https://rpc.testnet.near.org",
      keyStore
    });
  }

  async distribute({
    input: content,
  }: ActionArgs<string, NearSocialConfig>): Promise<void> {
    await this.createPost(content);
  }

  private async createPost(content: string): Promise<void> {
    if (!this.accountId || !this.privateKey || !this.near) {
      throw new Error("NEAR Social plugin not initialized");
    }

    try {
      // Prepare post content
      const postContent = {
        type: "md",
        text: content
      };

      // Prepare the data for the transaction
      const data = {
        [this.accountId]: {
          post: {
            main: JSON.stringify(postContent)
          },
          index: {
            post: JSON.stringify({
              key: "main",
              value: {
                type: "md"
              }
            })
          }
        }
      };

      // Sign and send transaction directly using callMethod
      await this.callMethod({
        contractId: SOCIAL_CONTRACT[this.networkId],
        method: "set",
        args: { data }, // Pass data as an argument
        gas: GAS_FEE_IN_ATOMIC_UNITS,
        deposit: NO_DEPOSIT
      });

      console.log("Successfully posted to NEAR Social");
    } catch (error) {
      console.error("Error creating post:", error);
      throw new Error(`Failed to post to NEAR Social: ${error}`);
    }
  }

  /**
   * Makes a call to a contract
   * @param options - the options for the call
   * @returns - the resulting transaction
   */
  private async callMethod({
    contractId,
    method,
    args = {},
    gas = GAS_FEE_IN_ATOMIC_UNITS,
    deposit = NO_DEPOSIT
  }: {
    contractId: string;
    method: string;
    args?: Record<string, any>;
    gas?: string;
    deposit?: string;
  }): Promise<any> {
    if (!this.accountId || !this.near) {
      throw new Error("NEAR Social plugin not initialized");
    }

    try {
      const account = await this.near.account(this.accountId);

      const outcome = await account.functionCall({
        contractId,
        methodName: method,
        args,
        gas,
        attachedDeposit: deposit
      });

      return providers.getTransactionLastResult(outcome);
    } catch (error) {
      console.error("Error calling method:", error);
      throw new Error(`Failed to call method: ${error}`);
    }
  }
}
