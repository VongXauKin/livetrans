import React from 'react';
import { 
  Languages, 
  Activity, 
  Volume2, 
  Zap, 
  FileText, 
  BookOpen, 
  Sparkles,
  Layers,
  Flame,
  Radio
} from 'lucide-react';
import { SupportedLanguage, TranslationConfig } from '../types/index.ts';

interface HeaderProps {
  activeTab: 'live' | 'document' | 'glossary' | 'minutes';
  setActiveTab: (tab: 'live' | 'document' | 'glossary' | 'minutes') => void;
  config: TranslationConfig;
  setConfig: React.Dispatch<React.SetStateAction<TranslationConfig>>;
  isTranslating: boolean;
  latencyMs: number;
}

const LANGUAGES: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: 'en', label: 'English (US/UK)', flag: '🇺🇸' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ja', label: '日本語 (Japanese)', flag: '🇯🇵' },
  { code: 'zh', label: '中文 (Chinese)', flag: '🇨🇳' },
  { code: 'de', label: 'Deutsch (German)', flag: '🇩🇪' },
  { code: 'ko', label: '한국어 (Korean)', flag: '🇰🇷' },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  config,
  setConfig,
  isTranslating,
  latencyMs,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        {/* Top brand & live engine indicators */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-500 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  PetroTrans <span className="text-cyan-400 font-mono text-xs uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">PRO AI</span>
                </h1>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Simultaneous Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Phiên dịch trực tuyến hội nghị chuyên gia • Kỹ thuật Dầu nhờn & Phối trộn Hóa chất
              </p>
            </div>
          </div>

          {/* Engine Parameters & Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            {/* Domain Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-200">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium text-slate-300">Chuyên ngành:</span>
              <span className="text-cyan-300 font-semibold">Dầu nhớt, Phụ gia & Phối trộn</span>
            </div>

            {/* Latency & Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80">
              <Activity className={`w-3.5 h-3.5 ${isTranslating ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
              <span className="text-slate-400">Độ trễ AI:</span>
              <span className="font-mono text-emerald-300 font-medium">
                {latencyMs > 0 ? `${latencyMs}ms` : '<180ms'}
              </span>
            </div>

            {/* Instant First-Word Toggle */}
            <button
              onClick={() => setConfig(prev => ({ ...prev, instantFirstWordDraft: !prev.instantFirstWordDraft }))}
              title="Dịch tức thời ngay từ từ đầu tiên khi diễn giả đang phát âm"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                config.instantFirstWordDraft 
                  ? 'bg-cyan-950/80 border-cyan-600 text-cyan-300 shadow-sm shadow-cyan-900/40' 
                  : 'bg-slate-800/60 border-slate-700 text-slate-400'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${config.instantFirstWordDraft ? 'text-cyan-400 fill-cyan-400' : ''}`} />
              <span className="font-medium">Dịch tức thời từ đầu tiên</span>
            </button>

            {/* Fast Speaker Buffer Toggle */}
            <button
              onClick={() => setConfig(prev => ({ ...prev, fastSpeakerBuffer: !prev.fastSpeakerBuffer }))}
              title="Bộ đệm chống mất chữ khi diễn giả nói nhanh và câu dài liên tục"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                config.fastSpeakerBuffer 
                  ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300 shadow-sm shadow-indigo-900/40' 
                  : 'bg-slate-800/60 border-slate-700 text-slate-400'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium">Đệm câu dài & tốc độ cao</span>
            </button>
          </div>
        </div>

        {/* Bottom bar: Navigation Tabs & Language selectors */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('live')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'live'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              Cuộc Họp Live & Diễn Giả
            </button>

            <button
              onClick={() => setActiveTab('document')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'document'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              Dịch Tài Liệu & TDS/SDS
            </button>

            <button
              onClick={() => setActiveTab('glossary')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'glossary'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Bộ Thuật Ngữ Dầu Nhớt ({config.customTerms?.length || 0}+)
            </button>

            <button
              onClick={() => setActiveTab('minutes')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'minutes'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Biên Bản & Bóc Tách Công Thức
            </button>
          </nav>

          {/* Language Pair Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Languages className="w-3.5 h-3.5 text-cyan-400" /> Cặp ngôn ngữ:
            </span>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <select
                value={config.sourceLang}
                onChange={(e) => setConfig(prev => ({ ...prev, sourceLang: e.target.value as SupportedLanguage }))}
                className="bg-transparent text-slate-200 text-xs py-1 px-2 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
              >
                {LANGUAGES.map(lang => (
                  <option key={`src-${lang.code}`} value={lang.code} className="bg-slate-900 text-slate-100">
                    {lang.flag} {lang.label}
                  </option>
                ))}
              </select>

              <span className="text-slate-500 px-1 font-bold">→</span>

              <select
                value={config.targetLang}
                onChange={(e) => setConfig(prev => ({ ...prev, targetLang: e.target.value as SupportedLanguage }))}
                className="bg-transparent text-cyan-300 text-xs py-1 px-2 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 font-semibold"
              >
                {LANGUAGES.map(lang => (
                  <option key={`tgt-${lang.code}`} value={lang.code} className="bg-slate-900 text-slate-100">
                    {lang.flag} {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
