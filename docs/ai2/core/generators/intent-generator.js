/**
 * MODULE: Intent Generator (Phase 4) — TRIỂN KHAI THẬT
 *
 * Gán intent cho node bằng rule-based keyword matching, theo taxonomy chuẩn.
 * Một node có thể có nhiều intent.
 */

import { normalizeForMatch } from './_utils/text-utils.js';

export const INTENT_TAXONOMY = [
  'definition', 'symptoms', 'causes', 'diagnosis', 'treatment',
  'medication', 'school', 'children', 'adult', 'parents',
  'misconceptions', 'side_effects', 'comparison', 'difference',
  'risk', 'benefit'
];

/**
 * Mỗi intent gắn 1 danh sách từ khoá kích hoạt (không dấu, lowercase).
 * Export thêm (không đổi giá trị/behavior) để core/parser/query-parser.js
 * tái dùng cho việc parse CÂU HỎI người dùng, tránh định nghĩa trùng luật.
 */
export const INTENT_RULES = {
  definition:      ['khai niem', 'la gi', 'dinh nghia', 'roi loan phat trien than kinh'],
  symptoms:        ['bieu hien', 'trieu chung', 'dau hieu', 'kho tap trung', 'bon chon'],
  causes:          ['nguyen nhan', 'di truyen', 'nao bo', 'chat dan truyen', 'gen'],
  diagnosis:       ['chan doan', 'dsm-5', 'dsm5', 'tieu chuan'],
  treatment:       ['dieu tri', 'can thiep', 'lieu phap', 'phac do'],
  medication:      ['thuoc', 'amphetamine', 'methylphenidate', 'atomoxetine', 'clonidine', 'guanfacine', 'methamphetamine'],
  school:          ['hoc tap', 'truong hoc', 'deadline', 'hieu suat'],
  children:        ['tre em', 'tre nho', 'nhi dong'],
  adult:           ['nguoi lon', 'truong thanh', 'di lam'],
  parents:         ['phu huynh', 'cha me', 'gia dinh'],
  misconceptions:  ['hieu lam', 'dinh kien', 'co phai', 'that su', 'khong phai'],
  side_effects:    ['tac dung khong mong muon', 'tac dung phu', 'tac dung bat loi', 'vang da', 'giam su them an'],
  comparison:      ['so sanh', 'khac nhau', 'phan biet'],
  difference:      ['khac biet', 'khac nhau'],
  risk:            ['nguy co', 'rui ro', 'gay nghien', 'tang huyet ap'],
  benefit:         ['loi ich', 'cai thien', 'hieu qua', 'giup']
};

export function generateIntentsForNode(node) {
  const haystack = normalizeForMatch(
    `${node.title} ${node.summary} ${node.content} ${node.category || ''}`
  );
  const intents = [];
  for (const intent of INTENT_TAXONOMY) {
    const rules = INTENT_RULES[intent] || [];
    if (rules.some((kw) => haystack.includes(kw))) intents.push(intent);
  }
  return intents;
}

export function generateIntents(nodes) {
  const result = new Map();
  for (const node of nodes) {
    result.set(node.id, generateIntentsForNode(node));
  }
  return result;
}
