import type { ActionArgs, DistributorPlugin } from "@curatedotfun/types";
import { KeyPairString } from "@near-js/crypto";
import * as nearAPI from "near-api-js";
const { Near, Account, KeyPair, keyStores, providers } = nearAPI;

// Constants
import {
  SOCIAL_CONTRACT,
  GAS_FEE_IN_ATOMIC_UNITS,
  NO_DEPOSIT,
} from "./constants";
import calculateRequiredDeposit from "./utils/calculateRequiredDeposit";

// Utils

interface NearSocialConfig {
  accountId: string;
  privateKey: string;
  networkId?: "mainnet" | "testnet";
  key?: string;
  [key: string]: string | undefined;
}

export default class NearSocialPlugin
  implements DistributorPlugin<string, NearSocialConfig>
{
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

    // Create Near instance
    this.near = new Near({
      networkId: this.networkId,
      keyStore,
      nodeUrl:
        this.networkId === "mainnet"
          ? "https://rpc.mainnet.near.org"
          : "https://rpc.testnet.near.org",
      walletUrl:
        this.networkId === "mainnet"
          ? "https://mynearwallet.com/"
          : "https://testnet.mynearwallet.com/",
    });
  }

  async distribute({
    input: content,
    config,
  }: ActionArgs<string, NearSocialConfig>): Promise<void> {
    await this.createPost(content, config?.key);
  }

  private async createPost(
    content: string,
    key: string = "main",
  ): Promise<void> {
    if (!this.accountId || !this.privateKey || !this.near) {
      throw new Error("NEAR Social plugin not initialized");
    }

    try {
      // Prepare post content
      const postContent = {
        type: "md",
        text: content,
      };

      // Prepare the data for the transaction
      const data = {
        [this.accountId]: {
          post: {
            [key]: JSON.stringify(postContent),
          },
          index: {
            post: JSON.stringify({
              key,
              value: {
                type: "md",
              },
            }),
          },
        },
      };

      // Calculate the required deposit based on the data size
      const depositAmount = calculateRequiredDeposit({ data });

      // Sign and send transaction directly using callMethod
      await this.callMethod({
        contractId: SOCIAL_CONTRACT[this.networkId],
        method: "set",
        args: { data }, // Pass data as an argument
        gas: GAS_FEE_IN_ATOMIC_UNITS,
        deposit: depositAmount.toFixed(0), // Convert BigNumber to string with no decimal places
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
  /**
   * Helper method to get an Account instance
   * @returns Account instance
   */
  private getAccount(): nearAPI.Account {
    if (!this.accountId || !this.near) {
      throw new Error("NEAR Social plugin not initialized");
    }

    const { connection } = this.near;
    return new Account(connection, this.accountId);
  }

  private async callMethod({
    contractId,
    method,
    args = {},
    gas = GAS_FEE_IN_ATOMIC_UNITS,
    deposit = NO_DEPOSIT,
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
      // Get the account using our helper method
      const account = this.getAccount();

      // Ensure deposit is a valid integer string without decimal points
      const depositValue = deposit.includes(".")
        ? deposit.substring(0, deposit.indexOf("."))
        : deposit;

      const outcome = await account.functionCall({
        contractId,
        methodName: method,
        args,
        gas: BigInt(gas),
        attachedDeposit: BigInt(depositValue || "0"),
      });

      return providers.getTransactionLastResult(outcome);
    } catch (error) {
      console.error("Error calling method:", error);
      throw new Error(`Failed to call method: ${error}`);
    }
  }
}
