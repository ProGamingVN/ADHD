/**
 * MODULE: Parser — Tokenizer (bổ sung kiến trúc, KHÔNG đổi logic cũ)
 *
 * Re-export tokenize/termFrequency/STOPWORDS_VI đã có tại
 * generators/_utils/text-utils.js — cùng lý do với normalize.js
 * (single source of truth, không trùng lặp logic).
 */

export { tokenize, termFrequency, STOPWORDS_VI } from '../generators/_utils/text-utils.js';
