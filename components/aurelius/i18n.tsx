'use client';

import React, { createContext, useContext } from 'react';

export type Locale = 'en' | 'ko' | 'zh' | 'vi' | 'th' | 'ja' | 'hi';

export const LANGUAGES: { code: Locale; label: string; native: string }[] = [
  { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ko', label: 'Korean', native: '한국어' },
  { code: 'zh', label: 'Chinese', native: '中文' },
  { code: 'th', label: 'Thai', native: 'ภาษาไทย' },
  { code: 'ja', label: 'Japanese', native: '日本語' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
];

const vi = {
  home: 'Trang chủ', venues: 'Địa điểm', about: 'Giới thiệu', contact: 'Liên hệ', howItWorks: 'Cách hoạt động', faq: 'Câu hỏi', dayPass: 'Vé ngày', questionsMessage: 'Cần hỏi? Nhắn DuyT', language: 'Tiếng Việt',
  heroEyebrow: 'Quản lý trải nghiệm cao cấp', heroTitle1: 'Concierge cá nhân', heroTitle2: 'cho', heroTitle3: 'những trải nghiệm thượng hạng', heroSubtitle: 'Khám phá địa điểm trong hệ thống, chọn bàn mong muốn và để DuyT xử lý phần còn lại.',
  pickSpot: 'Chọn chỗ', browseVenues: 'Xem địa điểm', messageJay: 'Nhắn DuyT', threeVenues: 'Các địa điểm chọn lọc, DuyT xử lý.', pickWhere: 'Chọn địa điểm và trải nghiệm phù hợp với buổi tối của bạn.',
  seamless: 'Quy trình mượt mà', stepsTitle: 'Ba bước đặt chỗ.', step1Title: 'Chọn khu / bàn', step1Text: 'Xem danh sách địa điểm chọn lọc và chọn khu vực hoặc bàn phù hợp với nhu cầu.', step2Title: 'Xác nhận khả năng phục vụ', step2Text: 'Concierge kiểm tra trực tiếp với địa điểm rồi phản hồi chính thức.', step3Title: 'Giữ chỗ bằng cọc', step3Text: 'Hoàn tất giữ chỗ bằng phương thức thanh toán được gửi riêng trong cuộc trò chuyện.',
  featured: 'Địa điểm nổi bật', premiumDestinations: 'Địa điểm cao cấp được chọn lọc', browseAll: 'Xem tất cả', discover: 'Khám phá', promise: 'Cam kết concierge', whyChoose: 'Vì sao khách chọn DuyT Concierge',
  requestReservation: 'Yêu cầu đặt chỗ', name: 'Tên', phone: 'Số điện thoại', guests: 'Số khách', date: 'Ngày', arrivalTime: 'Giờ đến', notes: 'Ghi chú', submitRequest: 'Gửi yêu cầu', bookingCharge: 'Cọc giữ chỗ',
  adminLogin: 'Đăng nhập Admin', email: 'Email', password: 'Mật khẩu', signIn: 'Đăng nhập', loginHelp: 'Admin tự nhập /login để vào trang quản trị.', logout: 'Đăng xuất',
  dashboard: 'Tổng quan', bookings: 'Đặt chỗ', guestsNav: 'Khách', payments: 'Thanh toán', reviews: 'Đánh giá', messages: 'Tin nhắn', analytics: 'Phân tích', settings: 'Cài đặt', newBooking: 'Tạo đặt chỗ', totalBookings: 'Tổng đặt chỗ', revenue: 'Doanh thu', pending: 'Chờ xử lý', cancellations: 'Đã hủy', status: 'Trạng thái', actions: 'Thao tác', venue: 'Địa điểm', guest: 'Khách', party: 'Số khách', search: 'Tìm kiếm', syncActive: 'Supabase đang đồng bộ', localMode: 'Chế độ dữ liệu cục bộ', save: 'Lưu', cancel: 'Hủy', confirmed: 'Đã xác nhận', completed: 'Hoàn tất', cancelled: 'Đã hủy', contacted: 'Đã liên hệ', newStatus: 'Mới', noShow: 'Không đến',
  filterCategory: 'Lọc danh mục', legal: 'Pháp lý', privacy: 'Bảo mật', terms: 'Điều khoản', membership: 'Thành viên',
  rightsReserved: 'Đã đăng ký bản quyền',
  contactPanelTitle: 'Hỏi DuyT — thường phản hồi trong vòng 1 giờ', close: 'Đóng', openContacts: 'Mở lựa chọn liên hệ',
};

const dictionaries: Record<Locale, Record<keyof typeof vi, string>> = {
  vi,
  en: {
    home: 'Home', venues: 'Venues', about: 'About', contact: 'Contact', howItWorks: 'How it works', faq: 'Questions', dayPass: 'Day pass', questionsMessage: 'Need help? Message DuyT', language: 'English',
    heroEyebrow: 'Premium experience management', heroTitle1: 'Personal concierge', heroTitle2: 'for', heroTitle3: 'elevated experiences', heroSubtitle: 'Explore venues in the system, choose the table you want, and let DuyT handle the rest.',
    pickSpot: 'Choose a spot', browseVenues: 'View venues', messageJay: 'Message DuyT', threeVenues: 'Curated venues, handled by DuyT.', pickWhere: 'Choose the venue and experience that fit your night.',
    seamless: 'Smooth process', stepsTitle: 'Three booking steps.', step1Title: 'Choose area / table', step1Text: 'View curated venues and choose an area or table that fits your needs.', step2Title: 'Confirm service availability', step2Text: 'The concierge checks directly with the venue and sends the official response.', step3Title: 'Hold with deposit', step3Text: 'Complete the hold with the payment method shared privately in chat.',
    featured: 'Featured venues', premiumDestinations: 'Curated premium venues', browseAll: 'View all', discover: 'Discover', promise: 'Concierge commitment', whyChoose: 'Why guests choose DuyT Concierge',
    requestReservation: 'Reservation request', name: 'Name', phone: 'Phone number', guests: 'Guests', date: 'Date', arrivalTime: 'Arrival time', notes: 'Notes', submitRequest: 'Send request', bookingCharge: 'Hold deposit',
    adminLogin: 'Admin login', email: 'Email', password: 'Password', signIn: 'Sign in', loginHelp: 'Admins can enter /login to access the dashboard.', logout: 'Logout',
    dashboard: 'Overview', bookings: 'Bookings', guestsNav: 'Guests', payments: 'Payments', reviews: 'Reviews', messages: 'Messages', analytics: 'Analytics', settings: 'Settings', newBooking: 'Create booking', totalBookings: 'Total bookings', revenue: 'Revenue', pending: 'Pending', cancellations: 'Cancelled', status: 'Status', actions: 'Actions', venue: 'Venue', guest: 'Guest', party: 'Guests', search: 'Search', syncActive: 'Supabase syncing', localMode: 'Local data mode', save: 'Save', cancel: 'Cancel', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled', contacted: 'Contacted', newStatus: 'New', noShow: 'No-show',
    filterCategory: 'Filter category', legal: 'Legal', privacy: 'Privacy', terms: 'Terms', membership: 'Membership',
    rightsReserved: 'All rights reserved',
    contactPanelTitle: 'Ask DuyT — usually replies within 1 hour', close: 'Close', openContacts: 'Open contact options',
  },
  ko: {
    home: '홈', venues: '장소', about: '소개', contact: '문의', howItWorks: '이용 방법', faq: '질문', dayPass: '데이 패스', questionsMessage: '문의가 필요하신가요? DuyT에 메시지', language: '한국어',
    heroEyebrow: '프리미엄 경험 관리', heroTitle1: '개인 컨시어지', heroTitle2: '를 위한', heroTitle3: '프리미엄 경험', heroSubtitle: '시스템의 장소를 둘러보고 원하는 테이블을 선택하면 DuyT가 나머지를 처리합니다.',
    pickSpot: '자리 선택', browseVenues: '장소 보기', messageJay: 'DuyT에 메시지', threeVenues: '엄선된 장소를 DuyT가 처리합니다.', pickWhere: '당신의 밤에 맞는 장소와 경험을 선택하세요.',
    seamless: '부드러운 진행', stepsTitle: '예약은 세 단계입니다.', step1Title: '구역 / 테이블 선택', step1Text: '엄선된 장소 목록을 보고 필요에 맞는 구역 또는 테이블을 선택하세요.', step2Title: '서비스 가능 여부 확인', step2Text: '컨시어지가 장소와 직접 확인한 뒤 공식 답변을 드립니다.', step3Title: '보증금으로 자리 확보', step3Text: '채팅에서 별도로 안내되는 결제 방식으로 자리를 확보하세요.',
    featured: '추천 장소', premiumDestinations: '엄선된 프리미엄 장소', browseAll: '전체 보기', discover: '둘러보기', promise: '컨시어지 약속', whyChoose: '고객이 DuyT Concierge를 선택하는 이유',
    requestReservation: '예약 요청', name: '이름', phone: '전화번호', guests: '인원', date: '날짜', arrivalTime: '도착 시간', notes: '메모', submitRequest: '요청 보내기', bookingCharge: '자리 보증금',
    adminLogin: '관리자 로그인', email: '이메일', password: '비밀번호', signIn: '로그인', loginHelp: '관리자는 /login을 입력해 대시보드에 접속합니다.', logout: '로그아웃',
    dashboard: '개요', bookings: '예약', guestsNav: '고객', payments: '결제', reviews: '평가', messages: '메시지', analytics: '분석', settings: '설정', newBooking: '예약 만들기', totalBookings: '총 예약', revenue: '매출', pending: '처리 대기', cancellations: '취소됨', status: '상태', actions: '작업', venue: '장소', guest: '고객', party: '인원', search: '검색', syncActive: 'Supabase 동기화 중', localMode: '로컬 데이터 모드', save: '저장', cancel: '취소', confirmed: '확정됨', completed: '완료', cancelled: '취소됨', contacted: '연락 완료', newStatus: '신규', noShow: '노쇼',
    filterCategory: '카테고리 필터', legal: '법적 고지', privacy: '보안', terms: '약관', membership: '멤버십',
    rightsReserved: '모든 권리 보유',
    contactPanelTitle: 'DuyT에 문의 — 보통 1시간 이내 답변', close: '닫기', openContacts: '연락 옵션 열기',
  },
  zh: {
    home: '首页', venues: '地点', about: '介绍', contact: '联系', howItWorks: '如何运作', faq: '问题', dayPass: '日票', questionsMessage: '需要咨询？联系 DuyT', language: '中文',
    heroEyebrow: '高级体验管理', heroTitle1: '私人礼宾', heroTitle2: '为', heroTitle3: '高端体验服务', heroSubtitle: '浏览系统内的地点，选择想要的桌位，其余交给 DuyT 处理。',
    pickSpot: '选择位置', browseVenues: '查看地点', messageJay: '联系 DuyT', threeVenues: '精选地点，由 DuyT 处理。', pickWhere: '选择适合你夜晚的地点和体验。',
    seamless: '顺畅流程', stepsTitle: '三步完成预订。', step1Title: '选择区域 / 桌位', step1Text: '查看精选地点列表，并选择符合需求的区域或桌位。', step2Title: '确认接待能力', step2Text: '礼宾会直接与地点确认，然后给出正式回复。', step3Title: '用订金保留位置', step3Text: '通过聊天中单独发送的付款方式完成保留。',
    featured: '热门地点', premiumDestinations: '精选高端地点', browseAll: '查看全部', discover: '探索', promise: '礼宾承诺', whyChoose: '客人为什么选择 DuyT Concierge',
    requestReservation: '预订请求', name: '姓名', phone: '电话号码', guests: '人数', date: '日期', arrivalTime: '到达时间', notes: '备注', submitRequest: '发送请求', bookingCharge: '保留订金',
    adminLogin: '管理员登录', email: '邮箱', password: '密码', signIn: '登录', loginHelp: '管理员输入 /login 进入管理后台。', logout: '退出',
    dashboard: '总览', bookings: '预订', guestsNav: '客人', payments: '付款', reviews: '评价', messages: '消息', analytics: '分析', settings: '设置', newBooking: '创建预订', totalBookings: '总预订', revenue: '收入', pending: '待处理', cancellations: '已取消', status: '状态', actions: '操作', venue: '地点', guest: '客人', party: '人数', search: '搜索', syncActive: 'Supabase 正在同步', localMode: '本地数据模式', save: '保存', cancel: '取消', confirmed: '已确认', completed: '已完成', cancelled: '已取消', contacted: '已联系', newStatus: '新', noShow: '未到场',
    filterCategory: '筛选分类', legal: '法律', privacy: '安全', terms: '条款', membership: '会员',
    rightsReserved: '版权所有',
    contactPanelTitle: '咨询 DuyT — 通常 1 小时内回复', close: '关闭', openContacts: '打开联系方式',
  },
  th: {
    home: 'หน้าแรก', venues: 'สถานที่', about: 'เกี่ยวกับ', contact: 'ติดต่อ', howItWorks: 'วิธีใช้งาน', faq: 'คำถาม', dayPass: 'บัตรรายวัน', questionsMessage: 'ต้องการถาม? ส่งข้อความถึง DuyT', language: 'ภาษาไทย',
    heroEyebrow: 'การจัดการประสบการณ์ระดับพรีเมียม', heroTitle1: 'คอนเซียร์จส่วนตัว', heroTitle2: 'สำหรับ', heroTitle3: 'ประสบการณ์ระดับสูง', heroSubtitle: 'สำรวจสถานที่ในระบบ เลือกโต๊ะที่ต้องการ แล้วให้ DuyT จัดการส่วนที่เหลือ',
    pickSpot: 'เลือกที่นั่ง', browseVenues: 'ดูสถานที่', messageJay: 'ส่งข้อความถึง DuyT', threeVenues: 'สถานที่คัดสรร ให้ DuyT ดูแล', pickWhere: 'เลือกสถานที่และประสบการณ์ที่เหมาะกับค่ำคืนนี้ของคุณ',
    seamless: 'ขั้นตอนราบรื่น', stepsTitle: 'จองง่ายในสามขั้นตอน', step1Title: 'เลือกโซน / โต๊ะ', step1Text: 'ดูรายชื่อสถานที่คัดสรรและเลือกโซนหรือโต๊ะที่เหมาะกับความต้องการ', step2Title: 'ยืนยันความพร้อมให้บริการ', step2Text: 'คอนเซียร์จตรวจสอบกับสถานที่โดยตรงแล้วตอบกลับอย่างเป็นทางการ', step3Title: 'ล็อกที่ด้วยมัดจำ', step3Text: 'ยืนยันการจองด้วยช่องทางชำระเงินที่ส่งให้ในแชทส่วนตัว',
    featured: 'สถานที่แนะนำ', premiumDestinations: 'สถานที่พรีเมียมคัดสรร', browseAll: 'ดูทั้งหมด', discover: 'สำรวจ', promise: 'คำมั่นของคอนเซียร์จ', whyChoose: 'เหตุผลที่ลูกค้าเลือก DuyT Concierge',
    requestReservation: 'ขอจอง', name: 'ชื่อ', phone: 'เบอร์โทรศัพท์', guests: 'จำนวนแขก', date: 'วันที่', arrivalTime: 'เวลาถึง', notes: 'หมายเหตุ', submitRequest: 'ส่งคำขอ', bookingCharge: 'มัดจำจองที่',
    adminLogin: 'เข้าสู่ระบบแอดมิน', email: 'อีเมล', password: 'รหัสผ่าน', signIn: 'เข้าสู่ระบบ', loginHelp: 'แอดมินพิมพ์ /login เพื่อเข้าสู่หน้าจัดการ', logout: 'ออกจากระบบ',
    dashboard: 'ภาพรวม', bookings: 'การจอง', guestsNav: 'ลูกค้า', payments: 'การชำระเงิน', reviews: 'รีวิว', messages: 'ข้อความ', analytics: 'วิเคราะห์', settings: 'ตั้งค่า', newBooking: 'สร้างการจอง', totalBookings: 'การจองทั้งหมด', revenue: 'รายได้', pending: 'รอดำเนินการ', cancellations: 'ยกเลิกแล้ว', status: 'สถานะ', actions: 'จัดการ', venue: 'สถานที่', guest: 'ลูกค้า', party: 'จำนวนแขก', search: 'ค้นหา', syncActive: 'Supabase กำลังซิงก์', localMode: 'โหมดข้อมูลภายในเครื่อง', save: 'บันทึก', cancel: 'ยกเลิก', confirmed: 'ยืนยันแล้ว', completed: 'เสร็จสิ้น', cancelled: 'ยกเลิกแล้ว', contacted: 'ติดต่อแล้ว', newStatus: 'ใหม่', noShow: 'ไม่มา',
    filterCategory: 'กรองหมวดหมู่', legal: 'กฎหมาย', privacy: 'ความปลอดภัย', terms: 'เงื่อนไข', membership: 'สมาชิก',
    rightsReserved: 'สงวนลิขสิทธิ์',
    contactPanelTitle: 'ถาม DuyT — ปกติตอบกลับภายใน 1 ชั่วโมง', close: 'ปิด', openContacts: 'เปิดช่องทางติดต่อ',
  },
  ja: {
    home: 'ホーム', venues: '場所', about: '紹介', contact: '連絡先', howItWorks: '利用方法', faq: '質問', dayPass: 'デイパス', questionsMessage: '質問がありますか？DuyTへ連絡', language: '日本語',
    heroEyebrow: '上質な体験管理', heroTitle1: '専属コンシェルジュ', heroTitle2: 'で', heroTitle3: '特別な体験を', heroSubtitle: 'システム内の場所を確認し、希望のテーブルを選ぶだけ。残りは DuyT が対応します。',
    pickSpot: '席を選ぶ', browseVenues: '場所を見る', messageJay: 'DuyTへ連絡', threeVenues: '厳選された場所を DuyT が対応します。', pickWhere: 'その夜に合う場所と体験を選んでください。',
    seamless: 'スムーズな流れ', stepsTitle: '予約は3ステップ。', step1Title: 'エリア / テーブルを選択', step1Text: '厳選された場所の一覧から、希望に合うエリアまたはテーブルを選びます。', step2Title: '対応可否を確認', step2Text: 'コンシェルジュが場所へ直接確認し、正式に返信します。', step3Title: 'デポジットで席を確保', step3Text: 'チャットで個別に案内される支払い方法で席を確保します。',
    featured: '注目の場所', premiumDestinations: '厳選プレミアムスポット', browseAll: 'すべて見る', discover: '探す', promise: 'コンシェルジュの約束', whyChoose: 'ゲストが DuyT Concierge を選ぶ理由',
    requestReservation: '予約リクエスト', name: '名前', phone: '電話番号', guests: '人数', date: '日付', arrivalTime: '到着時間', notes: 'メモ', submitRequest: 'リクエスト送信', bookingCharge: '席確保デポジット',
    adminLogin: '管理者ログイン', email: 'メール', password: 'パスワード', signIn: 'ログイン', loginHelp: '管理者は /login を入力して管理画面に入ります。', logout: 'ログアウト',
    dashboard: '概要', bookings: '予約', guestsNav: 'ゲスト', payments: '支払い', reviews: '評価', messages: 'メッセージ', analytics: '分析', settings: '設定', newBooking: '予約作成', totalBookings: '総予約', revenue: '売上', pending: '処理待ち', cancellations: 'キャンセル済み', status: '状態', actions: '操作', venue: '場所', guest: 'ゲスト', party: '人数', search: '検索', syncActive: 'Supabase 同期中', localMode: 'ローカルデータモード', save: '保存', cancel: 'キャンセル', confirmed: '確認済み', completed: '完了', cancelled: 'キャンセル済み', contacted: '連絡済み', newStatus: '新規', noShow: '来店なし',
    filterCategory: 'カテゴリで絞り込み', legal: '法務', privacy: 'セキュリティ', terms: '規約', membership: '会員',
    rightsReserved: '著作権所有',
    contactPanelTitle: 'DuyTに相談 — 通常1時間以内に返信', close: '閉じる', openContacts: '連絡オプションを開く',
  },
  hi: {
    home: 'होम', venues: 'स्थान', about: 'परिचय', contact: 'संपर्क', howItWorks: 'कैसे काम करता है', faq: 'प्रश्न', dayPass: 'डे पास', questionsMessage: 'सवाल है? DuyT को संदेश भेजें', language: 'हिन्दी',
    heroEyebrow: 'प्रीमियम अनुभव प्रबंधन', heroTitle1: 'व्यक्तिगत कंसीयर्ज', heroTitle2: 'के लिए', heroTitle3: 'बेहतरीन अनुभव', heroSubtitle: 'सिस्टम में स्थान देखें, अपनी पसंद की टेबल चुनें और बाकी काम DuyT संभालेगा।',
    pickSpot: 'जगह चुनें', browseVenues: 'स्थान देखें', messageJay: 'DuyT को संदेश', threeVenues: 'चुने हुए स्थान, DuyT द्वारा संभाले गए।', pickWhere: 'अपनी शाम के लिए उपयुक्त स्थान और अनुभव चुनें।',
    seamless: 'आसान प्रक्रिया', stepsTitle: 'तीन चरणों में बुकिंग।', step1Title: 'क्षेत्र / टेबल चुनें', step1Text: 'चुने हुए स्थानों की सूची देखें और अपनी जरूरत के अनुसार क्षेत्र या टेबल चुनें।', step2Title: 'सेवा उपलब्धता की पुष्टि', step2Text: 'कंसीयर्ज सीधे स्थान से जांच कर आधिकारिक उत्तर देता है।', step3Title: 'डिपॉजिट से जगह सुरक्षित करें', step3Text: 'चैट में अलग से भेजी गई भुगतान विधि से जगह सुरक्षित करें।',
    featured: 'प्रमुख स्थान', premiumDestinations: 'चुने हुए प्रीमियम स्थान', browseAll: 'सभी देखें', discover: 'खोजें', promise: 'कंसीयर्ज प्रतिबद्धता', whyChoose: 'मेहमान DuyT Concierge क्यों चुनते हैं',
    requestReservation: 'बुकिंग अनुरोध', name: 'नाम', phone: 'फोन नंबर', guests: 'मेहमान', date: 'तारीख', arrivalTime: 'आगमन समय', notes: 'नोट्स', submitRequest: 'अनुरोध भेजें', bookingCharge: 'जगह सुरक्षित करने का डिपॉजिट',
    adminLogin: 'एडमिन लॉगिन', email: 'ईमेल', password: 'पासवर्ड', signIn: 'लॉगिन', loginHelp: 'एडमिन /login दर्ज करके प्रबंधन पेज खोल सकता है।', logout: 'लॉगआउट',
    dashboard: 'अवलोकन', bookings: 'बुकिंग', guestsNav: 'ग्राहक', payments: 'भुगतान', reviews: 'रेटिंग', messages: 'संदेश', analytics: 'विश्लेषण', settings: 'सेटिंग्स', newBooking: 'बुकिंग बनाएं', totalBookings: 'कुल बुकिंग', revenue: 'राजस्व', pending: 'लंबित', cancellations: 'रद्द', status: 'स्थिति', actions: 'कार्य', venue: 'स्थान', guest: 'ग्राहक', party: 'मेहमानों की संख्या', search: 'खोज', syncActive: 'Supabase सिंक हो रहा है', localMode: 'स्थानीय डेटा मोड', save: 'सेव', cancel: 'रद्द', confirmed: 'पुष्टि हुई', completed: 'पूर्ण', cancelled: 'रद्द', contacted: 'संपर्क किया', newStatus: 'नया', noShow: 'नहीं आया',
    filterCategory: 'श्रेणी फ़िल्टर', legal: 'कानूनी', privacy: 'सुरक्षा', terms: 'शर्तें', membership: 'सदस्यता',
    rightsReserved: 'सर्वाधिकार सुरक्षित',
    contactPanelTitle: 'DuyT से पूछें — आमतौर पर 1 घंटे में जवाब', close: 'बंद करें', openContacts: 'संपर्क विकल्प खोलें',
  },
};

const I18nContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void; t: (key: string) => string }>({
  locale: 'vi',
  setLocale: () => {},
  t: (key: string) => vi[key as keyof typeof vi] || key,
});

export function I18nProvider({ locale, setLocale, children }: { locale: Locale; setLocale: (locale: Locale) => void; children: React.ReactNode }) {
  const t = (key: string) => dictionaries[locale]?.[key as keyof typeof vi] || vi[key as keyof typeof vi] || key;
  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export function languageName(locale: Locale) {
  return LANGUAGES.find((language) => language.code === locale)?.native || 'Tiếng Việt';
}

export function isLocale(value: string | null): value is Locale {
  return value === 'en' || value === 'ko' || value === 'zh' || value === 'vi' || value === 'th' || value === 'ja' || value === 'hi';
}
