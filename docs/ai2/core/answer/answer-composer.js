/**
 * MODULE: Answer Composer (Phase 6) — TRIỂN KHAI THẬT
 *
 * Ghép câu trả lời từ 1-3 node điểm cao nhất. Ưu tiên dùng node.content (đoạn đầu)
 * thay vì node.summary để trả lời có "thịt" hơn. Loại bỏ node hero/toc khi có
 * node chuyên đề tốt hơn, trừ khi không có lựa chọn nào khác đạt ngưỡng.
 * Thêm hậu xử lý để tránh nội dung trùng lặp khi kết hợp nhiều node.
 */

const MIN_SCORE_THRESHOLD = 2;
const MAX_NODES_IN_ANSWER = 2;
const SIMILARITY_THRESHOLD = 0.5; // Ngưỡngsimilarity trên 50% coi là trùng lặp

// Các category được coi là "chuyên đề" (có nội dung định nghĩa/chủ đề cụ thể)
const SPECIFIC_CATEGORIES = new Set([
  'nhan-dien',           // Nhận diện ADHD
  'nguyen-nhan-hau-qua', // Nguyên nhân - Hậu quả
  'dieu-tri-ho-tro',     // Điều trị - Hỗ trợ
  'co-so-dieu-tri',      // Cơ sở điều trị
  'cau-hoi-nang-cao'     // Câu hỏi nâng cao nhận thức
]);

/**
 * Trích xuất 2-3 câu đầu từ content
 * @param {string} content Nội dung đầy đủ
 * @returns {string} 2-3 câu đầu
 */
function extractFirstSentences(content) {
  if (!content) return '';

  // Tách câu bằng dấu chấm câu chuẩn
  const sentences = content.split(/[.!?]+/);
  // Lấy 2-3 câu đầu không rỗng
  const meaningfulSentences = sentences
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .slice(0, 3);

  return meaningfulSentences.join('. ') + (meaningfulSentences.length > 0 ? '.' : '');
}

/**
 * Tính độ tương đồng giữa hai chuỗi dựa trên tỷ lệ từ chung (Jaccard similarity)
 * @param {string} str1 Chuỗi thứ nhất
 * @param {string} str2 Chuỗi thứ hai
 * @returns {number} Điểm tương đồng từ 0 đến 1
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  // Chuyển thành chữ thường và tách từ
  const words1 = new Set(str1.toLowerCase().match(/\b\w+\b/g) || []);
  const words2 = new Set(str2.toLowerCase().match(/\b\w+\b/g) || []);

  if (words1.size === 0 && words2.size === 0) return 1.0;
  if (words1.size === 0 || words2.size === 0) return 0.0;

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

export function composeAnswer(scoredNodes, allNodes) {
  if (!scoredNodes.length || scoredNodes[0].score < MIN_SCORE_THRESHOLD) {
    return {
      answer:
        'Mình chưa tìm thấy thông tin phù hợp trong dữ liệu của trang về câu hỏi này. ' +
        'Bạn có thể hỏi lại rõ hơn, hoặc xem trực tiếp các mục trên trang nhé.',
      sourceNodeIds: [],
      confident: false
    };
  }

  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

  // BƯỘC 1: PHÂN LOẠI CÁC NODE
  const heroTocNodes = [];   // Các node có category là 'hero' hoặc 'toc'
  const qualityNodes = []    // Các node có category khác và điểm đủ cao

  for (const scoredNode of scoredNodes) {
    const node = nodeMap.get(scoredNode.nodeId);
    if (!node) continue;

    if (['hero', 'toc'].includes(node.category)) {
      heroTocNodes.push(scoredNode);
    } else if (scoredNode.score >= MIN_SCORE_THRESHOLD) {
      qualityNodes.push(scoredNode);
    }
    // Nếu node không thuộc hero/toc nhưng điểm < MIN_SCORE_THRESHOLD, bỏ qua
  }

  // BƯỘC 2: LỰA CHỌN CÁC NODE ĐỂ TRẢ LỜI
  let selectedNodes = [];

  // ƯU TIÊN SỬ DỤNG CHẤT LƯỢNG CAO (non-hero/non-toc với điểm đủ)
  if (qualityNodes.length > 0) {
    // Sắp xếp qualityNodes theo điểm giảm dần (đã có từ scoredNodes nhưng double-check)
    qualityNodes.sort((a, b) => b.score - a.score);

    // Thêm node chất lượng cao nhất
    selectedNodes.push(qualityNodes[0]);

    // Thêm các node chất lượng khác nếu chưa đủ và không trùng lặp quá mức
    for (let i = 1; i < qualityNodes.length && selectedNodes.length < MAX_NODES_IN_ANSWER; i++) {
      const candidate = qualityNodes[i];

      // Kiểm tra độ tương đồng với các node đã chọn
      let isTooSimilar = false;
      for (const selected of selectedNodes) {
        const candidateNode = nodeMap.get(candidate.nodeId);
        const selectedNode = nodeMap.get(selected.nodeId);
        if (!candidateNode || !selectedNode) continue;

        const candidateContent = extractFirstSentences(candidateNode.content);
        const selectedContent = extractFirstSentences(selectedNode.content);
        const similarity = calculateSimilarity(candidateContent, selectedContent);

        if (similarity > SIMILARITY_THRESHOLD) {
          isTooSimilar = true;
          break;
        }
      }

      if (!isTooSimilar) {
        selectedNodes.push(candidate);
      }
    }
  }
  // NẾU KHÔNG CÓ CHẤT LƯỢNG CAO, SỬ DỤNG CÁC NODE CAO NHẤT (có thể bao gồm hero/toc)
  else {
    // Sắp xếp tất cả scoredNodes theo điểm giảm dần
    const sortedScored = [...scoredNodes].sort((a, b) => b.score - a.score);

    // Thêm node có điểm cao nhất
    selectedNodes.push(sortedScored[0]);

    // Thêm các node khác nếu chưa đủ và không trùng lặp quá mức
    for (let i = 1; i < sortedScored.length && selectedNodes.length < MAX_NODES_IN_ANSWER; i++) {
      const candidate = sortedScored[i];

      // Kiểm tra độ tương đồng với các node đã chọn
      let isTooSimilar = false;
      for (const selected of selectedNodes) {
        const candidateNode = nodeMap.get(candidate.nodeId);
        const selectedNode = nodeMap.get(selected.nodeId);
        if (!candidateNode || !selectedNode) continue;

        const candidateContent = extractFirstSentences(candidateNode.content);
        const selectedContent = extractFirstSentences(selectedNode.content);
        const similarity = calculateSimilarity(candidateContent, selectedContent);

        if (similarity > SIMILARITY_THRESHOLD) {
          isTooSimilar = true;
          break;
        }
      }

      if (!isTooSimilar) {
        selectedNodes.push(candidate);
      }
    }
  }

  // BƯỘC 3: TẠO CÂU TRẢ LỜI TỪ CÁC NODE ĐƯỢC CHỌN
  const parts = selectedNodes.map(({ nodeId }) => {
    const node = nodeMap.get(nodeId);
    if (!node) return '';

    // Ưu tiên dùng content thay vì summary, lấy 2-3 câu đầu
    const contentSnippet = extractFirstSentences(node.content);
    const textToUse = contentSnippet.trim() !== '' ? contentSnippet : node.summary;

    const link = node.source ? ` <a href="${node.source}">(xem thêm)</a>` : '';
    return `<p><strong>${escapeHtml(node.title)}</strong>: ${escapeHtml(textToUse)}${link}</p>`;
  });

  return {
    answer: parts.join(''),
    sourceNodeIds: selectedNodes.map((t) => t.nodeId),
    confident: true
  };
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>');
}