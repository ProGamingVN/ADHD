1\. Đọc C:\\Users\\hdtua\\Downloads\\WEB\\docs\\continue.md để biết đang làm task gì, đã xong gì, bước tiếp theo là gì.

2\. Đọc C:\\Users\\hdtua\\Downloads\\WEB\\docs\\AUDIT-chatbot-adhd.md để nắm bối cảnh/kiến thức nền.

3\. Đọc C:\\Users\\hdtua\\Downloads\\WEB\\docs\\graphify-out\\GRAPH_REPORT.md để có bản đồ quan hệ giữa các file/hàm trong ai2/ (god nodes, community, surprising connections) — dùng file này thay vì grep mò code thô khi cần biết hàm/file nào gọi hàm/file nào. Nếu file này chưa có, hoặc code trong ai2/ đã đổi nhiều kể từ lần cập nhật ghi trong continue.md, làm theo mục "Graphify" trong continue.md để build/cập nhật lại trước khi đi tiếp.

4\. Làm tiếp đúng "Bước tiếp theo" ghi trong continue.md.

5\. Nếu sắp hết token giữa chừng:
   - Cập nhật lại continue.md (trạng thái file thật tại thời điểm dừng).
   - Nếu đã sửa file `.js` nào trong ai2/ kể từ lần cập nhật graphify gần nhất, chạy lại graphify để đồng bộ GRAPH_REPORT.md trước khi dừng (theo mục "Graphify" trong continue.md).
   - Rồi mới dừng.
