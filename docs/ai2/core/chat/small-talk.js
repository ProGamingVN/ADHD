/**
 * MODULE: Small Talk / Special Intents (Phase 9 — bổ sung)
 *
 * Nhận diện các ý định "ngoài kiến thức ADHD": chào hỏi, tạm biệt, cảm ơn,
 * xin lỗi, hỏi danh tính/khả năng của chatbot, xin trợ giúp điều hướng.
 * Chạy TRƯỚC scoring engine trong ChatEngine.ask() — nếu khớp, trả lời
 * ngay, không cần chấm điểm qua Knowledge Graph.
 *
 * Rule-based thuần (không AI, không random) — đúng nguyên tắc "không
 * hallucination" của spec.
 */

import { normalizeForMatch } from '../generators/_utils/text-utils.js';

const GREETING_PATTERNS = [
  'chao', 'chao ban', 'chao ban minh', 'alo', 'hi', 'hello', 'hey', 'yo',
  'e oi', 'ê', 'oi', 'chào bạn'
];
const FAREWELL_PATTERNS = ['tam biet', 'bye', 'hen gap lai', 'bai bai', 'chao nhe'];
const THANKS_PATTERNS = ['cam on', 'thank', 'thanks', 'cảm ơn', 'tks'];
const APOLOGY_PATTERNS = ['xin loi', 'sorry', 'toi loi'];
const IDENTITY_PATTERNS = ['ban la ai', 'may la ai', 'ban ten gi', 'who are you', 'ban la gi'];
const CAPABILITY_PATTERNS = [
  'ban lam duoc gi', 'ban giup duoc gi', 'ban co the lam gi', 'ban biet gi',
  'what can you do'
];
const HELP_PATTERNS = ['giup toi', 'help', 'huong dan', 'huong dan minh', 'toi can giup'];

function matchesAny(normText, patterns) {
  return patterns.some((p) => normText === p || normText.startsWith(p + ' ') || normText.includes(' ' + p));
}

/**
 * @param {string} userMessage
 * @returns {{ answer: string, suggestions?: string[] } | null}
 */
export function detectSmallTalk(userMessage) {
  const norm = normalizeForMatch(userMessage);
  if (!norm) return null;

  // Câu quá dài (nhiều từ) khó là small-talk thuần — bỏ qua để không "cướp" câu hỏi thật
  const wordCount = norm.split(' ').filter(Boolean).length;

  if (wordCount <= 6 && matchesAny(norm, GREETING_PATTERNS)) {
    return {
      answer: 'Xin chào! Mình là trợ lý ADHD của trang. Bạn có thể hỏi mình về khái niệm, triệu chứng, nguyên nhân, điều trị hoặc cơ sở khám ADHD nhé.',
      suggestions: ['ADHD là gì?', 'Triệu chứng ADHD gồm những gì?', 'Cách điều trị ADHD như thế nào?']
    };
  }

  if (wordCount <= 6 && matchesAny(norm, FAREWELL_PATTERNS)) {
    return { answer: 'Tạm biệt bạn! Cần hỏi thêm gì về ADHD cứ quay lại nhé.' };
  }

  if (matchesAny(norm, THANKS_PATTERNS)) {
    return { answer: 'Không có gì! Rất vui vì đã giúp được bạn. Bạn còn câu hỏi nào khác về ADHD không?' };
  }

  if (matchesAny(norm, APOLOGY_PATTERNS)) {
    return { answer: 'Không sao đâu, mình luôn sẵn sàng giúp bạn tìm hiểu về ADHD.' };
  }

  if (matchesAny(norm, IDENTITY_PATTERNS)) {
    return {
      answer: 'Mình là trợ lý ảo của trang "Vài Điều Về ADHD" — chạy hoàn toàn cục bộ trên trình duyệt của bạn, trả lời dựa trên nội dung có sẵn của trang, không dùng dịch vụ AI trên mạng.'
    };
  }

  if (matchesAny(norm, CAPABILITY_PATTERNS)) {
    return {
      answer: 'Mình có thể giúp bạn: giải thích khái niệm/triệu chứng/nguyên nhân/hậu quả của ADHD, thông tin điều trị và thuốc, danh sách cơ sở khám chữa, giải đáp các câu hỏi thường gặp, và điều hướng tới đúng phần trên trang.',
      suggestions: ['Trang này có những phần nào?', 'ADHD là gì?']
    };
  }

  if (matchesAny(norm, HELP_PATTERNS)) {
    return {
      answer: 'Bạn có thể hỏi mình bất kỳ điều gì về ADHD (khái niệm, triệu chứng, nguyên nhân, điều trị, cơ sở khám...), hoặc gõ "trang này có những phần nào" để mình chỉ đường.',
      suggestions: ['Trang này có những phần nào?']
    };
  }

  return null;
}
