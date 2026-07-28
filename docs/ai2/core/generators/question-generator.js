/**
 * MODULE: Question Generator (Phase 4) — TRIỂN KHAI THẬT
 *
 * Sinh câu hỏi mẫu cho 1 Node bằng template (rule-based), KHÔNG dùng LLM.
 * Chạy được cả ở build-time (Node.js) lẫn runtime (trình duyệt) vì chỉ
 * phụ thuộc dữ liệu của chính node — dùng để tăng tín hiệu cho Scoring Engine.
 *
 * Bao phủ các dạng theo spec: trực tiếp, gián tiếp, đời thường, dài,
 * follow-up, không dấu, viết tắt (khi có alias viết tắt), đồng nghĩa.
 */

import { stripDiacritics } from './_utils/text-utils.js';

export function generateQuestionsForNode(node) {
  const title = node.title;
  const qs = [];

  // Trực tiếp
  qs.push(`${title} là gì?`);
  qs.push(`Cho tôi biết về ${title}.`);

  // Gián tiếp / đời thường
  qs.push(`Bạn có thể giải thích giúp tôi về ${title.toLowerCase()} không?`);
  qs.push(`Mình muốn hiểu thêm về ${title.toLowerCase()}, có thể nói rõ hơn không?`);

  // Dài / chi tiết
  qs.push(`${title} có ý nghĩa như thế nào trong ADHD và ảnh hưởng ra sao?`);

  // Follow-up (dùng đại từ, phụ thuộc ngữ cảnh trước đó)
  qs.push(`Còn về cái này thì sao?`);
  qs.push(`Nói thêm về nó được không?`);

  // Theo từng entity/alias để tăng độ phủ đồng nghĩa + viết tắt
  for (const entity of node.entities || []) {
    qs.push(`${entity} là gì?`);
  }
  for (const alias of node.aliases || []) {
    qs.push(`${alias} là gì?`);
  }

  // Không dấu (áp dụng cho toàn bộ câu trực tiếp để hỗ trợ gõ không dấu)
  qs.push(stripDiacritics(`${title} là gì?`));

  // Dedupe
  return [...new Set(qs)];
}

export function generateQuestions(nodes) {
  const result = [];
  for (const node of nodes) {
    result.push({ nodeId: node.id, questions: generateQuestionsForNode(node) });
  }
  return result;
}
