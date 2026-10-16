export interface IndustryTerm {
  id: string;
  term: string;
  vietnamese: string;
  english: string;
  category: 'Base Oil' | 'Additive' | 'Tribology & Testing' | 'Blending Process' | 'Specifications';
  chemicalFormula?: string;
  astmStandard?: string;
  definitionVi: string;
  definitionEn: string;
  treatRate?: string;
}

export interface TranslationChunk {
  id: string;
  timestamp: string;
  speaker: string;
  originalText: string;
  translatedText: string;
  isInterim: boolean;
  isFinal: boolean;
  wpm: number;
  detectedTerms: string[];
  latencyMs?: number;
  confidence?: number;
}

export interface MeetingSummary {
  topic: string;
  summaryVi: string;
  summaryEn: string;
  blendingParameters: {
    parameter: string;
    value: string;
    notes: string;
  }[];
  chemicalFormulations: {
    chemical: string;
    role: string;
    concentration?: string;
  }[];
  criticalWarnings: string[];
  actionItems: string[];
}

export type SupportedLanguage = 'en' | 'vi' | 'ja' | 'zh' | 'de' | 'ko';

export interface TranslationConfig {
  sourceLang: SupportedLanguage;
  targetLang: SupportedLanguage;
  domainPreset: 'lubricants_blending' | 'chemical_petro' | 'automotive_tribology' | 'general_technical';
  instantFirstWordDraft: boolean;
  fastSpeakerBuffer: boolean;
  autoTtsOutput: boolean;
  ttsSpeed: number;
  customTerms: IndustryTerm[];
}
