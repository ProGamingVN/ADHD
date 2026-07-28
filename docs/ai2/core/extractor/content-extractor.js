/**
 * MODULE: Content Extractor (Phase 2) — TRIỂN KHAI THẬT
 *
 * Đọc index.html và trích thô theo từng <section id="...">: heading (h2-h5)
 * + đoạn văn bản (p, li, h4/h5 dùng làm tiêu đề khối con). Dùng regex có
 * kiểm soát (không dùng thư viện DOM ngoài) — phù hợp vì cấu trúc HTML của
 * trang được kiểm soát và ổn định (site tự viết tay, không phải HTML tự do).
 *
 * LƯU Ý: regex-based HTML parsing chỉ đáng tin cậy khi cấu trúc HTML nguồn
 * ổn định như ở đây. Nếu sau này đổi cấu trúc trang lớn, nên thay bằng một
 * trình phân tích DOM thật (vd. linkedom) để an toàn hơn.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

function extractParagraphs(body) {
  const re = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  const out = [];
  let m;
  while ((m = re.exec(body))) {
    const text = stripTags(m[1]);
    if (text) out.push(text);
  }
  return out;
}

/**
 * @param {string} [indexPath] đường dẫn tới index.html, mặc định docs/index.html
 * @returns {{source:string, sectionId:string, title:string, headings:string[], paragraphs:string[]}[]}
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

    return {
      source: `#${id}`,
      sectionId: id,
      title: h2 || headings[0] || id,
      headings,
      paragraphs
    };
  });
}
