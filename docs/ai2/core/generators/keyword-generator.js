/**
 * MODULE: Keyword Generator (Phase 4) — TRIỂN KHAI THẬT
 *
 * Trích keyword theo tần suất từ (unigram) và từ ghép (bigram) trong title + summary + content
 * của node, title được tính trọng số cao hơn (x3) vì mang nhiều tín hiệu nhất.
 */

import { tokenize, termFrequency, generateBigrams } from './_utils/text-utils.js';

export function generateKeywordsForNode(node, { topN = 30 } = {}) {
  const titleTokens = tokenize(node.title || '');
  const summaryTokens = tokenize(node.summary || '');
  const contentTokens = tokenize(node.content || '');

  // Token có trọng số (title x3, summary x2, content x1)
  const weightedTokens = [
    ...titleTokens, ...titleTokens, ...titleTokens,
    ...summaryTokens, ...summaryTokens,
    ...contentTokens
  ];

  // Tính tần suất từ đơn (unigram)
  const unigramFreq = termFrequency(weightedTokens);

  // Tạo bigrams từ token có trọng số
  const bigrams = generateBigrams(weightedTokens, { minFrequency: 2 });

  // Kết hợp unigram và bigram
  const allKeywords = [...unigramFreq.entries()].map(([term, count]) => ({ term, count }));

  bigrams.forEach(bigram => {
    allKeywords.push({ term: bigram, count: 2 }); // Bigram có trọng số 2 để ưu tiên
  });

  return allKeywords
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map(item => item.term);
}

/** Chạy cho toàn bộ graph, trả về Map<nodeId, string[]> */
export function generateKeywords(nodes) {
  const result = new Map();
  for (const node of nodes) {
    result.set(node.id, generateKeywordsForNode(node));
  }
  return result;
}
