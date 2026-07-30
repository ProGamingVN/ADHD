/**
 * MODULE: Relationship Builder (Phase 3) — TRIỂN KHAI THẬT
 *
 * Xác định quan hệ giữa các Node:
 * - parent/children: dựa trên field "parent" đã gán sẵn ở node (nếu builder
 *   nguồn có set), hoặc để trống nếu node ở cấp cao nhất (1 section = 1 node
 *   gốc khi build tự động theo section).
 * - related: 2 node cùng "category" (nhưng khác id) được coi là related.
 */

export function buildRelationships(nodes) {
  const byId = new Map(nodes.map((n) => [n.id, n]));

  // parent -> children (suy ngược từ field parent đã có sẵn trên từng node)
  for (const node of nodes) {
    if (node.parent && byId.has(node.parent)) {
      const parentNode = byId.get(node.parent);
      if (!parentNode.children.includes(node.id)) {
        parentNode.children.push(node.id);
      }
    }
  }

  // related: cùng category, không phải quan hệ cha-con
  for (const node of nodes) {
    const relatedIds = nodes
      .filter((other) =>
        other.id !== node.id &&
        other.category === node.category &&
        other.parent !== node.id &&
        node.parent !== other.id
      )
      .map((other) => other.id);
    node.related = [...new Set([...(node.related || []), ...relatedIds])];
  }

  const edges = [];
  for (const node of nodes) {
    if (node.parent) edges.push({ from: node.parent, to: node.id, type: 'parent' });
    for (const relId of node.related) edges.push({ from: node.id, to: relId, type: 'related' });
  }

  return { nodes, edges };
}
