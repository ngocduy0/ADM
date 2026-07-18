import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useI18n } from "../i18n";
import { getContactChannels } from "../contactConfig";
import { usePublicSettings } from "../public/usePublicData";

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
    titleA: "Concierge for",
    titleB: "curated premium venues",
    p1: "DuyT는 클럽 테이블, 프라이빗 룸, 프리미엄 장소 예약을 더 명확하고 프라이빗하게 조율하기 위해 만들어졌습니다.",
    p2: "모든 요청은 선택한 장소와 직접 확인됩니다. 무작위 배정이나 불확실한 약속이 없습니다.",
    architect: "밤을 더 정확하게 준비하는 방식",
    quote:
      "좋은 밤은 도착 전부터 시작됩니다. 알맞은 테이블, 룸, 시간, 그리고 명확한 확인입니다.",
    founder: "DuyT",
    rule: "원칙",
    blocks: [
      [
        "프라이빗 처리",
        "고객 정보는 요청한 venue experience 조율에만 사용됩니다.",
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
    titleA: "Concierge for",
    titleB: "curated premium venues",
    p1: "DuyT 让俱乐部桌位、私人包厢与高级场地预订更清晰、更私密、更容易协调。",
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
    titleA: "Concierge for",
    titleB: "curated premium venues",
    p1: "DuyTはクラブテーブル、個室、プレミアム会場の予約を、より明確でプライベートに調整するために作られました。",
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
    titleA: "Concierge for",
    titleB: "curated premium venues",
    p1: "DuyT club table, private room और premium venue reservations को clear, private और easy coordination देने के लिए बनाया गया है।",
    p2: "हर request selected venue से directly check होती है। कोई random assignment या unconfirmed promise नहीं।",
    architect: "आपकी रात को अधिक सटीक तरीके से तैयार करना",
    quote:
      "अच्छी रात आगमन से पहले शुरू होती है: सही table, सही room, सही time और clear confirmation।",
    founder: "DuyT",
    rule: "सिद्धांत",
    blocks: [
      [
        "निजी प्रबंधन",
        "Guest details केवल requested venue experience coordinate करने के लिए use होते हैं।",
      ],
      [
        "सीधी पुष्टि",
        "कंसीयर्ज availability, time और special requests की venue से पुष्टि करता है।",
      ],
      [
        "स्पष्ट समन्वय",
        "Minimum spend, capacity और service notes स्पष्ट रूप से बताए जाते हैं।",
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
    message: "Nội dung yêu cầu",
    placeholder:
      "Tên địa điểm, bàn hoặc phòng, setup sinh nhật, số khách và giờ đến...",
    button: "Gửi thông tin",
  },
  ko: {
    eyebrow: "직접 연결",
    title: "DuyT 문의",
    intro:
      "원하는 채널을 선택하세요. DuyT가 venue request를 프라이빗하게 확인합니다.",
    channelsTitle: "공식 연락 채널",
    successTitle: "정보가 전송되었습니다",
    successText: "DuyT가 이메일 또는 전화번호로 답변드립니다.",
    another: "다른 요청 보내기",
    formTitle: "프라이빗 문의 양식",
    name: "이름",
    message: "요청 내용",
    placeholder:
      "Venue name, table or room, birthday setup, guest count and arrival time...",
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
    message: "リクエスト内容",
    placeholder:
      "Venue name, table or room, birthday setup, guest count and arrival time...",
    button: "情報を送信",
  },
  hi: {
    eyebrow: "सीधा संपर्क",
    title: "DuyT से संपर्क",
    intro:
      "अपनी पसंदीदा contact method चुनें। DuyT private reply देगा और venue request directly confirm करेगा।",
    channelsTitle: "आधिकारिक संपर्क चैनल",
    successTitle: "जानकारी भेज दी गई",
    successText: "DuyT आपके email या phone number पर reply देगा।",
    another: "दूसरा अनुरोध भेजें",
    formTitle: "निजी संपर्क फ़ॉर्म",
    name: "आपका नाम",
    message: "अनुरोध विवरण",
    placeholder:
      "Venue name, table or room, birthday setup, guest count and arrival time...",
    button: "जानकारी भेजें",
  },
} as const;

export function AboutView() {
  const { locale } = useI18n();
  const c = aboutCopy[locale] || aboutCopy.vi;
  return (
    <div className="text-left font-sans max-w-[1440px] mx-auto px-6 md:px-16 pt-6 space-y-20">
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <h2 className="text-4xl md:text-5xl font-serif text-on-surface leading-tight break-words">
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
          <div className="relative h-[400px] rounded-2xl overflow-hidden border border-gold/15">
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
            className="glass-card p-8 rounded-2xl border border-gold/10 hover:border-gold/30 transition-all duration-300"
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
  const contactChannels = getContactChannels(siteSettings);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [conReady, setConReady] = useState(false);
  const c = contactCopy[locale] || contactCopy.vi;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && msg) setConReady(true);
  };

  return (
    <div className="text-left font-sans max-w-[1440px] mx-auto px-6 md:px-16 pt-6 space-y-16">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs sans-label text-gold font-bold tracking-widest uppercase">
          {c.eyebrow}
        </span>
        <h2 className="text-4xl md:text-5xl font-serif text-on-surface tracking-wide">
          {c.title}
        </h2>
        <p className="text-sm font-light text-on-surface-variant leading-relaxed">
          {c.intro}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12 bg-dark-navy/25 rounded-3xl p-8 md:p-12 border border-gold/10">
        <div className="lg:col-span-6 space-y-8">
          <h3 className="text-xl font-serif text-gold tracking-wide">
            {c.channelsTitle}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {contactChannels.map((chan) => (
              <a
                key={chan.name}
                href={chan.href}
                target={chan.href.startsWith("mailto:") ? undefined : "_blank"}
                rel="no-referrer"
                className="flex flex-col items-center justify-center p-6 rounded-2xl border border-gold/10 bg-deep-black/30 hover:bg-gold/5 hover:border-gold/30 transition-all duration-300 text-center group cursor-pointer"
              >
                <img
                  src={chan.icon}
                  alt={chan.name}
                  className="mb-2 h-10 w-10 rounded-full object-contain transition-transform duration-300 group-hover:scale-110"
                />
                <span className="text-xs sans-label text-on-surface font-bold tracking-widest uppercase">
                  {chan.name}
                </span>
                <span className="text-[10px] text-on-surface-variant font-light mt-1.5 leading-snug">
                  {chan.label}
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6">
          {conReady ? (
            <div className="bg-gold/5 border border-gold/15 rounded-2xl p-8 text-center h-full flex flex-col justify-center items-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-gold" />
              <h4 className="text-xl font-serif text-gold">{c.successTitle}</h4>
              <p className="text-xs text-on-surface-variant max-w-sm font-light leading-relaxed">
                {c.successText}
              </p>
              <button
                onClick={() => setConReady(false)}
                className="text-[10px] sans-label text-gold border-b border-gold/35 pb-0.5"
              >
                {c.another}
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleContactSubmit}
              className="space-y-5 text-left"
            >
              <h3 className="text-xl font-serif text-on-surface tracking-wide mb-6">
                {c.formTitle}
              </h3>
              <div>
                <label className="text-xs sans-label text-gold font-semibold tracking-widest uppercase block mb-1.5">
                  {c.name}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Minh A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-deep-black border border-gold/10 px-3.5 py-3 rounded-xl focus:border-gold focus:outline-none text-sm transition-colors"
                />
              </div>
              <div>
                <label className="text-xs sans-label text-gold font-semibold tracking-widest uppercase block mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="guest@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-deep-black border border-gold/10 px-3.5 py-3 rounded-xl focus:border-gold focus:outline-none text-sm transition-colors"
                />
              </div>
              <div>
                <label className="text-xs sans-label text-gold font-semibold tracking-widest uppercase block mb-1.5">
                  {c.message}
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={c.placeholder}
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  className="w-full bg-deep-black border border-gold/10 px-3.5 py-3 rounded-xl focus:border-gold focus:outline-none text-sm transition-colors text-on-surface font-light leading-relaxed"
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-gold hover:bg-gold-light active:scale-98 text-dark-navy text-xs sans-label tracking-widest font-bold uppercase rounded-xl transition-all shadow-lg shadow-gold/10 cursor-pointer"
              >
                {c.button}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
