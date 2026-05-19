"use client";

import { use, useRef } from "react";
import { useEventDrawController } from "@/presentation/controllers/useEventDrawController";

import { PrivateMessage } from "@/lib/types";

interface DrawPageProps {
  params: Promise<{ id: string }>;
}

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

export default function DrawPage(props: DrawPageProps) {
  const { id } = use(props.params);
  const {
    t,
    i18n,
    myDrawn,
    messages,
    activeChat,
    setActiveChat,
    newMessage,
    setNewMessage,
    loading,
    revealed,
    setRevealed,
    router,
    chatEndRef,
    handleSendMessage,
    filteredMessages,
  } = useEventDrawController(id);

  const messagesEndRef = chatEndRef;

  if (loading) {
    return (
      <div
        className="min-h-screen bg-surface flex items-center justify-center"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="font-label text-on-surface-variant uppercase tracking-widest text-xs animate-pulse">
            {t("draw.revealing")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface flex flex-col">
      {/* ── Top App Bar ── */}
      <header className="shrink-0 bg-surface/80 backdrop-blur-xl shadow-[0_4px_20px_rgba(26,28,26,0.04)] px-6 py-4 flex items-center justify-between z-50">
        <button
          onClick={() => router.push(`/evento/${id}`)}
          className="text-primary active:scale-90 transition-transform"
          aria-label={t("common.back")}
        >
          <MSO>arrow_back</MSO>
        </button>
        <h1 className="font-display font-bold text-xl text-primary tracking-tighter">
          {t("draw.title")}
        </h1>
        <div className="w-6" />
      </header>

      <main className="flex-1 flex flex-col px-5 pb-6 gap-6 min-h-0 max-w-xl mx-auto w-full">
        {/* ── Reveal Card ── */}
        <div className="shrink-0 relative mt-4 rounded-2xl overflow-hidden">
          {/* Luxury background */}
          <div className="absolute inset-0 bg-primary opacity-95" />
          <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/10 rounded-full blur-xl" />
          <span
            className="absolute top-4 right-5 text-white/20 pointer-events-none material-symbols-outlined"
            style={{ fontSize: 48, fontVariationSettings: "'FILL' 1" }}
            aria-hidden="true"
          >
            star
          </span>

          <div className="relative z-10 p-8 text-center">
            <p className="text-on-primary/70 font-label uppercase tracking-[0.15em] text-[10px] font-bold mb-3">
              {t("draw.you_drew")}
            </p>

            {revealed ? (
              <h2 className="text-4xl font-display font-extrabold text-on-primary tracking-tight drop-shadow-sm animate-[fadeIn_0.4s_ease]">
                {myDrawn?.name || "???"}
              </h2>
            ) : (
              <button
                onClick={() => setRevealed(true)}
                className="group inline-flex items-center gap-3 bg-white/15 hover:bg-white/25 active:scale-95 transition-all rounded-full px-7 py-3.5 text-on-primary font-bold text-lg border border-white/20 shadow-inner"
              >
                <MSO size={20}>visibility</MSO>
                {t("draw.reveal_name")}
              </button>
            )}

            {revealed && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setRevealed(false)}
                  className="text-on-primary/50 text-xs font-bold uppercase tracking-widest hover:text-on-primary/80 transition-colors"
                >
                  {t("draw.hide")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Chat Section ── */}
        <section className="flex-1 flex flex-col min-h-0 bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-outline-variant/10">
          {/* Tab header */}
          <div className="shrink-0 px-5 pt-5 pb-4 border-b border-outline-variant/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-primary flex items-center gap-2">
                <MSO fill size={20}>
                  chat
                </MSO>
                {t("draw.anonymous_chat")}
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant bg-surface-container px-2 py-1 rounded-full">
                {t("draw.hidden_identity")}
              </span>
            </div>

            {/* Pill tab switcher */}
            <div
              className="flex bg-surface-container rounded-full p-1 gap-1"
              role="tablist"
            >
              <button
                onClick={() => setActiveChat("drawn")}
                role="tab"
                aria-selected={activeChat === "drawn"}
                className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-200 ${
                  activeChat === "drawn"
                    ? "bg-primary text-on-primary shadow"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {t("draw.tab_my_drawn")}
              </button>
              <button
                onClick={() => setActiveChat("drawer")}
                role="tab"
                aria-selected={activeChat === "drawer"}
                className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-200 ${
                  activeChat === "drawer"
                    ? "bg-primary text-on-primary shadow"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {t("draw.tab_my_drawer")}
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div
            className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-surface-container/30"
            aria-live="polite"
          >
            {filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 py-12">
                <span
                  className="material-symbols-outlined text-secondary-container"
                  style={{ fontSize: 48, fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  forum
                </span>
                <p className="font-display font-bold text-on-surface-variant">
                  {t("draw.no_messages")}
                </p>
                <p className="text-xs text-on-surface-variant/60 text-center max-w-[180px]">
                  {t("draw.send_first")}
                </p>
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.is_mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                      msg.is_mine
                        ? "bg-primary text-on-primary rounded-br-sm"
                        : "bg-surface-container border border-outline-variant/20 text-on-surface rounded-bl-sm"
                    }`}
                  >
                    <span
                      className={`block text-[10px] font-bold uppercase tracking-widest mb-1 ${
                        msg.is_mine
                          ? "text-on-primary/60"
                          : "text-on-surface-variant/70"
                      }`}
                    >
                      {msg.sender_display === "Você"
                        ? t("common.you") || "You"
                        : msg.sender_display}
                    </span>
                    <p className="leading-relaxed text-sm">{msg.text}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <form
            onSubmit={handleSendMessage}
            className="shrink-0 flex gap-3 p-4 border-t border-outline-variant/10 bg-surface"
          >
            <div className="relative flex-1 group">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t("draw.placeholder")}
                aria-label={t("draw.placeholder")}
                className="w-full bg-surface-container-highest border-none rounded-full px-5 py-3 text-sm focus:ring-0 focus:bg-surface-container-lowest outline-none transition-all duration-300 placeholder:text-on-surface-variant/40 text-on-surface"
              />
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_4px_12px_rgba(122,0,26,0.25)] disabled:opacity-40 disabled:shadow-none active:scale-95 transition-all shrink-0"
              aria-label={t("common.send")}
            >
              <MSO size={20}>send</MSO>
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
