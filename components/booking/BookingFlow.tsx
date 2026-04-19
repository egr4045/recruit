"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarStep } from "./CalendarStep";
import { QuestionnaireStep } from "./QuestionnaireStep";
import { SuccessStep } from "./SuccessStep";

type Slot = { id: number; startsAt: string; durationMin: number };
type Step = "calendar" | "form" | "success";

const slideVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export function BookingFlow() {
  const [step, setStep] = useState<Step>("calendar");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [applicationId, setApplicationId] = useState<number | null>(null);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-10">
        {(["calendar", "form", "success"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                step === s
                  ? "bg-black text-white"
                  : i < ["calendar", "form", "success"].indexOf(step)
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {i + 1}
            </div>
            {i < 2 && <div className="w-8 h-0.5 bg-gray-200" />}
          </div>
        ))}
        <span className="ml-2 text-xs text-gray-400">
          {step === "calendar" ? "Выбор времени" : step === "form" ? "Анкета" : "Готово"}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {step === "calendar" && (
          <motion.div
            key="calendar"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <CalendarStep
              onSelect={(slot) => {
                setSelectedSlot(slot);
                setStep("form");
              }}
            />
          </motion.div>
        )}

        {step === "form" && selectedSlot && (
          <motion.div
            key="form"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <QuestionnaireStep
              slot={selectedSlot}
              onBack={() => setStep("calendar")}
              onSuccess={(id) => { setApplicationId(id); setStep("success"); }}
            />
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <SuccessStep applicationId={applicationId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
