"use client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookingSchema, BookingFormData } from "@/lib/validations/booking";
import { IndustryMultiSelect } from "./fields/IndustryMultiSelect";
import { WorkFormatGroup } from "./fields/WorkFormatGroup";
import { ResumeUpload } from "./fields/ResumeUpload";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type Slot = { id: number; startsAt: string; durationMin: number };

interface Props {
  slot: Slot;
  onBack: () => void;
  onSuccess: (id: number) => void;
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-800 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      {children}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all";

export function QuestionnaireStep({ slot, onBack, onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      slotId: slot.id,
      industries: [],
      workFormats: [],
      willingToRelocate: false,
      relocateTo: "",
    },
  });

  async function onSubmit(data: BookingFormData) {
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      setError("root", { message: json.error || "Ошибка отправки" });
      return;
    }
    onSuccess(json.id);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-gray-400 hover:text-gray-700 transition-colors mb-4 flex items-center gap-1"
        >
          ← Изменить время
        </button>
        <h2 className="text-2xl font-semibold text-gray-900">Расскажите о себе</h2>
        <p className="text-sm text-gray-500 mt-1">
          Слот:{" "}
          <span className="font-medium text-gray-800">
            {format(new Date(slot.startsAt), "d MMMM, HH:mm", { locale: ru })}
          </span>
        </p>
      </div>

      {/* Contact */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-2">Контакты</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="ФИО *" error={errors.fullName?.message}>
            <input {...register("fullName")} className={inputClass} placeholder="Иван Иванов" />
          </Field>
          <Field label="Email *" error={errors.email?.message}>
            <input {...register("email")} type="email" className={inputClass} placeholder="ivan@example.com" />
          </Field>
          <Field label="Телефон *" error={errors.phone?.message}>
            <input {...register("phone")} className={inputClass} placeholder="+7 900 000-00-00" />
          </Field>
        </div>
      </div>

      {/* Professional */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-2">Профессиональный профиль</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Желаемая позиция *" error={errors.position?.message}>
            <input {...register("position")} className={inputClass} placeholder="Product Manager, Frontend Dev..." />
          </Field>
          <Field label="Грейд *" error={errors.grade?.message}>
            <select {...register("grade")} className={inputClass}>
              <option value="">Выберите грейд</option>
              {["Junior", "Middle", "Senior", "Lead", "Principal"].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </Field>
          <Field label="Ожидаемая зарплата (ЗПО)" error={errors.expectedSalary?.message}>
            <input {...register("expectedSalary")} className={inputClass} placeholder="200 000 ₽ / $3 000" />
          </Field>
        </div>

        <Field label="Резюме (файл)" error={undefined}>
          <Controller
            name="resumeUrl"
            control={control}
            render={({ field }) => (
              <ResumeUpload value={field.value || ""} onChange={field.onChange} />
            )}
          />
        </Field>
      </div>

      {/* Industries */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-2">Интересующие сферы *</h3>
        <Controller
          name="industries"
          control={control}
          render={({ field }) => (
            <IndustryMultiSelect
              value={field.value}
              onChange={field.onChange}
              error={errors.industries?.message}
            />
          )}
        />
      </div>

      {/* Pain points */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-2">Ситуация и цели</h3>
        <Field
          label="Что сейчас не устраивает? Почему начали поиск? *"
          hint="Расскажите откровенно — это поможет нам найти подходящие варианты"
          error={errors.painPoints?.message}
        >
          <textarea
            {...register("painPoints")}
            rows={4}
            className={inputClass + " resize-none"}
            placeholder="Например: застрял на одном месте 3 года, нет роста, команда распалась, хочу в продукт..."
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Сильные стороны *"
            error={errors.strengths?.message}
          >
            <textarea
              {...register("strengths")}
              rows={3}
              className={inputClass + " resize-none"}
              placeholder="В чём вы реально хороши?"
            />
          </Field>
          <Field
            label="Слабые стороны *"
            error={errors.weaknesses?.message}
          >
            <textarea
              {...register("weaknesses")}
              rows={3}
              className={inputClass + " resize-none"}
              placeholder="Честный ответ ценится больше шаблонного"
            />
          </Field>
        </div>
      </div>

      {/* Work format */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-2">Формат и готовность</h3>
        <Field label="Формат работы *" error={errors.workFormats?.message}>
          <Controller
            name="workFormats"
            control={control}
            render={({ field: wf }) => (
              <Controller
                name="willingToRelocate"
                control={control}
                render={({ field: relField }) => (
                  <Controller
                    name="relocateTo"
                    control={control}
                    render={({ field: relTo }) => (
                      <WorkFormatGroup
                        formats={wf.value}
                        onFormatsChange={wf.onChange}
                        willingToRelocate={relField.value}
                        onRelocateChange={relField.onChange}
                        relocateTo={relTo.value || ""}
                        onRelocateToChange={relTo.onChange}
                        error={errors.workFormats?.message}
                      />
                    )}
                  />
                )}
              />
            )}
          />
        </Field>
      </div>

      {errors.root && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
          {errors.root.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-black text-white rounded-xl py-4 text-base font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Отправляем..." : "Отправить заявку →"}
      </button>
    </form>
  );
}
