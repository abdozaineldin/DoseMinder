export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      access_log: {
        Row: {
          created_at: string
          id: string
          patient_id: string
          resource: string
          viewer_id: string
          viewer_role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          patient_id: string
          resource: string
          viewer_id: string
          viewer_role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          id?: string
          patient_id?: string
          resource?: string
          viewer_id?: string
          viewer_role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "access_log_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_log_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          acknowledged_at: string | null
          attempts: number
          channel: Database["public"]["Enums"]["alert_channel"]
          created_at: string
          dose_log_id: string
          emergency_contact_id: string | null
          id: string
          kind: Database["public"]["Enums"]["alert_kind"]
          last_error: string | null
          patient_id: string
          recipient_user_id: string | null
          seen_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["alert_status"]
          token_expires_at: string | null
          token_hash: string | null
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          attempts?: number
          channel: Database["public"]["Enums"]["alert_channel"]
          created_at?: string
          dose_log_id: string
          emergency_contact_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["alert_kind"]
          last_error?: string | null
          patient_id: string
          recipient_user_id?: string | null
          seen_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["alert_status"]
          token_expires_at?: string | null
          token_hash?: string | null
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          attempts?: number
          channel?: Database["public"]["Enums"]["alert_channel"]
          created_at?: string
          dose_log_id?: string
          emergency_contact_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["alert_kind"]
          last_error?: string | null
          patient_id?: string
          recipient_user_id?: string | null
          seen_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["alert_status"]
          token_expires_at?: string | null
          token_hash?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_dose_log_id_fkey"
            columns: ["dose_log_id"]
            isOneToOne: false
            referencedRelation: "dose_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_emergency_contact_id_fkey"
            columns: ["emergency_contact_id"]
            isOneToOne: false
            referencedRelation: "emergency_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      care_links: {
        Row: {
          caregiver_id: string
          created_at: string
          id: string
          patient_id: string
          requested_code: string | null
          responded_at: string | null
          status: Database["public"]["Enums"]["link_status"]
          updated_at: string
        }
        Insert: {
          caregiver_id: string
          created_at?: string
          id?: string
          patient_id: string
          requested_code?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["link_status"]
          updated_at?: string
        }
        Update: {
          caregiver_id?: string
          created_at?: string
          id?: string
          patient_id?: string
          requested_code?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["link_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_links_caregiver_id_fkey"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_links_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_consent_events: {
        Row: {
          consent_id: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["consent_status"]
        }
        Insert: {
          consent_id: string
          created_at?: string
          id?: string
          status: Database["public"]["Enums"]["consent_status"]
        }
        Update: {
          consent_id?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["consent_status"]
        }
        Relationships: [
          {
            foreignKeyName: "doctor_consent_events_consent_id_fkey"
            columns: ["consent_id"]
            isOneToOne: false
            referencedRelation: "doctor_consents"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_consents: {
        Row: {
          created_at: string
          decided_at: string | null
          doctor_id: string
          id: string
          patient_id: string
          requested_code: string | null
          status: Database["public"]["Enums"]["consent_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          doctor_id: string
          id?: string
          patient_id: string
          requested_code?: string | null
          status?: Database["public"]["Enums"]["consent_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          doctor_id?: string
          id?: string
          patient_id?: string
          requested_code?: string | null
          status?: Database["public"]["Enums"]["consent_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_consents_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_consents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      dose_logs: {
        Row: {
          confirmed_offline: boolean
          created_at: string
          escalation_next_at: string | null
          escalation_stage: number
          id: string
          medication_id: string
          missed_at: string | null
          patient_id: string
          reminder_sent_at: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["dose_status"]
          taken_at: string | null
          updated_at: string
          was_late: boolean
        }
        Insert: {
          confirmed_offline?: boolean
          created_at?: string
          escalation_next_at?: string | null
          escalation_stage?: number
          id?: string
          medication_id: string
          missed_at?: string | null
          patient_id: string
          reminder_sent_at?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["dose_status"]
          taken_at?: string | null
          updated_at?: string
          was_late?: boolean
        }
        Update: {
          confirmed_offline?: boolean
          created_at?: string
          escalation_next_at?: string | null
          escalation_stage?: number
          id?: string
          medication_id?: string
          missed_at?: string | null
          patient_id?: string
          reminder_sent_at?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["dose_status"]
          taken_at?: string | null
          updated_at?: string
          was_late?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "dose_logs_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dose_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      drug_catalog: {
        Row: {
          brand_name: string
          created_at: string
          generic_name: string
          notes: string | null
        }
        Insert: {
          brand_name: string
          created_at?: string
          generic_name: string
          notes?: string | null
        }
        Update: {
          brand_name?: string
          created_at?: string
          generic_name?: string
          notes?: string | null
        }
        Relationships: []
      }
      drug_info_cache: {
        Row: {
          ar_translation: Json | null
          created_at: string
          fetched_at: string | null
          generic_name: string
          label: Json | null
          source: string | null
        }
        Insert: {
          ar_translation?: Json | null
          created_at?: string
          fetched_at?: string | null
          generic_name: string
          label?: Json | null
          source?: string | null
        }
        Update: {
          ar_translation?: Json | null
          created_at?: string
          fetched_at?: string | null
          generic_name?: string
          label?: Json | null
          source?: string | null
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          patient_id: string
          phone: string | null
          priority: number
          relationship: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          patient_id: string
          phone?: string | null
          priority?: number
          relationship?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          patient_id?: string
          phone?: string | null
          priority?: number
          relationship?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_dispatch: {
        Row: {
          alert_id: string
          created_at: string
          token_plain: string
        }
        Insert: {
          alert_id: string
          created_at?: string
          token_plain: string
        }
        Update: {
          alert_id?: string
          created_at?: string
          token_plain?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_dispatch_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: true
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_schedules: {
        Row: {
          created_at: string
          days_of_week: number[]
          id: string
          medication_id: string
          times: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          days_of_week?: number[]
          id?: string
          medication_id: string
          times: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          days_of_week?: number[]
          id?: string
          medication_id?: string
          times?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_schedules_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: true
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          color: string
          created_at: string
          deleted_at: string | null
          dose_amount: string
          end_date: string | null
          form: Database["public"]["Enums"]["med_form"]
          generic_name: string | null
          id: string
          instructions: string | null
          is_active: boolean
          meal: Database["public"]["Enums"]["meal_rule"]
          name: string
          patient_id: string
          source: string
          start_date: string
          strength: string | null
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          deleted_at?: string | null
          dose_amount: string
          end_date?: string | null
          form?: Database["public"]["Enums"]["med_form"]
          generic_name?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          meal?: Database["public"]["Enums"]["meal_rule"]
          name: string
          patient_id: string
          source?: string
          start_date?: string
          strength?: string | null
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          deleted_at?: string | null
          dose_amount?: string
          end_date?: string | null
          form?: Database["public"]["Enums"]["med_form"]
          generic_name?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          meal?: Database["public"]["Enums"]["meal_rule"]
          name?: string
          patient_id?: string
          source?: string
          start_date?: string
          strength?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          allergies: string[]
          blood_type: string | null
          chronic_conditions: string[]
          created_at: string
          date_of_birth: string | null
          demo_mode: boolean
          gender: string | null
          id: string
          lives_alone: boolean
          share_code: string
          timezone: string
          updated_at: string
        }
        Insert: {
          allergies?: string[]
          blood_type?: string | null
          chronic_conditions?: string[]
          created_at?: string
          date_of_birth?: string | null
          demo_mode?: boolean
          gender?: string | null
          id: string
          lives_alone?: boolean
          share_code: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          allergies?: string[]
          blood_type?: string | null
          chronic_conditions?: string[]
          created_at?: string
          date_of_birth?: string | null
          demo_mode?: boolean
          gender?: string | null
          id?: string
          lives_alone?: boolean
          share_code?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          font_scale: number
          full_name: string
          high_contrast: boolean
          id: string
          locale: string
          numerals: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          specialty: string | null
          theme: string
          updated_at: string
          voice_enabled: boolean
        }
        Insert: {
          created_at?: string
          font_scale?: number
          full_name: string
          high_contrast?: boolean
          id: string
          locale?: string
          numerals?: string
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          specialty?: string | null
          theme?: string
          updated_at?: string
          voice_enabled?: boolean
        }
        Update: {
          created_at?: string
          font_scale?: number
          full_name?: string
          high_contrast?: boolean
          id?: string
          locale?: string
          numerals?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          specialty?: string | null
          theme?: string
          updated_at?: string
          voice_enabled?: boolean
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string | null
          created_at: string
          endpoint: string
          id: string
          p256dh: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth?: string | null
          created_at?: string
          endpoint: string
          id?: string
          p256dh?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ack_emergency: { Args: { p_token: string }; Returns: boolean }
      confirm_dose: {
        Args: { p_dose_id: string; p_offline?: boolean; p_taken_at?: string }
        Returns: boolean
      }
      create_demo_dose: { Args: never; Returns: string }
      delete_medication: { Args: { p_id: string }; Returns: boolean }
      extend_dose_horizon: { Args: never; Returns: number }
      generate_doses: {
        Args: { p_days?: number; p_patient: string }
        Returns: number
      }
      generate_unique_share_code: { Args: never; Returns: string }
      get_adherence: {
        Args: { p_from: string; p_patient: string; p_to: string }
        Returns: Json
      }
      get_emergency_alert: { Args: { p_token: string }; Returns: Json }
      get_setting_int: {
        Args: { p_default: number; p_key: string }
        Returns: number
      }
      has_doctor_consent: { Args: { p_patient: string }; Returns: boolean }
      is_linked_caregiver: { Args: { p_patient: string }; Returns: boolean }
      log_access: {
        Args: { p_patient: string; p_resource: string }
        Returns: boolean
      }
      mark_alert_seen: { Args: { p_id: string }; Returns: boolean }
      regenerate_share_code: { Args: never; Returns: string }
      request_caregiver_link: { Args: { p_code: string }; Returns: Json }
      request_doctor_consent: { Args: { p_code: string }; Returns: Json }
      respond_care_link: {
        Args: { p_accept: boolean; p_id: string }
        Returns: boolean
      }
      respond_doctor_consent: {
        Args: { p_accept: boolean; p_id: string }
        Returns: boolean
      }
      revoke_care_link: { Args: { p_id: string }; Returns: boolean }
      run_tick: { Args: never; Returns: Json }
      set_demo_mode: { Args: { p_on: boolean }; Returns: boolean }
      upsert_medication_with_schedule: {
        Args: {
          p_color: string
          p_days: number[]
          p_dose_amount: string
          p_end: string | null
          p_form: Database["public"]["Enums"]["med_form"]
          p_generic: string | null
          p_id: string
          p_instructions: string | null
          p_meal: Database["public"]["Enums"]["meal_rule"]
          p_name: string
          p_start: string
          p_strength: string | null
          p_times: string[]
          p_updated_at?: string
        }
        Returns: string
      }
      withdraw_doctor_consent: { Args: { p_id: string }; Returns: boolean }
    }
    Enums: {
      alert_channel: "push" | "in_app" | "email"
      alert_kind:
        | "reminder"
        | "missed"
        | "followup_1"
        | "followup_2"
        | "emergency"
        | "confirmed_notice"
        | "no_emergency_contact_notice"
      alert_status:
        | "pending"
        | "sent"
        | "failed"
        | "skipped_no_recipient"
        | "seen"
        | "acknowledged"
      consent_status: "pending" | "given" | "rejected" | "withdrawn"
      dose_status: "scheduled" | "taken" | "missed"
      link_status: "pending" | "active" | "rejected" | "revoked"
      meal_rule: "before" | "with" | "after" | "any"
      med_form:
        | "tablet"
        | "capsule"
        | "syrup"
        | "injection"
        | "drops"
        | "cream"
        | "inhaler"
        | "other"
      user_role: "patient" | "caregiver" | "doctor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      alert_channel: ["push", "in_app", "email"],
      alert_kind: [
        "reminder",
        "missed",
        "followup_1",
        "followup_2",
        "emergency",
        "confirmed_notice",
        "no_emergency_contact_notice",
      ],
      alert_status: [
        "pending",
        "sent",
        "failed",
        "skipped_no_recipient",
        "seen",
        "acknowledged",
      ],
      consent_status: ["pending", "given", "rejected", "withdrawn"],
      dose_status: ["scheduled", "taken", "missed"],
      link_status: ["pending", "active", "rejected", "revoked"],
      meal_rule: ["before", "with", "after", "any"],
      med_form: [
        "tablet",
        "capsule",
        "syrup",
        "injection",
        "drops",
        "cream",
        "inhaler",
        "other",
      ],
      user_role: ["patient", "caregiver", "doctor"],
    },
  },
} as const;

export type UserRole = Database['public']['Enums']['user_role'];
export type MedForm = Database['public']['Enums']['med_form'];
export type MealRule = Database['public']['Enums']['meal_rule'];
export type DoseStatus = Database['public']['Enums']['dose_status'];
export type AlertKind = Database['public']['Enums']['alert_kind'];
export type AlertChannel = Database['public']['Enums']['alert_channel'];
export type AlertStatus = Database['public']['Enums']['alert_status'];
export type LinkStatus = Database['public']['Enums']['link_status'];
export type ConsentStatus = Database['public']['Enums']['consent_status'];
