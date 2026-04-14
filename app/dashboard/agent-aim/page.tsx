"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Button,
  Dropdown,
  Modal,
  Spinner,
  Tooltip,
  useOverlayState,
} from "@heroui/react";
import clsx from "clsx";
import { Manrope } from "next/font/google";

import { BurguerButton } from "@/components/dashboard/navbar/burguer-button";
import { createClient } from "@/utils/supabase/client";

type Role = "user" | "assistant";

type Msg = {
  id: string;
  role: Role;
  content: string;
  images?: string[];
  attachmentNames?: string[];
  agentIds?: string[];
};

type ChatSession = {
  id: string;
  title: string;
  updatedAt: number;
  messages: Msg[];
};

type Agent = {
  id: string;
  name: string;
  cloud_run_url: string;
  description?: string;
};

type PendingUpload = {
  id: string;
  name: string;
  type: string;
  url: string;
};

const STORAGE_KEY = "agent-aim-chat-sessions-v1";
const aimFont = Manrope({ subsets: ["latin"] });

/** Set on redirect after auth so the first load focuses a new empty chat (query stripped on read). */
const AIM_FRESH_LOGIN_QP = "aimFresh";

/** Web Speech API (constructors not in all TS `dom` lib versions). */
type WebSpeechRecognitionEvent = {
  results: { length: number; [i: number]: { 0: { transcript: string } } };
};

type WebSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult: ((ev: WebSpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognitionConstructor():
  | (new () => WebSpeechRecognition)
  | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => WebSpeechRecognition;
    webkitSpeechRecognition?: new () => WebSpeechRecognition;
  };

  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function sessionTitleFromMessages(messages: Msg[]): string {
  const first = messages.find((m) => m.role === "user" && m.content.trim());

  if (!first) return "New chat";
  const t = first.content.trim().replace(/\s+/g, " ");

  return t.length > 56 ? `${t.slice(0, 55)}…` : t;
}

function formatSessionTime(ts: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(ts));
  } catch {
    return "";
  }
}

const IMAGE_REGEX =
  /(https?:\/\/[^\s\)]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp)(?:\?[^\s\)]*)?)|(https:\/\/storage\.googleapis\.com\/[^\s\)]+)/gi;

function getImagesFromText(text: string): string[] {
  if (!text) return [];
  // Heal fragmented URLs: remove newlines that break a path
  const healed = text.replace(
    /([a-zA-Z0-9\-\._~%:\/\?#\[\]@!$&'\(\)\*\+,;=])\n\s*([a-zA-Z0-9\-\._~%:\/\?#\[\]@!$&'\(\)\*\+,;=])/g,
    "$1$2",
  );

  return healed.match(IMAGE_REGEX) || [];
}

function extractSseDelta(line: string): string | null {
  const trimmed = line.trim();

  if (!trimmed.startsWith("data:")) return null;
  const payload = trimmed.slice(5).trim();

  if (payload === "[DONE]") return null;
  try {
    const json = JSON.parse(payload) as {
      choices?: Array<{ delta?: { content?: string } }>;
    };
    const chunk = json.choices?.[0]?.delta?.content;

    return typeof chunk === "string" ? chunk : null;
  } catch {
    return null;
  }
}

function IconHistory({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={22}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={22}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={20}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
      width={20}
    >
      <path d="M15 17H5a2 2 0 01-2-2v-1l1.2-1.2c.52-.52.8-1.22.8-1.96V9a6 6 0 1112 0v1.84c0 .74.3 1.44.82 1.96L19 14v1a2 2 0 01-2 2h-2" />
      <path d="M10 20a2 2 0 004 0" />
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={22}
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={22}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconMic({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={20}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={20}
    >
      <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z" />
      <path d="M19 10v1a7 7 0 01-14 0v-1M12 18v4M8 22h8" />
    </svg>
  );
}

function IconCloseRecording({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={20}
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={20}
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

const VOICE_BAR_COUNT = 28;

function VoiceWaveform({ stream }: { stream: MediaStream | null }) {
  const [heights, setHeights] = useState<number[]>(() =>
    Array.from({ length: VOICE_BAR_COUNT }, () => 0.12),
  );

  useEffect(() => {
    if (!stream) {
      let tick = 0;
      const id = window.setInterval(() => {
        tick += 1;
        setHeights(
          Array.from({ length: VOICE_BAR_COUNT }, (_, i) => {
            const wave =
              0.45 *
              Math.abs(Math.sin(tick * 0.12 + i * 0.42)) *
              (0.55 + 0.45 * Math.sin(tick * 0.05 + i * 0.2));

            return 0.1 + wave;
          }),
        );
      }, 45);

      return () => clearInterval(id);
    }

    let ctx: AudioContext | null = null;
    let raf = 0;
    let cancelled = false;

    const run = async () => {
      try {
        ctx = new AudioContext();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();

        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.72;
        src.connect(analyser);
        const buf = new Uint8Array(analyser.frequencyBinCount);

        const loop = () => {
          if (cancelled || !analyser) return;
          analyser.getByteFrequencyData(buf);
          const step = Math.max(1, Math.floor(buf.length / VOICE_BAR_COUNT));
          const next: number[] = [];

          for (let i = 0; i < VOICE_BAR_COUNT; i++) {
            let sum = 0;

            for (let j = 0; j < step; j++) {
              sum += buf[i * step + j] ?? 0;
            }
            const avg = sum / step / 255;

            next.push(0.1 + Math.pow(avg, 0.65) * 0.9);
          }
          setHeights(next);
          raf = requestAnimationFrame(loop);
        };

        loop();
      } catch {
        /* show idle bars */
      }
    };

    void run();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      void ctx?.close();
    };
  }, [stream]);

  return (
    <div
      aria-hidden
      className="flex min-h-[2.75rem] min-w-0 flex-1 items-center px-1"
    >
      <div className="flex h-10 min-w-0 flex-1 items-end justify-center gap-[2px] sm:gap-0.5">
        {heights.map((h, i) => (
          <div
            key={i}
            className="w-[2px] shrink-0 rounded-full bg-zinc-900 sm:w-[3px] dark:bg-zinc-100"
            style={{
              height: `${Math.max(4, Math.round(h * 34))}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function IconSend({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={18}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.25}
      viewBox="0 0 24 24"
      width={18}
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function IconBack({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={22}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={22}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconMore({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="currentColor"
      height={20}
      viewBox="0 0 24 24"
      width={20}
    >
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
    </svg>
  );
}

function IconShare({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={18}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={18}
    >
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
    </svg>
  );
}

function IconPhotosFiles({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={20}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={20}
    >
      <path d="M21.44 11.05l-8.49 8.49a5.5 5.5 0 01-7.78-7.78l8.84-8.84a3.5 3.5 0 114.95 4.95l-8.49 8.48a1.5 1.5 0 01-2.12-2.12l7.78-7.78" />
    </svg>
  );
}

function IconFileCard({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={18}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.9}
      viewBox="0 0 24 24"
      width={18}
    >
      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}

function IconAgentsMenu({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={20}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.65}
      viewBox="0 0 24 24"
      width={20}
    >
      <path d="M12 8V4H8" />
      <rect height="12" rx="2" width="16" x="4" y="8" />
      <path d="M9 14h.01M15 14h.01M9 18h6" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={17}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={17}
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function IconCopy({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={17}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={17}
    >
      <rect height="14" rx="2" ry="2" width="14" x="8" y="8" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function IconEditMessage({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={17}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={17}
    >
      <path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={18}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={18}
    >
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" />
    </svg>
  );
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={14}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
      width={14}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

async function shareChatSession(s: ChatSession): Promise<void> {
  const lines = s.messages.map(
    (m) => `${m.role === "user" ? "You" : "Agent Aim"}: ${m.content}`,
  );
  const text = lines.filter(Boolean).join("\n\n") || s.title;

  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title: s.title, text });

      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    }
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") return;
    console.error(e);
  }
}

function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;

    return v.toString(16);
  });
}

export default function AgentAimPage() {
  const initialIdRef = useRef<string | null>(null);

  if (initialIdRef.current === null) {
    initialIdRef.current = generateUUID();
  }

  const [sessions, setSessions] = useState<ChatSession[]>(() => [
    {
      id: initialIdRef.current!,
      title: "New chat",
      messages: [],
      updatedAt: Date.now(),
    },
  ]);
  const [activeId, setActiveId] = useState(() => initialIdRef.current!);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(
    null,
  );
  const [deleteChatLabel, setDeleteChatLabel] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Dynamic Agent Selection
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentBarIds, setAgentBarIds] = useState<string[]>([]);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [quickAgentsOpen, setQuickAgentsOpen] = useState(false);

  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId),
    [agents, selectedAgentId],
  );
  const agentBarAgents = useMemo(
    () =>
      agentBarIds
        .map((id) => agents.find((agent) => agent.id === id))
        .filter((agent): agent is Agent => Boolean(agent)),
    [agentBarIds, agents],
  );

  useEffect(() => {
    const fetchAgents = async () => {
      setAgentsLoading(true);
      const supabase = createClient();

      try {
        // Fetch from both tables
        const [myAgentsRes, marketAgentsRes] = await Promise.all([
          supabase
            .from("adk_agents")
            .select("id, name, cloud_run_url, description"),
          supabase
            .from("agent_market")
            .select("id, name, cloud_run_url, description"),
        ]);

        const combined = [
          ...(myAgentsRes.data || []),
          ...(marketAgentsRes.data || []),
        ];

        // Remove duplicates by ID or URL if necessary, but here we just combine
        setAgents(combined);

        if (combined.length > 0) {
          setSelectedAgentId(combined[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch agents:", err);
      } finally {
        setAgentsLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const deleteDialog = useOverlayState({
    onOpenChange: (open) => {
      if (!open) {
        setSessionToDelete(null);
        setDeleteChatLabel("");
      }
    },
  });

  const endRef = useRef<HTMLDivElement>(null);
  const historyListRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const composerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const inlineEditTextareaRef = useRef<HTMLTextAreaElement>(null);
  const quickMenuRef = useRef<HTMLDivElement>(null);
  const quickMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const copyFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current) {
        clearTimeout(copyFeedbackTimeoutRef.current);
      }
    };
  }, []);

  const recognitionRef = useRef<WebSpeechRecognition | null>(null);
  const voiceInputPrefixRef = useRef("");
  const [listening, setListening] = useState(false);
  const [voiceStream, setVoiceStream] = useState<MediaStream | null>(null);

  const tearDownVoiceMedia = useCallback(() => {
    setVoiceStream((s) => {
      s?.getTracks().forEach((t) => t.stop());

      return null;
    });
    setListening(false);
  }, []);

  const stopVoiceRecognition = useCallback(() => {
    const rec = recognitionRef.current;

    recognitionRef.current = null;
    try {
      rec?.stop();
    } catch {
      /* */
    }
    try {
      rec?.abort?.();
    } catch {
      /* */
    }
    tearDownVoiceMedia();
  }, [tearDownVoiceMedia]);

  const cancelVoiceInput = useCallback(() => {
    setInput(voiceInputPrefixRef.current);
    const rec = recognitionRef.current;

    recognitionRef.current = null;
    try {
      rec?.abort?.();
    } catch {
      try {
        rec?.stop();
      } catch {
        /* */
      }
    }
    tearDownVoiceMedia();
  }, [tearDownVoiceMedia]);

  const confirmVoiceInput = useCallback(() => {
    const rec = recognitionRef.current;

    if (!rec) {
      tearDownVoiceMedia();

      return;
    }
    try {
      rec.stop();
    } catch {
      recognitionRef.current = null;
      tearDownVoiceMedia();
    }
  }, [tearDownVoiceMedia]);

  useEffect(() => {
    return () => {
      const rec = recognitionRef.current;

      recognitionRef.current = null;
      try {
        rec?.abort?.();
      } catch {
        /* */
      }
      try {
        rec?.stop();
      } catch {
        /* */
      }
      setVoiceStream((s) => {
        s?.getTracks().forEach((t) => t.stop());

        return null;
      });
    };
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);

        if (params.get(AIM_FRESH_LOGIN_QP) === "1") {
          params.delete(AIM_FRESH_LOGIN_QP);
          const q = params.toString();

          window.history.replaceState(
            null,
            "",
            `${window.location.pathname}${q ? `?${q}` : ""}${window.location.hash}`,
          );
        }
      }

      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        setHydrated(true);

        return;
      }
      const data = JSON.parse(raw) as {
        sessions?: ChatSession[];
        activeId?: string;
      };

      if (
        Array.isArray(data.sessions) &&
        data.sessions.every(
          (s) =>
            s &&
            typeof s.id === "string" &&
            Array.isArray(s.messages) &&
            typeof s.updatedAt === "number",
        )
      ) {
        const loaded = data.sessions.filter((s) => s.messages.length > 0);

        if (loaded.length === 0) {
          setHydrated(true);

          return;
        }
        const draftId = crypto.randomUUID();

        setSessions([
          ...loaded,
          {
            id: draftId,
            title: "New chat",
            messages: [],
            updatedAt: Date.now(),
          },
        ]);
        setActiveId(draftId);
      }
    } catch {
      /* keep default */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const persisted = sessions.filter((s) => s.messages.length > 0);
      const activeSession = sessions.find((s) => s.id === activeId);
      const persistedActive =
        activeSession && activeSession.messages.length > 0
          ? activeId
          : undefined;

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          sessions: persisted,
          ...(persistedActive ? { activeId: persistedActive } : {}),
        }),
      );
    } catch {
      /* quota / private mode */
    }
  }, [sessions, activeId, hydrated]);

  const messages = useMemo(
    () => sessions.find((s) => s.id === activeId)?.messages ?? [],
    [sessions, activeId],
  );

  const updateActiveMessages = useCallback(
    (updater: Msg[] | ((prev: Msg[]) => Msg[])) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeId) return s;
          const next =
            typeof updater === "function" ? updater(s.messages) : updater;

          return {
            ...s,
            messages: next,
            title: sessionTitleFromMessages(next),
            updatedAt: Date.now(),
          };
        }),
      );
    },
    [activeId],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, editingMessageId]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  }, []);

  const copyMessageText = useCallback(
    async (messageId: string, text: string) => {
      if (!text) return;
      try {
        if (
          typeof navigator !== "undefined" &&
          navigator.clipboard?.writeText
        ) {
          await navigator.clipboard.writeText(text);
          if (copyFeedbackTimeoutRef.current) {
            clearTimeout(copyFeedbackTimeoutRef.current);
          }
          setCopiedMessageId(messageId);
          copyFeedbackTimeoutRef.current = setTimeout(() => {
            setCopiedMessageId((id) => (id === messageId ? null : id));
            copyFeedbackTimeoutRef.current = null;
          }, 2000);
        }
      } catch {
        /* ignore */
      }
    },
    [],
  );

  const cancelInlineEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingDraft("");
  }, []);

  const startVoiceInput = useCallback(async () => {
    if (loading || editingMessageId || recognitionRef.current) return;

    const Ctor = getSpeechRecognitionConstructor();

    if (!Ctor) {
      setError(
        "Voice input needs a supported browser (e.g. Chrome or Edge on desktop).",
      );

      return;
    }

    setError(null);
    voiceInputPrefixRef.current = input;

    let stream: MediaStream | null = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      /* animated waveform fallback if mic denied for analyser */
    }
    setVoiceStream(stream);

    const rec = new Ctor();

    rec.lang =
      (typeof navigator !== "undefined" && navigator.language) || "en-US";
    rec.interimResults = true;
    rec.continuous = false;

    rec.onresult = (event: WebSpeechRecognitionEvent) => {
      let spoken = "";

      for (let i = 0; i < event.results.length; i++) {
        spoken += event.results[i]?.[0]?.transcript ?? "";
      }
      const prefix = voiceInputPrefixRef.current;
      const combined =
        prefix && spoken && !/\s$/.test(prefix) && !/^\s/.test(spoken)
          ? `${prefix} ${spoken}`
          : `${prefix}${spoken}`;

      setInput(combined);
    };

    const onSessionEnd = () => {
      recognitionRef.current = null;
      tearDownVoiceMedia();
    };

    rec.onerror = onSessionEnd;
    rec.onend = onSessionEnd;

    recognitionRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      recognitionRef.current = null;
      tearDownVoiceMedia();
      setError("Could not start microphone. Check permissions.");
    }
  }, [input, loading, editingMessageId, tearDownVoiceMedia]);

  const startInlineEdit = useCallback(
    (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId);

      if (!msg || msg.role !== "user" || !msg.content.trim()) return;
      stop();
      stopVoiceRecognition();
      setError(null);
      setEditingMessageId(messageId);
      setEditingDraft(msg.content);
    },
    [messages, stop, stopVoiceRecognition],
  );

  useEffect(() => {
    if (!editingMessageId) return;
    requestAnimationFrame(() => {
      const el = inlineEditTextareaRef.current;

      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
  }, [editingMessageId]);

  const msgActionBtn =
    "flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-black/[0.06] dark:hover:bg-white/10 data-[focus-visible]:ring-2 data-[focus-visible]:ring-focus";

  const runStreamChat = useCallback(
    async (historyThroughUser: Msg[]) => {
      setError(null);
      const assistantId = crypto.randomUUID();
      const apiMessages = historyThroughUser.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      updateActiveMessages([
        ...historyThroughUser,
        { id: assistantId, role: "assistant", content: "" },
      ]);
      setLoading(true);

      const controller = new AbortController();

      abortRef.current = controller;

      try {
        const res = await fetch("/api/agent-aim/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal: controller.signal,
          body: JSON.stringify({
            messages: apiMessages,
            agentUrl: selectedAgent?.cloud_run_url,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();

          updateActiveMessages((prev) =>
            prev.filter((m) => m.id !== assistantId),
          );
          setError(errText || `Request failed (${res.status})`);

          return;
        }

        if (!res.body) {
          updateActiveMessages((prev) =>
            prev.filter((m) => m.id !== assistantId),
          );
          setError("No response stream");

          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");

          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const delta = extractSseDelta(line);

            if (delta) {
              updateActiveMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + delta }
                    : m,
                ),
              );
            }
          }
        }

        if (buffer.trim()) {
          const delta = extractSseDelta(buffer);

          if (delta) {
            updateActiveMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + delta } : m,
              ),
            );
          }
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        updateActiveMessages((prev) =>
          prev.filter((m) => m.id !== assistantId),
        );
        setError(e instanceof Error ? e.message : "Request failed");
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [updateActiveMessages],
  );

  const confirmInlineEdit = useCallback(async () => {
    const text = editingDraft.trim();

    if (!editingMessageId || !text) return;
    const idx = messages.findIndex((m) => m.id === editingMessageId);

    if (idx === -1) return;

    const originalMsg = messages[idx];

    stop();
    stopVoiceRecognition();
    setError(null);
    const before = messages.slice(0, idx);
    const isOriginalUser = originalMsg?.role === "user";
    const userMsg: Msg = {
      id: generateUUID(),
      role: "user",
      content: text,
      images: isOriginalUser ? originalMsg.images : undefined,
      attachmentNames: isOriginalUser ? originalMsg.attachmentNames : undefined,
      agentIds: isOriginalUser ? originalMsg.agentIds : undefined,
    };

    cancelInlineEdit();
    await runStreamChat([...before, userMsg]);
  }, [
    editingDraft,
    editingMessageId,
    messages,
    stop,
    stopVoiceRecognition,
    cancelInlineEdit,
    runStreamChat,
  ]);

  const send = useCallback(async () => {
    if (editingMessageId) return;
    stopVoiceRecognition();
    const text = input.trim();
    const attachmentNames = pendingUploads.map((upload) => upload.name);
    const imageUrls = pendingUploads
      .filter((upload) => upload.type.startsWith("image/"))
      .map((upload) => upload.url);
    const nonImageNames = pendingUploads
      .filter((upload) => !upload.type.startsWith("image/"))
      .map((upload) => upload.name);
    const content = [
      text,
      imageUrls.length > 0 ? imageUrls.join("\n") : "",
      nonImageNames.length > 0
        ? `[Attached files] ${nonImageNames.join(", ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    if (!content || loading) return;

    setInput("");
    setPendingUploads([]);

    const userMsg: Msg = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      images: imageUrls.length > 0 ? imageUrls : undefined,
      attachmentNames: attachmentNames.length > 0 ? attachmentNames : undefined,
      agentIds: agentBarIds.length > 0 ? [...agentBarIds] : undefined,
    };

    await runStreamChat([...messages, userMsg]);
  }, [
    agentBarIds,
    editingMessageId,
    input,
    loading,
    messages,
    pendingUploads,
    runStreamChat,
    stopVoiceRecognition,
  ]);

  const newChat = useCallback(() => {
    stop();
    stopVoiceRecognition();
    setError(null);
    setInput("");
    setPendingUploads([]);
    setEditingMessageId(null);
    setEditingDraft("");
    let nextActiveId: string | null = null;

    setSessions((prev) => {
      const nonEmpty = prev.filter((s) => s.messages.length > 0);
      const current = prev.find((s) => s.id === activeId);

      if (current && current.messages.length === 0) {
        nextActiveId = current.id;

        return [...nonEmpty, current];
      }
      const id = crypto.randomUUID();

      nextActiveId = id;

      return [
        ...nonEmpty,
        { id, title: "New chat", messages: [], updatedAt: Date.now() },
      ];
    });
    if (nextActiveId) setActiveId(nextActiveId);
  }, [stop, stopVoiceRecognition, activeId]);

  const openHistory = useCallback(() => setHistoryOpen(true), []);
  const closeHistory = useCallback(() => setHistoryOpen(false), []);

  const newChatFromHistory = useCallback(() => {
    newChat();
    closeHistory();
  }, [newChat, closeHistory]);

  const selectSession = useCallback(
    (id: string) => {
      stop();
      stopVoiceRecognition();
      setPendingUploads([]);
      setEditingMessageId(null);
      setEditingDraft("");
      setSessions((prev) => {
        const nonEmpty = prev.filter((s) => s.messages.length > 0);
        const empties = prev.filter((s) => s.messages.length === 0);
        const oneDraft = empties.length ? [empties[empties.length - 1]] : [];

        return [...nonEmpty, ...oneDraft];
      });
      setActiveId(id);
      setHistoryOpen(false);
      setError(null);
    },
    [stop, stopVoiceRecognition],
  );

  /** Only chats with at least one message appear in history */
  const historySessions = useMemo(
    () =>
      sessions
        .filter((s) => s.messages.length > 0)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [sessions],
  );

  useEffect(() => {
    if (!historyOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleteDialog.isOpen) closeHistory();
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [historyOpen, closeHistory, deleteDialog.isOpen]);

  useEffect(() => {
    if (messages.length > 0) {
      setQuickMenuOpen(false);
      setQuickAgentsOpen(false);
    }
  }, [messages.length]);

  useEffect(() => {
    setAgentBarIds((prev) =>
      prev.filter((id) => agents.some((agent) => agent.id === id)),
    );
  }, [agents]);

  useEffect(() => {
    if (!quickMenuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (quickMenuRef.current?.contains(target)) return;
      if (quickMenuTriggerRef.current?.contains(target)) return;
      setQuickMenuOpen(false);
      setQuickAgentsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setQuickMenuOpen(false);
      setQuickAgentsOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [quickMenuOpen]);

  const requestDelete = useCallback(
    (s: ChatSession) => {
      setDeleteChatLabel(s.title);
      setSessionToDelete(s);
      closeHistory();
      deleteDialog.open();
    },
    [deleteDialog, closeHistory],
  );

  const confirmDelete = useCallback(() => {
    if (!sessionToDelete) return;
    const deletedId = sessionToDelete.id;

    deleteDialog.close();

    setSessions((prev) => {
      const next = prev.filter((x) => x.id !== deletedId);
      const fallback =
        next.length === 0
          ? [
              {
                id: crypto.randomUUID(),
                title: "New chat",
                messages: [],
                updatedAt: Date.now(),
              },
            ]
          : next;

      setActiveId((aid) => (aid === deletedId ? fallback[0].id : aid));

      return fallback;
    });
  }, [sessionToDelete, deleteDialog]);

  const applyAgentSelection = useCallback(
    (nextAgentId: string) => {
      if (!nextAgentId || nextAgentId === selectedAgentId) return;
      setSelectedAgentId(nextAgentId);
      const activeSession = sessions.find((s) => s.id === activeId);

      if (activeSession && activeSession.messages.length > 0) {
        const newId = crypto.randomUUID();

        setSessions((prev) => [
          ...prev,
          {
            id: newId,
            title: "New chat",
            messages: [],
            updatedAt: Date.now(),
          },
        ]);
        setActiveId(newId);
      }
    },
    [activeId, selectedAgentId, sessions],
  );

  const pinAgentToBar = useCallback((agentId: string) => {
    if (!agentId) return;
    setAgentBarIds((prev) =>
      prev.includes(agentId) ? prev : [...prev, agentId],
    );
  }, []);

  const removeAgentFromBar = useCallback((agentId: string) => {
    if (!agentId) return;
    setAgentBarIds((prev) => {
      const next = prev.filter((id) => id !== agentId);

      setSelectedAgentId((current) =>
        current === agentId ? (next[0] ?? null) : current,
      );

      return next;
    });
  }, []);

  const removePendingUpload = useCallback((uploadId: string) => {
    if (!uploadId) return;
    setPendingUploads((prev) => {
      const upload = prev.find((item) => item.id === uploadId);

      if (upload) {
        try {
          URL.revokeObjectURL(upload.url);
        } catch {
          // Ignore failed revocations for stale object URLs.
        }
      }

      return prev.filter((item) => item.id !== uploadId);
    });
  }, []);
  const appendPendingUploads = useCallback((files: File[]) => {
    if (files.length === 0) return;
    setPendingUploads((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type || "application/octet-stream",
        url: URL.createObjectURL(file),
      })),
    ]);
  }, []);
  const handleComposerDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (loading || !!editingMessageId) return;
      if (!Array.from(e.dataTransfer.types).includes("Files")) return;
      e.preventDefault();
      e.stopPropagation();
      dragDepthRef.current += 1;
      setIsDragActive(true);
    },
    [editingMessageId, loading],
  );
  const handleComposerDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (loading || !!editingMessageId) return;
      if (!Array.from(e.dataTransfer.types).includes("Files")) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
      if (!isDragActive) setIsDragActive(true);
    },
    [editingMessageId, isDragActive, loading],
  );
  const handleComposerDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (loading || !!editingMessageId) return;
      if (!Array.from(e.dataTransfer.types).includes("Files")) return;
      e.preventDefault();
      e.stopPropagation();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) {
        setIsDragActive(false);
      }
    },
    [editingMessageId, loading],
  );
  const handleComposerDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (loading || !!editingMessageId) return;
      if (!Array.from(e.dataTransfer.types).includes("Files")) return;
      e.preventDefault();
      e.stopPropagation();
      dragDepthRef.current = 0;
      setIsDragActive(false);
      appendPendingUploads(Array.from(e.dataTransfer.files || []));
    },
    [appendPendingUploads, editingMessageId, loading],
  );

  const hasMessages = messages.length > 0;

  const timelineMessages = messages.filter(
    (m) => m.content.trim().length > 0 || m.role === "assistant",
  );
  const agentNameById = useMemo(
    () => new Map(agents.map((agent) => [agent.id, agent.name])),
    [agents],
  );

  const toolbarBtn =
    "flex h-10 w-10 items-center justify-center rounded-full text-foreground/75 transition-colors hover:bg-[var(--sidebar-item-hover)] hover:text-foreground dark:hover:bg-white/10";
  const topUtilityBtn =
    "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-divider/70 bg-[var(--surface)] text-foreground/75 transition-colors hover:bg-[var(--sidebar-item-hover)] hover:text-foreground";
  const voiceChromeBtn =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-900 transition-colors hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-white/10";

  const composerSection = () => (
    <div className="mx-auto w-full max-w-[44rem]">
      {listening ? (
        <span className="sr-only" id="agent-aim-voice-status">
          Recording - speak, then press done or cancel.
        </span>
      ) : (
        <label className="sr-only" htmlFor="agent-aim-input">
          Ask anything
        </label>
      )}
      <input
        ref={fileInputRef}
        aria-hidden
        multiple
        accept=".pdf,.doc,.docx,.txt,.csv,.ppt,.pptx,image/*"
        className="hidden"
        tabIndex={-1}
        type="file"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          appendPendingUploads(files);
          e.currentTarget.value = "";
        }}
      />
      <div
        className={clsx(
          "flex gap-1 rounded-2xl border px-1.5 py-1",
          listening
            ? "min-h-[3.4rem] border-zinc-200/90 bg-white shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12),0_4px_16px_-4px_rgba(0,0,0,0.06)] dark:border-white/12 dark:bg-zinc-900 dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)]"
            : clsx(
                pendingUploads.length > 0 || agentBarAgents.length > 0
                  ? "min-h-[3.4rem] items-end"
                  : "min-h-[2.95rem] items-center",
                "border-divider bg-[var(--surface)]",
                "shadow-[0_16px_44px_-24px_rgba(14,21,47,0.35),0_8px_20px_-14px_rgba(17,24,39,0.2)]",
                "dark:border-white/[0.08] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)]",
              ),
          isDragActive &&
            "border-[#9ecbff] bg-[#f4f9ff] ring-2 ring-[#9ecbff]/45",
        )}
        onDragEnter={handleComposerDragEnter}
        onDragLeave={handleComposerDragLeave}
        onDragOver={handleComposerDragOver}
        onDrop={handleComposerDrop}
      >
        <div
          className={clsx(
            "relative shrink-0",
            pendingUploads.length > 0 || agentBarAgents.length > 0
              ? "self-end"
              : "self-center",
          )}
        >
          <button
            ref={quickMenuTriggerRef}
            aria-expanded={quickMenuOpen}
            aria-label="Add photos, files, or agents"
            className={clsx(
              "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full outline-none transition-colors",
              listening
                ? "text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-white/10"
                : "text-foreground/80 hover:bg-[var(--sidebar-item-hover)] hover:text-foreground",
            )}
            type="button"
            onClick={() => {
              setQuickMenuOpen((prev) => {
                const next = !prev;

                if (!next) setQuickAgentsOpen(false);

                return next;
              });
            }}
          >
            <IconPlus className={listening ? "" : "opacity-90"} />
          </button>
          {quickMenuOpen ? (
            <div
              ref={quickMenuRef}
              className={clsx(
                "absolute left-0 z-40 flex gap-2",
                hasMessages
                  ? "items-end bottom-[calc(100%+0.75rem)]"
                  : "items-start top-[calc(100%+0.75rem)]",
              )}
            >
              <div className="min-w-[13.5rem] rounded-2xl border border-divider bg-[var(--overlay)] p-1 shadow-[var(--overlay-shadow)]">
                <button
                  className="group flex w-full items-center gap-3 rounded-xl py-2.5 pl-2 pr-3 text-left text-sm font-medium text-default-900 transition-colors hover:bg-[#eef6ff] hover:text-[#0a63ff]"
                  type="button"
                  onClick={() => {
                    setQuickMenuOpen(false);
                    setQuickAgentsOpen(false);
                    fileInputRef.current?.click();
                  }}
                >
                  <IconPhotosFiles className="shrink-0 text-default-600 transition-colors group-hover:text-[#0a63ff] dark:text-default-400" />
                  <span>Add photos &amp; files</span>
                </button>
                <button
                  className="group flex w-full items-center justify-between rounded-xl py-2.5 pl-2 pr-3 text-left text-sm font-medium text-default-900 transition-colors hover:bg-[#eef6ff] hover:text-[#0a63ff]"
                  type="button"
                  onClick={() => setQuickAgentsOpen((prev) => !prev)}
                >
                  <span className="flex items-center gap-3">
                    <IconAgentsMenu className="shrink-0 text-default-600 transition-colors group-hover:text-[#0a63ff] dark:text-default-400" />
                    <span>Add agents</span>
                  </span>
                  <IconChevronDown
                    className={clsx(
                      "h-3.5 w-3.5 transition-transform transition-colors group-hover:text-[#0a63ff]",
                      quickAgentsOpen ? "rotate-90" : "-rotate-90",
                    )}
                  />
                </button>
              </div>
              {quickAgentsOpen ? (
                <div className="min-w-[12.75rem] rounded-2xl border border-divider bg-[var(--overlay)] p-1 shadow-[var(--overlay-shadow)]">
                  <p className="px-2.5 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-default-500">
                    Available Agents
                  </p>
                  <div className="flex max-h-60 flex-col gap-0.5 overflow-y-auto pr-0.5">
                    {agents.map((agent) => (
                      <button
                        key={agent.id}
                        className={clsx(
                          "flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-sm transition-colors",
                          agentBarIds.includes(agent.id)
                            ? "bg-[var(--sidebar-item-active)] text-default-900"
                            : "text-default-800 hover:bg-[#eef6ff] hover:text-[#0a63ff]",
                        )}
                        type="button"
                        onClick={() => {
                          applyAgentSelection(agent.id);
                          pinAgentToBar(agent.id);
                          setQuickAgentsOpen(false);
                          setQuickMenuOpen(false);
                        }}
                      >
                        <span className="line-clamp-1">{agent.name}</span>
                        {agentBarIds.includes(agent.id) ? (
                          <IconCheck className="h-3.5 w-3.5" />
                        ) : null}
                      </button>
                    ))}
                    {agentsLoading ? (
                      <div className="flex items-center gap-2 px-2.5 py-2 text-xs text-default-500">
                        <Spinner size="sm" /> Loading agents...
                      </div>
                    ) : null}
                    {!agentsLoading && agents.length === 0 ? (
                      <p className="px-2.5 py-2 text-xs text-default-500">
                        No agents found.
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {listening ? (
          <>
            <VoiceWaveform stream={voiceStream} />
            <div className="flex shrink-0 items-center gap-0 pr-0.5">
              <button
                aria-label="Cancel voice input"
                className={voiceChromeBtn}
                title="Cancel"
                type="button"
                onClick={cancelVoiceInput}
              >
                <IconCloseRecording />
              </button>
              <button
                aria-label="Done recording"
                className={voiceChromeBtn}
                title="Done"
                type="button"
                onClick={confirmVoiceInput}
              >
                <IconCheck />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              {pendingUploads.length > 0 ? (
                <div className="-ml-9 mb-1.5 mt-0.5 flex flex-wrap gap-2 pt-0">
                  {pendingUploads.map((upload) => (
                    <div
                      key={upload.id}
                      className="flex w-fit max-w-[min(34rem,94%)] items-center gap-2 rounded-2xl border border-divider bg-white px-2 py-2"
                    >
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0a8fff] text-white">
                        <IconFileCard className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 block text-sm font-semibold text-default-900">
                          {upload.name}
                        </span>
                        <span className="line-clamp-1 block text-xs text-default-500">
                          {upload.type.startsWith("image/") ? "Image" : "Document"}
                        </span>
                      </span>
                      <button
                        aria-label={`Remove ${upload.name}`}
                        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black text-[11px] font-bold leading-none text-white transition-opacity hover:opacity-90"
                        type="button"
                        onClick={() => removePendingUpload(upload.id)}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              <textarea
                ref={composerTextareaRef}
                className={clsx(
                  "max-h-40 w-full resize-none bg-transparent px-2 py-2.5 text-[15px] leading-snug text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50",
                  agentBarAgents.length > 0 || pendingUploads.length > 0
                    ? "min-h-[2.2rem]"
                    : "min-h-[2.75rem]",
                )}
                disabled={loading || !!editingMessageId}
                id="agent-aim-input"
                placeholder="Ask anything..."
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
              />
              {agentBarAgents.length > 0 ? (
                <div className="mt-1 flex flex-wrap items-center gap-1 px-2 pb-1">
                  {agentBarAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className="inline-flex items-center gap-1 rounded-xl border border-[#cfe3ff] bg-[#eef6ff] px-3 py-1.5 text-[11px] font-semibold text-black"
                    >
                      <button
                        className="inline-flex items-center gap-1 text-black"
                        type="button"
                        onClick={() => setSelectedAgentId(agent.id)}
                      >
                        <IconAgentsMenu className="h-3.5 w-3.5 text-black" />
                        <span className="line-clamp-1 max-w-[12rem]">
                          {agent.name}
                        </span>
                      </button>
                      <button
                        aria-label={`Remove ${agent.name}`}
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold leading-none text-black transition-colors hover:bg-black/10"
                        type="button"
                        onClick={() => removeAgentFromBar(agent.id)}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-0.5 pr-0.5">
              {loading ? (
                <button
                  className="rounded-full px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-[var(--sidebar-item-hover)] hover:text-foreground"
                  type="button"
                  onClick={stop}
                >
                  Stop
                </button>
              ) : null}
              <button
                aria-label="Voice input"
                className={clsx(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                  "text-foreground/80 hover:bg-[var(--sidebar-item-hover)] hover:text-foreground",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                )}
                disabled={loading || !!editingMessageId}
                title="Speak to type (uses your browser's speech recognition)"
                type="button"
                onClick={() => void startVoiceInput()}
              >
                <IconMic />
              </button>
              <button
                aria-label="Send message"
                className={clsx(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-opacity",
                  "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm",
                  "disabled:cursor-not-allowed disabled:opacity-35 hover:opacity-90",
                )}
                disabled={
                  loading ||
                  !!editingMessageId ||
                  (!input.trim() && pendingUploads.length === 0)
                }
                type="button"
                onClick={() => void send()}
              >
                <IconSend />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={clsx(
        aimFont.className,
        "-m-4 md:-m-8 flex min-h-0 flex-1 flex-col overflow-hidden bg-[#fbfdff] dark:bg-[var(--background)]",
      )}
    >
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#fbfdff] dark:bg-[var(--background)]">
        <div
          aria-hidden={false}
          className="pointer-events-none absolute inset-x-0 top-0 z-10 border-b border-divider/70 bg-[#fbfdff]/96 backdrop-blur-sm dark:bg-[var(--background)]/92"
        >
          <div className="flex h-14 items-center justify-between px-4 sm:px-8 md:justify-end">
            <div className="pointer-events-auto md:hidden">
              <BurguerButton variant="navbar" />
            </div>
            <div className="pointer-events-auto flex items-center gap-1.5">
              <button
                aria-label="Notifications"
                className={topUtilityBtn}
                type="button"
              >
                <IconBell />
              </button>
              <button
                aria-label="Chat history"
                className={topUtilityBtn}
                type="button"
                onClick={openHistory}
              >
                <IconHistory className="h-4 w-4" />
              </button>
              <button
                aria-label="New chat"
                className={topUtilityBtn}
                type="button"
                onClick={newChat}
              >
                <IconPlus className="h-4 w-4" />
              </button>
              <button
                className="rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-background shadow-sm transition-opacity hover:opacity-90"
                type="button"
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#fbfdff] px-4 pb-4 pt-16 dark:bg-[var(--background)] sm:px-8">
          {!hasMessages ? (
            <div className="flex min-h-full flex-col items-center justify-center bg-[#fbfdff] px-2 py-10 dark:bg-[var(--background)]">
              <div className="mx-auto w-full max-w-3xl">
                {composerSection()}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 pb-6 pt-2">
              {timelineMessages.map((m) => {
                const copyable =
                  m.role === "assistant"
                    ? m.content.length > 0
                    : m.content.trim().length > 0;
                const isEditingUser =
                  m.role === "user" && editingMessageId === m.id;
                const copied = copiedMessageId === m.id;
                const attachedAgentNames = (m.agentIds ?? [])
                  .map((id) => agentNameById.get(id))
                  .filter((name): name is string => Boolean(name));
                const detectedUserImageUrls =
                  m.role === "user"
                    ? Array.from(
                        new Set([...(m.images || []), ...getImagesFromText(m.content)]),
                      )
                    : [];
                const attachedFileNames =
                  m.role === "user"
                    ? (m.attachmentNames?.length
                        ? m.attachmentNames
                        : detectedUserImageUrls.map(
                            (_url, idx) => `Image ${idx + 1}`,
                          ))
                    : [];
                const hasAttachedFiles =
                  m.role === "user" && attachedFileNames.length > 0;
                const visibleUserContent =
                  m.role === "user"
                    ? m.content
                        .replace(IMAGE_REGEX, "")
                        .replace(/\[Attached files\][^\n]*/g, "")
                        .trim()
                    : m.content;
                const hasAttachedAgents =
                  m.role === "user" && attachedAgentNames.length > 0;

                return (
                  <div
                    key={m.id}
                    className={clsx(
                      "group/message flex w-full flex-col gap-1",
                      m.role === "user" ? "items-end" : "items-start",
                    )}
                  >
                    {isEditingUser ? (
                      <div
                        className={clsx(
                          "w-full max-w-full rounded-3xl border border-divider px-4 pb-3 pt-3",
                          "bg-default-100 shadow-sm dark:bg-white/[0.06]",
                        )}
                      >
                        <label className="sr-only" htmlFor={`edit-msg-${m.id}`}>
                          Edit message
                        </label>
                        <textarea
                          ref={inlineEditTextareaRef}
                          className="min-h-[4.5rem] w-full resize-y bg-transparent text-sm leading-relaxed text-default-900 outline-none placeholder:text-default-400 dark:text-default-100"
                          disabled={loading}
                          id={`edit-msg-${m.id}`}
                          rows={4}
                          value={editingDraft}
                          onChange={(e) => setEditingDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              e.preventDefault();
                              cancelInlineEdit();
                            }
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              void confirmInlineEdit();
                            }
                          }}
                        />
                        <div className="mt-3 flex flex-wrap justify-end gap-2">
                          <button
                            className={clsx(
                              "rounded-full border border-divider bg-[var(--background)] px-4 py-2 text-sm font-medium",
                              "text-default-900 shadow-sm transition-colors hover:bg-default-100 dark:hover:bg-white/10",
                            )}
                            type="button"
                            onClick={cancelInlineEdit}
                          >
                            Cancel
                          </button>
                          <button
                            className={clsx(
                              "rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm",
                              "transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40",
                            )}
                            disabled={!editingDraft.trim() || loading}
                            type="button"
                            onClick={() => void confirmInlineEdit()}
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className={clsx(
                            "whitespace-pre-wrap",
                            m.role === "user"
                              ? "w-fit max-w-[min(92%,56rem)] rounded-[2rem] border border-[#d7e9fb] bg-[#eef7ff] px-5 py-3 text-sm font-medium leading-relaxed text-default-900 shadow-sm"
                              : "w-full rounded-none border-0 bg-transparent px-0 py-0 text-[1.02rem] leading-8 text-default-900 shadow-none",
                          )}
                        >
                          {hasAttachedAgents ? (
                            <>
                              {visibleUserContent ? (
                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-default-800">
                                  {visibleUserContent}
                                </p>
                              ) : null}
                              {hasAttachedFiles ? (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {attachedFileNames.map((fileName, idx) => (
                                    <span
                                      key={`${m.id}-file-${fileName}-${idx}`}
                                      className="inline-flex items-center rounded-md border border-[#cfe3ff] bg-[#eef6ff] px-2 py-0.5 text-[10px] font-semibold text-black"
                                    >
                                      {fileName}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {attachedAgentNames.map((agentName, idx) => (
                                  <span
                                    key={`${m.id}-${agentName}-${idx}`}
                                    className={clsx(
                                      "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em]",
                                      idx % 3 === 0
                                        ? "border-orange-200 bg-orange-100/80 text-orange-700"
                                        : idx % 3 === 1
                                          ? "border-emerald-200 bg-emerald-100/80 text-emerald-700"
                                          : "border-blue-200 bg-blue-100/80 text-blue-700",
                                    )}
                                  >
                                    {agentName}
                                  </span>
                                ))}
                              </div>
                            </>
                          ) : (
                            (m.role === "user" ? visibleUserContent : m.content) ||
                            (m.role === "assistant" && loading ? (
                              <span className="inline-flex items-center gap-2 text-muted-foreground">
                                <Spinner size="sm" /> Thinking…
                              </span>
                            ) : null)
                          )}
                          {!hasAttachedAgents && hasAttachedFiles ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {attachedFileNames.map((fileName, idx) => (
                                <span
                                  key={`${m.id}-file-standalone-${fileName}-${idx}`}
                                  className="inline-flex items-center rounded-md border border-[#cfe3ff] bg-[#eef6ff] px-2 py-0.5 text-[10px] font-semibold text-black"
                                >
                                  {fileName}
                                </span>
                              ))}
                            </div>
                          ) : null}

                          {/* Render images from content or Msg.images */}
                          {(() => {
                            if (m.role === "user") return null;
                            const detectedUrls = getImagesFromText(m.content);
                            const combined = Array.from(
                              new Set([...(m.images || []), ...detectedUrls]),
                            );

                            if (combined.length === 0) return null;

                            return (
                              <div className="mt-3 flex flex-col gap-3">
                                {combined.map((url, idx) => (
                                  <div
                                    key={idx}
                                    className="overflow-hidden rounded-lg border border-divider/50 shadow-sm bg-black/5 min-h-[40px] flex items-center justify-center"
                                  >
                                    <img
                                      alt="Attachment"
                                      className="max-w-full h-auto object-contain block hover:scale-[1.02] transition-transform duration-300"
                                      loading="lazy"
                                      src={url}
                                      onError={(e) => {
                                        // If we're loading, the URL might still be incomplete
                                        if (!loading) {
                                          (
                                            e.target as HTMLImageElement
                                          ).parentElement!.style.display =
                                            "none";
                                        }
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                        {copyable ? (
                          <div
                            className={clsx(
                              "flex items-center gap-0.5 transition-opacity duration-150",
                              "opacity-100 md:opacity-0 md:group-hover/message:opacity-100 md:group-focus-within/message:opacity-100",
                              m.role === "user"
                                ? "justify-end pr-0.5"
                                : "justify-start pl-0.5",
                            )}
                          >
                            <Tooltip>
                              <Tooltip.Trigger
                                aria-label={copied ? "Copied" : "Copy message"}
                                className={clsx(
                                  msgActionBtn,
                                  copied &&
                                    "bg-default-200 text-default-900 dark:bg-white/15",
                                )}
                                onClick={() =>
                                  void copyMessageText(m.id, m.content)
                                }
                              >
                                {copied ? <IconCheck /> : <IconCopy />}
                              </Tooltip.Trigger>
                              <Tooltip.Content
                                className={clsx(
                                  "rounded-full border-0 bg-[var(--accent)] px-3 py-1.5 text-xs font-medium",
                                  "text-[var(--accent-foreground)] shadow-lg",
                                )}
                              >
                                {copied ? "Copied" : "Copy message"}
                              </Tooltip.Content>
                            </Tooltip>
                            {m.role === "user" ? (
                              <Tooltip>
                                <Tooltip.Trigger
                                  aria-label="Edit message"
                                  className={msgActionBtn}
                                  onClick={() => startInlineEdit(m.id)}
                                >
                                  <IconEditMessage />
                                </Tooltip.Trigger>
                                <Tooltip.Content
                                  className={clsx(
                                    "rounded-full border-0 bg-foreground px-3 py-1.5 text-xs font-medium",
                                    "text-background shadow-lg",
                                  )}
                                >
                                  Edit message
                                </Tooltip.Content>
                              </Tooltip>
                            ) : null}
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
          )}
        </div>

        {error && (
          <div className="shrink-0 border-t border-divider bg-[var(--surface)] px-4 py-2 sm:px-8">
            <p className="mx-auto max-w-3xl text-sm text-danger">{error}</p>
          </div>
        )}

        {hasMessages ? (
          <div
            className={clsx(
              "shrink-0 border-t border-transparent px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3",
              "bg-[var(--background)]/95 backdrop-blur-md sm:px-8 sm:pb-8",
            )}
          >
            {composerSection()}
          </div>
        ) : null}
      </div>

      {historyOpen ? (
        <>
          <button
            aria-label="Close chat history"
            className="fixed inset-0 z-[300] bg-[var(--scrim)]"
            type="button"
            onClick={closeHistory}
          />
          <div
            aria-labelledby="agent-aim-history-title"
            aria-modal="true"
            className="fixed right-0 top-0 z-[301] flex h-full w-full max-w-md flex-col rounded-l-2xl border-l border-divider bg-[var(--surface-secondary)] shadow-2xl sm:my-2 sm:mr-2 sm:h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-1rem)]"
            role="dialog"
          >
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-divider px-3 py-3">
              <div className="flex items-center gap-0.5">
                <button
                  aria-label="Back"
                  className={toolbarBtn}
                  type="button"
                  onClick={closeHistory}
                >
                  <IconBack />
                </button>
                <button
                  aria-label="New chat"
                  className={toolbarBtn}
                  type="button"
                  onClick={newChat}
                >
                  <IconPlus />
                </button>
              </div>
              <h2
                className="text-center text-base font-semibold text-default-900"
                id="agent-aim-history-title"
              >
                Chat history
              </h2>
              <button
                aria-label="Scroll to most recent"
                className={clsx(toolbarBtn, "justify-self-end")}
                title="Most recent first"
                type="button"
                onClick={() =>
                  historyListRef.current?.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  })
                }
              >
                <IconHistory />
              </button>
            </div>

            <div
              ref={historyListRef}
              className="min-h-0 flex-1 overflow-y-auto p-2"
            >
              {historySessions.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No chats yet
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {historySessions.map((s) => (
                    <li key={s.id}>
                      <div
                        className={clsx(
                          "flex items-stretch gap-0.5 rounded-xl transition-colors",
                          s.id === activeId
                            ? "bg-[var(--sidebar-item-active)]"
                            : "hover:bg-[var(--sidebar-item-hover)]",
                        )}
                      >
                        <button
                          className="min-w-0 flex-1 px-3 py-3 text-left"
                          type="button"
                          onClick={() => selectSession(s.id)}
                        >
                          <span className="line-clamp-2 text-sm font-medium text-default-900">
                            {s.title}
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {formatSessionTime(s.updatedAt)}
                          </span>
                        </button>
                        <div className="flex shrink-0 items-center pr-1">
                          <Dropdown>
                            <Dropdown.Trigger
                              aria-label={`Options for ${s.title}`}
                              className={clsx(toolbarBtn, "text-foreground/80")}
                            >
                              <IconMore />
                            </Dropdown.Trigger>
                            <Dropdown.Popover placement="bottom end">
                              <Dropdown.Menu aria-label="Chat options">
                                <Dropdown.Item
                                  key="share"
                                  textValue="Share"
                                  onPress={() => void shareChatSession(s)}
                                >
                                  <span className="flex items-center gap-2 text-sm text-default-900">
                                    <IconShare />
                                    Share
                                  </span>
                                </Dropdown.Item>
                                <Dropdown.Item
                                  key="delete"
                                  className="text-danger data-[hovered=true]:bg-danger/10"
                                  textValue="Delete"
                                  onPress={() => requestDelete(s)}
                                >
                                  <span className="flex items-center gap-2 text-sm text-danger">
                                    <IconTrash className="text-danger" />
                                    Delete
                                  </span>
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown.Popover>
                          </Dropdown>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="shrink-0 border-t border-divider bg-[var(--surface)] p-4">
              <Button
                fullWidth
                className="rounded-xl py-3 font-semibold"
                variant="primary"
                onPress={newChatFromHistory}
              >
                New Chat
              </Button>
            </div>
          </div>
        </>
      ) : null}

      {/* Container must be nested inside Backdrop so both portal to document.body; siblings break positioning */}
      <Modal.Root state={deleteDialog}>
        <Modal.Backdrop className="z-[420]">
          <Modal.Container className="min-h-0" placement="center" size="md">
            <Modal.Dialog className="border border-divider shadow-xl">
              <Modal.Header>
                <Modal.Heading className="text-lg font-semibold text-default-900">
                  Delete chat
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm leading-relaxed text-default-700">
                  Are you sure you want to delete the chat &quot;
                  {deleteChatLabel}
                  &quot;? This action cannot be undone.
                </p>
              </Modal.Body>
              <Modal.Footer className="flex flex-row justify-end gap-2 pt-2">
                <Button
                  className="rounded-xl border border-divider"
                  variant="secondary"
                  onPress={() => deleteDialog.close()}
                >
                  Cancel
                </Button>
                <Button
                  className="rounded-xl font-semibold"
                  variant="danger"
                  onPress={confirmDelete}
                >
                  Delete
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal.Root>
    </div>
  );
}
