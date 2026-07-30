/**
 * MODULE: Alias Generator (Phase 4) — TRIỂN KHAI THẬT
 *
 * Sinh alias theo 2 nguồn:
 * 1. Từ điển đồng nghĩa/viết tắt miền ADHD khai báo tay (ALIAS_DICTIONARY).
 * 2. Tự động sinh bản không dấu cho title của node (luôn chạy, không cần khai báo).
 */

import { stripDiacritics } from './_utils/text-utils.js';

/** canonical (khớp trong content) -> danh sách alias/đồng nghĩa/viết tắt */
export const ALIAS_DICTIONARY = {
  'ADHD': ['rối loạn tăng động giảm chú ý', 'tăng động giảm chú ý', 'RLTĐGCY', 'attention deficit hyperactivity disorder'],
  'Methylphenidate': ['Ritalin', 'thuốc dán ADHD'],
  'vỏ não trước trán': ['prefrontal cortex', 'thuỳ trán'],
  'Dopamine': ['dopamin'],
  'Norepinephrine': ['norepinephrin', 'noradrenaline'],
  'TIC': ['hội chứng TIC', 'rối loạn vận động không kiểm soát'],
  'Tourette': ['hội chứng Tourette'],
  'hyperfocus': ['siêu tập trung'],
  'RSD': ['rối loạn nhạy cảm với sự từ chối', 'rejection sensitive dysphoria'],
  'burnout': ['kiệt sức', 'hội chứng kiệt sức']
};

export function generateAliasesForNode(node) {
  const aliases = new Set();

  // (1) khớp từ điển theo entities đã nhận diện của node
  for (const entity of node.entities || []) {
    const dict = ALIAS_DICTIONARY[entity];
    if (dict) dict.forEach((a) => aliases.add(a));
  }

  // (2) bản không dấu của title — luôn hữu ích cho tìm kiếm tiếng Việt không gõ dấu
  if (node.title) aliases.add(stripDiacritics(node.title).toLowerCase());

  return [...aliases];
}

export function generateAliases(nodes) {
  const result = new Map();
  for (const node of nodes) {
    result.set(node.id, generateAliasesForNode(node));
  }
  return result;
}
