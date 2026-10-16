import React, { useState } from 'react';
import { 
  X, 
  History, 
  Clock, 
  FileText, 
  Download, 
  Trash2, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  Gauge, 
  Calendar,
  Layers,
  Search,
  ExternalLink,
  Printer,
  ChevronLeft
} from 'lucide-react';
import { SavedMeetingSession, TranslationChunk } from '../types/index.ts';
import { exportSessionToText, exportSessionToHTML, exportSessionToSRT } from '../services/sessionStorage.ts';

interface SessionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SavedMeetingSession[];
  onLoadSession: (session: SavedMeetingSession) => void;
  onSendToAnalytics: (transcript: string) => void;
  onDeleteSession: (id: string) => void;
  onClearAllSessions?: () => void;
}

export const SessionHistoryModal: React.FC<SessionHistoryModalProps> = ({
  isOpen,
  onClose,
  sessions,
  onLoadSession,
  onSendToAnalytics,
  onDeleteSession,
  onClearAllSessions,
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    sessions[0]?.id || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  if (!isOpen) return null;

  const filteredSessions = sessions.filter(s => {
    const q = searchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) ||
           s.dateStr.toLowerCase().includes(q) ||
           s.detectedTerms.some(t => t.toLowerCase().includes(q));
  });

  const selectedSession = sessions.find(s => s.id === selectedSessionId) || sessions[0];

  const handleDownloadTxt = (session: SavedMeetingSession) => {
    const text = exportSessionToText(session);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BienBan-${session.title.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}-${session.dateStr.replace(/\//g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSrt = (session: SavedMeetingSession) => {
    const srtContent = exportSessionToSRT(session);
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Subtitles-${session.title.slice(0, 25).replace(/[^a-zA-Z0-9]/g, '_')}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = (session: SavedMeetingSession) => {
    const html = exportSessionToHTML(session);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full h-[90vh] max-h-[750px] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800/80 text-cyan-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Lịch Sử Các Phiên Dịch Trực Tuyến
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-normal">
                  {sessions.length} phiên đã lưu
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Toàn bộ dữ liệu phiên họp được lưu trữ an toàn trong bộ nhớ cục bộ (Local Storage).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search bar */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800/80">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm phiên theo tiêu đề, ngày họp hoặc thuật ngữ dầu nhớt (ZDDP, HTHS, 0W-20)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Content Body: Master-Detail List with Mobile View Switcher */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
          
          {/* Left Session List (5 cols on desktop, full on mobile when mobileView === 'list') */}
          <div className={`${mobileView === 'list' ? 'block' : 'hidden md:block'} md:col-span-5 border-r border-slate-800 overflow-y-auto divide-y divide-slate-800/60 bg-slate-950/30 h-full`}>
            {filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Chưa tìm thấy phiên họp phù hợp với từ khóa tìm kiếm.
              </div>
            ) : (
              filteredSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => {
                    setSelectedSessionId(session.id);
                    setMobileView('detail');
                  }}
                  className={`p-3.5 cursor-pointer transition-all ${
                    selectedSession?.id === session.id
                      ? 'bg-cyan-950/40 border-l-4 border-l-cyan-500 text-white'
                      : 'hover:bg-slate-850/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-cyan-400" />
                      {session.dateStr}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {session.timestamp}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs line-clamp-2 leading-snug mb-1.5">
                    {session.title}
                  </h4>

                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-cyan-300">
                      {session.chunks.length} câu dịch
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-amber-300">
                      ~{session.averageWpm} WPM
                    </span>
                    <span className="text-slate-500 font-mono uppercase">
                      {session.sourceLang} → {session.targetLang}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right Session Preview & Actions (7 cols on desktop, full on mobile when mobileView === 'detail') */}
          <div className={`${mobileView === 'detail' ? 'flex' : 'hidden md:flex'} md:col-span-7 flex-col bg-slate-900/60 overflow-hidden h-full`}>
            {selectedSession ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Mobile Back to List button */}
                <div className="md:hidden px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => setMobileView('list')}
                    className="flex items-center gap-1 text-xs text-cyan-400 font-semibold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Quay lại danh sách phiên</span>
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {selectedSession.chunks.length} câu dịch
                  </span>
                </div>

                {/* Session Details Header */}
                <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {selectedSession.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                        <span>Ngày: <strong className="text-slate-200">{selectedSession.dateStr}</strong></span>
                        <span>•</span>
                        <span>Giờ: <strong className="text-slate-200">{selectedSession.timestamp}</strong></span>
                        <span>•</span>
                        <span>Tốc độ: <strong className="text-amber-400">{selectedSession.averageWpm} WPM</strong></span>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteSession(selectedSession.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                      title="Xóa phiên họp này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Detected terms pills */}
                  {selectedSession.detectedTerms && selectedSession.detectedTerms.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-medium">Thuật ngữ đã bóc tách:</span>
                      {selectedSession.detectedTerms.map((t, idx) => (
                        <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Quick Action Buttons */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        onLoadSession(selectedSession);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Tải Vào Phòng Dịch</span>
                    </button>

                    <button
                      onClick={() => {
                        const transcript = selectedSession.chunks
                          .map(c => `[${c.speaker}]: ${c.originalText} (Dịch: ${c.translatedText})`)
                          .join('\n\n');
                        onSendToAnalytics(transcript);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Bóc Tách Biên Bản</span>
                    </button>

                    <button
                      onClick={() => handleExportPDF(selectedSession)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Xuất PDF / In</span>
                    </button>

                    <button
                      onClick={() => handleDownloadTxt(selectedSession)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                      <span>Tải File .TXT</span>
                    </button>

                    <button
                      onClick={() => handleDownloadSrt(selectedSession)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tải Phụ Đề .SRT</span>
                    </button>
                  </div>
                </div>

                {/* Chunks List Viewer */}
                <div className="flex-1 p-4 overflow-y-auto space-y-2.5 text-xs">
                  {selectedSession.chunks.map((chunk, idx) => (
                    <div key={chunk.id || idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
                        <span>#{idx + 1} • {chunk.timestamp}</span>
                        <span className="text-amber-400">{chunk.wpm} WPM</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed mb-1.5">
                        <span className="text-slate-500 font-mono uppercase mr-1">EN:</span>
                        {chunk.originalText}
                      </p>
                      <p className="text-cyan-200 font-medium leading-relaxed">
                        <span className="text-cyan-400 font-mono uppercase mr-1">VI:</span>
                        {chunk.translatedText}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs p-6 text-center">
                Chọn một phiên họp từ danh sách bên trái để xem nội dung
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>Dữ liệu lưu trữ tự động trong LocalStorage trên thiết bị</span>
            {onClearAllSessions && sessions.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử các phiên dịch?')) {
                    onClearAllSessions();
                  }
                }}
                className="text-rose-400 hover:text-rose-300 underline font-mono text-[11px]"
              >
                Xóa tất cả
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
