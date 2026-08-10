import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useI18n } from "../i18n";
import { getLocalizedContactChannels } from "../contactConfig";
import { usePublicSettings } from "../public/usePublicData";
import CountryPhoneField, {
  PHONE_COUNTRIES,
  buildInternationalPhone,
  isValidInternationalPhone,
} from "./CountryPhoneField";

const aboutCopy = {
  en: {
    eyebrow: "Established in Da Nang",
    titleA: "Concierge for",
    titleB: "curated premium venues",
    p1: "DuyT was created to make club table, private room and premium venue reservations clearer, more private and easier to coordinate from the first message to final confirmation.",
    p2: "Every request is checked directly with the selected venue. No random assignment, no confusing ticket flow, no unconfirmed promise.",
    architect: "A more precise way to plan your night",
    quote:
      "A good night starts before arrival: the right table, the right room, the right time and a clear confirmation.",
    founder: "DuyT",
    rule: "Principle",
    blocks: [
      [
        "Private handling",
        "Guest details are used only to coordinate the requested venue experience.",
      ],
      [
        "Direct confirmation",
        "Concierge checks availability, timing and special requests with the venue before confirmation.",
      ],
      [
        "Clear coordination",
        "Minimum spend, capacity and service notes are presented clearly before guests arrive.",
      ],
    ],
  },
  vi: {
    eyebrow: "Xây dựng tại Đà Nẵng",
    titleA: "Booking cho",
    titleB: "các địa điểm sôi động.",
    p1: "DuyT được xây dựng để việc đặt bàn club, phòng riêng và các trải nghiệm cao cấp trở nên rõ ràng, riêng tư và dễ điều phối hơn từ tin nhắn đầu tiên đến khi xác nhận cuối cùng.",
    p2: "Mỗi yêu cầu đặt chỗ đều được kiểm tra trực tiếp với địa điểm đã chọn. Không xếp chỗ ngẫu nhiên, không quy trình vé rối rắm, không hứa giữ chỗ khi chưa xác nhận.",
    architect: "Khách hàng hài lòng với cách tiếp cận của DuyT",
    quote:
      "Một buổi tối tốt bắt đầu trước khi khách đến: đúng bàn, đúng phòng, đúng thời gian và xác nhận rõ ràng.",
    founder: "DuyT",
    rule: "Nguyên tắc",
    blocks: [
      [
        "Xử lý riêng tư",
        "Thông tin khách chỉ được sử dụng để điều phối trải nghiệm tại địa điểm đã yêu cầu.",
      ],
      [
        "Xác nhận trực tiếp",
        "Concierge kiểm tra tình trạng chỗ, thời gian và yêu cầu đặc biệt với địa điểm trước khi xác nhận.",
      ],
      [
        "Điều phối rõ ràng",
        "Giá tối thiểu, sức chứa và lưu ý dịch vụ được trình bày rõ trước khi khách đến.",
      ],
    ],
  },
  ko: {
    eyebrow: "다낭에서 시작",
    titleA: "엄선된 프리미엄 장소를 위한",
    titleB: "전담 컨시어지",
    p1: "DuyT는 클럽 테이블, 프라이빗 룸, 프리미엄 장소 예약을 첫 문의부터 최종 확정까지 더 명확하고 프라이빗하게 조율하기 위해 만들어졌습니다.",
    p2: "모든 요청은 선택한 장소와 직접 확인됩니다. 무작위 배정이나 불확실한 약속이 없습니다.",
    architect: "밤을 더 정확하게 준비하는 방식",
    quote:
      "좋은 밤은 도착 전부터 시작됩니다. 알맞은 테이블, 룸, 시간, 그리고 명확한 확인입니다.",
    founder: "DuyT",
    rule: "원칙",
    blocks: [
      [
        "프라이빗 처리",
        "고객 정보는 요청한 장소 경험을 조율하는 목적으로만 사용됩니다.",
      ],
      ["직접 확인", "컨시어지가 가능 여부와 특별 요청을 현장과 확인합니다."],
      [
        "명확한 조율",
        "최소 이용 금액, 수용 인원, 서비스 안내를 명확히 전달합니다.",
      ],
    ],
  },
  zh: {
    eyebrow: "创建于岘港",
    titleA: "为精选高端场地提供",
    titleB: "专属礼宾服务",
    p1: "DuyT 让俱乐部桌位、私人包厢与高级场地预订从首次咨询到最终确认都更清晰、更私密、更容易协调。",
    p2: "每个请求都会与所选场地方直接确认，不随机分配，也不做未确认的承诺。",
    architect: "更精准地安排你的夜晚",
    quote:
      "好的夜晚从到达前开始：合适的桌位、合适的包厢、合适的时间与清楚的确认。",
    founder: "DuyT",
    rule: "原则",
    blocks: [
      ["私密处理", "客人信息仅用于协调所请求的场地体验。"],
      ["直接确认", "礼宾会与场地确认可用情况、时间和特殊需求。"],
      ["清晰协调", "最低消费、容纳人数与服务说明会清楚呈现。"],
    ],
  },
  th: {
    eyebrow: "สร้างขึ้นที่ดานัง",
    titleA: "คอนเซียร์จสำหรับ",
    titleB: "สถานที่พรีเมียมคัดสรร",
    p1: "DuyT ทำให้การจองโต๊ะคลับ ห้องส่วนตัว และสถานที่พรีเมียมชัดเจน เป็นส่วนตัว และประสานงานง่ายขึ้น",
    p2: "ทุกคำขอจะตรวจสอบกับสถานที่ที่เลือกโดยตรง ไม่มีการสุ่มที่นั่งหรือสัญญาที่ยังไม่ได้ยืนยัน",
    architect: "วิธีเตรียมค่ำคืนให้แม่นยำกว่าเดิม",
    quote:
      "ค่ำคืนที่ดีเริ่มก่อนมาถึง: โต๊ะที่ใช่ ห้องที่ใช่ เวลาเหมาะสม และการยืนยันชัดเจน",
    founder: "DuyT",
    rule: "หลักการ",
    blocks: [
      [
        "ดูแลข้อมูลเป็นส่วนตัว",
        "ข้อมูลแขกใช้เพื่อประสานประสบการณ์ที่ร้องขอเท่านั้น",
      ],
      ["ยืนยันโดยตรง", "คอนเซียร์จตรวจสอบเวลาว่างและคำขอพิเศษกับสถานที่"],
      ["ข้อมูลชัดเจน", "ขั้นต่ำ ความจุ และหมายเหตุบริการแสดงอย่างชัดเจน"],
    ],
  },
  ja: {
    eyebrow: "ダナンで設立",
    titleA: "厳選プレミアム会場のための",
    titleB: "専属コンシェルジュ",
    p1: "DuyTはクラブテーブル、個室、プレミアム会場の予約を、最初の相談から最終確定までより明確でプライベートに調整するために作られました。",
    p2: "すべてのリクエストは選択した会場へ直接確認します。ランダムな割り当てや未確認の約束はありません。",
    architect: "夜をより正確に準備する方法",
    quote:
      "良い夜は到着前から始まります。正しい席、正しい部屋、正しい時間、そして明確な確認。",
    founder: "DuyT",
    rule: "原則",
    blocks: [
      [
        "プライベートな対応",
        "ゲスト情報はリクエストされた会場体験の調整にのみ使用します。",
      ],
      ["直接確認", "空き状況、時間、特別リクエストを会場と確認します。"],
      [
        "明確な調整",
        "最低利用金額、収容人数、サービス注意事項を明確に提示します。",
      ],
    ],
  },
  hi: {
    eyebrow: "दा नांग में स्थापित",
    titleA: "चुने हुए प्रीमियम स्थानों के लिए",
    titleB: "निजी कंसीयर्ज सेवा",
    p1: "DuyT क्लब टेबल, निजी कक्ष और प्रीमियम स्थान की बुकिंग को पहली बातचीत से अंतिम पुष्टि तक स्पष्ट, निजी और आसानी से समन्वित बनाता है।",
    p2: "हर अनुरोध चुने गए स्थान से सीधे जाँचा जाता है। कोई मनमाना आवंटन या बिना पुष्टि का वादा नहीं किया जाता।",
    architect: "आपकी रात को अधिक सटीक तरीके से तैयार करना",
    quote:
      "अच्छी रात आगमन से पहले शुरू होती है: सही टेबल, सही कक्ष, सही समय और स्पष्ट पुष्टि।",
    founder: "DuyT",
    rule: "सिद्धांत",
    blocks: [
      [
        "निजी प्रबंधन",
        "अतिथि की जानकारी केवल अनुरोधित स्थान अनुभव के समन्वय के लिए उपयोग होती है।",
      ],
      [
        "सीधी पुष्टि",
        "कंसीयर्ज उपलब्धता, समय और विशेष अनुरोधों की स्थान से पुष्टि करता है।",
      ],
      [
        "स्पष्ट समन्वय",
        "न्यूनतम खर्च, क्षमता और सेवा संबंधी जानकारी स्पष्ट रूप से बताई जाती है।",
      ],
    ],
  },
} as const;

const contactCopy = {
  en: {
    eyebrow: "Direct connection",
    title: "Contact DuyT",
    intro:
      "Choose your preferred channel. DuyT replies privately and confirms venue requests directly.",
    channelsTitle: "Official direct channels",
    successTitle: "Information sent",
    successText:
      "DuyT will review and respond through your email or phone number.",
    another: "Send another request",
    formTitle: "Private contact form",
    name: "Your name",
    phone: "Phone number",
    message: "Request details",
    placeholder:
      "Venue name, table or room, birthday setup, guest count and arrival time...",
    button: "Send information",
  },
  vi: {
    eyebrow: "Kết nối trực tiếp",
    title: "Liên hệ DuyT",
    intro:
      "Chọn kênh bạn muốn sử dụng. DuyT sẽ phản hồi riêng tư và xác nhận trực tiếp yêu cầu đặt chỗ của bạn.",
    channelsTitle: "Kênh liên hệ chính thức",
    successTitle: "Đã gửi thông tin",
    successText:
      "DuyT sẽ kiểm tra và phản hồi qua email hoặc số điện thoại bạn để lại.",
    another: "Gửi yêu cầu khác",
    formTitle: "Biểu mẫu liên hệ riêng tư",
    name: "Tên của bạn",
    phone: "Số điện thoại",
    message: "Nội dung yêu cầu",
    placeholder:
      "Tên địa điểm, bàn hoặc phòng, setup sinh nhật, số khách và giờ đến...",
    button: "Gửi thông tin",
  },
  ko: {
    eyebrow: "직접 연결",
    title: "DuyT 문의",
    intro:
      "원하는 채널을 선택하세요. DuyT가 장소 요청을 비공개로 확인하고 직접 조율합니다.",
    channelsTitle: "공식 연락 채널",
    successTitle: "정보가 전송되었습니다",
    successText: "DuyT가 이메일 또는 전화번호로 답변드립니다.",
    another: "다른 요청 보내기",
    formTitle: "프라이빗 문의 양식",
    name: "이름",
    phone: "전화번호",
    message: "요청 내용",
    placeholder:
      "장소명, 테이블 또는 룸, 생일 세팅, 인원과 도착 시간...",
    button: "정보 보내기",
  },
  zh: {
    eyebrow: "直接联系",
    title: "联系 DuyT",
    intro: "选择偏好的渠道。DuyT 会私密回复并直接确认场地请求。",
    channelsTitle: "官方联系渠道",
    successTitle: "信息已发送",
    successText: "DuyT 会通过邮箱或电话回复。",
    another: "发送其他请求",
    formTitle: "私密联系表",
    name: "您的姓名",
    phone: "电话号码",
    message: "请求内容",
    placeholder: "场地名称、桌位或包厢、生日布置、人数与到达时间...",
    button: "发送信息",
  },
  th: {
    eyebrow: "ติดต่อโดยตรง",
    title: "ติดต่อ DuyT",
    intro:
      "เลือกช่องทางที่สะดวก DuyT จะตอบกลับเป็นส่วนตัวและยืนยันคำขอสถานที่โดยตรง",
    channelsTitle: "ช่องทางติดต่อทางการ",
    successTitle: "ส่งข้อมูลแล้ว",
    successText: "DuyT จะตรวจสอบและตอบกลับทางอีเมลหรือเบอร์โทรศัพท์",
    another: "ส่งคำขออื่น",
    formTitle: "แบบฟอร์มติดต่อส่วนตัว",
    name: "ชื่อของคุณ",
    phone: "เบอร์โทรศัพท์",
    message: "รายละเอียดคำขอ",
    placeholder:
      "ชื่อสถานที่ โต๊ะหรือห้อง เซ็ตอัพวันเกิด จำนวนแขกและเวลามาถึง...",
    button: "ส่งข้อมูล",
  },
  ja: {
    eyebrow: "直接連絡",
    title: "DuyTに連絡",
    intro:
      "ご希望のチャネルを選択してください。DuyTが会場リクエストを直接確認します。",
    channelsTitle: "公式連絡チャネル",
    successTitle: "情報を送信しました",
    successText: "DuyTがメールまたは電話番号へ返信します。",
    another: "別のリクエストを送る",
    formTitle: "プライベート問い合わせフォーム",
    name: "お名前",
    phone: "電話番号",
    message: "リクエスト内容",
    placeholder:
      "会場名、テーブルまたは個室、誕生日セットアップ、人数、到着時間...",
    button: "情報を送信",
  },
  hi: {
    eyebrow: "सीधा संपर्क",
    title: "DuyT से संपर्क",
    intro:
      "अपना पसंदीदा संपर्क माध्यम चुनें। DuyT निजी रूप से उत्तर देगा और स्थान संबंधी अनुरोध की सीधे पुष्टि करेगा।",
    channelsTitle: "आधिकारिक संपर्क चैनल",
    successTitle: "जानकारी भेज दी गई",
    successText: "DuyT आपके ईमेल या फ़ोन नंबर पर उत्तर देगा।",
    another: "दूसरा अनुरोध भेजें",
    formTitle: "निजी संपर्क फ़ॉर्म",
    name: "आपका नाम",
    phone: "फ़ोन नंबर",
    message: "अनुरोध विवरण",
    placeholder:
      "स्थान का नाम, टेबल या कक्ष, जन्मदिन की सजावट, अतिथि संख्या और आगमन समय...",
    button: "जानकारी भेजें",
  },
} as const;

const contactStatusCopy = {
  vi: {
    sending: "Đang gửi yêu cầu...",
    reference: "Mã yêu cầu",
    received: "Yêu cầu đã được lưu và chuyển tới trang quản trị. DuyT sẽ phản hồi qua số điện thoại hoặc email bạn đã cung cấp.",
    invalidPhone: "Số điện thoại không hợp lệ. Vui lòng kiểm tra quốc gia, mã vùng và số điện thoại.",
    errorTitle: "Chưa gửi được thông tin",
    fallbackError: "Không thể gửi yêu cầu lúc này. Vui lòng thử lại hoặc dùng một kênh liên hệ trực tiếp.",
  },
  en: {
    sending: "Sending request...",
    reference: "Request code",
    received: "Your request has been recorded and delivered to the admin inbox. DuyT will reply by phone or email.",
    invalidPhone: "The phone number is invalid. Check the country, calling code, and number.",
    errorTitle: "Information not sent",
    fallbackError: "The request could not be sent. Please try again or use a direct contact channel.",
  },
  ko: { sending: "요청 전송 중...", reference: "요청 코드", received: "요청이 관리자에게 전달되었습니다. 전화 또는 이메일로 답변드립니다.", invalidPhone: "전화번호가 올바르지 않습니다. 국가와 국가번호를 확인해 주세요.", errorTitle: "전송하지 못했습니다", fallbackError: "요청을 전송할 수 없습니다. 다시 시도하거나 직접 연락 채널을 이용해 주세요." },
  zh: { sending: "正在发送...", reference: "请求编号", received: "请求已保存并发送至管理后台。DuyT 将通过电话或邮箱回复。", invalidPhone: "电话号码格式不正确，请检查国家和区号。", errorTitle: "信息未发送", fallbackError: "暂时无法发送请求，请重试或使用直接联系渠道。" },
  th: { sending: "กำลังส่งคำขอ...", reference: "รหัสคำขอ", received: "ระบบบันทึกคำขอแล้ว DuyT จะตอบกลับทางโทรศัพท์หรืออีเมล", invalidPhone: "หมายเลขโทรศัพท์ไม่ถูกต้อง กรุณาตรวจสอบประเทศและรหัสโทรศัพท์", errorTitle: "ยังส่งข้อมูลไม่ได้", fallbackError: "ไม่สามารถส่งคำขอได้ในขณะนี้ โปรดลองอีกครั้งหรือใช้ช่องทางติดต่อโดยตรง" },
  ja: { sending: "送信中...", reference: "リクエスト番号", received: "リクエストは管理画面に保存されました。電話またはメールへ返信します。", invalidPhone: "電話番号が正しくありません。国と国番号を確認してください。", errorTitle: "送信できませんでした", fallbackError: "現在送信できません。再試行するか、直接連絡チャネルをご利用ください。" },
  hi: { sending: "अनुरोध भेजा जा रहा है...", reference: "अनुरोध कोड", received: "अनुरोध एडमिन इनबॉक्स में भेज दिया गया है। DuyT फ़ोन या ईमेल से जवाब देगा।", invalidPhone: "फ़ोन नंबर सही नहीं है। देश और calling code जाँचें।", errorTitle: "जानकारी नहीं भेजी गई", fallbackError: "अभी अनुरोध नहीं भेजा जा सका। दोबारा प्रयास करें या सीधे संपर्क माध्यम का उपयोग करें।" },
} as const;

export function AboutView() {
  const { locale } = useI18n();
  const c = aboutCopy[locale] || aboutCopy.vi;
  return (
    <div className="duyt-public-page text-left font-sans max-w-[1440px] mx-auto px-6 md:px-16 pt-6 space-y-20">
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <h2 className="duyt-editorial text-5xl md:text-7xl text-on-surface leading-[.95] break-words">
            {c.titleA}
            <br />
            <span className="text-gold">{c.titleB}</span>
          </h2>
          <p className="text-sm font-light text-on-surface-variant leading-relaxed max-w-xl">
            {c.p1}
          </p>
          <p className="text-sm font-light text-on-surface-variant leading-relaxed max-w-xl">
            {c.p2}
          </p>
        </div>
        <div className="lg:col-span-5">
          <div className="relative h-[400px] rounded-[24px] overflow-hidden border border-gold/15">
            <img
              src="/about.jpg"
              alt="DuyT Concierge"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-deep-black via-transparent to-transparent" />
          </div>
        </div>
      </section>
      <section className="py-20 text-center max-w-3xl mx-auto border-y border-gold/10">
        <h3 className="font-serif text-3xl md:text-4xl text-gold mb-8 tracking-wide break-words">
          {c.architect}
        </h3>
        <p className="font-serif text-2xl md:text-3xl text-on-surface leading-relaxed italic mb-8 break-words">
          “{c.quote}”
        </p>
        <div className="flex flex-col items-center gap-2">
          <div className="h-[1px] w-24 bg-gold mb-3" />
          <span className="text-xs sans-label tracking-widest text-on-surface-variant font-bold uppercase">
            {c.founder}
          </span>
        </div>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {c.blocks.map((block, idx) => (
          <div
            key={idx}
            className="glass-card p-8 rounded-[24px] border border-gold/10 hover:border-gold/30 transition-all duration-300"
          >
            <span className="text-xs sans-label text-gold font-bold tracking-widest block mb-4">
              {c.rule} {idx + 1}
            </span>
            <h4 className="text-lg font-serif text-on-surface mb-2 tracking-wide">
              {block[0]}
            </h4>
            <p className="text-xs text-on-surface-variant font-light leading-relaxed">
              {block[1]}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}

export function ContactView() {
  const { locale } = useI18n();
  const { siteSettings } = usePublicSettings();
  const contactChannels = getLocalizedContactChannels(siteSettings, locale);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountryIso, setPhoneCountryIso] = useState("VN");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [msg, setMsg] = useState("");
  const [website, setWebsite] = useState("");
  const [conReady, setConReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [referenceCode, setReferenceCode] = useState("");
  const c = contactCopy[locale] || contactCopy.vi;
  const statusCopy = contactStatusCopy[locale] || contactStatusCopy.vi;

  const resetForm = () => {
    setConReady(false);
    setSubmitError("");
    setReferenceCode("");
    setName("");
    setEmail("");
    setPhoneCountryIso("VN");
    setPhoneNumber("");
    setMsg("");
    setWebsite("");
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitError("");
    const phoneCountry = PHONE_COUNTRIES.find((country) => country.iso === phoneCountryIso) || PHONE_COUNTRIES[0];
    const phone = buildInternationalPhone(phoneCountry, phoneNumber);
    if (!isValidInternationalPhone(phone)) {
      setSubmitError(statusCopy.invalidPhone);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/contact-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message: msg, locale, website }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.ok) throw new Error(json?.error || statusCopy.fallbackError);
      setReferenceCode(String(json.data?.referenceCode || json.referenceCode || ""));
      setConReady(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : statusCopy.fallbackError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="duyt-public-page mx-auto max-w-[1440px] space-y-10 px-4 pt-4 text-left font-sans sm:space-y-16 sm:px-6 sm:pt-6 md:px-16">
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <span className="text-xs sans-label text-gold font-bold tracking-widest uppercase">{c.eyebrow}</span>
        <h2 className="duyt-editorial text-4xl leading-[.95] text-on-surface sm:text-5xl md:text-7xl">{c.title}</h2>
        <p className="text-sm font-light text-on-surface-variant leading-relaxed">{c.intro}</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 rounded-3xl border border-gold/10 bg-dark-navy/25 p-5 sm:mt-12 sm:p-8 lg:grid-cols-12 lg:gap-12 md:p-12">
        <div className="order-2 space-y-5 sm:space-y-8 lg:order-1 lg:col-span-6">
          <h3 className="text-xl font-serif text-gold tracking-wide">{c.channelsTitle}</h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {contactChannels.map((chan) => (
              <a key={chan.name} href={chan.href} target={chan.href.startsWith("http") ? "_blank" : undefined} rel={chan.href.startsWith("http") ? "noopener noreferrer" : undefined} className="flex min-h-[132px] flex-col items-center justify-center p-3 sm:min-h-0 sm:p-6 rounded-[24px] border border-gold/10 bg-deep-black/30 hover:bg-gold/5 hover:border-gold/30 transition-all duration-300 text-center group cursor-pointer">
                <img src={chan.icon} alt={chan.name} className="mb-2 h-10 w-10 rounded-full object-contain transition-transform duration-300 group-hover:scale-110" />
                <span className="text-xs sans-label text-on-surface font-bold tracking-widest uppercase">{chan.name}</span>
                <span className="text-[10px] text-on-surface-variant font-light mt-1.5 leading-snug">{chan.label}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-6">
          {conReady ? (
            <div className="bg-gold/5 border border-gold/15 rounded-[24px] p-8 text-center min-h-[390px] h-full flex flex-col justify-center items-center space-y-4" role="status" aria-live="polite">
              <span className="grid h-16 w-16 place-items-center rounded-full border border-gold/25 bg-gold/10"><CheckCircle2 className="w-9 h-9 text-gold" /></span>
              <h4 className="text-xl font-serif text-gold">{c.successTitle}</h4>
              <p className="text-xs text-on-surface-variant max-w-sm font-light leading-relaxed">{statusCopy.received}</p>
              {referenceCode ? (
                <div className="rounded-xl border border-gold/15 bg-deep-black/70 px-5 py-3">
                  <span className="block text-[9px] font-bold uppercase tracking-[.18em] text-on-surface-variant">{statusCopy.reference}</span>
                  <strong className="mt-1 block text-sm tracking-[.12em] text-on-surface">{referenceCode}</strong>
                </div>
              ) : null}
              <button type="button" onClick={resetForm} className="text-[10px] sans-label text-gold border-b border-gold/35 pb-0.5">{c.another}</button>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-5 text-left">
              <h3 className="text-xl font-serif text-on-surface tracking-wide mb-6">{c.formTitle}</h3>
              <div className="sr-only" aria-hidden="true">
                <label htmlFor="contact-website">Website</label>
                <input id="contact-website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>
              <div>
                <label htmlFor="contact-name" className="text-xs sans-label text-gold font-semibold tracking-widest uppercase block mb-1.5">{c.name}</label>
                <input id="contact-name" type="text" required minLength={2} maxLength={80} autoComplete="name" placeholder=" " value={name} onChange={(e) => setName(e.target.value)} disabled={submitting} className="w-full bg-deep-black border border-gold/10 px-3.5 py-3 rounded-xl focus:border-gold focus:outline-none text-sm transition-colors disabled:cursor-wait disabled:opacity-60" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-email" className="text-xs sans-label text-gold font-semibold tracking-widest uppercase block mb-1.5">Email</label>
                  <input id="contact-email" type="email" required maxLength={160} autoComplete="email" inputMode="email" placeholder="guest@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={submitting} className="w-full bg-deep-black border border-gold/10 px-3.5 py-3 rounded-xl focus:border-gold focus:outline-none text-sm transition-colors disabled:cursor-wait disabled:opacity-60" />
                </div>
                <div>
                  <label className="text-xs sans-label text-gold font-semibold tracking-widest uppercase block mb-1.5">{c.phone}</label>
                  <CountryPhoneField
                    countryIso={phoneCountryIso}
                    onCountryChange={(country) => setPhoneCountryIso(country.iso)}
                    nationalNumber={phoneNumber}
                    onNationalNumberChange={setPhoneNumber}
                    inputClassName="w-full min-w-0 bg-transparent px-3 py-3 text-sm text-on-surface outline-none"
                    disabled={submitting}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="contact-message" className="text-xs sans-label text-gold font-semibold tracking-widest uppercase block mb-1.5">{c.message}</label>
                <textarea id="contact-message" rows={4} maxLength={1500} placeholder={c.placeholder} value={msg} onChange={(e) => setMsg(e.target.value)} disabled={submitting} className="w-full bg-deep-black border border-gold/10 px-3.5 py-3 rounded-xl focus:border-gold focus:outline-none text-sm transition-colors text-on-surface font-light leading-relaxed disabled:cursor-wait disabled:opacity-60" />
                <p className="mt-1.5 text-right text-[9px] font-medium text-on-surface-variant/70">{msg.length}/1500</p>
              </div>
              {submitError ? (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-400/20 bg-red-500/10 px-3.5 py-3 text-xs leading-5 text-red-100" role="alert" aria-live="assertive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span><strong className="block font-bold">{statusCopy.errorTitle}</strong>{submitError}</span>
                </div>
              ) : null}
              <button type="submit" disabled={submitting || name.trim().length < 2 || !email.trim() || !phoneNumber.trim()} className="w-full min-h-12 py-4 bg-gold hover:bg-gold-light active:scale-98 text-dark-navy text-xs sans-label tracking-widest font-bold uppercase rounded-xl transition-all shadow-lg shadow-gold/10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-55">
                <span className="inline-flex items-center justify-center gap-2">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{submitting ? statusCopy.sending : c.button}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

