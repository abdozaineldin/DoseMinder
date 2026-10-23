-- Migration 00004: App Settings, Drug Catalog Seeds, Pre-cached Drug Labels, and Realtime Publications

-- ============================================================================
-- APP SETTINGS (SPEC §3.2)
-- ============================================================================

insert into public.app_settings (key, value) values
  ('allowed_minutes', '30'::jsonb),
  ('followup_count', '2'::jsonb),
  ('followup_interval_minutes', '15'::jsonb),
  ('emergency_delay_minutes', '15'::jsonb),
  ('early_window_minutes', '30'::jsonb),
  ('emergency_link_ttl_hours', '12'::jsonb)
on conflict (key) do update set
  value = excluded.value,
  updated_at = now();

-- ============================================================================
-- DRUG CATALOG SEEDS (SPEC §3.8: Common Egyptian Brands)
-- ============================================================================

insert into public.drug_catalog (brand_name, generic_name, notes) values
  ('Concor', 'bisoprolol', 'Beta-blocker for hypertension and heart conditions'),
  ('Janumet', 'sitagliptin+metformin', 'Antidiabetic medication combination'),
  ('Plavix', 'clopidogrel', 'Antiplatelet medication to prevent blood clots'),
  ('Augmentin', 'amoxicillin+clavulanate', 'Antibacterial antibiotic'),
  ('Glucophage', 'metformin', 'First-line medication for type 2 diabetes'),
  ('Cardura', 'doxazosin', 'Alpha-blocker for hypertension and BPH'),
  ('Norvasc', 'amlodipine', 'Calcium channel blocker for high blood pressure'),
  ('Lipitor', 'atorvastatin', 'Statin for lipid and cholesterol lowering'),
  ('Aspirin', 'acetylsalicylic acid', 'Analgesic, anti-inflammatory, and blood thinner'),
  ('Panadol', 'paracetamol', 'Analgesic and antipyretic for pain and fever'),
  ('Ventolin', 'salbutamol', 'Bronchodilator for asthma and COPD relief'),
  ('Lasix', 'furosemide', 'Loop diuretic for fluid retention and hypertension')
on conflict (brand_name) do update set
  generic_name = excluded.generic_name,
  notes = excluded.notes;

-- ============================================================================
-- DRUG INFO CACHE PRE-SEEDED LABELS (SPEC §12: Concor, Janumet, Plavix)
-- ============================================================================

insert into public.drug_info_cache (generic_name, label, ar_translation, source, fetched_at) values
  (
    'bisoprolol',
    '{
      "indications_and_usage": "Bisoprolol is indicated in the management of hypertension, used alone or in combination with other antihypertensive agents.",
      "adverse_reactions": "Fatigue, dizziness, headache, bradycardia, cold extremities, and orthostatic changes.",
      "warnings": "Do not discontinue abruptly in patients with coronary artery disease. Monitor heart rate and blood pressure.",
      "drug_interactions": "Should not be combined with other beta-blockers. Use caution with calcium channel blockers."
    }'::jsonb,
    '{
      "summary": "بيسوبرولول دواء من فئة حاصرات بيتا يُستخدم لتنظيم ضغط الدم وحماية القلب.",
      "instructions_ar": "يؤخذ عادة قرص واحد صباحاً مع كوب ماء، ولا تتوقف عن تناوله فجأة دون استشارة طبيبك.",
      "cautions_ar": "احذر عند القيادة أو النهوض المفاجئ لتجنب الدوار."
    }'::jsonb,
    'DailyMed / openFDA official label',
    now()
  ),
  (
    'sitagliptin+metformin',
    '{
      "indications_and_usage": "Indicated as an adjunct to diet and exercise to improve glycemic control in adults with type 2 diabetes mellitus.",
      "adverse_reactions": "Upper respiratory tract infection, nasopharyngitis, headache, diarrhea, nausea and vomiting.",
      "warnings": "Lactic acidosis is a rare but serious metabolic complication associated with metformin. Discontinue during acute illness.",
      "drug_interactions": "Alcohol increases the effect of metformin on lactate metabolism."
    }'::jsonb,
    '{
      "summary": "مزيج فعال للسيطرة على مستويات السكر في الدم لمرضى السكري من النوع الثاني.",
      "instructions_ar": "يُفضل تناوله مع وجبات الطعام لتقليل اضطرابات المعدة.",
      "cautions_ar": "أخبر طبيبك فوراً إذا شعرت بإرهاق شديد أو صعوبة في التنفس أو قيء مستمر."
    }'::jsonb,
    'DailyMed / openFDA official label',
    now()
  ),
  (
    'clopidogrel',
    '{
      "indications_and_usage": "Indicated for the reduction of atherothrombotic events in patients with a history of recent myocardial infarction, stroke, or established peripheral arterial disease.",
      "adverse_reactions": "Bleeding, bruising, hematoma, epistaxis, and gastrointestinal hemorrhage.",
      "warnings": "Boxed warning: diminished antiplatelet effect in patients with two loss-of-function alleles of the CYP2C19 gene.",
      "drug_interactions": "Avoid concomitant use with omeprazole or esomeprazole which significantly reduce antiplatelet activity."
    }'::jsonb,
    '{
      "summary": "مضاد لتجمع الصفائح الدموية يمنع حدوث الجلطات وانسداد الشرايين.",
      "instructions_ar": "يؤخذ قرص يومياً في نفس الموعد مع أو بدون طعام.",
      "cautions_ar": "تجنب الأدوية المسكنة مثل الإيبوبروفين دون استشارة الطبيب لتجنب مخاطر النزيف."
    }'::jsonb,
    'DailyMed / openFDA official label',
    now()
  )
on conflict (generic_name) do update set
  label = excluded.label,
  ar_translation = excluded.ar_translation,
  source = excluded.source,
  fetched_at = excluded.fetched_at;

-- ============================================================================
-- 5.6 REALTIME PUBLICATION SETUP
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;
end;
$$;

alter publication supabase_realtime add table public.alerts;
alter publication supabase_realtime add table public.dose_logs;
