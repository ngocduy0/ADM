import type { Locale } from './i18n';
import type { PreferredTable, Venue, VenueMapElement, VenueTableZone, VenueTranslation } from './types';

const categoryLabels: Record<Locale, Record<string, string>> = {
  en: { Nightclub: 'Nightclub', Karaoke: 'Karaoke' },
  vi: { Nightclub: 'Club đêm', Karaoke: 'Karaoke' },
  ko: { Nightclub: '나이트클럽', Karaoke: '노래방' },
  zh: { Nightclub: '夜店', Karaoke: '卡拉OK' },
  th: { Nightclub: 'ไนต์คลับ', Karaoke: 'คาราโอเกะ' },
  ja: { Nightclub: 'ナイトクラブ', Karaoke: 'カラオケ' },
  hi: { Nightclub: 'नाइटक्लब', Karaoke: 'कराओके' },
};

const genericVenueCopy: Record<Exclude<Locale, 'vi'>, {
  location: string;
  nightclubShort: string;
  nightclubLong: string;
  karaokeShort: string;
  karaokeLong: string;
  menu: string;
  floorNightclub: string;
  floorKaraoke: string;
  zoneNightclub: string;
  zoneKaraoke: string;
  tableNightclub: string;
  tableKaraoke: string;
  reel: string;
}> = {
  en: {
    location: 'Da Nang',
    nightclubShort: 'A premium nightlife venue with curated tables, VIP seating, and direct concierge confirmation.',
    nightclubLong: 'DuyT Concierge helps you choose the right table area, confirms availability and minimum spend directly with the venue, and records arrival time, party size, and special setup requests before confirmation.',
    karaokeShort: 'Private karaoke rooms for groups, birthdays, celebrations, and gatherings that value comfort and privacy.',
    karaokeLong: 'DuyT Concierge recommends a room by party size, confirms the available time, capacity, minimum spend, and any birthday or private setup before your arrival.',
    menu: 'Menu and service packages may change by venue. Displayed prices exclude 10% VAT and a 5% service charge unless stated otherwise.',
    floorNightclub: 'Choose an area or tap a table to view minimum spend, capacity, and availability.',
    floorKaraoke: 'Choose a private room to view capacity, minimum spend, and availability.',
    zoneNightclub: 'A curated table area with its own capacity, minimum spend, and service conditions.',
    zoneKaraoke: 'A private room area with its own capacity, minimum spend, and service conditions.',
    tableNightclub: 'A curated table position. The concierge will confirm availability before holding the reservation.',
    tableKaraoke: 'A private room option. The concierge will confirm availability and setup before arrival.',
    reel: 'A highlight from this venue.',
  },
  ko: {
    location: '다낭',
    nightclubShort: '엄선된 테이블과 VIP 좌석, 컨시어지 직접 확인을 제공하는 프리미엄 나이트라이프 공간입니다.',
    nightclubLong: 'DuyT 컨시어지가 적합한 테이블 구역을 안내하고, 장소와 직접 가능 여부 및 최소 이용 금액을 확인하며, 도착 시간과 인원, 특별 세팅 요청을 확정 전에 기록합니다.',
    karaokeShort: '친구 모임, 생일, 축하 행사와 프라이버시가 필요한 모임을 위한 개별 노래방 룸입니다.',
    karaokeLong: 'DuyT 컨시어지가 인원에 맞는 룸을 추천하고, 이용 가능한 시간, 수용 인원, 최소 이용 금액, 생일 또는 특별 세팅을 도착 전에 확인합니다.',
    menu: '메뉴와 서비스 패키지는 장소에 따라 변경될 수 있습니다. 별도 안내가 없으면 표시 가격에 VAT 10%와 서비스 요금 5%가 포함되지 않습니다.',
    floorNightclub: '구역 또는 테이블을 눌러 최소 이용 금액, 수용 인원, 이용 가능 여부를 확인하세요.',
    floorKaraoke: '개별 룸을 선택해 수용 인원, 최소 이용 금액, 이용 가능 여부를 확인하세요.',
    zoneNightclub: '수용 인원과 최소 이용 금액, 서비스 조건이 별도로 적용되는 엄선된 테이블 구역입니다.',
    zoneKaraoke: '수용 인원과 최소 이용 금액, 서비스 조건이 별도로 적용되는 개별 룸 구역입니다.',
    tableNightclub: '엄선된 테이블 위치입니다. 예약 보류 전 컨시어지가 가능 여부를 확인합니다.',
    tableKaraoke: '개별 룸 옵션입니다. 도착 전 컨시어지가 가능 여부와 세팅을 확인합니다.',
    reel: '이 장소의 하이라이트입니다.',
  },
  zh: {
    location: '岘港',
    nightclubShort: '提供精选桌位、VIP 座位和礼宾直接确认的高端夜生活场地。',
    nightclubLong: 'DuyT 礼宾会协助选择合适的桌区，直接向场地确认空位与最低消费，并在确认前记录到达时间、人数和特殊布置需求。',
    karaokeShort: '适合朋友聚会、生日、庆祝活动及注重私密性的独立卡拉OK包厢。',
    karaokeLong: 'DuyT 礼宾会根据人数推荐包厢，并在到达前确认可用时间、容量、最低消费以及生日或特殊布置。',
    menu: '菜单和服务套餐可能因场地而调整。除非另有说明，显示价格不含 10% VAT 和 5% 服务费。',
    floorNightclub: '选择区域或点击桌位，查看最低消费、容量和可用状态。',
    floorKaraoke: '选择独立包厢，查看容量、最低消费和可用状态。',
    zoneNightclub: '精选桌区，拥有独立的容量、最低消费和服务条件。',
    zoneKaraoke: '独立包厢区域，拥有独立的容量、最低消费和服务条件。',
    tableNightclub: '精选桌位。礼宾会在保留前确认实际可用情况。',
    tableKaraoke: '独立包厢选项。礼宾会在到达前确认可用情况和布置。',
    reel: '该场地的精彩片段。',
  },
  th: {
    location: 'ดานัง',
    nightclubShort: 'สถานบันเทิงยามค่ำคืนระดับพรีเมียม พร้อมโต๊ะคัดสรร ที่นั่ง VIP และการยืนยันโดยคอนเซียร์จโดยตรง',
    nightclubLong: 'คอนเซียร์จ DuyT ช่วยเลือกโซนโต๊ะที่เหมาะสม ตรวจสอบโต๊ะว่างและขั้นต่ำกับสถานที่โดยตรง พร้อมบันทึกเวลามาถึง จำนวนแขก และคำขอพิเศษก่อนยืนยัน',
    karaokeShort: 'ห้องคาราโอเกะส่วนตัวสำหรับกลุ่มเพื่อน วันเกิด งานฉลอง และการพบปะที่ต้องการความเป็นส่วนตัว',
    karaokeLong: 'คอนเซียร์จ DuyT แนะนำห้องตามจำนวนแขก และตรวจสอบเวลาว่าง ความจุ ขั้นต่ำ รวมถึงการจัดวันเกิดหรือเซ็ตอัพพิเศษก่อนมาถึง',
    menu: 'เมนูและแพ็กเกจบริการอาจเปลี่ยนตามสถานที่ ราคาที่แสดงยังไม่รวม VAT 10% และค่าบริการ 5% เว้นแต่จะระบุไว้เป็นอย่างอื่น',
    floorNightclub: 'เลือกโซนหรือแตะโต๊ะเพื่อดูขั้นต่ำ ความจุ และสถานะว่าง',
    floorKaraoke: 'เลือกห้องส่วนตัวเพื่อดูความจุ ขั้นต่ำ และสถานะว่าง',
    zoneNightclub: 'โซนโต๊ะคัดสรรที่มีความจุ ขั้นต่ำ และเงื่อนไขบริการเฉพาะ',
    zoneKaraoke: 'โซนห้องส่วนตัวที่มีความจุ ขั้นต่ำ และเงื่อนไขบริการเฉพาะ',
    tableNightclub: 'ตำแหน่งโต๊ะคัดสรร คอนเซียร์จจะตรวจสอบสถานะก่อนดำเนินการจอง',
    tableKaraoke: 'ตัวเลือกห้องส่วนตัว คอนเซียร์จจะตรวจสอบสถานะและเซ็ตอัพก่อนมาถึง',
    reel: 'ไฮไลต์จากสถานที่นี้',
  },
  ja: {
    location: 'ダナン',
    nightclubShort: '厳選テーブル、VIP席、コンシェルジュによる直接確認を提供する上質なナイトライフ会場です。',
    nightclubLong: 'DuyTコンシェルジュが最適なテーブルエリアをご案内し、会場へ空き状況とミニマムスペンドを直接確認します。到着時間、人数、特別なセットアップ希望も確定前に記録します。',
    karaokeShort: '友人グループ、誕生日、祝いの席、プライバシーを重視する集まり向けの個室カラオケです。',
    karaokeLong: 'DuyTコンシェルジュが人数に合う部屋を提案し、利用可能時間、定員、ミニマムスペンド、誕生日や特別セットアップを来店前に確認します。',
    menu: 'メニューとサービスパッケージは会場により変更される場合があります。特記がない限り、表示価格にVAT 10%とサービス料5%は含まれません。',
    floorNightclub: 'エリアまたはテーブルを選択して、ミニマムスペンド、定員、空き状況を確認してください。',
    floorKaraoke: '個室を選択して、定員、ミニマムスペンド、空き状況を確認してください。',
    zoneNightclub: '定員、ミニマムスペンド、サービス条件が設定された厳選テーブルエリアです。',
    zoneKaraoke: '定員、ミニマムスペンド、サービス条件が設定された個室エリアです。',
    tableNightclub: '厳選されたテーブル位置です。確保前にコンシェルジュが空き状況を確認します。',
    tableKaraoke: '個室オプションです。来店前にコンシェルジュが空き状況とセットアップを確認します。',
    reel: 'この会場のハイライトです。',
  },
  hi: {
    location: 'दा नांग',
    nightclubShort: 'चुनी हुई टेबल, VIP seating और concierge की सीधी पुष्टि वाला premium nightlife venue।',
    nightclubLong: 'DuyT Concierge सही table area चुनने में मदद करता है, venue से availability और minimum spend की सीधी पुष्टि करता है, और confirmation से पहले arrival time, guest count तथा special setup requests दर्ज करता है।',
    karaokeShort: 'दोस्तों, जन्मदिन, celebrations और privacy चाहने वाले समूहों के लिए private karaoke rooms।',
    karaokeLong: 'DuyT Concierge guest count के अनुसार room सुझाता है और arrival से पहले available time, capacity, minimum spend तथा birthday या special setup की पुष्टि करता है।',
    menu: 'Menu और service packages venue के अनुसार बदल सकते हैं। अलग जानकारी न होने पर displayed prices में 10% VAT और 5% service charge शामिल नहीं है।',
    floorNightclub: 'Minimum spend, capacity और availability देखने के लिए area या table चुनें।',
    floorKaraoke: 'Capacity, minimum spend और availability देखने के लिए private room चुनें।',
    zoneNightclub: 'अपनी capacity, minimum spend और service conditions वाला curated table area।',
    zoneKaraoke: 'अपनी capacity, minimum spend और service conditions वाला private room area।',
    tableNightclub: 'Curated table position। Reservation hold करने से पहले concierge availability confirm करेगा।',
    tableKaraoke: 'Private room option। Arrival से पहले concierge availability और setup confirm करेगा।',
    reel: 'इस venue की एक highlight।',
  },
};

const termMap: Record<Exclude<Locale, 'vi'>, Record<string, string>> = {
  en: {
    'Đà Nẵng': 'Da Nang',
    'Hòa Cường Bắc, Hải Châu, Đà Nẵng': 'Hoa Cuong Bac, Hai Chau, Da Nang',
    'Gần DJ / Sân khấu': 'DJ / Stage Front', 'Sofa VIP': 'VIP Sofa', 'Khu trung tâm': 'Main Floor',
    'Phòng VIP': 'VIP Room', 'Phòng nhóm': 'Group Room', 'Phòng lớn': 'Large Room', 'Phòng riêng': 'Private Room',
    'Sân khấu': 'Stage', 'Quầy bar': 'Bar', 'Quầy đồ uống': 'Drinks Bar', 'Lối vào': 'Entrance',
    'Lối đi': 'Walkway', 'Lối đi chính': 'Main Walkway', 'Lễ tân': 'Reception', 'Màn hình': 'Screen',
  },
  ko: {
    'Đà Nẵng': '다낭', 'Hòa Cường Bắc, Hải Châu, Đà Nẵng': '다낭 하이쩌우 호아끄엉박',
    'Gần DJ / Sân khấu': 'DJ / 무대 앞', 'Sofa VIP': 'VIP 소파', 'Khu trung tâm': '메인 플로어',
    'Phòng VIP': 'VIP 룸', 'Phòng nhóm': '그룹 룸', 'Phòng lớn': '대형 룸', 'Phòng riêng': '프라이빗 룸',
    'Sân khấu': '무대', 'Quầy bar': '바', 'Quầy đồ uống': '드링크 바', 'Lối vào': '입구',
    'Lối đi': '통로', 'Lối đi chính': '메인 통로', 'Lễ tân': '리셉션', 'Màn hình': '스크린',
  },
  zh: {
    'Đà Nẵng': '岘港', 'Hòa Cường Bắc, Hải Châu, Đà Nẵng': '岘港海洲郡和强北坊',
    'Gần DJ / Sân khấu': 'DJ / 舞台前区', 'Sofa VIP': 'VIP 沙发区', 'Khu trung tâm': '中央区域',
    'Phòng VIP': 'VIP 包厢', 'Phòng nhóm': '团体包厢', 'Phòng lớn': '大型包厢', 'Phòng riêng': '私人包厢',
    'Sân khấu': '舞台', 'Quầy bar': '吧台', 'Quầy đồ uống': '饮品吧', 'Lối vào': '入口',
    'Lối đi': '通道', 'Lối đi chính': '主通道', 'Lễ tân': '接待处', 'Màn hình': '屏幕',
  },
  th: {
    'Đà Nẵng': 'ดานัง', 'Hòa Cường Bắc, Hải Châu, Đà Nẵng': 'ฮหว่ากื่องบั๊ก ไห่เจิว ดานัง',
    'Gần DJ / Sân khấu': 'หน้า DJ / เวที', 'Sofa VIP': 'โซฟา VIP', 'Khu trung tâm': 'โซนกลาง',
    'Phòng VIP': 'ห้อง VIP', 'Phòng nhóm': 'ห้องกลุ่ม', 'Phòng lớn': 'ห้องใหญ่', 'Phòng riêng': 'ห้องส่วนตัว',
    'Sân khấu': 'เวที', 'Quầy bar': 'บาร์', 'Quầy đồ uống': 'บาร์เครื่องดื่ม', 'Lối vào': 'ทางเข้า',
    'Lối đi': 'ทางเดิน', 'Lối đi chính': 'ทางเดินหลัก', 'Lễ tân': 'แผนกต้อนรับ', 'Màn hình': 'จอ',
  },
  ja: {
    'Đà Nẵng': 'ダナン', 'Hòa Cường Bắc, Hải Châu, Đà Nẵng': 'ダナン・ハイチャウ区ホアクオンバック',
    'Gần DJ / Sân khấu': 'DJ / ステージ前', 'Sofa VIP': 'VIPソファ', 'Khu trung tâm': 'メインフロア',
    'Phòng VIP': 'VIPルーム', 'Phòng nhóm': 'グループルーム', 'Phòng lớn': '大型ルーム', 'Phòng riêng': '個室',
    'Sân khấu': 'ステージ', 'Quầy bar': 'バー', 'Quầy đồ uống': 'ドリンクバー', 'Lối vào': '入口',
    'Lối đi': '通路', 'Lối đi chính': 'メイン通路', 'Lễ tân': '受付', 'Màn hình': 'スクリーン',
  },
  hi: {
    'Đà Nẵng': 'दा नांग', 'Hòa Cường Bắc, Hải Châu, Đà Nẵng': 'होआ कुओंग बाक, हाई चाऊ, दा नांग',
    'Gần DJ / Sân khấu': 'DJ / Stage Front', 'Sofa VIP': 'VIP Sofa', 'Khu trung tâm': 'Main Floor',
    'Phòng VIP': 'VIP Room', 'Phòng nhóm': 'Group Room', 'Phòng lớn': 'Large Room', 'Phòng riêng': 'Private Room',
    'Sân khấu': 'Stage', 'Quầy bar': 'Bar', 'Quầy đồ uống': 'Drinks Bar', 'Lối vào': 'Entrance',
    'Lối đi': 'Walkway', 'Lối đi chính': 'Main Walkway', 'Lễ tân': 'Reception', 'Màn hình': 'Screen',
  },
};

const exactEnglish: Record<string, string> = {
  'Nightlife năng lượng cao với bàn VIP, khu sofa riêng và concierge kiểm tra trực tiếp trước khi xác nhận.': 'High-energy nightlife with VIP tables, private sofa areas, and direct availability checks by the concierge before confirmation.',
  'ADM Club là lựa chọn nightlife năng lượng cao tại Đà Nẵng. DuyT Concierge hỗ trợ kiểm tra khu bàn, minimum spend, số khách, giờ đến và các yêu cầu setup riêng trước khi xác nhận để khách có trải nghiệm rõ ràng, riêng tư và mượt mà hơn.': 'ADM Club is a high-energy nightlife destination in Da Nang. DuyT Concierge checks table areas, minimum spend, party size, arrival time, and special setup requests before confirmation for a clearer, more private, and seamless experience.',
  'Không gian karaoke riêng tư cho nhóm bạn, gia đình, sinh nhật và các buổi gặp mặt cần phòng riêng.': 'Private karaoke rooms for groups of friends, families, birthdays, and gatherings that need their own space.',
  'Karaoke Lasvegas 1 phù hợp cho nhóm khách cần phòng riêng, âm thanh tốt và quy trình xác nhận rõ ràng. DuyT Concierge hỗ trợ chọn phòng theo số lượng khách, kiểm tra khung giờ trống, ghi chú setup sinh nhật hoặc yêu cầu riêng trước khi khách đến.': 'Karaoke Lasvegas 1 is ideal for groups seeking a private room, quality sound, and a clear confirmation process. DuyT Concierge recommends rooms by party size, checks available time slots, and records birthday setups or special requests before arrival.',
  'Karaoke phòng riêng cho nhóm đông, tiệc sinh nhật và các buổi gặp mặt cần sự riêng tư.': 'Private karaoke rooms for larger groups, birthday parties, and gatherings that value privacy.',
  'Karaoke Lasvegas 1 hỗ trợ nhiều cấu hình phòng cho nhóm nhỏ đến nhóm đông. DuyT Concierge kiểm tra phòng trống, thời gian đến, sức chứa, minimum spend và các ghi chú setup trước khi xác nhận.': 'Karaoke Lasvegas 1 offers several room configurations for small and large groups. DuyT Concierge checks room availability, arrival time, capacity, minimum spend, and setup notes before confirmation.',
  'Bottle sets, champagne, premium spirits, mixers, birthday table setup. Giá chưa bao gồm 10% VAT và 5% phí phục vụ.': 'Bottle sets, champagne, premium spirits, mixers, and birthday table setup. Prices exclude 10% VAT and a 5% service charge.',
  'Set đồ uống, trái cây, bia, rượu, snack, setup sinh nhật. Giá chưa bao gồm 10% VAT và 5% phí phục vụ.': 'Drink sets, fruit, beer, spirits, snacks, and birthday setup. Prices exclude 10% VAT and a 5% service charge.',
  'Set karaoke, đồ uống, trái cây, beer tower, rượu, snack và setup sinh nhật. Giá chưa bao gồm 10% VAT và 5% phí phục vụ.': 'Karaoke sets, drinks, fruit, beer towers, spirits, snacks, and birthday setup. Prices exclude 10% VAT and a 5% service charge.',
  'Chọn khu hoặc chạm vào bàn để xem minimum spend, sức chứa và trạng thái yêu cầu.': 'Choose an area or tap a table to view minimum spend, capacity, and availability.',
  'Chọn phòng karaoke để xem sức chứa, minimum spend và trạng thái yêu cầu.': 'Choose a karaoke room to view capacity, minimum spend, and availability.',
  'Chọn phòng theo số lượng khách, sức chứa và mức chi tiêu tối thiểu.': 'Choose a room by party size, capacity, and minimum spend.',
  'Khu nổi bật nhất, phù hợp nhóm muốn không khí mạnh và vị trí trung tâm.': 'The most prominent area, suited to groups seeking high energy and a central position.',
  'Khu sofa riêng tư hơn, phù hợp nhóm sinh nhật hoặc khách muốn ngồi thoải mái.': 'A more private sofa area for birthdays or guests who prefer comfortable seating.',
  'Gần quầy bar, dễ gọi đồ và di chuyển.': 'Close to the bar for easy ordering and movement.',
  'Bàn trung tâm phù hợp nhóm muốn gần sân khấu và ánh sáng.': 'Central tables for groups who want to be near the stage and lighting.',
  'Phòng riêng cho nhóm cần không gian thoải mái và setup đẹp.': 'A private room for groups that want comfort and a polished setup.',
  'Phòng phù hợp nhóm bạn, gia đình hoặc buổi gặp mặt.': 'A room suited to friends, families, or private gatherings.',
  'Phòng cho nhóm đông, tiệc sinh nhật hoặc liên hoan.': 'A room for larger groups, birthday parties, or celebrations.',
  'Phòng riêng tư cho nhóm vừa và nhỏ.': 'A private room for small and medium-sized groups.',
};

const englishReplacements: Array<[RegExp, string]> = [
  [/Chi tiêu tối thiểu/gi, 'Minimum spend'], [/Sức chứa/gi, 'Capacity'], [/Tối đa/gi, 'Up to'],
  [/Có thể yêu cầu/gi, 'Available on request'], [/Cần xác nhận/gi, 'Confirmation required'],
  [/Đã giữ/gi, 'Reserved'], [/Đã có lịch/gi, 'Already booked'], [/Khu gần bar/gi, 'Area near the bar'],
  [/phù hợp nhóm nhỏ/gi, 'suitable for small groups'], [/dễ gọi đồ và di chuyển/gi, 'easy for ordering and moving around'],
  [/thuận tiện di chuyển/gi, 'convenient for moving around'], [/dễ quan sát sân khấu/gi, 'with a clear view of the stage'],
  [/Sofa VIP/gi, 'VIP sofa'], [/phù hợp nhóm/gi, 'suitable for groups'], [/riêng tư hơn/gi, 'with more privacy'],
  [/sinh nhật/gi, 'birthday'], [/phòng riêng/gi, 'private room'], [/nhóm bạn/gi, 'groups of friends'],
  [/gia đình/gi, 'families'], [/khung giờ/gi, 'time slot'], [/giữ chỗ/gi, 'hold the reservation'],
  [/xác nhận/gi, 'confirmation'], [/trước khi/gi, 'before'], [/khách đến/gi, 'arrival'],
  [/Bàn trung tâm/gi, 'Central table'], [/gần âm thanh và ánh sáng/gi, 'close to the sound and lighting'],
  [/các khu vực chính/gi, 'the main areas'],
];

function looksVietnamese(value?: string) {
  const input = value || '';
  if (/[ÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/.test(input)) return true;

  // Database content is sometimes entered without Vietnamese accents. Detect
  // common multi-word patterns as well so another locale never receives a
  // Vietnamese paragraph merely because its diacritics were omitted.
  const normalized = ` ${input.toLowerCase().replace(/[^a-z0-9]+/g, ' ')} `;
  const markers = [
    ' dia diem ', ' dat cho ', ' dat ban ', ' khach hang ', ' so khach ',
    ' chi tieu toi thieu ', ' suc chua ', ' phong rieng ', ' ban vip ',
    ' khu vuc ', ' san khau ', ' quay bar ', ' thoi gian ', ' khung gio ',
    ' yeu cau ', ' xac nhan ', ' truoc khi ', ' phu hop ', ' trai nghiem ',
    ' sinh nhat ', ' lien he ', ' dich vu ', ' gia hien thi ',
  ];
  return markers.some((marker) => normalized.includes(marker));
}

function translateKnownTerm(value: string | undefined, locale: Exclude<Locale, 'vi'>) {
  const input = (value || '').trim();
  if (!input) return '';
  const exact = termMap[locale][input];
  if (exact) return exact;
  if (locale === 'en') {
    if (exactEnglish[input]) return exactEnglish[input];
    return englishReplacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), input);
  }
  return input;
}

function translatedField(value: string | undefined, locale: Exclude<Locale, 'vi'>, fallback: string) {
  const translated = translateKnownTerm(value, locale);
  return !translated || looksVietnamese(translated) ? fallback : translated;
}

function translatedLabel(value: string | undefined, locale: Exclude<Locale, 'vi'>, fallback: string) {
  return translatedField(value, locale, fallback);
}

function safeExplicit(value: string | undefined, locale: Locale) {
  if (!value) return undefined;
  if (locale !== 'vi' && looksVietnamese(value)) return undefined;
  return value;
}

function applyExplicitTranslation(venue: Venue, locale: Locale, translation?: VenueTranslation): Venue {
  if (!translation) return venue;
  return {
    ...venue,
    name: safeExplicit(translation.name, locale) || venue.name,
    location: safeExplicit(translation.location, locale) || venue.location,
    shortDescription: safeExplicit(translation.shortDescription, locale) || venue.shortDescription,
    longDescription: safeExplicit(translation.longDescription, locale) || venue.longDescription,
    menuUrl: safeExplicit(translation.menuUrl, locale) ?? venue.menuUrl,
    floorPlanTheme: venue.floorPlanTheme
      ? { ...venue.floorPlanTheme, helperText: safeExplicit(translation.floorPlanHelperText, locale) || venue.floorPlanTheme.helperText }
      : venue.floorPlanTheme,
    tableZones: venue.tableZones?.map((zone) => {
      const item = translation.zones?.[zone.id];
      return {
        ...zone,
        name: safeExplicit(item?.name, locale) || zone.name,
        label: safeExplicit(item?.label, locale) || zone.label,
        description: safeExplicit(item?.description, locale) || zone.description,
      };
    }),
    preferredTables: venue.preferredTables.map((table) => {
      const item = translation.tables?.[table.id];
      return {
        ...table,
        name: safeExplicit(item?.name, locale) || table.name,
        area: safeExplicit(item?.area, locale) || table.area,
        description: safeExplicit(item?.description, locale) || table.description,
      };
    }),
    floorPlanElements: venue.floorPlanElements?.map((element) => ({
      ...element,
      label: safeExplicit(translation.elements?.[element.id]?.label, locale) || element.label,
    })),
    reels: venue.reels?.map((reel) => {
      const item = translation.reels?.[reel.id];
      return {
        ...reel,
        title: safeExplicit(item?.title, locale) || reel.title,
        tag: safeExplicit(item?.tag, locale) || reel.tag,
        caption: safeExplicit(item?.caption, locale) || reel.caption,
      };
    }),
  };
}

function localizeZone(zone: VenueTableZone, venue: Venue, locale: Exclude<Locale, 'vi'>, index: number): VenueTableZone {
  const copy = genericVenueCopy[locale];
  const genericLabel = venue.category === 'Karaoke'
    ? `${translateKnownTerm('Phòng riêng', locale)} ${index + 1}`
    : `${locale === 'en' ? 'Table Area' : locale === 'ko' ? '테이블 구역' : locale === 'zh' ? '桌位区域' : locale === 'th' ? 'โซนโต๊ะ' : locale === 'ja' ? 'テーブルエリア' : 'Table Area'} ${index + 1}`;
  const label = translatedLabel(zone.label || zone.name, locale, genericLabel);
  return {
    ...zone,
    name: translatedLabel(zone.name, locale, label),
    label,
    description: translatedField(zone.description, locale, venue.category === 'Karaoke' ? copy.zoneKaraoke : copy.zoneNightclub),
  };
}

function localizeTable(table: PreferredTable, venue: Venue, zones: VenueTableZone[], locale: Exclude<Locale, 'vi'>): PreferredTable {
  const copy = genericVenueCopy[locale];
  const zone = zones.find((item) => item.id === table.zoneId);
  return {
    ...table,
    area: translatedLabel(table.area, locale, zone?.label || (venue.category === 'Karaoke' ? translateKnownTerm('Phòng riêng', locale) : 'VIP Area')),
    description: translatedField(table.description, locale, venue.category === 'Karaoke' ? copy.tableKaraoke : copy.tableNightclub),
  };
}

function localizeElement(element: VenueMapElement, locale: Exclude<Locale, 'vi'>): VenueMapElement {
  const typeFallback: Record<string, string> = {
    STAGE: translateKnownTerm('Sân khấu', locale), BAR: translateKnownTerm('Quầy bar', locale),
    DOOR: translateKnownTerm('Lối vào', locale), WALKWAY: translateKnownTerm('Lối đi', locale),
    SCREEN: translateKnownTerm('Màn hình', locale), VIP_ROOM: translateKnownTerm('Phòng riêng', locale),
    KTV: translateKnownTerm('Phòng VIP', locale), CUSTOM: translateKnownTerm('Lễ tân', locale), DJ: 'DJ',
  };
  return { ...element, label: translatedLabel(element.label, locale, typeFallback[element.type] || element.type) };
}

function buildLocalizedVenue(venue: Venue, locale: Exclude<Locale, 'vi'>): Venue {
  const copy = genericVenueCopy[locale];
  const shortFallback = venue.category === 'Karaoke' ? copy.karaokeShort : copy.nightclubShort;
  const longFallback = venue.category === 'Karaoke' ? copy.karaokeLong : copy.nightclubLong;
  const zones = (venue.tableZones || []).map((zone, index) => localizeZone(zone, venue, locale, index));
  const localized: Venue = {
    ...venue,
    location: translatedField(venue.location, locale, copy.location),
    shortDescription: translatedField(venue.shortDescription, locale, shortFallback),
    longDescription: translatedField(venue.longDescription, locale, longFallback),
    menuUrl: translatedField(venue.menuUrl, locale, copy.menu),
    floorPlanTheme: venue.floorPlanTheme
      ? { ...venue.floorPlanTheme, helperText: translatedField(venue.floorPlanTheme.helperText, locale, venue.category === 'Karaoke' ? copy.floorKaraoke : copy.floorNightclub) }
      : venue.floorPlanTheme,
    tableZones: zones,
    preferredTables: venue.preferredTables.map((table) => localizeTable(table, venue, zones, locale)),
    floorPlanElements: venue.floorPlanElements?.map((element) => localizeElement(element, locale)),
    reels: venue.reels?.map((reel) => ({
      ...reel,
      title: translatedField(reel.title, locale, venue.name),
      tag: translatedField(reel.tag, locale, venue.name.split(' ')[0] || 'DuyT'),
      caption: translatedField(reel.caption, locale, copy.reel),
    })),
  };
  return applyExplicitTranslation(localized, locale, venue.translations?.[locale]);
}

export function localizeCategory(category: string, locale: Locale) {
  return categoryLabels[locale]?.[category] || categoryLabels.en[category] || category;
}

export function localizeVenue(venue: Venue, locale: Locale): Venue {
  // Keep category as the canonical data value (Nightclub/Karaoke). Business
  // rules and floor-plan selection depend on it; UI labels are localized with
  // localizeCategory() at render time.
  return locale === 'vi' ? venue : buildLocalizedVenue(venue, locale);
}

export function localizeVenueList(venues: Venue[], locale: Locale) {
  return venues.map((venue) => localizeVenue(venue, locale));
}

/** Localizes arbitrary database text and guarantees that Vietnamese fallback text is not leaked into another locale. */
export function localizeDatabaseText(value: string | undefined, locale: Locale, fallback: string) {
  if (locale === 'vi') return value || fallback;
  return translatedField(value, locale, fallback);
}

export function formatVnd(value: number, locale: Locale = 'vi') {
  const localeMap: Record<Locale, string> = {
    vi: 'vi-VN', en: 'en-US', ko: 'ko-KR', zh: 'zh-CN', th: 'th-TH', ja: 'ja-JP', hi: 'hi-IN',
  };
  return new Intl.NumberFormat(localeMap[locale], { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);
}
