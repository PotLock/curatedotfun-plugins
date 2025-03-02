import { describe, it, expect, vi, beforeEach } from "vitest";
import NearSocialPlugin from "../index";

// Mock the Social class
vi.mock("@builddao/near-social-js", () => {
  return {
    Social: vi.fn().mockImplementation(() => {
      return {
        get: vi.fn().mockResolvedValue({ "test.near": { profile: { name: "Test User" } } }),
        set: vi.fn().mockResolvedValue({
          actions: [{ type: "FunctionCall", params: { method_name: "set", args: {} } }]
        })
      };
    }),
    transformActions: vi.fn().mockReturnValue([
      { type: "FunctionCall", params: { method_name: "set", args: {} } }
    ])
  };
});

describe("NearSocialPlugin", () => {
  let plugin: NearSocialPlugin;

  beforeEach(() => {
    plugin = new NearSocialPlugin();
    // Spy on console methods
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should initialize with valid config", async () => {
    await expect(
      plugin.initialize({
        accountId: "test.near",
        privateKey: "ed25519:privatekey",
        networkId: "testnet"
      })
    ).resolves.not.toThrow();
  });

  it("should throw error when initializing without config", async () => {
    await expect(plugin.initialize()).rejects.toThrow(
      "NEAR Social plugin requires configuration."
    );
  });

  it("should throw error when initializing without accountId", async () => {
    await expect(
      plugin.initialize({
        privateKey: "ed25519:privatekey"
      } as any)
    ).rejects.toThrow("NEAR Social plugin requires accountId");
  });

  it("should throw error when initializing without privateKey", async () => {
    await expect(
      plugin.initialize({
        accountId: "test.near"
      } as any)
    ).rejects.toThrow("NEAR Social plugin requires privateKey");
  });

  it("should distribute content successfully", async () => {
    // Initialize the plugin
    await plugin.initialize({
      accountId: "test.near",
      privateKey: "ed25519:privatekey",
      networkId: "testnet"
    });

    // Mock the signAndSendTransaction method
    const signAndSendTransactionSpy = vi.spyOn(
      plugin as any,
      "signAndSendTransaction"
    ).mockResolvedValue(undefined);

    // Distribute content
    await expect(
      plugin.distribute({
        input: "Hello, NEAR Social!",
        config: {
          accountId: "test.near",
          privateKey: "ed25519:privatekey",
          networkId: "testnet"
        }
      })
    ).resolves.not.toThrow();

    // Verify signAndSendTransaction was called
    expect(signAndSendTransactionSpy).toHaveBeenCalled();
    
    // Verify console.log was called with success message
    expect(console.log).toHaveBeenCalledWith("Successfully posted to NEAR Social");
  });

  it("should throw error when distributing without initialization", async () => {
    await expect(
      plugin.distribute({
        input: "Hello, NEAR Social!",
        config: {
          accountId: "test.near",
          privateKey: "ed25519:privatekey"
        }
      })
    ).rejects.toThrow("NEAR Social plugin not initialized");
  });
});
