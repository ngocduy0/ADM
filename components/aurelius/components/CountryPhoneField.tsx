import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { useI18n } from "../i18n";

export type PhoneCountry = {
  iso: string;
  name: string;
  dialCode: string;
};

const COUNTRY_ROWS: Array<[string, string, string]> = [
  ["VN", "Việt Nam", "+84"],
  ["AF", "Afghanistan", "+93"],
  ["AL", "Albania", "+355"],
  ["DZ", "Algeria", "+213"],
  ["AD", "Andorra", "+376"],
  ["AO", "Angola", "+244"],
  ["AG", "Antigua và Barbuda", "+1268"],
  ["AR", "Argentina", "+54"],
  ["AM", "Armenia", "+374"],
  ["AU", "Úc", "+61"],
  ["AT", "Áo", "+43"],
  ["AZ", "Azerbaijan", "+994"],
  ["BS", "Bahamas", "+1242"],
  ["BH", "Bahrain", "+973"],
  ["BD", "Bangladesh", "+880"],
  ["BB", "Barbados", "+1246"],
  ["BY", "Belarus", "+375"],
  ["BE", "Bỉ", "+32"],
  ["BZ", "Belize", "+501"],
  ["BJ", "Benin", "+229"],
  ["BT", "Bhutan", "+975"],
  ["BO", "Bolivia", "+591"],
  ["BA", "Bosnia và Herzegovina", "+387"],
  ["BW", "Botswana", "+267"],
  ["BR", "Brazil", "+55"],
  ["BN", "Brunei", "+673"],
  ["BG", "Bulgaria", "+359"],
  ["BF", "Burkina Faso", "+226"],
  ["BI", "Burundi", "+257"],
  ["CV", "Cabo Verde", "+238"],
  ["KH", "Campuchia", "+855"],
  ["CM", "Cameroon", "+237"],
  ["CA", "Canada", "+1"],
  ["CF", "Cộng hòa Trung Phi", "+236"],
  ["TD", "Chad", "+235"],
  ["CL", "Chile", "+56"],
  ["CN", "Trung Quốc", "+86"],
  ["CO", "Colombia", "+57"],
  ["KM", "Comoros", "+269"],
  ["CG", "Congo", "+242"],
  ["CD", "Congo (CHDC)", "+243"],
  ["CR", "Costa Rica", "+506"],
  ["CI", "Bờ Biển Ngà", "+225"],
  ["HR", "Croatia", "+385"],
  ["CU", "Cuba", "+53"],
  ["CY", "Síp", "+357"],
  ["CZ", "Séc", "+420"],
  ["DK", "Đan Mạch", "+45"],
  ["DJ", "Djibouti", "+253"],
  ["DM", "Dominica", "+1767"],
  ["DO", "Cộng hòa Dominica", "+1809"],
  ["EC", "Ecuador", "+593"],
  ["EG", "Ai Cập", "+20"],
  ["SV", "El Salvador", "+503"],
  ["GQ", "Guinea Xích Đạo", "+240"],
  ["ER", "Eritrea", "+291"],
  ["EE", "Estonia", "+372"],
  ["SZ", "Eswatini", "+268"],
  ["ET", "Ethiopia", "+251"],
  ["FJ", "Fiji", "+679"],
  ["FI", "Phần Lan", "+358"],
  ["FR", "Pháp", "+33"],
  ["GA", "Gabon", "+241"],
  ["GM", "Gambia", "+220"],
  ["GE", "Georgia", "+995"],
  ["DE", "Đức", "+49"],
  ["GH", "Ghana", "+233"],
  ["GR", "Hy Lạp", "+30"],
  ["GD", "Grenada", "+1473"],
  ["GT", "Guatemala", "+502"],
  ["GN", "Guinea", "+224"],
  ["GW", "Guinea-Bissau", "+245"],
  ["GY", "Guyana", "+592"],
  ["HT", "Haiti", "+509"],
  ["HN", "Honduras", "+504"],
  ["HU", "Hungary", "+36"],
  ["IS", "Iceland", "+354"],
  ["IN", "Ấn Độ", "+91"],
  ["ID", "Indonesia", "+62"],
  ["IR", "Iran", "+98"],
  ["IQ", "Iraq", "+964"],
  ["IE", "Ireland", "+353"],
  ["IL", "Israel", "+972"],
  ["IT", "Ý", "+39"],
  ["JM", "Jamaica", "+1876"],
  ["JP", "Nhật Bản", "+81"],
  ["JO", "Jordan", "+962"],
  ["KZ", "Kazakhstan", "+7"],
  ["KE", "Kenya", "+254"],
  ["KI", "Kiribati", "+686"],
  ["KP", "Triều Tiên", "+850"],
  ["KR", "Hàn Quốc", "+82"],
  ["KW", "Kuwait", "+965"],
  ["KG", "Kyrgyzstan", "+996"],
  ["LA", "Lào", "+856"],
  ["LV", "Latvia", "+371"],
  ["LB", "Lebanon", "+961"],
  ["LS", "Lesotho", "+266"],
  ["LR", "Liberia", "+231"],
  ["LY", "Libya", "+218"],
  ["LI", "Liechtenstein", "+423"],
  ["LT", "Lithuania", "+370"],
  ["LU", "Luxembourg", "+352"],
  ["MG", "Madagascar", "+261"],
  ["MW", "Malawi", "+265"],
  ["MY", "Malaysia", "+60"],
  ["MV", "Maldives", "+960"],
  ["ML", "Mali", "+223"],
  ["MT", "Malta", "+356"],
  ["MH", "Quần đảo Marshall", "+692"],
  ["MR", "Mauritania", "+222"],
  ["MU", "Mauritius", "+230"],
  ["MX", "Mexico", "+52"],
  ["FM", "Micronesia", "+691"],
  ["MD", "Moldova", "+373"],
  ["MC", "Monaco", "+377"],
  ["MN", "Mông Cổ", "+976"],
  ["ME", "Montenegro", "+382"],
  ["MA", "Morocco", "+212"],
  ["MZ", "Mozambique", "+258"],
  ["MM", "Myanmar", "+95"],
  ["NA", "Namibia", "+264"],
  ["NR", "Nauru", "+674"],
  ["NP", "Nepal", "+977"],
  ["NL", "Hà Lan", "+31"],
  ["NZ", "New Zealand", "+64"],
  ["NI", "Nicaragua", "+505"],
  ["NE", "Niger", "+227"],
  ["NG", "Nigeria", "+234"],
  ["MK", "Bắc Macedonia", "+389"],
  ["NO", "Na Uy", "+47"],
  ["OM", "Oman", "+968"],
  ["PK", "Pakistan", "+92"],
  ["PW", "Palau", "+680"],
  ["PS", "Palestine", "+970"],
  ["PA", "Panama", "+507"],
  ["PG", "Papua New Guinea", "+675"],
  ["PY", "Paraguay", "+595"],
  ["PE", "Peru", "+51"],
  ["PH", "Philippines", "+63"],
  ["PL", "Ba Lan", "+48"],
  ["PT", "Bồ Đào Nha", "+351"],
  ["QA", "Qatar", "+974"],
  ["RO", "Romania", "+40"],
  ["RU", "Nga", "+7"],
  ["RW", "Rwanda", "+250"],
  ["KN", "Saint Kitts và Nevis", "+1869"],
  ["LC", "Saint Lucia", "+1758"],
  ["VC", "Saint Vincent và Grenadines", "+1784"],
  ["WS", "Samoa", "+685"],
  ["SM", "San Marino", "+378"],
  ["ST", "São Tomé và Príncipe", "+239"],
  ["SA", "Ả Rập Xê Út", "+966"],
  ["SN", "Senegal", "+221"],
  ["RS", "Serbia", "+381"],
  ["SC", "Seychelles", "+248"],
  ["SL", "Sierra Leone", "+232"],
  ["SG", "Singapore", "+65"],
  ["SK", "Slovakia", "+421"],
  ["SI", "Slovenia", "+386"],
  ["SB", "Quần đảo Solomon", "+677"],
  ["SO", "Somalia", "+252"],
  ["ZA", "Nam Phi", "+27"],
  ["SS", "Nam Sudan", "+211"],
  ["ES", "Tây Ban Nha", "+34"],
  ["LK", "Sri Lanka", "+94"],
  ["SD", "Sudan", "+249"],
  ["SR", "Suriname", "+597"],
  ["SE", "Thụy Điển", "+46"],
  ["CH", "Thụy Sĩ", "+41"],
  ["SY", "Syria", "+963"],
  ["TW", "Đài Loan", "+886"],
  ["TJ", "Tajikistan", "+992"],
  ["TZ", "Tanzania", "+255"],
  ["TH", "Thái Lan", "+66"],
  ["TL", "Timor-Leste", "+670"],
  ["TG", "Togo", "+228"],
  ["TO", "Tonga", "+676"],
  ["TT", "Trinidad và Tobago", "+1868"],
  ["TN", "Tunisia", "+216"],
  ["TR", "Thổ Nhĩ Kỳ", "+90"],
  ["TM", "Turkmenistan", "+993"],
  ["TV", "Tuvalu", "+688"],
  ["UG", "Uganda", "+256"],
  ["UA", "Ukraine", "+380"],
  ["AE", "Các Tiểu vương quốc Ả Rập Thống nhất", "+971"],
  ["GB", "Vương quốc Anh", "+44"],
  ["US", "Hoa Kỳ", "+1"],
  ["UY", "Uruguay", "+598"],
  ["UZ", "Uzbekistan", "+998"],
  ["VU", "Vanuatu", "+678"],
  ["VA", "Vatican", "+39"],
  ["VE", "Venezuela", "+58"],
  ["YE", "Yemen", "+967"],
  ["ZM", "Zambia", "+260"],
  ["ZW", "Zimbabwe", "+263"],
  ["XK", "Kosovo", "+383"],
];

export const PHONE_COUNTRIES: PhoneCountry[] = COUNTRY_ROWS.map(
  ([iso, name, dialCode]) => ({ iso, name, dialCode }),
);

export function countryFlag(iso: string) {
  if (!/^[A-Z]{2}$/.test(iso)) return "🌐";
  return String.fromCodePoint(
    ...iso.split("").map((letter) => 127397 + letter.charCodeAt(0)),
  );
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function buildInternationalPhone(
  country: PhoneCountry,
  nationalNumber: string,
) {
  const raw = nationalNumber.trim();
  const compact = raw.replace(/[^\d+]/g, "");
  if (compact.startsWith("+")) return compact;

  let digits = compact.replace(/\D/g, "");
  const dialDigits = country.dialCode.replace(/\D/g, "");
  if (digits.startsWith(dialDigits)) digits = digits.slice(dialDigits.length);

  // Most countries use a domestic trunk prefix 0 which is omitted in E.164.
  // Italy and Vatican numbers retain the leading zero.
  if (!new Set(["IT", "VA"]).has(country.iso)) digits = digits.replace(/^0+/, "");
  return `${country.dialCode}${digits}`;
}

export function isValidInternationalPhone(value: string) {
  return /^\+[1-9]\d{7,14}$/.test(value.replace(/[\s().-]/g, ""));
}

interface CountryPhoneFieldProps {
  countryIso: string;
  onCountryChange: (country: PhoneCountry) => void;
  nationalNumber: string;
  onNationalNumberChange: (value: string) => void;
  inputClassName: string;
  disabled?: boolean;
}

export default function CountryPhoneField({
  countryIso,
  onCountryChange,
  nationalNumber,
  onNationalNumberChange,
  inputClassName,
  disabled = false,
}: CountryPhoneFieldProps) {
  const { locale } = useI18n();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected =
    PHONE_COUNTRIES.find((country) => country.iso === countryIso) ||
    PHONE_COUNTRIES[0];
  const regionNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      return null;
    }
  }, [locale]);
  const countryName = (country: PhoneCountry) => regionNames?.of(country.iso) || country.name;
  const fieldCopy = {
    vi: { search: "Tìm quốc gia hoặc mã vùng", empty: "Không tìm thấy quốc gia phù hợp." },
    en: { search: "Search country or calling code", empty: "No matching country found." },
    ko: { search: "국가 또는 국가번호 검색", empty: "일치하는 국가가 없습니다." },
    zh: { search: "搜索国家或区号", empty: "未找到匹配的国家。" },
    th: { search: "ค้นหาประเทศหรือรหัสโทรศัพท์", empty: "ไม่พบประเทศที่ตรงกัน" },
    ja: { search: "国または国番号を検索", empty: "一致する国が見つかりません。" },
    hi: { search: "देश या calling code खोजें", empty: "कोई matching country नहीं मिला।" },
  }[locale];

  const filteredCountries = useMemo(() => {
    const normalized = normalizeSearch(query);
    if (!normalized) return PHONE_COUNTRIES;
    return PHONE_COUNTRIES.filter((country) =>
      normalizeSearch(`${countryName(country)} ${country.name} ${country.iso} ${country.dialCode}`).includes(
        normalized,
      ),
    );
  }, [query, regionNames]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] overflow-visible rounded-2xl border border-gold/10 bg-deep-black/80 transition focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/10">
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => {
            setOpen((value) => !value);
            setQuery("");
          }}
          className="flex min-w-[112px] items-center gap-2 border-r border-white/10 px-3 py-3 text-left text-sm font-semibold text-on-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="text-xl leading-none" aria-hidden="true">
            {countryFlag(selected.iso)}
          </span>
          <span>{selected.dialCode}</span>
          <ChevronDown className="ml-auto h-4 w-4 text-on-surface-variant" />
        </button>
        <input
          type="tel"
          required
          autoComplete="tel-national"
          inputMode="tel"
          placeholder="901 234 567"
          value={nationalNumber}
          disabled={disabled}
          onChange={(event) => onNationalNumberChange(event.target.value)}
          className={`${inputClassName} rounded-l-none border-0 bg-transparent focus:ring-0`}
        />
      </div>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[120] w-full min-w-[300px] overflow-hidden rounded-2xl border border-white/10 bg-[#0B0F17] shadow-2xl shadow-black/70 sm:w-[390px]">
          <div className="border-b border-white/10 p-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3">
              <Search className="h-4 w-4 text-on-surface-variant" />
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={fieldCopy.search}
                className="h-11 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto p-2" role="listbox">
            {filteredCountries.map((country) => {
              const active = country.iso === selected.iso;
              return (
                <button
                  key={country.iso}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onCountryChange(country);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    active
                      ? "bg-gold/15 text-gold-light"
                      : "text-on-surface hover:bg-white/5"
                  }`}
                >
                  <span className="text-xl" aria-hidden="true">
                    {countryFlag(country.iso)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {countryName(country)}
                  </span>
                  <span className="text-sm text-on-surface-variant">
                    {country.dialCode}
                  </span>
                  {active ? <Check className="h-4 w-4" /> : null}
                </button>
              );
            })}
            {!filteredCountries.length ? (
              <p className="px-3 py-8 text-center text-sm text-on-surface-variant">
                {fieldCopy.empty}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
