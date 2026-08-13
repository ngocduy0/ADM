import JsonLd from '@/components/seo/JsonLd';
import { isSeoLocale, organizationJsonLd } from '@/lib/seo';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const language = isSeoLocale(locale) ? locale : 'vi';

  return (
    <div lang={language} className="contents">
      <JsonLd data={organizationJsonLd()} />
      {children}
    </div>
  );
}
