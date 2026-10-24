'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PillIcon } from '@/components/shared/PillIcon';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  MED_FORMS,
  MEAL_RULES,
  MED_COLORS,
  createMedicationSchema,
  type MedicationFormValues,
} from '@/lib/patient/medication-schema';
import { formatClock, formatDays, type AppLocale } from '@/lib/format';
import {
  Clock,
  Plus,
  Trash2,
  Check,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import type { MedForm, MealRule } from '@/db';

export interface MedicationInitialData extends MedicationFormValues {
  id?: string;
}

export function MedicationWizard({
  initialData,
}: {
  initialData?: MedicationInitialData;
}) {
  const t = useTranslations('patient');
  const tCommon = useTranslations('common');
  const tMeal = useTranslations('meal');
  const tForm = useTranslations('form');
  const locale = useLocale() as AppLocale;
  const isRtl = locale === 'ar';
  const router = useRouter();

  const isEditing = Boolean(initialData?.id);
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [loading, setLoading] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Form state
  const [name, setName] = React.useState(initialData?.name ?? '');
  const [genericName, setGenericName] = React.useState(initialData?.generic_name ?? '');
  const [strength, setStrength] = React.useState(initialData?.strength ?? '');
  const [form, setForm] = React.useState<MedForm>(initialData?.form ?? 'tablet');
  const [color, setColor] = React.useState(initialData?.color ?? '#F5A524');
  const [doseAmount, setDoseAmount] = React.useState(initialData?.dose_amount ?? '');
  const [meal, setMeal] = React.useState<MealRule>(initialData?.meal ?? 'any');
  const [instructions, setInstructions] = React.useState(initialData?.instructions ?? '');
  const [startDate, setStartDate] = React.useState(
    initialData?.start_date ?? new Intl.DateTimeFormat('en-CA').format(new Date()) // local date, not UTC
  );
  const [endDate, setEndDate] = React.useState(initialData?.end_date ?? '');
  const [times, setTimes] = React.useState<string[]>(
    initialData?.times && initialData.times.length > 0
      ? initialData.times.map((t) => t.slice(0, 5))
      : ['08:00']
  );
  const [daysOfWeek, setDaysOfWeek] = React.useState<number[]>(
    initialData?.days_of_week && initialData.days_of_week.length > 0
      ? initialData.days_of_week
      : [0, 1, 2, 3, 4, 5, 6]
  );

  const schema = React.useMemo(() => createMedicationSchema(locale), [locale]);

  // Step 1 Validation
  const validateStep1 = () => {
    const res = schema.pick({ name: true }).safeParse({ name });
    if (!res.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of res.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const res = schema
      .pick({ dose_amount: true, times: true, days_of_week: true, start_date: true })
      .safeParse({ dose_amount: doseAmount, times, days_of_week: daysOfWeek, start_date: startDate });
    if (!res.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of res.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  };

  // Frequency preset handler
  const setFrequencyPreset = (preset: 'once' | 'twice' | 'thrice' | 'everyday') => {
    setDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
    if (preset === 'once') setTimes(['08:00']);
    else if (preset === 'twice') setTimes(['08:00', '20:00']);
    else if (preset === 'thrice') setTimes(['08:00', '14:00', '20:00']);
  };

  const handleAddTime = () => {
    setTimes((prev) => [...prev, '12:00']);
  };

  const handleRemoveTime = (index: number) => {
    if (times.length <= 1) return;
    setTimes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTimeChange = (index: number, val: string) => {
    setTimes((prev) => prev.map((t, i) => (i === index ? val : t)));
  };

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev; // Keep at least 1
        return prev.filter((d) => d !== day).sort();
      }
      return [...prev, day].sort();
    });
  };

  // Save medication
  const handleSave = async () => {
    const fullData = {
      name,
      generic_name: genericName || undefined,
      strength: strength || undefined,
      form,
      color,
      dose_amount: doseAmount,
      meal,
      instructions: instructions || undefined,
      start_date: startDate,
      end_date: endDate || undefined,
      times,
      days_of_week: daysOfWeek,
    };

    const parsed = schema.safeParse(fullData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const medId = initialData?.id ?? crypto.randomUUID();

      const { error } = await supabase.rpc('upsert_medication_with_schedule', {
        p_id: medId,
        p_name: name.trim(),
        p_generic: genericName.trim() || null,
        p_strength: strength.trim() || null,
        p_form: form,
        p_color: color,
        p_dose_amount: doseAmount.trim(),
        p_meal: meal,
        p_instructions: instructions.trim() || null,
        p_start: startDate,
        p_end: endDate || null,
        p_times: times.map((t) => (t.length === 5 ? `${t}:00` : t)),
        p_days: daysOfWeek,
      });

      if (error) {
        toast({ title: tCommon('error'), message: t('errorSaving'), type: 'error' });
        setLoading(false);
        return;
      }

      toast({ title: tCommon('all_good'), message: t('medicationSaved'), type: 'success' });
      router.push('/patient/today');
      router.refresh();
    } catch {
      toast({ title: tCommon('error'), message: t('errorSaving'), type: 'error' });
      setLoading(false);
    }
  };

  // Delete medication (soft-delete)
  const handleDelete = async () => {
    if (!initialData?.id) return;
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('delete_medication', { p_id: initialData.id });
      setDeleting(false);
      setDeleteDialogOpen(false);

      if (error) {
        toast({ title: tCommon('error'), message: t('errorDeleting'), type: 'error' });
        return;
      }

      toast({ title: tCommon('all_good'), message: t('medicationDeleted'), type: 'success' });
      router.push('/patient/medications');
      router.refresh();
    } catch {
      setDeleting(false);
      toast({ title: tCommon('error'), message: t('errorDeleting'), type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator Header */}
      <div className="rounded-3xl border border-line bg-card p-5 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-muted">
          <span>{t('step', { current: step, total: 3 })}</span>
          <span className="font-heading font-bold text-primary">
            {step === 1 ? t('step1') : step === 2 ? t('step2') : t('step3')}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-2 rounded-full bg-sand overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* STEP 1: IDENTIFY */}
      {step === 1 && (
        <section className="rounded-3xl border border-line bg-card p-5 sm:p-6 space-y-5">
          <h2 className="font-heading font-bold text-xl text-ink">{t('step1')}</h2>

          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="med-name" className="block text-sm font-semibold text-ink">
              {t('medName')} <span className="text-missed">*</span>
            </label>
            <Input
              id="med-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder={t('medNamePlaceholder')}
              className={errors.name ? 'border-missed ring-missed/30' : ''}
              autoFocus
            />
            {errors.name && (
              <p className="flex items-center gap-1.5 text-xs text-missed mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* Strength */}
          <div className="space-y-1.5">
            <label htmlFor="med-strength" className="block text-sm font-semibold text-ink">
              {t('strength')}
            </label>
            <Input
              id="med-strength"
              value={strength}
              onChange={(e) => setStrength(e.target.value)}
              placeholder={t('strengthPlaceholder')}
              dir="ltr"
            />
          </div>

          {/* Generic Name */}
          <div className="space-y-1.5">
            <label htmlFor="med-generic" className="block text-sm font-semibold text-ink">
              {t('genericName')}
            </label>
            <Input
              id="med-generic"
              value={genericName}
              onChange={(e) => setGenericName(e.target.value)}
              placeholder={t('genericNamePlaceholder')}
            />
          </div>

          {/* Form Picker (8 forms) */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-ink">{t('formLabel')}</label>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
              {MED_FORMS.map((f) => {
                const selected = form === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setForm(f)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                      selected
                        ? 'border-primary bg-primary-tint/60 ring-2 ring-primary/40 shadow-xs'
                        : 'border-line bg-sand/20 hover:border-line/80'
                    }`}
                  >
                    <PillIcon form={f} color={selected ? color : 'currentColor'} size={32} />
                    <span className="text-xs font-medium text-ink mt-2">{tForm(f)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Picker (8 swatches) */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-ink">{t('colorLabel')}</label>
            <div className="flex flex-wrap items-center gap-3">
              {MED_COLORS.map((c) => {
                const selected = color.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
                      selected ? 'border-ink scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  >
                    {selected && <Check className="w-5 h-5 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* STEP 2: SCHEDULE & DOSAGE */}
      {step === 2 && (
        <section className="rounded-3xl border border-line bg-card p-5 sm:p-6 space-y-5">
          <h2 className="font-heading font-bold text-xl text-ink">{t('step2')}</h2>

          {/* Dose Amount */}
          <div className="space-y-1.5">
            <label htmlFor="med-amount" className="block text-sm font-semibold text-ink">
              {t('doseAmount')} <span className="text-missed">*</span>
            </label>
            <Input
              id="med-amount"
              value={doseAmount}
              onChange={(e) => {
                setDoseAmount(e.target.value);
                if (errors.dose_amount) setErrors((prev) => ({ ...prev, dose_amount: '' }));
              }}
              placeholder={t('doseAmountPlaceholder')}
              className={errors.dose_amount ? 'border-missed ring-missed/30' : ''}
            />
            {errors.dose_amount && (
              <p className="flex items-center gap-1.5 text-xs text-missed mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.dose_amount}</span>
              </p>
            )}
          </div>

          {/* Meal Rule */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-ink">{t('mealLabel')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MEAL_RULES.map((m) => {
                const selected = meal === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMeal(m)}
                    className={`p-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      selected
                        ? 'border-primary bg-primary text-white'
                        : 'border-line bg-sand/30 text-ink hover:bg-sand/60'
                    }`}
                  >
                    {tMeal(m)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frequency Presets */}
          <div className="space-y-2 pt-2 border-t border-line">
            <label className="block text-sm font-semibold text-ink">{t('frequency')}</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFrequencyPreset('once')}
                className="px-3 py-1.5 rounded-full border border-line bg-sand/40 text-xs font-semibold text-ink hover:border-primary transition-colors"
              >
                {t('freqOnce')}
              </button>
              <button
                type="button"
                onClick={() => setFrequencyPreset('twice')}
                className="px-3 py-1.5 rounded-full border border-line bg-sand/40 text-xs font-semibold text-ink hover:border-primary transition-colors"
              >
                {t('freqTwice')}
              </button>
              <button
                type="button"
                onClick={() => setFrequencyPreset('thrice')}
                className="px-3 py-1.5 rounded-full border border-line bg-sand/40 text-xs font-semibold text-ink hover:border-primary transition-colors"
              >
                {t('freqThrice')}
              </button>
            </div>
          </div>

          {/* Times List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-ink">
                {t('timesLabel')} <span className="text-missed">*</span>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTime}
                className="h-8 gap-1 rounded-xl text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('addTime')}</span>
              </Button>
            </div>

            <div className="space-y-2">
              {times.map((time, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => handleTimeChange(idx, e.target.value)}
                      className="font-mono text-base h-11"
                    />
                  </div>
                  {times.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTime(idx)}
                      className="text-missed hover:bg-missed/10 h-11 w-11 p-0 rounded-xl"
                      aria-label={t('removeTime')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Days of Week */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-ink">
              {t('daysLabel')} <span className="text-missed">*</span>
            </label>
            <div className="grid grid-cols-4 min-[480px]:grid-cols-7 gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                const active = daysOfWeek.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`h-11 px-1 rounded-xl text-xs font-bold transition-all border ${
                      active
                        ? 'border-primary bg-primary text-white shadow-xs'
                        : 'border-line bg-sand/30 text-muted hover:border-line/80'
                    }`}
                  >
                    {t(`day_${day}` as any)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start and End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-line">
            <div className="space-y-1.5">
              <label htmlFor="med-start" className="block text-sm font-semibold text-ink">
                {t('startDate')}
              </label>
              <Input
                id="med-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="med-end" className="block text-sm font-semibold text-ink">
                {t('endDate')}
              </label>
              <Input
                id="med-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-1.5">
            <label htmlFor="med-instructions" className="block text-sm font-semibold text-ink">
              {t('instructions')}
            </label>
            <Input
              id="med-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={t('instructionsPlaceholder')}
            />
          </div>
        </section>
      )}

      {/* STEP 3: REVIEW & SAVE */}
      {step === 3 && (
        <section className="rounded-3xl border border-line bg-card p-5 sm:p-6 space-y-5">
          <h2 className="font-heading font-bold text-xl text-ink">{t('reviewTitle')}</h2>

          {/* Visual pill card */}
          <div className="rounded-2xl border border-line bg-sand/30 p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white shadow-xs shrink-0">
                <PillIcon form={form} color={color} size={40} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-heading font-bold text-xl text-ink break-words">
                  <bdi dir="ltr">
                    {name}
                    {strength ? ` ${strength}` : ''}
                  </bdi>
                </h3>
                {genericName && <p className="text-xs text-muted">{genericName}</p>}
                <p className="text-sm font-medium text-ink mt-1">
                  {tForm(form)} · {doseAmount} · {tMeal(meal)}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-line/60 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-ink">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <span className="text-muted">{t('scheduleSummary')}:</span>
                <div className="flex flex-wrap gap-1.5">
                  {times.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-md bg-card border border-line text-xs font-semibold"
                    >
                      <bdi dir="ltr">{formatClock(t, locale)}</bdi>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-ink text-xs text-muted">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <span>{formatDays(daysOfWeek, locale, t('everyDay'))}</span>
              </div>
              {instructions && (
                <p className="text-xs text-muted pt-1 border-t border-line/40">
                  <span className="font-semibold">{t('instructions')}: </span>
                  {instructions}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {step > 1 ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            className="gap-2 h-12 px-5 rounded-2xl font-semibold"
          >
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{t('prevStep')}</span>
          </Button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <Button
            type="button"
            variant="primary"
            onClick={handleNext}
            className="gap-2 h-12 px-6 rounded-2xl font-semibold ms-auto"
          >
            <span>{t('nextStep')}</span>
            {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={loading}
            className="gap-2 h-12 px-8 rounded-2xl font-heading font-bold text-lg ms-auto shadow-md"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>{loading ? t('saving') : t('saveMedication')}</span>
          </Button>
        )}
      </div>

      {/* Delete button (only when editing) */}
      {isEditing && (
        <div className="pt-6 border-t border-line text-center">
          <Button
            type="button"
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            className="gap-2 rounded-2xl h-11 px-5"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t('deleteMedication')}</span>
          </Button>

          <ConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title={t('deleteMedConfirmTitle')}
            description={t('deleteMedConfirmDesc')}
            confirmLabel={t('deleteMedication')}
            variant="destructive"
            onConfirm={handleDelete}
            loading={deleting}
          />
        </div>
      )}
    </div>
  );
}
