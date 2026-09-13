/**
 * Auto-generated from the live `ai.gov-prod` Supabase project
 * (project ref: ceppqcqgwietagzixrhr) via Supabase's own type generator —
 * this file reflects the actual schema, not a hand-written guess.
 * Regenerate with: `supabase gen types typescript --project-id ceppqcqgwietagzixrhr`
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          id: number
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: number
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: number
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: []
      }
      explainability_reports: {
        Row: {
          audit_id: string
          created_at: string
          feature_importances: Json | null
          id: string
          method: string
          summary: string | null
        }
        Insert: {
          audit_id: string
          created_at?: string
          feature_importances?: Json | null
          id?: string
          method: string
          summary?: string | null
        }
        Update: {
          audit_id?: string
          created_at?: string
          feature_importances?: Json | null
          id?: string
          method?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "explainability_reports_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "rai_audits"
            referencedColumns: ["id"]
          },
        ]
      }
      fairness_metrics: {
        Row: {
          audit_id: string
          compliant: boolean
          created_at: string
          group_a: string
          group_b: string
          id: string
          metric_type: string
          protected_attribute: string
          threshold_max: number | null
          threshold_min: number | null
          value: number
        }
        Insert: {
          audit_id: string
          compliant: boolean
          created_at?: string
          group_a: string
          group_b: string
          id?: string
          metric_type: string
          protected_attribute: string
          threshold_max?: number | null
          threshold_min?: number | null
          value: number
        }
        Update: {
          audit_id?: string
          compliant?: boolean
          created_at?: string
          group_a?: string
          group_b?: string
          id?: string
          metric_type?: string
          protected_attribute?: string
          threshold_max?: number | null
          threshold_min?: number | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "fairness_metrics_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "rai_audits"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      rai_audits: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          dataset_ref: string | null
          id: string
          model_id: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          dataset_ref?: string | null
          id?: string
          model_id?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          dataset_ref?: string | null
          id?: string
          model_id?: string | null
          status?: string
        }
        Relationships: []
      }
      rai_findings: {
        Row: {
          audit_id: string
          created_at: string
          details: Json | null
          id: string
          metric_name: string
          metric_value: number | null
          passed: boolean
          pillar: string
          severity: string | null
          threshold: number | null
        }
        Insert: {
          audit_id: string
          created_at?: string
          details?: Json | null
          id?: string
          metric_name: string
          metric_value?: number | null
          passed: boolean
          pillar: string
          severity?: string | null
          threshold?: number | null
        }
        Update: {
          audit_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          metric_name?: string
          metric_value?: number | null
          passed?: boolean
          pillar?: string
          severity?: string | null
          threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rai_findings_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "rai_audits"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "auditor" | "viewer"
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
  public: {
    Enums: {
      app_role: ["admin", "auditor", "viewer"],
    },
  },
} as const
