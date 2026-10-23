import type { Database } from './database.types';

export * from './database.types';

export type UserRole = Database['public']['Enums']['user_role'];
export type MedForm = Database['public']['Enums']['med_form'];
export type MealRule = Database['public']['Enums']['meal_rule'];
export type DoseStatus = Database['public']['Enums']['dose_status'];
export type AlertKind = Database['public']['Enums']['alert_kind'];
export type AlertChannel = Database['public']['Enums']['alert_channel'];
export type AlertStatus = Database['public']['Enums']['alert_status'];
export type LinkStatus = Database['public']['Enums']['link_status'];
export type ConsentStatus = Database['public']['Enums']['consent_status'];
