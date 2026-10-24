'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface ProfileInitial {
  userId: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | '';
  bloodType: string;
  allergies: string[];
  conditions: string[];
  livesAlone: boolean;
  timezone: string;
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/** "a, b،c" -> ['a','b','c'] (accepts Latin and Arabic commas). */
const splitList = (v: string) =>
  v
    .split(/[,،\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
const joinList = (a: string[]) => a.join(', ');

const labelCls = 'block text-sm font-semibold text-ink mb-1.5';
const selectCls =
  'flex h-13 w-full rounded-[16px] border-2 border-line bg-card px-4 text-base text-ink focus:border-primary focus:outline-none';

export function ProfileEditForm({ initial }: { initial: ProfileInitial }) {
  const t = useTranslations('patient');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [fullName, setFullName] = React.useState(initial.fullName);
  const [phone, setPhone] = React.useState(initial.phone);
  const [dob, setDob] = React.useState(initial.dateOfBirth);
  const [gender, setGender] = React.useState(initial.gender);
  const [bloodType, setBloodType] = React.useState(initial.bloodType);
  const [allergies, setAllergies] = React.useState(joinList(initial.allergies));
  const [conditions, setConditions] = React.useState(joinList(initial.conditions));
  const [livesAlone, setLivesAlone] = React.useState(initial.livesAlone);
  const [timezone, setTimezone] = React.useState(initial.timezone);
  const [saving, setSaving] = React.useState(false);
  const [nameError, setNameError] = React.useState<string | null>(null);

  const zones = React.useMemo(() => {
    let all: string[] = [];
    try {
      all = (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf('timeZone');
    } catch {
      /* older browsers: fall back to the current value only */
    }
    return all.includes(initial.timezone) ? all : [initial.timezone, ...all];
  }, [initial.timezone]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setNameError(t('contactNameRequired'));
      return;
    }
    setNameError(null);
    setSaving(true);
    try {
      const supabase = createClient() as unknown as {
        from: (table: string) => {
          update: (v: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
        };
      };
      const r1 = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), phone: phone.trim() || null })
        .eq('id', initial.userId);
      const r2 = await supabase
        .from('patients')
        .update({
          date_of_birth: dob || null,
          gender: gender || null,
          blood_type: bloodType || null,
          allergies: splitList(allergies),
          chronic_conditions: splitList(conditions),
          lives_alone: livesAlone,
          timezone,
        })
        .eq('id', initial.userId);
      if (r1.error || r2.error) throw new Error('save failed');
      toast({ title: tCommon('all_good'), message: t('profileUpdated'), type: 'success' });
      router.push('/patient/me');
      router.refresh();
    } catch {
      toast({ title: tCommon('error'), message: tCommon('retry'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <section className="rounded-3xl border border-line bg-card p-5 space-y-4">
        <h2 className="font-heading font-bold text-lg text-ink">{t('personalInfo')}</h2>
        <div>
          <label htmlFor="pf-name" className={labelCls}>{t('fullName')}</label>
          <Input id="pf-name" value={fullName} onChange={(e) => setFullName(e.target.value)} error={Boolean(nameError)} />
          {nameError && <p role="alert" className="text-sm text-missed mt-1">{nameError}</p>}
        </div>
        <div>
          <label htmlFor="pf-phone" className={labelCls}>{t('phone')}</label>
          <Input id="pf-phone" type="tel" dir="ltr" className="text-start" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pf-dob" className={labelCls}>{t('dateOfBirth')}</label>
            <Input id="pf-dob" type="date" dir="ltr" className="text-start" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>
          <div>
            <label htmlFor="pf-gender" className={labelCls}>{t('gender')}</label>
            <select id="pf-gender" className={selectCls} value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female' | '')}>
              <option value="">{t('genderNone')}</option>
              <option value="male">{t('genderMale')}</option>
              <option value="female">{t('genderFemale')}</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="pf-tz" className={labelCls}>{t('timezone')}</label>
          <select id="pf-tz" dir="ltr" className={`${selectCls} text-start`} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            {zones.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-card p-5 space-y-4">
        <h2 className="font-heading font-bold text-lg text-ink">{t('medicalIdTitle')}</h2>
        <div>
          <label htmlFor="pf-blood" className={labelCls}>{t('bloodType')}</label>
          <select id="pf-blood" dir="ltr" className={`${selectCls} text-start`} value={bloodType} onChange={(e) => setBloodType(e.target.value)}>
            <option value="">{t('bloodTypeNone')}</option>
            {BLOOD_TYPES.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pf-allergies" className={labelCls}>{t('allergiesLabel')}</label>
          <Input id="pf-allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
          <p className="text-xs text-muted mt-1">{t('allergiesHint')}</p>
        </div>
        <div>
          <label htmlFor="pf-conditions" className={labelCls}>{t('conditionsLabel')}</label>
          <Input id="pf-conditions" value={conditions} onChange={(e) => setConditions(e.target.value)} />
          <p className="text-xs text-muted mt-1">{t('conditionsHint')}</p>
        </div>
        <label className="flex items-start gap-3 rounded-2xl bg-sand/50 border border-line p-4 cursor-pointer">
          <input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--primary)]" checked={livesAlone} onChange={(e) => setLivesAlone(e.target.checked)} />
          <span>
            <span className="block font-semibold text-ink">{t('livesAlone')}</span>
            <span className="block text-sm text-muted">{t('livesAloneDesc')}</span>
          </span>
        </label>
      </section>

      <Button type="submit" size="lg" disabled={saving} className="w-full font-heading font-bold">
        {saving ? tCommon('loading') : tCommon('save')}
      </Button>
    </form>
  );
}
