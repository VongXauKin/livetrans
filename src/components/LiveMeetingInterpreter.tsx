import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  Volume2, 
  VolumeX, 
  Gauge, 
  Download, 
  Trash2, 
  Sparkles, 
  ChevronRight, 
  Info,
  CheckCircle2,
  Copy,
  Sliders,
  Radio,
  History,
  BookmarkPlus,
  BookmarkCheck,
  Columns,
  Layers,
  Smartphone,
  Monitor,
  Printer
} from 'lucide-react';
import { TranslationChunk, TranslationConfig, IndustryTerm, SavedMeetingSession } from '../types/index.ts';
import { TECHNICAL_LECTURE_PRESETS } from '../services/glossaryData.ts';
import { 
  cleanAndNormalizeSpeech, 
  segmentRunOnSpeech, 
  calculateSpeechPace, 
  matchAndDetectTerms, 
  generateInstantGloss,
  SpeechPaceResult
} from '../utils/textProcessor.ts';
import { SessionHistoryModal } from './SessionHistoryModal.tsx';
import { 
  getSavedSessions, 
  saveMeetingSession, 
  deleteSavedSession, 
  clearAllSavedSessions 
} from '../services/sessionStorage.ts';

interface LiveMeetingInterpreterProps {
  config: TranslationConfig;
  onSelectTerm: (term: IndustryTerm) => void;
  onSendToAnalytics: (transcript: string) => void;
  chunks: TranslationChunk[];
  setChunks: React.Dispatch<React.SetStateAction<TranslationChunk[]>>;
  isTranslating: boolean;
  setIsTranslating: (val: boolean) => void;
  setLatencyMs: (ms: number) => void;
}

type ViewMode = 'bilingual_cards' | 'split_panes' | 'target_only' | 'desktop_panes';

export const LiveMeetingInterpreter: React.FC<LiveMeetingInterpreterProps> = ({
  config,
  onSelectTerm,
  onSendToAnalytics,
  chunks,
  setChunks,
  isTranslating,
  setIsTranslating,
  setLatencyMs,
}) => {
  // Speech Recognition & Simulation state
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedLectureIdx, setSelectedLectureIdx] = useState(0);
  const [simulationProgress, setSimulationProgress] = useState(0);

  // Real-time interim text
  const [interimSpoken, setInterimSpoken] = useState('');
  const [interimDraftVi, setInterimDraftVi] = useState('');
  const [livePace, setLivePace] = useState<SpeechPaceResult>({
    wpm: 0,
    level: 'normal',
    labelVi: 'Sẵn sàng ghi nhận',
    labelEn: 'Ready'
  });

  // Mobile and Desktop View Mode
  const [viewMode, setViewMode] = useState<ViewMode>('bilingual_cards');

  // History and Saved Sessions State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedMeetingSession[]>(() => getSavedSessions());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Audio & TTS
  const [isTtsMuted, setIsTtsMuted] = useState(!config.autoTtsOutput);
  const [audioLevel, setAudioLevel] = useState<number[]>([15, 30, 45, 20, 60, 80, 50, 25, 40]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const simulationTimerRef = useRef<any>(null);
  const speechStartTimeRef = useRef<number>(Date.now());
  const wordsRecognizedRef = useRef<number>(0);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to latest chunk
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chunks, interimSpoken, interimDraftVi]);

  // Audio animation visualizer tick when listening or simulating
  useEffect(() => {
    let animId: number;
    if (isListeningMic || isSimulating) {
      const updateWave = () => {
        setAudioLevel([
          Math.floor(20 + Math.random() * 70),
          Math.floor(30 + Math.random() * 65),
          Math.floor(45 + Math.random() * 55),
          Math.floor(25 + Math.random() * 75),
          Math.floor(50 + Math.random() * 50),
          Math.floor(65 + Math.random() * 35),
          Math.floor(35 + Math.random() * 60),
          Math.floor(20 + Math.random() * 70),
          Math.floor(40 + Math.random() * 60),
        ]);
        animId = requestAnimationFrame(updateWave);
      };
      animId = requestAnimationFrame(updateWave);
    } else {
      setAudioLevel([15, 20, 25, 15, 30, 20, 15, 10, 15]);
    }
    return () => cancelAnimationFrame(animId);
  }, [isListeningMic, isSimulating]);

  // Auto-save session helper
  const handleSaveCurrentSession = () => {
    if (chunks.length === 0) return;
    const allTerms = Array.from(new Set(chunks.flatMap(c => c.detectedTerms)));
    const lecturePreset = TECHNICAL_LECTURE_PRESETS[selectedLectureIdx];
    const title = `Hội nghị Kỹ thuật: ${allTerms.slice(0, 3).join(', ') || lecturePreset.title.slice(0, 35)} (${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})`;
    
    const newSession: SavedMeetingSession = {
      id: `session-${Date.now()}`,
      title,
      timestamp: `${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
      dateStr: new Date().toLocaleDateString('vi-VN'),
      chunks: [...chunks],
      averageWpm: Math.round(chunks.reduce((acc, c) => acc + (c.wpm || 175), 0) / (chunks.length || 1)),
      detectedTerms: allTerms,
      sourceLang: config.sourceLang,
      targetLang: config.targetLang,
    };

    const updated = saveMeetingSession(newSession);
    setSavedSessions(updated);
    setToastMessage('Đã lưu thành công phiên họp vào bộ nhớ cục bộ!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle Web Speech API (Microphone)
  const toggleMicrophone = () => {
    if (isListeningMic) {
      stopMicrophone();
      if (chunks.length >= 2) handleSaveCurrentSession();
    } else {
      startMicrophone();
    }
  };

  const startMicrophone = () => {
    if (isSimulating) stopSimulation();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Trình duyệt của bạn chưa hỗ trợ Web Speech API trực tiếp. Bạn có thể sử dụng chế độ "Thử Nghiệm Diễn Giả Nói Nhanh" để trải nghiệm dịch trực tuyến tốc độ cao.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = config.sourceLang === 'vi' ? 'vi-VN' : 'en-US';

      speechStartTimeRef.current = Date.now();
      wordsRecognizedRef.current = 0;

      recognition.onstart = () => {
        setIsListeningMic(true);
      };

      recognition.onresult = (event: any) => {
        let interimStr = '';
        let finalStr = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalStr += transcript;
          } else {
            interimStr += transcript;
          }
        }

        if (interimStr) {
          setInterimSpoken(interimStr);
          // Instant first-word draft translation (0ms)
          if (config.instantFirstWordDraft) {
            const instantDraft = generateInstantGloss(interimStr, config.customTerms, config.targetLang as 'vi' | 'en');
            setInterimDraftVi(instantDraft);
          }

          // Calculate speaking pace
          const totalWords = interimStr.trim().split(/\s+/).length + wordsRecognizedRef.current;
          const durationSec = (Date.now() - speechStartTimeRef.current) / 1000;
          setLivePace(calculateSpeechPace(totalWords, durationSec));
        }

        if (finalStr) {
          wordsRecognizedRef.current += finalStr.trim().split(/\s+/).length;
          handleProcessFinalSpeech(finalStr);
          setInterimSpoken('');
          setInterimDraftVi('');
        }
      };

      recognition.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
      };

      recognition.onend = () => {
        if (isListeningMic) {
          try {
            recognition.start();
          } catch (e) {
            setIsListeningMic(false);
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Failed to initialize speech recognition:', e);
    }
  };

  const stopMicrophone = () => {
    setIsListeningMic(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setInterimSpoken('');
    setInterimDraftVi('');
  };

  // High-Speed Technical Lecturer Simulation
  const startSimulation = () => {
    if (isListeningMic) stopMicrophone();
    setIsSimulating(true);
    setSimulationProgress(0);

    const lecture = TECHNICAL_LECTURE_PRESETS[selectedLectureIdx];
    speechStartTimeRef.current = Date.now();
    wordsRecognizedRef.current = 0;

    let sentenceIndex = 0;
    const sentences = lecture.sampleSpeech;

    const streamNextSentence = () => {
      if (sentenceIndex >= sentences.length) {
        setIsSimulating(false);
        setInterimSpoken('');
        setInterimDraftVi('');
        handleSaveCurrentSession();
        return;
      }

      const fullSentence = sentences[sentenceIndex];
      const words = fullSentence.split(' ');
      let currentWordIdx = 0;

      // Simulate fast speech: 1 word every 150-180ms (~180-200 WPM)
      const wordInterval = setInterval(() => {
        currentWordIdx += 2;
        const currentSlice = words.slice(0, currentWordIdx).join(' ');
        setInterimSpoken(currentSlice);

        // Instant draft translation (0ms)
        if (config.instantFirstWordDraft) {
          const draft = generateInstantGloss(currentSlice, config.customTerms, config.targetLang as 'vi' | 'en');
          setInterimDraftVi(draft);
        }

        // Update WPM
        const totalWords = currentWordIdx + wordsRecognizedRef.current;
        const elapsedSec = (Date.now() - speechStartTimeRef.current) / 1000;
        setLivePace(calculateSpeechPace(totalWords, elapsedSec));

        if (currentWordIdx >= words.length) {
          clearInterval(wordInterval);
          wordsRecognizedRef.current += words.length;
          handleProcessFinalSpeech(fullSentence);
          setInterimSpoken('');
          setInterimDraftVi('');
          sentenceIndex++;
          setSimulationProgress(Math.round((sentenceIndex / sentences.length) * 100));

          // Pause briefly between fast-paced paragraphs (1 second)
          simulationTimerRef.current = setTimeout(streamNextSentence, 1000);
        }
      }, 160);
    };

    streamNextSentence();
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    if (simulationTimerRef.current) {
      clearTimeout(simulationTimerRef.current);
    }
    setInterimSpoken('');
    setInterimDraftVi('');
    if (chunks.length >= 2) handleSaveCurrentSession();
  };

  // Ultra-Fast Final Speech Processing
  const handleProcessFinalSpeech = async (speechText: string) => {
    const cleaned = cleanAndNormalizeSpeech(speechText);
    if (!cleaned) return;

    // Detect technical terms immediately
    const localDetectedTerms = matchAndDetectTerms(cleaned, config.customTerms);
    const chunkId = `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const timeNow = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    
    // Immediate instant gloss draft (0ms response)
    const instantDraft = generateInstantGloss(cleaned, config.customTerms, config.targetLang as 'vi' | 'en');

    const tempChunk: TranslationChunk = {
      id: chunkId,
      timestamp: timeNow,
      speaker: 'Diễn giả Chuyên gia (Lecturer)',
      originalText: cleaned,
      translatedText: instantDraft || 'Đang chuẩn hóa chuyên ngành...',
      isInterim: false,
      isFinal: false,
      wpm: livePace.wpm || 185,
      detectedTerms: localDetectedTerms,
    };

    setChunks(prev => [...prev, tempChunk]);
    setIsTranslating(true);

    try {
      // Use Ultra-Fast translation endpoint for live speech
      const res = await fetch('/api/translate-fast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleaned,
          sourceLang: config.sourceLang,
          targetLang: config.targetLang,
        }),
      });

      const data = await res.json();
      setLatencyMs(data.latencyMs || 120);

      const translatedResult = data.translatedText || instantDraft || cleaned;

      setChunks(prev => prev.map(c => c.id === chunkId ? {
        ...c,
        translatedText: translatedResult,
        isFinal: true,
        latencyMs: data.latencyMs,
      } : c));

      // Read aloud via TTS if not muted
      if (!isTtsMuted && 'speechSynthesis' in window) {
        playSpeechSynthesis(translatedResult);
      }
    } catch (err) {
      console.error('Translation call failed:', err);
      setChunks(prev => prev.map(c => c.id === chunkId ? {
        ...c,
        translatedText: instantDraft || cleaned,
        isFinal: true,
      } : c));
    } finally {
      setIsTranslating(false);
    }
  };

  // Text-To-Speech Playback
  const playSpeechSynthesis = (textToSpeak: string) => {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = config.targetLang === 'vi' ? 'vi-VN' : 'en-US';
      utterance.rate = config.ttsSpeed || 1.15;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // Copy chunk to clipboard
  const copyChunk = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export Subtitles (SRT)
  const exportSRT = () => {
    if (chunks.length === 0) return;
    let srtContent = '';
    chunks.forEach((chunk, idx) => {
      const startSec = idx * 4;
      const endSec = startSec + 3;
      const formatTime = (sec: number) => {
        const h = String(Math.floor(sec / 3600)).padStart(2, '0');
        const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        return `${h}:${m}:${s},000`;
      };
      srtContent += `${idx + 1}\n${formatTime(startSec)} --> ${formatTime(endSec)}\n${chunk.translatedText}\n[Original]: ${chunk.originalText}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PetroTrans-Subtitles-${Date.now()}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Transcript (Text)
  const exportTranscript = () => {
    if (chunks.length === 0) return;
    let content = `# BIÊN BẢN PHIÊN DỊCH TRỰC TIẾP - PETROTRANS PRO\n`;
    content += `Thời gian: ${new Date().toLocaleString('vi-VN')}\n`;
    content += `Chuyên đề: Dầu nhờn, Phụ gia Tribology & Kỹ thuật Phối trộn\n`;
    content += `========================================================\n\n`;

    chunks.forEach((chunk) => {
      content += `[${chunk.timestamp}] ${chunk.speaker} (${chunk.wpm} WPM)\n`;
      content += `Bản gốc: ${chunk.originalText}\n`;
      content += `Dịch AI: ${chunk.translatedText}\n`;
      if (chunk.detectedTerms.length > 0) {
        content += `Thuật ngữ: ${chunk.detectedTerms.join(', ')}\n`;
      }
      content += `--------------------------------------------------------\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PetroTrans-Transcript-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTermClick = (termName: string) => {
    const found = config.customTerms.find(
      t => t.term.toLowerCase() === termName.toLowerCase() ||
           t.term.toLowerCase().includes(termName.toLowerCase()) ||
           termName.toLowerCase().includes(t.term.toLowerCase())
    );
    if (found) {
      onSelectTerm(found);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Control Deck */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Main Action Buttons: Mic, Lecture Simulator & History */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Mic Button */}
            <button
              onClick={toggleMicrophone}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer ${
                isListeningMic 
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse' 
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/20'
              }`}
            >
              {isListeningMic ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Dừng Thu Âm Live</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Bật Microphone Live</span>
                </>
              )}
            </button>

            {/* High-Speed Lecture Simulator */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <select
                value={selectedLectureIdx}
                disabled={isSimulating}
                onChange={(e) => setSelectedLectureIdx(Number(e.target.value))}
                className="bg-transparent text-xs text-slate-300 font-medium py-1 px-2 focus:outline-none max-w-[170px] sm:max-w-[260px] truncate"
              >
                {TECHNICAL_LECTURE_PRESETS.map((lec, idx) => (
                  <option key={lec.id} value={idx} className="bg-slate-900 text-slate-100">
                    {lec.title} ({lec.speedWpm} WPM)
                  </option>
                ))}
              </select>

              <button
                onClick={isSimulating ? stopSimulation : startSimulation}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSimulating 
                    ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                }`}
              >
                {isSimulating ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>Dừng Mô Phỏng</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Mô Phỏng Diễn Giả Nói Nhanh</span>
                  </>
                )}
              </button>
            </div>

            {/* Session History Modal Trigger */}
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
              title="Xem danh sách lịch sử các phiên dịch trực tuyến đã lưu"
            >
              <History className="w-4 h-4 text-cyan-400" />
              <span>Lịch Sử Phiên Dịch</span>
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono">
                {savedSessions.length}
              </span>
            </button>

            {/* Save Current Session Button */}
            {chunks.length > 0 && (
              <button
                onClick={handleSaveCurrentSession}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-emerald-700 text-emerald-300 hover:text-emerald-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="Lưu phiên họp hiện tại vào bộ nhớ cục bộ"
              >
                <BookmarkPlus className="w-4 h-4 text-emerald-400" />
                <span>Lưu Phiên</span>
              </button>
            )}
          </div>

          {/* Right Status: Audio Level & Speedometer */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Audio Waveform */}
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 h-9">
              <span className="text-[10px] text-slate-500 font-mono mr-0.5">AUDIO</span>
              <div className="flex items-end gap-1 h-4">
                {audioLevel.map((height, i) => (
                  <div
                    key={i}
                    style={{ height: `${height}%` }}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      isListeningMic || isSimulating ? 'bg-cyan-400' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Speaking Speed Meter (WPM) */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold h-9 ${
              livePace.level === 'very_fast'
                ? 'bg-rose-950/80 border-rose-600 text-rose-300'
                : livePace.level === 'fast'
                ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-emerald-400'
            }`}>
              <Gauge className="w-3.5 h-3.5" />
              <div className="flex items-center gap-1 font-mono text-xs">
                <span>{livePace.wpm || 0}</span>
                <span className="text-[10px] text-slate-400">WPM</span>
              </div>
            </div>

            {/* TTS Mute Toggle */}
            <button
              onClick={() => setIsTtsMuted(!isTtsMuted)}
              title={isTtsMuted ? "Bật giọng đọc đồng thời AI" : "Tắt giọng đọc đồng thời"}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                !isTtsMuted 
                  ? 'bg-cyan-950 border-cyan-600 text-cyan-300' 
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {!isTtsMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Clear transcript */}
            {chunks.length > 0 && (
              <button
                onClick={() => setChunks([])}
                title="Xóa màn hình hiện tại"
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Speed Warning Banner for the specialized fast speaker */}
        {livePace.level === 'very_fast' && (
          <div className="mt-3 px-3 py-2 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span className="font-semibold">TỐC ĐỘ NÓI RẤT CAO ({livePace.wpm} WPM):</span>
              <span className="hidden sm:inline">Kích hoạt phân tách mệnh đề ngữ nghĩa tự động bảo toàn công thức ZDDP, PAO, chỉ số VI.</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-rose-900 font-mono text-[10px] uppercase font-bold text-white">Active</span>
          </div>
        )}
      </div>

      {/* View Mode Switcher: Mobile-Optimized Bilingual Cards, 50/50 Split, or Focus */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 border border-slate-800/80 px-3 py-2 rounded-xl text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span>Chế độ hiển thị:</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setViewMode('bilingual_cards')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'bilingual_cards'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Thẻ Song Ngữ Liền Kề - Tối ưu cho Mobile (Xem cả 2 luồng cùng lúc không cần kéo trang)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Thẻ Song Ngữ (Tối Ưu Mobile)</span>
          </button>

          <button
            onClick={() => setViewMode('split_panes')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'split_panes'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Chia đôi màn hình 50/50 song song"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Chia Cột 50/50</span>
          </button>

          <button
            onClick={() => setViewMode('target_only')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'target_only'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Chỉ hiển thị bản dịch tiếng Việt nổi bật"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chỉ Bản Dịch</span>
          </button>

          <button
            onClick={() => setViewMode('desktop_panes')}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'desktop_panes'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Giao diện 2 khung lớn truyền thống"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>2 Khung Lớn</span>
          </button>
        </div>
      </div>

      {/* MAIN VIEWPORT: Render based on selected ViewMode */}

      {/* MODE 1: BILINGUAL CARDS (Mobile-First Masterpiece - Both languages side-by-side in each card!) */}
      {viewMode === 'bilingual_cards' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col h-[560px] shadow-lg overflow-hidden">
          {/* Card Header Bar */}
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Luồng Hội Nghị Song Ngữ Thời Gian Thực (Bilingual Stream)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80 font-semibold">
                {config.sourceLang.toUpperCase()} &rarr; {config.targetLang.toUpperCase()}
              </span>
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                {chunks.length} câu
              </span>
            </div>
          </div>

          {/* Cards Scroll Area */}
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 font-sans">
            {chunks.length === 0 && !interimSpoken && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Radio className="w-10 h-10 text-cyan-600/50 mb-3 animate-pulse" />
                <p className="font-semibold text-slate-300 text-sm">Chưa có luồng âm thanh nào được thu</p>
                <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                  Nhấn <span className="text-cyan-400 font-semibold">"Bật Microphone Live"</span> hoặc nhấn <span className="text-indigo-400 font-semibold">"Mô Phỏng Diễn Giả Nói Nhanh"</span>. Mỗi câu sẽ được hiển thị dạng thẻ song ngữ EN & VI liền kề, không cần cuộn trang lên xuống!
                </p>
              </div>
            )}

            {chunks.map((chunk, idx) => (
              <div
                key={chunk.id || idx}
                className="p-3 sm:p-4 rounded-2xl bg-slate-950/85 border border-slate-800 hover:border-cyan-800/70 transition-all shadow-md group"
              >
                {/* Chunk Meta Header */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">#{idx + 1}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-300 font-semibold">{chunk.timestamp}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-amber-400 font-medium">{chunk.wpm} WPM</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {chunk.latencyMs && (
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/80">
                        {chunk.latencyMs}ms
                      </span>
                    )}
                    <button
                      onClick={() => playSpeechSynthesis(chunk.translatedText)}
                      className="text-slate-400 hover:text-cyan-300 p-1 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                      title="Phát âm thanh bản dịch"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => copyChunk(chunk.id, `${chunk.originalText}\n${chunk.translatedText}`)}
                      className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                      title="Sao chép câu song ngữ"
                    >
                      {copiedId === chunk.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Original Speech Clause */}
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 mb-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-blue-400 font-mono font-bold uppercase mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    <span>GỐC ({config.sourceLang.toUpperCase()}):</span>
                  </div>
                  <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                    {chunk.originalText}
                  </p>
                </div>

                {/* Simultaneous Translation Clause */}
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/60 via-slate-900/80 to-blue-950/40 border border-cyan-800/60">
                  <div className="flex items-center gap-1.5 text-[10px] text-cyan-300 font-mono font-bold uppercase mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span>DỊCH CHÍNH XÁC ({config.targetLang.toUpperCase()}):</span>
                  </div>
                  <p className="text-white text-xs sm:text-sm font-semibold leading-relaxed">
                    {chunk.translatedText}
                  </p>
                </div>

                {/* Detected Terms Chips */}
                {chunk.detectedTerms.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-900 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-slate-500 font-medium">Thuật ngữ:</span>
                    {chunk.detectedTerms.map((term, tIdx) => (
                      <button
                        key={tIdx}
                        onClick={() => handleTermClick(term)}
                        className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md bg-cyan-950 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 font-mono font-medium transition-all cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Live Streaming Interim Clause Card */}
            {(interimSpoken || interimDraftVi) && (
              <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-700/80 animate-pulse space-y-2">
                <div className="flex items-center justify-between text-[11px] text-cyan-300 font-mono">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    ĐANG NGHE & DỊCH TỨC THỜI (0ms Instant Stream):
                  </span>
                  <span className="text-[10px] text-cyan-400/90 bg-cyan-900/60 px-2 py-0.5 rounded font-bold">
                    Live
                  </span>
                </div>

                {interimSpoken && (
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-blue-900/50 text-xs sm:text-sm">
                    <span className="text-[10px] font-mono text-blue-400 font-bold uppercase mr-1">EN:</span>
                    <span className="text-blue-100 font-mono">{interimSpoken}</span>
                    <span className="inline-block w-1.5 h-3.5 ml-1 bg-blue-400 animate-blink"></span>
                  </div>
                )}

                {interimDraftVi && (
                  <div className="p-2 rounded-xl bg-cyan-900/40 border border-cyan-600/50 text-xs sm:text-sm">
                    <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase mr-1">VI:</span>
                    <span className="text-cyan-100 italic font-medium">"{interimDraftVi}..."</span>
                  </div>
                )}
              </div>
            )}
            <div ref={scrollEndRef} />
          </div>
        </div>
      )}

      {/* MODE 2: SPLIT PANES 50/50 (Compact Synchronized Side-by-Side) */}
      {viewMode === 'split_panes' && (
        <div className="grid grid-cols-2 gap-2 sm:gap-4 h-[560px]">
          {/* Left Column: Original Speech */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-lg">
            <div className="px-3 py-2 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 truncate">GỐC ({config.sourceLang.toUpperCase()})</span>
              <span className="text-[10px] font-mono text-slate-500">{chunks.length}</span>
            </div>
            <div className="flex-1 p-2 sm:p-3 overflow-y-auto space-y-2 text-xs">
              {chunks.map((c, i) => (
                <div key={i} className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-mono mb-1">#{i + 1} • {c.timestamp}</div>
                  <p className="text-slate-200 leading-snug">{c.originalText}</p>
                </div>
              ))}
              {interimSpoken && (
                <div className="p-2 rounded-xl bg-blue-950/40 border border-blue-800/60 animate-pulse text-xs">
                  <span className="text-blue-300 font-mono">{interimSpoken}...</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Translated Speech */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-lg">
            <div className="px-3 py-2 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <span className="text-[11px] font-bold text-cyan-300 truncate">DỊCH ({config.targetLang.toUpperCase()})</span>
              <span className="text-[10px] font-mono text-cyan-400">AI</span>
            </div>
            <div className="flex-1 p-2 sm:p-3 overflow-y-auto space-y-2 text-xs">
              {chunks.map((c, i) => (
                <div key={i} className="p-2 rounded-xl bg-slate-950/80 border border-cyan-900/50">
                  <div className="text-[10px] text-slate-500 font-mono mb-1">#{i + 1} • {c.wpm} WPM</div>
                  <p className="text-cyan-100 font-medium leading-snug">{c.translatedText}</p>
                </div>
              ))}
              {interimDraftVi && (
                <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-800/60 animate-pulse text-xs">
                  <span className="text-cyan-200 italic">{interimDraftVi}...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: TARGET ONLY (Clean Teleprompter Focus) */}
      {viewMode === 'target_only' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col h-[560px] shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Bản Dịch Trực Tiếp ({config.targetLang.toUpperCase()})
            </h2>
            <span className="text-xs font-mono text-slate-400">{chunks.length} câu</span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans">
            {chunks.map((chunk, idx) => (
              <div key={chunk.id || idx} className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                  <span>#{idx + 1} • {chunk.timestamp}</span>
                  <span className="text-amber-400">{chunk.wpm} WPM</span>
                </div>
                <p className="text-slate-100 text-sm sm:text-base font-medium leading-relaxed">
                  {chunk.translatedText}
                </p>
              </div>
            ))}
            {interimDraftVi && (
              <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-800/80 animate-pulse">
                <p className="text-cyan-200 text-sm italic font-medium">"{interimDraftVi}..."</p>
              </div>
            )}
            <div ref={scrollEndRef} />
          </div>
        </div>
      )}

      {/* MODE 4: DESKTOP DUAL INDEPENDENT PANES */}
      {viewMode === 'desktop_panes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Pane */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col h-[520px] shadow-lg">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 rounded-t-2xl">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Luồng Giọng Nói Gốc ({config.sourceLang.toUpperCase()})
              </h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-sm">
              {chunks.map((chunk) => (
                <div key={chunk.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-mono">
                    <span>{chunk.timestamp} • {chunk.speaker}</span>
                    <span>{chunk.wpm} WPM</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed">{chunk.originalText}</p>
                </div>
              ))}
              {interimSpoken && (
                <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/60 animate-pulse text-sm">
                  <p className="text-blue-100 font-mono">{interimSpoken}...</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Pane */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col h-[520px] shadow-lg">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 rounded-t-2xl">
              <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Bản Dịch Đồng Thời ({config.targetLang.toUpperCase()})
              </h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-sm">
              {chunks.map((chunk) => (
                <div key={chunk.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-mono">
                    <span>{chunk.timestamp} • Bản dịch AI</span>
                    <span>{chunk.wpm} WPM</span>
                  </div>
                  <p className="text-white font-medium leading-relaxed">{chunk.translatedText}</p>
                </div>
              ))}
              {interimDraftVi && (
                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/80 animate-pulse text-sm">
                  <p className="text-cyan-100 italic">"{interimDraftVi}..."</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Bar: Subtitle Export, Transcript Download, Send to Minutes */}
      {chunks.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Đã ghi nhận & phiên dịch đồng thời: <strong className="text-cyan-300 font-mono">{chunks.length}</strong> câu</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportSRT}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Xuất Phụ Đề SRT</span>
            </button>

            <button
              onClick={exportTranscript}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Tải Biên Bản Song Ngữ (.TXT)</span>
            </button>

            <button
              onClick={() => {
                const fullText = chunks.map(c => `[${c.speaker}]: ${c.originalText} (Dịch: ${c.translatedText})`).join('\n\n');
                onSendToAnalytics(fullText);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bóc Tách Công Thức & Tạo Biên Bản</span>
            </button>
          </div>
        </div>
      )}

      {/* Session History Modal */}
      <SessionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        sessions={savedSessions}
        onLoadSession={(session) => {
          setChunks(session.chunks);
          setToastMessage(`Đã tải phiên "${session.title}" vào phòng dịch!`);
          setTimeout(() => setToastMessage(null), 3000);
        }}
        onSendToAnalytics={(transcript) => {
          onSendToAnalytics(transcript);
        }}
        onDeleteSession={(id) => {
          const updated = deleteSavedSession(id);
          setSavedSessions(updated);
        }}
        onClearAllSessions={() => {
          const updated = clearAllSavedSessions();
          setSavedSessions(updated);
        }}
      />
    </div>
  );
};
