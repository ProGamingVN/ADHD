/**
 * MODULE: Parser — Normalize (bổ sung kiến trúc, KHÔNG đổi logic cũ)
 *
 * Re-export các hàm chuẩn hoá văn bản đã có tại
 * generators/_utils/text-utils.js. Lý do re-export thay vì viết lại:
 * - Giữ single source of truth (1 nơi định nghĩa "chuẩn hoá" duy nhất),
 *   tránh 2 module lệch nhau theo thời gian.
 * - Đặt đúng vị trí `core/parser/` theo kiến trúc yêu cầu mà không phá vỡ
 *   bất kỳ import nào đang trỏ tới generators/_utils/text-utils.js.
 */

export { stripDiacritics, normalizeForMatch } from '../generators/_utils/text-utils.js';
