"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  {
    title:
      "Visualize trends, track key metrics, and gain real-time insights to make faster, data-driven decisions that drive growth.",
    image: "/images/dashboard_img/dash1.jpg",
  },
  {
    title: "Accelerate Your Sales Pipeline With Real-Time Performance Tracking",
    image: "/images/dashboard_img/dash2.jpg",
  },
  {
    title: "Simplify Attendance Management With Smart Tracking Tools",
    image: "/images/dashboard_img/dash3.jpg",
  },
  {
    title: "Measure, Analyze, and Improve Team Performance Seamlessly",
    image: "/images/dashboard_img/dash4.jpg",
  },
];

export function AuthCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, []);

  const slide = slides[index];

  return (
    <div className="auth-sec-border">
      <div className="auth-swiper">
        <h4 className="auth-slide-title">{slide.title}</h4>

        <div key={slide.image} className="auth-slide-media">
          <div className="auth-slide-frame">
            <Image
              src={slide.image}
              alt=""
              width={720}
              height={480}
              className="auth-slide-img"
              priority={index === 0}
            />
          </div>
        </div>

        <div className="auth-pagination">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              className={i === index ? "active" : undefined}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
