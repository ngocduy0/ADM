import React, { useRef, useState } from "react";
import {
  Star,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Phone,
} from "lucide-react";
import { HomepageReel, Venue } from "../types";
import { useI18n, Locale } from "../i18n";
import { localizeVenue, formatVnd } from "../localize";
import { CONTACT_CHANNELS, CONTACT_INFO } from "../contactConfig";
import { SiteSettings } from "../siteSettings";

interface HomepageViewProps {
  featuredVenues: Venue[];
  siteSettings?: SiteSettings;
  onNavigate: (view: string, targetId?: string) => void;
  onSelectVenue: (venueId: string) => void;
}

type Copy = {
  flexible: string;
  whyEyebrow: string;
  whyTitle: string;
  whyText: string;
  testimonialsEyebrow: string;
  testimonialsTitle: string;
  faqEyebrow: string;
  faqTitle: string;
  faqIntro: string;
  venueTable: string[];
  minSpend: string;
  visited: string;
  blocks: string[][];
  reviews: string[][];
  faqs: string[][];
};

export const pageCopy: Record<Locale, Copy> = {
  en: {
    flexible:
      "Flexible changes: edits or cancellations can be requested up to 24 hours before arrival.",
    whyEyebrow: "Concierge standard",
    whyTitle: "A refined way to reserve curated venues",
    whyText:
      "DuyT Booking supports every active venue added from the admin dashboard. Tables, rooms, arrival time, guest count and special requests are checked directly with the venue before confirmation.",
    testimonialsEyebrow: "Guest experience",
    testimonialsTitle: "Trusted for premium nights and private gatherings",
    faqEyebrow: "Reservation guide",
    faqTitle: "Frequently asked questions",
    faqIntro:
      "Need a table, private room or celebration setup? Contact DuyT through your preferred channel.",
    venueTable: ["Venue", "Experience", "Hours", "Area"],
    minSpend: "Minimum spend from",
    visited: "Experienced at",
    blocks: [
      [
        "Direct venue confirmation",
        "Every request is checked with the selected venue before confirmation.",
      ],
      [
        "Table & room guidance",
        "Concierge helps match the table, VIP sofa or private room to your group size and occasion.",
      ],
      [
        "Clear spend information",
        "Minimum spend, room/table capacity and service notes are shown before you send the request.",
      ],
      [
        "Personal preparation",
        "Birthday setup, group notes, arrival timing and special requests can be prepared in advance.",
      ],
    ],
    reviews: [
      [
        "Minh Anh T.",
        "PRIVATE GUEST",
        "Club night",
        "The VIP table was confirmed quickly, with clear guidance on arrival time, minimum spend and table area.",
      ],
      [
        "Gia Hân N.",
        "VIP GUEST",
        "Private room",
        "The private room matched our group well and the birthday setup was prepared before arrival.",
      ],
      [
        "Quốc Bảo L.",
        "GROUP BOOKING",
        "Group booking",
        "Concierge helped us choose the right area, confirm timing and keep the group experience smooth.",
      ],
    ],
    faqs: [
      [
        "Which venues are available through DuyT?",
        "All active venues added in the admin dashboard can be shown on the website and handled by DuyT Booking.",
      ],
      [
        "Are tables or rooms confirmed instantly?",
        "No. Concierge checks real availability with the venue before confirming.",
      ],
      [
        "Do venues require minimum spend?",
        "Many venues do. Minimum spend and capacity are shown before you send the request. Prices do not include 10% VAT and 5% service charge unless stated otherwise.",
      ],
      [
        "Can I request birthday or group setup?",
        "Yes. Add your notes when sending the request, or contact DuyT through WhatsApp, Zalo, Telegram, Instagram or Facebook.",
      ],
    ],
  },
  vi: {
    flexible:
      "Linh hoạt thay đổi: có thể yêu cầu chỉnh sửa hoặc hủy trước giờ đến 24 tiếng.",
    whyEyebrow: "Tiêu chuẩn concierge",
    whyTitle: "Đặt chỗ các địa điểm chọn lọc chỉn chu hơn",
    whyText:
      "DuyT Booking hỗ trợ mọi địa điểm trong hệ thống. Mỗi khu bàn, phòng riêng, giờ đến, số khách và yêu cầu đặc biệt đều được kiểm tra trực tiếp với địa điểm trước khi xác nhận.",
    testimonialsEyebrow: "Trải nghiệm khách hàng",
    testimonialsTitle:
      "Sự hài lòng của khách hàng cho các buổi tối cao cấp và nhóm riêng",
    faqEyebrow: "Hướng dẫn đặt chỗ",
    faqTitle: "Câu hỏi thường gặp",
    faqIntro:
      "Nếu cần chọn bàn, phòng riêng hoặc setup sinh nhật, hãy liên hệ DuyT qua kênh bạn muốn.",
    venueTable: ["Địa điểm", "Trải nghiệm", "Giờ hoạt động", "Khu vực"],
    minSpend: "Chi tiêu tối thiểu từ",
    visited: "Đã trải nghiệm tại",
    blocks: [
      [
        "Xác nhận trực tiếp với địa điểm",
        "Mỗi yêu cầu đều được kiểm tra với địa điểm đã chọn trước khi xác nhận.",
      ],
      [
        "Tư vấn bàn & phòng phù hợp",
        "DuyT hỗ trợ chọn khu bàn, sofa VIP hoặc phòng riêng theo số lượng khách và dịp sử dụng.",
      ],
      [
        "Thông tin minh bạch",
        "Minimum spend, sức chứa và các lưu ý dịch vụ được hiển thị rõ trước khi gửi yêu cầu.",
      ],
      [
        "Chuẩn bị theo yêu cầu",
        "Sinh nhật, kỷ niệm, setup phòng, giờ đến và các ghi chú riêng đều có thể được chuẩn bị trước.",
      ],
    ],
    reviews: [
      [
        "Minh Anh Trần.",
        "PRIVATE GUEST",
        "ADM Club",
        "Bàn VIP được xác nhận nhanh, thông tin về giờ đến, khu bàn và phục vụ rất chuyên nghiệp.",
      ],
      [
        "Gia Hân Nguyễn.",
        "VIP GUEST",
        "LasVegas Room",
        "Phòng Hát hiện đại, âm thanh cực hay và không gian rộng rãi.",
      ],
      [
        "Quốc Bảo Lê.",
        "GROUP BOOKING",
        "ADM Club",
        "Anh DuyT hỗ trợ chọn đúng khu vực, nhiệt tình và thân thiện.",
      ],
    ],
    faqs: [
      [
        "DuyT hiện hỗ trợ những địa điểm nào?",
        "Tất cả địa điểm đang được hiển thị ở đây và được DuyT Booking hỗ trợ.",
      ],
      [
        "Bàn hoặc phòng có được xác nhận ngay không?",
        "Không. DuyT sẽ kiểm tra tình trạng thực tế với địa điểm trước khi xác nhận.",
      ],
      [
        "Địa điểm có giá tối thiểu không?",
        "Nhiều địa điểm có giá tối thiểu. Giá tối thiểu và sức chứa được hiển thị trước khi gửi yêu cầu. Giá chưa bao gồm 10% VAT và 5% phí phục vụ nếu địa điểm không ghi chú khác.",
      ],
      [
        "Có thể yêu cầu setup sinh nhật hoặc nhóm đông không?",
        "Có. Hãy ghi chú khi gửi yêu cầu hoặc liên hệ DuyT qua WhatsApp, Zalo, Telegram, Instagram hoặc Facebook.",
      ],
    ],
  },
  ko: {
    flexible:
      "유연한 변경: 도착 24시간 전까지 변경 또는 취소 요청이 가능합니다.",
    whyEyebrow: "컨시어지 기준",
    whyTitle: "엄선된 장소를 더 정교하게 예약",
    whyText:
      "관리자 대시보드에 추가된 모든 활성 장소를 DuyT Booking가 지원합니다. 테이블, 룸, 도착 시간, 인원, 특별 요청을 현장과 직접 확인한 뒤 확정합니다.",
    testimonialsEyebrow: "고객 경험",
    testimonialsTitle: "프리미엄 나이트와 프라이빗 모임을 위한 선택",
    faqEyebrow: "예약 안내",
    faqTitle: "FAQ",
    faqIntro:
      "테이블, 프라이빗 룸 또는 특별 세팅이 필요하면 원하는 채널로 DuyT에 문의하세요.",
    venueTable: ["장소", "경험", "운영 시간", "지역"],
    minSpend: "최소 이용 금액",
    visited: "이용 장소",
    blocks: [
      ["현장 직접 확인", "모든 요청은 선택한 장소와 직접 확인 후 확정됩니다."],
      [
        "테이블 & 룸 안내",
        "그룹 규모와 목적에 맞는 테이블, VIP 소파 또는 프라이빗 룸을 안내합니다.",
      ],
      [
        "명확한 이용 조건",
        "최소 이용 금액, 수용 인원, 서비스 안내를 요청 전 확인할 수 있습니다.",
      ],
      [
        "맞춤 준비",
        "생일 세팅, 단체 요청, 도착 시간과 특별 메모를 미리 전달할 수 있습니다.",
      ],
    ],
    reviews: [
      [
        "Minh Anh T.",
        "PRIVATE GUEST",
        "Club night",
        "VIP 테이블이 빠르게 확인되었고 도착 시간, 최소 이용 금액, 테이블 구역 안내가 명확했습니다.",
      ],
      [
        "Gia Hân N.",
        "VIP GUEST",
        "Private room",
        "프라이빗 룸이 그룹 규모에 잘 맞았고 생일 세팅도 도착 전에 준비되어 있었습니다.",
      ],
      [
        "Quốc Bảo L.",
        "GROUP BOOKING",
        "Group booking",
        "컨시어지가 적절한 구역과 시간을 확인해 주어 그룹 전체가 편하게 이용했습니다.",
      ],
    ],
    faqs: [
      [
        "DuyT에서 예약 가능한 장소는 어디인가요?",
        "관리자 대시보드에 추가되고 활성화된 모든 장소를 표시하고 지원할 수 있습니다.",
      ],
      [
        "테이블이나 룸이 즉시 확정되나요?",
        "아니요. 컨시어지가 현장 가능 여부를 확인한 뒤 확정합니다.",
      ],
      [
        "최소 이용 금액이 있나요?",
        "많은 장소에 최소 이용 금액이 있습니다. 요청 전 최소 이용 금액과 수용 인원을 확인할 수 있습니다.",
      ],
      [
        "생일 또는 단체 세팅을 요청할 수 있나요?",
        "가능합니다. 요청 메모에 남기거나 WhatsApp, Zalo, Telegram, Instagram, Facebook으로 연락하세요.",
      ],
    ],
  },
  zh: {
    flexible: "灵活变更：可在到达前24小时提出修改或取消。",
    whyEyebrow: "礼宾标准",
    whyTitle: "更精致地预订精选场地",
    whyText:
      "DuyT Booking 支持后台已添加并启用的所有场地。桌位、包厢、到达时间、人数和特殊需求都会先与场地方直接确认。",
    testimonialsEyebrow: "客户体验",
    testimonialsTitle: "适合高级夜晚与私人聚会的选择",
    faqEyebrow: "预订指南",
    faqTitle: "FAQ",
    faqIntro: "如需桌位、私人包厢或生日布置，请通过偏好的渠道联系 DuyT。",
    venueTable: ["场地", "体验", "营业时间", "区域"],
    minSpend: "最低消费从",
    visited: "体验地点",
    blocks: [
      ["直接与场地确认", "每个请求都会先与所选场地确认后再回复。"],
      ["桌位与包厢建议", "礼宾会根据人数和目的推荐桌位、VIP 沙发或私人包厢。"],
      ["信息清晰", "最低消费、容纳人数与服务说明会在发送请求前展示。"],
      ["个性化准备", "生日布置、团队备注、到达时间与特殊要求可提前安排。"],
    ],
    reviews: [
      [
        "Minh Anh T.",
        "PRIVATE GUEST",
        "Club night",
        "VIP 桌位确认很快，到达时间、最低消费和桌位区域说明都很清楚。",
      ],
      [
        "Gia Hân N.",
        "VIP GUEST",
        "Private room",
        "私人包厢很适合我们的团队，生日布置在到达前已准备好。",
      ],
      [
        "Quốc Bảo L.",
        "GROUP BOOKING",
        "Group booking",
        "礼宾帮我们选择合适区域并确认时间，整体体验很顺畅。",
      ],
    ],
    faqs: [
      [
        "DuyT 目前支持哪些场地？",
        "后台添加并启用的所有场地都可以显示在网站并由 DuyT Booking 支持。",
      ],
      ["桌位或包厢会立即确认吗？", "不会。礼宾会先与场地确认实际可用情况。"],
      [
        "场地有最低消费吗？",
        "许多场地有。发送请求前会显示最低消费和容纳人数。",
      ],
      [
        "可以要求生日或团队布置吗？",
        "可以。请在请求备注中填写，或通过 WhatsApp、Zalo、Telegram、Instagram、Facebook 联系 DuyT。",
      ],
    ],
  },
  th: {
    flexible: "ยืดหยุ่น: ขอแก้ไขหรือยกเลิกได้ก่อนเวลามาถึง 24 ชั่วโมง",
    whyEyebrow: "มาตรฐานคอนเซียร์จ",
    whyTitle: "จองสถานที่คัดสรรอย่างเป็นระบบกว่าเดิม",
    whyText:
      "DuyT Booking รองรับทุกสถานที่ที่เพิ่มและเปิดใช้งานในแดชบอร์ดแอดมิน โดยตรวจสอบโต๊ะ ห้อง เวลา จำนวนแขก และคำขอพิเศษกับสถานที่ก่อนยืนยัน",
    testimonialsEyebrow: "ประสบการณ์ลูกค้า",
    testimonialsTitle: "ตัวเลือกสำหรับค่ำคืนพรีเมียมและงานส่วนตัว",
    faqEyebrow: "คู่มือการจอง",
    faqTitle: "FAQ",
    faqIntro:
      "หากต้องการโต๊ะ ห้องส่วนตัว หรือเซ็ตอัพวันเกิด ติดต่อ DuyT ผ่านช่องทางที่คุณสะดวก",
    venueTable: ["สถานที่", "ประสบการณ์", "เวลาเปิด", "พื้นที่"],
    minSpend: "ขั้นต่ำเริ่มต้น",
    visited: "ใช้บริการที่",
    blocks: [
      [
        "ยืนยันกับสถานที่โดยตรง",
        "ทุกคำขอจะตรวจสอบกับสถานที่ที่เลือกก่อนยืนยัน",
      ],
      [
        "แนะนำโต๊ะและห้อง",
        "คอนเซียร์จช่วยเลือกโต๊ะ โซฟา VIP หรือห้องส่วนตัวให้เหมาะกับจำนวนแขกและโอกาส",
      ],
      [
        "ข้อมูลชัดเจน",
        "ขั้นต่ำ จำนวนรองรับ และหมายเหตุบริการจะแสดงก่อนส่งคำขอ",
      ],
      [
        "เตรียมตามคำขอ",
        "วันเกิด กลุ่มใหญ่ เวลาเข้าร้าน และคำขอพิเศษสามารถแจ้งล่วงหน้าได้",
      ],
    ],
    reviews: [
      [
        "Minh Anh T.",
        "PRIVATE GUEST",
        "Club night",
        "โต๊ะ VIP ได้รับการยืนยันรวดเร็ว พร้อมข้อมูลเวลา ขั้นต่ำ และโซนโต๊ะชัดเจน",
      ],
      [
        "Gia Hân N.",
        "VIP GUEST",
        "Private room",
        "ห้องส่วนตัวเหมาะกับกลุ่ม และเซ็ตอัพวันเกิดพร้อมก่อนมาถึง",
      ],
      [
        "Quốc Bảo L.",
        "GROUP BOOKING",
        "Group booking",
        "คอนเซียร์จช่วยเลือกพื้นที่ ยืนยันเวลา และทำให้ประสบการณ์ของกลุ่มราบรื่น",
      ],
    ],
    faqs: [
      [
        "DuyT รองรับสถานที่ใดบ้าง?",
        "ทุกสถานที่ที่เพิ่มและเปิดใช้งานในแดชบอร์ดแอดมินสามารถแสดงบนเว็บไซต์และให้ DuyT Booking ดูแลได้",
      ],
      [
        "โต๊ะหรือห้องยืนยันได้ทันทีไหม?",
        "ไม่ใช่ คอนเซียร์จจะตรวจสอบสถานะจริงกับสถานที่ก่อนยืนยัน",
      ],
      [
        "มีขั้นต่ำหรือไม่?",
        "หลายสถานที่มีขั้นต่ำ ระบบจะแสดงขั้นต่ำและจำนวนรองรับก่อนส่งคำขอ",
      ],
      [
        "ขอเซ็ตอัพวันเกิดหรือกลุ่มใหญ่ได้ไหม?",
        "ได้ กรุณาใส่หมายเหตุในคำขอ หรือทัก DuyT ผ่าน WhatsApp, Zalo, Telegram, Instagram หรือ Facebook",
      ],
    ],
  },
  ja: {
    flexible: "柔軟な変更: 到着24時間前まで変更・キャンセル相談可",
    whyEyebrow: "コンシェルジュ基準",
    whyTitle: "厳選会場をより丁寧に予約",
    whyText:
      "DuyT Bookingは管理者ダッシュボードに追加され有効化されたすべての会場に対応します。席、個室、到着時間、人数、特別リクエストを会場と直接確認してから確定します。",
    testimonialsEyebrow: "ゲスト体験",
    testimonialsTitle: "プレミアムな夜とプライベートな集まりに選ばれるサービス",
    faqEyebrow: "予約ガイド",
    faqTitle: "FAQ",
    faqIntro:
      "テーブル、個室、誕生日セットアップが必要な場合は、ご希望のチャネルでDuyTへご連絡ください。",
    venueTable: ["会場", "体験", "営業時間", "エリア"],
    minSpend: "最低利用金額",
    visited: "利用会場",
    blocks: [
      [
        "会場へ直接確認",
        "すべてのリクエストは選択した会場へ確認後に確定します。",
      ],
      [
        "テーブル・個室案内",
        "人数や目的に合わせてテーブル、VIPソファ、個室をご案内します。",
      ],
      [
        "明確な利用条件",
        "最低利用金額、収容人数、サービス注意事項をリクエスト前に確認できます。",
      ],
      [
        "個別準備",
        "誕生日、グループメモ、到着時間、特別リクエストを事前に共有できます。",
      ],
    ],
    reviews: [
      [
        "Minh Anh T.",
        "PRIVATE GUEST",
        "Club night",
        "VIPテーブルの確認が早く、到着時間、最低利用金額、席エリアの案内も明確でした。",
      ],
      [
        "Gia Hân N.",
        "VIP GUEST",
        "Private room",
        "個室はグループに合っていて、誕生日セットアップも到着前に準備されていました。",
      ],
      [
        "Quốc Bảo L.",
        "GROUP BOOKING",
        "Group booking",
        "コンシェルジュが適切なエリアと時間を確認してくれて、グループ全体がスムーズに楽しめました。",
      ],
    ],
    faqs: [
      [
        "DuyTで予約できる会場は？",
        "管理者ダッシュボードに追加され有効化されたすべての会場を表示し、対応できます。",
      ],
      [
        "テーブルや個室は即時確定ですか？",
        "いいえ。コンシェルジュが会場の空き状況を確認してから確定します。",
      ],
      [
        "最低利用金額はありますか？",
        "多くの会場にあります。リクエスト前に最低利用金額と収容人数が表示されます。",
      ],
      [
        "誕生日や団体セットアップは可能ですか？",
        "可能です。リクエスト時にメモを追加するか、WhatsApp、Zalo、Telegram、Instagram、FacebookでDuyTへご連絡ください。",
      ],
    ],
  },
  hi: {
    flexible:
      "लचीला बदलाव: आगमन से 24 घंटे पहले तक बदलाव या रद्द करने का अनुरोध कर सकते हैं।",
    whyEyebrow: "कंसीयर्ज मानक",
    whyTitle: "Curated venues की अधिक सटीक बुकिंग",
    whyText:
      "DuyT Booking admin dashboard में जोड़े और active किए गए सभी venues को support करता है। Table, private room, arrival time, guest count और special requests की venue से directly confirmation होती है।",
    testimonialsEyebrow: "अतिथि अनुभव",
    testimonialsTitle: "Premium nights और private gatherings के लिए भरोसेमंद",
    faqEyebrow: "आरक्षण मार्गदर्शिका",
    faqTitle: "सामान्य प्रश्न",
    faqIntro:
      "Table, private room या birthday setup के लिए अपनी पसंदीदा contact method से DuyT से जुड़ें।",
    venueTable: ["स्थान", "अनुभव", "समय", "क्षेत्र"],
    minSpend: "न्यूनतम खर्च",
    visited: "अनुभव किया",
    blocks: [
      [
        "स्थल से सीधी पुष्टि",
        "हर अनुरोध चुने गए venue से check होने के बाद confirm होता है।",
      ],
      [
        "टेबल और कक्ष मार्गदर्शन",
        "Concierge group size और occasion के अनुसार table, VIP sofa या private room suggest करता है।",
      ],
      [
        "स्पष्ट जानकारी",
        "न्यूनतम खर्च, capacity और service notes request भेजने से पहले दिखते हैं।",
      ],
      [
        "व्यक्तिगत तैयारी",
        "Birthday setup, group notes, arrival time और special requests पहले से तैयार किए जा सकते हैं।",
      ],
    ],
    reviews: [
      [
        "Minh Anh T.",
        "PRIVATE GUEST",
        "Club night",
        "VIP table जल्दी confirm हुआ और arrival time, minimum spend व table area स्पष्ट बताया गया।",
      ],
      [
        "Gia Hân N.",
        "VIP GUEST",
        "Private room",
        "Private room हमारे group के लिए सही था और birthday setup arrival से पहले ready था।",
      ],
      [
        "Quốc Bảo L.",
        "GROUP BOOKING",
        "Group booking",
        "Concierge ने सही area और timing confirm की, जिससे group experience smooth रहा।",
      ],
    ],
    faqs: [
      [
        "DuyT किन स्थानों को संभालता है?",
        "Admin dashboard में जोड़े और active किए गए सभी venues website पर दिख सकते हैं और DuyT Booking handle कर सकता है।",
      ],
      [
        "टेबल या कक्ष तुरंत पुष्टि होता है?",
        "नहीं। कंसीयर्ज स्थल से वास्तविक उपलब्धता जाँचने के बाद पुष्टि करता है।",
      ],
      [
        "क्या न्यूनतम खर्च है?",
        "कई venues में होता है। Request भेजने से पहले minimum spend और capacity दिखाई जाती है।",
      ],
      [
        "क्या जन्मदिन या समूह सेटअप माँग सकते हैं?",
        "हाँ। अनुरोध में note लिखें या WhatsApp, Zalo, Telegram, Instagram या Facebook से DuyT से संपर्क करें।",
      ],
    ],
  },
};

type ConciergeCopy = {
  curatedBy: string;
  description: string;
  guidance: string;
};

const homeConciergeCopy: Record<Locale, ConciergeCopy> = {
  en: {
    curatedBy: "Curated by",
    description:
      "DuyT Booking supports curated venue reservations with real availability checked before confirmation.",
    guidance:
      "Message DuyT for table area, private room, group size, arrival time and special setup guidance.",
  },
  vi: {
    curatedBy: "Điều phối bởi",
    description:
      "DuyT Booking hỗ trợ đặt chỗ các địa điểm chọn lọc, kiểm tra tình trạng thực tế trước khi xác nhận.",
    guidance:
      "Nhắn DuyT để được tư vấn khu bàn, phòng riêng, số lượng khách, khung giờ đến và các yêu cầu setup riêng.",
  },
  ko: {
    curatedBy: "큐레이션",
    description:
      "DuyT Booking는 엄선된 장소 예약을 지원하며, 확정 전 실제 가능 여부를 확인합니다.",
    guidance:
      "테이블 구역, 프라이빗 룸, 인원, 도착 시간, 특별 세팅은 DuyT로 문의하세요.",
  },
  zh: {
    curatedBy: "礼宾策划",
    description: "DuyT Booking 支持精选场地预订，并在确认前检查真实可用情况。",
    guidance: "如需桌位区域、私人包厢、人数、到达时间或特殊布置，请联系 DuyT。",
  },
  th: {
    curatedBy: "ดูแลโดย",
    description:
      "DuyT Booking รองรับการจองสถานที่คัดสรร โดยตรวจสอบสถานะจริงก่อนยืนยัน",
    guidance:
      "ทัก DuyT เพื่อปรึกษาโซนโต๊ะ ห้องส่วนตัว จำนวนแขก เวลามาถึง และเซ็ตอัพพิเศษ",
  },
  ja: {
    curatedBy: "キュレーション",
    description:
      "DuyT Bookingは厳選会場の予約をサポートし、確定前に実際の空き状況を確認します。",
    guidance:
      "テーブルエリア、個室、人数、到着時間、特別セットアップはDuyTへご相談ください。",
  },
  hi: {
    curatedBy: "क्यूरेटेड",
    description:
      "DuyT Booking curated venue reservations में सहायता करता है और confirmation से पहले real availability check करता है।",
    guidance:
      "Table area, private room, group size, arrival time और special setup के लिए DuyT को message करें।",
  },
};
const DEFAULT_INSTAGRAM_URL = "https://www.instagram.com/duytadm/";

function isInstagramUrl(url?: string) {
  if (!url) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.hostname.replace(/^www\./, "").includes("instagram.com");
  } catch {
    return false;
  }
}

function isDefaultInstagramProfile(url?: string) {
  if (!url) return true;
  try {
    const parsed = new URL(url.trim());
    const cleanPath = parsed.pathname.replace(/^\/+|\/+$/g, "").toLowerCase();
    return (
      parsed.hostname.includes("instagram.com") &&
      (!cleanPath || cleanPath === "duytadm")
    );
  } catch {
    return true;
  }
}

function getInstagramPermalink(url?: string) {
  if (!url) return DEFAULT_INSTAGRAM_URL;
  try {
    const parsed = new URL(url.trim());
    const match = parsed.pathname.match(/^\/(p|reel|tv)\/([^/]+)/i);
    if (!parsed.hostname.includes("instagram.com") || !match)
      return DEFAULT_INSTAGRAM_URL;
    return `https://www.instagram.com/${match[1].toLowerCase()}/${match[2]}/`;
  } catch {
    return DEFAULT_INSTAGRAM_URL;
  }
}

function isDirectVideoUrl(url?: string) {
  if (!url) return false;
  const value = url.trim();
  return (
    value.startsWith("blob:") ||
    value.startsWith("data:video") ||
    /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(value)
  );
}

function getVenueReelCards(
  venue: Venue,
  displayVenue: ReturnType<typeof localizeVenue>,
) {
  const storedReels = venue.reels;

  if (Array.isArray(storedReels) && storedReels.length) {
    return storedReels
      .filter((reel) => reel.isActive !== false)
      .sort((a, b) => (Number(a.order) || 9999) - (Number(b.order) || 9999))
      .map((reel: HomepageReel, index) => {
        const rawVideoUrl = reel.videoUrl?.trim() || "";
        const rawInstagramUrl = reel.instagramUrl?.trim() || "";
        const poster = reel.posterUrl?.trim() || venue.image;
        const reelPermalink = !isDefaultInstagramProfile(rawInstagramUrl)
          ? getInstagramPermalink(rawInstagramUrl)
          : isInstagramUrl(rawVideoUrl)
            ? getInstagramPermalink(rawVideoUrl)
            : DEFAULT_INSTAGRAM_URL;

        return {
          id: `${venue.id}-reel-${reel.id || index}`,
          label: reel.title || displayVenue.name,
          tag: reel.tag || displayVenue.name.split(" ")[0] || "DuyT",
          caption:
            reel.caption ||
            displayVenue.shortDescription ||
            displayVenue.location,
          poster,
          videoUrl: isDirectVideoUrl(rawVideoUrl) ? rawVideoUrl : undefined,
          instagramUrl: reelPermalink,
          placement: reel.placement || "HOME_FEED",
          order: Number(reel.order) || index + 1,
        };
      })
      .filter((card) => card.poster || card.videoUrl);
  }

  const images = [venue.image, ...(venue.images || [])]
    .filter(Boolean)
    .slice(0, 2);
  const instagramUrl = isInstagramUrl(venue.videoUrl)
    ? getInstagramPermalink(venue.videoUrl)
    : DEFAULT_INSTAGRAM_URL;

  return images.map((image, index) => ({
    id: `${venue.id}-${index}`,
    label: displayVenue.name,
    tag: displayVenue.name.split(" ")[0] || "DuyT",
    caption:
      index === 0 ? displayVenue.shortDescription : displayVenue.location,
    poster: image,
    videoUrl:
      index === 0 && isDirectVideoUrl(venue.videoUrl)
        ? venue.videoUrl
        : undefined,
    instagramUrl,
    placement: "HOME_FEED" as const,
    order: index + 999,
  }));
}

function InstagramGlyph() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.5" cy="6.5" r="1.15" fill="currentColor" />
    </svg>
  );
}

function ReelCardMedia({
  videoUrl,
  poster,
  label,
}: {
  videoUrl?: string;
  poster: string;
  label: string;
}) {
  if (videoUrl && isDirectVideoUrl(videoUrl)) {
    return (
      <video
        src={videoUrl}
        poster={poster}
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
        controls={false}
        aria-label={`${label} reel video`}
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <img
      src={poster}
      alt={label}
      referrerPolicy="no-referrer"
      className="h-full w-full object-cover"
    />
  );
}

type ReelCard = ReturnType<typeof getVenueReelCards>[number];

function CarouselArrow({
  direction,
  onClick,
}: {
  direction: "left" | "right";
  onClick: () => void;
}) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Previous reels" : "Next reels"}
      className="grid h-11 w-11 place-items-center rounded-full border border-gold/25 bg-deep-black/80 text-gold shadow-xl shadow-black/30 backdrop-blur-md transition hover:border-gold hover:bg-gold hover:text-dark-navy"
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

function HomepageReelsSection({
  feedCopy,
  feedCards,
}: {
  feedCopy: { eyebrow: string; title: string; cta: string; fallback: string };
  feedCards: ReelCard[];
}) {
  const reelTrackRef = useRef<HTMLUListElement | null>(null);
  const scrollReels = (direction: -1 | 1) => {
    const track = reelTrackRef.current;
    if (!track) return;
    const amount = Math.min(track.clientWidth * 0.92, 980) * direction;
    track.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section className="px-6 md:px-16 max-w-[1440px] mx-auto py-20 border-t border-gold/10 bg-[#071423]/40 overflow-hidden">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl md:text-5xl font-serif text-on-surface tracking-wide break-words">
            {feedCopy.title}
          </h2>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="hidden items-center gap-2 sm:flex">
            <CarouselArrow direction="left" onClick={() => scrollReels(-1)} />
            <CarouselArrow direction="right" onClick={() => scrollReels(1)} />
          </div>
          <a
            href={DEFAULT_INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-dark-navy shadow-lg shadow-gold/15"
          >
            {feedCopy.cta}
          </a>
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => scrollReels(-1)}
          aria-label="Previous reels"
          className="absolute left-0 top-1/2 z-20 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-gold/25 bg-deep-black/90 text-gold shadow-2xl transition hover:bg-gold hover:text-dark-navy lg:grid"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <ul
          ref={reelTrackRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 pr-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {feedCards.map((card) => (
            <li
              key={card.id}
              className="w-[clamp(220px,64vw,300px)] shrink-0 snap-start"
            >
              <a
                href={card.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open Instagram Reel: ${card.tag} — ${card.caption}`}
                className="group relative block overflow-hidden rounded-2xl bg-[#111318] no-underline shadow-[0_1px_3px_rgba(0,0,0,0.5),0_18px_40px_-16px_rgba(0,0,0,0.7)] transition duration-300 hover:-translate-y-1 hover:shadow-gold/10"
                style={{ aspectRatio: "9 / 16" }}
              >
                <ReelCardMedia
                  videoUrl={card.videoUrl}
                  poster={card.poster}
                  label={card.label}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-[72px]"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(0,0,0,0.48), rgba(0,0,0,0))",
                  }}
                />
                <span className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                  {card.tag}
                </span>
                <span
                  aria-hidden="true"
                  className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-black/55 text-white backdrop-blur-md"
                >
                  <InstagramGlyph />
                </span>
                {card.videoUrl && (
                  <span className="absolute right-3 top-12 rounded-full bg-black/55 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                    Reel
                  </span>
                )}
                <div
                  className="absolute inset-x-0 bottom-0 p-3 pt-9 font-serif text-[13.5px] italic leading-snug text-white"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.84), rgba(0,0,0,0))",
                  }}
                >
                  <span className="line-clamp-2">
                    {card.caption || feedCopy.fallback}
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => scrollReels(1)}
          aria-label="Next reels"
          className="absolute right-0 top-1/2 z-20 hidden h-12 w-12 translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-gold/25 bg-deep-black/90 text-gold shadow-2xl transition hover:bg-gold hover:text-dark-navy lg:grid"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}

type FloatingContactItem = {
  name: string;
  href: string;
  icon?: string;
  isPhone?: boolean;
};

function FloatingContactBar() {
  const phoneDisplay = CONTACT_INFO.whatsappPhone || "";
  const phoneHref = phoneDisplay.replace(/[^\d+]/g, "");
  const contactOrder = [
    "WhatsApp",
    "Zalo",
    "Telegram",
    "Instagram",
    "Facebook",
    "Email",
  ];

  const contactChannels: FloatingContactItem[] = CONTACT_CHANNELS.filter(
    (channel) => contactOrder.includes(channel.name),
  )
    .sort(
      (a, b) =>
        contactOrder.indexOf(a.name) - contactOrder.indexOf(b.name),
    )
    .map((channel) => ({
      name: channel.name,
      href: channel.href,
      icon: channel.icon,
    }));

  const contacts: FloatingContactItem[] = [
    {
      name: "Gọi ngay",
      href: `tel:${phoneHref}`,
      isPhone: true,
    },
    ...contactChannels,
  ];

  return (
    <>
      <style>{`
        @keyframes duyt-contact-float {
          0%, 100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -6px, 0);
          }
        }

        @keyframes duyt-contact-ring {
          0% {
            transform: scale(0.75);
            opacity: 0.75;
          }
          75%, 100% {
            transform: scale(1.65);
            opacity: 0;
          }
        }

        .duyt-contact-float {
          animation-name: duyt-contact-float;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          will-change: transform;
        }

        .duyt-contact-ring {
          animation: duyt-contact-ring 1.8s ease-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .duyt-contact-float,
          .duyt-contact-ring {
            animation: none !important;
          }
        }
      `}</style>

      <nav
        aria-label="Liên hệ nhanh"
        className="pointer-events-none fixed inset-x-0 bottom-3 z-[90] px-3 sm:bottom-5 sm:px-6"
      >
        <div className="mx-auto flex max-w-[1100px] justify-center">
          <div className="pointer-events-auto flex max-w-full items-end gap-1.5 overflow-x-auto rounded-[28px] border border-white/10 bg-black/[0.08] px-2.5 py-2 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-[10px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:gap-2 sm:px-3">
            {contacts.map((channel, index) => {
              const isInternalAction =
                channel.href.startsWith("mailto:") ||
                channel.href.startsWith("tel:");

              return (
                <a
                  key={channel.name}
                  href={channel.href}
                  target={isInternalAction ? undefined : "_blank"}
                  rel={isInternalAction ? undefined : "noopener noreferrer"}
                  aria-label={
                    channel.isPhone
                      ? `Gọi ${phoneDisplay}`
                      : `Liên hệ qua ${channel.name}`
                  }
                  title={channel.isPhone ? phoneDisplay : channel.name}
                  className="group flex min-w-[58px] shrink-0 flex-col items-center justify-end gap-1.5 rounded-2xl px-1.5 py-1.5 text-center transition duration-300 hover:-translate-y-1 hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 sm:min-w-[76px] sm:px-2"
                >
                  <span
                    className="duyt-contact-float relative grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/20 shadow-[0_8px_24px_rgba(0,0,0,0.22)] backdrop-blur-md transition duration-300 group-hover:border-gold/60 group-hover:bg-black/35 group-hover:shadow-[0_10px_28px_rgba(214,173,76,0.16)] sm:h-12 sm:w-12"
                    style={{
                      animationDuration: `${3.1 + (index % 3) * 0.45}s`,
                      animationDelay: `${index * 120}ms`,
                    }}
                  >
                    {channel.isPhone ? (
                      <>
                        <span className="duyt-contact-ring absolute inset-0 rounded-full border border-emerald-400/70" />
                        <Phone className="relative z-10 h-5 w-5 text-white transition duration-300 group-hover:rotate-12 group-hover:text-gold sm:h-6 sm:w-6" />
                        <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#090B0F] bg-emerald-400" />
                      </>
                    ) : (
                      <img
                        src={channel.icon}
                        alt=""
                        aria-hidden="true"
                        className="h-7 w-7 object-contain transition duration-300 group-hover:scale-110 sm:h-8 sm:w-8"
                      />
                    )}
                  </span>

                  <span className="max-w-[70px] truncate text-[9px] font-semibold leading-none text-white/80 transition group-hover:text-gold sm:text-[10px]">
                    {channel.name}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}

function HomeConciergeSection({
  locale,
  conciergeCards,
  logoUrl,
}: {
  locale: Locale;
  conciergeCards: ReelCard[];
  logoUrl?: string;
}) {
  const c = homeConciergeCopy[locale] || homeConciergeCopy.en;
  return (
    <section className="px-6 md:px-16 max-w-[1440px] mx-auto py-20 border-t border-gold/10 text-center">
      <div className="mx-auto max-w-3xl rounded-[34px] border border-gold/10 bg-dark-navy/35 px-6 py-12 shadow-2xl shadow-black/20">
        <div className="mb-8 flex items-center justify-center gap-8 text-center">
          <div>
            <p className="text-[11px] sans-label text-gold font-bold uppercase tracking-[0.28em]">
              Booking Concierge
            </p>
            <p className="mt-2 font-serif italic text-on-surface">
              DuyT Booking
            </p>
          </div>
        </div>

        <div className="mx-auto mb-5 h-24 w-24 overflow-hidden rounded-full border border-gold/30">
          <img
            src={logoUrl || "/avatar DuyT.jpg"}
            alt="DuyT Booking"
            className="h-full w-full object-cover"
          />
        </div>
        <p className="mx-auto mt-4 max-w-md font-serif text-sm italic leading-relaxed text-on-surface-variant">
          {c.description}
        </p>
        <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-on-surface">
          {c.guidance}
        </p>

        {conciergeCards.length > 0 && (
          <div className="mx-auto mt-8 flex max-w-2xl snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none]">
            {conciergeCards.map((card) => (
              <a
                key={card.id}
                href={card.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-[9/16] w-[145px] shrink-0 snap-start overflow-hidden rounded-2xl bg-black shadow-xl transition hover:-translate-y-1"
              >
                <ReelCardMedia
                  videoUrl={card.videoUrl}
                  poster={card.poster}
                  label={card.label}
                />
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-white">
                  {card.tag}
                </span>
                <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white">
                  <InstagramGlyph />
                </span>
                <span
                  className="absolute inset-x-0 bottom-0 line-clamp-2 px-2 pb-2 pt-8 font-serif text-[11px] italic leading-tight text-white"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.82), rgba(0,0,0,0))",
                  }}
                >
                  {card.caption}
                </span>
              </a>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}

export default function HomepageView({
  featuredVenues,
  siteSettings,
  onNavigate,
  onSelectVenue,
}: HomepageViewProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const { t, locale } = useI18n();
  const c = pageCopy[locale] || pageCopy.vi;
  const feedCopy = {
    en: {
      eyebrow: "DuyT venue moments",
      title: "Venue highlights",
      cta: "Follow the latest reels",
      fallback: "Video coming soon",
    },
    vi: {
      eyebrow: "Khoảnh khắc DuyT",
      title: "Sôi động tại các địa điểm",
      cta: "Xem thêm reels mới nhất",
      fallback: "Video sẽ cập nhật sau",
    },
    ko: {
      eyebrow: "DuyT moments",
      title: "Venue highlights",
      cta: "최신 릴스 보기",
      fallback: "영상은 곧 업데이트됩니다",
    },
    zh: {
      eyebrow: "DuyT moments",
      title: "Venue highlights",
      cta: "查看更多短视频",
      fallback: "视频即将更新",
    },
    th: {
      eyebrow: "DuyT moments",
      title: "Venue highlights",
      cta: "ดู reels ล่าสุด",
      fallback: "วิดีโอจะอัปเดตเร็ว ๆ นี้",
    },
    ja: {
      eyebrow: "DuyT moments",
      title: "Venue highlights",
      cta: "最新リールを見る",
      fallback: "動画は近日更新予定です",
    },
    hi: {
      eyebrow: "DuyT moments",
      title: "Venue highlights",
      cta: "Latest reels देखें",
      fallback: "Video जल्द अपडेट होगा",
    },
  }[locale] || {
    eyebrow: "DuyT video feed",
    title: "Inside Da Nang nights",
    cta: "Follow the latest reels",
    fallback: "Video coming soon",
  };
  const homepageCards = featuredVenues
    .flatMap((venue) => getVenueReelCards(venue, localizeVenue(venue, locale)))
    .sort((a, b) => (Number(a.order) || 9999) - (Number(b.order) || 9999));
  const feedCards = homepageCards
    .filter((card) => card.placement !== "HOME_HOST")
    .slice(0, 10);
  const conciergeCards = homepageCards
    .filter((card) => card.placement === "HOME_HOST")
    .slice(0, 6);
  const heroFallbackImage =
    featuredVenues[1]?.image ||
    featuredVenues[0]?.image ||
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRr6GcBB5V130o7J2BhcgEp1CMNvrKU2laBltH0L5xJMjKxGu-kJwwemxw&s=10";
  const heroVideoUrl = siteSettings?.heroVideoUrl?.trim() || "";
  const heroPosterUrl =
    siteSettings?.heroPosterUrl?.trim() || heroFallbackImage;

  return (
    <div className="pb-28 text-left font-sans text-on-surface sm:pb-32">
      <section className="relative min-h-screen w-full overflow-hidden flex flex-col justify-center items-start px-6 md:px-16">
        <div className="absolute inset-0 z-0 overflow-hidden">
          {heroVideoUrl ? (
            <video
              key={heroVideoUrl}
              src={heroVideoUrl}
              poster={heroPosterUrl || undefined}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="h-full w-full object-cover brightness-[1.28] contrast-[1.06] saturate-[1.12]"
            />
          ) : (
            <img
              src={heroFallbackImage}
              alt="DuyT Booking"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover brightness-[1.18] contrast-[1.05] saturate-[1.08]"
            />
          )}

          {/* Chỉ giữ lớp phủ rất nhẹ để chữ vẫn đọc được, không làm video bị đen */}
          <div className="absolute inset-0 bg-black/[0.12]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/12 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-[28vh] bg-gradient-to-t from-[#05070A] via-[#05070A]/45 to-transparent" />
        </div>
      </section>

      <section className="px-6 md:px-16 max-w-[1440px] mx-auto py-24 border-t border-gold/10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h2 className="text-3xl md:text-5xl font-serif text-on-surface tracking-wide break-words">
              {t("featured")}
            </h2>
          </div>
          <button
            onClick={() => onNavigate("VENUES")}
            className="text-xs sans-label text-gold border-b border-gold pb-1 hover:text-gold-light hover:border-gold-light transition-all flex items-center gap-1 cursor-pointer font-bold uppercase"
          >
            {t("browseAll")} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredVenues.slice(0, 3).map((v) => {
            const displayVenue = localizeVenue(v, locale);
            return (
              <div
                key={v.id}
                onClick={() => onSelectVenue(v.id)}
                className="group relative h-[550px] rounded-2xl overflow-hidden border border-gold/10 cursor-pointer transition-all duration-500 hover:border-gold/30"
              >
                <img
                  src={v.image}
                  alt={displayVenue.name}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deep-black via-deep-black/30 to-transparent" />
                <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                  <div>
                    <span className="text-[10px] sans-label tracking-widest bg-deep-black/50 border border-gold/20 px-3.5 py-1 rounded-full text-gold uppercase font-bold">
                      {displayVenue.category}
                    </span>
                  </div>
                  <div>
                    <div className="mb-4 flex items-center justify-between text-xs text-gold">
                      <span>★ {v.rating.toFixed(1)}</span>
                    </div>
                    <h3 className="text-2xl font-serif text-on-surface mb-2 break-words">
                      {displayVenue.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant font-light line-clamp-2 leading-relaxed mb-6">
                      {displayVenue.location}
                    </p>
                    <button className="text-[11px] sans-label text-gold font-bold tracking-widest group-hover:translate-x-2 transition-transform duration-300">
                      {t("discover")} →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <HomepageReelsSection feedCopy={feedCopy} feedCards={feedCards} />

      <HomeConciergeSection
        locale={locale}
        conciergeCards={conciergeCards}
        logoUrl={siteSettings?.logoUrl}
      />

      <section className="px-6 md:px-16 max-w-[1440px] mx-auto py-24 border-t border-gold/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-3xl md:text-5xl font-serif text-on-surface tracking-wide leading-tight break-words">
              {c.whyTitle}
            </h2>
            <p className="text-sm text-on-surface-variant font-light leading-relaxed">
              {c.whyText}
            </p>
          </div>
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {c.blocks.map(([title, text], i) => (
              <div
                key={i}
                className="glass-card p-6 rounded-2xl border border-gold/10"
              >
                <h4 className="text-sm font-serif text-gold tracking-wide mb-1.5">
                  {title}
                </h4>
                <p className="text-xs text-on-surface-variant font-light leading-relaxed">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 md:px-16 max-w-[1440px] mx-auto py-24 border-t border-gold/10 bg-dark-navy/20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-serif text-on-surface tracking-wide break-words">
            {c.testimonialsTitle}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {c.reviews.map(([author, vip, venue, text], i) => (
            <div
              key={i}
              className="glass-card p-8 rounded-2xl border border-gold/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, sIdx) => (
                    <Star
                      key={sIdx}
                      className="w-3.5 h-3.5 fill-gold text-gold"
                    />
                  ))}
                </div>
                <p className="text-sm font-serif italic text-on-surface-variant leading-relaxed mb-6 font-light">
                  “{text}”
                </p>
              </div>
              <div className="flex justify-between items-center border-t border-gold/10 pt-4">
                <div>
                  <span className="text-sm font-semibold text-on-surface block">
                    {author}
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-light">
                    {c.visited} {venue}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="faq"
        className="px-6 md:px-16 max-w-[1440px] mx-auto py-24 border-t border-gold/10 scroll-mt-28"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 text-left space-y-4">
            <h3 className="text-3xl font-serif text-on-surface tracking-wide break-words">
              {c.faqTitle}
            </h3>
            <p className="text-xs text-on-surface-variant font-light leading-relaxed">
              {c.faqIntro}
            </p>
          </div>
          <div className="lg:col-span-8 space-y-4 text-left font-sans">
            {c.faqs.map(([q, a], idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-gold/15 rounded-xl overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full flex justify-between items-center p-5 bg-dark-navy/30 hover:bg-gold/5 transition-colors cursor-pointer text-left"
                  >
                    <span className="text-sm font-semibold text-on-surface">
                      {q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gold transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="p-5 bg-deep-black/40 border-t border-gold/10 font-sans text-xs text-on-surface-variant font-light leading-relaxed">
                      {a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <FloatingContactBar />
    </div>
  );
}