import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_VENUES } from '../components/aurelius/data';
import { getLocalizedContactChannels } from '../components/aurelius/contactConfig';
import { localizeCategory, localizeVenue } from '../components/aurelius/localize';
import { publicPath, venuePublicSlug } from '../components/aurelius/public/routes';

test('English venue view localizes database-backed Vietnamese fields and nested map content', () => {
  const source = INITIAL_VENUES[0];
  const venue = localizeVenue(source, 'en');

  assert.equal(venue.location, 'Hoa Cuong Bac, Hai Chau, Da Nang');
  assert.match(venue.shortDescription, /High-energy nightlife/);
  assert.match(venue.longDescription, /DuyT Concierge checks/);
  assert.equal(venue.tableZones?.[0]?.label, 'DJ / Stage Front');
  assert.equal(venue.floorPlanElements?.[1]?.label, 'Stage');
  assert.match(venue.floorPlanTheme?.helperText || '', /Choose an area/);
});

test('localized venue keeps canonical category for booking and floor-plan rules', () => {
  const source = INITIAL_VENUES[0];
  const venue = localizeVenue(source, 'zh');
  assert.equal(venue.category, source.category);
  assert.equal(localizeCategory(source.category, 'zh'), '夜店');
});

test('explicit database translations override automatic English fallback', () => {
  const source = INITIAL_VENUES[0];
  const venue = localizeVenue({
    ...source,
    translations: {
      en: {
        name: 'ADM Private Club',
        shortDescription: 'Custom English summary from database metadata.',
        tables: { 'adm-301': { area: 'Private Bar Side' } },
      },
    },
  }, 'en');

  assert.equal(venue.name, 'ADM Private Club');
  assert.equal(venue.shortDescription, 'Custom English summary from database metadata.');
  assert.equal(venue.preferredTables[0].area, 'Private Bar Side');
});

test('phone contact name is localized while configured labels and links are preserved', () => {
  const channels = getLocalizedContactChannels(null, 'en');
  const phone = channels.find((channel) => channel.id === 'phone');
  assert.equal(phone?.name, 'Call');
  assert.equal(phone?.label, '0865251125');
  assert.equal(phone?.href, 'tel:0865251125');
});

test('removed guide routes fall back to the locale home page', () => {
  assert.equal(publicPath('vi', 'HOW_IT_WORKS'), '/vi');
  assert.equal(publicPath('en', 'FAQ'), '/en');
});

test('venue URLs use readable slugs derived from the venue name', () => {
  assert.equal(venuePublicSlug({ id: 'venue-2', name: 'Karaoke LasVegas 1' }), 'karaoke-lasvegas-1');
  assert.equal(publicPath('en', 'VENUE_DETAIL', 'adm-club'), '/en/dia-diem/adm-club');
});

test('all non-Vietnamese locales suppress Vietnamese database paragraphs', () => {
  const source = {
    ...INITIAL_VENUES[0],
    shortDescription: 'Dia diem giai tri phu hop cho nhom khach va sinh nhat.',
    longDescription: 'Địa điểm giải trí sang trọng, cần xác nhận bàn trước khi khách đến.',
    menuUrl: 'Giá hiển thị chưa bao gồm VAT và phí phục vụ.',
  };

  for (const locale of ['en', 'ko', 'zh', 'th', 'ja', 'hi'] as const) {
    const venue = localizeVenue(source, locale);
    assert.doesNotMatch(venue.shortDescription, /dia diem|sinh nhat/i, locale);
    assert.doesNotMatch(venue.longDescription, /[ÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/, locale);
    assert.doesNotMatch(venue.menuUrl || '', /[ÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/, locale);
  }
});
