/**
 * MODULE: Entity Generator (Phase 4) — TRIỂN KHAI THẬT
 *
 * Nhận diện thực thể bằng khớp từ điển miền ADHD (dictionary-based),
 * không dùng model NER ngoài (đúng nguyên tắc "không phụ thuộc cloud").
 */

import { normalizeForMatch } from './_utils/text-utils.js';

/** Từ điển thực thể miền ADHD — mở rộng dần khi thêm nội dung mới */
export const ADHD_ENTITY_DICTIONARY = [
  'ADHD', 'DSM-5', 'Dopamine', 'Norepinephrine', 'Serotonin',
  'vỏ não trước trán', 'fMRI', 'TIC', 'Tourette', 'RSD',
  'hyperfocus', 'burnout',
  'Amphetamines', 'Methamphetamine', 'Methylphenidate',
  'Atomoxetine', 'Clonidine', 'Guanfacine',
  'Predominantly Inattentive', 'Hyperactive-Impulsive', 'Combined Presentation',
  'Pomodoro', 'omega-3',
  'Bệnh viện Tâm thần TP. HCM', 'Bệnh viện Nhi Đồng',
  'Bệnh viện Đại học Y Dược TP. HCM', 'Bệnh viện Nhân dân 115',
  'Viện Sức khỏe tâm thần – BV Bạch Mai', 'BV Nhi Trung ương',
  'BV Đại học Y Hà Nội'
];

export function generateEntitiesForNode(node) {
  const haystack = normalizeForMatch(
    `${node.title} ${node.summary} ${node.content}`
  );
  return ADHD_ENTITY_DICTIONARY.filter((entity) =>
    haystack.includes(normalizeForMatch(entity))
  );
}

export function generateEntities(nodes) {
  const result = new Map();
  for (const node of nodes) {
    result.set(node.id, generateEntitiesForNode(node));
  }
  return result;
}
