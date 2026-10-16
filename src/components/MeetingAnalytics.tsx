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
  Printer,
  FileText
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

  // Export as Plain Text File (.TXT)
  const exportTextFile = () => {
    if (!summary) return;
    const dateStr = new Date().toLocaleString('vi-VN');
    let txt = `========================================================================================\n`;
    txt += `                    BIÊN BẢN HỘI NGHỊ KỸ THUẬT & CÔNG THỨC PHỐI TRỘN\n`;
    txt += `                             PETROTRANS PRO AI SYSTEM\n`;
    txt += `========================================================================================\n`;
    txt += `Chuyên đề: ${summary.topic}\n`;
    txt += `Thời gian xuất biên bản: ${dateStr}\n`;
    txt += `Tiêu chuẩn áp dụng: ASTM International / API Specification / ILSAC Standard\n`;
    txt += `----------------------------------------------------------------------------------------\n\n`;

    txt += `1. TỔNG QUAN KỸ THUẬT & CƠ CHẾ BÔI TRƠN (TIẾNG VIỆT)\n`;
    txt += `${summary.summaryVi}\n\n`;

    txt += `2. EXECUTIVE SUMMARY (ENGLISH)\n`;
    txt += `${summary.summaryEn}\n\n`;

    txt += `3. BẢNG THÔNG SỐ PHỐI TRỘN & TIÊU CHUẨN ĐO LƯỜNG ASTM\n`;
    txt += `+-------------------------------------+--------------------+------------------------------------------------+\n`;
    txt += `| Thông số kỹ thuật                   | Giá trị / Ngưỡng   | Ý nghĩa kỹ thuật & Quy chuẩn ASTM              |\n`;
    txt += `+-------------------------------------+--------------------+------------------------------------------------+\n`;
    summary.blendingParameters.forEach((p) => {
      const param = p.parameter.padEnd(35).slice(0, 35);
      const val = p.value.padEnd(18).slice(0, 18);
      const notes = p.notes.padEnd(46).slice(0, 46);
      txt += `| ${param} | ${val} | ${notes} |\n`;
    });
    txt += `+-------------------------------------+--------------------+------------------------------------------------+\n\n`;

    txt += `4. HỆ HÓA CHẤT & DANH MỤC PHỤ GIA\n`;
    summary.chemicalFormulations.forEach((c, idx) => {
      txt += `  [${idx + 1}] ${c.chemical} (${c.concentration || 'Tỷ lệ khuyến nghị'})\n`;
      txt += `      Vai trò: ${c.role}\n`;
    });
    txt += `\n`;

    txt += `5. CẢNH BÁO KỸ THUẬT & NGUY CƠ SUY THOÁI\n`;
    summary.criticalWarnings.forEach((w) => {
      txt += `  [!] CẢNH BÁO: ${w}\n`;
    });
    txt += `\n`;

    txt += `6. KẾ HOẠCH HÀNH ĐỘNG & KIỂM TRA PHÒNG LAB QA/QC\n`;
    summary.actionItems.forEach((a, idx) => {
      txt += `  [ ] Bước ${idx + 1}: ${a}\n`;
    });
    txt += `\n`;
    txt += `========================================================================================\n`;
    txt += `Biên bản được tự động tổng hợp từ bản ghi âm và phiên dịch hội nghị kỹ thuật cao PetroTrans Pro.\n`;

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BienBan-KyThuat-${summary.topic.slice(0, 25).replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as Markdown File (.MD)
  const exportMarkdown = () => {
    if (!summary) return;
    let md = `# BIÊN BẢN HỘI NGHỊ KỸ THUẬT & BÓC TÁCH CÔNG THỨC PHỐI TRỘN\n\n`;
    md += `**Chuyên đề:** ${summary.topic}\n\n`;
    md += `**Thời gian tạo:** ${new Date().toLocaleString('vi-VN')}\n\n`;
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

  // Generate Styled Corporate PDF / Print Document
  const exportPDF = () => {
    if (!summary) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Biên Bản Kỹ Thuật - ${summary.topic}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.5;
      font-size: 13px;
      margin: 0;
      padding: 0;
    }
    .header {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 11px;
      color: #0284c7;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 18px;
    }
    .topic-title {
      font-size: 16px;
      font-weight: 700;
      color: #0369a1;
      margin-top: 4px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1e293b;
      border-left: 4px solid #0284c7;
      padding-left: 8px;
      margin: 18px 0 8px 0;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    .summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
    }
    .summary-card h4 {
      margin: 0 0 6px 0;
      font-size: 11px;
      color: #475569;
      text-transform: uppercase;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 12px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
    }
    .warning-box {
      background: #fff1f2;
      border: 1px solid #fecdd3;
      border-left: 4px solid #e11d48;
      border-radius: 6px;
      padding: 10px 14px;
      margin-top: 10px;
      color: #9f1239;
    }
    .action-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-left: 4px solid #16a34a;
      border-radius: 6px;
      padding: 10px 14px;
      margin-top: 10px;
      color: #166534;
    }
    .footer-signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 35px;
      padding-top: 15px;
      border-top: 1px dashed #cbd5e1;
      font-size: 12px;
      page-break-inside: avoid;
    }
    .sig-block {
      text-align: center;
      width: 200px;
    }
    .sig-space {
      height: 50px;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-title">PETROTRANS PRO &bull; BÁO CÁO KỸ THUẬT AI</div>
      <div class="brand-sub">Hệ Thống Phân Tích & Bóc Tách Công Thức Dầu Nhờn Chuyên Sâu</div>
    </div>
    <div style="text-align: right; font-size: 11px; color: #64748b;">
      <div>Thời gian: ${new Date().toLocaleString('vi-VN')}</div>
      <div>Tiêu chuẩn: ASTM &bull; API &bull; ILSAC</div>
    </div>
  </div>

  <div class="meta-box">
    <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Chuyên đề hội nghị kỹ thuật:</div>
    <div class="topic-title">${summary.topic}</div>
  </div>

  <div class="section-title">1. TỔNG QUAN KỸ THUẬT & EXECUTIVE SUMMARY</div>
  <div class="summary-grid">
    <div class="summary-card">
      <h4>Tổng Quan Kỹ Thuật (Tiếng Việt)</h4>
      <div style="white-space: pre-wrap; font-size: 12px;">${summary.summaryVi}</div>
    </div>
    <div class="summary-card">
      <h4>Executive Summary (English)</h4>
      <div style="white-space: pre-wrap; font-size: 12px;">${summary.summaryEn}</div>
    </div>
  </div>

  <div class="section-title">2. BẢNG THÔNG SỐ PHỐI TRỘN & TIÊU CHUẨN ĐO LƯỜNG ASTM</div>
  <table>
    <thead>
      <tr>
        <th style="width: 35%;">Thông số kỹ thuật</th>
        <th style="width: 25%;">Giá trị / Ngưỡng</th>
        <th style="width: 40%;">Ý nghĩa kỹ thuật & Quy chuẩn ASTM</th>
      </tr>
    </thead>
    <tbody>
      ${summary.blendingParameters.map(p => `
        <tr>
          <td><strong>${p.parameter}</strong></td>
          <td style="color: #0369a1; font-weight: 600;">${p.value}</td>
          <td>${p.notes}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="section-title">3. HỆ HÓA CHẤT & DANH MỤC PHỤ GIA</div>
  <table>
    <thead>
      <tr>
        <th style="width: 40%;">Tên Hóa Chất / Phụ Gia</th>
        <th style="width: 25%;">Hàm lượng / Tỷ lệ</th>
        <th style="width: 35%;">Vai trò chức năng</th>
      </tr>
    </thead>
    <tbody>
      ${summary.chemicalFormulations.map(c => `
        <tr>
          <td><strong>${c.chemical}</strong></td>
          <td>${c.concentration || 'Tỷ lệ khuyến nghị'}</td>
          <td>${c.role}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="section-title">4. CẢNH BÁO KỸ THUẬT & KIỂM SOÁT SUY THOÁI</div>
  <div class="warning-box">
    <ul style="margin: 0; padding-left: 18px;">
      ${summary.criticalWarnings.map(w => `<li style="margin-bottom: 4px;"><strong>CẢNH BÁO:</strong> ${w}</li>`).join('')}
    </ul>
  </div>

  <div class="section-title">5. KẾ HOẠCH HÀNH ĐỘNG & THỬ NGHIỆM PHÒNG LAB QA/QC</div>
  <div class="action-box">
    <ul style="margin: 0; padding-left: 18px;">
      ${summary.actionItems.map(a => `<li style="margin-bottom: 4px;">[Xác nhận] ${a}</li>`).join('')}
    </ul>
  </div>

  <div class="footer-signatures">
    <div class="sig-block">
      <div><strong>Chuyên Viên Phân Tích AI</strong></div>
      <div style="font-size: 11px; color: #64748b;">Hệ thống PetroTrans Pro</div>
      <div class="sig-space"></div>
      <div><em>Đã xác thực tự động</em></div>
    </div>
    <div class="sig-block">
      <div><strong>Giám Đốc Kỹ Thuật / QA Trưởng</strong></div>
      <div style="font-size: 11px; color: #64748b;">Phê duyệt công thức phối trộn</div>
      <div class="sig-space"></div>
      <div><em>(Ký & ghi rõ họ tên)</em></div>
    </div>
  </div>
</body>
</html>`;

    // Open clean print window and invoke print to PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      // Fallback: print current window or download as standalone HTML
      window.print();
    }
  };

  // Direct download standalone HTML report file
  const exportHTMLReport = () => {
    if (!summary) return;
    const dateStr = new Date().toLocaleString('vi-VN');
    const content = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Báo Cáo Kỹ Thuật - ${summary.topic}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 30px; max-width: 900px; margin: auto; }
    h1 { color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 10px; font-size: 22px; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
    th { background: #f1f5f9; }
    .warn { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 12px; margin-top: 15px; color: #9f1239; }
    .action { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin-top: 15px; color: #166534; }
  </style>
</head>
<body>
  <h1>BIÊN BẢN HỘI NGHỊ KỸ THUẬT & CÔNG THỨC PHỐI TRỘN</h1>
  <div class="box">
    <div><strong>Chuyên đề:</strong> ${summary.topic}</div>
    <div><strong>Thời gian xuất:</strong> ${dateStr}</div>
    <div><strong>Tiêu chuẩn:</strong> ASTM International &bull; API &bull; ILSAC</div>
  </div>
  <h2>1. Tổng quan Kỹ thuật</h2>
  <div class="box">${summary.summaryVi}</div>
  <h2>2. Executive Summary</h2>
  <div class="box">${summary.summaryEn}</div>
  <h2>3. Thông số phối trộn</h2>
  <table>
    <tr><th>Thông số</th><th>Giá trị</th><th>Ghi chú & ASTM</th></tr>
    ${summary.blendingParameters.map(p => `<tr><td>${p.parameter}</td><td>${p.value}</td><td>${p.notes}</td></tr>`).join('')}
  </table>
  <h2>4. Hệ Hóa chất & Phụ gia</h2>
  <table>
    <tr><th>Hóa chất</th><th>Tỷ lệ</th><th>Vai trò</th></tr>
    ${summary.chemicalFormulations.map(c => `<tr><td>${c.chemical}</td><td>${c.concentration || 'N/A'}</td><td>${c.role}</td></tr>`).join('')}
  </table>
  <div class="warn">
    <h3>Cảnh báo Kỹ thuật:</h3>
    <ul>${summary.criticalWarnings.map(w => `<li>${w}</li>`).join('')}</ul>
  </div>
  <div class="action">
    <h3>Kế hoạch hành động & QA/QC:</h3>
    <ul>${summary.actionItems.map(a => `<li>${a}</li>`).join('')}</ul>
  </div>
</body>
</html>`;
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao-Cao-Ky-Thuat-${summary.topic.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Transcript Input Card - Hidden when printing */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl print:hidden">
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

          <div className="flex items-center gap-2">
            {!transcript.trim() && (
              <button
                onClick={() => setTranscript(`Diễn giả Chuyên gia: Now, when you look at formulating ultra-low viscosity engine oils like SAE 0W-20 under the API SP and ILSAC GF-6A specifications, our primary challenge is maintaining HTHS viscosity above 2.6 centipoise while simultaneously minimizing hydrodynamic drag. To achieve this, we cannot rely solely on conventional Group III mineral cuts; we must engineer a balanced binary blend utilizing Group III+ Gas-to-Liquid base stock combined with approximately 20 to 25 percent Group IV Polyalphaolefin 4 cSt. Notice that when we introduce secondary Zinc Dialkyldithiophosphate at 800 parts per million phosphorus, the reaction kinetics during boundary lubrication generate a nanometer-scale polyphosphate glassy tribofilm that drastically reduces wear scar diameters under the ASTM D4172 test. Furthermore, kettle temperature must be maintained strictly between 58 to 62 degrees Celsius because exceeding 65 degrees risks thermal degradation of the Olefin Copolymer Viscosity Index Improvers.`)}
                className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-semibold cursor-pointer"
              >
                Nạp Bài Giảng Mẫu 0W-20
              </button>
            )}

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !transcript.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20 shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAnalyzing ? 'Đang phân tích chuyên gia...' : 'Tạo Biên Bản & Bóc Tách'}</span>
            </button>
          </div>
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
        <div className="space-y-4 animate-fadeIn print:text-black print:bg-white">
          {/* Header Action Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg print:border-none print:shadow-none print:p-0 print:mb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 font-bold print:border-black print:text-black print:bg-gray-200">
                Chuyên đề đã định danh
              </span>
              <h3 className="text-base font-bold text-white mt-1 print:text-black print:text-xl">
                {summary.topic}
              </h3>
            </div>

            {/* Download & Print Buttons (Hidden during print) */}
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <button
                onClick={exportPDF}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20 cursor-pointer"
                title="Tải hoặc In Biên bản thành file PDF chuẩn khổ A4"
              >
                <Printer className="w-4 h-4" />
                <span>Xuất PDF / In Biên Bản</span>
              </button>

              <button
                onClick={exportTextFile}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-emerald-700/80 hover:border-emerald-500 text-emerald-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="Tải văn bản thô đầy đủ bảng biểu và danh mục (.txt)"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Tải File .TXT</span>
              </button>

              <button
                onClick={exportHTMLReport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all shadow-sm cursor-pointer"
                title="Tải file báo cáo offline tự chứa (.html)"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Báo Cáo HTML</span>
              </button>

              <button
                onClick={exportMarkdown}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all shadow-sm cursor-pointer"
                title="Tải file Markdown / Word (.md)"
              >
                <Download className="w-4 h-4 text-slate-400" />
                <span>Xuất Markdown</span>
              </button>
            </div>
          </div>

          {/* Bilingual Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg print:border print:border-gray-300 print:bg-white print:p-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-2 print:text-black">
                <FileCheck2 className="w-4 h-4 text-cyan-400 print:text-black" />
                Tổng Quan Kỹ Thuật (Tiếng Việt)
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap print:text-gray-900">
                {summary.summaryVi}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg print:border print:border-gray-300 print:bg-white print:p-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2 flex items-center gap-2 print:text-black">
                <FileCheck2 className="w-4 h-4 text-blue-400 print:text-black" />
                Executive Summary (English)
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans print:text-gray-900">
                {summary.summaryEn}
              </p>
            </div>
          </div>

          {/* Table: Blending Parameters */}
          {summary.blendingParameters && summary.blendingParameters.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg print:border print:border-gray-300 print:bg-white print:p-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2 print:text-black">
                <Table className="w-4 h-4 text-cyan-400 print:text-black" />
                Bảng Thông Số Phối Trộn & Tiêu Chuẩn Kỹ Thuật Đo Lường
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse print:text-black">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono print:border-black print:bg-gray-100 print:text-black">
                      <th className="py-2.5 px-3">Thông số kỹ thuật</th>
                      <th className="py-2.5 px-3">Giá trị / Ngưỡng</th>
                      <th className="py-2.5 px-3">Ý nghĩa kỹ thuật & Quy chuẩn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans print:divide-gray-300">
                    {summary.blendingParameters.map((param, pIdx) => (
                      <tr key={pIdx} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-cyan-300 font-mono print:text-black">
                          {param.parameter}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold print:text-black">
                          {param.value}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 print:text-gray-800">
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
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg print:border print:border-gray-300 print:bg-white print:p-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2 print:text-black">
                <FlaskConical className="w-4 h-4 text-amber-400 print:text-black" />
                Hệ Hóa Chất & Phụ Gia Định Lượng Trong Bài Giảng
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 print:grid-cols-2 print:gap-2">
                {summary.chemicalFormulations.map((chem, cIdx) => (
                  <div key={cIdx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 print:border-gray-300 print:bg-gray-50">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-white text-xs font-mono print:text-black">{chem.chemical}</span>
                      {chem.concentration && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 print:border-gray-400 print:text-black print:bg-gray-200">
                          {chem.concentration}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug print:text-gray-700">
                      {chem.role}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings & Action Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4">
            {/* Critical Warnings */}
            {summary.criticalWarnings && summary.criticalWarnings.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/60 shadow-lg print:border print:border-gray-400 print:bg-white print:p-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 mb-3 flex items-center gap-2 print:text-black">
                  <AlertTriangle className="w-4 h-4 text-rose-400 print:text-black" />
                  Cảnh Báo Kỹ Thuật & Giới Hạn Quá Trình
                </h4>
                <ul className="space-y-2 text-xs text-rose-200 print:text-gray-900">
                  {summary.criticalWarnings.map((warn, wIdx) => (
                    <li key={wIdx} className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold print:text-black">•</span>
                      <span>{warn}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {summary.actionItems && summary.actionItems.length > 0 && (
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/60 shadow-lg print:border print:border-gray-400 print:bg-white print:p-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-3 flex items-center gap-2 print:text-black">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 print:text-black" />
                  Kế Hoạch Kiểm Soát Chất Lượng & Thử Nghiệm
                </h4>
                <ul className="space-y-2 text-xs text-emerald-200 print:text-gray-900">
                  {summary.actionItems.map((act, aIdx) => (
                    <li key={aIdx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold print:text-black">✓</span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Bottom Download & Export Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg print:hidden">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Biên bản hội nghị đã hoàn thiện & chuẩn hóa theo chuẩn ASTM / API</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={exportPDF}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Xuất PDF / In Khổ A4</span>
              </button>

              <button
                onClick={exportTextFile}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-emerald-600 text-emerald-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Tải File .TXT Đầy Đủ</span>
              </button>

              <button
                onClick={exportHTMLReport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Báo Cáo HTML</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
