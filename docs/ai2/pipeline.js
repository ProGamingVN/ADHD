/**
 * ORCHESTRATOR: Build Pipeline — TRIỂN KHAI THẬT
 *
 * Chạy: node ai2/pipeline.js
 * Đọc docs/index.html -> sinh docs/ai2/data/knowledge-graph.json (cấp
 * section — 1 node / 1 <section id="...">).
 *
 * LƯU Ý QUAN TRỌNG: bản data/knowledge-graph.json đang dùng trong sản phẩm
 * hiện tại được TINH CHỈNH THỦ CÔNG chi tiết hơn nhiều so với output mặc
 * định của pipeline này (tách riêng từng loại thuốc, từng bệnh viện, từng
 * câu FAQ...) để đạt độ chi tiết theo yêu cầu. Chạy lại pipeline này sẽ
 * GHI ĐÈ về bản chunk theo section (thô hơn) — chỉ chạy khi thật sự muốn
 * build lại từ đầu, và nên đối chiếu/merge lại phần tinh chỉnh thủ công
 * sau đó.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { extractContent } from './core/extractor/content-extractor.js';
import { cleanContent } from './core/cleaner/content-cleaner.js';
import { chunkContent } from './core/chunker/semantic-chunker.js';
import { buildGraphNodes } from './core/graph/graph-builder.js';
import { buildRelationships } from './core/graph/relationship-builder.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, './data/knowledge-graph.json');

function runPipeline() {
  console.log('[pipeline] Đọc index.html...');
  const raw = extractContent();

  console.log('[pipeline] Làm sạch nội dung...');
  const clean = cleanContent(raw);

  console.log('[pipeline] Chia chunk theo section...');
  const chunks = chunkContent(clean);

  console.log('[pipeline] Build node + generators (keyword/entity/intent/alias)...');
  const nodes = buildGraphNodes(chunks);

  console.log('[pipeline] Build quan hệ (parent/children/related)...');
  const { nodes: finalNodes, edges } = buildRelationships(nodes);

  const output = { nodes: finalNodes, edges };
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');

  console.log(`[pipeline] Xong. Đã ghi ${finalNodes.length} node, ${edges.length} edge -> ${OUTPUT_PATH}`);
}

runPipeline();
