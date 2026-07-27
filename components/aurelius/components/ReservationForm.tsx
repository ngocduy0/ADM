import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Send,
} from "lucide-react";
import { Venue, ReservationRequest } from "../types";
import { useI18n } from "../i18n";
import {
  buildReservationMessage,
  buildContactUrl,
  getLocalizedContactChannels,
} from "../contactConfig";
import { usePublicSettings } from "../public/usePublicData";
import useBusinessClock from "../hooks/useBusinessClock";
import CountryPhoneField, {
  PHONE_COUNTRIES,
  buildInternationalPhone,
  isValidInternationalPhone,
} from "./CountryPhoneField";
import {
  DEFAULT_OPENING_HOURS,
  PUBLIC_BOOKING_LEAD_MINUTES,
  formatBusinessSlotLabel,
  getActualBookingDate,
  getBusinessDateForNow,
  getBusinessSlotDisableReason,
  getBusinessTimeSlots,
  getFirstBookableTime,
} from "@/lib/business-session";

interface ReservationFormProps {
  venue: Venue;
  onSubmit: (
    formData: Omit<
      ReservationRequest,
      "id" | "venueId" | "venueName" | "status" | "createdAt" | "source"
    >,
  ) => Promise<void> | void;
  onClose?: () => void;
  initialPreferredTableId?: string;
  initialBusinessDate?: string;
  initialArrivalTime?: string;
  onScheduleChange?: (businessDate: string, arrivalTime: string) => void;
}

type SubmittedReservation = Omit<
  ReservationRequest,
  "id" | "venueId" | "venueName" | "status" | "createdAt" | "source"
> & {
  venueName: string;
  area: string;
  minSpend: number;
  referenceCode: string;
};

function formatMoney(value: number, locale: string) {
  const localeMap: Record<string, string> = { vi: "vi-VN", en: "en-US", ko: "ko-KR", zh: "zh-CN", th: "th-TH", ja: "ja-JP", hi: "hi-IN" };
  return new Intl.NumberFormat(localeMap[locale] || "en-US", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

const bookingCopy = {
  vi: {
    success: "Yêu cầu đã tạo", reference: "Mã tham chiếu", guest: "Khách", venue: "Địa điểm", dateTime: "Ngày / giờ", guests: "Số khách", guestsUnit: "khách", expectedSpend: "Chi tiêu tối thiểu dự kiến",
    contactHint: "Chọn kênh liên hệ để tiếp tục. Tin nhắn đã được chuẩn bị sẵn và có thể sao chép trước khi mở ứng dụng.", prepared: "Tin nhắn đã chuẩn bị", copy: "Sao chép", open: "Mở kênh", back: "Quay lại chi tiết địa điểm",
    formEyebrow: "Thông tin đặt chỗ", formIntro: "Đặt chỗ nhanh tại địa điểm đã chọn. Thông tin giờ, khách và yêu cầu đặc biệt được gửi trực tiếp tới concierge.", tableInfo: "Thông tin bàn", minSpend: "Chi tiêu tối thiểu", capacity: "Sức chứa", upTo: "Tối đa", chooseTable: "Chọn bàn / khu", disabled: "ĐANG VÔ HIỆU HÓA", booked: "ĐÃ CÓ LỊCH",
    schedule: "Thời gian đặt chỗ", businessDate: "Ngày hoạt động", businessDateHelp: "Đây là ngày địa điểm mở cửa. Các giờ sau 00:00 thuộc ngày kế tiếp.", arrival: "Giờ đến", hours: "Giờ hoạt động", slotsHelp: "Khung giờ đã qua hoặc đã có booking vẫn hiển thị nhưng không thể chọn.", party: "Số lượng khách", contact: "Thông tin liên hệ", name: "Tên", phone: "Số điện thoại", special: "Yêu cầu đặc biệt", notePlaceholder: "Ví dụ: setup sinh nhật, cần góc riêng, yêu cầu đồ uống...",
    security: "Khung giờ đã qua và khung giờ đã có booking vẫn hiển thị nhưng bị vô hiệu hóa. Bàn không còn khả dụng vẫn xuất hiện trên sơ đồ với trạng thái khóa và không thể gửi yêu cầu.", checking: "Đang kiểm tra lịch bàn…", footer: "Giờ sau 00:00 được lưu đúng ngày kế tiếp. Booking chỉ được gửi khi bàn và khung giờ còn trống.", sending: "Đang gửi...", soldOut: "Hết bàn ở khung giờ này",
    copied: "Đã sao chép nội dung. Nếu ứng dụng không tự điền, hãy dán tin nhắn vừa sao chép.", copyFailed: "Không thể sao chép tự động. Bạn có thể sao chép thủ công trong ô tin nhắn.",
    past: "ĐÃ QUA", lead: "CẦN ĐẶT TRƯỚC", minutes: "PHÚT", tableBooked: "BÀN ĐÃ CÓ LỊCH", nextDay: "+1 ngày", chooseFallback: "Chọn bàn", conciergeTable: "Concierge chọn bàn phù hợp", vipArea: "Khu VIP", namePlaceholder: "Nguyễn Minh A",
    errName: "Vui lòng nhập tên khách ít nhất 2 ký tự.", errPhone: "Số điện thoại không hợp lệ. Vui lòng kiểm tra quốc gia, mã vùng và số điện thoại.", errPast: "Khung giờ này đã qua. Vui lòng chọn khung giờ khác.", errLead: "Khung giờ này quá sát giờ hiện tại.", errNoTable: "Hiện không còn bàn phù hợp trong khung giờ đã chọn.", errBooked: "Bàn này đã có lịch trong khung giờ đã chọn. Vui lòng chọn bàn hoặc giờ khác.", errCapacity: "Số khách vượt quá sức chứa của bàn", errNotes: "Ghi chú nên dưới 500 ký tự.", errSend: "Không thể gửi booking. Vui lòng kiểm tra kết nối và thử lại.", errAvailability: "Không kiểm tra được lịch bàn.", ahead: "Vui lòng đặt trước ít nhất",
  },
  en: {
    success: "Request created", reference: "Reference", guest: "Guest", venue: "Venue", dateTime: "Date / time", guests: "Guests", guestsUnit: "guests", expectedSpend: "Estimated minimum spend",
    contactHint: "Choose a contact channel to continue. Your message is ready and can be copied before opening the app.", prepared: "Prepared message", copy: "Copy", open: "Open channel", back: "Back to venue details",
    formEyebrow: "Reservation details", formIntro: "Send a clear reservation request for your selected venue. Time, party size, and special requirements go directly to the concierge.", tableInfo: "Table information", minSpend: "Minimum spend", capacity: "Capacity", upTo: "Up to", chooseTable: "Choose table / area", disabled: "UNAVAILABLE", booked: "ALREADY BOOKED",
    schedule: "Reservation time", businessDate: "Operating date", businessDateHelp: "This is the date the venue opens. Times after midnight belong to the following calendar day.", arrival: "Arrival time", hours: "Opening hours", slotsHelp: "Past or booked time slots remain visible but cannot be selected.", party: "Party size", contact: "Contact details", name: "Name", phone: "Phone number", special: "Special requests", notePlaceholder: "Example: birthday setup, private corner, drink request...",
    security: "Past and booked time slots remain visible but disabled. Unavailable tables stay on the floor plan with a locked state and cannot be requested.", checking: "Checking table availability…", footer: "Times after midnight are stored on the following calendar day. A request is sent only when both table and time are available.", sending: "Sending...", soldOut: "No tables at this time",
    copied: "Message copied. Paste it if the app does not fill it automatically.", copyFailed: "Automatic copy failed. You can copy the prepared message manually.",
    past: "PAST", lead: "BOOK", minutes: "MIN AHEAD", tableBooked: "TABLE BOOKED", nextDay: "+1 day", chooseFallback: "Choose a table", conciergeTable: "Concierge-selected table", vipArea: "VIP Area", namePlaceholder: "Your name",
    errName: "Please enter a guest name with at least 2 characters.", errPhone: "Invalid phone number. Check the country, calling code, and number.", errPast: "This time slot has passed. Please choose another time.", errLead: "This slot is too close to the current time.", errNoTable: "No suitable table is available for the selected time.", errBooked: "This table is already booked at the selected time. Choose another table or time.", errCapacity: "The party size exceeds the capacity of", errNotes: "Notes must be 500 characters or fewer.", errSend: "Unable to send the reservation. Check your connection and try again.", errAvailability: "Unable to check table availability.", ahead: "Please book at least",
  },
  ko: {
    success: "예약 요청이 생성되었습니다", reference: "참조 번호", guest: "고객", venue: "장소", dateTime: "날짜 / 시간", guests: "인원", guestsUnit: "명", expectedSpend: "예상 최소 이용 금액",
    contactHint: "계속하려면 연락 채널을 선택하세요. 메시지는 미리 준비되어 있으며 앱을 열기 전에 복사할 수 있습니다.", prepared: "준비된 메시지", copy: "복사", open: "채널 열기", back: "장소 상세로 돌아가기",
    formEyebrow: "예약 정보", formIntro: "선택한 장소로 명확한 예약 요청을 보냅니다. 시간, 인원, 특별 요청이 컨시어지에게 직접 전달됩니다.", tableInfo: "테이블 정보", minSpend: "최소 이용 금액", capacity: "수용 인원", upTo: "최대", chooseTable: "테이블 / 구역 선택", disabled: "이용 불가", booked: "예약됨",
    schedule: "예약 시간", businessDate: "영업일", businessDateHelp: "장소가 영업을 시작하는 날짜입니다. 자정 이후 시간은 다음 달력 날짜에 해당합니다.", arrival: "도착 시간", hours: "영업 시간", slotsHelp: "지난 시간과 예약된 시간은 표시되지만 선택할 수 없습니다.", party: "인원", contact: "연락처", name: "이름", phone: "전화번호", special: "특별 요청", notePlaceholder: "예: 생일 세팅, 프라이빗 자리, 음료 요청...",
    security: "지난 시간과 예약된 시간은 잠금 상태로 표시됩니다. 이용할 수 없는 테이블도 배치도에 남아 있으며 요청할 수 없습니다.", checking: "테이블 가능 여부 확인 중…", footer: "자정 이후 시간은 다음 날짜로 저장됩니다. 테이블과 시간이 모두 가능할 때만 요청을 보냅니다.", sending: "전송 중...", soldOut: "이 시간에는 이용 가능한 테이블이 없습니다",
    copied: "메시지를 복사했습니다. 앱에 자동 입력되지 않으면 붙여넣으세요.", copyFailed: "자동 복사에 실패했습니다. 준비된 메시지를 직접 복사할 수 있습니다.",
    past: "지난 시간", lead: "최소", minutes: "분 전 예약", tableBooked: "테이블 예약됨", nextDay: "+1일", chooseFallback: "테이블 선택", conciergeTable: "컨시어지 추천 테이블", vipArea: "VIP 구역", namePlaceholder: "이름",
    errName: "고객 이름을 2자 이상 입력하세요.", errPhone: "전화번호가 올바르지 않습니다. 국가, 국가번호, 전화번호를 확인하세요.", errPast: "이미 지난 시간입니다. 다른 시간을 선택하세요.", errLead: "현재 시간과 너무 가깝습니다.", errNoTable: "선택한 시간에 이용 가능한 테이블이 없습니다.", errBooked: "선택한 시간에 이 테이블은 이미 예약되어 있습니다.", errCapacity: "인원이 다음 테이블의 수용 인원을 초과합니다:", errNotes: "메모는 500자 이하로 입력하세요.", errSend: "예약 요청을 보낼 수 없습니다. 연결을 확인하고 다시 시도하세요.", errAvailability: "테이블 가능 여부를 확인할 수 없습니다.", ahead: "최소 다음 시간 전에 예약하세요:",
  },
  zh: {
    success: "预订请求已创建", reference: "参考编号", guest: "客人", venue: "场地", dateTime: "日期 / 时间", guests: "人数", guestsUnit: "位", expectedSpend: "预计最低消费",
    contactHint: "请选择联系渠道继续。消息已准备好，可在打开应用前复制。", prepared: "已准备的消息", copy: "复制", open: "打开渠道", back: "返回场地详情",
    formEyebrow: "预订信息", formIntro: "向所选场地发送清晰的预订请求。时间、人数和特殊需求会直接发送给礼宾。", tableInfo: "桌位信息", minSpend: "最低消费", capacity: "容量", upTo: "最多", chooseTable: "选择桌位 / 区域", disabled: "不可用", booked: "已预订",
    schedule: "预订时间", businessDate: "营业日期", businessDateHelp: "这是场地开始营业的日期。午夜后的时间属于下一个日历日期。", arrival: "到达时间", hours: "营业时间", slotsHelp: "已过去或已预订的时段仍会显示，但无法选择。", party: "人数", contact: "联系方式", name: "姓名", phone: "电话号码", special: "特殊要求", notePlaceholder: "例如：生日布置、私密角落、饮品要求...",
    security: "已过去和已预订的时段会保留显示并被禁用。不可用桌位仍显示在平面图上并带锁，无法提交请求。", checking: "正在检查桌位状态…", footer: "午夜后的时间会保存到下一日期。只有桌位和时间都可用时才会发送请求。", sending: "发送中...", soldOut: "该时段没有可用桌位",
    copied: "消息已复制。如应用未自动填充，请粘贴。", copyFailed: "自动复制失败，您可以手动复制准备好的消息。",
    past: "已过去", lead: "需提前", minutes: "分钟预订", tableBooked: "桌位已预订", nextDay: "+1天", chooseFallback: "选择桌位", conciergeTable: "礼宾推荐桌位", vipArea: "VIP 区域", namePlaceholder: "您的姓名",
    errName: "请输入至少 2 个字符的姓名。", errPhone: "电话号码无效，请检查国家、区号和号码。", errPast: "该时段已过去，请选择其他时间。", errLead: "该时段距离当前时间太近。", errNoTable: "所选时段没有合适的桌位。", errBooked: "该桌位在所选时段已被预订，请选择其他桌位或时间。", errCapacity: "人数超过该桌位容量：", errNotes: "备注不能超过 500 个字符。", errSend: "无法发送预订请求，请检查网络后重试。", errAvailability: "无法检查桌位状态。", ahead: "请至少提前",
  },
  th: {
    success: "สร้างคำขอจองแล้ว", reference: "รหัสอ้างอิง", guest: "ลูกค้า", venue: "สถานที่", dateTime: "วันที่ / เวลา", guests: "จำนวนแขก", guestsUnit: "คน", expectedSpend: "ขั้นต่ำโดยประมาณ",
    contactHint: "เลือกช่องทางติดต่อเพื่อดำเนินการต่อ ข้อความถูกเตรียมไว้และสามารถคัดลอกก่อนเปิดแอป", prepared: "ข้อความที่เตรียมไว้", copy: "คัดลอก", open: "เปิดช่องทาง", back: "กลับไปหน้ารายละเอียดสถานที่",
    formEyebrow: "ข้อมูลการจอง", formIntro: "ส่งคำขอจองที่ชัดเจนไปยังสถานที่ที่เลือก เวลา จำนวนแขก และคำขอพิเศษจะส่งตรงถึงคอนเซียร์จ", tableInfo: "ข้อมูลโต๊ะ", minSpend: "ขั้นต่ำ", capacity: "ความจุ", upTo: "สูงสุด", chooseTable: "เลือกโต๊ะ / โซน", disabled: "ไม่พร้อมใช้งาน", booked: "มีการจองแล้ว",
    schedule: "เวลาจอง", businessDate: "วันที่เปิดให้บริการ", businessDateHelp: "นี่คือวันที่สถานที่เริ่มเปิด เวลาหลังเที่ยงคืนเป็นวันที่ปฏิทินถัดไป", arrival: "เวลามาถึง", hours: "เวลาเปิด", slotsHelp: "ช่วงเวลาที่ผ่านไปหรือมีการจองแล้วยังแสดง แต่เลือกไม่ได้", party: "จำนวนแขก", contact: "ข้อมูลติดต่อ", name: "ชื่อ", phone: "เบอร์โทรศัพท์", special: "คำขอพิเศษ", notePlaceholder: "ตัวอย่าง: เซ็ตอัพวันเกิด มุมส่วนตัว คำขอเครื่องดื่ม...",
    security: "ช่วงเวลาที่ผ่านไปและมีการจองแล้วจะถูกล็อก โต๊ะที่ไม่พร้อมใช้งานยังแสดงบนผังพร้อมสถานะล็อกและส่งคำขอไม่ได้", checking: "กำลังตรวจสอบโต๊ะว่าง…", footer: "เวลาหลังเที่ยงคืนจะบันทึกเป็นวันที่ถัดไป ระบบจะส่งคำขอเมื่อทั้งโต๊ะและเวลาว่างเท่านั้น", sending: "กำลังส่ง...", soldOut: "ไม่มีโต๊ะว่างในเวลานี้",
    copied: "คัดลอกข้อความแล้ว หากแอปไม่กรอกอัตโนมัติให้วางข้อความ", copyFailed: "คัดลอกอัตโนมัติไม่สำเร็จ คุณสามารถคัดลอกข้อความด้วยตนเอง",
    past: "ผ่านไปแล้ว", lead: "ต้องจองล่วงหน้า", minutes: "นาที", tableBooked: "โต๊ะมีการจองแล้ว", nextDay: "+1 วัน", chooseFallback: "เลือกโต๊ะ", conciergeTable: "โต๊ะที่คอนเซียร์จแนะนำ", vipArea: "โซน VIP", namePlaceholder: "ชื่อของคุณ",
    errName: "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร", errPhone: "หมายเลขโทรศัพท์ไม่ถูกต้อง กรุณาตรวจสอบประเทศ รหัสโทรศัพท์ และหมายเลข", errPast: "ช่วงเวลานี้ผ่านไปแล้ว กรุณาเลือกเวลาอื่น", errLead: "ช่วงเวลานี้ใกล้เวลาปัจจุบันเกินไป", errNoTable: "ไม่มีโต๊ะที่เหมาะสมในเวลาที่เลือก", errBooked: "โต๊ะนี้มีการจองแล้วในเวลาที่เลือก กรุณาเลือกโต๊ะหรือเวลาอื่น", errCapacity: "จำนวนแขกเกินความจุของโต๊ะ", errNotes: "หมายเหตุต้องไม่เกิน 500 ตัวอักษร", errSend: "ไม่สามารถส่งคำขอจองได้ กรุณาตรวจสอบการเชื่อมต่อและลองใหม่", errAvailability: "ไม่สามารถตรวจสอบโต๊ะว่างได้", ahead: "กรุณาจองล่วงหน้าอย่างน้อย",
  },
  ja: {
    success: "予約リクエストを作成しました", reference: "参照番号", guest: "お客様", venue: "会場", dateTime: "日付 / 時間", guests: "人数", guestsUnit: "名", expectedSpend: "予想ミニマムスペンド",
    contactHint: "続行する連絡チャネルを選択してください。メッセージは準備済みで、アプリを開く前にコピーできます。", prepared: "準備済みメッセージ", copy: "コピー", open: "チャネルを開く", back: "会場詳細へ戻る",
    formEyebrow: "予約情報", formIntro: "選択した会場へ明確な予約リクエストを送ります。時間、人数、特別な希望がコンシェルジュへ直接送信されます。", tableInfo: "テーブル情報", minSpend: "ミニマムスペンド", capacity: "定員", upTo: "最大", chooseTable: "テーブル / エリアを選択", disabled: "利用不可", booked: "予約済み",
    schedule: "予約時間", businessDate: "営業日", businessDateHelp: "会場が営業を開始する日付です。深夜0時以降の時間は翌日の日付になります。", arrival: "到着時間", hours: "営業時間", slotsHelp: "過去または予約済みの時間帯は表示されますが選択できません。", party: "人数", contact: "連絡先", name: "お名前", phone: "電話番号", special: "特別な希望", notePlaceholder: "例：誕生日セットアップ、個室希望、ドリンク希望...",
    security: "過去および予約済みの時間帯はロック表示されます。利用不可のテーブルもマップ上に残り、リクエストできません。", checking: "空き状況を確認中…", footer: "深夜0時以降は翌日の日付で保存されます。テーブルと時間の両方が空いている場合のみ送信されます。", sending: "送信中...", soldOut: "この時間は空きテーブルがありません",
    copied: "メッセージをコピーしました。自動入力されない場合は貼り付けてください。", copyFailed: "自動コピーに失敗しました。準備済みメッセージを手動でコピーできます。",
    past: "過去", lead: "事前予約", minutes: "分", tableBooked: "予約済み", nextDay: "+1日", chooseFallback: "テーブルを選択", conciergeTable: "コンシェルジュ選定テーブル", vipArea: "VIPエリア", namePlaceholder: "お名前",
    errName: "お名前を2文字以上入力してください。", errPhone: "電話番号が正しくありません。国、国番号、番号を確認してください。", errPast: "この時間帯は過ぎています。別の時間を選択してください。", errLead: "現在時刻に近すぎる時間帯です。", errNoTable: "選択した時間に適したテーブルがありません。", errBooked: "選択した時間はこのテーブルが予約済みです。別のテーブルまたは時間を選択してください。", errCapacity: "人数がテーブル定員を超えています：", errNotes: "メモは500文字以内で入力してください。", errSend: "予約リクエストを送信できません。接続を確認して再試行してください。", errAvailability: "空き状況を確認できません。", ahead: "少なくとも次の時間前に予約してください：",
  },
  hi: {
    success: "Reservation request बन गई", reference: "Reference", guest: "Guest", venue: "Venue", dateTime: "Date / time", guests: "Guests", guestsUnit: "guests", expectedSpend: "Estimated minimum spend",
    contactHint: "आगे बढ़ने के लिए contact channel चुनें। Message तैयार है और app खोलने से पहले copy किया जा सकता है।", prepared: "Prepared message", copy: "Copy", open: "Channel खोलें", back: "Venue details पर वापस जाएँ",
    formEyebrow: "Reservation details", formIntro: "चुने हुए venue के लिए स्पष्ट reservation request भेजें। Time, party size और special requirements सीधे concierge तक जाते हैं।", tableInfo: "Table information", minSpend: "Minimum spend", capacity: "Capacity", upTo: "अधिकतम", chooseTable: "Table / area चुनें", disabled: "UNAVAILABLE", booked: "ALREADY BOOKED",
    schedule: "Reservation time", businessDate: "Operating date", businessDateHelp: "यह वह तारीख है जब venue खुलता है। Midnight के बाद के times अगले calendar day में आते हैं।", arrival: "Arrival time", hours: "Opening hours", slotsHelp: "Past या booked slots दिखाई देते हैं लेकिन चुने नहीं जा सकते।", party: "Party size", contact: "Contact details", name: "Name", phone: "Phone number", special: "Special requests", notePlaceholder: "उदाहरण: birthday setup, private corner, drink request...",
    security: "Past और booked time slots locked दिखाई देते हैं। Unavailable tables floor plan पर रहती हैं और request नहीं की जा सकतीं।", checking: "Table availability check हो रही है…", footer: "Midnight के बाद का time अगले दिन store होता है। Request तभी भेजी जाती है जब table और time दोनों available हों।", sending: "Sending...", soldOut: "इस समय कोई table available नहीं है",
    copied: "Message copy हो गया। App auto-fill न करे तो paste करें।", copyFailed: "Automatic copy failed। Prepared message manually copy करें।",
    past: "PAST", lead: "BOOK", minutes: "MIN AHEAD", tableBooked: "TABLE BOOKED", nextDay: "+1 day", chooseFallback: "Table चुनें", conciergeTable: "Concierge-selected table", vipArea: "VIP Area", namePlaceholder: "आपका नाम",
    errName: "Guest name कम से कम 2 characters का होना चाहिए।", errPhone: "Phone number invalid है। Country, calling code और number जाँचें।", errPast: "यह time slot बीत चुका है। दूसरा time चुनें।", errLead: "यह slot current time के बहुत पास है।", errNoTable: "चुने हुए समय पर suitable table available नहीं है।", errBooked: "चुने हुए समय पर यह table पहले से booked है। दूसरा table या time चुनें।", errCapacity: "Party size इस table की capacity से अधिक है:", errNotes: "Notes 500 characters या कम रखें।", errSend: "Reservation request नहीं भेजी जा सकी। Connection जाँचें और फिर प्रयास करें।", errAvailability: "Table availability check नहीं हो सकी।", ahead: "कम से कम पहले book करें:",
  },
} as const;

const mobileBookingFlowCopy: Record<string, { step1: string; step2: string; continue: string; back: string; secure: string }> = {
  vi: { step1: "Bàn & thời gian", step2: "Thông tin của bạn", continue: "Tiếp tục điền thông tin", back: "Quay lại", secure: "Booking chỉ được gửi khi bàn và khung giờ còn trống." },
  en: { step1: "Table & time", step2: "Your details", continue: "Continue to your details", back: "Back", secure: "The request is sent only while the table and time remain available." },
  ko: { step1: "테이블 및 시간", step2: "고객 정보", continue: "고객 정보 입력", back: "뒤로", secure: "테이블과 시간이 모두 가능한 경우에만 요청이 전송됩니다." },
  zh: { step1: "桌位与时间", step2: "您的信息", continue: "继续填写信息", back: "返回", secure: "仅在桌位与时间仍可用时发送请求。" },
  th: { step1: "โต๊ะและเวลา", step2: "ข้อมูลของคุณ", continue: "กรอกข้อมูลต่อ", back: "ย้อนกลับ", secure: "ระบบจะส่งคำขอเมื่อโต๊ะและเวลายังว่างเท่านั้น" },
  ja: { step1: "テーブルと時間", step2: "お客様情報", continue: "お客様情報へ", back: "戻る", secure: "テーブルと時間が空いている場合のみ送信されます。" },
  hi: { step1: "टेबल और समय", step2: "आपकी जानकारी", continue: "अपनी जानकारी भरें", back: "वापस", secure: "टेबल और समय उपलब्ध होने पर ही अनुरोध भेजा जाता है।" },
};

export default function ReservationForm({
  venue,
  onSubmit,
  onClose,
  initialPreferredTableId,
  initialBusinessDate,
  initialArrivalTime,
  onScheduleChange,
}: ReservationFormProps) {
  const { siteSettings } = usePublicSettings();
  const { t, locale } = useI18n();
  const c = bookingCopy[locale] || bookingCopy.en;
  const mobileC = mobileBookingFlowCopy[locale] || mobileBookingFlowCopy.en;
  const now = useBusinessClock();
  const openingHours = venue.openingHours || DEFAULT_OPENING_HOURS;
  const minimumBusinessDate = useMemo(
    () => getBusinessDateForNow(openingHours, now),
    [openingHours, now],
  );
  const availableTables = useMemo(
    () => venue.preferredTables.filter((table) => table.status !== "HIDDEN"),
    [venue.preferredTables],
  );
  const initialTable =
    availableTables.find((table) => table.id === initialPreferredTableId) ||
    availableTables.find((table) => table.status !== "RESERVED") ||
    availableTables[0];
  const arrivalOptions = useMemo(
    () => getBusinessTimeSlots(openingHours),
    [openingHours],
  );
  const initialDate = initialBusinessDate || minimumBusinessDate;
  const initialTime =
    (initialArrivalTime && arrivalOptions.includes(initialArrivalTime)
      ? initialArrivalTime
      : "") || getFirstBookableTime(initialDate, openingHours, now);

  const [fullName, setFullName] = useState("");
  const [phoneCountryIso, setPhoneCountryIso] = useState("VN");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [guestCount, setGuestCount] = useState(
    Math.min(Math.max(2, initialTable?.capacity || 2), 12),
  );
  // `date` is the business date: the calendar day on which the venue opens.
  // Slots after midnight are persisted using the following calendar day.
  const [date, setDate] = useState(initialDate);
  const [arrivalTime, setArrivalTime] = useState(initialTime);
  const [preferredTableId, setPreferredTableId] = useState(
    initialTable?.id || "",
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submittedData, setSubmittedData] =
    useState<SubmittedReservation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState<
    Record<
      string,
      Record<
        string,
        null | {
          blocked?: boolean;
        }
      >
    >
  >({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [mobileStep, setMobileStep] = useState<1 | 2>(1);

  const selectedTable =
    availableTables.find((table) => table.id === preferredTableId) ||
    availableTables[0];
  const isTableBlocked = (tableId: string, time = arrivalTime) => {
    const table = availableTables.find((item) => item.id === tableId);
    return table?.status === "RESERVED" || Boolean(availability[tableId]?.[time]);
  };
  const getSlotReason = (time: string) =>
    getBusinessSlotDisableReason(
      date,
      time,
      openingHours,
      now,
      PUBLIC_BOOKING_LEAD_MINUTES,
    );
  const hasAvailableTable = availableTables.some(
    (table) => !isTableBlocked(table.id),
  );
  const maxGuests = Math.max(1, selectedTable?.capacity || 12);
  const guestOptions = Array.from(
    { length: Math.min(maxGuests, 12) },
    (_, index) => index + 1,
  );

  useEffect(() => {
    const nextTable =
      availableTables.find(
        (table) =>
          table.id === initialPreferredTableId && table.status !== "RESERVED",
      ) ||
      availableTables.find((table) => table.status !== "RESERVED") ||
      availableTables[0];
    const timer = window.setTimeout(
      () => setPreferredTableId(nextTable?.id || ""),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [initialPreferredTableId, availableTables]);

  useEffect(() => {
    const timer = window.setTimeout(
      () =>
        setGuestCount((current) => Math.min(Math.max(1, current), maxGuests)),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [maxGuests]);

  useEffect(() => {
    if (!date || !venue.id) return;
    const controller = new AbortController();
    setAvailability({});
    setCheckingAvailability(true);
    fetch(
      `/api/reservations/availability?venueId=${encodeURIComponent(venue.id)}&businessDate=${encodeURIComponent(date)}`,
      { signal: controller.signal },
    )
      .then((response) => response.json())
      .then((payload) => {
        if (!payload?.ok)
          throw new Error(payload?.error || c.errAvailability);
        const next = Object.fromEntries(
          (payload.data.tables || []).map(
            (table: {
              id: string;
              slots: Record<
                string,
                null | {
                  blocked?: boolean;
                }
              >;
            }) => [table.id, table.slots],
          ),
        );
        setAvailability(next);
      })
      .catch((fetchError) => {
        if (fetchError?.name !== "AbortError")
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : c.errAvailability,
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setCheckingAvailability(false);
      });
    return () => controller.abort();
  }, [date, venue.id]);

  useEffect(() => {
    if (date < minimumBusinessDate) {
      setDate(minimumBusinessDate);
      return;
    }
    const currentReason = getSlotReason(arrivalTime);
    if (!currentReason) return;
    const nextTime = arrivalOptions.find((time) => !getSlotReason(time));
    if (nextTime && nextTime !== arrivalTime) setArrivalTime(nextTime);
  }, [date, arrivalOptions, arrivalTime, minimumBusinessDate, now, openingHours]);

  useEffect(() => {
    onScheduleChange?.(date, arrivalTime);
  }, [arrivalTime, date, onScheduleChange]);

  useEffect(() => {
    if (!preferredTableId || !isTableBlocked(preferredTableId)) return;
    const currentArea = availableTables.find(
      (table) => table.id === preferredTableId,
    )?.area;
    const next =
      availableTables.find(
        (table) => table.area === currentArea && !isTableBlocked(table.id),
      ) || availableTables.find((table) => !isTableBlocked(table.id));
    if (next) setPreferredTableId(next.id);
  }, [arrivalTime, availability, availableTables, preferredTableId]);

  const showFormError = (message: string, step?: 1 | 2) => {
    if (step) setMobileStep(step);
    setError(message);
    window.requestAnimationFrame(() => {
      document.getElementById("reservation-form-scroll")?.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const moveToContactStep = () => {
    setError("");
    const slotReason = getSlotReason(arrivalTime);
    if (slotReason === "PAST") return showFormError(c.errPast, 1);
    if (slotReason === "LEAD_TIME")
      return showFormError(`${c.errLead} ${c.ahead} ${PUBLIC_BOOKING_LEAD_MINUTES} ${c.minutes}.`, 1);
    if (!selectedTable) return showFormError(c.errNoTable, 1);
    if (isTableBlocked(selectedTable.id)) return showFormError(c.errBooked, 1);
    if (guestCount < 1 || guestCount > maxGuests)
      return showFormError(`${c.errCapacity} ${selectedTable?.name || c.chooseFallback}.`, 1);

    setMobileStep(2);
    window.requestAnimationFrame(() => {
      document.getElementById("reservation-form-scroll")?.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const copyMessage = async (message: string) => {
    try {
      await navigator.clipboard.writeText(message);
      setNotice(c.copied);
    } catch {
      setNotice(c.copyFailed);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (fullName.trim().length < 2)
      return showFormError(c.errName, 2);
    const phoneCountry =
      PHONE_COUNTRIES.find((country) => country.iso === phoneCountryIso) ||
      PHONE_COUNTRIES[0];
    const fullPhone = buildInternationalPhone(phoneCountry, phoneNumber);
    if (!isValidInternationalPhone(fullPhone))
      return showFormError(c.errPhone, 2);
    const slotReason = getSlotReason(arrivalTime);
    if (slotReason === "PAST")
      return showFormError(c.errPast, 1);
    if (slotReason === "LEAD_TIME")
      return showFormError(`${c.errLead} ${c.ahead} ${PUBLIC_BOOKING_LEAD_MINUTES} ${c.minutes}.`, 1);
    if (!selectedTable)
      return showFormError(c.errNoTable, 1);
    if (isTableBlocked(selectedTable.id))
      return showFormError(c.errBooked, 1);
    const actualBookingDate = getActualBookingDate(
      date,
      arrivalTime,
      openingHours,
    );
    if (guestCount < 1 || guestCount > maxGuests)
      return showFormError(`${c.errCapacity} ${selectedTable?.name || c.chooseFallback}.`, 1);
    if (notes.length > 500) return showFormError(c.errNotes, 2);

    const referenceCode = `DUYT-${Date.now().toString().slice(-6)}`;
    const payload = {
      fullName: fullName.trim(),
      phoneNumber: fullPhone,
      guestCount,
      date: actualBookingDate,
      arrivalTime,
      preferredTableId: selectedTable?.id || "",
      preferredTableName: selectedTable?.name || c.conciergeTable,
      notes: notes.trim(),
      referenceCode,
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
      setSubmittedData({
        ...payload,
        venueName: venue.name,
        area: selectedTable?.area || c.vipArea,
        minSpend: selectedTable?.minimumSpend || 0,
        referenceCode,
      });
    } catch (submitError) {
      showFormError(
        submitError instanceof Error ? submitError.message : c.errSend,
        2,
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedData) {
    const message = buildReservationMessage({
      fullName: submittedData.fullName,
      phoneNumber: submittedData.phoneNumber,
      venueName: submittedData.venueName,
      date: submittedData.date,
      arrivalTime: submittedData.arrivalTime,
      guestCount: submittedData.guestCount,
      preferredTableName: submittedData.preferredTableName,
      notes: submittedData.notes,
      referenceCode: submittedData.referenceCode,
    }, locale);
    const socialChannels = getLocalizedContactChannels(siteSettings, locale);

    return (
      <div className="duyt-success-ticket flex h-full min-h-0 max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden bg-[#030304] text-on-surface">
        <div className="shrink-0 border-b border-[#d0bcff]/20 bg-gradient-to-br from-[#241247] via-[#130a25] to-[#030304] px-5 py-3 text-center text-white sm:px-6 sm:py-4">
          <CheckCircle2 className="mx-auto mb-1.5 h-7 w-7 sm:h-8 sm:w-8 text-[#d0bcff]" />
          <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/62">{c.success}</p>
          <h3 className="duyt-editorial mt-0.5 text-3xl leading-none sm:text-4xl">{submittedData.preferredTableName}</h3>
          <p className="mt-1 text-[10px] text-white/58">{c.reference}: {submittedData.referenceCode}</p>
        </div>

        <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden lg:grid-cols-[1.05fr_.95fr] lg:grid-rows-1">
          <div className="space-y-2 border-b border-white/10 p-3 lg:overflow-y-auto lg:border-b-0 lg:border-r sm:space-y-3 sm:p-5">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Info label={c.guest} value={submittedData.fullName} />
              <Info label={c.venue} value={submittedData.venueName} />
              <Info label={c.dateTime} value={`${submittedData.date} · ${submittedData.arrivalTime}`} />
              <Info label={c.guests} value={`${submittedData.guestCount} ${c.guestsUnit}`} />
              <div className="col-span-2">
                <Info label={c.expectedSpend} value={`${submittedData.preferredTableName} · ${formatMoney(submittedData.minSpend, locale)}`} gold />
              </div>
            </div>

            <div className="hidden rounded-2xl border border-[#d0bcff]/15 bg-[#d0bcff]/[.07] px-4 py-3 text-[11px] leading-5 text-on-surface-variant sm:block">
              {c.contactHint}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/35 p-2.5 sm:p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-[9px] font-bold uppercase tracking-[.18em] text-gold">{c.prepared}</span>
                <button type="button" onClick={() => copyMessage(message)} className="rounded-full border border-gold/20 px-3 py-1 text-[9px] font-bold text-gold hover:bg-gold/10">
                  <Copy className="mr-1 inline h-3 w-3" />{c.copy}
                </button>
              </div>
              <textarea readOnly value={message} rows={5} className="hidden max-h-[120px] w-full resize-none rounded-xl border border-white/10 bg-black/55 p-3 text-[10px] leading-[1.55] text-on-surface-variant outline-none sm:block" />
            </div>

            {notice ? <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2.5 text-[10px] font-semibold text-emerald-100">{notice}</div> : null}
          </div>

          <div className="flex min-h-0 flex-col overflow-hidden p-3 sm:p-5">
            <p className="mb-3 text-[9px] font-black uppercase tracking-[.22em] text-gold">{c.open}</p>
            <div className="grid min-h-0 flex-1 grid-cols-3 content-stretch gap-2 overflow-y-auto lg:grid-cols-2 lg:auto-rows-fr lg:overflow-hidden">
              {socialChannels.map((channel) => {
                const href = buildContactUrl(channel.name, message, socialChannels, locale);
                return (
                  <a
                    key={channel.name}
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                    onClick={() => copyMessage(message)}
                    className="group flex min-h-[62px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[.025] p-2 text-center transition hover:-translate-y-0.5 hover:border-gold/35 hover:bg-gold/5 lg:min-h-0"
                  >
                    <img src={channel.icon} alt={channel.name} className="mb-1.5 h-7 w-7 rounded-full object-contain transition group-hover:scale-110 sm:h-8 sm:w-8" />
                    <span className="max-w-full truncate text-[9px] font-bold text-on-surface sm:text-[10px]">{channel.name}</span>
                    <span className="mt-0.5 hidden items-center gap-1 text-[8px] text-gold sm:inline-flex">{c.open}<ExternalLink className="h-2.5 w-2.5" /></span>
                  </a>
                );
              })}
            </div>
            {onClose ? (
              <button type="button" onClick={onClose} className="mt-3 w-full rounded-2xl border border-gold/15 px-4 py-2.5 text-[9px] font-bold uppercase tracking-[.16em] text-on-surface-variant transition hover:border-gold hover:text-gold">
                {c.back}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full min-h-0 flex-col overflow-hidden bg-[#050507] text-left font-sans text-on-surface"
    >
      <div className="shrink-0 border-b border-gold/15 px-4 pb-3 pt-[max(.85rem,env(safe-area-inset-top))] sm:px-6 sm:py-6">
        <div className="flex items-end justify-between gap-4 pr-12 sm:flex-row sm:pr-0">
          <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-gold/80 sm:text-[11px] sm:tracking-[0.28em]">
              {c.formEyebrow}
            </p>
            <div>
              <p className="truncate text-[10px] uppercase tracking-[0.18em] text-gold/80 sm:text-xs sm:tracking-[0.22em]">
                {selectedTable?.area || venue.name}
              </p>
              <h2
                id="reservation-modal-title"
                className="mt-1 truncate text-2xl font-black leading-tight text-white sm:mt-2 sm:text-4xl"
              >
                {selectedTable?.name || c.chooseFallback}
              </h2>
              <p id="reservation-modal-description" className="mt-3 hidden max-w-2xl text-sm leading-6 text-on-surface-variant sm:block">
                {c.formIntro}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 sm:hidden">
              <Info label={c.minSpend} value={formatMoney(selectedTable?.minimumSpend || 0, locale)} gold />
              <Info label={c.capacity} value={`${c.upTo} ${maxGuests}`} />
            </div>
          </div>
          <div className="hidden rounded-3xl border border-gold/15 bg-[#0B0B10] p-4 text-sm text-on-surface-variant sm:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold/80">
              {c.tableInfo}
            </p>
            <div className="mt-3 space-y-3">
              <Info label={c.minSpend} value={formatMoney(selectedTable?.minimumSpend || 0, locale)} gold />
              <Info label={c.capacity} value={`${c.upTo} ${maxGuests}`} />
            </div>
          </div>
        </div>
      </div>

      <div id="reservation-form-scroll" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-8 pt-4 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-[860px]">
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-[#0A0A0E] p-1.5 sm:hidden">
            <button
              type="button"
              onClick={() => setMobileStep(1)}
              className={`rounded-xl px-3 py-2.5 text-left transition ${mobileStep === 1 ? "bg-gold/15 text-gold" : "text-on-surface-variant"}`}
            >
              <span className="block text-[9px] font-black uppercase tracking-[.18em]">01</span>
              <span className="mt-0.5 block text-xs font-bold">{mobileC.step1}</span>
            </button>
            <button
              type="button"
              onClick={moveToContactStep}
              className={`rounded-xl px-3 py-2.5 text-left transition ${mobileStep === 2 ? "bg-gold/15 text-gold" : "text-on-surface-variant"}`}
            >
              <span className="block text-[9px] font-black uppercase tracking-[.18em]">02</span>
              <span className="mt-0.5 block text-xs font-bold">{mobileC.step2}</span>
            </button>
          </div>

          {error ? (
            <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold leading-5 text-red-200 sm:hidden" role="alert">
              {error}
            </div>
          ) : null}

          <div className="space-y-4 sm:space-y-6">
            <section className={`${mobileStep === 1 ? "block" : "hidden"} space-y-2 sm:block sm:space-y-4`}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/80 sm:text-sm sm:tracking-[0.24em]">
                {c.tableInfo}
              </h3>
              <div className="rounded-2xl border border-white/10 bg-[#0D0D12] p-3 sm:rounded-3xl sm:p-4">
                <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant sm:text-[11px] sm:tracking-[0.18em]">
                  {c.chooseTable}
                </label>
                <select
                  value={preferredTableId}
                  onChange={(e) => { setPreferredTableId(e.target.value); setError(""); }}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-[#09090D] px-3 py-3 text-sm font-semibold text-on-surface outline-none transition duration-150 focus:border-gold focus:ring-2 focus:ring-gold/10 sm:rounded-3xl sm:px-4"
                >
                  {availableTables.map((table) => {
                    const blocked = isTableBlocked(table.id);
                    const blockedLabel = table.status === "RESERVED" ? c.disabled : c.booked;
                    return (
                      <option key={table.id} value={table.id} disabled={blocked} className="bg-[#09090D] text-on-surface">
                        {table.name} · {table.area} · {formatMoney(table.minimumSpend, locale)} · {c.upTo} {table.capacity}
                        {blocked ? ` · ${blockedLabel}` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            </section>

            <section className={`${mobileStep === 1 ? "block" : "hidden"} space-y-2 sm:block sm:space-y-4`}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/80 sm:text-sm sm:tracking-[0.24em]">
                {c.schedule}
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant sm:mb-2 sm:text-[11px] sm:tracking-[0.18em]">
                    <CalendarDays className="mr-1 inline h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {c.businessDate}
                  </label>
                  <input
                    type="date"
                    required
                    min={minimumBusinessDate}
                    value={date}
                    onChange={(e) => { setDate(e.target.value); setError(""); }}
                    className={inputClass}
                  />
                  <p className="mt-2 hidden text-xs leading-relaxed text-on-surface-variant sm:block">{c.businessDateHelp}</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant sm:mb-2 sm:text-[11px] sm:tracking-[0.18em]">
                    {c.arrival}
                  </label>
                  <select
                    required
                    value={arrivalTime}
                    onChange={(e) => { setArrivalTime(e.target.value); setError(""); }}
                    className={inputClass}
                  >
                    {arrivalOptions.map((option) => {
                      const timeReason = getSlotReason(option);
                      const blocked = selectedTable ? isTableBlocked(selectedTable.id, option) : false;
                      const suffix = timeReason === "PAST"
                        ? ` · ${c.past}`
                        : timeReason === "LEAD_TIME"
                          ? ` · ${c.lead} ${PUBLIC_BOOKING_LEAD_MINUTES} ${c.minutes}`
                          : blocked
                            ? ` · ${c.tableBooked}`
                            : "";
                      return (
                        <option key={option} value={option} disabled={Boolean(timeReason) || blocked} className="bg-[#09090D] text-on-surface">
                          {formatBusinessSlotLabel(date, option, openingHours, c.nextDay)}{suffix}
                        </option>
                      );
                    })}
                  </select>
                  <p className="mt-2 hidden text-xs leading-relaxed text-on-surface-variant sm:block">
                    {c.hours}: {openingHours.open} – {openingHours.close}. {c.slotsHelp}
                  </p>
                </div>
              </div>
              <p className="rounded-xl border border-white/[.08] bg-white/[.025] px-3 py-2 text-[10px] leading-4 text-on-surface-variant sm:hidden">
                {c.hours}: {openingHours.open} – {openingHours.close}. {c.businessDateHelp}
              </p>
            </section>

            <section className={`${mobileStep === 1 ? "block" : "hidden"} space-y-2 sm:block sm:space-y-4`}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/80 sm:text-sm sm:tracking-[0.24em]">
                {c.party}
              </h3>
              <div className="rounded-2xl border border-white/10 bg-[#0D0D12] p-3 sm:rounded-3xl sm:p-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant sm:mb-3 sm:text-[11px] sm:tracking-[0.18em]">
                  {c.guests} · {guestCount}
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:gap-3 sm:overflow-visible sm:pb-0">
                  {guestOptions.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => { setGuestCount(num); setError(""); }}
                      className={`min-w-[2.75rem] shrink-0 rounded-full border px-3 py-2 text-sm font-semibold transition sm:min-w-[3rem] ${guestCount === num ? "border-gold bg-gold text-dark-navy" : "border-white/10 bg-[#09090D] text-on-surface hover:border-gold/40"}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className={`${mobileStep === 2 ? "block" : "hidden"} space-y-2 sm:block sm:space-y-4`}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/80 sm:text-sm sm:tracking-[0.24em]">
                {c.contact}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant sm:mb-2 sm:text-[11px] sm:tracking-[0.18em]">{c.name}</label>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    placeholder={c.namePlaceholder}
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); setError(""); }}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant sm:mb-2 sm:text-[11px] sm:tracking-[0.18em]">{c.phone}</label>
                  <CountryPhoneField
                    countryIso={phoneCountryIso}
                    onCountryChange={(country) => { setPhoneCountryIso(country.iso); setError(""); }}
                    nationalNumber={phoneNumber}
                    onNationalNumberChange={(value) => { setPhoneNumber(value); setError(""); }}
                    inputClassName={inputClass}
                    disabled={submitting}
                  />
                </div>
              </div>
            </section>

            <section className={`${mobileStep === 2 ? "block" : "hidden"} space-y-2 sm:block sm:space-y-4`}>
              <div className="flex items-end justify-between gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/80 sm:text-sm sm:tracking-[0.24em]">{c.special}</h3>
                <span className="text-[10px] text-on-surface-variant/65">{notes.length}/500</span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                placeholder={c.notePlaceholder}
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setError(""); }}
                className={`${inputClass} min-h-[96px] resize-none leading-relaxed sm:min-h-[120px]`}
              />
            </section>

            {error && (
              <div className="hidden rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold leading-5 text-red-200 sm:block sm:rounded-3xl" role="alert">
                {error}
              </div>
            )}

            <div className={`${mobileStep === 2 ? "block" : "hidden"} rounded-2xl border border-gold/15 bg-[#08080C] p-3 text-[11px] leading-5 text-on-surface-variant sm:block sm:rounded-3xl sm:p-4 sm:text-sm sm:leading-relaxed`}>
              <p><span aria-hidden="true">🔒</span> <span className="sm:hidden">{mobileC.secure}</span><span className="hidden sm:inline">{c.security}</span></p>
              {checkingAvailability ? <p className="mt-2 text-xs text-on-surface-variant/80">{c.checking}</p> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-gold/15 bg-[#050507] px-4 pb-[max(.8rem,env(safe-area-inset-bottom))] pt-3 sm:bg-[#050507]/95 sm:px-6 sm:py-4 sm:backdrop-blur-xl">
        <div className="mx-auto flex max-w-[860px] items-center gap-2 sm:justify-between sm:gap-4">
          <p className="hidden text-sm leading-relaxed text-on-surface-variant sm:block">{c.footer}</p>

          {mobileStep === 1 ? (
            <button
              type="button"
              onClick={moveToContactStep}
              disabled={checkingAvailability || !hasAvailableTable}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gold px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-dark-navy transition active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-60 sm:hidden"
            >
              {mobileC.continue}<ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex w-full gap-2 sm:hidden">
              <button
                type="button"
                onClick={() => { setMobileStep(1); setError(""); }}
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-1 rounded-2xl border border-white/[.12] px-3 text-xs font-bold text-on-surface-variant"
                aria-label={mobileC.back}
              >
                <ChevronLeft className="h-4 w-4" />{mobileC.back}
              </button>
              <button
                type="submit"
                disabled={submitting || checkingAvailability || !hasAvailableTable}
                className="inline-flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-gold px-3 py-3 text-xs font-black uppercase tracking-[0.13em] text-dark-navy transition active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Send className="h-4 w-4 shrink-0" />
                <span className="truncate">{submitting ? c.sending : !hasAvailableTable ? c.soldOut : t("requestReservation")}</span>
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || checkingAvailability || !hasAvailableTable}
            className="hidden items-center justify-center gap-2 rounded-3xl bg-gold px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-dark-navy transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-70 sm:inline-flex"
          >
            <Send className="h-4 w-4" />
            {submitting ? c.sending : !hasAvailableTable ? c.soldOut : t("requestReservation")}
          </button>
        </div>
      </div>
    </form>
  );
}

const inputClass =
  "w-full min-w-0 rounded-xl border border-gold/10 bg-deep-black/80 px-3 py-3 text-[13px] font-semibold text-on-surface outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/10 sm:rounded-2xl sm:px-4 sm:text-sm";

function Info({
  label,
  value,
  gold = false,
}: {
  label: string;
  value: string;
  gold?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gold/10 bg-deep-black/45 p-2.5 sm:rounded-2xl sm:p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/65">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-black ${gold ? "text-gold" : "text-on-surface"}`}
      >
        {value}
      </p>
    </div>
  );
}
