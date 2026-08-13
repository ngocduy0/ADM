import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Star,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PhoneCall,
} from "lucide-react";
import { HomepageReel, Venue } from "../types";
import { useI18n, Locale } from "../i18n";
import { localizeCategory, localizeVenue } from "../localize";
import { SiteSettings } from "../siteSettings";
import { getLocalizedContactChannels } from "../contactConfig";

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
  if (value.startsWith("blob:") || value.startsWith("data:video")) return true;
  try {
    const parsed = new URL(value, "https://duyt.local");
    const host = parsed.hostname.toLowerCase();
    // Social post/profile links are webpages, not streamable media files.
    if (/(^|\.)(instagram|facebook|tiktok|youtube|youtu|vimeo)\./i.test(host) || host === "youtu.be") return false;
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    // A configured video field may be a signed/CDN URL without an extension.
    // Let the browser inspect its Content-Type and fall back to the poster on error.
    return true;
  } catch {
    return /\.(mp4|m4v|webm|ogg|mov)(?:$|[?#])/i.test(value);
  }
}

function getVenueReelCards(
  venue: Venue,
  displayVenue: ReturnType<typeof localizeVenue>,
) {
  const storedReels = displayVenue.reels;

  if (Array.isArray(storedReels) && storedReels.length) {
    return storedReels
      .filter((reel) => reel.isActive !== false)
      .sort((a, b) => {
        const aOrder = Number(a.order);
        const bOrder = Number(b.order);
        return (Number.isFinite(aOrder) ? aOrder : Number.MAX_SAFE_INTEGER)
          - (Number.isFinite(bOrder) ? bOrder : Number.MAX_SAFE_INTEGER);
      })
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
          order: Number.isFinite(Number(reel.order)) ? Number(reel.order) : index + 1,
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

function useRichMediaAllowed() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    // Do not disable configured media merely because the visitor is on a phone,
    // uses Data Saver or prefers reduced motion. Those conditions previously
    // prevented the <video> element from being mounted at all. Videos are now
    // lazy/viewport loaded and always retain a tap-to-play fallback when a
    // browser (notably iOS Low Power Mode) blocks muted autoplay.
    setAllowed(typeof document !== "undefined" && Boolean(document.createElement("video").play));
  }, []);

  return allowed;
}


function HeroTypewriter({ text }: { text: string }) {
  const [visibleText, setVisibleText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setVisibleText(text);
      return;
    }

    let delay = 72;
    if (!deleting && visibleText.length === text.length) delay = 5000;
    if (deleting) delay = visibleText.length ? 38 : 420;

    const timer = window.setTimeout(() => {
      if (!deleting && visibleText.length < text.length) {
        setVisibleText(text.slice(0, visibleText.length + 1));
        return;
      }
      if (!deleting && visibleText.length === text.length) {
        setDeleting(true);
        return;
      }
      if (deleting && visibleText.length > 0) {
        setVisibleText(text.slice(0, visibleText.length - 1));
        return;
      }
      setDeleting(false);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [deleting, text, visibleText]);

  return (
    <div
      aria-label={text}
      className="duyt-hero-title-wrap relative flex min-h-[4.8rem] w-full max-w-[96vw] items-center justify-center px-2 text-center sm:min-h-[5.8rem]"
    >
      <span aria-hidden="true" className="duyt-hero-title-aura" />
      <span className="duyt-hero-title relative z-10 uppercase">
        <span aria-hidden="true" className="duyt-hero-title-glow">{visibleText}</span>
        <span className="duyt-hero-title-face">{visibleText}</span>
      </span>
      <span aria-hidden="true" className="duyt-hero-caret relative z-10 ml-1 inline-block h-[.92em] w-[3px] rounded-full bg-[#efe5ff]" />
    </div>
  );
}

function AdaptiveHeroMedia({
  videoUrl,
  posterUrl,
  alt,
  canPlayVideo,
}: {
  videoUrl: string;
  posterUrl: string;
  alt: string;
  canPlayVideo: boolean;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [inViewport, setInViewport] = useState(false);
  const [loadVideo, setLoadVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const attemptPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video || videoFailed) return;
    if (!inViewport || document.visibilityState !== 'visible') {
      video.pause();
      return;
    }
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    try {
      await video.play();
      setPlaybackBlocked(false);
      setVideoReady(true);
    } catch {
      setPlaybackBlocked(true);
    }
  }, [inViewport, videoFailed]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (typeof IntersectionObserver === "undefined") {
      setInViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInViewport(entry.isIntersecting && entry.intersectionRatio > 0.12),
      { threshold: [0, 0.12, 0.5] },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inViewport) {
      videoRef.current?.pause();
      return;
    }
    if (loadVideo) void attemptPlay();
  }, [attemptPlay, inViewport, loadVideo]);

  useEffect(() => {
    setVideoReady(false);
    setPlaybackBlocked(false);
    setVideoFailed(false);
    if (!videoUrl || !canPlayVideo || !isDirectVideoUrl(videoUrl)) {
      setLoadVideo(false);
      return;
    }

    if (!inViewport) return;

    const win = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const idleId = win.requestIdleCallback?.(() => setLoadVideo(true), { timeout: 650 });
    const timeoutId = idleId == null ? window.setTimeout(() => setLoadVideo(true), 120) : null;

    return () => {
      if (idleId != null) win.cancelIdleCallback?.(idleId);
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [canPlayVideo, inViewport, videoUrl]);

  useEffect(() => {
    if (!loadVideo) return;
    const retry = () => void attemptPlay();
    const visibility = () => {
      if (document.visibilityState === "visible" && inViewport) retry();
      else videoRef.current?.pause();
    };
    window.addEventListener("pointerdown", retry, { passive: true });
    window.addEventListener("touchstart", retry, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    const timer = window.setTimeout(() => {
      if (videoRef.current?.paused) setPlaybackBlocked(true);
    }, 1400);
    return () => {
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("touchstart", retry);
      document.removeEventListener("visibilitychange", visibility);
      window.clearTimeout(timer);
    };
  }, [attemptPlay, inViewport, loadVideo]);

  return (
    <div ref={hostRef} className="absolute inset-0">
      <img
        src={posterUrl}
        alt={alt}
        referrerPolicy="no-referrer"
        fetchPriority="high"
        decoding="async"
        className="h-full w-full object-cover brightness-[1.18] contrast-[1.05] saturate-[1.08]"
      />
      {loadVideo && !videoFailed ? (
        <video
          ref={videoRef}
          key={videoUrl}
          src={videoUrl}
          poster={posterUrl || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          disablePictureInPicture
          onLoadedData={() => void attemptPlay()}
          onCanPlay={() => void attemptPlay()}
          onPlaying={() => { setVideoReady(true); setPlaybackBlocked(false); }}
          onError={() => { setVideoFailed(true); setVideoReady(false); }}
          className={[
            "absolute inset-0 h-full w-full object-cover brightness-[1.28] contrast-[1.06] saturate-[1.12] transition-opacity duration-500",
            videoReady ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
      ) : null}
      {loadVideo && playbackBlocked && !videoFailed ? (
        <button
          type="button"
          onClick={() => void attemptPlay()}
          className="absolute bottom-24 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/35 bg-black/65 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-xl backdrop-blur-md md:bottom-12"
          aria-label="Phát video banner"
        >
          Chạm để phát video
        </button>
      ) : null}
    </div>
  );
}

function ReelCardMedia({
  videoUrl,
  poster,
  label,
  canPlayVideo,
}: {
  videoUrl?: string;
  poster: string;
  label: string;
  canPlayVideo: boolean;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const attemptPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video || videoFailed || !nearViewport || document.visibilityState !== "visible") return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    try {
      await video.play();
      setPlaybackBlocked(false);
    } catch {
      setPlaybackBlocked(true);
    }
  }, [nearViewport, videoFailed]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !videoUrl || !canPlayVideo) return;
    if (typeof IntersectionObserver === "undefined") {
      setNearViewport(true);
      setHasLoaded(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.45;
        setNearViewport(visible);
        if (visible) setHasLoaded(true);
      },
      { rootMargin: "0px", threshold: [0, 0.45, 0.8] },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [canPlayVideo, videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (nearViewport) {
      void attemptPlay();
    } else {
      video.pause();
    }
  }, [attemptPlay, nearViewport]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && nearViewport) void attemptPlay();
      else videoRef.current?.pause();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [attemptPlay, nearViewport]);

  const showVideo = Boolean(videoUrl && isDirectVideoUrl(videoUrl) && canPlayVideo && hasLoaded && !videoFailed);

  return (
    <div ref={hostRef} className="relative h-full w-full bg-[#090a0d]">
      <img
        src={poster}
        alt={label}
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
      {showVideo ? (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={poster}
          muted
          loop
          playsInline
          autoPlay
          preload="none"
          controls={playbackBlocked}
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          aria-label={`${label} reel video`}
          onLoadedData={() => void attemptPlay()}
          onCanPlay={() => void attemptPlay()}
          onPlaying={() => setPlaybackBlocked(false)}
          onError={() => setVideoFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
    </div>
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
  canPlayVideo,
}: {
  feedCopy: { eyebrow: string; title: string; cta: string; fallback: string };
  feedCards: ReelCard[];
  canPlayVideo: boolean;
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
                className="group relative block overflow-hidden rounded-[24px] bg-[#111318] no-underline shadow-[0_1px_3px_rgba(0,0,0,0.5),0_18px_40px_-16px_rgba(0,0,0,0.7)] transition duration-300 hover:-translate-y-1 hover:shadow-gold/10"
                style={{ aspectRatio: "9 / 16" }}
              >
                <ReelCardMedia
                  videoUrl={card.videoUrl}
                  poster={card.poster}
                  label={card.label}
                  canPlayVideo={canPlayVideo}
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


function HomeConciergeSection({ locale, siteSettings }: { locale: Locale; siteSettings?: SiteSettings }) {
  const copy = homeConciergeCopy[locale] || homeConciergeCopy.vi;
  const contactChannels = getLocalizedContactChannels(siteSettings, locale);
  const sectionUi = ({
    vi: { title: "Dịch vụ Concierge", dockLabel: "Kênh liên hệ trực tiếp" },
    en: { title: "Private Concierge", dockLabel: "Direct contact channels" },
    ko: { title: "프라이빗 컨시어지", dockLabel: "직접 연락 채널" },
    zh: { title: "私人礼宾服务", dockLabel: "直接联系渠道" },
    th: { title: "คอนเซียร์จส่วนตัว", dockLabel: "ช่องทางติดต่อโดยตรง" },
    ja: { title: "プライベートコンシェルジュ", dockLabel: "直接連絡チャネル" },
    hi: { title: "निजी कंसीयर्ज", dockLabel: "सीधे संपर्क चैनल" },
  } as const)[locale];

  return (
    <section id="concierge-service" className="mx-auto max-w-[1440px] border-t border-gold/10 px-6 py-20 md:px-16 md:py-24">
      <div className="grid items-center gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12">
        <div className="space-y-6">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border border-[#d0bcff]/30 bg-black shadow-[0_0_32px_rgba(160,120,255,.15)] md:h-24 md:w-24">
            <img src="/duyt-avatar.jpg" alt="DuyT Concierge" width={96} height={96} decoding="async" className="h-full w-full object-cover" />
            <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/10" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">{copy.curatedBy} DuyT Booking</p>
          <h2 className="duyt-editorial text-4xl leading-none text-on-surface md:text-6xl">{sectionUi.title}</h2>
          <p className="max-w-xl text-sm font-light leading-7 text-on-surface-variant">{copy.description}</p>
          <p className="max-w-xl rounded-[24px] border border-gold/10 bg-gold/5 p-4 text-xs leading-6 text-on-surface-variant">{copy.guidance}</p>
        </div>

        <div
          id="concierge-contact-dock"
          className="duyt-concierge-panel relative overflow-hidden rounded-[30px] border border-[#d0bcff]/16 bg-[radial-gradient(circle_at_50%_20%,rgba(160,120,255,.08),transparent_48%),rgba(5,5,8,.92)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.025),0_24px_60px_rgba(0,0,0,.32)] sm:p-4"
          aria-label={sectionUi.dockLabel}
        >
          <span
            id="concierge-contact-trigger"
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0"
          />
          <div className="mb-3 flex items-center justify-between px-2 pt-1 sm:mb-4">
            <p className="text-[10px] font-black uppercase tracking-[.24em] text-[#d0bcff]/58">{sectionUi.dockLabel}</p>
            <span className="h-px w-12 bg-gradient-to-r from-[#d0bcff]/45 to-transparent sm:w-20" aria-hidden="true" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-3">
            {contactChannels.map((contact, index) => {
              const isPhone = contact.href.startsWith("tel:") || contact.id === "phone";
              const external = !contact.href.startsWith("mailto:") && !contact.href.startsWith("tel:");
              return (
                <a
                  key={contact.id}
                  href={contact.href || "#"}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                  className="duyt-concierge-contact-card group flex min-h-[116px] min-w-0 items-center gap-3 rounded-[20px] border border-white/8 bg-white/[.035] px-3 py-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#d0bcff]/24 hover:bg-[#d0bcff]/[.065] sm:min-h-[138px] sm:gap-4 sm:px-4"
                  style={{ animationDelay: `${90 + index * 45}ms` }}
                  aria-label={`${contact.name}: ${contact.label}`}
                >
                  <span className={[
                    "grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full p-2 sm:h-11 sm:w-11",
                    isPhone ? "bg-gradient-to-br from-[#d0bcff] to-[#6d3bd7] text-[#23005c]" : "bg-white/10",
                  ].join(" ")}>
                    {isPhone ? (
                      <PhoneCall className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <img src={contact.icon} alt="" width={44} height={44} loading="lazy" decoding="async" className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[10px] font-black uppercase tracking-[.07em] text-white sm:text-[11px]">{contact.name}</span>
                    <span className="mt-1 block break-all text-[9px] leading-4 text-white/48 sm:text-[10px]">{contact.label}</span>
                  </span>
                </a>
              );
            })}
          </div>
        </div>
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
  const richMediaAllowed = useRichMediaAllowed();
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
      eyebrow: "DuyT 장소의 순간",
      title: "장소 하이라이트",
      cta: "최신 릴스 보기",
      fallback: "영상은 곧 업데이트됩니다",
    },
    zh: {
      eyebrow: "DuyT 场地瞬间",
      title: "场地亮点",
      cta: "查看更多短视频",
      fallback: "视频即将更新",
    },
    th: {
      eyebrow: "ช่วงเวลาของสถานที่ DuyT",
      title: "ไฮไลต์สถานที่",
      cta: "ดู reels ล่าสุด",
      fallback: "วิดีโอจะอัปเดตเร็ว ๆ นี้",
    },
    ja: {
      eyebrow: "DuyT会場の瞬間",
      title: "会場ハイライト",
      cta: "最新リールを見る",
      fallback: "動画は近日更新予定です",
    },
    hi: {
      eyebrow: "DuyT स्थान की झलकियाँ",
      title: "स्थान की खास झलकियाँ",
      cta: "नवीनतम रील देखें",
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
    .sort((a, b) => {
      const aOrder = Number(a.order);
      const bOrder = Number(b.order);
      return (Number.isFinite(aOrder) ? aOrder : Number.MAX_SAFE_INTEGER)
        - (Number.isFinite(bOrder) ? bOrder : Number.MAX_SAFE_INTEGER);
    });
  const feedCards = homepageCards
    .filter((card) => card.placement !== "HOME_HOST")
    .slice(0, 10);
  const heroFallbackImage =
    featuredVenues[1]?.image ||
    featuredVenues[0]?.image ||
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRr6GcBB5V130o7J2BhcgEp1CMNvrKU2laBltH0L5xJMjKxGu-kJwwemxw&s=10";
  const heroVideoUrl = siteSettings?.heroVideoUrl?.trim() || "";
  const heroPosterUrl =
    siteSettings?.heroPosterUrl?.trim() || heroFallbackImage;

  const configuredSections = [...(siteSettings?.homepageSections || [])]
    .filter((section) => section.enabled)
    .sort((a, b) => a.order - b.order);
  const sections = configuredSections.length
    ? configuredSections
    : [
        { id: "HERO", title: "Hero Banner", subtitle: "", enabled: true, order: 0 },
        { id: "FEATURED_VENUES", title: t("featured"), subtitle: "", enabled: true, order: 1, venueIds: [] },
        { id: "REELS_FEED", title: feedCopy.title, subtitle: "", enabled: true, order: 2 },
        { id: "CONCIERGE", title: "DuyT Concierge", subtitle: "", enabled: true, order: 3 },
        { id: "WHY_DUYT", title: c.whyTitle, subtitle: "", enabled: true, order: 4 },
        { id: "TESTIMONIALS", title: c.testimonialsTitle, subtitle: "", enabled: true, order: 5 },
        { id: "FAQ", title: c.faqTitle, subtitle: "", enabled: true, order: 6 },
      ];
  const featuredSection = sections.find((section) => section.id === "FEATURED_VENUES");
  const configuredVenueIds = featuredSection?.venueIds || [];
  const homepageVenues = configuredVenueIds.length
    ? configuredVenueIds.map((id) => featuredVenues.find((venue) => venue.id === id)).filter((venue): venue is Venue => Boolean(venue))
    : featuredVenues;

  const localizedSectionText = (section: (typeof sections)[number]) => {
    if (locale === "vi") {
      return { title: section.title, subtitle: section.subtitle };
    }

    const fallback = {
      HERO: { title: "Hero", subtitle: "" },
      FEATURED_VENUES: { title: t("featured"), subtitle: t("pickWhere") },
      REELS_FEED: { title: feedCopy.title, subtitle: feedCopy.eyebrow },
      CONCIERGE: { title: "Private Concierge", subtitle: homeConciergeCopy[locale]?.description || homeConciergeCopy.en.description },
      WHY_DUYT: { title: c.whyTitle, subtitle: c.whyText },
      TESTIMONIALS: { title: c.testimonialsTitle, subtitle: "" },
      FAQ: { title: c.faqTitle, subtitle: c.faqIntro },
    }[section.id];

    return fallback || { title: section.title, subtitle: section.subtitle };
  };

  const renderSection = (section: (typeof sections)[number]) => {
    const sectionText = localizedSectionText(section);
    switch (section.id) {
      case "HERO":
        return (
          <section key={section.id} className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden px-4 pb-28 pt-20 sm:min-h-screen sm:px-6 sm:pt-24 md:px-16">
            <div className="absolute inset-0 z-0 overflow-hidden">
              <AdaptiveHeroMedia
                videoUrl={heroVideoUrl}
                posterUrl={heroPosterUrl || heroFallbackImage}
                alt={siteSettings?.brandName || "DuyT Booking"}
                canPlayVideo={richMediaAllowed}
              />
              <div className="absolute inset-0 bg-black/[0.2]" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/12 to-black/38" />
              <div className="absolute inset-x-0 bottom-0 h-[34vh] bg-gradient-to-t from-[#05070A] via-[#05070A]/55 to-transparent" />
            </div>

            <div className="relative z-10 mx-auto flex w-full max-w-[1180px] flex-col items-center justify-center text-center">
              <HeroTypewriter text="Booking Đà Nẵng" />
              <button
                type="button"
                onClick={() => onNavigate("CONTACT")}
                className="duyt-book-now duyt-hero-book-now group relative mt-7 inline-flex min-h-14 items-center justify-center gap-3 overflow-hidden rounded-full border border-[#f1e8ff]/65 bg-gradient-to-r from-[#d1baff] via-[#925cff] to-[#6328dc] px-8 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-white shadow-[0_0_42px_rgba(160,120,255,.62)] transition hover:-translate-y-1 hover:scale-[1.035] sm:text-sm"
              >
                <span className="duyt-book-now-shine" aria-hidden="true" />
                <span className="duyt-hero-book-halo" aria-hidden="true" />
                <span className="duyt-lightning-bolt duyt-lightning-bolt--one" aria-hidden="true" />
                <span className="duyt-lightning-bolt duyt-lightning-bolt--two" aria-hidden="true" />
                <span className="duyt-lightning-bolt duyt-lightning-bolt--three" aria-hidden="true" />
                <span className="duyt-lightning-bolt duyt-lightning-bolt--four" aria-hidden="true" />
                <span className="relative grid h-8 w-8 place-items-center rounded-full bg-white/16 ring-1 ring-white/25">
                  <PhoneCall className="h-4 w-4" />
                </span>
                <span className="relative">Book Now</span>
                <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>

            <button
              type="button"
              onClick={(event) => {
                const heroSection = event.currentTarget.closest("section");
                const nextSection = heroSection?.nextElementSibling;
                if (nextSection instanceof HTMLElement) {
                  nextSection.scrollIntoView({ behavior: "smooth", block: "start" });
                  return;
                }
                window.scrollBy({ top: window.innerHeight * 0.9, behavior: "smooth" });
              }}
              className="duyt-hero-scroll-cue absolute bottom-[118px] left-1/2 z-20 grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-black/35 text-white shadow-[0_8px_28px_rgba(0,0,0,.32)] backdrop-blur-sm transition-colors hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d0bcff]/80 md:bottom-[88px]"
              aria-label={locale === "vi" ? "Cuộn xuống nội dung bên dưới" : "Scroll to the next section"}
            >
              <ChevronDown className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
            </button>
          </section>
        );
      case "FEATURED_VENUES":
        return (
          <section key={section.id} className="duyt-deferred-section mx-auto max-w-[1440px] border-t border-gold/10 px-6 py-20 md:px-16 md:py-24">
            <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
              <div>
                <h2 className="break-words font-serif text-3xl tracking-wide text-on-surface md:text-5xl">{sectionText.title || t("featured")}</h2>
                {sectionText.subtitle ? <p className="mt-3 text-sm text-on-surface-variant">{sectionText.subtitle}</p> : null}
              </div>
              <button onClick={() => onNavigate("VENUES")} className="flex cursor-pointer items-center gap-1 border-b border-gold pb-1 text-xs font-bold uppercase text-gold transition-all hover:border-gold-light hover:text-gold-light">{t("browseAll")} <ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {homepageVenues.slice(0, 6).map((v) => {
                const displayVenue = localizeVenue(v, locale);
                return (
                  <div key={v.id} onClick={() => onSelectVenue(v.id)} className="group relative h-[550px] cursor-pointer overflow-hidden rounded-[24px] border border-gold/10 transition-all duration-500 hover:border-gold/30">
                    <img src={v.image} alt={displayVenue.name} referrerPolicy="no-referrer" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-deep-black via-deep-black/30 to-transparent" />
                    <div className="absolute inset-0 z-10 flex flex-col justify-between p-8">
                      <div><span className="rounded-full border border-gold/20 bg-deep-black/50 px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-gold">{localizeCategory(v.category, locale)}</span></div>
                      <div><div className="mb-4 flex items-center justify-between text-xs text-gold"><span>★ {v.rating.toFixed(1)}</span></div><h3 className="mb-2 break-words font-serif text-2xl text-on-surface">{displayVenue.name}</h3><p className="mb-6 line-clamp-2 text-xs font-light leading-relaxed text-on-surface-variant">{displayVenue.location}</p><button className="text-[11px] font-bold tracking-widest text-gold transition-transform duration-300 group-hover:translate-x-2">{t("discover")} →</button></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      case "REELS_FEED":
        return <div key={section.id} className="duyt-deferred-section"><HomepageReelsSection feedCopy={{ ...feedCopy, title: sectionText.title || feedCopy.title }} feedCards={feedCards} canPlayVideo={richMediaAllowed} /></div>;
      case "CONCIERGE":
        return <div key={section.id}><HomeConciergeSection locale={locale} siteSettings={siteSettings} /></div>;
      case "WHY_DUYT":
        return (
          <section key={section.id} className="duyt-deferred-section mx-auto max-w-[1440px] border-t border-gold/10 px-6 py-20 md:px-16 md:py-24">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-5"><h2 className="break-words font-serif text-3xl leading-tight tracking-wide text-on-surface md:text-5xl">{sectionText.title || c.whyTitle}</h2><p className="text-sm font-light leading-relaxed text-on-surface-variant">{sectionText.subtitle || c.whyText}</p></div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-7">{c.blocks.map(([title, text], i) => <div key={i} className="glass-card rounded-[24px] border border-gold/10 p-6"><h4 className="mb-1.5 font-serif text-sm tracking-wide text-gold">{title}</h4><p className="text-xs font-light leading-relaxed text-on-surface-variant">{text}</p></div>)}</div>
            </div>
          </section>
        );
      case "TESTIMONIALS":
        return (
          <section key={section.id} className="duyt-deferred-section border-t border-gold/10 bg-dark-navy/20 px-6 py-20 md:px-16 md:py-24"><div className="mx-auto max-w-[1440px]"><div className="mx-auto mb-16 max-w-2xl text-center"><h2 className="break-words font-serif text-3xl tracking-wide text-on-surface md:text-4xl">{sectionText.title || c.testimonialsTitle}</h2>{sectionText.subtitle ? <p className="mt-3 text-sm text-on-surface-variant">{sectionText.subtitle}</p> : null}</div><div className="grid grid-cols-1 gap-8 md:grid-cols-3">{c.reviews.map(([author, vip, venue, text], i) => <div key={i} className="glass-card flex flex-col justify-between rounded-[24px] border border-gold/10 p-8"><div><div className="mb-4 flex gap-1">{Array.from({ length: 5 }).map((_, sIdx) => <Star key={sIdx} className="h-3.5 w-3.5 fill-gold text-gold" />)}</div><p className="mb-6 font-serif text-sm font-light italic leading-relaxed text-on-surface-variant">“{text}”</p></div><div className="flex items-center justify-between border-t border-gold/10 pt-4"><div><span className="block text-sm font-semibold text-on-surface">{author}</span><span className="text-[10px] font-light text-on-surface-variant">{c.visited} {venue}</span></div></div></div>)}</div></div></section>
        );
      case "FAQ":
        return (
          <section key={section.id} id="faq" className="duyt-deferred-section mx-auto max-w-[1440px] scroll-mt-28 border-t border-gold/10 px-6 py-24 md:px-16"><div className="grid grid-cols-1 gap-12 lg:grid-cols-12"><div className="space-y-4 text-left lg:col-span-4"><h3 className="break-words font-serif text-3xl tracking-wide text-on-surface">{sectionText.title || c.faqTitle}</h3><p className="text-xs font-light leading-relaxed text-on-surface-variant">{sectionText.subtitle || c.faqIntro}</p></div><div className="space-y-4 text-left font-sans lg:col-span-8">{c.faqs.map(([q, a], idx) => { const isOpen = activeFaq === idx; return <div key={idx} className="overflow-hidden rounded-xl border border-gold/15 transition-all duration-300"><button onClick={() => setActiveFaq(isOpen ? null : idx)} className="flex w-full cursor-pointer items-center justify-between bg-dark-navy/30 p-5 text-left transition-colors hover:bg-gold/5"><span className="text-sm font-semibold text-on-surface">{q}</span><ChevronDown className={`h-4 w-4 text-gold transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} /></button>{isOpen ? <div className="border-t border-gold/10 bg-deep-black/40 p-5 font-sans text-xs font-light leading-relaxed text-on-surface-variant">{a}</div> : null}</div>; })}</div></div></section>
        );
      default:
        return null;
    }
  };

  return <div className="pb-28 text-left font-sans text-on-surface sm:pb-32">{sections.map(renderSection)}</div>;
}