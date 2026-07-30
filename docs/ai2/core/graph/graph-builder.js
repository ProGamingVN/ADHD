/**
 * MODULE: Knowledge Graph Builder (Phase 3) — TRIỂN KHAI THẬT
 *
 * Biến SemanticChunk[] thành Node[] đầy đủ theo schema chuẩn, tự động điền
 * keywords/entities/intents/aliases bằng các generator tương ứng.
 * parent/children/related để trống — do relationship-builder.js xử lý.
 */

import { generateKeywordsForNode } from '../generators/keyword-generator.js';
import { generateEntitiesForNode } from '../generators/entity-generator.js';
import { generateIntentsForNode } from '../generators/intent-generator.js';
import { generateAliasesForNode } from '../generators/alias-generator.js';

export function buildGraphNodes(semanticChunks) {
  return semanticChunks.map((chunk) => {
    const base = {
      id: chunk.id,
      title: chunk.title,
      summary: chunk.summary,
      content: chunk.content,
      parent: chunk.parent ?? null,
      children: [],
      related: [],
      source: chunk.source,
      category: chunk.category
    };

    const entities = generateEntitiesForNode(base);
    const withEntities = { ...base, entities };

    return {
      ...withEntities,
      keywords: generateKeywordsForNode(withEntities),
      aliases: generateAliasesForNode(withEntities),
      intents: generateIntentsForNode(withEntities)
    };
  });
}
