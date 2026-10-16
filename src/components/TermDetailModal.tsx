import React from 'react';
import { 
  X, 
  FlaskConical, 
  Scale, 
  Layers, 
  ShieldCheck, 
  Wrench, 
  Copy, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';
import { IndustryTerm } from '../types/index.ts';

interface TermDetailModalProps {
  term: IndustryTerm | null;
  onClose: () => void;
}

export const TermDetailModal: React.FC<TermDetailModalProps> = ({
  term,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!term) return null;

  const handleCopy = () => {
    const text = `${term.term} - ${term.vietnamese}\nCông thức: ${term.chemicalFormula || 'N/A'}\nTiêu chuẩn: ${term.astmStandard || 'N/A'}\nĐịnh nghĩa: ${term.definitionVi}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
            {term.category}
          </span>
          {term.astmStandard && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              {term.astmStandard}
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold text-white font-mono flex items-center gap-2">
          {term.term}
        </h3>
        <p className="text-xs text-slate-300 font-medium mt-0.5">
          {term.vietnamese}
        </p>

        {/* Chemical formula & treat rate block */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          {term.chemicalFormula && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <FlaskConical className="w-3.5 h-3.5 text-cyan-400" /> Cấu trúc / Công thức hóa học:
              </span>
              <span className="font-mono text-cyan-300 font-semibold">{term.chemicalFormula}</span>
            </div>
          )}

          {term.treatRate && (
            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-900">
              <span className="text-slate-400 font-medium">Tỷ lệ phối trộn khuyến nghị (Treat rate):</span>
              <span className="font-mono text-amber-300 font-bold">{term.treatRate}</span>
            </div>
          )}
        </div>

        {/* Deep Explanations */}
        <div className="mt-4 space-y-3">
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Cơ chế Hoạt động & Bôi trơn Kỹ thuật
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
              {term.definitionVi}
            </p>
          </div>

          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              English Technical Specification
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 font-sans">
              {term.definitionEn}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép thông tin'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/30"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
