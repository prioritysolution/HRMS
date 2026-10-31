"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/i18n";
import { useToast } from "@/components/ui/ToastProvider";
import {
  ensureSupportClientToken,
  getSupportApiKey,
  getSupportDomain,
  readSupportNotices,
  readSupportSession,
  readSupportUnread,
  supportNoticeText,
  writeSupportInbox,
  type SupportNotice,
  type SupportSignal,
} from "@/lib/support/client";
import { readSignedInSupportPhone } from "@/lib/support/phone";
import { connectSupportRealtime, type SupportRealtimeHandle } from "@/lib/support/realtime";

type SupportLiveValue = {
  connected: boolean;
  unreadCount: number;
  notices: SupportNotice[];
  setOpenNumber: (number: string | null) => void;
  clearTicket: (number: string) => void;
  markAllRead: () => void;
  openNotice: (number: string) => void;
  subscribe: (listener: (event: SupportSignal) => void) => () => void;
};

const SupportLiveContext = createContext<SupportLiveValue | null>(null);

function playChime() {
  const audioContext = new AudioContext();
  const now = audioContext.currentTime;
  [880, 660].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    const start = now + index * 0.12;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.08, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
    oscillator.start(start);
    oscillator.stop(start + 0.2);
  });
  window.setTimeout(() => void audioContext.close(), 800);
}

function sameOriginIcon(): string | undefined {
  const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link?.href) return undefined;
  try {
    const url = new URL(link.href, window.location.origin);
    return url.origin === window.location.origin ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function SupportLiveProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { t } = useI18n();
  const toast = useToast();
  const { ready, user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notices, setNotices] = useState<SupportNotice[]>([]);
  const [openNumber, setOpenNumberState] = useState<string | null>(null);
  const [sessionVersion, setSessionVersion] = useState(0);
  const openNumberRef = useRef<string | null>(null);
  const listenersRef = useRef(new Set<(event: SupportSignal) => void>());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);
  const audioPrimedRef = useRef(false);
  const unreadRef = useRef<string[]>([]);
  const noticesRef = useRef<SupportNotice[]>([]);
  const openNoticeRef = useRef<(number: string) => void>(() => undefined);

  const paint = useCallback((unread: string[], nextNotices: SupportNotice[]) => {
    unreadRef.current = unread;
    noticesRef.current = nextNotices;
    writeSupportInbox(unread, nextNotices);
    setUnreadCount(unread.length);
    setNotices(nextNotices);
  }, []);

  const clearTicket = useCallback(
    (number: string) => {
      if (!number) return;
      paint(
        unreadRef.current.filter((item) => item !== number),
        noticesRef.current.filter((item) => item.number !== number),
      );
    },
    [paint],
  );

  const setOpenNumber = useCallback(
    (number: string | null) => {
      openNumberRef.current = number;
      setOpenNumberState(number);
      if (number) clearTicket(number);
    },
    [clearTicket],
  );

  const markAllRead = useCallback(() => {
    paint(
      [],
      noticesRef.current.map((item) => ({ ...item, unread: false })),
    );
  }, [paint]);

  const openNotice = useCallback(
    (number: string) => {
      if (!number) return;
      openNumberRef.current = number;
      clearTicket(number);
      router.push(`/support?ticket=${encodeURIComponent(number)}`);
      window.dispatchEvent(new CustomEvent("support-open-ticket", { detail: number }));
    },
    [clearTicket, router],
  );

  openNoticeRef.current = openNotice;

  const subscribe = useCallback((listener: (event: SupportSignal) => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const primeAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audioPrimedRef.current) return;
    audioPrimedRef.current = true;
    void audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    unreadRef.current = readSupportUnread();
    noticesRef.current = readSupportNotices();
    setUnreadCount(unreadRef.current.length);
    setNotices(noticesRef.current);

    const unlock = () => {
      audioUnlockedRef.current = true;
      primeAudio();
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        void Notification.requestPermission().catch(() => undefined);
      }
    };
    document.addEventListener("pointerdown", unlock, { once: true });
    const bump = () => {
      unreadRef.current = readSupportUnread();
      noticesRef.current = readSupportNotices();
      setUnreadCount(unreadRef.current.length);
      setNotices(noticesRef.current);
      setSessionVersion((value) => value + 1);
    };
    window.addEventListener("support-session", bump);
    return () => {
      document.removeEventListener("pointerdown", unlock);
      window.removeEventListener("support-session", bump);
    };
  }, [primeAudio]);

  useEffect(() => {
    if (!ready || !user) return;
    const mobile = readSignedInSupportPhone();
    if (!mobile || !getSupportApiKey()) return;
    let cancelled = false;
    ensureSupportClientToken(mobile, getSupportDomain()).catch(() => {
      if (!cancelled) setConnected(false);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, user]);

  useEffect(() => {
    const session = readSupportSession(getSupportDomain());
    if (!session.token || !session.phone) {
      setConnected(false);
      return;
    }

    let cancelled = false;
    let handle: SupportRealtimeHandle | null = null;

    const playNotice = () => {
      if (!audioUnlockedRef.current) return;
      const audio = audioRef.current;
      if (!audio) {
        playChime();
        return;
      }
      const clip = audio.cloneNode(true) as HTMLAudioElement;
      void clip.play().catch(() => playChime());
    };

    const presentNotice = (event: SupportSignal) => {
      const title = supportNoticeText(event.title, 120) || t("topbar.supportUpdate");
      const body = supportNoticeText(event.body, 240);
      const hidden = document.visibilityState === "hidden";
      const canNotify = hidden && typeof Notification !== "undefined" && Notification.permission === "granted";
      if (canNotify && event.number) {
        const icon = sameOriginIcon();
        const popup = new Notification(title, {
          body: body || undefined,
          tag: event.number,
          renotify: true,
          silent: false,
          ...(icon ? { icon } : {}),
        });
        popup.onclick = () => {
          window.focus();
          popup.close();
          openNoticeRef.current(event.number || "");
        };
        return;
      }
      playNotice();
      toast.show({
        title,
        message: body || undefined,
        actionLabel: event.number ? t("topbar.supportOpenTicket") : undefined,
        onAction: event.number ? () => openNoticeRef.current(event.number || "") : undefined,
      });
    };

    const onSignal = (event: SupportSignal) => {
      const lookingAtIt = Boolean(event.number && event.number === openNumberRef.current);
      if (event.sound && event.number && !lookingAtIt) {
        const title = supportNoticeText(event.title, 120);
        const body = supportNoticeText(event.body, 240);
        const row: SupportNotice = {
          id: event.number || String(event.ticketId || Date.now()),
          number: event.number,
          title,
          body,
          at: Date.now(),
          unread: true,
        };
        const unread = unreadRef.current.includes(event.number)
          ? unreadRef.current
          : [...unreadRef.current, event.number];
        paint(
          unread,
          [row, ...noticesRef.current.filter((item) => item.id !== row.id)].slice(0, 20),
        );
        presentNotice(event);
      }
      if (lookingAtIt && event.number) clearTicket(event.number);
      listenersRef.current.forEach((listener) => listener(event));
    };

    connectSupportRealtime({
      phone: session.phone,
      token: session.token,
      number: openNumber ?? undefined,
      onSoundUrl: (soundUrl) => {
        audioRef.current = new Audio(soundUrl);
        if (audioUnlockedRef.current) primeAudio();
      },
      onSignal,
    })
      .then((next) => {
        if (cancelled) {
          next.disconnect();
          return;
        }
        handle = next;
        setConnected(true);
      })
      .catch(() => {
        if (!cancelled) setConnected(false);
      });

    return () => {
      cancelled = true;
      setConnected(false);
      audioRef.current = null;
      audioPrimedRef.current = false;
      handle?.disconnect();
    };
  }, [clearTicket, openNumber, paint, primeAudio, sessionVersion, t, toast]);

  const value = useMemo(
    () => ({
      connected,
      unreadCount,
      notices,
      setOpenNumber,
      clearTicket,
      markAllRead,
      openNotice,
      subscribe,
    }),
    [clearTicket, connected, markAllRead, notices, openNotice, setOpenNumber, subscribe, unreadCount],
  );

  return <SupportLiveContext.Provider value={value}>{children}</SupportLiveContext.Provider>;
}

export function useSupportLive() {
  const value = useContext(SupportLiveContext);
  if (!value) {
    throw new Error("Support live updates are only available inside the app shell.");
  }
  return value;
}

export function supportCountLabel(count: number) {
  return count > 9 ? "9+" : String(count);
}
