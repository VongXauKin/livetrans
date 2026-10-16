import React, { useState } from 'react';
import { 
  FileText, 
  ArrowRightLeft, 
  Copy, 
  CheckCircle2, 
  Download, 
  Sparkles, 
  Volume2, 
  RotateCcw,
  BookOpen,
  Sliders,
  AlertTriangle
} from 'lucide-react';
import { TranslationConfig, IndustryTerm } from '../types/index.ts';
import { matchAndDetectTerms } from '../utils/textProcessor.ts';

interface DocumentTranslatorProps {
  config: TranslationConfig;
  onSelectTerm: (term: IndustryTerm) => void;
  onSendToAnalytics: (text: string) => void;
}

const SAMPLE_DOCUMENTS = [
  {
    id: 'tds-0w20',
    title: 'TDS: Dầu Động Cơ Tổng Hợp Cao Cấp SAE 0W-20 API SP',
    content: `TECHNICAL DATA SHEET: ULTRA-SYNTHETIC MOTOR OIL SAE 0W-20 API SP / ILSAC GF-6A

1. Product Description:
Ultra-Synthetic 0W-20 is an advanced fully synthetic engine lubricant engineered specifically for modern turbocharged gasoline direct-injection (TGDI) engines requiring protection against Low-Speed Pre-Ignition (LSPI). Formulated with high-purity Group III+ Gas-to-Liquid base stock and 20% Group IV Polyalphaolefin (PAO 4 cSt), reinforced with a proprietary Zinc Dialkyldithiophosphate (ZDDP) and overbased magnesium/calcium detergent system.

2. Typical Physical & Chemical Characteristics:
- Kinematic Viscosity @ 100°C (ASTM D445): 8.4 cSt
- Kinematic Viscosity @ 40°C (ASTM D445): 45.2 cSt
- Viscosity Index (ASTM D2270): 165
- High Temperature High Shear (HTHS) Viscosity @ 150°C (ASTM D4683): 2.65 mPa·s
- Total Base Number (TBN) (ASTM D2896): 8.5 mg KOH/g
- Pour Point (ASTM D97): -48°C
- Flash Point COC (ASTM D92): 228°C
- NOACK Volatility @ 250°C, 1hr (ASTM D5800): 9.2 wt%
- Sulfated Ash Content (ASTM D874): 0.78 wt% (Low-SAPS compliant)

3. Blending & Production Instructions:
Charge Group III+ base oil at 55°C into the automated batch blending kettle. Inject 0.25% Pour Point Depressant (PMA) and 4.5% Olefin Copolymer Viscosity Index Improver under high-shear mixing for 35 minutes. Add the multi-functional API SP additive package at 60°C and maintain agitation until uniform clarity is achieved. Do not exceed 65°C to prevent thermal degradation of polymer backbones.`
  },
  {
    id: 'blend-mwf',
    title: 'Công Thức Phối Trộn: Dầu Gia Công Kim Loại & Nhũ Tương Cắt Gọt',
    content: `BATCH BLENDING MASTER SHEET: SEMI-SYNTHETIC METALWORKING FLUID 5000L

1. Formulation Breakdown (% by weight):
- Severe Hydrotreated Naphthenic Base Oil (100 SUS): 45.0%
- Sodium Petroleum Sulfonate Emulsifier (HLB 10.0): 18.5%
- Tall Oil Fatty Acid Diethanolamide: 7.0%
- Polyalkylene Glycol (PAG) Lubricity Agent: 4.5%
- Extreme Pressure (EP) Chlorinated Paraffin Alternative: 5.0%
- Triazine-based Bactericide & Isothiazolinone Fungicide: 2.2%
- Benzotriazole Yellow Metal Corrosion Inhibitor: 0.8%
- Polydimethylsiloxane Defoaming Compound: 35 ppm
- Deionized Demineralized Water: balance to 100%

2. Quality Control Acceptance Criteria:
- Emulsion pH @ 5% dilution in tap water (ASTM D1287): 9.1 ± 0.2
- Cast Iron Chip Corrosion Test (IP 287): Zero rust spots at 4% dilution
- Four-Ball Extreme Pressure Weld Point (ASTM D2783): >250 kgf
- Demulsibility & Tramp Oil Rejection: >90% separation within 4 hours`
  }
];

export const DocumentTranslator: React.FC<DocumentTranslatorProps> = ({
  config,
  onSelectTerm,
  onSendToAnalytics,
}) => {
  const [sourceText, setSourceText] = useState(SAMPLE_DOCUMENTS[0].content);
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [detectedTerms, setDetectedTerms] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [highlights, setHighlights] = useState<string[]>([]);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;

    setIsLoading(true);
    setTranslatedText('Đang phân tích cấu trúc kỹ thuật và dịch chuyên sâu...');

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          sourceLang: config.sourceLang,
          targetLang: config.targetLang,
          domain: config.domainPreset,
          customGlossary: config.customTerms,
          isFastSpokenChunk: false,
        }),
      });

      const data = await res.json();
      setTranslatedText(data.translatedText || '');
      setHighlights(data.technicalHighlights || []);

      const detected = matchAndDetectTerms(sourceText, config.customTerms);
      setDetectedTerms(detected);
    } catch (err) {
      console.error('Translation failed:', err);
      setTranslatedText('Có lỗi xảy ra trong quá trình dịch thuật. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadDocument = () => {
    if (!translatedText) return;
    const blob = new Blob([translatedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PetroTrans-Translated-Doc-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Sample presets selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-300">Tài liệu mẫu chuyên ngành dầu nhớt & hóa chất:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {SAMPLE_DOCUMENTS.map((doc) => (
            <button
              key={doc.id}
              onClick={() => {
                setSourceText(doc.content);
                setTranslatedText('');
              }}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all font-medium"
            >
              {doc.title}
            </button>
          ))}
        </div>
      </div>

      {/* Dual Comparative Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Source Document Pane */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[560px] shadow-lg">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Tài Liệu Kỹ Thuật Gốc ({config.sourceLang.toUpperCase()})
              </h2>
            </div>
            <button
              onClick={() => setSourceText('')}
              className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Xóa nội dung
            </button>
          </div>

          <div className="flex-1 p-3">
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Dán tài liệu kỹ thuật, bảng dữ liệu TDS, SDS, công thức phối trộn hoặc kết quả kiểm nghiệm ASTM vào đây..."
              className="w-full h-full bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 text-slate-200 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500 selection:bg-cyan-500 selection:text-white"
            />
          </div>

          <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/40 rounded-b-2xl">
            <span className="text-xs font-mono text-slate-400">
              Số từ: {sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0} từ
            </span>
            <button
              onClick={handleTranslate}
              disabled={isLoading || !sourceText.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? 'Đang dịch thuật AI...' : 'Dịch Chuyên Sâu Ngay'}</span>
            </button>
          </div>
        </div>

        {/* Target Translated Pane */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[560px] shadow-lg">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Bản Dịch Chuyên Ngành ({config.targetLang.toUpperCase()})
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {translatedText && (
                <>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded bg-slate-800"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                  <button
                    onClick={downloadDocument}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded bg-slate-800"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải về</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 p-3 overflow-y-auto">
            {translatedText ? (
              <div className="w-full h-full bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 text-slate-100 font-sans text-xs leading-relaxed whitespace-pre-wrap select-text">
                {translatedText}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <FileText className="w-10 h-10 text-slate-600 mb-3" />
                <p className="font-medium text-slate-400">Bản dịch sẽ hiển thị ở đây</p>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Mô hình Gemini 3.8 Flash sẽ tự động định danh và chuẩn hóa các thông số kỹ thuật (cSt, TBN, ZDDP, HTHS, ASTM D445) với độ chính xác cao nhất.
                </p>
              </div>
            )}
          </div>

          {/* Bottom highlights & action */}
          <div className="px-4 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-950/40 rounded-b-2xl">
            {detectedTerms.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 font-medium">Bảo toàn thuật ngữ:</span>
                {detectedTerms.slice(0, 6).map((term, i) => (
                  <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {term}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-500">Động cơ dịch thuật sẵn sàng</span>
            )}

            {translatedText && (
              <button
                onClick={() => onSendToAnalytics(translatedText)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                <span>Bóc tách thông số sang Biên bản</span> &rarr;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
