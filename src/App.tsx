/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { LiveMeetingInterpreter } from './components/LiveMeetingInterpreter.tsx';
import { DocumentTranslator } from './components/DocumentTranslator.tsx';
import { GlossaryManager } from './components/GlossaryManager.tsx';
import { MeetingAnalytics } from './components/MeetingAnalytics.tsx';
import { TermDetailModal } from './components/TermDetailModal.tsx';
import { TranslationConfig, TranslationChunk, IndustryTerm } from './types/index.ts';
import { DEFAULT_LUBRICANT_GLOSSARY } from './services/glossaryData.ts';

const STORAGE_KEY = 'petrotrans_glossary_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'live' | 'document' | 'glossary' | 'minutes'>('live');
  const [isTranslating, setIsTranslating] = useState(false);
  const [latencyMs, setLatencyMs] = useState(140);
  const [selectedTerm, setSelectedTerm] = useState<IndustryTerm | null>(null);
  const [meetingTranscriptForAnalytics, setMeetingTranscriptForAnalytics] = useState('');

  // Translation configuration
  const [config, setConfig] = useState<TranslationConfig>(() => {
    let savedTerms = DEFAULT_LUBRICANT_GLOSSARY;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          savedTerms = parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read local glossary:', e);
    }

    return {
      sourceLang: 'en',
      targetLang: 'vi',
      domainPreset: 'lubricants_blending',
      instantFirstWordDraft: true,
      fastSpeakerBuffer: true,
      autoTtsOutput: false,
      ttsSpeed: 1.15,
      customTerms: savedTerms,
    };
  });

  // Persist glossary to localStorage when modified
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config.customTerms));
    } catch (e) {
      console.warn('Could not save glossary:', e);
    }
  }, [config.customTerms]);

  // Meeting transcript chunks
  const [chunks, setChunks] = useState<TranslationChunk[]>([]);

  const handleAddTerm = (newTerm: IndustryTerm) => {
    setConfig(prev => ({
      ...prev,
      customTerms: [newTerm, ...prev.customTerms]
    }));
  };

  const handleSendToAnalytics = (text: string) => {
    setMeetingTranscriptForAnalytics(text);
    setActiveTab('minutes');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        setConfig={setConfig}
        isTranslating={isTranslating}
        latencyMs={latencyMs}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5">
        {activeTab === 'live' && (
          <LiveMeetingInterpreter
            config={config}
            onSelectTerm={setSelectedTerm}
            onSendToAnalytics={handleSendToAnalytics}
            chunks={chunks}
            setChunks={setChunks}
            isTranslating={isTranslating}
            setIsTranslating={setIsTranslating}
            setLatencyMs={setLatencyMs}
          />
        )}

        {activeTab === 'document' && (
          <DocumentTranslator
            config={config}
            onSelectTerm={setSelectedTerm}
            onSendToAnalytics={handleSendToAnalytics}
          />
        )}

        {activeTab === 'glossary' && (
          <GlossaryManager
            terms={config.customTerms}
            onAddTerm={handleAddTerm}
            onSelectTerm={setSelectedTerm}
          />
        )}

        {activeTab === 'minutes' && (
          <MeetingAnalytics
            initialTranscript={meetingTranscriptForAnalytics}
          />
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>PetroTrans Pro AI • Chuyên biệt cho Hội nghị Khoa học & Dầu nhờn Kỹ thuật Cao</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <span>ASTM International & API Compliant</span>
            <span>•</span>
            <span>Gemini 3.8 Flash Ultra-Low Latency</span>
          </div>
        </div>
      </footer>

      {/* Term Detail Modal */}
      <TermDetailModal
        term={selectedTerm}
        onClose={() => setSelectedTerm(null)}
      />
    </div>
  );
}
