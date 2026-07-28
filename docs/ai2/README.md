# AI Chatbot ADHD — Knowledge Graph Architecture (Local, GitHub Pages)

> Trạng thái: **Phase 1-8 hoàn tất (Kiến trúc → UI) — đang chờ xác nhận trước khi sang Phase 9 (Testing) và trước khi tích hợp thay thế UI cũ trong index.html.**

## Nguyên tắc cốt lõi

- 100% chạy client-side, deploy thẳng trên GitHub Pages.
- Không backend, không server, không database online, không API cloud (OpenAI/Claude/Gemini/Firebase/Supabase/Pinecone...).
- Chatbot **knowledge-based**: chỉ trả lời dựa trên dữ liệu website, không bịa. Không tìm thấy → nói rõ không có thông tin.
- **Không dùng Embedding / Cosine Similarity làm trung tâm.** Matching dựa trên: entity, intent, keyword, alias, related concept, graph distance, question similarity.

## Lưu ý về code cũ

Thư mục `ai/` gốc đang có sẵn 1 bản cũ dùng embedding (`build.js`, `chat-widget.js`,
`embeddings.json`, `knowledge.json`). Bản cũ **chưa bị đụng vào** — vẫn giữ nguyên
để bạn quyết định (giữ làm fallback / xoá / archive) khi kiến trúc mới sẵn sàng thay thế.

## Pipeline (đúng thứ tự spec)

```
Content Extractor
  -> Content Cleaner
  -> Semantic Chunker
  -> Knowledge Graph Builder
  -> Relationship Builder
  -> Question Generator
  -> Keyword Generator
  -> Entity Generator
  -> Intent Generator
  -> Alias Generator
  -> Knowledge Database (data/knowledge-graph.json)
  -> Graph Search Engine
  -> Scoring Engine
  -> Answer Composer
  -> Chat Engine
  -> Chat UI
```

## Cấu trúc thư mục

```
docs/ai/
├── core/
│   ├── extractor/      content-extractor.js
│   ├── cleaner/         content-cleaner.js
│   ├── chunker/          semantic-chunker.js
│   ├── graph/            graph-builder.js, relationship-builder.js
│   ├── generators/       question-, keyword-, entity-, intent-, alias-generator.js
│   ├── search/            graph-search.js        (BFS/DFS)
│   ├── scoring/           scoring-engine.js
│   ├── answer/            answer-composer.js
│   └── chat/              chat-engine.js
├── data/
│   └── knowledge-graph.json   (rỗng, sẽ được pipeline.js sinh ra)
├── ui/
│   ├── chat-widget.js   (Phase 8 — TỰ CHỨA, không đụng #chatbox cũ)
│   └── chat-widget.css  (dùng var(--coral,...) fallback theo palette site)
├── demo.html             (trang test độc lập cho Phase 8, không đụng index.html)
├── pipeline.js          (orchestrator build-time, chạy bằng node)
├── README.md            (file này)
│
├── build.js              ← bản CŨ (embedding), chưa đụng
├── chat-widget.js         ← bản CŨ (embedding), chưa đụng
├── embeddings.json        ← bản CŨ, chưa đụng
└── knowledge.json          ← bản CŨ, chưa đụng
```

## Node / Edge Schema

**Node**
```ts
{
  id: string,
  title: string,
  summary: string,
  content: string,
  keywords: string[],
  aliases: string[],
  entities: string[],
  parent: string | null,
  children: string[],
  related: string[],
  source: string,
  category: string
}
```

**Edge**
```ts
{
  from: string,
  to: string,
  type: 'parent' | 'child' | 'related' | 'prerequisite' | 'reference'
}
```

## Kế hoạch Phase

| Phase | Nội dung | Trạng thái |
|---|---|---|
| 1 | Kiến trúc + cấu trúc thư mục | ✅ Xong |
| 2 | Builder: Extractor → Cleaner → Chunker | ✅ Xong |
| 3 | Knowledge Graph: Graph Builder + Relationship Builder | ✅ Xong |
| 4 | Question / Keyword / Entity / Intent / Alias Generator | ✅ Xong |
| 5 | Graph Search Engine (BFS/DFS + backtracking) | ✅ Xong |
| 6 | Scoring Engine + Answer Composer | ✅ Xong |
| 7 | Chat Engine | ✅ Xong |
| 8 | Chat UI (floating widget tự chứa) | ✅ Xong — đã tự kiểm tra logic qua demo.html + smoke test Node |
| 9 | Testing (tích hợp thật vào index.html, thay UI cũ) | ⏳ Chờ xác nhận |

## Tự kiểm tra Phase 1

- [x] Đủ 15 file/thư mục khớp 1-1 với từng bước trong pipeline của spec.
- [x] Node/Edge schema khớp chính xác với spec (đúng tên field).
- [x] Không file nào chứa logic thật — chỉ contract + throw "chưa triển khai" (đúng nguyên tắc "không viết toàn bộ dự án 1 lần").
- [x] Không đụng/xoá dữ liệu cũ trong `ai/`.
- [x] Không có dependency ngoài (chưa cần cài package nào ở bước này).

## Tự kiểm tra Phase 8

- [x] Widget tự chứa (class tiền tố `aicw-`), không đụng `#chatbox`/`#chat-toggle`/`style.css` hiện có.
- [x] Đủ tính năng theo spec: Floating Button, Responsive, Dark Mode (auto + toggle có nhớ lựa chọn), Typing Indicator, Loading, Suggested Questions, Copy Answer, Scroll, History (luồng hội thoại trong phiên).
- [x] `mountChatWidget(rootElement, chatEngine, options?)` đúng hợp đồng đã khai báo ở stub gốc.
- [x] Đã tự kiểm tra logic (không phải UI) bằng cách dựng lại core (chat-engine, scoring, graph-search, answer-composer) trong Node và chạy nhiều câu hỏi mẫu — không exception, fallback "không tìm thấy" hoạt động đúng, BFS/DFS-backtracking trả kết quả hợp lý.
- [x] Đã tạo `ai2/demo.html` để tự kiểm tra UI thật trong trình duyệt (độc lập, không đụng `index.html` thật) — cần mở qua static server vì `fetch()` JSON bị chặn với `file://`.
- [ ] **Chưa tự kiểm tra bằng mắt trong trình duyệt thật** (chưa chạy được lệnh `node`/mở trình duyệt từ phía tôi trên máy bạn) — bạn nên tự mở `demo.html` qua static server để xác nhận UI hiển thị đúng trước khi sang Phase 9.

## Việc cần bạn xác nhận trước khi sang Phase 9

1. Mở thử `ai2/demo.html` (qua static server, vd. `npx serve docs` rồi vào `/ai2/demo.html`) — UI hiển thị và trả lời đúng như mong đợi chưa?
2. **Tích hợp thật**: có muốn thay UI cũ (`#chatbox` trong `index.html`, dùng `ai/chat-widget.js` bản embedding) bằng widget mới (`ai2/ui/chat-widget.js`) ngay bây giờ không, hay giữ song song một thời gian để so sánh?
3. **Dữ liệu cũ**: giữ `build.js`/`chat-widget.js`/`embeddings.json`/`knowledge.json` cũ ở `ai/` lại làm gì, hay xoá khi chính thức chuyển hẳn sang `ai2/`?
4. Xác nhận bắt đầu **Phase 9 (Testing)** — sẽ gồm: viết test case cho scoring/answer với các câu hỏi thật đa dạng (trực tiếp/gián tiếp/không dấu/viết tắt), kiểm tra hiệu năng khi graph lớn hơn, và (nếu bạn đồng ý ở mục 2) sửa `index.html`/`script.js` để chuyển hẳn sang widget mới.
