/**
 * MODULE: Semantic Chunker (Phase 2 → nâng cấp Priority 1 theo AUDIT-chatbot-adhd.md)
 *
 * TRƯỚC ĐÂY: 1 section = 1 chunk duy nhất (chunk "cha") — đây chính là
 * nguyên nhân gốc rễ khiến answer-composer luôn trả lời "đúng section, sai
 * nội dung con" (VD hỏi Methylphenidate lại trả lời về Amphetamines).
 *
 * NAY: mỗi CleanDocument sinh ra:
 *   - 1 chunk CHA cấp section (giữ nguyên như cũ — vẫn cần cho câu hỏi tổng
 *     quát, VD "Cơ sở điều trị ADHD ở đâu").
 *   - N chunk CON, mỗi chunk = 1 sub-document (thuốc/bệnh viện/FAQ/nguyên
 *     nhân/hậu quả/liệu pháp/phân nhóm) do content-extractor.js đã tách sẵn
 *     theo class HTML ổn định — parent trỏ về id section cha.
 *
 * CATEGORY của chunk con KHÔNG dùng lại category của cha (sectionId) mà
 * dùng "sectionId:nhomcon" (VD "dieu-tri-ho-tro:medication",
 * "co-so-dieu-tri:hospital:hcm", "cau-hoi-nang-cao:faq:<nhom>"). Lý do:
 * relationship-builder.js suy ra "related" dựa trên "cùng category" — nếu
 * để category con trùng category cha, MỌI chunk con trong cùng 1 section sẽ
 * bị coi là related với nhau (VD toàn bộ 6 loại thuốc + 4 liệu pháp), tái
 * tạo đúng lỗi "sinh quá nhiều nút gợi ý" mà audit đã ghi nhận — chỉ là ở
 * cấp nhỏ hơn. Việc chia category theo nhóm con giữ "related" hẹp và đúng
 * ngữ nghĩa (VD chỉ các loại thuốc liên quan nhau, không lẫn với liệu pháp
 * tâm lý; chỉ bệnh viện cùng thành phố liên quan nhau).
 */

function computeChildCategory(sectionId, sub) {
  const meta = sub.meta || {};
  switch (meta.group) {
    case 'subtype':
      return `${sectionId}:subtype`;
    case 'nguyen-nhan':
      return `${sectionId}:nguyen-nhan`;
    case 'hau-qua':
      return `${sectionId}:hau-qua`;
    case 'medication':
      return `${sectionId}:medication`;
    case 'lieu-phap':
      return `${sectionId}:lieu-phap`;
    case 'hospital':
      return `${sectionId}:hospital:${meta.tab || 'chung'}`;
    case 'faq':
      return `${sectionId}:faq`;
    default:
      return sectionId;
  }
}

export function chunkContent(cleanDocuments) {
  const chunks = [];

  for (const doc of cleanDocuments) {
    // Chunk CHA cấp section — giữ nguyên hành vi cũ.
    chunks.push({
      id: doc.sectionId,
      source: doc.source,
      title: doc.title,
      summary: doc.paragraphs[0] || doc.title,
      content: doc.paragraphs.join(' '),
      category: doc.sectionId,
      parent: null
    });

    // Chunk CON — 1 chunk / 1 sub-document đã tách theo card HTML.
    for (const sub of doc.subDocuments || []) {
      chunks.push({
        id: sub.id,
        source: doc.source,
        title: sub.title,
        summary: sub.content.length > 160 ? `${sub.content.slice(0, 160)}…` : sub.content,
        content: sub.content,
        category: computeChildCategory(doc.sectionId, sub),
        parent: sub.parentId
      });
    }
  }

  return chunks;
}
