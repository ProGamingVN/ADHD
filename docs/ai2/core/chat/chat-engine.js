/**
 * MODULE: Chat Engine (Phase 7) — TRIỂN KHAI THẬT
 *
 * Điều phối: Scoring Engine -> Graph Search (bias theo follow-up) ->
 * Answer Composer -> trả kết quả + gợi ý câu hỏi liên quan cho UI.
 * Quản lý lịch sử hội thoại trong bộ nhớ phiên (không lưu cloud).
 */

import { scoreNodes } from '../scoring/scoring-engine.js';
import { composeAnswer } from '../answer/answer-composer.js';
import { searchGraph } from '../search/graph-search.js';
import { normalizeForMatch } from '../generators/_utils/text-utils.js';
import { detectSmallTalk } from './small-talk.js';

const FOLLOWUP_HINTS = ['no', 'cai nay', 'con', 'vay', 'the con', 'tiep', 'them', 'nua'];

function looksLikeFollowUp(message) {
  const norm = normalizeForMatch(message);
  if (norm.split(' ').length <= 4) return true; // câu quá ngắn, dễ là follow-up
  return FOLLOWUP_HINTS.some((hint) => norm.includes(hint));
}

export class ChatEngine {
  constructor(graph) {
    this.graph = graph;
    this.history = [];
    this.lastNodeIds = [];
  }

  ask(userMessage) {
    this.history.push({ role: 'user', text: userMessage });

    // Special intents (chào hỏi, cảm ơn, danh tính...) — kiểm tra TRƯỚC khi
    // chấm điểm qua Knowledge Graph, không ảnh hưởng lastNodeIds/follow-up.
    const smallTalk = detectSmallTalk(userMessage);
    if (smallTalk) {
      this.history.push({ role: 'bot', text: smallTalk.answer });
      return {
        answer: smallTalk.answer,
        sourceNodeIds: [],
        confident: true,
        suggestions: smallTalk.suggestions || []
      };
    }

    let graphDistances;
    if (this.lastNodeIds.length && looksLikeFollowUp(userMessage)) {
      const contextNodes = searchGraph(this.graph, this.lastNodeIds, { maxDepth: 2, algorithm: 'dfs' });
      graphDistances = new Map(contextNodes.map((n, i) => [n.id, i === 0 ? 0 : Math.ceil(i / 2)]));
    }

    const scored = scoreNodes(userMessage, this.graph.nodes, { graphDistances });
    const composed = composeAnswer(scored, this.graph.nodes);

    if (composed.sourceNodeIds.length) {
      this.lastNodeIds = composed.sourceNodeIds;
    }

    const suggestions = this._buildSuggestions(composed.sourceNodeIds);

    this.history.push({ role: 'bot', text: composed.answer });

    return { ...composed, suggestions };
  }

  _buildSuggestions(sourceNodeIds) {
    if (!sourceNodeIds.length) return [];
    const nodeMap = new Map(this.graph.nodes.map((n) => [n.id, n]));
    const seen = new Set(sourceNodeIds);
    const suggestions = [];

    for (const id of sourceNodeIds) {
      const node = nodeMap.get(id);
      if (!node) continue;
      const relatedIds = [...(node.children || []), ...(node.related || [])];
      for (const relId of relatedIds) {
        if (seen.has(relId)) continue;
        const relNode = nodeMap.get(relId);
        if (!relNode) continue;
        seen.add(relId);
        suggestions.push(`${relNode.title} là gì?`);
        if (suggestions.length >= 3) return suggestions;
      }
    }
    return suggestions;
  }

  getHistory() {
    return this.history;
  }

  reset() {
    this.history = [];
    this.lastNodeIds = [];
  }
}
