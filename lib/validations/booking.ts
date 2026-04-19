import { z } from "zod";

export const bookingSchema = z.object({
  slotId: z.number().int().positive(),
  fullName: z.string().min(2, "Введите полное имя"),
  telegram: z.string().min(5, "Введите Telegram username (минимум 5 символов)"),
  email: z.string().optional(),
  phone: z.string().regex(/^\d*$/, "Только цифры").optional(),
  position: z.string().min(2, "Введите позицию"),
  grade: z.enum(["Junior", "Middle", "Senior", "Lead", "Principal"], {
    error: "Выберите грейд",
  }),
  resumeUrl: z.string().optional(),
  industries: z.array(z.string()).min(1, "Выберите хотя бы одну сферу"),
  expectedSalary: z.string().optional(),
  painPoints: z.string().min(20, "Пожалуйста, опишите подробнее (минимум 20 символов)"),
  workFormats: z.array(z.string()).min(1, "Выберите формат работы"),
  willingToRelocate: z.boolean(),
  relocateTo: z.string().optional(),
  strengths: z.string().min(10, "Опишите сильные стороны"),
  weaknesses: z.string().min(10, "Опишите слабые стороны"),
});

export type BookingFormData = z.infer<typeof bookingSchema>;
