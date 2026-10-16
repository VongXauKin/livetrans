import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Filter, 
  ChevronRight, 
  FlaskConical, 
  ShieldCheck, 
  Wrench, 
  Layers, 
  Scale,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { IndustryTerm } from '../types/index.ts';

interface GlossaryManagerProps {
  terms: IndustryTerm[];
  onAddTerm: (newTerm: IndustryTerm) => void;
  onSelectTerm: (term: IndustryTerm) => void;
}

const CATEGORIES: ('All' | IndustryTerm['category'])[] = [
  'All',
  'Base Oil',
  'Additive',
  'Tribology & Testing',
  'Blending Process',
  'Specifications',
];

export const GlossaryManager: React.FC<GlossaryManagerProps> = ({
  terms,
  onAddTerm,
  onSelectTerm,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | IndustryTerm['category']>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // New term form state
  const [newTerm, setNewTerm] = useState<Partial<IndustryTerm>>({
    term: '',
    vietnamese: '',
    english: '',
    category: 'Additive',
    chemicalFormula: '',
    astmStandard: '',
    definitionVi: '',
    definitionEn: '',
    treatRate: '',
  });

  const filteredTerms = terms.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.term.toLowerCase().includes(q) ||
      item.vietnamese.toLowerCase().includes(q) ||
      item.english.toLowerCase().includes(q) ||
      (item.chemicalFormula && item.chemicalFormula.toLowerCase().includes(q)) ||
      (item.astmStandard && item.astmStandard.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  const handleCreateTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.term || !newTerm.vietnamese) return;

    const termObj: IndustryTerm = {
      id: `custom-${Date.now()}`,
      term: newTerm.term,
      vietnamese: newTerm.vietnamese,
      english: newTerm.english || newTerm.term,
      category: (newTerm.category as IndustryTerm['category']) || 'Additive',
      chemicalFormula: newTerm.chemicalFormula || '',
      astmStandard: newTerm.astmStandard || '',
      definitionVi: newTerm.definitionVi || '',
      definitionEn: newTerm.definitionEn || '',
      treatRate: newTerm.treatRate || '',
    };

    onAddTerm(termObj);
    setShowAddModal(false);
    setNewTerm({
      term: '',
      vietnamese: '',
      english: '',
      category: 'Additive',
      chemicalFormula: '',
      astmStandard: '',
      definitionVi: '',
      definitionEn: '',
      treatRate: '',
    });
  };

  const getCategoryIcon = (category: IndustryTerm['category']) => {
    switch (category) {
      case 'Base Oil':
        return <Layers className="w-4 h-4 text-cyan-400" />;
      case 'Additive':
        return <FlaskConical className="w-4 h-4 text-amber-400" />;
      case 'Tribology & Testing':
        return <Scale className="w-4 h-4 text-emerald-400" />;
      case 'Blending Process':
        return <Wrench className="w-4 h-4 text-purple-400" />;
      case 'Specifications':
        return <ShieldCheck className="w-4 h-4 text-blue-400" />;
      default:
        return <BookOpen className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              Bộ Thuật Ngữ Chuyên Ngành Dầu Nhớt & Phối Trộn Hóa Chất ({terms.length} thuật ngữ)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Toàn bộ từ điển này được nhúng tự động vào mô hình Gemini để ưu tiên dịch chuẩn xác tuyệt đối các công thức hóa dầu và quy chuẩn ASTM.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Thuật Ngữ Doanh Nghiệp</span>
          </button>
        </div>

        {/* Filter controls */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên (ZDDP, PAO), hóa thức, tiêu chuẩn ASTM (D445, D2270)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat === 'All' ? 'Tất cả' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredTerms.map((term) => (
          <div
            key={term.id}
            onClick={() => onSelectTerm(term)}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800/90 hover:border-cyan-600/60 hover:bg-slate-850 transition-all cursor-pointer group flex flex-col justify-between shadow-lg"
          >
            <div>
              {/* Card Header: Term name & Category tag */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                    {getCategoryIcon(term.category)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors font-mono">
                      {term.term}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-sans">
                      {term.category}
                    </span>
                  </div>
                </div>

                {term.astmStandard && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-emerald-400 border border-emerald-900/60 shrink-0">
                    {term.astmStandard.split('/')[0].trim()}
                  </span>
                )}
              </div>

              {/* Vietnamese definition */}
              <p className="text-xs text-slate-300 font-medium line-clamp-2 mb-1.5">
                {term.vietnamese}
              </p>

              {/* Chemical Formula or Treat Rate */}
              <div className="space-y-1 mb-2">
                {term.chemicalFormula && (
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900/40">
                    <FlaskConical className="w-3 h-3 shrink-0" />
                    <span className="truncate">{term.chemicalFormula}</span>
                  </div>
                )}
                {term.treatRate && (
                  <div className="text-[10px] text-amber-300/90 font-mono">
                    Tỷ lệ phối trộn: <strong>{term.treatRate}</strong>
                  </div>
                )}
              </div>

              {/* Summary Description */}
              <p className="text-[11px] text-slate-400 line-clamp-2">
                {term.definitionVi}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-cyan-400 font-semibold">
              <span>Xem chi tiết cơ chế</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Term Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              Thêm Thuật Ngữ Kỹ Thuật / Phụ Gia Mới
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Thuật ngữ này sẽ được lưu trữ và lập tức áp dụng vào các phiên dịch cuộc họp và tài liệu tiếp theo.
            </p>

            <form onSubmit={handleCreateTerm} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Ký hiệu / Tên thuật ngữ *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: PAG, MoDTC, OCP..."
                    value={newTerm.term}
                    onChange={(e) => setNewTerm(prev => ({ ...prev, term: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phân loại</label>
                  <select
                    value={newTerm.category}
                    onChange={(e) => setNewTerm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="Base Oil">Dầu gốc (Base Oil)</option>
                    <option value="Additive">Phụ gia (Additive)</option>
                    <option value="Tribology & Testing">Ma sát học & Đo lường</option>
                    <option value="Blending Process">Kỹ thuật Phối trộn</option>
                    <option value="Specifications">Tiêu chuẩn kỹ thuật</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tên tiếng Việt chuẩn xác *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Molybdenum Dithiocarbamate (Phụ gia giảm ma sát hữu cơ)"
                  value={newTerm.vietnamese}
                  onChange={(e) => setNewTerm(prev => ({ ...prev, vietnamese: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Công thức hóa học / Viết tắt</label>
                  <input
                    type="text"
                    placeholder="VD: Mo2S2O2(S2CNR2)2"
                    value={newTerm.chemicalFormula}
                    onChange={(e) => setNewTerm(prev => ({ ...prev, chemicalFormula: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tiêu chuẩn ASTM / DIN</label>
                  <input
                    type="text"
                    placeholder="VD: ASTM D5185 / D445"
                    value={newTerm.astmStandard}
                    onChange={(e) => setNewTerm(prev => ({ ...prev, astmStandard: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tỷ lệ phối trộn khuyến nghị (Treat rate)</label>
                <input
                  type="text"
                  placeholder="VD: 0.2% - 0.5% wt"
                  value={newTerm.treatRate}
                  onChange={(e) => setNewTerm(prev => ({ ...prev, treatRate: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mô tả cơ chế kỹ thuật</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả tác dụng chống mài mòn, bôi trơn ranh giới hoặc tác động trong quá trình phối trộn..."
                  value={newTerm.definitionVi}
                  onChange={(e) => setNewTerm(prev => ({ ...prev, definitionVi: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/30"
                >
                  Lưu Thuật Ngữ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
