import { SavedMeetingSession, TranslationChunk } from '../types/index.ts';

const SESSIONS_STORAGE_KEY = 'petrotrans_meeting_history_v1';

export const INITIAL_DEMO_SESSIONS: SavedMeetingSession[] = [
  {
    id: 'session-demo-0w20',
    title: 'Hội Thảo Kỹ Thuật: Tối Ưu Hóa Phối Trộn Dầu Động Cơ SAE 0W-20 & Phụ Gia ZDDP',
    timestamp: '10:15 - 10:45',
    dateStr: '15/10/2026',
    averageWpm: 182,
    sourceLang: 'en',
    targetLang: 'vi',
    detectedTerms: ['ZDDP', 'PAO', 'Kinematic Viscosity (KV40 / KV100)', 'HTHS Viscosity', 'Viscosity Index (VI)', 'Shear Thinning / SSI'],
    chunks: [
      {
        id: 'c-1',
        timestamp: '10:16:02',
        speaker: 'Diễn giả Chuyên gia (Lecturer)',
        originalText: 'Now, when you look at formulating ultra-low viscosity engine oils like SAE 0W-20 under the API SP and ILSAC GF-6A specifications, our primary challenge is maintaining HTHS viscosity above 2.6 centipoise while simultaneously minimizing hydrodynamic drag.',
        translatedText: 'Giờ đây, khi xem xét việc thiết lập công thức dầu động cơ độ nhớt cực thấp SAE 0W-20 theo các tiêu chuẩn API SP và ILSAC GF-6A, thách thức cốt lõi của chúng ta là duy trì độ nhớt HTHS trên 2,6 centipoise đồng thời giảm thiểu tối đa lực cản thủy động học.',
        isInterim: false,
        isFinal: true,
        wpm: 185,
        detectedTerms: ['HTHS Viscosity', 'Kinematic Viscosity (KV40 / KV100)']
      },
      {
        id: 'c-2',
        timestamp: '10:16:25',
        speaker: 'Diễn giả Chuyên gia (Lecturer)',
        originalText: 'To achieve this, we cannot rely solely on conventional Group III mineral cuts; we must engineer a balanced binary blend utilizing Group III+ Gas-to-Liquid base stock combined with approximately 20 to 25 percent Group IV Polyalphaolefin 4 cSt.',
        translatedText: 'Để đạt được điều này, chúng ta không thể chỉ dựa vào các loại dầu gốc khoáng Nhóm III thông thường; chúng ta phải thiết kế một hỗn hợp nhị phân cân bằng, sử dụng dầu gốc Nhóm III+ công nghệ Gas-to-Liquid kết hợp với khoảng 20 đến 25 phần trăm Polyalphaolefin Nhóm IV có độ nhớt 4 cSt.',
        isInterim: false,
        isFinal: true,
        wpm: 178,
        detectedTerms: ['PAO', 'Group III+']
      },
      {
        id: 'c-3',
        timestamp: '10:17:05',
        speaker: 'Diễn giả Chuyên gia (Lecturer)',
        originalText: 'Notice that when we introduce secondary Zinc Dialkyldithiophosphate at 800 parts per million phosphorus, the reaction kinetics during boundary lubrication generate a nanometer-scale polyphosphate glassy tribofilm that drastically reduces wear scar diameters under the ASTM D4172 test.',
        translatedText: 'Hãy lưu ý rằng khi chúng ta đưa vào Zinc Dialkyldithiophosphate bậc hai ở hàm lượng 800 ppm phốt pho, động học phản ứng trong điều kiện bôi trơn ranh giới sẽ tạo ra một màng ma sát (tribofilm) dạng thủy tinh polyphosphate ở kích thước nanomet, giúp giảm đáng kể đường kính vết xước mài mòn theo phép thử ASTM D4172.',
        isInterim: false,
        isFinal: true,
        wpm: 190,
        detectedTerms: ['ZDDP', 'Four-Ball Wear & EP Test']
      }
    ]
  }
];

export function getSavedSessions(): SavedMeetingSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_SESSIONS));
      return INITIAL_DEMO_SESSIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_DEMO_SESSIONS;
  } catch (e) {
    console.warn('Could not read saved sessions from localStorage:', e);
    return INITIAL_DEMO_SESSIONS;
  }
}

export function saveMeetingSession(session: SavedMeetingSession): SavedMeetingSession[] {
  const current = getSavedSessions();
  const filtered = current.filter(s => s.id !== session.id);
  const updated = [session, ...filtered];
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not save session to localStorage:', e);
  }
  return updated;
}

export function deleteSavedSession(id: string): SavedMeetingSession[] {
  const current = getSavedSessions();
  const updated = current.filter(s => s.id !== id);
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not delete session from localStorage:', e);
  }
  return updated;
}

export function clearAllSavedSessions(): SavedMeetingSession[] {
  try {
    localStorage.removeItem(SESSIONS_STORAGE_KEY);
  } catch (e) {
    console.warn('Could not clear sessions from localStorage:', e);
  }
  return [];
}

export function exportSessionToText(session: SavedMeetingSession): string {
  let txt = `======================================================================\n`;
  txt += `BIÊN BẢN PHIÊN DỊCH TRỰC TUYẾN - PETROTRANS PRO AI\n`;
  txt += `======================================================================\n`;
  txt += `Chuyên đề: ${session.title}\n`;
  txt += `Ngày họp: ${session.dateStr} | Thời gian: ${session.timestamp}\n`;
  txt += `Tốc độ phát biểu trung bình: ${session.averageWpm} WPM (Diễn giả kỹ thuật cao)\n`;
  txt += `Cặp ngôn ngữ: ${session.sourceLang.toUpperCase()} -> ${session.targetLang.toUpperCase()}\n`;
  txt += `Tổng số câu dịch: ${session.chunks.length} câu\n`;
  txt += `Thuật ngữ định danh: ${session.detectedTerms.join(', ') || 'N/A'}\n`;
  txt += `----------------------------------------------------------------------\n\n`;

  session.chunks.forEach((c, idx) => {
    txt += `[#${idx + 1}] [${c.timestamp}] ${c.speaker} (${c.wpm} WPM)\n`;
    txt += `GỐC (${session.sourceLang.toUpperCase()}): ${c.originalText}\n`;
    txt += `DỊCH (${session.targetLang.toUpperCase()}): ${c.translatedText}\n`;
    if (c.detectedTerms && c.detectedTerms.length > 0) {
      txt += `Thuật ngữ: ${c.detectedTerms.join(' | ')}\n`;
    }
    txt += `\n`;
  });

  txt += `======================================================================\n`;
  txt += `PetroTrans Pro AI • Tiêu chuẩn hóa theo ASTM International & API Specification\n`;
  return txt;
}

export function exportSessionToSRT(session: SavedMeetingSession): string {
  let srt = '';
  session.chunks.forEach((c, idx) => {
    const startSec = idx * 4;
    const endSec = startSec + 3;
    const formatTime = (sec: number) => {
      const h = String(Math.floor(sec / 3600)).padStart(2, '0');
      const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
      const s = String(sec % 60).padStart(2, '0');
      return `${h}:${m}:${s},000`;
    };
    srt += `${idx + 1}\n${formatTime(startSec)} --> ${formatTime(endSec)}\n${c.translatedText}\n[EN]: ${c.originalText}\n\n`;
  });
  return srt;
}

export function exportSessionToHTML(session: SavedMeetingSession): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${session.title} - PetroTrans Pro</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 30px; max-width: 900px; margin: auto; }
    h1 { color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 10px; font-size: 22px; }
    .meta { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 25px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 13px; }
    .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-weight: bold; margin-right: 5px; }
    .chunk { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; page-break-inside: avoid; }
    .chunk-header { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; font-family: monospace; margin-bottom: 6px; }
    .orig { color: #475569; font-size: 13px; margin-bottom: 6px; }
    .trans { color: #0284c7; font-size: 14px; font-weight: 500; }
    .terms { margin-top: 6px; font-size: 11px; color: #0f766e; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>BIÊN BẢN HỘI NGHỊ PHIÊN DỊCH TRỰC TUYẾN</h1>
  <div class="meta">
    <div><strong>Chuyên đề:</strong> ${session.title}</div>
    <div><strong>Ngày thực hiện:</strong> ${session.dateStr} (${session.timestamp})</div>
    <div><strong>Cặp ngôn ngữ:</strong> ${session.sourceLang.toUpperCase()} &rarr; ${session.targetLang.toUpperCase()}</div>
    <div><strong>Tốc độ phát biểu trung bình:</strong> ${session.averageWpm} WPM</div>
    <div style="grid-column: span 2;">
      <strong>Thuật ngữ bóc tách:</strong>
      ${session.detectedTerms.map(t => `<span class="badge">${t}</span>`).join(' ') || 'N/A'}
    </div>
  </div>

  <h2>Nội dung phiên dịch đối chiếu song ngữ (${session.chunks.length} câu)</h2>
  ${session.chunks.map((c, i) => `
    <div class="chunk">
      <div class="chunk-header">
        <span>#${i + 1} &bull; ${c.timestamp} &bull; ${c.speaker}</span>
        <span>${c.wpm} WPM</span>
      </div>
      <div class="orig"><strong>[${session.sourceLang.toUpperCase()}]:</strong> ${c.originalText}</div>
      <div class="trans"><strong>[${session.targetLang.toUpperCase()}]:</strong> ${c.translatedText}</div>
      ${c.detectedTerms && c.detectedTerms.length > 0 ? `<div class="terms"><strong>Thuật ngữ kỹ thuật:</strong> ${c.detectedTerms.join(', ')}</div>` : ''}
    </div>
  `).join('')}

  <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
    Biên bản được tự động xuất từ Hệ thống Phiên Dịch Hội Nghị Kỹ Thuật Cao PetroTrans Pro AI.
  </p>
</body>
</html>`;
}
