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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_activity_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          companion_slug: string
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          role: string
          user_id: string
        }
        Insert: {
          companion_slug: string
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          role: string
          user_id: string
        }
        Update: {
          companion_slug?: string
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      companion_applications: {
        Row: {
          admin_status: string
          age: number
          bio: string
          city: string
          created_at: string
          gender: string
          id: string
          image_url: string | null
          languages: string
          name: string
          payment_amount: number
          payment_reference: string | null
          payment_status: string
          rejection_reason: string | null
          tag: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_status?: string
          age: number
          bio?: string
          city?: string
          created_at?: string
          gender?: string
          id?: string
          image_url?: string | null
          languages?: string
          name: string
          payment_amount?: number
          payment_reference?: string | null
          payment_status?: string
          rejection_reason?: string | null
          tag?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_status?: string
          age?: number
          bio?: string
          city?: string
          created_at?: string
          gender?: string
          id?: string
          image_url?: string | null
          languages?: string
          name?: string
          payment_amount?: number
          payment_reference?: string | null
          payment_status?: string
          rejection_reason?: string | null
          tag?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      companions: {
        Row: {
          age: number
          banned_at: string | null
          bio: string
          city: string
          created_at: string
          gender: string
          id: string
          image_key: string | null
          image_url: string | null
          is_real_user: boolean
          languages: string
          name: string
          owner_user_id: string | null
          rate_per_min: number
          slug: string
          status: string
          tag: string
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          age: number
          banned_at?: string | null
          bio?: string
          city?: string
          created_at?: string
          gender?: string
          id?: string
          image_key?: string | null
          image_url?: string | null
          is_real_user?: boolean
          languages?: string
          name: string
          owner_user_id?: string | null
          rate_per_min?: number
          slug: string
          status?: string
          tag?: string
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          age?: number
          banned_at?: string | null
          bio?: string
          city?: string
          created_at?: string
          gender?: string
          id?: string
          image_key?: string | null
          image_url?: string | null
          is_real_user?: boolean
          languages?: string
          name?: string
          owner_user_id?: string | null
          rate_per_min?: number
          slug?: string
          status?: string
          tag?: string
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_user_id: string | null
          referrer_user_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_user_id?: string | null
          referrer_user_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_user_id?: string | null
          referrer_user_id?: string
          status?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          age: number
          balance_minutes: number
          created_at: string | null
          display_name: string | null
          gender: string
          id: string
          preferred_gender: string
          referral_code: string | null
          spin_credits: number
          user_id: string
        }
        Insert: {
          age: number
          balance_minutes?: number
          created_at?: string | null
          display_name?: string | null
          gender: string
          id?: string
          preferred_gender: string
          referral_code?: string | null
          spin_credits?: number
          user_id: string
        }
        Update: {
          age?: number
          balance_minutes?: number
          created_at?: string | null
          display_name?: string | null
          gender?: string
          id?: string
          preferred_gender?: string
          referral_code?: string | null
          spin_credits?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number | null
          created_at: string | null
          description: string | null
          id: string
          minutes: number
          type: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          minutes: number
          type: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          minutes?: number
          type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      process_referral: {
        Args: { p_referral_code: string; p_referred_user_id: string }
        Returns: boolean
      }
      try_assign_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
