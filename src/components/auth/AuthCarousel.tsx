"use client";

import Image from "next/image";
import { BarChart3, Clock3, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";

const slides = [
  {
    title: "Visualize trends and track key metrics in real time.",
    image: "/images/dashboard_img/dash1.jpg",
  },
  {
    title: "Accelerate your sales pipeline with performance tracking.",
    image: "/images/dashboard_img/dash2.jpg",
  },
  {
    title: "Simplify attendance management with smart tracking tools.",
    image: "/images/dashboard_img/dash3.jpg",
  },
  {
    title: "Measure, analyze, and improve team performance seamlessly.",
    image: "/images/dashboard_img/dash4.jpg",
  },
];

const features = [
  { icon: UsersRound, label: "HR & People" },
  { icon: Clock3, label: "Attendance" },
  { icon: BarChart3, label: "Analytics" },
];

const SLIDE_MS = 5000;

export function AuthCarousel() {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - started;
      setProgress(Math.min((elapsed / SLIDE_MS) * 100, 100));
    }, 50);

    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
      setProgress(0);
    }, SLIDE_MS);

    return () => {
      window.clearInterval(tick);
      window.clearInterval(timer);
    };
  }, [index]);

  const slide = slides[index];

  return (
    <div className="auth-showcase">
      <div className="auth-showcase-head">
        <p className="auth-showcase-kicker">All-in-one workforce platform</p>
        <h2 className="auth-showcase-title">{slide.title}</h2>
      </div>

      <div className="auth-feature-chips">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <span className="auth-feature-chip" key={feature.label}>
              <Icon size={14} strokeWidth={2.25} />
              {feature.label}
            </span>
          );
        })}
      </div>

      <div key={slide.image} className="auth-browser-shell">
        <div className="auth-browser-chrome" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="auth-browser-viewport">
          <Image
            src={slide.image}
            alt=""
            width={720}
            height={480}
            className="auth-slide-img"
            priority={index <= 1} // Preload the first two slides for better performance
          />
        </div>
      </div>

      <div className="auth-showcase-foot">
        <div className="auth-pagination">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              className={i === index ? "active" : undefined}
              onClick={() => {
                setIndex(i);
                setProgress(0);
              }}
            >
              <span
                className="auth-pagination-progress"
                style={{ width: i === index ? `${progress}%` : "0%" }}
              />
            </button>
          ))}
        </div>

        <div className="auth-showcase-stats">
          <div>
            <strong>10K+</strong>
            <span>Employees managed</span>
          </div>
          <div>
            <strong>99.9%</strong>
            <span>Platform uptime</span>
          </div>
        </div>
      </div>
    </div>
  );
}
