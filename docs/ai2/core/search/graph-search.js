/**
 * MODULE: Graph Search Engine (Phase 5) — TRIỂN KHAI THẬT
 *
 * Hỗ trợ: BFS, DFS-với-Backtracking, Depth Limit, Visited Set,
 * Cycle Detection, Neighbor Expansion, Context Merge.
 *
 * BACKTRACKING (theo yêu cầu): dùng cho thuật toán DFS — duyệt sâu theo
 * 1 nhánh (children -> related -> parent), nếu nhánh đó không sinh thêm
 * node mới hữu ích thì "lùi lại" (backtrack) điểm rẽ trước đó và thử
 * nhánh kế tiếp, thay vì chỉ đơn thuần đánh dấu visited rồi bỏ qua.
 */

function getNeighbors(graph, nodeId) {
  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node) return [];
  const ids = new Set([
    ...(node.children || []),
    ...(node.related || []),
    ...(node.parent ? [node.parent] : [])
  ]);
  return [...ids].filter((id) => graph.nodes.some((n) => n.id === id));
}

/** BFS thuần, có depth limit + visited set */
function bfs(graph, startIds, maxDepth) {
  const visited = new Set(startIds);
  const order = [];
  let frontier = startIds.map((id) => ({ id, depth: 0 }));

  while (frontier.length) {
    const next = [];
    for (const { id, depth } of frontier) {
      order.push(id);
      if (depth >= maxDepth) continue;
      for (const neighborId of getNeighbors(graph, id)) {
        if (visited.has(neighborId)) continue; // cycle detection / no re-visit
        visited.add(neighborId);
        next.push({ id: neighborId, depth: depth + 1 });
      }
    }
    frontier = next;
  }
  return order;
}

/**
 * DFS với backtracking tường minh:
 * - path[] theo dõi nhánh hiện tại (để cycle detection trong-nhánh).
 * - visited theo dõi toàn cục để không lặp giữa các nhánh khác nhau.
 * - Khi hết nhánh con hữu ích, hàm return và path.pop() (backtrack) trước
 *   khi vòng lặp của node cha thử neighbor tiếp theo.
 */
function dfsBacktracking(graph, startIds, maxDepth) {
  const visited = new Set();
  const order = [];
  const path = []; // stack cho backtracking

  function visit(id, depth) {
    if (visited.has(id)) return;      // cycle detection
    if (depth > maxDepth) return;     // depth limit

    visited.add(id);
    path.push(id);                    // đi tới (advance)
    order.push(id);

    for (const neighborId of getNeighbors(graph, id)) {
      if (path.includes(neighborId)) continue; // tránh quay lại chính nhánh đang đi (cycle)
      visit(neighborId, depth + 1);
    }

    path.pop();                       // backtrack: lùi lại điểm rẽ trước khi trả về cho cha
  }

  for (const id of startIds) visit(id, 0);
  return order;
}

/**
 * searchGraph — API chính.
 * @param {{nodes: object[], edges: object[]}} graph
 * @param {string[]} startNodeIds
 * @param {{maxDepth?: number, algorithm?: 'bfs'|'dfs'}} options
 * @returns {object[]} Node[] — context đã mở rộng, không trùng lặp, giữ thứ tự liên quan giảm dần
 */
export function searchGraph(graph, startNodeIds, options = {}) {
  const { maxDepth = 2, algorithm = 'bfs' } = options;
  const orderedIds =
    algorithm === 'dfs'
      ? dfsBacktracking(graph, startNodeIds, maxDepth)
      : bfs(graph, startNodeIds, maxDepth);

  const seen = new Set();
  const result = [];
  for (const id of orderedIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const node = graph.nodes.find((n) => n.id === id);
    if (node) result.push(node);
  }
  return result;
}

/** Context Merge: gộp nội dung nhiều node thành 1 khối văn bản dùng cho Answer Composer */
export function mergeContext(nodes) {
  return nodes
    .map((n) => `## ${n.title}\n${n.summary}`)
    .join('\n\n');
}
