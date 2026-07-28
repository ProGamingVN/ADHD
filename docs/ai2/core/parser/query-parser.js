/**
 * MODULE: Query Parser (mới — core/parser/)
 *
 * VAI TRÒ
 * -------
 * Parse 1 câu hỏi/query (của user ở runtime, HOẶC của 1 "đường đi"
 * (path) sinh ra bởi Backtracking Question Generator ở build-time)
 * thành cấu trúc {entity, intent, keywords} — đúng yêu cầu spec.
 *
 * TÁI SỬ DỤNG, KHÔNG TRÙNG LẶP LUẬT
 * ----------------------------------
 * Dùng lại nguyên trạng ADHD_ENTITY_DICTIONARY (entity-generator.js) và
 * INTENT_TAXONOMY + INTENT_RULES (intent-generator.js) — đây là 2 "từ
 * điển miền" đã được kiểm chứng khi generate entity/intent cho NODE.
 * Query Parser chỉ áp dụng lại đúng luật đó cho QUERY, để đảm bảo 1 câu
 * hỏi và 1 node cùng nội dung sẽ luôn được gắn entity/intent giống nhau
 * (nhất quán build-time <-> runtime).
 *
 * Không phụ thuộc DOM/Node.js API nào -> chạy được cả ở build-time (Node)
 * lẫn runtime (trình duyệt / GitHub Pages).
 */

import { normalizeForMatch } from './normalize.js';
import { tokenize } from './tokenizer.js';
import { ADHD_ENTITY_DICTIONARY } from '../generators/entity-generator.js';
import { INTENT_TAXONOMY, INTENT_RULES } from '../generators/intent-generator.js';

/**
 * @param {string} rawText câu hỏi/query gốc (có dấu, có hoa thường tự do)
 * @returns {{
 *   raw: string,
 *   normalized: string,
 *   tokens: string[],
 *   keywords: string[],
 *   entities: string[],
 *   intents: string[]
 * }}
 */
export function parseQuery(rawText) {
  const raw = String(rawText || '');
  const normalized = normalizeForMatch(raw);
  const tokens = tokenize(raw); // đã bỏ stopword tiếng Việt

  const entities = ADHD_ENTITY_DICTIONARY.filter((entity) =>
    normalized.includes(normalizeForMatch(entity))
  );

  const intents = INTENT_TAXONOMY.filter((intent) => {
    const rules = INTENT_RULES[intent] || [];
    return rules.some((kw) => normalized.includes(kw));
  });

  return {
    raw,
    normalized,
    tokens,
    keywords: tokens, // giữ tên field riêng theo đúng thuật ngữ spec (entity/intent/keywords)
    entities,
    intents
  };
}

/** Parse hàng loạt — dùng khi build-time cần parse nhiều đường đi/câu hỏi cùng lúc */
export function parseQueries(rawTexts) {
  return rawTexts.map((text) => parseQuery(text));
}
