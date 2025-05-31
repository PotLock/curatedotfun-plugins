export type SourceLanguageCode = string;
export type TargetLanguageCode =
  | "BG"
  | "CS"
  | "DA"
  | "DE"
  | "EL"
  | "EN-GB"
  | "EN-US"
  | "ES"
  | "ET"
  | "FI"
  | "FR"
  | "HU"
  | "ID"
  | "IT"
  | "JA"
  | "KO"
  | "LT"
  | "LV"
  | "NB"
  | "NL"
  | "PL"
  | "PT-BR"
  | "PT-PT"
  | "RO"
  | "RU"
  | "SK"
  | "SL"
  | "SV"
  | "TR"
  | "UK"
  | "ZH";

export type TagHandlingMode = "html" | "xml";

export interface TranslateTextOptions {
  preserveFormatting?: boolean;
  tagHandling?: TagHandlingMode;
  outlineDetection?: boolean;
  splittingSentences?: boolean;
  nonSplittingTags?: string[];
  ignoreTags?: string[];
}

export interface TranslationResult {
  text: string;
  detectedSourceLang?: string;
}

export interface DeepL {
  translateText(
    text: string,
    sourceLang: string | null,
    targetLang: TargetLanguageCode,
    options?: TranslateTextOptions,
  ): Promise<TranslationResult>;
  translateText(
    text: string[],
    sourceLang: string | null,
    targetLang: TargetLanguageCode,
    options?: TranslateTextOptions,
  ): Promise<TranslationResult[]>;
}
