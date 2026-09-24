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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      competition_registrations: {
        Row: {
          cancelled_at: string | null
          competition_id: string
          id: string
          payment_status: string
          registered_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          competition_id: string
          id?: string
          payment_status?: string
          registered_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          competition_id?: string
          id?: string
          payment_status?: string
          registered_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_registrations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_rewards: {
        Row: {
          amount_paise: number
          competition_id: string
          icon: string
          id: string
          label: string
          rank: number
        }
        Insert: {
          amount_paise: number
          competition_id: string
          icon?: string
          id?: string
          label: string
          rank: number
        }
        Update: {
          amount_paise?: number
          competition_id?: string
          icon?: string
          id?: string
          label?: string
          rank?: number
        }
        Relationships: [
          {
            foreignKeyName: "competition_rewards_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_submissions: {
        Row: {
          competition_id: string
          id: string
          media_url: string
          registration_id: string
          status: string
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          competition_id: string
          id?: string
          media_url: string
          registration_id: string
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          competition_id?: string
          id?: string
          media_url?: string
          registration_id?: string
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_submissions_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_submissions_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: true
            referencedRelation: "competition_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_winners: {
        Row: {
          competition_id: string
          display_name: string
          display_order: number
          id: string
          image_key: string
          placement_label: string
          published: boolean
          video_url: string | null
        }
        Insert: {
          competition_id: string
          display_name: string
          display_order?: number
          id?: string
          image_key: string
          placement_label: string
          published?: boolean
          video_url?: string | null
        }
        Update: {
          competition_id?: string
          display_name?: string
          display_order?: number
          id?: string
          image_key?: string
          placement_label?: string
          published?: boolean
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_winners_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          about: string
          booked_count: number
          capacity: number
          category: string
          certificate_enabled: boolean
          created_at: string
          currency: string
          disclaimer: string
          entry_fee_paise: number
          format_label: string
          id: string
          judge_id: string | null
          judging_parameters: string
          prize_pool_paise: number
          publication_status: string
          referral_reward_paise: number
          registration_closes_at: string
          registration_opens_at: string
          results_at: string
          rules_eligibility: string
          slug: string
          submission_closes_at: string
          submission_opens_at: string
          title: string
          updated_at: string
        }
        Insert: {
          about: string
          booked_count?: number
          capacity: number
          category: string
          certificate_enabled?: boolean
          created_at?: string
          currency?: string
          disclaimer: string
          entry_fee_paise?: number
          format_label: string
          id?: string
          judge_id?: string | null
          judging_parameters: string
          prize_pool_paise?: number
          publication_status?: string
          referral_reward_paise?: number
          registration_closes_at: string
          registration_opens_at: string
          results_at: string
          rules_eligibility: string
          slug: string
          submission_closes_at: string
          submission_opens_at: string
          title: string
          updated_at?: string
        }
        Update: {
          about?: string
          booked_count?: number
          capacity?: number
          category?: string
          certificate_enabled?: boolean
          created_at?: string
          currency?: string
          disclaimer?: string
          entry_fee_paise?: number
          format_label?: string
          id?: string
          judge_id?: string | null
          judging_parameters?: string
          prize_pool_paise?: number
          publication_status?: string
          referral_reward_paise?: number
          registration_closes_at?: string
          registration_opens_at?: string
          results_at?: string
          rules_eligibility?: string
          slug?: string
          submission_closes_at?: string
          submission_opens_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitions_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "judges"
            referencedColumns: ["id"]
          },
        ]
      }
      judges: {
        Row: {
          created_at: string
          experience: string
          id: string
          image_key: string
          intro_video_url: string | null
          name: string
          title: string
        }
        Insert: {
          created_at?: string
          experience: string
          id?: string
          image_key: string
          intro_video_url?: string | null
          name: string
          title: string
        }
        Update: {
          created_at?: string
          experience?: string
          id?: string
          image_key?: string
          intro_video_url?: string | null
          name?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      register_for_competition: {
        Args: { _competition_id: string }
        Returns: {
          cancelled_at: string | null
          competition_id: string
          id: string
          payment_status: string
          registered_at: string
          status: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "competition_registrations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_competition_entry: {
        Args: { _competition_id: string; _media_url: string }
        Returns: {
          competition_id: string
          id: string
          media_url: string
          registration_id: string
          status: string
          submitted_at: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "competition_submissions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      withdraw_from_competition: {
        Args: { _competition_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
