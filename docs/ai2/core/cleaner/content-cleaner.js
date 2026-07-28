/**
 * MODULE: Content Cleaner (Phase 2) — TRIỂN KHAI THẬT
 *
 * Chuẩn hoá RawDocument: gộp khoảng trắng, bỏ đoạn rỗng/quá ngắn (rác),
 * loại trùng lặp câu liền kề (do site có vài chỗ lặp caption).
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

    return {
      source: doc.source,
      sectionId: doc.sectionId,
      title: doc.title.trim(),
      headings,
      paragraphs
    };
  });
}
