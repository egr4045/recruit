"use client";
import { motion } from "framer-motion";
import Link from "next/link";

export function SuccessStep() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 space-y-6"
    >
      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h2 className="text-3xl font-semibold text-gray-900">Заявка отправлена</h2>
        <p className="text-gray-500 mt-3 max-w-md mx-auto">
          Мы получили вашу анкету. На почту придёт подтверждение — ждите ответа в течение 24 часов.
        </p>
      </div>
      <Link
        href="/"
        className="inline-block mt-4 text-sm text-gray-400 hover:text-gray-700 transition-colors"
      >
        ← На главную
      </Link>
    </motion.div>
  );
}
