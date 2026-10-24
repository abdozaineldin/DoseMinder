import { z } from 'zod';
import type { MedForm, MealRule } from '@/db';

export const MED_FORMS: MedForm[] = [
  'tablet',
  'capsule',
  'syrup',
  'injection',
  'drops',
  'cream',
  'inhaler',
  'other',
];

export const MEAL_RULES: MealRule[] = ['before', 'with', 'after', 'any'];

export const MED_COLORS = [
  '#F5A524', // Saffron (Default)
  '#0F6B70', // Teal
  '#1E8E55', // Green
  '#D9453D', // Coral
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#64748B', // Slate
];

export interface MedicationFormValues {
  name: string;
  generic_name?: string;
  strength?: string;
  form: MedForm;
  color: string;
  dose_amount: string;
  meal: MealRule;
  instructions?: string;
  start_date: string;
  end_date?: string | null;
  times: string[];
  days_of_week: number[];
}

export function createMedicationSchema(locale: 'ar' | 'en') {
  const isAr = locale === 'ar';

  return z.object({
    name: z
      .string()
      .trim()
      .min(1, isAr ? 'اسم الدواء مطلوب' : 'Medication name is required'),
    generic_name: z.string().trim().optional(),
    strength: z.string().trim().optional(),
    form: z.enum(['tablet', 'capsule', 'syrup', 'injection', 'drops', 'cream', 'inhaler', 'other'] as const),
    color: z.string().min(1),
    dose_amount: z
      .string()
      .trim()
      .min(1, isAr ? 'مقدار الجرعة مطلوب' : 'Dose amount is required'),
    meal: z.enum(['before', 'with', 'after', 'any'] as const),
    instructions: z.string().trim().optional(),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, isAr ? 'تاريخ البدء غير صالح' : 'Invalid start date'),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .optional()
      .or(z.literal('')),
    times: z
      .array(z.string().regex(/^\d{1,2}:\d{2}(:\d{2})?$/))
      .min(1, isAr ? 'يجب تحديد موعد جرعة واحد على الأقل' : 'At least one dose time is required'),
    days_of_week: z
      .array(z.number().int().min(0).max(6))
      .min(1, isAr ? 'يرجى اختيار يوم واحد على الأقل' : 'Select at least one day'),
  });
}
