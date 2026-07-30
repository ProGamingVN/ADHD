/**
 * MODULE: Content Cleaner (Phase 2 → nâng cấp Priority 1 theo AUDIT-chatbot-adhd.md)
 *
 * Chuẩn hoá RawDocument: gộp khoảng trắng, bỏ đoạn rỗng/quá ngắn (rác).
 * Nay xử lý thêm subDocuments (node con cấp thuốc/bệnh viện/FAQ/nguyên nhân/
 * hậu quả/liệu pháp/phân nhóm) sinh ra từ content-extractor.js — cùng logic
 * làm sạch, không định nghĩa luật riêng để tránh lệch pha.
 */

function isNoise(text) {
  if (!text) return true;
  const t = text.trim();
  if (t.length < 3) return true;
  if (/^nhấp vào ảnh/i.test(t)) return true; // caption kỹ thuật, không mang tri thức
  return false;
}

export function cleanContent(rawDocuments) {
  return rawDocuments.map((doc) => {
    const paragraphs = doc.paragraphs
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .filter((p) => !isNoise(p));

    const headings = doc.headings
      .map((h) => h.replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    const subDocuments = (doc.subDocuments || [])
      .map((sub) => ({
        ...sub,
        title: (sub.title || '').replace(/\s+/g, ' ').trim(),
        content: (sub.content || '').replace(/\s+/g, ' ').trim()
      }))
      .filter((sub) => !isNoise(sub.content) && !isNoise(sub.title));

    return {
      source: doc.source,
      sectionId: doc.sectionId,
      title: doc.title.trim(),
      headings,
      paragraphs,
      subDocuments
    };
  });
}
