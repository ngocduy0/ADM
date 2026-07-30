import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  Clock3,
  Eye,
  FileText,
  MapPin,
  Star,
  X,
} from "lucide-react";
import { PreferredTable, ReservationRequest, Venue } from "../types";
import { useI18n, Locale } from "../i18n";
import { formatVnd, localizeCategory, localizeVenue } from "../localize";
import ReservationForm from "./ReservationForm";
import FloorPlanSelector from "./FloorPlanSelector";
import useBusinessClock from "../hooks/useBusinessClock";
import {
  DEFAULT_OPENING_HOURS,
  PUBLIC_BOOKING_LEAD_MINUTES,
  formatBusinessSlotLabel,
  getBusinessDateForNow,
  getBusinessSlotDisableReason,
  getBusinessTimeSlots,
  getFirstBookableTime,
} from "@/lib/business-session";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1400&auto=format&fit=crop";
const SLIDE_INTERVAL_MS = 2000;

type DetailCopy = {
  back: string;
  evaluations: string;
  conciergeTitle: string;
  manualText: string;
  trustTitle: string;
  trustItems: string[];
  menuTitle: string;
  menuText: string;
  reelsTitle: string;
  reelsEmpty: string;
  floorTitle: string;
  floorText: string;
  selectedTable: string;
  requestSelected: string;
  requestText: string;
  photo: string;
};

const detailCopy: Record<Locale, DetailCopy> = {
  vi: {
    back: "Địa điểm",
    evaluations: "đánh giá từ khách",
    conciergeTitle: "Xác nhận trực tiếp",
    manualText:
      "Đội ngũ concierge kiểm tra tình trạng bàn với địa điểm trước khi xác nhận, giúp mỗi yêu cầu được xử lý chính xác và phù hợp với mong muốn của khách.",
    trustTitle: "Cam kết trải nghiệm",
    trustItems: [
      "Mỗi yêu cầu đều được kiểm tra trực tiếp với địa điểm trước khi xác nhận.",
      "Khu vực bàn, sức chứa và mức chi tiêu tối thiểu được trình bày minh bạch.",
      "DuyT hỗ trợ xuyên suốt qua WhatsApp, Zalo, Telegram, Instagram hoặc Facebook.",
    ],
    menuTitle: "Menu & dịch vụ",
    menuText:
      "Menu có thể thay đổi theo từng thời điểm. Giá hiển thị chưa bao gồm 10% VAT và 5% phí phục vụ.",
    reelsTitle: "Khoảnh khắc tại địa điểm",
    reelsEmpty: "Địa điểm này chưa có video giới thiệu.",
    floorTitle: "Sơ đồ bàn & khu vực",
    floorText:
      "Chọn khu vực trước, sau đó chọn bàn hoặc phòng phù hợp. Mỗi khu có mức chi tiêu tối thiểu và sức chứa riêng.",
    selectedTable: "Đang chọn",
    requestSelected: "Gửi yêu cầu concierge",
    requestText:
      "Concierge sẽ kiểm tra tình trạng bàn/phòng, xác nhận mức chi tiêu tối thiểu và phản hồi qua kênh liên hệ bạn chọn.",
    photo: "Ảnh",
  },
  en: {
    back: "Venues",
    evaluations: "guest reviews",
    conciergeTitle: "Direct confirmation",
    manualText:
      "The concierge team checks table or room availability directly with the venue before confirming each request.",
    trustTitle: "Experience commitment",
    trustItems: [
      "Every request is checked directly with the venue before confirmation.",
      "Table zones, room capacity and minimum spend are shown transparently.",
      "Concierge support is available through WhatsApp, Zalo, Telegram, Instagram or Facebook.",
    ],
    menuTitle: "Menu & services",
    menuText:
      "Menu items may change by venue. Displayed prices exclude 10% VAT and 5% service charge.",
    reelsTitle: "Venue highlights",
    reelsEmpty: "No venue highlights have been uploaded yet.",
    floorTitle: "Table & room map",
    floorText:
      "Choose a zone first, then select a suitable table or room. Each area has its own minimum spend and capacity.",
    selectedTable: "Selected",
    requestSelected: "Send concierge request",
    requestText:
      "Concierge will check table or room availability, confirm minimum spend and reply through your selected contact channel.",
    photo: "Photo",
  },
  ko: {
    back: "장소",
    evaluations: "고객 리뷰",
    conciergeTitle: "직접 확인",
    manualText:
      "컨시어지 팀이 예약 확정 전 장소와 직접 테이블 또는 룸 가능 여부를 확인합니다.",
    trustTitle: "경험 약속",
    trustItems: [
      "모든 요청은 확정 전 장소와 직접 확인됩니다.",
      "구역, 수용 인원, 최소 이용 금액을 투명하게 안내합니다.",
      "WhatsApp, Zalo, Telegram, Instagram 또는 Facebook으로 컨시어지 지원을 제공합니다.",
    ],
    menuTitle: "메뉴 및 서비스",
    menuText:
      "메뉴는 시점에 따라 달라질 수 있습니다. 표시 가격에는 VAT 10%와 서비스 요금 5%가 포함되어 있지 않습니다.",
    reelsTitle: "장소 하이라이트",
    reelsEmpty: "아직 업로드된 장소 영상이 없습니다.",
    floorTitle: "테이블 및 룸 배치도",
    floorText:
      "먼저 구역을 선택한 뒤 적합한 테이블 또는 룸을 선택하세요. 각 구역은 최소 이용 금액과 수용 인원이 다릅니다.",
    selectedTable: "선택됨",
    requestSelected: "컨시어지 요청 보내기",
    requestText:
      "컨시어지가 테이블 또는 룸 가능 여부와 최소 이용 금액을 확인한 뒤 선택한 연락 채널로 안내합니다.",
    photo: "사진",
  },
  zh: {
    back: "场地",
    evaluations: "客户评价",
    conciergeTitle: "人工确认",
    manualText:
      "礼宾团队会在确认前直接与场地核实桌位或包厢状态，确保安排准确。",
    trustTitle: "体验承诺",
    trustItems: [
      "每个请求都会在确认前与场地直接核实。",
      "桌区、包厢容量和最低消费都会清晰展示。",
      "可通过 WhatsApp、Zalo、Telegram、Instagram 或 Facebook 获得礼宾支持。",
    ],
    menuTitle: "菜单与服务",
    menuText: "菜单可能随时段调整。显示价格未包含 10% VAT 和 5% 服务费。",
    reelsTitle: "场地亮点",
    reelsEmpty: "该场地暂未上传视频内容。",
    floorTitle: "桌位与包厢图",
    floorText:
      "先选择区域，再选择合适的桌位或包厢。每个区域都有对应的最低消费和容量。",
    selectedTable: "已选择",
    requestSelected: "发送礼宾请求",
    requestText:
      "礼宾团队会核实桌位或包厢状态、最低消费，并通过你选择的联系方式回复。",
    photo: "照片",
  },
  th: {
    back: "สถานที่",
    evaluations: "รีวิวจากลูกค้า",
    conciergeTitle: "ยืนยันโดยตรง",
    manualText:
      "ทีมคอนเซียร์จจะตรวจสอบโต๊ะหรือห้องกับสถานที่โดยตรงก่อนยืนยันทุกคำขอ",
    trustTitle: "มาตรฐานประสบการณ์",
    trustItems: [
      "ทุกคำขอได้รับการตรวจสอบกับสถานที่โดยตรงก่อนยืนยัน",
      "โซนโต๊ะ ความจุ และขั้นต่ำการใช้จ่ายแสดงอย่างชัดเจน",
      "รองรับการติดต่อผ่าน WhatsApp, Zalo, Telegram, Instagram หรือ Facebook",
    ],
    menuTitle: "เมนูและบริการ",
    menuText:
      "เมนูอาจเปลี่ยนตามช่วงเวลา ราคาที่แสดงยังไม่รวม VAT 10% และค่าบริการ 5%",
    reelsTitle: "ไฮไลต์สถานที่",
    reelsEmpty: "ยังไม่มีวิดีโอสำหรับสถานที่นี้",
    floorTitle: "ผังโต๊ะและห้อง",
    floorText:
      "เลือกโซนก่อน จากนั้นเลือกโต๊ะหรือห้องที่เหมาะสม แต่ละพื้นที่มีขั้นต่ำและความจุแตกต่างกัน",
    selectedTable: "กำลังเลือก",
    requestSelected: "ส่งคำขอคอนเซียร์จ",
    requestText:
      "คอนเซียร์จจะตรวจสอบโต๊ะหรือห้อง ยืนยันขั้นต่ำ และตอบกลับผ่านช่องทางที่คุณเลือก",
    photo: "รูปภาพ",
  },
  ja: {
    back: "会場",
    evaluations: "ゲストレビュー",
    conciergeTitle: "直接確認",
    manualText:
      "コンシェルジュチームが確定前に会場へ直接テーブルまたはルーム状況を確認します。",
    trustTitle: "体験への約束",
    trustItems: [
      "すべてのリクエストは確定前に会場へ直接確認します。",
      "エリア、収容人数、ミニマムスペンドを分かりやすく表示します。",
      "WhatsApp、Zalo、Telegram、Instagram、Facebookでサポートします。",
    ],
    menuTitle: "メニューとサービス",
    menuText:
      "メニューは時期により変更される場合があります。表示価格には10% VATと5%サービス料は含まれていません。",
    reelsTitle: "会場ハイライト",
    reelsEmpty: "この会場の動画はまだアップロードされていません。",
    floorTitle: "テーブル・ルームマップ",
    floorText:
      "まずエリアを選び、次に適したテーブルまたはルームを選択してください。各エリアでミニマムスペンドと収容人数が異なります。",
    selectedTable: "選択中",
    requestSelected: "コンシェルジュへ依頼",
    requestText:
      "コンシェルジュが空き状況とミニマムスペンドを確認し、選択した連絡方法で返信します。",
    photo: "写真",
  },
  hi: {
    back: "स्थान",
    evaluations: "अतिथि समीक्षा",
    conciergeTitle: "सीधी पुष्टि",
    manualText:
      "कंसीयर्ज टीम पुष्टि से पहले सीधे स्थान से टेबल या रूम की उपलब्धता जांचती है।",
    trustTitle: "अनुभव प्रतिबद्धता",
    trustItems: [
      "हर अनुरोध की पुष्टि से पहले स्थान से सीधी जांच की जाती है।",
      "टेबल क्षेत्र, रूम क्षमता और न्यूनतम खर्च स्पष्ट रूप से दिखाया जाता है।",
      "WhatsApp, Zalo, Telegram, Instagram या Facebook के माध्यम से कंसीयर्ज सहायता उपलब्ध है।",
    ],
    menuTitle: "मेनू और सेवाएं",
    menuText:
      "मेनू समय के अनुसार बदल सकता है। दिखाए गए मूल्य में 10% VAT और 5% सेवा शुल्क शामिल नहीं है।",
    reelsTitle: "स्थान हाइलाइट्स",
    reelsEmpty: "इस स्थान के लिए अभी कोई वीडियो अपलोड नहीं है।",
    floorTitle: "टेबल और रूम मैप",
    floorText:
      "पहले क्षेत्र चुनें, फिर उपयुक्त टेबल या रूम चुनें। हर क्षेत्र की न्यूनतम खर्च और क्षमता अलग होती है।",
    selectedTable: "चयनित",
    requestSelected: "कंसीयर्ज अनुरोध भेजें",
    requestText:
      "कंसीयर्ज उपलब्धता और न्यूनतम खर्च की पुष्टि कर आपके चुने हुए संपर्क माध्यम से जवाब देगा।",
    photo: "फोटो",
  },
};



type DetailUiCopy = {
  views: string; soldOut: string; timeMap: string; chooseTime: string; session: string;
  nextDay: string; nextDaySuffix: string; locked: string; checking: string; available: string;
  businessDate: string; arrival: string; past: string; lead: string; minutes: string;
  full: string; menuPdf: string; market: string; closeForm: string; availabilityError: string;
};

const detailUiCopy: Record<Locale, DetailUiCopy> = {
  vi: { views: 'lượt xem', soldOut: 'Hết bàn ở khung giờ này', timeMap: 'Thời gian xem sơ đồ', chooseTime: 'Chọn ngày hoạt động và giờ đến', session: 'Ca hoạt động bắt đầu', nextDay: 'ngày kế tiếp', nextDaySuffix: '+1 ngày', locked: 'Bàn đã có lịch tại thời gian này vẫn hiển thị trên sơ đồ nhưng bị khóa và không thể chọn.', checking: 'Đang kiểm tra lịch bàn…', available: 'bàn còn khả dụng', businessDate: 'Ngày hoạt động', arrival: 'Giờ đến', past: 'ĐÃ QUA', lead: 'CẦN ĐẶT TRƯỚC', minutes: 'PHÚT', full: 'HẾT BÀN', menuPdf: 'Xem menu PDF', market: 'Theo thị trường', closeForm: 'Đóng form đặt bàn', availabilityError: 'Không kiểm tra được lịch bàn.' },
  en: { views: 'views', soldOut: 'No tables at this time', timeMap: 'Floor-plan schedule', chooseTime: 'Choose an operating date and arrival time', session: 'The operating session starts at', nextDay: 'the following day', nextDaySuffix: '+1 day', locked: 'Booked tables remain visible on the floor plan in a locked, non-selectable state.', checking: 'Checking table availability…', available: 'tables available', businessDate: 'Operating date', arrival: 'Arrival time', past: 'PAST', lead: 'BOOK AT LEAST', minutes: 'MIN AHEAD', full: 'FULLY BOOKED', menuPdf: 'View PDF menu', market: 'Market price', closeForm: 'Close reservation form', availabilityError: 'Unable to check table availability.' },
  ko: { views: '조회', soldOut: '이 시간에는 빈 테이블이 없습니다', timeMap: '배치도 예약 시간', chooseTime: '영업일과 도착 시간을 선택하세요', session: '영업 세션 시작', nextDay: '다음 날', nextDaySuffix: '+1일', locked: '예약된 테이블은 배치도에 잠금 상태로 표시되며 선택할 수 없습니다.', checking: '테이블 가능 여부 확인 중…', available: '개 테이블 이용 가능', businessDate: '영업일', arrival: '도착 시간', past: '지난 시간', lead: '최소 사전 예약', minutes: '분', full: '예약 마감', menuPdf: 'PDF 메뉴 보기', market: '시가', closeForm: '예약 양식 닫기', availabilityError: '테이블 가능 여부를 확인할 수 없습니다.' },
  zh: { views: '次浏览', soldOut: '该时段暂无桌位', timeMap: '桌位图时间', chooseTime: '选择营业日期和到达时间', session: '营业时段开始于', nextDay: '次日', nextDaySuffix: '+1天', locked: '已预订桌位仍显示在平面图中，但会锁定且无法选择。', checking: '正在检查桌位…', available: '张桌位可用', businessDate: '营业日期', arrival: '到达时间', past: '已过', lead: '至少提前', minutes: '分钟预订', full: '已满', menuPdf: '查看 PDF 菜单', market: '时价', closeForm: '关闭预订表单', availabilityError: '无法检查桌位可用情况。' },
  th: { views: 'ครั้งที่ดู', soldOut: 'ไม่มีโต๊ะว่างในเวลานี้', timeMap: 'เวลาสำหรับดูผัง', chooseTime: 'เลือกวันที่เปิดให้บริการและเวลามาถึง', session: 'รอบให้บริการเริ่ม', nextDay: 'วันถัดไป', nextDaySuffix: '+1 วัน', locked: 'โต๊ะที่มีการจองแล้วยังคงแสดงบนผังในสถานะล็อกและไม่สามารถเลือกได้', checking: 'กำลังตรวจสอบโต๊ะว่าง…', available: 'โต๊ะว่าง', businessDate: 'วันที่เปิดให้บริการ', arrival: 'เวลามาถึง', past: 'ผ่านไปแล้ว', lead: 'จองล่วงหน้าอย่างน้อย', minutes: 'นาที', full: 'เต็มแล้ว', menuPdf: 'ดูเมนู PDF', market: 'ราคาตลาด', closeForm: 'ปิดแบบฟอร์มจอง', availabilityError: 'ไม่สามารถตรวจสอบโต๊ะว่างได้' },
  ja: { views: '閲覧', soldOut: 'この時間は空きテーブルがありません', timeMap: 'フロアマップ時間', chooseTime: '営業日と到着時間を選択してください', session: '営業開始', nextDay: '翌日', nextDaySuffix: '+1日', locked: '予約済みテーブルはマップ上にロック状態で表示され、選択できません。', checking: '空き状況を確認中…', available: 'テーブル利用可能', businessDate: '営業日', arrival: '到着時間', past: '過去', lead: '少なくとも', minutes: '分前予約', full: '満席', menuPdf: 'PDFメニューを見る', market: '時価', closeForm: '予約フォームを閉じる', availabilityError: '空き状況を確認できません。' },
  hi: { views: 'व्यू', soldOut: 'इस समय कोई टेबल उपलब्ध नहीं है', timeMap: 'फ्लोर-प्लान समय', chooseTime: 'ऑपरेटिंग तारीख और आगमन समय चुनें', session: 'ऑपरेटिंग सत्र शुरू होता है', nextDay: 'अगले दिन', nextDaySuffix: '+1 दिन', locked: 'बुक की गई टेबल फ्लोर प्लान पर लॉक स्थिति में दिखाई देती हैं और चुनी नहीं जा सकतीं।', checking: 'टेबल उपलब्धता जाँची जा रही है…', available: 'टेबल उपलब्ध', businessDate: 'ऑपरेटिंग तारीख', arrival: 'आगमन समय', past: 'बीता हुआ', lead: 'कम से कम पहले बुक करें', minutes: 'मिनट', full: 'पूरी तरह बुक', menuPdf: 'PDF मेनू देखें', market: 'बाज़ार मूल्य', closeForm: 'बुकिंग फ़ॉर्म बंद करें', availabilityError: 'टेबल उपलब्धता जाँची नहीं जा सकी।' },
};

const numberLocale: Record<Locale, string> = {
  vi: 'vi-VN', en: 'en-US', ko: 'ko-KR', zh: 'zh-CN', th: 'th-TH', ja: 'ja-JP', hi: 'hi-IN',
};

interface VenueDetailViewProps {
  venue: Venue;
  onBack: () => void;
  onSubmitRequest: (
    formData: Omit<
      ReservationRequest,
      "id" | "venueId" | "venueName" | "status" | "createdAt" | "source"
    >,
  ) => void;
}

function safeImageList(venue: Venue) {
  const images = Array.from(
    new Set([venue.image, ...(venue.images || [])].filter(Boolean)),
  );
  return images.length ? images : [FALLBACK_IMAGE];
}

function isDirectVideoUrl(rawUrl = "") {
  const value = rawUrl.trim();
  if (!value) return false;
  if (value.startsWith("blob:") || value.startsWith("data:video")) return true;
  try {
    const parsed = new URL(value, "https://duyt.local");
    const host = parsed.hostname.toLowerCase();
    if (/(^|\.)(instagram|facebook|tiktok|youtube|youtu|vimeo)\./i.test(host) || host === "youtu.be") return false;
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return /\.(mp4|m4v|webm|ogg|mov)(?:$|[?#])/i.test(value);
  }
}

function getReelPermalink(rawUrl = "") {
  const fallback = "https://www.instagram.com/duytadm/";
  if (!rawUrl) return fallback;
  try {
    const url = new URL(rawUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    if (url.hostname.includes("instagram.com") && parts[0] && parts[1]) {
      return `https://www.instagram.com/${parts[0]}/${parts[1]}/`;
    }
  } catch {
    return fallback;
  }
  return fallback;
}

function getVenueDetailReels(venue: Venue) {
  return (venue.reels || [])
    .filter((reel) => reel.isActive !== false)
    .sort((a, b) => {
      const aOrder = Number(a.order);
      const bOrder = Number(b.order);
      return (Number.isFinite(aOrder) ? aOrder : Number.MAX_SAFE_INTEGER)
        - (Number.isFinite(bOrder) ? bOrder : Number.MAX_SAFE_INTEGER);
    })
    .map((reel) => ({
      id: reel.id,
      title: reel.title || venue.name,
      tag: reel.tag || venue.name.split(" ")[0] || "DuyT",
      caption: reel.caption || venue.shortDescription,
      posterUrl: reel.posterUrl || venue.image || FALLBACK_IMAGE,
      videoUrl: reel.videoUrl || "",
      instagramUrl: getReelPermalink(reel.instagramUrl),
    }));
}

function DetailReelCard({
  reel,
}: {
  reel: ReturnType<typeof getVenueDetailReels>[number];
}) {
  const hostRef = useRef<HTMLAnchorElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const attemptPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !visible || videoFailed || document.visibilityState !== "visible") return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    try {
      await video.play();
      setPlaybackBlocked(false);
    } catch {
      setPlaybackBlocked(true);
    }
  }, [videoFailed, visible]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !reel.videoUrl || !isDirectVideoUrl(reel.videoUrl)) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      setHasLoaded(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        const nextVisible = entry.isIntersecting && entry.intersectionRatio >= 0.45;
        setVisible(nextVisible);
        if (nextVisible) setHasLoaded(true);
      },
      { rootMargin: "0px", threshold: [0, 0.45, 0.8] },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [reel.videoUrl]);

  useEffect(() => {
    if (visible) void attemptPlay();
    else videoRef.current?.pause();
  }, [attemptPlay, visible]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && visible) void attemptPlay();
      else videoRef.current?.pause();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [attemptPlay, visible]);

  const showVideo = Boolean(hasLoaded && reel.videoUrl && isDirectVideoUrl(reel.videoUrl) && !videoFailed);

  return (
    <a
      ref={hostRef}
      href={reel.instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block aspect-[9/16] overflow-hidden rounded-[24px] border border-gold/10 bg-deep-black shadow-xl transition hover:-translate-y-1 hover:border-gold/35"
    >
      <img
        src={reel.posterUrl}
        alt={reel.title}
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
      {showVideo ? (
        <video
          ref={videoRef}
          src={reel.videoUrl}
          poster={reel.posterUrl}
          muted
          loop
          playsInline
          autoPlay
          controls={playbackBlocked}
          controlsList="nodownload noplaybackrate"
          preload="none"
          disablePictureInPicture
          onLoadedData={() => void attemptPlay()}
          onCanPlay={() => void attemptPlay()}
          onPlaying={() => setPlaybackBlocked(false)}
          onError={() => setVideoFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent" />
      <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
        {reel.tag}
      </span>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent p-3 pt-12 text-white">
        <p className="font-serif text-sm italic leading-tight line-clamp-2">
          {reel.caption}
        </p>
      </div>
    </a>
  );
}

export default function VenueDetailView({
  venue,
  onBack,
  onSubmitRequest,
}: VenueDetailViewProps) {
  const { t, locale } = useI18n();
  const displayVenue = useMemo(() => localizeVenue(venue, locale), [venue, locale]);
  const c = detailCopy[locale]?.back ? detailCopy[locale] : detailCopy.vi;
  const ui = detailUiCopy[locale];
  const now = useBusinessClock();
  const safeImages = useMemo(() => safeImageList(venue), [venue]);
  const venueReels = useMemo(() => getVenueDetailReels(displayVenue), [displayVenue]);
  const openingHours = displayVenue.openingHours || DEFAULT_OPENING_HOURS;
  const mapTimeOptions = useMemo(
    () => getBusinessTimeSlots(openingHours),
    [openingHours],
  );
  const defaultBusinessDate = useMemo(
    () => getBusinessDateForNow(openingHours, now),
    [openingHours, now],
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [pausedUntil, setPausedUntil] = useState(0);
  const [businessDate, setBusinessDate] = useState(defaultBusinessDate);
  const [mapArrivalTime, setMapArrivalTime] = useState(
    getFirstBookableTime(defaultBusinessDate, openingHours, now),
  );
  const basePublicTables = useMemo(
    () =>
      displayVenue.preferredTables.filter((table) => table.status !== "HIDDEN"),
    [displayVenue.preferredTables],
  );
  const [selectedTableId, setSelectedTableId] = useState(
    basePublicTables[0]?.id || "",
  );
  const [showRequestForm, setShowRequestForm] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
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

  const isTableUnavailable = (tableId: string, time = mapArrivalTime) => {
    const table = basePublicTables.find((item) => item.id === tableId);
    return table?.status === "RESERVED" || Boolean(availability[tableId]?.[time]);
  };
  const disabledTableIds = useMemo(() => {
    if (checkingAvailability) return basePublicTables.map((table) => table.id);
    return basePublicTables
      .filter((table) => table.status === "RESERVED" || Boolean(availability[table.id]?.[mapArrivalTime]))
      .map((table) => table.id);
  }, [availability, basePublicTables, checkingAvailability, mapArrivalTime]);
  const disabledTableSet = useMemo(() => new Set(disabledTableIds), [disabledTableIds]);
  const selectableTables = useMemo(
    () => basePublicTables.filter((table) => !disabledTableSet.has(table.id)),
    [basePublicTables, disabledTableSet],
  );
  const selectedTable =
    selectableTables.find((table) => table.id === selectedTableId) ||
    selectableTables[0];

  const isMapTimeFullyBooked = (time: string) =>
    basePublicTables.length > 0 &&
    basePublicTables.every((table) => isTableUnavailable(table.id, time));

  useEffect(() => {
    setActiveImageIndex(0);
    setPausedUntil(0);
    const nextBusinessDate = getBusinessDateForNow(openingHours, now);
    setBusinessDate(nextBusinessDate);
    setMapArrivalTime(getFirstBookableTime(nextBusinessDate, openingHours, now));
    setSelectedTableId(basePublicTables[0]?.id || "");
    setShowRequestForm(false);
  }, [venue.id]);

  useEffect(() => {
    if (safeImages.length <= 1) return;
    const timer = window.setInterval(() => {
      if (Date.now() < pausedUntil) return;
      setActiveImageIndex((current) => (current + 1) % safeImages.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [safeImages.length, pausedUntil]);

  useEffect(() => {
    if (!businessDate || !venue.id) return;
    const controller = new AbortController();
    setAvailability({});
    setCheckingAvailability(true);
    fetch(
      `/api/reservations/availability?venueId=${encodeURIComponent(venue.id)}&businessDate=${encodeURIComponent(businessDate)}`,
      { signal: controller.signal },
    )
      .then((response) => response.json())
      .then((payload) => {
        if (!payload?.ok) {
          throw new Error(payload?.error || ui.availabilityError);
        }
        setAvailability(
          Object.fromEntries(
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
          ),
        );
      })
      .catch((error) => {
        if (error?.name !== "AbortError") setAvailability({});
      })
      .finally(() => {
        if (!controller.signal.aborted) setCheckingAvailability(false);
      });
    return () => controller.abort();
  }, [businessDate, venue.id]);

  useEffect(() => {
    const timeReason = getBusinessSlotDisableReason(
      businessDate,
      mapArrivalTime,
      openingHours,
      now,
      PUBLIC_BOOKING_LEAD_MINUTES,
    );
    if (!timeReason && !isMapTimeFullyBooked(mapArrivalTime)) return;
    const nextTime = mapTimeOptions.find(
      (time) =>
        !getBusinessSlotDisableReason(
          businessDate,
          time,
          openingHours,
          now,
          PUBLIC_BOOKING_LEAD_MINUTES,
        ) && !isMapTimeFullyBooked(time),
    );
    if (nextTime && nextTime !== mapArrivalTime) setMapArrivalTime(nextTime);
  }, [availability, businessDate, mapArrivalTime, mapTimeOptions, now, openingHours]);

  useEffect(() => {
    if (businessDate < defaultBusinessDate) setBusinessDate(defaultBusinessDate);
  }, [businessDate, defaultBusinessDate]);

  useEffect(() => {
    if (selectedTableId && selectableTables.some((table) => table.id === selectedTableId)) return;
    setSelectedTableId(selectableTables[0]?.id || "");
  }, [selectableTables, selectedTableId]);

  const activeImage =
    safeImages[Math.min(activeImageIndex, safeImages.length - 1)] ||
    FALLBACK_IMAGE;

  const openReservationForm = (table?: PreferredTable) => {
    const nextTable =
      (table && selectableTables.find((item) => item.id === table.id)) ||
      selectedTable ||
      selectableTables[0];
    if (!nextTable) return;
    setSelectedTableId(nextTable.id);
    setShowRequestForm(true);
  };

  useEffect(() => {
    if (!showRequestForm) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showRequestForm]);

  return (
    <div className="duyt-public-page mx-auto max-w-[1440px] px-6 pt-6 text-left font-sans md:px-16">
      <button
        onClick={onBack}
        className="mb-8 flex cursor-pointer items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold transition hover:text-gold-light"
      >
        <ChevronLeft className="h-4 w-4" /> {c.back}
      </button>

      <section className="mb-16 grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <div className="relative h-[480px] overflow-hidden rounded-[24px] border border-gold/10 bg-deep-black">
            <img
              src={activeImage}
              alt={displayVenue.name}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-all duration-700"
            />
            <div className="absolute left-4 top-4 rounded-full border border-gold/20 bg-deep-black/60 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-gold backdrop-blur-md">
              {localizeCategory(venue.category, locale)}
            </div>
            <div className="absolute bottom-4 right-4 rounded-full border border-gold/10 bg-deep-black/80 px-4 py-1.5 font-mono text-xs font-bold text-on-surface">
              {(activeImageIndex + 1).toString().padStart(2, "0")} /{" "}
              {safeImages.length.toString().padStart(2, "0")}
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
            {safeImages.map((img, idx) => (
              <button
                key={`${img}-${idx}`}
                onClick={() => {
                  setActiveImageIndex(idx);
                  setPausedUntil(Date.now() + SLIDE_INTERVAL_MS);
                }}
                className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border transition-all ${activeImageIndex === idx ? "scale-95 border-gold shadow-lg shadow-gold/20" : "border-gold/10 opacity-65 hover:opacity-100"}`}
              >
                <img
                  src={img}
                  alt={`${c.photo} ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between space-y-6 lg:col-span-5">
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gold">
              <MapPin className="h-4 w-4" />
              <span>{displayVenue.location}</span>
            </div>
            <h1 className="duyt-editorial mb-4 text-5xl leading-[.94] text-on-surface md:text-7xl">
              {displayVenue.name}
            </h1>
            <div className="mb-6 flex items-center gap-6">
              <div className="flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/10 px-3.5 py-1 text-xs font-semibold text-gold">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const filled = index < Math.round(venue.rating);

                    return (
                      <Star
                        key={index}
                        className={[
                          "h-3.5 w-3.5",
                          filled
                            ? "fill-gold text-gold"
                            : "fill-transparent text-gold/35",
                        ].join(" ")}
                      />
                    );
                  })}
                </div>

                <span>{venue.rating.toFixed(1)}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-light text-on-surface-variant">
                <Eye className="h-3.5 w-3.5 text-gold" />
                {new Intl.NumberFormat(numberLocale[locale]).format(
                  venue.viewCount || 0,
                )}{" "}
                {ui.views}
              </span>
            </div>
            <p className="mb-6 text-sm font-light leading-relaxed text-on-surface-variant">
              {displayVenue.longDescription}
            </p>
            <div className="mb-8 grid gap-3 rounded-[24px] border border-gold/10 bg-dark-navy/35 p-5">
              <span className="text-xs font-bold uppercase tracking-widest text-gold">
                {c.trustTitle}
              </span>
              {c.trustItems.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 text-xs leading-relaxed text-on-surface-variant"
                >
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold/10 text-[10px] text-gold">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => openReservationForm(selectedTable)}
            disabled={!selectedTable || checkingAvailability}
            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-gold py-4 text-xs font-bold uppercase tracking-widest text-dark-navy shadow-xl shadow-gold/15 transition-all hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {selectedTable ? t("requestReservation") : ui.soldOut}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="mb-20 border-t border-gold/10 pt-16">
        <div className="mb-5 rounded-[28px] border border-gold/10 bg-[#050507] p-4 shadow-2xl shadow-black/25 sm:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold">
                {ui.timeMap}
              </p>
              <h3 className="mt-1 text-xl font-serif text-white">
                {ui.chooseTime}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-white/55">
                {ui.session} {openingHours.open} – {openingHours.close} {ui.nextDay}. {ui.locked}
              </p>
            </div>
            <p className="text-xs font-semibold text-on-surface-variant">
              {checkingAvailability
                ? ui.checking
                : `${selectableTables.length}/${basePublicTables.length} ${ui.available}`}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                <CalendarDays className="mr-1 inline h-4 w-4" />
                {ui.businessDate}
              </label>
              <input
                type="date"
                min={defaultBusinessDate}
                value={businessDate}
                onChange={(event) => setBusinessDate(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#09090D] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/10"
              />
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                <Clock3 className="mr-1 inline h-4 w-4" />
                {ui.arrival}
              </label>
              <select
                value={mapArrivalTime}
                onChange={(event) => setMapArrivalTime(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#09090D] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/10"
              >
                {mapTimeOptions.map((time) => {
                  const timeReason = getBusinessSlotDisableReason(
                    businessDate,
                    time,
                    openingHours,
                    now,
                    PUBLIC_BOOKING_LEAD_MINUTES,
                  );
                  const fullyBooked = isMapTimeFullyBooked(time);
                  const suffix =
                    timeReason === "PAST"
                      ? ` · ${ui.past}`
                      : timeReason === "LEAD_TIME"
                        ? ` · ${ui.lead} ${PUBLIC_BOOKING_LEAD_MINUTES} ${ui.minutes}`
                        : fullyBooked
                          ? ` · ${ui.full}`
                          : "";
                  return (
                    <option
                      key={time}
                      value={time}
                      disabled={Boolean(timeReason) || fullyBooked}
                      className="bg-[#09090D] text-white"
                    >
                      {formatBusinessSlotLabel(businessDate, time, openingHours, ui.nextDaySuffix)}
                      {suffix}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        <FloorPlanSelector
          venue={displayVenue}
          selectedTableId={selectedTable?.id}
          disabledTableIds={disabledTableIds}
          onSelectTable={(table) => setSelectedTableId(table.id)}
          onRequestTable={(table) => openReservationForm(table)}
        />
      </section>

      <section className="mb-20 grid grid-cols-1 gap-12 border-t border-gold/10 pt-16 md:grid-cols-2">
        <div className="glass-card rounded-[24px] border border-gold/10 p-8">
          <h3 className="mb-4 text-xl text-gold">{c.menuTitle}</h3>
          <p className="mb-4 border-b border-gold/10 pb-4 text-xs font-light leading-relaxed text-on-surface-variant">
            {c.menuText}
          </p>
          {venue.menuPdfUrl && (
            <a
              href={venue.menuPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/20 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-gold transition hover:bg-gold/10"
            >
              <FileText className="h-4 w-4" /> {ui.menuPdf}
            </a>
          )}
          <div className="space-y-4 text-sm leading-relaxed">
            {(displayVenue.menuUrl || "")
              .split(",")
              .filter(Boolean)
              .map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-4"
                >
                  <span className="font-light text-on-surface-variant">
                    {item.trim().split("(")[0]}
                  </span>
                  {item.includes("(") && (
                    <span className="font-mono font-bold text-gold">
                      {item.match(/\(([^)]+)\)/)?.[1] || ui.market}
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-gold/10 bg-dark-navy/35 p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="text-xl text-gold">{c.reelsTitle}</h3>
          </div>
          {venueReels.length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {venueReels.slice(0, 6).map((reel) => (
                <DetailReelCard key={reel.id} reel={reel} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[220px] items-center justify-center rounded-[24px] border border-dashed border-gold/20 bg-deep-black/60 px-6 text-center text-xs leading-relaxed text-on-surface-variant">
              {c.reelsEmpty}
            </div>
          )}
        </div>
      </section>

      {showRequestForm && (
        <div
          className="fixed inset-0 z-[90] bg-black/90 sm:flex sm:items-center sm:justify-center sm:bg-black/80 sm:px-4 sm:py-4 sm:backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reservation-modal-title"
          aria-describedby="reservation-modal-description"
        >
          <div
            ref={modalRef}
            className="relative mx-auto flex h-[100dvh] w-full flex-col overflow-hidden bg-[#030304] shadow-2xl shadow-black/75 sm:h-[calc(100dvh-2rem)] sm:max-h-[900px] sm:max-w-[min(940px,calc(100vw-2rem))] sm:rounded-[32px] sm:border sm:border-gold/20"
          >
            <button
              type="button"
              onClick={() => setShowRequestForm(false)}
              aria-label={ui.closeForm}
              className="absolute right-3 top-[max(.75rem,env(safe-area-inset-top))] z-20 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-[#07070A]/95 text-white shadow-lg transition hover:border-gold hover:text-gold focus:outline-none focus:ring-2 focus:ring-gold/50 sm:right-4 sm:top-4 sm:h-10 sm:w-10"
            >
              <X className="h-5 w-5" />
            </button>
            <ReservationForm
              venue={displayVenue}
              onSubmit={onSubmitRequest}
              onClose={() => setShowRequestForm(false)}
              initialPreferredTableId={selectedTable?.id}
              initialBusinessDate={businessDate}
              initialArrivalTime={mapArrivalTime}
              onScheduleChange={(nextBusinessDate, nextArrivalTime) => {
                setBusinessDate(nextBusinessDate);
                setMapArrivalTime(nextArrivalTime);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
