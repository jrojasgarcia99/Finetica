"use client";

import { useEffect, useRef, useState } from "react";
import { useChat, Chat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { X, ArrowUp, RotateCcw, SquarePen } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar } from "@/components/ui/Avatar";
import { useT } from "@/components/i18n/I18nProvider";

const DAILY_LIMIT = 50;
const AVATAR = "/lia.svg";

/**
 * Todo lo que importa el SDK de IA + react-markdown vive acá, separado de
 * `AssistantWidget`, para que ese peso (parseo + hidratación) solo se pague
 * la primera vez que se abre el chat — no en cada carga de página, que es lo
 * que pasaba antes al importarlo arriba del todo en un componente montado
 * siempre. `AssistantWidget` carga este archivo con `next/dynamic`.
 */
export function AssistantChat({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Una sola instancia de chat por carga de página: sobrevive a cerrar/abrir el
  // panel (el componente se mantiene montado, solo se oculta) y a navegar
  // entre páginas de la app; se reinicia al recargar.
  const [chat] = useState(
    () => new Chat<UIMessage>({ transport: new DefaultChatTransport({ api: "/api/assistant" }) }),
  );
  const { messages, sendMessage, status, error, regenerate, setMessages, clearError } =
    useChat({ chat });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function submit(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    clearError?.();
    setInput("");
    void sendMessage({ text: value });
  }

  function newChat() {
    clearError?.();
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  }

  const errKind = error
    ? error.message?.includes("RATE_LIMIT")
      ? "rate"
      : error.message?.includes("NO_API_KEY")
        ? "config"
        : "generic"
    : null;
  const errText =
    errKind === "rate"
      ? t("assistant.errorRateLimit", { n: DAILY_LIMIT })
      : errKind === "config"
        ? t("assistant.errorNotConfigured")
        : errKind === "generic"
          ? t("assistant.errorGeneric")
          : null;

  const suggestions = [
    t("assistant.suggest1"),
    t("assistant.suggest2"),
    t("assistant.suggest3"),
  ];

  return (
    <div className="fixed inset-0 z-50 flex md:justify-end">
      <button
        type="button"
        aria-label={t("assistant.close")}
        onClick={onClose}
        className="absolute inset-0 hidden bg-black/40 md:block"
      />
      <div className="relative flex h-full w-full flex-col bg-card shadow-[var(--shadow-card)] md:w-[420px] md:max-w-[92vw] md:border-l md:border-border">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] md:pt-3">
          <div className="flex items-center gap-2">
            <Avatar src={AVATAR} name="Lía" size={36} />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-navy">{t("assistant.title")}</p>
              <p className="text-[11px] text-gray-400">{t("assistant.subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={newChat}
                aria-label={t("assistant.newChat")}
                title={t("assistant.newChat")}
                className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-navy"
              >
                <SquarePen size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={t("assistant.close")}
              className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-navy"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <p className="border-b border-border bg-gray-50 px-4 py-2 text-[11px] leading-snug text-gray-500">
          {t("assistant.disclaimer")}
        </p>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-2 text-center">
              <Avatar src={AVATAR} name="Lía" size={56} />
              <p className="text-sm text-gray-500">{t("assistant.empty")}</p>
              <div className="flex flex-col gap-2 self-stretch">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => submit(s)}
                    className="rounded-xl border border-border px-3 py-2 text-left text-xs text-navy transition-colors hover:bg-gray-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => {
            const body = textOf(m as UIMsg);
            if (m.role === "user") {
              return (
                <div
                  key={m.id}
                  className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl bg-navy px-3 py-2 text-sm text-white"
                >
                  {body}
                </div>
              );
            }
            return (
              <div key={m.id} className="mr-auto flex max-w-[93%] gap-2">
                <Avatar src={AVATAR} name="Lía" size={24} className="mt-0.5" />
                <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-3 py-2 text-sm text-foreground">
                  {body ? <MarkdownMessage text={body} /> : busy ? <TypingDots /> : null}
                </div>
              </div>
            );
          })}

          {status === "submitted" && (
            <div className="mr-auto flex max-w-[93%] gap-2">
              <Avatar src={AVATAR} name="Lía" size={24} className="mt-0.5" />
              <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-3 py-2">
                <TypingDots />
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {errText && (
          <div className="flex items-center justify-between gap-2 border-t border-border bg-red/10 px-4 py-2 text-xs text-red">
            <span>{errText}</span>
            {errKind === "generic" && (
              <button
                type="button"
                onClick={() => regenerate()}
                className="flex items-center gap-1 font-medium underline"
              >
                <RotateCcw size={12} />
                {t("assistant.retry")}
              </button>
            )}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="border-t border-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-3"
        >
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-white px-3 py-2 focus-within:border-navy-light focus-within:ring-2 focus-within:ring-navy-light/30">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(input);
                }
              }}
              placeholder={t("assistant.placeholder")}
              className="max-h-32 flex-1 resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || busy}
              aria-label={t("assistant.send")}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy text-white transition-opacity disabled:opacity-40"
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type UIMsg = { id: string; role: string; parts?: { type: string; text?: string }[] };

function textOf(m: UIMsg): string {
  return (m.parts ?? [])
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

function MarkdownMessage({ text }: { text: string }) {
  return (
    <div className="selectable space-y-2 leading-relaxed [&_a]:text-navy-light [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-2 [&_blockquote]:text-gray-500 [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12px] [&_li]:leading-relaxed [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_p]:m-0 [&_strong]:font-semibold [&_strong]:text-navy [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <p className="mt-2 text-[13px] font-semibold text-navy first:mt-0">{children}</p>
          ),
          h2: ({ children }) => (
            <p className="mt-2 text-[13px] font-semibold text-navy first:mt-0">{children}</p>
          ),
          h3: ({ children }) => (
            <p className="mt-2 text-[13px] font-semibold text-navy first:mt-0">{children}</p>
          ),
          hr: () => <hr className="my-2 border-border" />,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-lg bg-gray-100 p-2 text-[12px]">{children}</pre>
          ),
        }}
      >
        {text}
      </Markdown>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
    </span>
  );
}
