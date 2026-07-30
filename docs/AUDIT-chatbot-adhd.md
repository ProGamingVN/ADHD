# AUDIT TOÀN DIỆN — Chatbot ADHD (Knowledge Graph Architecture)

> Đã đọc trực tiếp toàn bộ source thật tại `C:\Users\hdtua\Downloads\WEB\docs\ai2\` (10 module core, pipeline.js, chat-widget.js, README.md) và `data/knowledge-graph.json` (dữ liệu production thật), đối chiếu với `index.html` gốc. Không đoán — mọi kết luận dưới đây trích từ code/data thật.

---

## 0. Phát hiện nền tảng quan trọng nhất (đọc trước khi đọc phần còn lại)

**`data/knowledge-graph.json` production hiện tại chỉ có ĐÚNG 8 NODE** — một node cho mỗi `<section id="...">` của trang: `hero`, `toc`, `nhan-dien`, `nguyen-nhan-hau-qua`, `dieu-tri-ho-tro`, `co-so-dieu-tri`, `cau-hoi-nang-cao`, `lien-he`.

README.md tự nhận:
> "bản `data/knowledge-graph.json` đang dùng trong sản phẩm hiện tại được TINH CHỈNH THỦ CÔNG chi tiết hơn nhiều... (tách riêng từng loại thuốc, từng bệnh viện, từng câu FAQ...)"

**Điều này SAI so với thực tế của file trên đĩa.** Không có bất kỳ node nào tách riêng: không có node riêng cho Methylphenidate, Amphetamines, Atomoxetine, Clonidine, Guanfacine; không có node riêng cho từng bệnh viện; không có node riêng cho từng câu FAQ trong 4 nhóm. Toàn bộ nội dung "Điều trị – Hỗ trợ" (6 loại thuốc + 4 liệu pháp) nằm chung trong **1 node duy nhất** `dieu-tri-ho-tro`. Toàn bộ 7 bệnh viện ở 2 thành phố nằm chung trong **1 node duy nhất** `co-so-dieu-tri`. Toàn bộ 4 nhóm × 7 câu FAQ nằm chung trong **1 node duy nhất** `cau-hoi-nang-cao`.

Ngược lại, chính `index.html` lại có cấu trúc rất chi tiết ở tầng HTML: mỗi loại thuốc là 1 `.med-card` riêng, mỗi bệnh viện là 1 `.hospital-card` riêng (trong tab HCM/Hà Nội riêng biệt), mỗi câu hỏi là 1 `.accordion-item` riêng có sẵn ranh giới câu hỏi/câu trả lời rõ ràng. **Nguồn dữ liệu thô đã có sẵn cấp độ chi tiết cần thiết — nhưng pipeline hiện tại (cả bản tự động lẫn bản "tinh chỉnh tay") không khai thác nó.**

Đây là nguyên nhân gốc rễ (root cause) của gần như mọi vấn đề được liệt kê trong các mục 2–11 bên dưới. Tôi sẽ trỏ lại phát hiện này nhiều lần.

---

## 1. Đánh giá Pipeline theo từng module

| Module | File | Đánh giá |
|---|---|---|
| **Content Extractor** | `core/extractor/content-extractor.js` | Dùng regex để bóc `<section id="...">`, chỉ lấy `h3/h4/h5` làm heading và **chỉ lấy `<p>`** làm nội dung. **Bỏ sót hoàn toàn `<li>`** — toàn bộ địa chỉ bệnh viện trong `index.html` nằm trong `<li>` (`<ul><li>Cơ sở 1: 766 Võ Văn Kiệt...</li></ul>`), extractor sẽ **không lấy được** nếu chạy thật. Cũng không đọc `.med-card`, `.hospital-card`, `.accordion-item`, `.cause-card` — tức là bỏ hẳn ranh giới ngữ nghĩa nhỏ mà HTML đã tự nhiên cung cấp. |
| **Content Cleaner** | `core/cleaner/content-cleaner.js` | Đơn giản, đúng việc: gộp khoảng trắng, lọc caption rác. Không có vấn đề nghiêm trọng, nhưng vì hoạt động sau extractor lỗi ở trên nên "sạch" một dữ liệu vốn đã thiếu. |
| **Semantic Chunker** | `core/chunker/semantic-chunker.js` | Tên gọi "Semantic Chunker" gây hiểu lầm — **thực chất không chunk gì cả**, chỉ đơn giản là `1 section = 1 chunk` (`id: doc.sectionId`). Không có logic tách theo heading con dù comment nói "mỗi heading con... là gợi ý ranh giới". Đây chính là nơi lẽ ra phải sinh ra chunk cấp thuốc/bệnh viện/FAQ nhưng không làm. |
| **Graph Builder** | `core/graph/graph-builder.js` | Logic đúng, gọi đủ 4 generator. Nhưng input đầu vào (chunk quá thô) khiến output cũng thô theo — garbage-in/garbage-out ở tầng trên. |
| **Relationship Builder** | `core/graph/relationship-builder.js` | `related` được suy ra tự động bằng "cùng category ⇒ related" — với 8 category (mỗi node 1 category riêng) thì rule này gần như vô nghĩa (mỗi node là category riêng, không ai "cùng category" với ai trừ khi có `parent` con cháu). Trong data thật, `related`/`children`/`parent` cuối cùng là gán tay, không phải sinh từ hàm này — tức module này **không thực sự chạy trên data production**. |
| **Generators (keyword/entity/intent/alias/question)** | `core/generators/*.js` | Thiết kế rule-based/dictionary tốt, không phụ thuộc cloud — đúng nguyên tắc đề ra. Nhưng: (a) entity dictionary và intent rules là danh sách tay, sẽ không mở rộng khi thêm nội dung mới; (b) không có từ khóa cho các cách hỏi thông thường như "chữa được không", "khỏi không", "hết không" → xem mục 8. |
| **Query Parser / Rewriter** | `core/parser/*.js` | Kiến trúc tốt — tái dùng đúng 1 nguồn luật (entity dictionary, intent rules, alias dictionary) cho cả node lẫn query, tránh lệch pha. Đây là điểm sáng thực sự của hệ thống. |
| **Graph Search (BFS/DFS)** | `core/search/graph-search.js` | Code implement BFS và DFS-backtracking đúng thuật toán, cycle detection ổn. **Nhưng gần như không được dùng cho truy vấn chính** — xem mục 8, `ChatEngine.ask()` chỉ gọi `searchGraph` khi có follow-up, không dùng để mở rộng context cho câu hỏi đầu tiên. Với 8 node, một hệ thống graph-search BFS/DFS đầy đủ là over-engineering so với nhu cầu thực tế — trừ khi mục tiêu là chuẩn bị cho graph lớn hơn nhiều (xem mục 6, 12). |
| **Scoring Engine** | `core/scoring/scoring-engine.js` | Thiết kế khá tốt: entity/alias/keyword/intent/question-similarity + IDF-like weighting để giảm trọng số từ phổ biến ("ADHD" xuất hiện ở hầu hết node). Không dùng cosine similarity — đúng nguyên tắc. Điểm yếu: hoạt động trên node quá thô (mục 0) nên dù chấm điểm đúng node, nội dung trả về vẫn có thể sai trọng tâm (xem Answer Composer). |
| **Answer Composer** | `core/answer/answer-composer.js` | **Đây là bug nghiêm trọng nhất hệ thống.** Xem phân tích riêng ở mục 3. |
| **Chat Engine** | `core/chat/chat-engine.js` | Điều phối rõ ràng, có xử lý follow-up (dò theo graph distance), có small-talk tách riêng hợp lý. Vấn đề nằm ở `_buildSuggestions` (mục 4) và việc graph-search bị "để không" cho câu hỏi thường. |
| **UI (`ui/chat-widget.js`, `chat-widget.js` entry point)** | | Kỹ thuật cấy CSS/event tốt, tương thích ngược với `index.html`/`script.js` cũ, không đụng DOM cũ — an toàn. Nhưng render RA 3 NHÓM nút khác nhau cho 1 câu trả lời: nav-button ("Đi tới phần"), suggestion-chip (câu hỏi gợi ý), và copy-button — xem mục 4. |

**Phát hiện phụ:** `index.html` vẫn còn tham chiếu `<link rel="stylesheet" href="./ai/chat.css">` — file này **không tồn tại** trong thư mục `ai/` (chỉ có `build.js`, `chat-widget.js`, `embeddings.json`, `knowledge.json`). Đây là link CSS chết, gây lỗi 404 âm thầm mỗi lần tải trang.

---

## 2. Retrieval

- **Lấy đúng chunk?** Ở cấp "đúng section" thì có (entity/keyword match hoạt động ổn để chọn đúng 1-trong-8 section). Nhưng vì mỗi section là 1 khối khổng lồ, "đúng chunk" không đồng nghĩa "đúng nội dung" — xem mục 3.
- **Lấy dư?** Không nhiều — `MAX_NODES_IN_ANSWER = 2` giới hạn khá chặt. Nhưng vì mỗi node đã tự nó là "dư" (gộp 6 loại thuốc khi chỉ cần 1), dư thừa xảy ra *bên trong* node chứ không phải *giữa* các node.
- **Lấy thiếu?** Có — hệ thống chỉ hiện 2-3 câu đầu (`extractFirstSentences`) của node, dù node có nội dung dài hơn nhiều đúng trọng tâm câu hỏi. Xem mục 3.
- **Ưu tiên đúng section?** Về cơ bản đúng nhờ entity/keyword matching + IDF.
- **Keyword bias?** Có phần — keyword được sinh bằng tần suất từ (title×3, summary×2, content×1) nên các từ xuất hiện nhiều trong đoạn dài (VD "adhd", "dieu", "tri") áp đảo các từ hiếm nhưng quan trọng hơn (VD tên thuốc cụ thể) nếu chúng chỉ xuất hiện 1 lần trong content dài.
- **Embedding bias?** Không — đúng nguyên tắc thiết kế, không dùng embedding/cosine.
- **Lấy nhầm chủ đề?** Có nguy cơ với câu hỏi diễn đạt gián tiếp không khớp entity/intent dictionary (mục 8).

Ví dụ cụ thể trong tài liệu audit của bạn — "Các cơ sở điều trị ADHD" — với data hiện tại, hệ thống **sẽ không** lấy nhầm chunk Thuốc/Nguyên nhân/DSM vì các entity đó không nằm trong node `co-so-dieu-tri`. Điểm này thực ra ổn. Nhưng nếu hỏi "Bệnh viện ở Hà Nội" thì có vấn đề khác nghiêm trọng hơn — xem mục 3.

---

## 3. Answer Composer — vấn đề nghiêm trọng nhất

`extractFirstSentences(content)` luôn lấy **3 câu đầu tiên** của `node.content`, bất kể phần nào của content thực sự khớp với câu hỏi người dùng. Vì mỗi node hiện là một khối gộp nhiều chủ đề con (mục 0), điều này gây ra lỗi trả lời sai trọng tâm một cách hệ thống:

- Hỏi **"Methylphenidate là gì"** → entity match đúng node `dieu-tri-ho-tro` (điểm cao) → nhưng câu trả lời hiển thị là 3 câu đầu của content, tức là đoạn nói về **Amphetamines** (thuốc đầu tiên được liệt kê trong node), **không phải Methylphenidate**.
- Hỏi **"Bệnh viện nào ở Hà Nội chữa ADHD"** → entity "Hà Nội" match đúng node `co-so-dieu-tri` → nhưng 3 câu đầu của content là **danh sách bệnh viện TP. HCM**, không phải Hà Nội (đoạn Hà Nội nằm ở cuối content).
- Hỏi bất kỳ 1 trong 7 câu hỏi cụ thể ở mục "Câu hỏi nâng cao nhận thức" → luôn trả về đoạn mở đầu của Nhóm 01 Câu hỏi 1 (định kiến "lười biếng"), bất kể câu hỏi thật là về TIC, về RSD, hay về thuốc gây nghiện.

Đây không phải là "lan man" hay "lặp ý" như nghi ngờ ban đầu trong yêu cầu — nó **tệ hơn**: là **trả lời đúng chủ đề lớn (section) nhưng sai hẳn nội dung con (sub-topic)**, một dạng lỗi khó phát hiện bằng mắt vì câu trả lời "trông có vẻ liên quan" (đúng section) nhưng người dùng nhận sai thông tin họ cần.

**Không có** cơ chế nào định vị câu/đoạn trong `content` gần với entity/keyword đã match để trích xuất đúng đoạn đó — đây là khoảng trống thiết kế, không phải bug nhỏ.

Về các tiêu chí khác:
- Ghép nguyên văn nhiều đoạn: Có, nhưng đã kiểm soát trùng lặp bằng Jaccard similarity (`calculateSimilarity`) — thiết kế hợp lý, dùng đúng.
- Lan man: Không nhiều nhờ `MAX_NODES_IN_ANSWER=2` và cắt 3 câu.
- Bỏ sót ý chính: Có — vì luôn lấy đầu node thay vì đoạn liên quan (như trên).

---

## 4. Suggestion — xác nhận đúng vấn đề bạn nêu

Đã trace được chính xác luồng gây ra ví dụ "Nguyên nhân ADHD → Điều trị / Kiến thức ADHD / Cơ sở điều trị":

`ChatEngine._buildSuggestions()` lấy `node.children + node.related` của (các) node vừa trả lời (tối đa 3, không trùng), sinh câu hỏi dạng `"<Tên node> là gì?"`. Với node `nguyen-nhan-hau-qua`, `children=["dieu-tri-ho-tro"]`, `related=["nhan-dien","co-so-dieu-tri","toc"]` → 3 suggestion đầu tiên đúng là **Điều trị – Hỗ trợ / Nhận diện ADHD / Cơ sở điều trị** — khớp 100% với ví dụ bạn đưa ra.

Đồng thời **UI còn render thêm 1 nhóm nút khác** (`buildNavButtons` trong `ai2/chat-widget.js`) là nút "↳ Đi tới phần: …" cho **mỗi section nguồn** đã dùng để trả lời. Với `MAX_NODES_IN_ANSWER=2`, tối đa có thể xuất hiện: 2 nav-button + 3 suggestion-chip + 1 copy-button = tới **6 phần tử tương tác** cho một câu trả lời. Đây là UX quá tải, đúng như bạn nhận định.

**Đánh giá đề xuất "chỉ còn 1 nút ➡ Đi tới phần liên quan":** Hợp lý và nên làm — nhưng cần tách rõ 2 vai trò đang bị nhập nhằng:
- **Điều hướng** (đi xem đúng phần trên trang) — nên giữ, đúng như bạn đề xuất, tối đa 1 nút, chỉ hiện khi câu trả lời chưa đủ chi tiết.
- **Gợi ý câu hỏi tiếp theo** (suggestion chip) — không nên xóa hoàn toàn vì có giá trị dẫn dắt hội thoại, nhưng cần: (a) giảm còn tối đa 1, (b) chỉ hiện khi thực sự liên quan chặt (hiện tại lấy máy móc theo `related` cấp section, không có ngưỡng liên quan ngữ nghĩa nào).

---

## 5. Kiến thức — AI có thực sự "hiểu" hay chỉ đang search?

**Đang search, không hiểu.** Đây là kết luận cần nói thẳng: toàn bộ hệ thống là **structured keyword/entity/intent retrieval trên dictionary tĩnh + trích xuất câu tĩnh**, không có bất kỳ tầng suy luận/tổng hợp ngôn ngữ tự nhiên nào. Điều này *đúng với chủ đích thiết kế* (README nói rõ "không dùng LLM, không cloud"), nên không phải lỗi kiến trúc — nhưng cần đánh giá đúng khả năng thật của nó khi trả lời câu hỏi ngoài khuôn dictionary:

- Hỏi **"ADHD là gì?"** → có, khớp trực tiếp entity + node `nhan-dien`/`hero`.
- Hỏi **"Thuốc"** → có match keyword nhưng trả về **đầu content** node `dieu-tri-ho-tro` = đoạn Amphetamines, không phải "thuốc" nói chung một cách tổng hợp.
- Hỏi **"Các cơ sở điều trị"** → có, đúng node, đúng vì đây là câu hỏi mức section.
- Hỏi **"Methylphenidate"** → entity có trong dictionary, match đúng node, nhưng **answer sai** (xem mục 3).
- Hỏi **"DSM-5"** → entity có trong dictionary (`INTENT_RULES.diagnosis` chứa `dsm-5`), sẽ match node `nhan-dien` — đúng.

Vậy: hệ thống "biết" ở mức **có tồn tại entity trong dictionary hay không**, không "biết" ở mức **hiểu nội dung liên quan đến entity đó nằm ở đâu trong đoạn text dài**. Đây là ranh giới thật của hệ thống, cần nói rõ với người dùng cuối/khách hàng.

---

## 6. Knowledge Coverage

- Toàn bộ website (8 section) có đại diện trong data — **có**, không thiếu section nào.
- Section nào bị bỏ qua? Không (8/8 section có node).
- Heading nào không index? **Có** — do chunker không tách theo `h4/h5`/`.med-group-title`, các tiêu đề con (VD "Thuốc kích thích thần kinh trung ương" vs "Thuốc không chứa chất kích thích") bị hoà tan vào 1 block content, mất khả năng phân biệt truy vấn.
- Markdown nào không parse? Không áp dụng — nguồn là HTML, extractor không đọc markdown.
- Table nào không parse? Trang không có `<table>`, không áp dụng.
- HTML nào bị bỏ qua? **Có, nghiêm trọng** — extractor bỏ hẳn `<li>` (địa chỉ bệnh viện), `.accordion-answer` (nếu chạy tự động sẽ đọc nhầm câu hỏi accordion là heading và mất cấu trúc Q/A), `.med-card`, `.hospital-card`, `.cause-card`, `.lifestyle-card` — tất cả các "thẻ" (card) nhỏ cấu trúc rõ ràng trong HTML không được extractor nhận diện là đơn vị riêng.
- Internal link nào không parse? Không được extractor xử lý (link nguồn `<a href>` bị `stripTags` xoá luôn, mất khả năng trích dẫn nguồn tự động — hiện nguồn trích dẫn trong content là gõ tay).
- Metadata nào chưa dùng? `node.category`, `node.intents` có nhưng **answer-composer không dùng intent để chọn đoạn** — chỉ dùng category để phân loại hero/toc. Rất nhiều tín hiệu đã sinh ra (`intents`, `entities` theo từng câu) nhưng không có cầu nối tới bước cắt câu trả lời.

**Kết luận mục 6:** Coverage ở cấp "có nhắc tới" thì đủ (nhờ data hand-written), nhưng cấp "index đúng đơn vị ngữ nghĩa nhỏ nhất" thì thiếu nghiêm trọng — đây chính là mục 0 nhắc lại dưới góc nhìn coverage.

---

## 7. Chunking

- Chunk hiện tại **quá lớn** — trung bình mỗi node gộp 3-7 chủ đề con hoàn toàn có thể tách độc lập (ví dụ node `dieu-tri-ho-tro` gộp 6 loại thuốc + 4 liệu pháp thành 1 blob).
- Không cắt giữa câu (chunk = cả section, không cắt).
- Có cắt giữa "cụm ý" một cách gián tiếp khi answer composer chỉ lấy 3 câu đầu — về bản chất tương đương chunk quá lớn kết hợp "đọc chunk" quá ngắn.
- Không mất ngữ cảnh tổng thể ở cấp section, nhưng **mất hoàn toàn ngữ cảnh ở cấp sub-topic** khi trả lời.

---

## 8. Search — hiểu câu hỏi hay chỉ khớp từ?

**Chỉ khớp từ theo dictionary**, không có suy luận ngữ nghĩa/paraphrase. Ví dụ cụ thể trong chính yêu cầu audit của bạn — "ADHD chữa được không" — tôi đã kiểm tra trực tiếp `INTENT_RULES.treatment = ['dieu tri', 'can thiep', 'lieu phap', 'phac do']` và toàn bộ `ADHD_ENTITY_DICTIONARY`: **không có từ khoá nào cho "chữa", "khỏi", "hết bệnh", "trị dứt điểm"**. Với câu này, hệ thống sẽ chỉ match được entity "ADHD" (rất phổ biến, IDF thấp → điểm thấp, gần như hoà giữa mọi node) và không match được intent `treatment`/`prognosis` (thực ra `prognosis`/`management`/`cure` **không tồn tại** trong `INTENT_TAXONOMY` — taxonomy chỉ có 16 intent, không có khái niệm "tiên lượng"/"quản lý bệnh" như bạn kỳ vọng). Kết quả thực tế: câu hỏi này nhiều khả năng rơi vào nhánh "không tìm thấy thông tin phù hợp" hoặc trả lời lệch (VD node `hero` vì đó là node có entity "ADHD" dày đặc nhất).

Đây là bằng chứng cụ thể, đo được: **search hiện tại là bag-of-keywords có trọng số IDF, được ngụy trang bằng tên gọi "entity/intent/graph" — không phải hiểu câu hỏi.** Không sai nguyên tắc thiết kế (không cloud/LLM), nhưng cần thành thật về giới hạn này khi lập kế hoạch cải tiến — đừng kỳ vọng graph search/BFS-DFS "cứu" được vấn đề paraphrase, vì gốc rễ nằm ở tầng dictionary/rule, không nằm ở tầng graph traversal.

**Graph Search có được dùng không?** Về kỹ thuật là **không**, trừ tình huống follow-up (câu hỏi ngắn ≤4 từ hoặc chứa từ như "còn", "vậy", "thêm"). Với câu hỏi độc lập đầu tiên, toàn bộ pipeline retrieval chỉ là `scoreNodes()` chấm điểm phẳng trên 8 node — không có bước "mở rộng ngữ cảnh qua graph" nào chạy. Modules `graph-search.js` (BFS/DFS/backtracking) tồn tại nhưng **thực chất không tham gia vào phần lớn câu trả lời thực tế**.

---

## 9. Scoring

Có ưu tiên theo trọng số rõ ràng trong code (`WEIGHTS`):
```
entity: 5, alias: 4, questionSimilarity: 6, intent: 3, keyword: 2, graphDistance: 2, relatedBonus: 1 (không thấy dùng thực tế)
```
`questionSimilarity` (6) và `entity` (5, có nhân IDF) là 2 tín hiệu mạnh nhất — hợp lý vì đây là tín hiệu đặc thù nhất. Không có ưu tiên riêng cho "heading"/"title match" như một trục độc lập (title chỉ được cộng gián tiếp qua trọng số ×3 khi sinh keyword) — nếu người dùng gõ đúng tiêu đề node thì vẫn phải đi qua toàn bộ hàm entity/alias/keyword/question-similarity thay vì có một "exact-title-match bonus" trực tiếp, nhanh và chắc chắn hơn.

---

## 10. Độ chính xác ước tính

Với kiến trúc và data thực tế đã đọc, ước tính trên 100 câu hỏi thực tế đa dạng (trực tiếp + gián tiếp + đời thường + follow-up):

| Loại câu hỏi | Ước tính đúng |
|---|---|
| Hỏi thẳng tên section/khái niệm chính (VD "ADHD là gì", "Cơ sở điều trị ở đâu") | ~85–90% |
| Hỏi cụ thể một mục con trong section lớn (VD tên 1 loại thuốc, 1 bệnh viện, 1 câu FAQ cụ thể) | **~20–35%** — đúng section nhưng thường sai đoạn nội dung (mục 3) |
| Hỏi diễn đạt gián tiếp/đời thường không trùng từ khoá dictionary (VD "chữa được không", "có nguy hiểm không") | ~20–40%, phụ thuộc may rủi có rơi vào rule đã khai báo hay không |
| Hỏi không dấu, viết tắt có trong alias dictionary (VD "Ritalin", "RLTĐGCY") | ~80–90% — phần này làm khá tốt |
| Follow-up ngắn ("còn cái này thì sao") | Trung bình — phụ thuộc `lastNodeIds` có đúng ngữ cảnh trước đó không |

**Tổng thể ước tính ~50–60% trên tập câu hỏi đa dạng thực tế**, thấp hơn nhiều so với cảm giác "hệ thống được thiết kế bài bản" — vì lỗi nằm ở đúng chỗ khó nhìn thấy nhất khi test nhanh (trả lời "coi như đúng chủ đề" nhưng sai chi tiết).

Nguyên nhân sai/thiếu, xếp theo mức ảnh hưởng:
1. Chunk quá thô + answer composer luôn lấy đầu content (mục 0, 3) — ảnh hưởng lớn nhất.
2. Dictionary intent/entity không phủ được cách hỏi paraphrase/đời thường (mục 8).
3. Suggestion sinh theo quan hệ section-level, không phải sub-topic (mục 4).

---

## 11. UX

- Trả lời dài dòng? Không — do giới hạn 3 câu, ngược lại có xu hướng **quá ngắn/cụt lủn** so với nội dung thật của node.
- Trả lời dư? Ít, nhờ Jaccard de-dup.
- Thiếu ý? **Có** — vì luôn cắt ở đầu content, bỏ mất phần liên quan thực sự nằm ở giữa/cuối.
- Nhiều nút? **Có, xác nhận đúng** (mục 4) — tối đa 6 phần tử tương tác cho 1 câu trả lời.
- Khó đọc? HTML card đơn giản, dễ đọc ở cấp hiển thị — vấn đề UX nằm ở logic chọn nội dung/nút, không phải CSS.

---

## 12. Kế hoạch cải tiến (theo thứ tự ưu tiên)

**Priority 1 — Chunk lại theo đơn vị ngữ nghĩa nhỏ nhất mà HTML đã có sẵn.**
Viết lại `content-extractor.js` để đọc `.med-card`, `.hospital-card` (+ tab hcm/hn), `.accordion-item` (Q/A rõ ràng), `.cause-card`, `.lifestyle-card`, `.subtype-card`, và **có đọc `<li>`**. Mỗi thẻ nhỏ này trở thành 1 node riêng, với `parent` trỏ về node section lớn (VD `dieu-tri-ho-tro` trở thành node cha của `dieu-tri-methylphenidate`, `dieu-tri-atomoxetine`, v.v.). Đây là việc quan trọng nhất — mọi lỗi ở mục 3, 6, 7, 10 đều bắt nguồn từ đây và sẽ giảm mạnh khi chunk đúng cấp.

**Priority 2 — Sửa Answer Composer để trích đúng đoạn liên quan, không phải luôn lấy đầu content.**
Ngay cả trước khi làm Priority 1 xong, có thể vá tạm: thay `extractFirstSentences` bằng hàm định vị câu/đoạn *gần nhất với entity/keyword đã match* trong `content` (tách content theo câu, chấm điểm từng câu theo overlap với `matchedFactors`, chọn câu điểm cao nhất + 1-2 câu lân cận). Sau Priority 1, nhu cầu này giảm nhiều vì mỗi node đã đủ nhỏ để "cả node" chính là câu trả lời.

**Priority 3 — Gộp 2 nhóm nút (nav-button + suggestion-chip) thành tối đa 1 nút điều hướng theo đúng đề xuất của bạn.**
Chỉ hiện suggestion khi node con/liên quan thực sự hẹp về sub-topic (sau Priority 1, `related`/`children` sẽ tự nhiên hẹp hơn nên vấn đề giảm tự nhiên).

**Priority 4 — Mở rộng dictionary intent/entity để phủ cách hỏi đời thường/paraphrase.**
Thêm intent `prognosis`/`cure`/`management` với từ khoá `chữa`, `khỏi`, `trị dứt điểm`, `có nguy hiểm không`, `sống chung với`... Đây là việc thủ công liên tục (không tự học), cần quy trình: mỗi lần có câu hỏi thật bị "không tìm thấy" hoặc trả lời sai, thêm rule tương ứng.

**Priority 5 — Dùng Graph Search thật sự cho truy vấn chính**, không chỉ follow-up: sau khi chọn node điểm cao nhất, chạy BFS depth=1 để lấy node con liên quan trực tiếp làm ngữ cảnh bổ sung khi node cha không đủ chi tiết trả lời (hữu ích hơn nhiều sau khi có graph phân cấp mịn từ Priority 1).

**Priority 6 — Đồng bộ pipeline tự động với data thật.**
Hiện `pipeline.js` nếu chạy sẽ **ghi đè và phá hỏng** data đã tinh chỉnh (chính README cũng cảnh báo điều này) vì nó tạo lại đúng 8 node thô. Sau khi làm Priority 1, nên đưa chính logic tách "card nhỏ" vào `content-extractor.js`/`semantic-chunker.js` để pipeline tự động và data production **là một**, không tách rời thủ công như hiện tại — tránh rủi ro pipeline chạy nhầm sẽ xoá sạch công tinh chỉnh.

**Priority 7 (dọn dẹp, không khẩn cấp):** Xoá hoặc archive `ai/` (bản embedding cũ không còn dùng) và sửa link CSS chết `./ai/chat.css` trong `index.html`.

---

## PROMPT NÂNG CẤP — dùng cho AI khác (hoặc chính bạn) để triển khai

```
Bạn là Senior AI Engineer, nhiệm vụ: NÂNG CẤP hệ thống chatbot ADHD knowledge-graph
tại C:\Users\hdtua\Downloads\WEB\docs\ai2\, dựa trên kết quả audit đã có (file
AUDIT-chatbot-adhd.md). KHÔNG viết lại từ đầu — sửa đúng các điểm sau, theo đúng
thứ tự, và dừng lại xin xác nhận sau mỗi Priority trước khi sang bước kế.

NGUYÊN TẮC BẮT BUỘC GIỮ NGUYÊN (không được vi phạm):
- 100% client-side, không backend/cloud/LLM API, không embedding/cosine similarity.
- Matching dựa trên entity/intent/keyword/alias/related concept/graph distance/
  question similarity — đúng kiến trúc hiện có, chỉ sửa NỘI DUNG/GRANULARITY,
  không đổi triết lý.
- Không đụng #chatbox/#chat-toggle/index.html/script.js hiện có ngoài phạm vi cần thiết.

PRIORITY 1 — Chunk lại theo đơn vị ngữ nghĩa nhỏ nhất:
- Sửa core/extractor/content-extractor.js: đọc thêm <li>, và nhận diện các khối
  con có class .med-card, .hospital-card (kèm data-tab hcm/hn từ .tab-panel cha),
  .accordion-item (bóc .accordion-question làm câu hỏi, .accordion-answer làm nội
  dung), .cause-card, .lifestyle-card, .subtype-card làm SUB-DOCUMENT riêng, có
  parent-section-id trỏ về section cha.
- Sửa core/chunker/semantic-chunker.js: sinh 1 node CHA cho mỗi section (như hiện
  tại, giữ để trả lời câu hỏi tổng quát) + 1 node CON cho mỗi sub-document ở trên,
  với parent = id section cha. Không xoá cấp section — cấp section vẫn cần cho câu
  hỏi tổng quát ("Cơ sở điều trị ADHD" nên trả node cha, "Methylphenidate là gì"
  nên trả node con).
- Sau khi sửa, XOÁ ghi chú "TINH CHỈNH THỦ CÔNG" sai lệch trong README.md và chạy
  lại node ai2/pipeline.js để pipeline tự động và data production LÀ MỘT — không
  còn 2 nguồn lệch nhau.
- Review kết quả: đếm tổng số node sau khi sinh, liệt kê ra để tôi xác nhận trước
  khi sang Priority 2.

PRIORITY 2 — Answer Composer trích đúng đoạn:
- Sau Priority 1, mỗi node con đã đủ nhỏ (1 thuốc/1 bệnh viện/1 câu FAQ) nên
  composeAnswer() có thể dùng gần trọn content của node con thay vì cắt 3 câu đầu
  một cách mù quáng — chỉ áp dụng extractFirstSentences cho NODE CHA (khi câu hỏi
  ở mức tổng quát) để tránh trả lời quá dài.
- Với node cha vẫn cần rút gọn: thay vì luôn lấy 3 câu ĐẦU, viết hàm
  extractMostRelevantSentences(content, matchedEntities, matchedKeywords) chấm
  điểm từng câu theo số entity/keyword trùng, chọn câu điểm cao nhất + 1 câu liền
  kề mỗi bên (nếu có), giữ đúng thứ tự xuất hiện.

PRIORITY 3 — Gộp UI nút:
- Trong ai2/chat-widget.js: gộp buildNavButtons + buildSuggestions thành 1 nhóm
  nút duy nhất, ưu tiên: nếu node trả lời là node LÁ (đã đủ chi tiết, không có
  children) → không hiện nav-button, chỉ hiện tối đa 1 suggestion-chip nếu có
  node liên quan THỰC SỰ hẹp (cùng parent, không phải cùng "related" rộng).
- Nếu node trả lời là node CHA (câu hỏi tổng quát) → hiện 1 nút duy nhất
  "➡ Xem chi tiết từng mục" dẫn tới danh sách children, không sinh nhiều chip.

PRIORITY 4 — Mở rộng intent/entity dictionary:
- Thêm vào core/generators/intent-generator.js: intent mới `prognosis` (từ khoá:
  'chua', 'khoi', 'het benh', 'song chung', 'quan ly benh', 'tri dut diem'),
  intent `danger`/`safety` (từ khoá: 'nguy hiem', 'co hai khong', 'an toan khong').
- Thêm alias/entity còn thiếu nếu phát hiện qua test thật (Priority 5).

PRIORITY 5 — Test case thật + đo lường:
- Viết ít nhất 40 câu hỏi thật đa dạng (trực tiếp/gián tiếp/đời thường/không dấu/
  viết tắt/follow-up) bao phủ TẤT CẢ node con mới sinh ở Priority 1, chạy qua
  ChatEngine, chấm bằng tay đúng/sai, báo cáo % chính xác trước/sau so với baseline
  ước tính ~50-60% trong audit.

Sau mỗi Priority, dừng lại, tóm tắt đã sửa gì, cho tôi xem output mẫu (input câu
hỏi thật → output thật), và CHỜ tôi xác nhận trước khi sang Priority kế tiếp.
```
