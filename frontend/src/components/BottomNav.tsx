"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";

interface BottomNavProps {
  context: "global" | "event";
  activeTab: "events" | "new-event" | "admin" | "event-details" | "draw";
  eventId?: string;
  isAdmin?: boolean;
  isParticipant?: boolean;
  isDrawn?: boolean;
}

const MSO = ({
  children,
  fill,
  size = 22,
  ariaHidden = true,
}: {
  children: string;
  fill?: boolean;
  size?: number;
  ariaHidden?: boolean;
}) => (
  <span
    className="material-symbols-outlined select-none transition-transform duration-300"
    aria-hidden={ariaHidden}
    style={{
      fontSize: size,
      fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0",
    }}
  >
    {children}
  </span>
);

export default function BottomNav({
  context,
  activeTab,
  eventId,
  isAdmin = false,
  isParticipant = false,
  isDrawn = false,
}: BottomNavProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navClass =
    "fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-surface/95 dark:bg-surface/95 backdrop-blur-2xl z-50 rounded-t-3xl border-t border-outline-variant/20 shadow-[0_-8px_32px_rgba(26,28,26,0.08)] transition-all duration-300";

  if (context === "global") {
    return (
      <nav className={navClass} aria-label={t("dashboard.nav_events")}>
        <div className="flex justify-around items-center w-full max-w-lg mx-auto">
          {/* Events tab */}
          {activeTab === "events" ? (
            <div
              className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-5 py-2 transition-all duration-300 shadow-sm"
              role="status"
              aria-live="polite"
            >
              <MSO fill>celebration</MSO>
              <span className="font-label text-[10px] uppercase tracking-widest font-bold mt-1">
                {t("dashboard.nav_events")}
              </span>
            </div>
          ) : (
            <Link
              href="/dashboard"
              className="flex flex-col items-center justify-center text-on-surface-variant/60 p-2 hover:text-primary transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-xl"
              aria-label={t("dashboard.nav_events")}
            >
              <MSO>celebration</MSO>
              <span className="font-label text-[10px] uppercase tracking-widest font-semibold mt-1">
                {t("dashboard.nav_events")}
              </span>
            </Link>
          )}

          {/* New Event tab */}
          {activeTab === "new-event" ? (
            <div
              className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-5 py-2 transition-all duration-300 shadow-sm"
              role="status"
              aria-live="polite"
            >
              <MSO fill>add_box</MSO>
              <span className="font-label text-[10px] uppercase tracking-widest font-bold mt-1">
                {t("dashboard.create_event")}
              </span>
            </div>
          ) : (
            <Link
              href="/novo-evento"
              className="flex flex-col items-center justify-center text-on-surface-variant/60 p-2 hover:text-primary transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-xl"
              aria-label={t("dashboard.create_event")}
            >
              <MSO>add_box</MSO>
              <span className="font-label text-[10px] uppercase tracking-widest font-semibold mt-1">
                {t("dashboard.create_event")}
              </span>
            </Link>
          )}

          {/* Admin tab (only displayed if user is admin) */}
          {isAdmin &&
            (activeTab === "admin" ? (
              <div
                className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-5 py-2 transition-all duration-300 shadow-sm"
                role="status"
                aria-live="polite"
              >
                <MSO fill>auto_awesome</MSO>
                <span className="font-label text-[10px] uppercase tracking-widest font-bold mt-1">
                  {t("common.admin")}
                </span>
              </div>
            ) : (
              <Link
                href="/admin"
                className="flex flex-col items-center justify-center text-on-surface-variant/60 p-2 hover:text-primary transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-xl"
                aria-label={t("common.admin")}
              >
                <MSO>auto_awesome</MSO>
                <span className="font-label text-[10px] uppercase tracking-widest font-semibold mt-1">
                  {t("common.admin")}
                </span>
              </Link>
            ))}

          {/* Logout tab */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center text-on-surface-variant/60 p-2 hover:text-primary hover:bg-primary-container/10 transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-xl"
            aria-label={t("common.logout")}
          >
            <MSO>logout</MSO>
            <span className="font-label text-[10px] uppercase tracking-widest font-semibold mt-1">
              {t("common.logout")}
            </span>
          </button>
        </div>
      </nav>
    );
  }

  // Event context
  return (
    <nav className={navClass} aria-label={t("event.nav_events")}>
      <div className="flex justify-around items-center w-full max-w-lg mx-auto">
        {/* Back tab */}
        <Link
          href="/dashboard"
          className="flex flex-col items-center justify-center text-on-surface-variant/60 p-2 hover:text-primary transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-xl"
          aria-label={t("common.back")}
        >
          <MSO>arrow_back</MSO>
          <span className="font-label text-[10px] uppercase tracking-widest font-semibold mt-1">
            {t("common.back")}
          </span>
        </Link>

        {/* Event Details tab */}
        {activeTab === "event-details" ? (
          <div
            className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-5 py-2 transition-all duration-300 shadow-sm"
            role="status"
            aria-live="polite"
          >
            <MSO fill>event</MSO>
            <span className="font-label text-[10px] uppercase tracking-widest font-bold mt-1">
              {t("event.nav_events")}
            </span>
          </div>
        ) : (
          <Link
            href={`/evento/${eventId}`}
            className="flex flex-col items-center justify-center text-on-surface-variant/60 p-2 hover:text-primary transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-xl"
            aria-label={t("event.nav_events")}
          >
            <MSO>event</MSO>
            <span className="font-label text-[10px] uppercase tracking-widest font-semibold mt-1">
              {t("event.nav_events")}
            </span>
          </Link>
        )}

        {/* Draw & Chat tab */}
        {isParticipant &&
          isDrawn &&
          (activeTab === "draw" ? (
            <div
              className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-5 py-2 transition-all duration-300 shadow-sm"
              role="status"
              aria-live="polite"
            >
              <MSO fill>auto_awesome</MSO>
              <span className="font-label text-[10px] uppercase tracking-widest font-bold mt-1">
                {t("event.nav_draw")}
              </span>
            </div>
          ) : (
            <Link
              href={`/evento/${eventId}/draw`}
              className="flex flex-col items-center justify-center text-on-surface-variant/60 p-2 hover:text-primary transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-xl"
              aria-label={t("event.nav_draw")}
            >
              <MSO>auto_awesome</MSO>
              <span className="font-label text-[10px] uppercase tracking-widest font-semibold mt-1">
                {t("event.nav_draw")}
              </span>
            </Link>
          ))}

        {/* Logout tab */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center text-on-surface-variant/60 p-2 hover:text-primary hover:bg-primary-container/10 transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-xl"
          aria-label={t("common.logout")}
        >
          <MSO>logout</MSO>
          <span className="font-label text-[10px] uppercase tracking-widest font-semibold mt-1">
            {t("common.logout")}
          </span>
        </button>
      </div>
    </nav>
  );
}
