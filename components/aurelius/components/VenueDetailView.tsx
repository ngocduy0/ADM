import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  Eye,
  FileText,
  MapPin,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { PreferredTable, ReservationRequest, Venue } from "../types";
import { useI18n, Locale } from "../i18n";
import { formatVnd, localizeVenue } from "../localize";
import ReservationForm from "./ReservationForm";
import FloorPlanSelector from "./FloorPlanSelector";

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
  return (
    rawUrl.startsWith("blob:") ||
    rawUrl.startsWith("data:video") ||
    /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(rawUrl)
  );
}

function getReelPermalink(rawUrl = "") {
  if (!rawUrl) return "https://www.instagram.com/duytadm/";
  try {
    const url = new URL(rawUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    if (url.hostname.includes("instagram.com") && parts[0] && parts[1])
      return `https://www.instagram.com/${parts[0]}/${parts[1]}/`;
  } catch {
    return rawUrl;
  }
  return rawUrl;
}

function getVenueDetailReels(venue: Venue) {
  return (venue.reels || [])
    .filter((reel) => reel.isActive !== false)
    .sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999))
    .map((reel) => ({
      id: reel.id,
      title: reel.title || venue.name,
      tag: reel.tag || venue.name.split(" ")[0] || "DuyT",
      caption: reel.caption || venue.shortDescription,
      posterUrl: reel.posterUrl || venue.image || FALLBACK_IMAGE,
      videoUrl: reel.videoUrl || "",
      instagramUrl: getReelPermalink(
        reel.instagramUrl ||
          reel.videoUrl ||
          "https://www.instagram.com/duytadm/",
      ),
    }));
}

function DetailReelCard({
  reel,
}: {
  reel: ReturnType<typeof getVenueDetailReels>[number];
}) {
  return (
    <a
      href={reel.instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block aspect-[9/16] overflow-hidden rounded-2xl border border-gold/10 bg-deep-black shadow-xl transition hover:-translate-y-1 hover:border-gold/35"
    >
      {reel.videoUrl && isDirectVideoUrl(reel.videoUrl) ? (
        <video
          src={reel.videoUrl}
          poster={reel.posterUrl}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          className="h-full w-full object-cover"
        />
      ) : (
        <img
          src={reel.posterUrl}
          alt={reel.title}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      )}
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
  const displayVenue = localizeVenue(venue, locale);
  const c = detailCopy[locale]?.back ? detailCopy[locale] : detailCopy.vi;
  const safeImages = useMemo(() => safeImageList(venue), [venue]);
  const venueReels = useMemo(() => getVenueDetailReels(venue), [venue]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [pausedUntil, setPausedUntil] = useState(0);
  const [selectedTableId, setSelectedTableId] = useState(
    venue.preferredTables[0]?.id || "",
  );
  const [showRequestForm, setShowRequestForm] = useState(false);


  useEffect(() => {
    if (safeImages.length <= 1) return;
    const timer = window.setInterval(() => {
      if (Date.now() < pausedUntil) return;
      setActiveImageIndex((current) => (current + 1) % safeImages.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [safeImages.length, pausedUntil]);

  const activeImage =
    safeImages[Math.min(activeImageIndex, safeImages.length - 1)] ||
    FALLBACK_IMAGE;
  const selectedTable =
    venue.preferredTables.find((table) => table.id === selectedTableId) ||
    venue.preferredTables[0];

  const openReservationForm = (table?: PreferredTable) => {
    if (table) setSelectedTableId(table.id);
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
    <div className="mx-auto max-w-[1440px] px-6 pt-6 text-left font-sans md:px-16">
      <button
        onClick={onBack}
        className="mb-8 flex cursor-pointer items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold transition hover:text-gold-light"
      >
        <ChevronLeft className="h-4 w-4" /> {c.back}
      </button>

      <section className="mb-16 grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <div className="relative h-[480px] overflow-hidden rounded-2xl border border-gold/10 bg-deep-black">
            <img
              src={activeImage}
              alt={displayVenue.name}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-all duration-700"
            />
            <div className="absolute left-4 top-4 rounded-full border border-gold/20 bg-deep-black/60 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-gold backdrop-blur-md">
              {displayVenue.category}
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
            <h1 className="mb-4 text-4xl leading-tight text-on-surface md:text-5xl">
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
                {new Intl.NumberFormat("vi-VN").format(
                  venue.viewCount || 0,
                )}{" "}
                lượt xem
              </span>
            </div>
            <p className="mb-6 text-sm font-light leading-relaxed text-on-surface-variant">
              {displayVenue.longDescription}
            </p>
            <div className="mb-8 grid gap-3 rounded-2xl border border-gold/10 bg-dark-navy/35 p-5">
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
            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-gold py-4 text-xs font-bold uppercase tracking-widest text-dark-navy shadow-xl shadow-gold/15 transition-all hover:bg-gold-light"
          >
            {t("requestReservation")} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="mb-20 border-t border-gold/10 pt-16">
        <FloorPlanSelector
          venue={venue}
          selectedTableId={selectedTable?.id}
          onSelectTable={(table) => setSelectedTableId(table.id)}
          onRequestTable={(table) => openReservationForm(table)}
        />
      </section>

      <section className="mb-20 grid grid-cols-1 gap-12 border-t border-gold/10 pt-16 md:grid-cols-2">
        <div className="glass-card rounded-2xl border border-gold/10 p-8">
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
              <FileText className="h-4 w-4" /> Xem menu PDF
            </a>
          )}
          <div className="space-y-4 text-sm leading-relaxed">
            {(venue.menuUrl || "")
              .split(",")
              .filter(Boolean)
              .map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-4"
                >
                  <span className="font-light text-red-500">
                    {item.trim().split("(")[0]}
                  </span>
                  {item.includes("(") && (
                    <span className="font-mono font-bold text-gold">
                      {item.match(/\(([^)]+)\)/)?.[1] || "Market"}
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gold/10 bg-dark-navy/35 p-5">
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
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-gold/20 bg-deep-black/60 px-6 text-center text-xs leading-relaxed text-on-surface-variant">
              {c.reelsEmpty}
            </div>
          )}
        </div>
      </section>

      {showRequestForm && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/75 p-0 backdrop-blur-xl sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-h-[96dvh] w-full max-w-2xl overflow-y-auto rounded-t-[32px] border border-gold/20 bg-[#101217] shadow-2xl shadow-black/60 sm:rounded-[32px]">
            <button
              type="button"
              onClick={() => setShowRequestForm(false)}
              aria-label="Đóng form đặt bàn"
              className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/45 text-white backdrop-blur transition hover:border-gold hover:text-gold"
            >
              <X className="h-5 w-5" />
            </button>
            <ReservationForm
              venue={venue}
              onSubmit={onSubmitRequest}
              onClose={() => setShowRequestForm(false)}
              initialPreferredTableId={selectedTable?.id}
            />
          </div>
        </div>
      )}
    </div>
  );
}
