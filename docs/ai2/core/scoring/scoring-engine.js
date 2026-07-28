/**
 * MODULE: Scoring Engine (Phase 6) — TRIỂN KHAI THẬT
 *
 * Chấm điểm liên quan giữa câu hỏi người dùng và từng Node — KHÔNG dùng
 * embedding/cosine similarity. Kết hợp nhiều yếu tố có trọng số:
 * entity match, intent match, keyword match, alias match, related concept,
 * graph distance (tuỳ chọn, truyền vào từ kết quả Graph Search trước đó),
 * question similarity (so khớp token với câu hỏi mẫu đã sinh).
 */

import { normalizeForMatch, tokenize } from '../generators/_utils/text-utils.js';
import { generateQuestionsForNode } from '../generators/question-generator.js';

const WEIGHTS = {
  entity: 5,
  alias: 4,
  keyword: 2,
  intent: 3,
  relatedBonus: 1,
  questionSimilarity: 6,
  graphDistance: 2 // nhân với hệ số suy giảm theo khoảng cách
};

function questionSimilarity(queryTokens, node) {
  const questions = generateQuestionsForNode(node);
  let best = 0;
  for (const q of questions) {
    const qTokens = new Set(tokenize(q));
    if (qTokens.size === 0) continue;
    const overlap = queryTokens.filter((t) => qTokens.has(t)).length;
    const ratio = overlap / Math.max(qTokens.size, queryTokens.length, 1);
    if (ratio > best) best = ratio;
  }
  return best; // 0..1
}

/**
 * Đếm số node chứa mỗi entity/keyword (đã chuẩn hoá) — dùng để giảm trọng số
 * các từ quá phổ biến (xuất hiện ở hầu hết mọi node, VD "ADHD") theo kiểu
 * IDF đơn giản: từ càng phổ biến trong toàn graph thì càng ít giá trị phân biệt.
 */
function buildDocFreq(nodes, field) {
  const freq = new Map();
  for (const node of nodes) {
    const items = new Set((node[field] || []).map((v) => normalizeForMatch(v)));
    for (const item of items) {
      if (!item) continue;
      freq.set(item, (freq.get(item) || 0) + 1);
    }
  }
  return freq;
}

/**
 * @param {string} userQuery
 * @param {object[]} nodes
 * @param {{ graphDistances?: Map<string, number> }} options — distances từ 1 node "neo" (VD node của câu hỏi trước, phục vụ follow-up)
 */
export function scoreNodes(userQuery, nodes, options = {}) {
  const normQuery = normalizeForMatch(userQuery);
  const queryTokens = tokenize(userQuery);
  const { graphDistances } = options;
  const totalNodes = nodes.length;

  const entityFreq = buildDocFreq(nodes, 'entities');
  const keywordFreq = buildDocFreq(nodes, 'keywords');

  const scored = nodes.map((node) => {
    const matchedFactors = [];
    let score = 0;

    const entityMatches = (node.entities || []).filter((e) => normQuery.includes(normalizeForMatch(e)));
    if (entityMatches.length) {
      const weighted = entityMatches.reduce((sum, e) => {
        const freq = entityFreq.get(normalizeForMatch(e)) || 1;
        // IDF-like weighting: log((N+1)/(df+1))
        const idf = Math.log((totalNodes + 1) / (freq + 1));
        return sum + WEIGHTS.entity * idf;
      }, 0);
      score += weighted;
      matchedFactors.push('entity');
    }

    const aliasMatches = (node.aliases || []).filter((a) => normQuery.includes(normalizeForMatch(a)));
    if (aliasMatches.length) { score += aliasMatches.length * WEIGHTS.alias; matchedFactors.push('alias'); }

    const keywordMatches = (node.keywords || []).filter((k) =>
      tokenize(normQuery).includes(normalizeForMatch(k))
    );
    if (keywordMatches.length) {
      const weighted = keywordMatches.reduce((sum, k) => {
        const freq = keywordFreq.get(normalizeForMatch(k)) || 1;
        // IDF-like weighting: log((N+1)/(df+1))
        const idf = Math.log((totalNodes + 1) / (freq + 1));
        return sum + WEIGHTS.keyword * idf;
      }, 0);
      score += weighted;
      matchedFactors.push('keyword');
    }

    const intentMatches = (node.intents || []).filter((intent) => normQuery.includes(intent.replace('_', ' ')));
    if (intentMatches.length) { score += intentMatches.length * WEIGHTS.intent; matchedFactors.push('intent'); }

    const qSim = questionSimilarity(queryTokens, node);
    if (qSim > 0) { score += qSim * WEIGHTS.questionSimilarity; matchedFactors.push('question_similarity'); }

    if (graphDistances && graphDistances.has(node.id)) {
      const dist = graphDistances.get(node.id);
      const bonus = WEIGHTS.graphDistance / (dist + 1);
      score += bonus;
      matchedFactors.push('graph_distance');
    }

    return { nodeId: node.id, score, matchedFactors };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
}
