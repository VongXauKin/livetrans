import type { IndustryTerm } from '../types/index.ts';

export interface SpeechPaceResult {
  wpm: number;
  level: 'normal' | 'fast' | 'very_fast';
  labelVi: string;
  labelEn: string;
}

/**
 * Normalizes speech recognition text: removes filler words and normalizes spacing.
 */
export function cleanAndNormalizeSpeech(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/\b(uh|um|ah|er|like|you know|à|ừm|ờ|thì là)\b/gi, '')
    .replace(/\s*([,.:;?!])\s*([,.:;?!])+/g, '$1 ')
    .replace(/\s+([,.:;?!])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Segments rapid, continuous, run-on speech into manageable semantic clauses
 * without breaking technical formulas (e.g., 0W-20, ASTM D445, 100°C, 2.6 cSt).
 */
export function segmentRunOnSpeech(
  text: string,
  options?: { maxWordsPerSegment?: number; minWordsBeforeSplit?: number }
): string[] {
  const maxWords = options?.maxWordsPerSegment ?? 22;
  const minWords = options?.minWordsBeforeSplit ?? 6;

  if (!text || text.trim().length === 0) return [];

  // First split by explicit sentence endings (. ! ?)
  const rawSentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  const finalSegments: string[] = [];

  for (const sentence of rawSentences) {
    const words = sentence.split(/\s+/);
    if (words.length <= maxWords) {
      finalSegments.push(sentence);
      continue;
    }

    // Split on technical conjunctions and discourse markers
    // e.g. "and that is why", "furthermore", "because", "simultaneously", "do đó", "đồng thời"
    const connectorPattern = /,\s*(?=(because|therefore|furthermore|simultaneously|meanwhile|whereas|which|while|so that|in order to|and that is why|do đó|đồng thời|tuy nhiên|kết quả là|khi đó)\b)/i;
    
    const clauses = sentence.split(connectorPattern).filter(Boolean);
    let currentClauseBuffer: string[] = [];

    for (const piece of clauses) {
      // If piece is a connector delimiter, append it to previous buffer or current
      const pieceWords = piece.trim().split(/\s+/).filter(Boolean);
      const combinedWordsCount = currentClauseBuffer.join(' ').split(/\s+/).filter(Boolean).length + pieceWords.length;

      if (combinedWordsCount > maxWords && currentClauseBuffer.length > 0) {
        finalSegments.push(currentClauseBuffer.join(' ').trim());
        currentClauseBuffer = [piece.trim()];
      } else {
        currentClauseBuffer.push(piece.trim());
      }
    }

    if (currentClauseBuffer.length > 0) {
      const remainingText = currentClauseBuffer.join(' ').trim();
      // If still excessively long, chunk by words
      const remWords = remainingText.split(/\s+/);
      if (remWords.length > maxWords + 6) {
        for (let i = 0; i < remWords.length; i += maxWords) {
          const chunk = remWords.slice(i, i + maxWords).join(' ');
          if (chunk) finalSegments.push(chunk);
        }
      } else {
        finalSegments.push(remainingText);
      }
    }
  }

  return finalSegments;
}

/**
 * Calculates words-per-minute and rates speaker velocity.
 * Crucial for detecting the fast-talking lubricant specialist.
 */
export function calculateSpeechPace(wordCount: number, durationSeconds: number): SpeechPaceResult {
  if (durationSeconds <= 0 || wordCount <= 0) {
    return {
      wpm: 0,
      level: 'normal',
      labelVi: 'Tốc độ bình thường',
      labelEn: 'Standard pace'
    };
  }

  const wpm = Math.round((wordCount / durationSeconds) * 60);

  if (wpm >= 165) {
    return {
      wpm,
      level: 'very_fast',
      labelVi: 'Nói rất nhanh (Chuyên gia giảng giải tốc độ cao)',
      labelEn: 'Very fast (High-velocity technical monologue)'
    };
  }

  if (wpm >= 130) {
    return {
      wpm,
      level: 'fast',
      labelVi: 'Nói nhanh (Liên tục nhiều thuật ngữ)',
      labelEn: 'Fast pace (Continuous terms)'
    };
  }

  return {
    wpm,
    level: 'normal',
    labelVi: 'Tốc độ vừa phải',
    labelEn: 'Moderate pace'
  };
}

/**
 * Scans text for specialized terminology from the lubricant/chemical knowledge base.
 */
export function matchAndDetectTerms(text: string, glossary: IndustryTerm[]): string[] {
  if (!text) return [];
  const detected = new Set<string>();
  const normalizedText = text.toLowerCase();

  for (const item of glossary) {
    // Check main term
    const cleanTerm = item.term.replace(/[()]/g, '').toLowerCase().trim();
    if (cleanTerm.length >= 2 && normalizedText.includes(cleanTerm)) {
      detected.add(item.term);
      continue;
    }
    // Check ID or chemical formula
    if (item.chemicalFormula && normalizedText.includes(item.chemicalFormula.toLowerCase())) {
      detected.add(item.term);
    }
  }

  return Array.from(detected);
}

/**
 * Generates an instantaneous first-word draft gloss while audio recognition is interim.
 * This satisfies the user's requirement: "dịch tức thời những gì nghe được ngay từ từ đầu tiên".
 */
export function generateInstantGloss(
  interimText: string,
  glossary: IndustryTerm[],
  targetLang: 'vi' | 'en' = 'vi'
): string {
  if (!interimText || interimText.trim().length === 0) return '';

  const words = interimText.trim().split(/\s+/);
  
  // Instant keyword lookups for low-latency visual feedback
  const quickDict: Record<string, string> = {
    'now': 'bây giờ',
    'when': 'khi',
    'we': 'chúng ta',
    'you': 'bạn',
    'look': 'xem xét',
    'at': 'tại',
    'the': '',
    'formulating': 'phối trộn',
    'formulation': 'công thức phối trộn',
    'engine': 'động cơ',
    'oil': 'dầu',
    'oils': 'dầu nhớt',
    'viscosity': 'độ nhớt',
    'kinematic': 'động học',
    'index': 'chỉ số',
    'base': 'gốc',
    'stock': 'dầu gốc',
    'blending': 'phối trộn',
    'batch': 'theo mẻ',
    'temperature': 'nhiệt độ',
    'celsius': 'độ C',
    'degrees': 'độ',
    'chemical': 'hóa chất',
    'additive': 'phụ gia',
    'additives': 'các phụ gia',
    'wear': 'mài mòn',
    'anti-wear': 'chống mài mòn',
    'test': 'thử nghiệm',
    'water': 'nước',
    'shear': 'trượt cắt',
    'stability': 'độ ổn định',
    'detergent': 'chất tẩy rửa',
    'dispersant': 'chất phân tán',
    'catalyst': 'chất xúc tác',
    'reaction': 'phản ứng',
    'synthetic': 'tổng hợp',
    'mineral': 'khoáng',
    'fuel': 'nhiên liệu',
    'sulfur': 'lưu huỳnh',
    'acid': 'axit',
    'number': 'trị số',
    'oxidation': 'oxy hóa',
    'emulsion': 'nhũ tương',
    'cutting': 'cắt gọt',
    'cooling': 'làm mát',
    'pressure': 'áp suất',
    'extreme': 'cực áp',
    'film': 'màng bôi trơn',
    'kettle': 'bồn phối trộn'
  };

  // Convert glossary terms for immediate priority
  for (const g of glossary) {
    const key = g.term.toLowerCase().split(' ')[0];
    if (targetLang === 'vi') {
      quickDict[key] = g.vietnamese.split('(')[0].trim();
    } else {
      quickDict[key] = g.english.split('(')[0].trim();
    }
  }

  const translatedWords = words.map(w => {
    const clean = w.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (quickDict[clean]) {
      return quickDict[clean];
    }
    return w;
  });

  return translatedWords.join(' ');
}
