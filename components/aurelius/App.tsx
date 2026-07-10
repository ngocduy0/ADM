"use client";

import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import VenueCard from "./components/VenueCard";
import VenueDetailView from "./components/VenueDetailView";
import HomepageView from "./components/HomepageView";
import FloatingContact from "./components/FloatingContact";
import { AboutView, ContactView } from "./components/AboutContactViews";
import {
  loadData,
  saveVenues,
  saveCustomers,
  saveReservations,
  loadDataFromServer,
  saveDataToServer,
  ConciergeDataPayload,
} from "./data";
import {
  DEFAULT_SITE_SETTINGS,
  loadSiteSettingsFromServer,
  loadSiteSettingsLocal,
  saveSiteSettingsLocal,
  SiteSettings,
} from "./siteSettings";
import {
  Venue,
  ReservationRequest,
  Customer,
  BookingStatus,
  VipStatus,
} from "./types";
import { SlidersHorizontal } from "lucide-react";
import { I18nProvider, Locale, useI18n } from "./i18n";

type AdminNotificationPayload = {
  id: string;
  reservationId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  tableColor?: string;
};

async function createAdminNotificationFromBooking(
  booking: ReservationRequest,
): Promise<void> {
  const notice: AdminNotificationPayload = {
    id: `notice-${booking.id}`,
    reservationId: booking.id,
    title: `Đặt chỗ mới · ${booking.preferredTableName || "Chưa chọn bàn"}`,
    message: `${booking.fullName} · ${booking.venueName} · ${
      booking.preferredTableArea || "Concierge chọn khu"
    } · ${booking.guestCount} khách`,
    createdAt: booking.createdAt || new Date().toISOString(),
    read: false,
    tableColor: booking.preferredTableColor || "#0066ff",
  };

  await fetch("/api/admin-notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    credentials: "same-origin",
    body: JSON.stringify({ notifications: [notice] }),
  });
}

function PublicAppContent() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [reservations, setReservations] = useState<ReservationRequest[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(
    DEFAULT_SITE_SETTINGS,
  );
  const [currentView, setCurrentView] = useState<string>("HOME");
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] =
    useState<string>("ALL");
  const { t, locale } = useI18n();

  useEffect(() => {
    let isMounted = true;

    async function hydrateData() {
      try {
        const data = await loadDataFromServer();
        if (!isMounted) return;
        setVenues(data.venues);
        setReservations(data.reservations);
        setCustomers(data.customers);

        try {
          const settings = await loadSiteSettingsFromServer();
          if (isMounted) {
            setSiteSettings(settings);
            saveSiteSettingsLocal(settings);
          }
        } catch (settingsError) {
          console.warn(
            "[DuyT] Site settings unavailable, using local/default fallback.",
            settingsError,
          );
          if (isMounted) setSiteSettings(loadSiteSettingsLocal());
        }

        saveVenues(data.venues);
        saveReservations(data.reservations);
        saveCustomers(data.customers);
      } catch (error) {
        console.warn(
          "[DuyT] Supabase unavailable, using local fallback.",
          error,
        );
        const data = loadData();
        if (!isMounted) return;
        setVenues(data.venues);
        setReservations(data.reservations);
        setCustomers(data.customers);
        setSiteSettings(loadSiteSettingsLocal());
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    }

    hydrateData();
    return () => {
      isMounted = false;
    };
  }, []);

  const commitData = (payload: ConciergeDataPayload) => {
    setVenues(payload.venues);
    setReservations(payload.reservations);
    setCustomers(payload.customers);

    saveVenues(payload.venues);
    saveReservations(payload.reservations);
    saveCustomers(payload.customers);

    saveDataToServer(payload)
      .then((serverData) => {
        setVenues(serverData.venues);
        setReservations(serverData.reservations);
        setCustomers(serverData.customers);
        saveVenues(serverData.venues);
        saveReservations(serverData.reservations);
        saveCustomers(serverData.customers);
      })
      .catch((error) => {
        console.warn(
          "[DuyT] Supabase sync failed. Changes are kept locally.",
          error,
        );
      });
  };

  const handleRequestSubmit = (formData: any) => {
    if (!selectedVenueId) return;
    const currentVenue = venues.find((v) => v.id === selectedVenueId);
    if (!currentVenue) return;

    const selectedTable = currentVenue.preferredTables.find(
      (table) =>
        table.id === formData.preferredTableId ||
        table.name === formData.preferredTableName,
    );
    const newRequest: ReservationRequest = {
      id: `res-${Date.now()}`,
      venueId: selectedVenueId,
      venueName: currentVenue.name,
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      guestCount: formData.guestCount,
      date: formData.date,
      arrivalTime: formData.arrivalTime,
      preferredTableId: formData.preferredTableId,
      preferredTableName: formData.preferredTableName,
      preferredTableArea: selectedTable?.area,
      preferredTableMinimumSpend: selectedTable?.minimumSpend,
      preferredTableColor: selectedTable?.color,
      preferredTableCapacity: selectedTable?.capacity,
      referenceCode: formData.referenceCode,
      notes: formData.notes,
      status: BookingStatus.NEW,
      createdAt: new Date().toISOString(),
      source: "Web Form",
    };

    const nextReservations = [newRequest, ...reservations];
    const clientExists = customers.some(
      (c) =>
        c.phoneNumber.replace(/\s+/g, "") ===
        formData.phoneNumber.replace(/\s+/g, ""),
    );
    const nextCustomers = !clientExists
      ? [
          {
            id: `cust-${Date.now()}`,
            fullName: formData.fullName,
            phoneNumber: formData.phoneNumber,
            notes: `New request logged via digital web form on ${formData.date}. Prefers table: ${formData.preferredTableName}.`,
            vipStatus: VipStatus.VIP,
            favoriteVenueIds: [selectedVenueId],
            createdAt: new Date().toISOString(),
          },
          ...customers,
        ]
      : customers.map((c) => {
          if (
            c.phoneNumber.replace(/\s+/g, "") ===
            formData.phoneNumber.replace(/\s+/g, "")
          ) {
            const updatedFavs = c.favoriteVenueIds.includes(selectedVenueId)
              ? c.favoriteVenueIds
              : [...c.favoriteVenueIds, selectedVenueId];
            return { ...c, favoriteVenueIds: updatedFavs };
          }
          return c;
        });

    commitData({
      venues,
      reservations: nextReservations,
      customers: nextCustomers,
    });

    createAdminNotificationFromBooking(newRequest).catch((error) => {
      console.warn("[DuyT] Could not create admin notification", error);
    });
  };

  const openVenueDetail = (venueId: string) => {
    const nextVenues = venues.map((venue) =>
      venue.id === venueId
        ? { ...venue, viewCount: Math.max(0, Number(venue.viewCount || 0)) + 1 }
        : venue,
    );
    setVenues(nextVenues);
    saveVenues(nextVenues);
    saveDataToServer({ venues: nextVenues, reservations, customers }).catch(
      (error) => {
        console.warn(
          "[DuyT] Venue view sync failed. View is kept locally.",
          error,
        );
      },
    );
    setSelectedVenueId(venueId);
    setCurrentView("VENUE_DETAIL");
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    if (view !== "VENUE_DETAIL") setSelectedVenueId(null);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const selectedVenue = venues.find((v) => v.id === selectedVenueId);
  const categories = ["ALL", "Nightclub", "Karaoke"];
  const filteredVenues = venues.filter(
    (venue) =>
      activeCategoryFilter === "ALL" ||
      venue.category.toLowerCase() === activeCategoryFilter.toLowerCase(),
  );

  if (isLoadingData) {
    return <div className="min-h-screen bg-deep-black" aria-busy="true" />;
  }

  return (
    <div
      id="app-viewport-root"
      className="min-h-screen bg-deep-black text-on-surface flex flex-col justify-between relative"
    >
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        logoUrl={siteSettings.logoUrl}
      />
      <main
        className={[
          "flex-grow",
          currentView === "HOME" ? "pt-0" : "pt-[84px]",
        ].join(" ")}
      >
        {currentView === "HOME" && (
          <HomepageView
            featuredVenues={venues}
            siteSettings={siteSettings}
            onNavigate={handleNavigate}
            onSelectVenue={(vId) => {
              openVenueDetail(vId);
            }}
          />
        )}

        {currentView === "VENUES" && (
          <div className="max-w-[1440px] mx-auto px-6 md:px-16 py-16">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
              <h1 className="text-4xl md:text-5xl font-serif text-on-surface tracking-wide">
                {t("venues")}
              </h1>
              <p className="text-sm font-light text-on-surface-variant leading-relaxed">
                {t("heroSubtitle")}
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 justify-between items-center pb-8 border-b border-gold/10 mb-12">
              <div className="flex items-center gap-2 text-gold">
                <SlidersHorizontal className="w-4 h-4 text-gold/80" />
                <span className="text-xs sans-label tracking-widest font-bold uppercase">
                  {t("filterCategory")}
                </span>
              </div>

              <div className="flex flex-wrap gap-2.5 justify-center">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`px-5 py-2.5 text-[10px] uppercase tracking-widest font-bold rounded-full cursor-pointer transition-all border ${
                      activeCategoryFilter === cat
                        ? "bg-gold text-dark-navy border-gold shadow-md"
                        : "border-gold/15 hover:border-gold hover:text-gold text-on-surface-variant"
                    }`}
                  >
                    {cat === "ALL"
                      ? locale === "vi"
                        ? "Tất cả địa điểm"
                        : "All destinations"
                      : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredVenues.map((venue) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  onClick={(vId) => {
                    openVenueDetail(vId);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {currentView === "VENUE_DETAIL" && selectedVenue && (
          <VenueDetailView
            venue={selectedVenue}
            onBack={() => handleNavigate("VENUES")}
            onSubmitRequest={handleRequestSubmit}
          />
        )}

        {currentView === "ABOUT" && <AboutView />}
        {currentView === "CONTACT" && <ContactView />}
      </main>
      <FloatingContact />
      <Footer onNavigate={handleNavigate} logoUrl={siteSettings.logoUrl} />
    </div>
  );
}

export default function App({
  initialLocale = "vi",
}: {
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    setLocaleState(initialLocale);
    if (typeof window !== "undefined")
      localStorage.setItem("aurelius-locale", initialLocale);
  }, [initialLocale]);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    if (typeof window !== "undefined")
      localStorage.setItem("aurelius-locale", nextLocale);
  };

  return (
    <I18nProvider locale={locale} setLocale={setLocale}>
      <PublicAppContent />
    </I18nProvider>
  );
}
