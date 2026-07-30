/**
 * MODULE: Query Rewriter (mới — core/parser/)
 *
 * VAI TRÒ
 * -------
 * Khi user gõ 1 alias/từ đồng nghĩa/viết tắt (vd "Ritalin", "RLTĐGCY"),
 * query gốc có thể không chứa entity chính (vd "Methylphenidate", "ADHD")
 * -> Scoring Engine (entity match) sẽ bỏ lỡ tín hiệu quan trọng.
 *
 * rewriteQuery() KHÔNG thay thế query gốc (không đổi ý người dùng), mà
 * NỐI THÊM các canonical entity tương ứng vào cuối câu, để các bước sau
 * (query-parser, scoring-engine) có thêm tín hiệu entity/alias match mà
 * không cần sửa logic đang có ở scoring-engine.js.
 *
 * Dùng lại nguyên trạng ALIAS_DICTIONARY từ alias-generator.js (không
 * định nghĩa alias lần 2 ở đây) -> khi ALIAS_DICTIONARY được mở rộng,
 * query-rewriter tự động hưởng lợi mà không cần sửa file này.
 */

import { normalizeForMatch } from './normalize.js';
import { ALIAS_DICTIONARY } from '../generators/alias-generator.js';

/** Map ngược: alias đã chuẩn hoá -> canonical. Build 1 lần, cache module-level. */
function buildReverseAliasMap() {
  const map = new Map();
  for (const [canonical, aliases] of Object.entries(ALIAS_DICTIONARY)) {
    for (const alias of aliases) {
      const key = normalizeForMatch(alias);
      if (key) map.set(key, canonical);
    }
  }
  return map;
}

const REVERSE_ALIAS_MAP = buildReverseAliasMap();

/**
 * @param {string} rawText
 * @returns {{ rewritten: string, matchedCanonicals: string[] }}
 */
export function rewriteQuery(rawText) {
  const raw = String(rawText || '');
  const normalized = normalizeForMatch(raw);

  const matchedCanonicals = new Set();
  for (const [aliasNorm, canonical] of REVERSE_ALIAS_MAP.entries()) {
    if (normalized.includes(aliasNorm)) matchedCanonicals.add(canonical);
  }

  if (!matchedCanonicals.size) {
    return { rewritten: raw, matchedCanonicals: [] };
  }

  return {
    rewritten: `${raw} ${[...matchedCanonicals].join(' ')}`,
    matchedCanonicals: [...matchedCanonicals]
  };
}
