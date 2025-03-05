import { describe, it, expect, vi, beforeEach } from "vitest";
import NearSocialPlugin from "../index";
import * as nearAPI from "near-api-js";

describe("NearSocialPlugin", () => {
  let plugin: NearSocialPlugin;

  beforeEach(() => {
    plugin = new NearSocialPlugin();
    // Spy on console methods
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Reset mocks
    vi.clearAllMocks();
  });

  it("should initialize with valid config", async () => {
    // Create a mock implementation for the Near constructor
    // Mock the methods using spyOn with more complete implementations
    const fromStringSpy = vi
      .spyOn(nearAPI.KeyPair, "fromString")
      .mockReturnValue({
        sign: vi.fn(),
        verify: vi.fn(),
        getPublicKey: vi
          .fn()
          .mockReturnValue({ toString: () => "test-public-key" }),
      } as any);

    try {
      await plugin.initialize({
        accountId: "test.near",
        privateKey: "ed25519:privatekey",
        networkId: "testnet",
      });

      // Verify that the plugin was initialized with the correct values
      expect(plugin["accountId"]).toBe("test.near");
      expect(plugin["privateKey"]).toBe("ed25519:privatekey");
      expect(plugin["networkId"]).toBe("testnet");
    } finally {
      // Restore the original methods
      fromStringSpy.mockRestore();
    }
  });

  it("should throw error when initializing without config", async () => {
    await expect(plugin.initialize()).rejects.toThrow(
      "NEAR Social plugin requires configuration.",
    );
  });

  it("should throw error when initializing without accountId", async () => {
    await expect(
      plugin.initialize({
        privateKey: "ed25519:privatekey",
      } as any),
    ).rejects.toThrow("NEAR Social plugin requires accountId");
  });

  it("should throw error when initializing without privateKey", async () => {
    await expect(
      plugin.initialize({
        accountId: "test.near",
      } as any),
    ).rejects.toThrow("NEAR Social plugin requires privateKey");
  });

  it("should distribute content successfully", async () => {
    // Create a mock implementation for the Near constructor
    const mockNear = {
      connection: {},
    };

    // Mock the methods using spyOn with more complete implementations
    const fromStringSpy = vi
      .spyOn(nearAPI.KeyPair, "fromString")
      .mockReturnValue({
        sign: vi.fn(),
        verify: vi.fn(),
        getPublicKey: vi
          .fn()
          .mockReturnValue({ toString: () => "test-public-key" }),
      } as any);

    const nearSpy = vi
      .spyOn(nearAPI, "Near")
      .mockImplementation(() => mockNear as any);

    try {
      // Initialize the plugin
      await plugin.initialize({
        accountId: "test.near",
        privateKey: "ed25519:privatekey",
        networkId: "testnet",
      });

      // Mock the callMethod method
      const callMethodSpy = vi
        .spyOn(plugin as any, "callMethod")
        .mockResolvedValue(undefined);

      // Distribute content
      await plugin.distribute({
        input: "Hello, NEAR Social!",
        config: {
          accountId: "test.near",
          privateKey: "ed25519:privatekey",
          networkId: "testnet",
        },
      });

      // Verify callMethod was called
      expect(callMethodSpy).toHaveBeenCalled();

      expect(console.log).toHaveBeenCalledWith(
        "Successfully posted to NEAR Social",
      );
    } finally {
      // Restore the original methods
      fromStringSpy.mockRestore();
      nearSpy.mockRestore();
    }
  });

  it("should throw error when distributing without initialization", async () => {
    await expect(
      plugin.distribute({
        input: "Hello, NEAR Social!",
        config: {
          accountId: "test.near",
          privateKey: "ed25519:privatekey",
        },
      }),
    ).rejects.toThrow("NEAR Social plugin not initialized");
  });
});
