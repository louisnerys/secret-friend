"use client";

import { useAdminController } from "@/presentation/controllers/useAdminController";
import BottomNav from "@/components/BottomNav";

const MSO = ({
  children,
  fill,
  size = 22,
  ariaHidden = true,
  className,
}: {
  children: string;
  fill?: boolean;
  size?: number;
  ariaHidden?: boolean;
  className?: string;
}) => (
  <span
    className={`material-symbols-outlined select-none ${className || ""}`}
    aria-hidden={ariaHidden}
    style={{
      fontSize: size,
      fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0",
    }}
  >
    {children}
  </span>
);

export default function AdminDashboard() {
  const { t, metrics, loading, error, router, handleMakeMeAdmin } =
    useAdminController();

  if (loading) {
    return (
      <div
        className="min-h-screen bg-surface flex items-center justify-center transition-colors"
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

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 transition-colors">
        <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-outline-variant/30 max-w-md w-full text-center">
          <div
            className="w-16 h-16 bg-error-container/20 text-error rounded-full flex items-center justify-center mx-auto mb-6"
            aria-hidden="true"
          >
            <MSO size={32}>error</MSO>
          </div>
          <h2 className="text-2xl font-display font-bold text-on-surface mb-2">
            {t("admin.access_denied")}
          </h2>
          <p className="text-on-surface-variant text-sm mb-4 font-body">
            {t("admin.no_permission")}
          </p>
          <p className="text-xs text-on-surface-variant mb-8 font-mono bg-surface-container-high p-3 rounded-lg break-all">
            ({error})
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-primary hover:bg-primary/95 text-on-primary font-display font-bold py-3 px-6 rounded-full transition-colors active:scale-95 shadow-md shadow-primary/10"
            >
              {t("admin.back_dashboard")}
            </button>
            <button
              onClick={handleMakeMeAdmin}
              className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30 font-display font-bold py-3 px-6 rounded-full transition-colors active:scale-95"
            >
              {t("admin.how_to_admin")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="min-h-screen bg-surface transition-colors pb-32">
      <header className="bg-surface-container-lowest/80 backdrop-blur-xl border-b border-outline-variant/20 px-6 md:px-12 py-4 flex items-center justify-between transition-colors sticky top-0 z-50 shadow-sm shadow-black/5">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center text-on-surface-variant hover:text-primary transition-colors font-bold text-sm"
          aria-label={t("admin.back")}
        >
          <MSO className="mr-1">arrow_back</MSO>
          {t("admin.back")}
        </button>
        <h1 className="text-xl font-display font-bold text-primary flex items-center gap-2">
          <MSO fill className="text-primary">monitoring</MSO>
          {t("admin.title")}
        </h1>
        <div className="w-20 hidden md:block"></div>
      </header>

      <main className="p-6 md:p-12 max-w-6xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Active Users */}
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <div
              className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:scale-110 transition-transform"
              aria-hidden="true"
            />
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-wider">
                {t("admin.active_users")}
              </h3>
              <MSO className="text-primary/40 group-hover:text-primary transition-colors">group</MSO>
            </div>
            <p className="text-4xl font-display font-black text-primary">
              {metrics.mau}
            </p>
          </div>

          {/* Card 2: Messages */}
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <div
              className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-secondary-container/20 rounded-full blur-2xl group-hover:scale-110 transition-transform"
              aria-hidden="true"
            />
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-wider">
                {t("admin.messages_24h")}
              </h3>
              <MSO className="text-secondary/40 group-hover:text-secondary transition-colors">chat_bubble</MSO>
            </div>
            <p className="text-4xl font-display font-black text-primary">
              {metrics.messages_24h}
            </p>
          </div>

          {/* Card 3: Engagement */}
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <div
              className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-tertiary-container/20 rounded-full blur-2xl group-hover:scale-110 transition-transform"
              aria-hidden="true"
            />
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-wider">
                {t("admin.engagement")}
              </h3>
              <MSO className="text-tertiary/40 group-hover:text-tertiary transition-colors">stars</MSO>
            </div>
            <p className="text-4xl font-display font-black text-primary mb-1">
              {metrics.engagement.rate_percentage}%
            </p>
            <p className="text-xs text-on-surface-variant font-medium">
              <span className="text-on-surface">
                {t("admin.with_wishlist", {
                  count: metrics.engagement.with_wishlist,
                  total: metrics.engagement.total_participants,
                })}
              </span>
            </p>
          </div>
        </div>

        {/* Event Status section */}
        <section className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-display font-bold text-primary mb-6 border-b border-outline-variant/10 pb-4 flex items-center gap-2">
            <MSO fill>analytics</MSO>
            {t("admin.event_status")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Open Events */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10 shadow-sm transition-all hover:bg-surface-container">
              <div
                className="w-12 h-12 rounded-xl bg-secondary-container/20 text-secondary flex items-center justify-center font-display font-bold text-xl"
                aria-hidden="true"
              >
                {metrics.events.open}
              </div>
              <div>
                <span className="block font-headline font-bold text-on-surface text-sm">
                  {t("admin.open")}
                </span>
                <span className="text-[11px] text-on-surface-variant/80 font-body">
                  {t("admin.waiting_draw")}
                </span>
              </div>
            </div>

            {/* Drawn Events */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10 shadow-sm transition-all hover:bg-surface-container">
              <div
                className="w-12 h-12 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center font-display font-bold text-xl"
                aria-hidden="true"
              >
                {metrics.events.drawn}
              </div>
              <div>
                <span className="block font-headline font-bold text-on-surface text-sm">
                  {t("admin.drawn")}
                </span>
                <span className="text-[11px] text-on-surface-variant/80 font-body">
                  {t("admin.draw_performed")}
                </span>
              </div>
            </div>

            {/* Finished Events */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10 shadow-sm transition-all hover:bg-surface-container">
              <div
                className="w-12 h-12 rounded-xl bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-display font-bold text-xl"
                aria-hidden="true"
              >
                {metrics.events.finished}
              </div>
              <div>
                <span className="block font-headline font-bold text-on-surface text-sm">
                  {t("admin.finished")}
                </span>
                <span className="text-[11px] text-on-surface-variant/80 font-body">
                  {t("admin.event_concluded")}
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Bottom Nav ── */}
      <BottomNav context="global" activeTab="admin" isAdmin={true} />
    </div>
  );
}
