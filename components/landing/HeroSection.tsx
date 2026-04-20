"use client";
import { motion } from "framer-motion";
import Link from "next/link";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

type LandingButton = {
  label: string;
  sublabel?: string;
  href: string;
  primary?: boolean;
};

const BUTTONS: LandingButton[] = [
  {
    label: "СОБЕС",
    sublabel: "Записаться на собеседование",
    href: "/sobies",
    primary: true,
  },
  {
    label: "Найти талант",
    sublabel: "Подобрать сотрудника в команду",
    href: "/talent",
  },
  {
    label: "В команду",
    sublabel: "Присоединиться к нашей команде",
    href: "#",
  },
  {
    label: "Каналы",
    sublabel: "Рекомендуемые ресурсы для поиска",
    href: "#",
  },
];

export function HeroSection() {
  return (
    <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full max-w-3xl text-center"
      >
        {/* Tag */}
        <motion.div variants={item}>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-gray-400 tracking-widest uppercase mb-8 px-4 py-2 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Human-first recruiting
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={item}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-4"
        >
          Найти работу
          <br />
          <span className="text-gray-400">без посредников</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={item}
          className="text-lg text-gray-500 mb-14 max-w-xl mx-auto leading-relaxed"
        >
          Каждый кандидат проходит живое собеседование.
          <br />
          Никакого AI-скрининга — только честный разговор.
        </motion.p>

        {/* Buttons */}
        <motion.div
          variants={item}
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-2xl mx-auto"
        >
          {BUTTONS.map((btn) => (
            <motion.div
              key={btn.label}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.97 }}
            >
              <Link
                href={btn.href}
                className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border transition-all h-full min-h-[110px] group ${
                  btn.primary
                    ? "bg-black text-white border-black hover:bg-gray-800 shadow-lg shadow-black/10"
                    : "bg-white text-gray-800 border-gray-200 hover:border-gray-400 hover:shadow-md"
                }`}
              >
                <span className={`text-lg font-bold tracking-tight ${btn.primary ? "text-white" : "text-gray-900"}`}>
                  {btn.label}
                </span>
                <span className={`text-xs text-center leading-snug ${btn.primary ? "text-gray-300" : "text-gray-400"}`}>
                  {btn.sublabel}
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-300"
      >
        <div className="w-5 h-8 rounded-full border border-gray-300 flex items-start justify-center p-1.5">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-1 h-1.5 bg-gray-400 rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
}
