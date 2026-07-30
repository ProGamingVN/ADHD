/**
 * MODULE: Content Extractor (Phase 2 → nâng cấp Priority 1 theo AUDIT-chatbot-adhd.md)
 *
 * Đọc index.html và trích theo 2 cấp:
 *   1. CẤP SECTION (như cũ): heading (h2-h5) + toàn bộ đoạn văn (p, li) của
 *      section — dùng làm node CHA cho câu hỏi tổng quát ("Cơ sở điều trị
 *      ADHD" -> trả lời cả section).
 *   2. CẤP SUB-DOCUMENT (MỚI): mỗi "card"/mục nhỏ mà HTML đã tự có sẵn ranh
 *      giới rõ ràng (.subtype-card, .cause-card, .med-card, .lifestyle-card,
 *      .hospital-card, .accordion-item, consequence-list <li>) trở thành 1
 *      sub-document riêng — dùng làm node CON cho câu hỏi cụ thể ("Methyl-
 *      phenidate là gì", "Bệnh viện nào ở Hà Nội", "câu hỏi về RSD"...).
 *
 * LÝ DO: audit phát hiện gốc rễ mọi lỗi trả lời sai trọng tâm là do trước
 * đây MỖI SECTION = 1 NODE DUY NHẤT (VD "Điều trị – Hỗ trợ" gộp chung 6 loại
 * thuốc), trong khi HTML nguồn đã có sẵn cấu trúc chi tiết hơn nhiều — chỉ
 * là extractor cũ không đọc tới nó (và còn bỏ sót hẳn <li>).
 *
 * Dùng regex có kiểm soát (không dùng thư viện DOM ngoài) — phù hợp vì cấu
 * trúc HTML của trang được kiểm soát và ổn định (site tự viết tay, không
 * phải HTML tự do). Nếu sau này đổi cấu trúc trang lớn, nên thay bằng một
 * trình phân tích DOM thật (vd. linkedom) để an toàn hơn.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { stripDiacritics } from '../generators/_utils/text-utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_INDEX_PATH = path.resolve(__dirname, '../../../index.html');

function stripTags(html) {
  return html
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/** id ngắn gọn, không dấu, chỉ chữ-số-gạch ngang — dùng làm hậu tố id node con */
function slugify(text) {
  return stripDiacritics(String(text || ''))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'muc';
}

function extractSections(html) {
  // Bắt từng khối <section ... id="xxx" ...> ... </section> (không lồng section trong section ở site này)
  const sectionRegex = /<section\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g;
  const sections = [];
  let match;
  while ((match = sectionRegex.exec(html))) {
    const [, id, body] = match;
    sections.push({ id, rawBody: body });
  }
  return sections;
}

function extractHeadingText(body, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(body))) out.push(stripTags(m[1]));
  return out.filter(Boolean);
}

/**
 * Lấy TOÀN BỘ đoạn văn cấp section — bao gồm cả <p> LẪN <li> (trước đây bỏ
 * sót <li>, khiến địa chỉ bệnh viện dạng danh sách không được index ở cấp
 * section nếu chạy pipeline tự động).
 */
function extractParagraphs(body) {
  const pRe = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  const liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  const out = [];
  let m;
  while ((m = pRe.exec(body))) {
    const text = stripTags(m[1]);
    if (text) out.push(text);
  }
  while ((m = liRe.exec(body))) {
    const text = stripTags(m[1]);
    if (text) out.push(text);
  }
  return out;
}

// ---------------------------------------------------------------------
// SUB-DOCUMENT EXTRACTORS — mỗi hàm khai thác đúng 1 loại "card"/khối nhỏ
// đã có sẵn class ổn định trong index.html hiện tại.
// ---------------------------------------------------------------------

/** 01. Nhận diện ADHD -> 3 phân nhóm biểu hiện (.subtype-card) */
function extractSubtypeCards(body) {
  const re = /<div class="subtype-card[^"]*"[^>]*>\s*<span class="subtype-tag">([\s\S]*?)<\/span>\s*<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>\s*<\/div>/g;
  const out = [];
  let m;
  while ((m = re.exec(body))) {
    const tag = stripTags(m[1]);
    const title = stripTags(m[2]);
    const text = stripTags(m[3]);
    out.push({
      idSuffix: slugify(title),
      title: `${title} (${tag})`,
      content: `${title} (${tag}): ${text}`,
      meta: { group: 'subtype' }
    });
  }
  return out;
}

/** 02. Nguyên nhân – Hậu quả -> từng nguyên nhân (.cause-card, kể cả biến thể có ảnh) */
function extractCauseCards(body) {
  const out = [];
  let m;

  const simpleRe = /<div class="cause-card reveal"[^>]*>\s*<span class="lifestyle-icon">[\s\S]*?<\/span>\s*<h4>([\s\S]*?)<\/h4>\s*<p>([\s\S]*?)<\/p>\s*<\/div>/g;
  while ((m = simpleRe.exec(body))) {
    const title = stripTags(m[1]);
    const text = stripTags(m[2]);
    out.push({ idSuffix: slugify(title), title, content: text, meta: { group: 'nguyen-nhan' } });
  }

  const mediaRe = /<div class="cause-media-body">\s*<h4>([\s\S]*?)<\/h4>\s*<p>([\s\S]*?)<\/p>/g;
  while ((m = mediaRe.exec(body))) {
    const title = stripTags(m[1]);
    const text = stripTags(m[2]);
    out.push({ idSuffix: slugify(title), title, content: text, meta: { group: 'nguyen-nhan' } });
  }

  return out;
}

/** 02. Nguyên nhân – Hậu quả -> từng hậu quả (<ul class="consequence-list"><li>) */
function extractConsequenceItems(body) {
  const listMatch = /<ul class="consequence-list">([\s\S]*?)<\/ul>/.exec(body);
  if (!listMatch) return [];
  const re = /<li[^>]*>\s*<strong>([\s\S]*?)<\/strong>\s*<p>([\s\S]*?)<\/p>\s*<\/li>/g;
  const out = [];
  let m;
  while ((m = re.exec(listMatch[1]))) {
    const title = stripTags(m[1]);
    const text = stripTags(m[2]);
    out.push({ idSuffix: slugify(title), title, content: text, meta: { group: 'hau-qua' } });
  }
  return out;
}

/** 03. Điều trị – Hỗ trợ -> từng loại thuốc (.med-card), gắn nhóm thuốc gần nhất theo vị trí */
function extractMedCards(body) {
  const groupRe = /<h4 class="med-group-title">([\s\S]*?)<\/h4>/g;
  const groups = [];
  let gm;
  while ((gm = groupRe.exec(body))) {
    groups.push({ index: gm.index, title: stripTags(gm[1]) });
  }
  function groupFor(idx) {
    let best = '';
    for (const g of groups) {
      if (g.index < idx) best = g.title;
      else break;
    }
    return best;
  }

  const re = /<div class="med-card">\s*<h5>([\s\S]*?)<\/h5>\s*<p>([\s\S]*?)<\/p>\s*<\/div>/g;
  const out = [];
  let m;
  while ((m = re.exec(body))) {
    const title = stripTags(m[1]);
    const text = stripTags(m[2]);
    const group = groupFor(m.index);
    out.push({
      idSuffix: slugify(title),
      title,
      content: group ? `${title} (${group}): ${text}` : `${title}: ${text}`,
      meta: { group: 'medication', medGroup: group }
    });
  }
  return out;
}

/** 03. Điều trị – Hỗ trợ -> từng liệu pháp thể chất/tâm lý (.lifestyle-card) */
function extractLifestyleCards(body) {
  const re = /<div class="lifestyle-card">\s*<h5>([\s\S]*?)<\/h5>\s*<p>([\s\S]*?)<\/p>\s*<span class="lifestyle-icon">/g;
  const out = [];
  let m;
  while ((m = re.exec(body))) {
    const title = stripTags(m[1]);
    const text = stripTags(m[2]);
    out.push({ idSuffix: slugify(title), title, content: text, meta: { group: 'lieu-phap' } });
  }
  return out;
}

/** 04. Cơ sở điều trị -> từng bệnh viện (.hospital-card), xác định tab hcm/hn theo vị trí so với marker panel-hn */
function extractHospitalCards(body) {
  const hnMarkerIndex = body.indexOf('id="panel-hn"');
  const re = /<div class="hospital-card">\s*<h4>([\s\S]*?)<\/h4>\s*<ul>([\s\S]*?)<\/ul>\s*<\/div>/g;
  const out = [];
  let m;
  while ((m = re.exec(body))) {
    const title = stripTags(m[1]);
    const addresses = [];
    const liRe = /<li[^>]*>([\s\S]*?)<\/li>/g;
    let lm;
    while ((lm = liRe.exec(m[2]))) {
      const t = stripTags(lm[1]);
      if (t) addresses.push(t);
    }
    const tab = hnMarkerIndex !== -1 && m.index > hnMarkerIndex ? 'hn' : 'hcm';
    out.push({
      idSuffix: `${tab}-${slugify(title)}`,
      title,
      content: addresses.length ? `${title} — ${addresses.join('; ')}` : title,
      meta: { group: 'hospital', tab }
    });
  }
  return out;
}

/** 05. Câu hỏi nâng cao nhận thức -> từng câu hỏi (.accordion-item), gắn nhóm FAQ gần nhất theo vị trí */
function extractAccordionItems(body) {
  const groupRe = /<span class="faq-group-num">(\d+)<\/span>\s*<div>\s*<h3>([\s\S]*?)<\/h3>/g;
  const groups = [];
  let gm;
  while ((gm = groupRe.exec(body))) {
    groups.push({ index: gm.index, num: gm[1], title: stripTags(gm[2]) });
  }
  function groupFor(idx) {
    let best = null;
    for (const g of groups) {
      if (g.index < idx) best = g;
      else break;
    }
    return best;
  }

  const re = /<div class="accordion-item">\s*<button class="accordion-question"[^>]*>\s*<span>([\s\S]*?)<\/span>[\s\S]*?<\/button>\s*<div class="accordion-answer">\s*<p>([\s\S]*?)<\/p>\s*<\/div>\s*<\/div>/g;
  const out = [];
  let m;
  let i = 0;
  while ((m = re.exec(body))) {
    i += 1;
    const question = stripTags(m[1]);
    const answer = stripTags(m[2]);
    const group = groupFor(m.index);
    out.push({
      idSuffix: `nhom${group ? group.num : i}-${i}`,
      title: question,
      content: answer,
      meta: { group: 'faq', faqGroup: group ? group.title : '' }
    });
  }
  return out;
}

/** Điều phối: chọn đúng bộ extractor sub-document theo sectionId */
function extractSubDocuments(sectionId, body) {
  switch (sectionId) {
    case 'nhan-dien':
      return extractSubtypeCards(body);
    case 'nguyen-nhan-hau-qua':
      return [...extractCauseCards(body), ...extractConsequenceItems(body)];
    case 'dieu-tri-ho-tro':
      return [...extractMedCards(body), ...extractLifestyleCards(body)];
    case 'co-so-dieu-tri':
      return extractHospitalCards(body);
    case 'cau-hoi-nang-cao':
      return extractAccordionItems(body);
    default:
      return [];
  }
}

/**
 * @param {string} [indexPath] đường dẫn tới index.html, mặc định docs/index.html
 * @returns {{
 *   source:string, sectionId:string, title:string, headings:string[], paragraphs:string[],
 *   subDocuments: { id:string, parentId:string, title:string, content:string, meta:object }[]
 * }[]}
 */
export function extractContent(indexPath = DEFAULT_INDEX_PATH) {
  const html = fs.readFileSync(indexPath, 'utf8');
  const sections = extractSections(html);

  return sections.map(({ id, rawBody }) => {
    const h2 = extractHeadingText(rawBody, 'h2')[0] || '';
    const headings = [
      ...extractHeadingText(rawBody, 'h3'),
      ...extractHeadingText(rawBody, 'h4'),
      ...extractHeadingText(rawBody, 'h5')
    ];
    const paragraphs = extractParagraphs(rawBody);
    const subDocuments = extractSubDocuments(id, rawBody).map((sub) => ({
      ...sub,
      id: `${id}-${sub.idSuffix}`,
      parentId: id
    }));

    return {
      source: `#${id}`,
      sectionId: id,
      title: h2 || headings[0] || id,
      headings,
      paragraphs,
      subDocuments
    };
  });
}
