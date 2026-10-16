import React, { useState } from 'react';
import { 
  Sparkles, 
  FileCheck2, 
  AlertTriangle, 
  FlaskConical, 
  CheckCircle2, 
  Download, 
  Sliders, 
  Table,
  Info,
  Clock,
  Printer
} from 'lucide-react';
import { MeetingSummary } from '../types/index.ts';

interface MeetingAnalyticsProps {
  initialTranscript: string;
}

export const MeetingAnalytics: React.FC<MeetingAnalyticsProps> = ({
  initialTranscript,
}) => {
  const [transcript, setTranscript] = useState(initialTranscript);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [summary, setSummary] = useState<MeetingSummary | null>(null);

  const handleAnalyze = async () => {
    if (!transcript.trim()) return;

    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          title: 'Hội thảo Chuyên sâu: Công nghệ Phối trộn Dầu nhờn & Phụ gia Tribology',
        }),
      });

      const data = await res.json();
      setSummary(data);
    } catch (e) {
      console.error('Failed to analyze meeting:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportMarkdown = () => {
    if (!summary) return;
    let md = `# BIÊN BẢN HỘI NGHỊ KỸ THUẬT & BÓC TÁCH CÔNG THỨC PHỐI TRỘN\n\n`;
    md += `**Chuyên đề:** ${summary.topic}\n\n`;
    md += `## 1. Tóm tắt Kỹ thuật (Tiếng Việt)\n${summary.summaryVi}\n\n`;
    md += `## 2. Technical Summary (English)\n${summary.summaryEn}\n\n`;
    md += `## 3. Bảng Thông Số Phối Trộn & Tiêu Chuẩn ASTM\n`;
    md += `| Thông số kỹ thuật | Giá trị / Khoảng kiểm soát | Ý nghĩa kỹ thuật & ASTM |\n`;
    md += `|---|---|---|\n`;
    summary.blendingParameters.forEach((p) => {
      md += `| ${p.parameter} | ${p.value} | ${p.notes} |\n`;
    });
    md += `\n## 4. Danh mục Hóa chất & Phụ gia\n`;
    summary.chemicalFormulations.forEach((c) => {
      md += `- **${c.chemical}** (${c.concentration || 'N/A'}): ${c.role}\n`;
    });
    md += `\n## 5. Cảnh báo Kỹ thuật & Kiểm soát Rủi ro\n`;
    summary.criticalWarnings.forEach((w) => {
      md += `- ⚠️ ${w}\n`;
    });
    md += `\n## 6. Kế hoạch Hành động & Thử nghiệm Phòng Lab\n`;
    summary.actionItems.forEach((a) => {
      md += `- [ ] ${a}\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bien-Ban-Ky-Thuat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Transcript Input Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Bóc Tách Biên Bản Kỹ Thuật & Công Thức Phối Trộn Tự Động
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              AI Gemini sẽ quét toàn bộ bài giảng tốc độ cao, trích xuất bảng thông số nhiệt độ, độ nhớt, tỷ lệ phụ gia và cảnh báo an toàn sản xuất.
            </p>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !transcript.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAnalyzing ? 'Đang phân tích chuyên gia...' : 'Tạo Biên Bản & Bóc Tách'}</span>
          </button>
        </div>

        <textarea
          rows={5}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Nội dung bài giảng hội nghị thu từ micro hoặc tài liệu sẽ hiển thị ở đây để phân tích..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed"
        />
      </div>

      {/* Analysis Results Display */}
      {summary && (
        <div className="space-y-4 animate-fadeIn">
          {/* Header Action Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 font-bold">
                Chuyên đề đã định danh
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                {summary.topic}
              </h3>
            </div>

            <button
              onClick={exportMarkdown}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all shadow-sm shrink-0"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Xuất Biên Bản Markdown / Word</span>
            </button>
          </div>

          {/* Bilingual Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4" />
                Tổng Quan Kỹ Thuật (Tiếng Việt)
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {summary.summaryVi}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4" />
                Executive Summary (English)
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                {summary.summaryEn}
              </p>
            </div>
          </div>

          {/* Table: Blending Parameters */}
          {summary.blendingParameters && summary.blendingParameters.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                <Table className="w-4 h-4 text-cyan-400" />
                Bảng Thông Số Phối Trộn & Tiêu Chuẩn Kỹ Thuật Đo Lường
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono">
                      <th className="py-2.5 px-3">Thông số kỹ thuật</th>
                      <th className="py-2.5 px-3">Giá trị / Ngưỡng</th>
                      <th className="py-2.5 px-3">Ý nghĩa kỹ thuật & Quy chuẩn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {summary.blendingParameters.map((param, pIdx) => (
                      <tr key={pIdx} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-cyan-300 font-mono">
                          {param.parameter}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">
                          {param.value}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {param.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Chemical Formulations & Additive Cards */}
          {summary.chemicalFormulations && summary.chemicalFormulations.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-amber-400" />
                Hệ Hóa Chất & Phụ Gia Định Lượng Trong Bài Giảng
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {summary.chemicalFormulations.map((chem, cIdx) => (
                  <div key={cIdx} className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-white text-xs font-mono">{chem.chemical}</span>
                      {chem.concentration && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                          {chem.concentration}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {chem.role}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings & Action Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Critical Warnings */}
            {summary.criticalWarnings && summary.criticalWarnings.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/60 shadow-lg">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Cảnh Báo Kỹ Thuật & Giới Hạn Quá Trình
                </h4>
                <ul className="space-y-2 text-xs text-rose-200">
                  {summary.criticalWarnings.map((warn, wIdx) => (
                    <li key={wIdx} className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{warn}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {summary.actionItems && summary.actionItems.length > 0 && (
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/60 shadow-lg">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Kế Hoạch Kiểm Soát Chất Lượng & Thử Nghiệm
                </h4>
                <ul className="space-y-2 text-xs text-emerald-200">
                  {summary.actionItems.map((act, aIdx) => (
                    <li key={aIdx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
