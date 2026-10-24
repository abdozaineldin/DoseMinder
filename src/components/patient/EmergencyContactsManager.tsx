'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Phone,
  Mail,
  UserPlus,
  AlertTriangle,
  Pencil,
  Trash2,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react';

export interface EmergencyContactRow {
  id: string;
  name: string;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  priority: number;
}

export function EmergencyContactsManager({
  patientId,
  initialContacts,
}: {
  patientId: string;
  initialContacts: EmergencyContactRow[];
}) {
  const t = useTranslations('patient');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [contacts, setContacts] = React.useState<EmergencyContactRow[]>(initialContacts);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingContact, setEditingContact] = React.useState<EmergencyContactRow | null>(null);

  // Form states
  const [name, setName] = React.useState('');
  const [relationship, setRelationship] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [priority, setPriority] = React.useState(1);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Delete state
  const [contactToDelete, setContactToDelete] = React.useState<EmergencyContactRow | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const openAddModal = () => {
    setEditingContact(null);
    setName('');
    setRelationship('');
    setPhone('');
    setEmail('');
    setPriority(contacts.length + 1);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (c: EmergencyContactRow) => {
    setEditingContact(c);
    setName(c.name);
    setRelationship(c.relationship ?? '');
    setPhone(c.phone ?? '');
    setEmail(c.email ?? '');
    setPriority(c.priority);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setFormError(t('contactNameRequired'));
      return;
    }

    if (!trimmedPhone && !trimmedEmail) {
      setFormError(t('phoneOrEmailRequired'));
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();

      if (editingContact) {
        const { error } = await supabase
          .from('emergency_contacts')
          .update({
            name: trimmedName,
            relationship: trimmedRelationship(relationship),
            phone: trimmedPhone || null,
            email: trimmedEmail || null,
            priority,
          })
          .eq('id', editingContact.id);

        if (error) throw error;

        setContacts((prev) =>
          prev
            .map((c) =>
              c.id === editingContact.id
                ? {
                    ...c,
                    name: trimmedName,
                    relationship: trimmedRelationship(relationship),
                    phone: trimmedPhone || null,
                    email: trimmedEmail || null,
                    priority,
                  }
                : c
            )
            .sort((a, b) => a.priority - b.priority)
        );
      } else {
        const { data, error } = await supabase
          .from('emergency_contacts')
          .insert({
            patient_id: patientId,
            name: trimmedName,
            relationship: trimmedRelationship(relationship),
            phone: trimmedPhone || null,
            email: trimmedEmail || null,
            priority,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setContacts((prev) =>
            [
              ...prev,
              {
                id: data.id,
                name: data.name,
                relationship: data.relationship,
                phone: data.phone,
                email: data.email,
                priority: data.priority,
              },
            ].sort((a, b) => a.priority - b.priority)
          );
        }
      }

      toast({
        title: tCommon('all_good'),
        message: t('contactSaved'),
        type: 'success',
      });
      setModalOpen(false);
      router.refresh();
    } catch {
      setFormError(tCommon('error'));
    } finally {
      setSaving(false);
    }
  };

  function trimmedRelationship(val: string) {
    const t = val.trim();
    return t ? t : null;
  }

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', contactToDelete.id);

      if (error) throw error;

      setContacts((prev) => prev.filter((c) => c.id !== contactToDelete.id));
      toast({
        title: tCommon('all_good'),
        message: t('contactDeleted'),
        type: 'success',
      });
      setContactToDelete(null);
      router.refresh();
    } catch {
      toast({
        title: tCommon('error'),
        message: tCommon('error'),
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-heading font-bold text-xl text-ink">{t('emergencyTitle')}</h2>
          <p className="text-sm text-muted mt-1">{t('emergencyDesc')}</p>
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={openAddModal}
          size="sm"
          className="gap-1.5 h-10 px-4 rounded-xl font-medium shrink-0 self-start"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t('addContact')}</span>
        </Button>
      </div>

      {/* Warning Notice when no emergency contact exists */}
      {contacts.length === 0 ? (
        <div className="rounded-3xl border-2 border-emergency/40 bg-emergency/10 p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emergency/20 text-emergency flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h3 className="font-heading font-bold text-lg text-emergency">
              {t('noEmergencyContactsTitle')}
            </h3>
          </div>
          <p className="text-sm text-ink leading-relaxed">
            {t('noEmergencyContactsDesc')}
          </p>
          <Button
            type="button"
            variant="primary"
            onClick={openAddModal}
            className="w-full sm:w-auto font-semibold gap-2 mt-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('addContact')}</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="rounded-3xl border border-line bg-card p-5 space-y-3 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                      {c.priority}
                    </span>
                    <h3 className="font-heading font-bold text-lg text-ink truncate">{c.name}</h3>
                    {c.relationship && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-sand border border-line text-muted">
                        {c.relationship}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-sm text-muted">
                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        className="inline-flex items-center gap-1.5 text-primary hover:underline font-mono"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <bdi dir="ltr">{c.phone}</bdi>
                      </a>
                    )}
                    {c.email ? (
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                        <Mail className="w-3.5 h-3.5 text-muted" />
                        <bdi dir="ltr">{c.email}</bdi>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-saffron font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{t('noEmailWarning')}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(c)}
                    className="h-9 w-9 p-0 rounded-xl text-muted hover:text-ink"
                    aria-label={t('editContact')}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setContactToDelete(c)}
                    className="h-9 w-9 p-0 rounded-xl text-missed hover:bg-missed/10"
                    aria-label={t('contactDeleted')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Contact Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <form onSubmit={handleSaveContact} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editingContact ? t('editContact') : t('addContact')}
              </DialogTitle>
              <DialogDescription>{t('emergencyDesc')}</DialogDescription>
            </DialogHeader>

            {formError && (
              <div className="p-3 rounded-2xl bg-missed/10 border border-missed/30 text-missed text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="contact-name" className="block text-sm font-semibold text-ink">
                {t('contactName')} <span className="text-missed">*</span>
              </label>
              <Input
                id="contact-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('contactNamePlaceholder')}
                required
              />
            </div>

            {/* Relationship */}
            <div className="space-y-1.5">
              <label htmlFor="contact-rel" className="block text-sm font-semibold text-ink">
                {t('relationship')}
              </label>
              <Input
                id="contact-rel"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder={t('relationshipPlaceholder')}
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label htmlFor="contact-phone" className="block text-sm font-semibold text-ink">
                {t('contactPhone')}
              </label>
              <Input
                id="contact-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('contactPhonePlaceholder')}
                dir="ltr"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="contact-email" className="block text-sm font-semibold text-ink">
                {t('contactEmail')}
              </label>
              <Input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('contactEmailPlaceholder')}
                dir="ltr"
              />
              {!email.trim() && (
                <p className="flex items-center gap-1.5 text-xs text-saffron mt-1 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('noEmailWarning')}</span>
                </p>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label htmlFor="contact-priority" className="block text-sm font-semibold text-ink">
                {t('priority')}
              </label>
              <select
                id="contact-priority"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl border border-line bg-card text-ink font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={1}>{t('priority1')}</option>
                <option value={2}>{t('priority2')}</option>
                <option value={3}>{t('priority3')}</option>
              </select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                {tCommon('cancel')}
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? tCommon('loading') : tCommon('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(contactToDelete)}
        onOpenChange={(open) => !open && setContactToDelete(null)}
        title={t('deleteContactConfirmTitle')}
        description={t('deleteContactConfirmDesc')}
        confirmLabel={t('contactDeleted')}
        variant="destructive"
        onConfirm={handleDeleteContact}
        loading={deleting}
      />
    </div>
  );
}
