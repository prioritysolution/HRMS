"use client";

import { useEffect, useRef } from "react";

const SLOW_MOTION_RATE = 0.38;
const CROSSFADE_MS = 1400;

export function LoginBackgroundVideo() {
  const primaryRef = useRef<HTMLVideoElement>(null);
  const secondaryRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const primary = primaryRef.current;
    const secondary = secondaryRef.current;
    if (!primary || !secondary) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let active = primary;
    let idle = secondary;
    let fading = false;
    let frame = 0;
    let fadeTimer = 0;

    const slow = (video: HTMLVideoElement) => {
      if (video.playbackRate !== SLOW_MOTION_RATE) {
        video.playbackRate = SLOW_MOTION_RATE;
      }
    };

    const show = (video: HTMLVideoElement, visible: boolean) => {
      video.classList.toggle("is-visible", visible);
    };

    slow(primary);
    slow(secondary);
    show(primary, true);
    show(secondary, false);

    const onReady = (event: Event) => {
      slow(event.currentTarget as HTMLVideoElement);
    };

    primary.addEventListener("loadedmetadata", onReady);
    secondary.addEventListener("loadedmetadata", onReady);
    primary.addEventListener("play", onReady);
    secondary.addEventListener("play", onReady);

    const handoff = () => {
      if (fading) return;
      fading = true;

      idle.currentTime = 0;
      slow(idle);
      show(idle, true);
      void idle.play();

      const outgoing = active;
      const incoming = idle;

      fadeTimer = window.setTimeout(() => {
        outgoing.pause();
        outgoing.currentTime = 0;
        show(outgoing, false);
        active = incoming;
        idle = outgoing;
        fading = false;
      }, CROSSFADE_MS);
    };

    const tick = () => {
      if (!fading && Number.isFinite(active.duration) && active.duration > 0) {
        const rate = active.playbackRate || SLOW_MOTION_RATE;
        const remainingMs = ((active.duration - active.currentTime) / rate) * 1000;
        if (remainingMs <= CROSSFADE_MS) {
          handoff();
        }
      }
      frame = window.requestAnimationFrame(tick);
    };

    void primary.play();
    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(fadeTimer);
      primary.removeEventListener("loadedmetadata", onReady);
      secondary.removeEventListener("loadedmetadata", onReady);
      primary.removeEventListener("play", onReady);
      secondary.removeEventListener("play", onReady);
    };
  }, []);

  return (
    <>
      <video
        ref={primaryRef}
        className="login-background-video is-visible"
        autoPlay
        muted
        playsInline
        preload="auto"
        poster="/images/login-hero-background.png"
      >
        <source src="/images/login-hero-background-video.mp4" type="video/mp4" />
      </video>
      <video
        ref={secondaryRef}
        className="login-background-video"
        muted
        playsInline
        preload="auto"
        poster="/images/login-hero-background.png"
      >
        <source src="/images/login-hero-background-video.mp4" type="video/mp4" />
      </video>
    </>
  );
}
