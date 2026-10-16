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
  Radio
} from 'lucide-react';
import { TranslationChunk, TranslationConfig, IndustryTerm } from '../types/index.ts';
import { TECHNICAL_LECTURE_PRESETS } from '../services/glossaryData.ts';
import { 
  cleanAndNormalizeSpeech, 
  segmentRunOnSpeech, 
  calculateSpeechPace, 
  matchAndDetectTerms, 
  generateInstantGloss,
  SpeechPaceResult
} from '../utils/textProcessor.ts';

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

  // Audio & TTS
  const [isTtsMuted, setIsTtsMuted] = useState(!config.autoTtsOutput);
  const [audioLevel, setAudioLevel] = useState<number[]>([15, 30, 45, 20, 60, 80, 50, 25, 40]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const simulationTimerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
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

  // Handle Web Speech API (Microphone)
  const toggleMicrophone = () => {
    if (isListeningMic) {
      stopMicrophone();
    } else {
      startMicrophone();
    }
  };

  const startMicrophone = () => {
    if (isSimulating) stopSimulation();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Trình duyệt của bạn chưa hỗ trợ Web Speech API trực tiếp. Bạn có thể sử dụng chế độ "Mô phỏng Diễn giả Nói Nhanh" hoặc kiểm tra quyền microphone.');
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
          // Instant first-word draft translation
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
          // Restart if still marked as listening
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
        return;
      }

      const fullSentence = sentences[sentenceIndex];
      const words = fullSentence.split(' ');
      let currentWordIdx = 0;

      // Simulate fast speech: 1 word every 160-220ms (equivalent to ~180 WPM)
      const wordInterval = setInterval(() => {
        currentWordIdx += 2;
        const currentSlice = words.slice(0, currentWordIdx).join(' ');
        setInterimSpoken(currentSlice);

        // Instant draft translation
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

          // Pause briefly between fast-paced paragraphs (1.2 seconds)
          simulationTimerRef.current = setTimeout(streamNextSentence, 1200);
        }
      }, 190);
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
  };

  // Process Final Speech: Fast buffer segmentation & Gemini API translation
  const handleProcessFinalSpeech = async (speechText: string) => {
    const cleaned = cleanAndNormalizeSpeech(speechText);
    if (!cleaned) return;

    // Translate the complete sentence clause
    const detected = matchAndDetectTerms(cleaned, config.customTerms);
    const chunkId = `chunk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const timestamp = new Date().toLocaleTimeString('vi-VN', { hour12: false });

    // Add temporary loading chunk
    const tempChunk: TranslationChunk = {
      id: chunkId,
      timestamp,
      speaker: 'Diễn giả Chuyên gia (Lecturer)',
      originalText: cleaned,
      translatedText: 'Đang phiên dịch với AI Gemini chuyên ngành...',
      isInterim: false,
      isFinal: false,
      wpm: livePace.wpm || 180,
      detectedTerms: detected,
    };

    setChunks(prev => [...prev, tempChunk]);
    setIsTranslating(true);

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleaned,
          sourceLang: config.sourceLang,
          targetLang: config.targetLang,
          domain: config.domainPreset,
          customGlossary: config.customTerms,
          isFastSpokenChunk: true,
        }),
      });

      const data = await res.json();
      setLatencyMs(data.latencyMs || 150);

      const translatedResult = data.translatedText || cleaned;

      setChunks(prev => prev.map(c => c.id === chunkId ? {
        ...c,
        translatedText: translatedResult,
        isFinal: true,
        latencyMs: data.latencyMs,
        detectedTerms: Array.from(new Set([...c.detectedTerms, ...(data.detectedTerms?.map((t: any) => t.term) || [])]))
      } : c));

      // Read aloud via TTS if not muted
      if (!isTtsMuted && 'speechSynthesis' in window) {
        playSpeechSynthesis(translatedResult);
      }
    } catch (err) {
      console.error('Translation call failed:', err);
      setChunks(prev => prev.map(c => c.id === chunkId ? {
        ...c,
        translatedText: `[Bản dịch nhanh]: ${cleaned}`,
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
      utterance.rate = config.ttsSpeed || 1.15; // slightly faster to keep up with lecturer
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

  // Export Transcript (Text/DOCX-ready)
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
        content += `Thuật ngữ kỹ thuật: ${chunk.detectedTerms.join(', ')}\n`;
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

  // Find glossary term item when clicked
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
      {/* Top Control Deck: Simulation & Mic & Speedometer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Main Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Live Mic Button */}
            <button
              onClick={toggleMicrophone}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md ${
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
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <select
                value={selectedLectureIdx}
                disabled={isSimulating}
                onChange={(e) => setSelectedLectureIdx(Number(e.target.value))}
                className="bg-transparent text-xs text-slate-300 font-medium py-1 px-2 focus:outline-none max-w-[200px] sm:max-w-[280px] truncate"
              >
                {TECHNICAL_LECTURE_PRESETS.map((lec, idx) => (
                  <option key={lec.id} value={idx} className="bg-slate-900 text-slate-100">
                    {lec.title} ({lec.speedWpm} WPM)
                  </option>
                ))}
              </select>

              <button
                onClick={isSimulating ? stopSimulation : startSimulation}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
                    <span>Thử Nghiệm Diễn Giả Nói Nhanh</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Status: Live Speedometer & Audio Level Visualizer */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Audio Waveform */}
            <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 h-10">
              <span className="text-[10px] text-slate-500 font-mono mr-1">AUDIO</span>
              <div className="flex items-end gap-1 h-5">
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
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${
              livePace.level === 'very_fast'
                ? 'bg-rose-950/80 border-rose-600 text-rose-300'
                : livePace.level === 'fast'
                ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-emerald-400'
            }`}>
              <Gauge className="w-4 h-4" />
              <div className="leading-tight">
                <div className="flex items-center gap-1 font-mono">
                  <span>{livePace.wpm || 0}</span>
                  <span className="text-[10px] font-normal text-slate-400">WPM</span>
                </div>
                <div className="text-[10px] opacity-90 font-sans truncate max-w-[140px]">
                  {livePace.labelVi}
                </div>
              </div>
            </div>

            {/* TTS Mute Toggle */}
            <button
              onClick={() => setIsTtsMuted(!isTtsMuted)}
              title={isTtsMuted ? "Bật giọng đọc đồng thời AI" : "Tắt giọng đọc đồng thời"}
              className={`p-2 rounded-xl border transition-all ${
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
                title="Xóa toàn bộ biên bản hội nghị"
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 transition-all"
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
              <span className="font-semibold">PHÁT HIỆN TỐC ĐỘ NÓI RẤT CAO ({livePace.wpm} WPM):</span>
              <span>Đang kích hoạt thuật toán phân tách mệnh đề ngữ nghĩa tự động để chống mất câu và duy trì độ chính xác của phụ gia ZDDP, PAO, chỉ số VI.</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-rose-900 font-mono text-[10px] uppercase font-bold text-white">Active</span>
          </div>
        )}
      </div>

      {/* Main Dual-Stream Teleprompter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Left Pane: Original Technical Speech Stream */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col h-[520px] shadow-lg">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Luồng Giọng Nói Gốc (Original Speech Stream)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {config.sourceLang.toUpperCase()} • Continuous Recognition
            </span>
          </div>

          {/* Transcript Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-sm">
            {chunks.length === 0 && !interimSpoken && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Radio className="w-10 h-10 text-slate-600 mb-3 animate-pulse" />
                <p className="font-medium text-slate-400">Chưa có luồng âm thanh nào được thu</p>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Nhấn <span className="text-cyan-400 font-semibold">"Bật Microphone Live"</span> để nói trực tiếp, hoặc nhấn <span className="text-indigo-400 font-semibold">"Thử Nghiệm Diễn Giả Nói Nhanh"</span> để lắng nghe bài giảng chuyên sâu về phụ gia ZDDP và dầu nhớt 0W-20.
                </p>
              </div>
            )}

            {chunks.map((chunk) => (
              <div 
                key={chunk.id} 
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all group"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-cyan-400 font-semibold">{chunk.timestamp}</span>
                    <span className="text-slate-500">•</span>
                    <span>{chunk.speaker}</span>
                  </div>
                  <button
                    onClick={() => copyChunk(chunk.id, chunk.originalText)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-200 transition-opacity"
                    title="Sao chép câu nói gốc"
                  >
                    {copiedId === chunk.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-slate-200 leading-relaxed">
                  {chunk.originalText}
                </p>

                {/* Detected Terms in this chunk */}
                {chunk.detectedTerms.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-900 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-slate-500 font-medium">Thuật ngữ:</span>
                    {chunk.detectedTerms.map((term, tIdx) => (
                      <button
                        key={tIdx}
                        onClick={() => handleTermClick(term)}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/60 text-cyan-300 font-mono font-medium transition-all"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Live Interim Streaming clause */}
            {interimSpoken && (
              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/60 animate-pulse">
                <div className="flex items-center gap-2 text-[11px] text-blue-400 font-mono mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                  <span>Đang nghe tiếp một mạch câu dài...</span>
                </div>
                <p className="text-blue-100 font-mono text-sm leading-relaxed">
                  {interimSpoken}
                  <span className="inline-block w-2 h-4 ml-1 bg-blue-400 animate-blink"></span>
                </p>
              </div>
            )}
            <div ref={scrollEndRef} />
          </div>
        </div>

        {/* Right Pane: AI Simultaneous Technical Translation */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col h-[520px] shadow-lg">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Bản Dịch Đồng Thời Kỹ Thuật (Simultaneous AI Translation)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80 font-semibold">
                {config.targetLang.toUpperCase()} • High Precision Engine
              </span>
            </div>
          </div>

          {/* Translation Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-sm">
            {chunks.length === 0 && !interimDraftVi && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Sparkles className="w-10 h-10 text-cyan-500/50 mb-3" />
                <p className="font-medium text-slate-400">Kênh phiên dịch đồng thời AI sẵn sàng</p>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Khi diễn giả bắt đầu phát biểu, bản dịch tức thời sẽ xuất hiện <span className="text-cyan-400 font-semibold">ngay từ từ đầu tiên</span> và liên tục được chuẩn hóa thuật ngữ hóa chất, dầu bôi trơn theo thời gian thực.
                </p>
              </div>
            )}

            {chunks.map((chunk) => (
              <div 
                key={`trans-${chunk.id}`} 
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-900/60 transition-all group"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-cyan-400 font-semibold">{chunk.timestamp}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-emerald-400 font-medium">Bản dịch chính thức</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {chunk.latencyMs && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {chunk.latencyMs}ms
                      </span>
                    )}
                    <button
                      onClick={() => playSpeechSynthesis(chunk.translatedText)}
                      className="text-slate-400 hover:text-cyan-300 transition-colors"
                      title="Phát âm thanh bản dịch"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => copyChunk(chunk.id, chunk.translatedText)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-200 transition-opacity"
                      title="Sao chép bản dịch"
                    >
                      {copiedId === chunk.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <p className="text-white font-medium leading-relaxed">
                  {chunk.translatedText}
                </p>
              </div>
            ))}

            {/* Instant First-Word Draft Translation in Action */}
            {interimDraftVi && (
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/80 animate-pulse">
                <div className="flex items-center justify-between text-[11px] text-cyan-300 font-mono mb-1">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    DỊCH TỨC THỜI TỪ ĐẦU TIÊN (0ms Instant Draft):
                  </span>
                  <span className="text-[10px] text-cyan-400/80 bg-cyan-900/50 px-1.5 py-0.5 rounded">
                    Chờ hoàn tất mệnh đề...
                  </span>
                </div>
                <p className="text-cyan-100 italic leading-relaxed">
                  "{interimDraftVi}..."
                </p>
              </div>
            )}
            <div ref={scrollEndRef} />
          </div>
        </div>
      </div>

      {/* Bottom Action Bar: Subtitle Export, Transcript Download, Send to Minutes */}
      {chunks.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Đã ghi nhận & phiên dịch đồng thời: <strong className="text-slate-200 font-mono">{chunks.length}</strong> câu dài kỹ thuật</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportSRT}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Xuất Phụ Đề SRT</span>
            </button>

            <button
              onClick={exportTranscript}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Tải Biên Bản Song Ngữ (TXT)</span>
            </button>

            <button
              onClick={() => {
                const fullText = chunks.map(c => `[${c.speaker}]: ${c.originalText} (Dịch: ${c.translatedText})`).join('\n\n');
                onSendToAnalytics(fullText);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bóc Tách Công Thức & Tạo Biên Bản Cuộc Họp</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
