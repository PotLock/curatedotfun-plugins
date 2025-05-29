import type { DeepL, SourceLanguageCode, TargetLanguageCode, TranslateTextOptions } from './types';
import type { TransformerPlugin, ActionArgs } from "@curatedotfun/types";
import { Translator } from 'deepl-node';

interface TranslationConfig extends Record<string, unknown> {
    apiKey: string;
    targetLang: TargetLanguageCode;
    sourceLang?: SourceLanguageCode;
    preserveFormatting?: boolean;
}

export default class TranslationTransformer
    implements TransformerPlugin<{ content: string }, { content: string }, TranslationConfig> {
    readonly type = "transformer" as const;
    private translator: Translator | null = null;
    private config: TranslationConfig | null = null;

    async initialize(config?: TranslationConfig): Promise<void> {
        if (!config?.apiKey) {
            throw new Error("DeepL API key is required");
        }
        if (!config?.targetLang) {
            throw new Error("Target language is required");
        }

        this.config = config;
        this.translator = new Translator(config.apiKey);

    }

    async transform({
        input,
    }: ActionArgs<unknown, TranslationConfig>): Promise<{ content: string }> {
        try {
            if (!this.translator || !this.config) {
                throw new Error("Translator not initialized. Call initialize() first.");
            }

            // Validate input
            if (input === undefined || input === null) {
                throw new Error("Input cannot be undefined or null");
            }
            // Convert input to string if it's not already
            const textToTranslate = (input as { content: string }).content;
            // Perform translation
            const result = await this.translator.translateText(
                textToTranslate,
                null,
                this.config.targetLang,
                {
                    preserveFormatting: this.config.preserveFormatting ?? true,
                } as TranslateTextOptions
            );

            return { content: result.text };
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error occurred";
            throw new Error(`Translation failed: ${errorMessage}`);
        }
    }

    async shutdown(): Promise<void> {
        // No cleanup needed for DeepL client
    }
} 