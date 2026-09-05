# continue.md — Trạng thái công việc dở dang

> File này dùng để lưu lại tiến độ khi Claude sắp hết token giữa chừng một task,
> HOẶC khi bị người dùng interrupt giữa chừng. Trạng thái mỗi việc luôn là 1 trong 3:
> **✅ Đã xong** — **🔧 Đang sửa dở (có thể chưa test/chưa an toàn)** — **⬜ Chưa bắt đầu**.
>
> Khi có token mới / mở chat mới, copy toàn bộ nội dung dưới "PROMPT TIẾP TỤC" và dán cho Claude.

UU TIÊN ĐỌC HIỂU FILE GRAPHIFY: docs/graphify-out/GRAPH_REPORT.md` — **đã có sẵn trên máy, luôn đọc file này trước khi đọc code thô** khi cần hiểu quan hệ giữa các module (god nodes, community, surprising connections).

---

## Quy tắc cho Claude (đọc trước khi làm bất kỳ task nào trong dự án này)

1. **Trước khi sửa 1 file**, cập nhật trạng thái file đó trong bảng dưới thành 🔧 Đang sửa dở — ghi rõ đang làm gì với nó — RỒI mới bắt đầu sửa. Không sửa xong mới ghi lại (nếu bị ngắt giữa chừng sẽ không ai biết).
2. **Sau khi sửa xong 1 file** (đã ghi vào đĩa, đã tự kiểm tra hợp lý), cập nhật trạng thái thành ✅ Đã xong.
3. Nếu bị ngắt/hết token khi đang 🔧, **giữ nguyên trạng thái 🔧** (đừng tự ý đánh dấu ✅ nếu chưa chắc file đã đúng/hoàn chỉnh) — ghi rõ "đã viết xong nội dung mới chưa" hay "mới sửa được nửa file".
4. Phần "PROMPT TIẾP TỤC" luôn là 1 khối copy-dán được ngay, không cần giải thích thêm.
5. **Trước khi dừng vì sắp hết token** (dù đang 🔧 hay vừa xong 1 loạt file ✅): nếu có bất kỳ file `.js` nào trong `ai2/` đã bị sửa nội dung kể từ lần cập nhật graphify gần nhất, PHẢI cập nhật lại graph trước khi dừng — xem mục "Graphify — bản đồ codebase" bên dưới để biết cách chạy. Ghi rõ trong bảng trạng thái là graph đã cập nhật hay chưa (đừng để continue.md nói "đã xong" mà graph lại phản ánh code cũ).

---

## Trạng thái hiện tại

**Task tổng thể:** Nâng cấp chatbot ADHD tại `C:\Users\hdtua\Downloads\WEB\docs\ai2\` theo kế hoạch 7 Priority trong `AUDIT-chatbot-adhd.md`.

**Đang làm: Priority 1 — Chunk lại theo đơn vị ngữ nghĩa nhỏ nhất**

| File | Trạng thái | Ghi chú |
|---|---|---|
| `ai2/core/extractor/content-extractor.js` | ✅ Đã xong | Đã viết lại hoàn chỉnh: thêm extract `<li>` cấp section, thêm 6 hàm extract sub-document (`.subtype-card`, `.cause-card`, consequence `<li>`, `.med-card`, `.lifestyle-card`, `.hospital-card` có phân biệt tab hcm/hn theo vị trí, `.accordion-item` có gắn nhóm FAQ theo vị trí). Đã ghi vào đĩa. |
| `ai2/core/cleaner/content-cleaner.js` | ✅ Đã xong | Đã sửa để pass-through + làm sạch `subDocuments`. Đã ghi vào đĩa. |
| `ai2/core/chunker/semantic-chunker.js` | ✅ Đã xong | Đã sửa để sinh chunk CHA (section) + chunk CON (sub-document), với category con dạng `sectionId:nhomcon` (để tránh "related" tràn lan giữa mọi chunk con cùng section — xem comment trong file). Đã ghi vào đĩa. |
| `ai2/core/graph/graph-builder.js` | ✅ Không cần sửa | Đã kiểm tra: đã đọc sẵn `chunk.parent`, không cần đổi. |
| `ai2/core/graph/relationship-builder.js` | ✅ Không cần sửa | Đã kiểm tra: tự suy `children` từ `parent`, tự suy `related` từ `category` — hoạt động đúng với category mới do chunker sinh ra. |
| `ai2/chat-widget.js` (UI entry point, hàm `buildNavButtons`) | ✅ Đã xong | Đã đổi `node.category === 'co-so-dieu-tri'` thành `node.category.startsWith('co-so-dieu-tri')`, và tương tự cho điều kiện `'faq'` thành `=== 'faq' || startsWith('faq:')` (khớp category con `sectionId:faq` do semantic-chunker.js sinh ra). Đã ghi vào đĩa (đã kiểm tra qua diff thật, không phải suy đoán). |
| `ai2/data/knowledge-graph.json` — chạy lại pipeline để sinh bản mới | 🔧 **Đang làm — PHÁT HIỆN LỖI** | File trên máy (ghi lúc 10:33, 42 node) hiện **là JSON không hợp lệ**: nội dung chứa dấu ngoặc kép thẳng (`"`) chưa escape bên trong string (VD đoạn Hậu quả: `bị gắn mác "lười biếng", "thiếu tập trung"`) → `JSON.parse` sẽ lỗi `Unexpected token`, chatbot sẽ không load được data. Đã xác minh bằng Python `json.load` thật, không phải suy đoán. Nguyên nhân: file này không phải do `pipeline.js` (dùng `JSON.stringify`, luôn escape đúng) ghi ra trực tiếp — có vẻ bị ghi tay/qua bước trung gian làm hỏng escape. Đang: copy `ai2/` + `index.html` sang sandbox, chạy `node pipeline.js` thật để sinh lại file đúng, xác minh `JSON.parse` được trước khi ghi đè lại máy user. |
| `ai2/pipeline.js` — xoá ghi chú "TINH CHỈNH THỦ CÔNG" sai lệch | 🔧 **Đang làm** | **Sửa lại vị trí so với kế hoạch gốc:** ghi chú này thực ra nằm trong comment đầu file `ai2/pipeline.js`, KHÔNG nằm trong `ai2/README.md` như audit mô tả (đã đọc thật README.md — không có đoạn đó). User đã xác nhận sửa ở `pipeline.js`. Đang xoá đoạn comment "LƯU Ý QUAN TRỌNG... tinh chỉnh thủ công" vì từ nay pipeline tự động và data production là một. |
| `ai2/README.md` | ✅ Không cần sửa | Đã đọc thật — không chứa ghi chú sai lệch mà audit mô tả, nên không có gì để xoá ở đây. |

**Chưa bắt đầu (Priority 2-7):** Toàn bộ, xem chi tiết trong `AUDIT-chatbot-adhd.md` mục 12.

---

## Graphify — bản đồ codebase (dùng để tiết kiệm token khi cần hiểu quan hệ giữa các file)

**Trạng thái:** Đã build lần đầu ngày 2026-07-29, chế độ `--code-only` (chỉ parse code bằng tree-sitter cục bộ, không LLM, không cloud — khớp nguyên tắc "100% client-side" của dự án). Kết quả: 146 node, 299 edge, 11 community.

- `docs/graphify-out/GRAPH_REPORT.md` — **đã có sẵn trên máy, luôn đọc file này trước khi đọc code thô** khi cần hiểu quan hệ giữa các module (god nodes, community, surprising connections).
- `docs/graphify-out/graph.html`, `docs/graphify-out/graph.json` — Claude đã build trong sandbox nhưng **CHƯA ghi vào máy user** (để tránh tốn token truyền ~300KB qua context chat) — 2 file này đã được gửi cho user tải về qua chat lúc build; user tự đặt vào `docs/graphify-out/` nếu muốn xem `graph.html` trực quan hoặc query `graph.json`.
- **Cách cập nhật graph khi code `ai2/*.js` đã đổi** (Claude tự làm trong sandbox, không cần user):
  1. Đọc toàn bộ file `.js` đã đổi trong `ai2/` qua `Filesystem:read_text_file`.
  2. Ghi lại các file đó vào bản sao project trong sandbox (`/home/claude/webproj/docs/ai2/...`) cho khớp nội dung mới nhất trên máy user.
  3. Chạy `graphify . --code-only` rồi `graphify cluster-only .` trong `/home/claude/webproj/docs`.
  4. Đọc `graphify-out/GRAPH_REPORT.md` mới, ghi đè vào `C:\Users\hdtua\Downloads\WEB\docs\graphify-out\GRAPH_REPORT.md` qua `Filesystem:write_file` (file nhỏ ~5KB, ghi trực tiếp được, không tốn nhiều token).
  5. `graph.html`/`graph.json` mới thì gửi lại cho user tải qua `present_files` (không ghi thẳng vào máy user, để tiết kiệm token) — chỉ ghi thẳng nếu user yêu cầu rõ.

---

## PROMPT TIẾP TỤC (copy-dán nguyên văn vào chat mới)

```
Tôi đang tiếp tục task nâng cấp chatbot ADHD tại C:\Users\hdtua\Downloads\WEB\docs\ai2\.
Trước tiên hãy đọc C:\Users\hdtua\Downloads\WEB\docs\continue.md để biết chính xác
file nào đã xong (✅), file nào đang sửa dở CHƯA AN TOÀN (🔧 — kiểm tra kỹ trước khi
tin tưởng nội dung file đó), file nào chưa đụng tới (⬜). Đọc thêm
C:\Users\hdtua\Downloads\WEB\docs\AUDIT-chatbot-adhd.md để nắm bối cảnh/kế hoạch gốc,
và C:\Users\hdtua\Downloads\WEB\docs\graphify-out\GRAPH_REPORT.md để có bản đồ quan hệ
giữa các file/hàm trong ai2/ (đọc file này THAY VÌ grep mò code thô khi cần biết
hàm/file nào gọi hàm/file nào — xem mục "Graphify" trong continue.md để biết cách
cập nhật nếu graph cũ hơn code).
Làm tiếp đúng theo bảng trạng thái trong continue.md, bắt đầu từ dòng 🔧 hoặc ⬜ đầu
tiên. QUY TẮC: trước khi sửa 1 file, đánh dấu 🔧 trong continue.md rồi mới sửa; sau
khi sửa xong đánh dấu ✅. Nếu sắp hết token hoặc bị tôi ngắt giữa chừng: (1) đảm
bảo continue.md luôn phản ánh đúng trạng thái thật tại thời điểm dừng, và (2) nếu đã
có file `.js` nào trong ai2/ bị sửa so với lần cập nhật graphify gần nhất, chạy lại
graphify (theo hướng dẫn trong mục "Graphify" của continue.md) để đồng bộ
GRAPH_REPORT.md trước khi kết thúc, rồi mới dừng.
```
