/**
 * Tiện ích xử lý văn bản tiếng Việt — dùng chung cho toàn bộ generators,
 * scoring engine và question generator. Không phụ thuộc thư viện ngoài.
 */

/** Bỏ dấu tiếng Việt: "Rối loạn tăng động" -> "Roi loan tang dong" */
export function stripDiacritics(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/** Chuẩn hoá để so khớp: bỏ dấu + lowercase + gộp khoảng trắng */
export function normalizeForMatch(str) {
  return stripDiacritics(String(str || ''))
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const STOPWORDS_VI = new Set([
  'la','va','cua','co','khi','mot','nhung','cac','de','duoc','trong','nay',
  'cho','voi','nhu','o','tai','theo','hoac','hay','vi','neu','thi','da',
  'se','bi','rat','nhieu','it','ve','tu','den','ban','minh','ho','no',
  'toi','cung','ma','nen','phai','sau','truoc','giua','moi','tren','duoi',
  'nhung','cach','viec','su','nguoi','ta','ay','the','day','kia','ai','gi',
  'sao','nao','bang','vao','ra','len','xuong','qua','lai','luon','chi',
  'thoi','roi','vay','the'
]);

// Common English stopwords
export const STOPWORDS_EN = new Set([
  'a','an','and','are','as','at','be','by','for','from','has','he','in','is','it','its','of','on','that','the','to','was','were','will','with',
  'i','you','we','they','this','that','these','those','am','has','have','had','do','does','did','but','or','not','if','then','else','when','where','why','how',
  'all','any','both','each','few','more','most','other','some','such','no','nor','only','own','same','so','than','too','very','can','may','must','shall'
]);

export const STOPWORDS = new Set([...STOPWORDS_VI, ...STOPWORDS_EN]);

/**
 * Tokenize tiếng Việt tốt hơn:
 * - Tách từ theo khoảng trắng và dấu câu
 * - Giữ nguyên формы từ (dấu accents, chữ hoa/thường) để trả về
 * - Nhưng sử dụng forms đã chuẩn hóa để loại stopword và đếm tần suất
 */
export function tokenize(str, { keepStopwords = false, returnOriginal = false } = {}) {
  if (!str) return [];

  // Chuẩn hoá để so khớp (loại bỏ dấu, lowercase, chuẩn hóa whitespace)
  const norm = normalizeForMatch(str);
  if (!norm) return [];

  // Tách thành tokens từ chuỗi đã chuẩn hoá
  const normTokens = norm.split(' ').filter(Boolean);

  // Trích xuất tokens gốc từ chuỗi gốc để giữ nguyên форму từ
  // Điều này là gần似 - trong thực tế chúng ta sẽ cần một tokenizer tiếng Việt tốt hơn
  // Để đơn giản, chúng ta sẽ sử dụng chuỗi gốc và tách bằng regex tương tự
  const originalTokens = str
    .replace(/[^\w\s]/g, ' ') // Thay thế dấu câu bằng space
    .replace(/\s+/g, ' ')     // Chuẩn hóa whitespace
    .trim()
    .split(' ')
    .filter(Boolean);

  // Đảm bảo có cùng số lượng tokens (xấp xỉ)
  //Trong thực tế, nên sử dụng một tokenizer tiếng Việt thật
  //Nhưng cho mục đích này, chúng ta sẽ假设长度相当

  // Lọc stopwords dựa trên normalized tokens
  const result = [];
  for (let i = 0; i < normTokens.length && i < originalTokens.length; i++) {
    const normToken = normTokens[i];
    const originalToken = originalTokens[i];

    // Bỏ qua tokens quá ngắn (1 ký tự) nếu không phải là số
    if (normToken.length === 1 && !/\d/.test(normToken)) {
      continue;
    }

    // Kiểm tra stopword
    if (!keepStopwords && STOPWORDS.has(normToken)) {
      continue;
    }

    // Trả về оригинальный token nếu được yêu cầu, ngược lại trả về normalized
    result.push(returnOriginal ? originalToken : normToken);
  }

  return result;
}

/** Đếm tần suất token */
export function termFrequency(tokens) {
  const freq = new Map();
  for (const t of tokens) {
    if (t && t.trim()) { // Bỏ qua tokens rỗng hoặc chỉ chứa spaces
      freq.set(t, (freq.get(t) || 0) + 1);
    }
  }
  return freq;
}

/**
 * Tạo bigrams (cặp từ liên tiếp) từ danh sách tokens
 * Hữu ích để bắt các cụm từ quan trọng như "tăng động", "giảm chú ý"
 */
export function generateBigrams(tokens, { minFrequency = 2 } = {}) {
  if (!tokens || tokens.length < 2) return [];

  const bigramFreq = new Map();

  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = `${tokens[i]} ${tokens[i + 1]}`;
    bigramFreq.set(bigram, (bigramFreq.get(bigram) || 0) + 1);
  }

  // Lọc bigrams có tần suất tối thiểu và không chứa stopwords
  const result = [];
  for (const [bigram, count] of bigramFreq.entries()) {
    if (count >= minFrequency) {
      const words = bigram.split(' ');
      // Kiểm tra cả hai từ không phải là stopword
      const normWords = words.map(w => normalizeForMatch(w));
      if (!normWords.some(w => STOPWORDS.has(w))) {
        result.push({ bigram, count });
      }
    }
  }

  // Sắp xếp theo tần suất giảm dần
  return result
    .sort((a, b) => b.count - a.count)
    .map(item => item.bigram);
}