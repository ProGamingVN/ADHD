/**
 * MODULE: Semantic Chunker (Phase 2) — TRIỂN KHAI THẬT
 *
 * Chia mỗi CleanDocument (1 section trang) thành chunk cấp section (chunk
 * "cha") — mỗi heading con (h3/h4/h5) trở thành gợi ý ranh giới cho việc
 * tinh chỉnh thủ công thêm ở Knowledge Graph Builder khi cần chi tiết hơn
 * (ví dụ: tách từng loại thuốc, từng bệnh viện, từng câu FAQ).
 *
 * Chunker này sinh ra chunk Ở CẤP SECTION làm nền tảng; các node chi tiết
 * hơn (thuốc, bệnh viện, FAQ...) được tinh chỉnh thủ công trong
 * data/knowledge-graph.json dựa trên cùng nguồn paragraphs này để đảm bảo
 * độ chi tiết theo đúng yêu cầu — chunker vẫn hữu ích khi nội dung trang
 * thay đổi và cần build lại từ đầu.
 */

export function chunkContent(cleanDocuments) {
  return cleanDocuments.map((doc) => ({
    id: doc.sectionId,
    source: doc.source,
    title: doc.title,
    summary: doc.paragraphs[0] || doc.title,
    content: doc.paragraphs.join(' '),
    category: doc.sectionId
  }));
}
