"use client";
import { motion } from "framer-motion";
import Link from "next/link";

interface Props {
  applicationId: number | null;
}

export function SuccessStep({ applicationId }: Props) {
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const botLink = botUsername && applicationId
    ? `https://t.me/${botUsername}?start=${applicationId}`
    : null;

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
          Мы получили вашу анкету и свяжемся с вами через Telegram в течение 24 часов.
        </p>
      </div>

      {botLink && (
        <a
          href={botLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 bg-[#2AABEE] text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-[#229ED9] transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.008 9.455c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.09 13.84l-2.944-.916c-.64-.204-.652-.64.134-.953l11.505-4.435c.537-.194 1.006.131.777.712z"/>
          </svg>
          Подключить Telegram-бот
        </a>
      )}
      <p className="text-xs text-gray-400 max-w-sm mx-auto">
        Нажмите кнопку выше и нажмите <strong>Старт</strong> в боте — тогда мы сможем написать вам прямо в Telegram.
      </p>

      <Link
        href="/"
        className="inline-block mt-4 text-sm text-gray-400 hover:text-gray-700 transition-colors"
      >
        ← На главную
      </Link>
    </motion.div>
  );
}
