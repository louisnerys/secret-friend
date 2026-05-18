"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Event } from "@/lib/types";

interface UserProfile {
  name?: string;
  is_admin?: boolean;
}

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [profile, setProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchEvents = useCallback(async (userId: string) => {
    try {
      const { data: userProfile } = await supabase
        .from("users")
        .select("name, is_admin")
        .eq("id", userId)
        .single();

      setProfile(userProfile || {});

      const { data, error } = await supabase.from("events").select("*");
      if (!error && data) setEvents(data as unknown as Event[]);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const setupAuth = async () => {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) {
          fetchEvents(session.user.id);
        } else if (event === "SIGNED_OUT") {
          router.push("/login");
        }
      });
      subscription = data.subscription;

      console.log("Checking user session...");
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        console.log("Session found:", session.user.email);
        fetchEvents(session.user.id);
      } else {
        const hasCode =
          window.location.search.includes("code=") ||
          window.location.hash.includes("access_token=");
        if (!hasCode) {
          setLoading(false);
          router.push("/login");
        }
      }
    };

    setupAuth();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [fetchEvents, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const firstName = profile.name?.split(" ")[0] || t("dashboard.status.open");

  if (loading) {
    return (
      <div
        className="min-h-screen bg-surface flex items-center justify-center"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="font-label text-on-surface-variant uppercase tracking-widest text-xs">
            {t("common.loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface pb-32">
      {/* ── Top App Bar ── */}
      <header className="bg-surface/80 backdrop-blur-xl fixed top-0 w-full z-50 shadow-sm shadow-black/5">
        <div className="flex items-center justify-between px-6 py-4 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-display font-bold text-sm"
              aria-hidden="true"
            >
              {firstName[0]}
            </div>
            <h1 className="text-2xl font-bold tracking-tighter text-primary font-display">
              {t("login.title")}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {profile.is_admin && (
              <button
                onClick={() => router.push("/admin")}
                className="text-xs font-bold uppercase tracking-widest text-secondary bg-secondary-container/30 px-3 py-1.5 rounded-full"
              >
                {t("common.admin")}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="text-on-surface-variant hover:text-primary transition-colors flex items-center"
              title={t("common.logout")}
              aria-label={t("common.logout")}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 22 }}
                aria-hidden="true"
              >
                logout
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="mt-24 px-6 max-w-screen-xl mx-auto space-y-10">
        {/* Welcome */}
        <section className="relative pt-4 overflow-hidden">
          <div className="flex flex-col gap-2">
            <p className="text-secondary font-label uppercase tracking-widest text-[10px] font-bold">
              {t("dashboard.welcome_greeting")}
            </p>
            <h2 className="text-4xl font-display font-bold text-on-surface leading-tight tracking-tight">
              {t("dashboard.greeting", { name: firstName })}{" "}
              <span className="text-primary">
                {t("dashboard.greeting_suffix")}
              </span>
            </h2>
          </div>
          <div
            className="absolute -top-10 -right-10 w-32 h-32 bg-secondary-container/20 rounded-full blur-3xl"
            aria-hidden="true"
          />
        </section>

        {/* CTA */}
        <section>
          <button
            onClick={() => router.push("/novo-evento")}
            className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-5 px-8 rounded-full shadow-lg shadow-primary/10 flex items-center justify-center gap-3 active:scale-95 transition-all duration-300 font-display font-bold text-lg group"
          >
            <span
              className="material-symbols-outlined transition-transform group-hover:rotate-90"
              style={{ fontSize: 22 }}
              aria-hidden="true"
            >
              add
            </span>
            {t("dashboard.create_event")}
          </button>
        </section>

        {/* My Events */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold text-on-surface">
              {t("dashboard.my_events")}
            </h3>
          </div>

          {events.length === 0 ? (
            <div className="bg-surface-container-low rounded-2xl p-10 text-center space-y-4">
              <span
                className="material-symbols-outlined text-secondary-container"
                style={{ fontSize: 56, fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                celebration
              </span>
              <h4 className="font-display text-xl font-bold text-on-surface">
                {t("dashboard.no_events_title")}
              </h4>
              <p className="text-on-surface-variant text-sm max-w-xs mx-auto">
                {t("dashboard.no_events_desc")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/evento/${event.id}`}
                  className="block bg-surface-container-lowest rounded-xl p-6 shadow-sm shadow-black/5 relative overflow-hidden group border-l-4 border-secondary cursor-pointer hover:shadow-md transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <h4 className="text-lg font-display font-bold text-primary group-hover:text-primary-container transition-colors">
                        {event.name}
                      </h4>
                      {event.reveal_date && (
                        <p className="text-on-surface-variant text-sm font-medium">
                          {new Date(event.reveal_date).toLocaleDateString(
                            i18n.language,
                            {
                              day: "2-digit",
                              month: "short",
                            },
                          )}
                        </p>
                      )}
                    </div>
                    <span className="bg-tertiary-container/20 text-tertiary px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {t(`dashboard.status.${event.status}`)}
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-sm line-clamp-2 mb-6">
                    {event.description}
                  </p>
                  <div className="flex items-center justify-end">
                    <span
                      className="material-symbols-outlined text-outline-variant group-hover:translate-x-1 transition-transform"
                      style={{ fontSize: 20 }}
                      aria-hidden="true"
                    >
                      arrow_forward
                    </span>
                  </div>
                  {/* Decorative */}
                  <span
                    className="material-symbols-outlined absolute -top-2 -right-2 text-secondary-container/20 select-none"
                    style={{ fontSize: 56, fontVariationSettings: "'FILL' 1" }}
                    aria-hidden="true"
                  >
                    star
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Gift Inspiration */}
        <section className="pb-4">
          <h3 className="text-xl font-display font-bold text-on-surface mb-6">
            {t("dashboard.gift_inspiration")}
          </h3>
          <div
            className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6"
            style={{ scrollbarWidth: "none" }}
          >
            {[
              {
                label: t("dashboard.guides.label_2024"),
                name: t("dashboard.guides.wine"),
                emoji: "🍷",
              },
              {
                label: t("dashboard.guides.label_minimalist"),
                name: t("dashboard.guides.stationery"),
                emoji: "📓",
              },
              {
                label: t("dashboard.guides.label_executive"),
                name: t("dashboard.guides.tech"),
                emoji: "⌚",
              },
              {
                label: t("dashboard.guides.label_gourmet"),
                name: t("dashboard.guides.gourmet"),
                emoji: "🧺",
              },
            ].map((item) => (
              <div
                key={item.name}
                className="flex-shrink-0 w-40 bg-surface-container-low rounded-2xl overflow-hidden shadow-none hover:shadow-md transition-all"
              >
                <div
                  className="w-full h-32 bg-gradient-to-br from-secondary-container/40 to-primary-container/20 flex items-center justify-center text-5xl"
                  aria-hidden="true"
                >
                  {item.emoji}
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    {item.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Bottom Nav ── */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-surface/90 backdrop-blur-2xl z-50 rounded-t-3xl shadow-[0_-8px_24px_rgba(26,28,26,0.06)]">
        <div className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-5 py-2 transition-all duration-300">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}
            aria-hidden="true"
          >
            celebration
          </span>
          <span className="font-label text-[10px] uppercase tracking-widest font-semibold mt-1">
            {t("dashboard.nav_events")}
          </span>
        </div>
        <Link
          href="/admin"
          className="flex flex-col items-center justify-center text-on-surface-variant/50 p-2 hover:text-primary transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-lg"
          aria-label={t("common.admin")}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 22 }}
            aria-hidden="true"
          >
            auto_awesome
          </span>
          <span className="font-label text-[10px] uppercase tracking-widest font-semibold mt-1">
            {t("common.admin")}
          </span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center text-on-surface-variant/50 p-2 hover:text-primary transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-lg"
          aria-label={t("dashboard.nav_profile")}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 22 }}
            aria-hidden="true"
          >
            person
          </span>
          <span className="font-label text-[10px] uppercase tracking-widest font-semibold mt-1">
            {t("dashboard.nav_profile")}
          </span>
        </button>
      </nav>
    </div>
  );
}
