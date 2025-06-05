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
