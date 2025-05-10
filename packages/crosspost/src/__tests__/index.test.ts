import { describe, it, expect, vi, beforeEach } from "vitest";
import CrosspostPlugin, { CrosspostMethod } from "../index";
import { CrosspostClient } from "@crosspost/sdk";
import * as nearAPI from "near-api-js";
import {
  CreatePostRequestSchema,
  DeletePostRequestSchema,
  LikePostRequestSchema,
  QuotePostRequestSchema,
  ReplyToPostRequestSchema,
  RepostRequestSchema,
  UnlikePostRequestSchema,
} from "@crosspost/types";
import { generateNonce, uint8ArrayToBase64 } from "near-sign-verify";
import { sha256 } from "@noble/hashes/sha2";
import * as borsh from "borsh";

// Mock dependencies
vi.mock("@crosspost/sdk", () => ({
  CrosspostClient: vi.fn().mockImplementation(
    () =>
      ({
        post: {
          createPost: vi.fn(),
          replyToPost: vi.fn(),
          deletePost: vi.fn(),
          likePost: vi.fn(),
          unlikePost: vi.fn(),
          repost: vi.fn(),
          quotePost: vi.fn(),
          // options: vi.fn(), // Removed explicit options mock, will use 'as any'
        },
        setAuthentication: vi.fn(),
      }) as any,
  ), // Cast to any
}));

vi.mock("near-api-js", async () => {
  const actual = await vi.importActual("near-api-js");
  return {
    ...actual,
    KeyPair: {
      fromString: vi.fn().mockReturnValue({
        sign: vi.fn().mockReturnValue({
          signature: new Uint8Array(64).fill(1), // Mock signature
          publicKey: {
            toString: vi.fn().mockReturnValue("ed25519:mockPublicKey"),
          },
        }),
        getPublicKey: vi.fn().mockReturnValue({
          toString: vi.fn().mockReturnValue("ed25519:mockPublicKey"),
        }),
      }),
    },
  };
});

vi.mock("near-sign-verify", () => ({
  generateNonce: vi.fn(() => new Uint8Array(32).fill(0)), // Mock nonce
  uint8ArrayToBase64: vi.fn((arr) => Buffer.from(arr).toString("base64")),
}));

vi.mock("@noble/hashes/sha2", () => ({
  sha256: vi.fn((data) => new Uint8Array(32).fill(2)), // Mock hash
}));

vi.mock("borsh", () => ({
  serialize: vi.fn((schema, payload) => Buffer.from("mock_serialized_payload")),
}));

const mockKeyPairString =
  "ed25519:5J2Xg2q2Z9xqX9Z9xqX9Z9xqX9Z9xqX9Z9xqX9Z9xqX9Z9xqX9Z9xqX9Z9xqX9";

describe("CrosspostPlugin", () => {
  let plugin: CrosspostPlugin;

  beforeEach(() => {
    plugin = new CrosspostPlugin();
    // Reset mocks before each test
    vi.clearAllMocks();
    // Re-mock CrosspostClient specifically for its methods if needed per test
    vi.mocked(CrosspostClient).mockImplementation(
      () =>
        ({
          post: {
            createPost: vi.fn(),
            replyToPost: vi.fn(),
            deletePost: vi.fn(),
            likePost: vi.fn(),
            unlikePost: vi.fn(),
            repost: vi.fn(),
            quotePost: vi.fn(),
            // options: vi.fn(), // Removed explicit options mock, will use 'as any'
          },
          setAuthentication: vi.fn(),
        }) as any,
    ); // Cast to any
  });

  describe("initialize", () => {
    it("should initialize successfully with valid config for 'create' method", async () => {
      const config = {
        signerId: "test.near",
        keyPair: mockKeyPairString,
        method: "create" as const,
      };
      await expect(plugin.initialize(config)).resolves.toBeUndefined();
      expect(plugin["config"]).toEqual(config);
      expect(plugin["client"]).not.toBeNull(); // Changed assertion
    });

    it("should initialize successfully with valid config for 'reply' method", async () => {
      const config = {
        signerId: "test.near",
        keyPair: mockKeyPairString,
        method: "reply" as const,
      };
      await expect(plugin.initialize(config)).resolves.toBeUndefined();
    });

    it("should initialize successfully with valid config for 'delete' method", async () => {
      const config = {
        signerId: "test.near",
        keyPair: mockKeyPairString,
        method: "delete" as const,
      };
      await expect(plugin.initialize(config)).resolves.toBeUndefined();
    });

    it("should initialize successfully with valid config for 'like' method", async () => {
      const config = {
        signerId: "test.near",
        keyPair: mockKeyPairString,
        method: "like" as const,
      };
      await expect(plugin.initialize(config)).resolves.toBeUndefined();
    });

    it("should initialize successfully with valid config for 'unlike' method", async () => {
      const config = {
        signerId: "test.near",
        keyPair: mockKeyPairString,
        method: "unlike" as const,
      };
      await expect(plugin.initialize(config)).resolves.toBeUndefined();
    });

    it("should initialize successfully with valid config for 'repost' method", async () => {
      const config = {
        signerId: "test.near",
        keyPair: mockKeyPairString,
        method: "repost" as const,
      };
      await expect(plugin.initialize(config)).resolves.toBeUndefined();
    });

    it("should initialize successfully with valid config for 'quote' method", async () => {
      const config = {
        signerId: "test.near",
        keyPair: mockKeyPairString,
        method: "quote" as const,
      };
      await expect(plugin.initialize(config)).resolves.toBeUndefined();
    });

    it("should throw error if config is not provided", async () => {
      await expect(plugin.initialize(undefined)).rejects.toThrow(
        "Crosspost plugin requires configuration.",
      );
    });

    it("should throw error if signerId is not provided", async () => {
      const config = {
        keyPair: mockKeyPairString,
        method: "create" as const,
      };
      // @ts-expect-error testing invalid config
      await expect(plugin.initialize(config)).rejects.toThrow(
        "Crosspost plugin requires signerId.",
      );
    });

    it("should throw error if keyPair is not provided", async () => {
      const config = {
        signerId: "test.near",
        method: "create" as const,
      };
      // @ts-expect-error testing invalid config
      await expect(plugin.initialize(config)).rejects.toThrow(
        "Crosspost plugin requires access key.",
      );
    });

    it("should throw error if method is not provided", async () => {
      const config = {
        signerId: "test.near",
        keyPair: mockKeyPairString,
      };
      // @ts-expect-error testing invalid config
      await expect(plugin.initialize(config)).rejects.toThrow(
        "Crosspost plugin requires 'method' in configuration.",
      );
    });

    it("should throw error if method is invalid", async () => {
      const config = {
        signerId: "test.near",
        keyPair: mockKeyPairString,
        method: "invalidMethod" as any,
      };
      await expect(plugin.initialize(config)).rejects.toThrow(
        "Method must be one of: create, reply, delete, like, unlike, repost, quote",
      );
    });

    it("should throw error if client method is unsupported (simulated)", async () => {
      const config = {
        signerId: "test.near",
        keyPair: mockKeyPairString,
        method: "create" as const,
      };
      // Simulate an unsupported method by temporarily altering the client mock
      const originalClientMock = vi
        .mocked(CrosspostClient)
        .getMockImplementation();
      vi.mocked(CrosspostClient).mockImplementationOnce(
        () =>
          ({
            post: {
              // createPost is missing
            },
            setAuthentication: vi.fn(),
          }) as any,
      );

      await expect(plugin.initialize(config)).rejects.toThrow(
        "Unsupported or invalid method: create",
      );
      // Restore original mock
      if (originalClientMock) {
        vi.mocked(CrosspostClient).mockImplementation(originalClientMock);
      }
    });
  });

  describe("distribute", () => {
    it("should throw error if plugin is not configured (config is null)", async () => {
      plugin["config"] = null; // Simulate not initialized
      const inputArgs = { input: {}, config: {} as any };
      await expect(plugin.distribute(inputArgs)).rejects.toThrow(
        "Crosspost plugin requires configuration.",
      );
    });

    it("should throw error if client is not initialized", async () => {
      // Initialize with a valid config first
      const validConfig = {
        signerId: "test.near",
        keyPair: mockKeyPairString,
        method: "create" as const,
      };
      await plugin.initialize(validConfig);

      plugin["client"] = null; // Simulate client not initialized
      const inputArgs = { input: {}, config: validConfig };
      await expect(plugin.distribute(inputArgs)).rejects.toThrow(
        "Crosspost plugin must be initialized.",
      );
    });

    // Test structure for each method
    const methodsToTest: Array<{
      methodName: CrosspostMethod;
      schema: any; // Zod schema
      validInput: any;
      clientMethodName: keyof CrosspostClient["post"];
    }> = [
      {
        methodName: "create",
        schema: CreatePostRequestSchema,
        validInput: {
          targets: [{ platform: "twitter", userId: "testAccountId" }],
          content: [{ text: "Hello world" }],
        },
        clientMethodName: "createPost",
      },
      {
        methodName: "reply",
        schema: ReplyToPostRequestSchema,
        validInput: {
          targets: [{ platform: "twitter", userId: "testAccountId" }],
          platform: "twitter",
          postId: "originalPostOnPlatform123",
          content: [{ text: "Nice post!" }],
        },
        clientMethodName: "replyToPost",
      },
      {
        methodName: "delete",
        schema: DeletePostRequestSchema,
        validInput: {
          targets: [{ platform: "twitter", userId: "testAccountId" }],
          posts: [
            { platform: "twitter", userId: "testUser1", postId: "post123" },
          ],
        },
        clientMethodName: "deletePost",
      },
      {
        methodName: "like",
        schema: LikePostRequestSchema,
        validInput: {
          targets: [{ platform: "twitter", userId: "testAccountId" }],
          platform: "twitter",
          postId: "post123",
        },
        clientMethodName: "likePost",
      },
      {
        methodName: "unlike",
        schema: UnlikePostRequestSchema,
        validInput: {
          targets: [{ platform: "twitter", userId: "testAccountId" }],
          platform: "twitter",
          postId: "post123",
        },
        clientMethodName: "unlikePost",
      },
      {
        methodName: "repost",
        schema: RepostRequestSchema,
        validInput: {
          targets: [{ platform: "twitter", userId: "testAccountId" }],
          platform: "twitter",
          postId: "post123",
        },
        clientMethodName: "repost",
      },
      {
        methodName: "quote",
        schema: QuotePostRequestSchema,
        validInput: {
          targets: [{ platform: "twitter", userId: "testAccountId" }],
          platform: "twitter",
          postId: "originalPostOnPlatform456",
          content: [{ text: "Great point!" }],
        },
        clientMethodName: "quotePost",
      },
    ];

    describe.each(methodsToTest)(
      "for method: $methodName",
      ({ methodName, schema, validInput, clientMethodName }) => {
        const currentTestConfig = {
          signerId: "test-signer.near",
          keyPair: mockKeyPairString,
          method: methodName,
        };

        beforeEach(async () => {
          // Ensure plugin is re-initialized for each method test
          plugin = new CrosspostPlugin();
          vi.mocked(CrosspostClient).mockImplementation(
            () =>
              ({
                post: {
                  createPost: vi.fn(),
                  replyToPost: vi.fn(),
                  deletePost: vi.fn(),
                  likePost: vi.fn(),
                  unlikePost: vi.fn(),
                  repost: vi.fn(),
                  quotePost: vi.fn(),
                },
                setAuthentication: vi.fn(),
              }) as any,
          );
          await plugin.initialize(currentTestConfig);
        });

        it("should call the correct client method with validated input", async () => {
          const mockClientInstance = plugin["client"] as any;
          const specificClientMethodMock =
            mockClientInstance.post[clientMethodName];

          await plugin.distribute({
            input: validInput,
            config: currentTestConfig,
          });

          expect(mockClientInstance.setAuthentication).toHaveBeenCalledOnce();
          // Further authData checks can be added here if needed

          expect(specificClientMethodMock).toHaveBeenCalledOnce();
          expect(specificClientMethodMock).toHaveBeenCalledWith(validInput);
        });

        it("should throw ZodError for invalid input", async () => {
          const invalidInput = { ...validInput, someRandomInvalidField: 123 };
          // More specific invalid inputs per schema would be better
          if (
            methodName === "create" ||
            methodName === "reply" ||
            methodName === "quote"
          ) {
            delete invalidInput.content;
          } else if (methodName === "delete") {
            delete invalidInput.posts;
          } else {
            delete invalidInput.postId;
          }

          await expect(
            plugin.distribute({
              input: invalidInput,
              config: currentTestConfig,
            }),
          ).rejects.toThrow(/Invalid input for method/);
        });
      },
    );

    it("should throw error if auth token creation fails", async () => {
      const config = {
        signerId: "auth-fail.near",
        keyPair: mockKeyPairString,
        method: "create" as const,
      };
      await plugin.initialize(config);

      // Simulate error during signing
      const mockedNear = vi.mocked(nearAPI.KeyPair);
      mockedNear.fromString.mockImplementationOnce(
        () =>
          ({
            sign: vi.fn().mockImplementation(() => {
              throw new Error("Signature failed");
            }),
            getPublicKey: vi.fn().mockReturnValue({
              toString: vi.fn().mockReturnValue("ed25519:mockPublicKey"),
            }),
          }) as any,
      );

      await expect(
        plugin.distribute({
          input: {
            targets: [{ platform: "twitter", userId: "testAccountId" }],
            content: [{ text: "test" }],
          },
          config,
        }),
      ).rejects.toThrow("Error creating auth token: Signature failed");
    });

    it("should throw error if borsh serialization fails", async () => {
      const config = {
        signerId: "borsh-fail.near",
        keyPair: mockKeyPairString,
        method: "create" as const,
      };
      await plugin.initialize(config);

      vi.mocked(borsh.serialize).mockImplementationOnce(() => {
        throw new Error("Borsh serialization failed");
      });

      await expect(
        plugin.distribute({
          input: {
            targets: [{ platform: "twitter", userId: "testAccountId" }],
            content: [{ text: "test" }],
          },
          config,
        }),
      ).rejects.toThrow(
        "Error creating auth token: Borsh serialization failed",
      );
    });

    it("should throw error if client method call fails", async () => {
      const config = {
        signerId: "client-fail.near",
        keyPair: mockKeyPairString,
        method: "create" as const,
      };
      await plugin.initialize(config);

      const mockClientInstance = plugin["client"] as any;
      mockClientInstance.post.createPost.mockRejectedValueOnce(
        new Error("Client API error"),
      );

      await expect(
        plugin.distribute({
          input: {
            targets: [{ platform: "twitter", userId: "testAccountId" }],
            content: [{ text: "test" }],
          },
          config,
        }),
      ).rejects.toThrow(
        "Error performing crosspost method 'create': Client API error",
      );
    });
  });
});
