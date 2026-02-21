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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_email: string
          admin_id: string | null
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_email: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_email?: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          email: string
          id: string
          last_login_at: string | null
          role: Database["public"]["Enums"]["admin_role"]
          two_factor_enabled: boolean
          two_factor_secret: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          email: string
          id?: string
          last_login_at?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          email?: string
          id?: string
          last_login_at?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      alert_configs: {
        Row: {
          alert_type: string
          channels: string[]
          created_at: string
          email_recipients: string[] | null
          enabled: boolean
          id: string
          name: string
          slack_webhook: string | null
          threshold: number | null
          updated_at: string
        }
        Insert: {
          alert_type: string
          channels?: string[]
          created_at?: string
          email_recipients?: string[] | null
          enabled?: boolean
          id?: string
          name: string
          slack_webhook?: string | null
          threshold?: number | null
          updated_at?: string
        }
        Update: {
          alert_type?: string
          channels?: string[]
          created_at?: string
          email_recipients?: string[] | null
          enabled?: boolean
          id?: string
          name?: string
          slack_webhook?: string | null
          threshold?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      alert_history: {
        Row: {
          alert_config_id: string | null
          alert_type: string
          channels_sent: string[]
          created_at: string
          error_message: string | null
          id: string
          message: string
          success: boolean
        }
        Insert: {
          alert_config_id?: string | null
          alert_type: string
          channels_sent: string[]
          created_at?: string
          error_message?: string | null
          id?: string
          message: string
          success?: boolean
        }
        Update: {
          alert_config_id?: string | null
          alert_type?: string
          channels_sent?: string[]
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "alert_history_alert_config_id_fkey"
            columns: ["alert_config_id"]
            isOneToOne: false
            referencedRelation: "alert_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_cents: number | null
          updated_at: string
          used_count: number
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_cents?: number | null
          updated_at?: string
          used_count?: number
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_cents?: number | null
          updated_at?: string
          used_count?: number
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      daily_stats: {
        Row: {
          created_at: string
          date: string
          esims_activated: number
          failed_orders: number
          new_customers: number
          orders_count: number
          orders_revenue: number
          refunds_amount: number
          refunds_count: number
        }
        Insert: {
          created_at?: string
          date: string
          esims_activated?: number
          failed_orders?: number
          new_customers?: number
          orders_count?: number
          orders_revenue?: number
          refunds_amount?: number
          refunds_count?: number
        }
        Update: {
          created_at?: string
          date?: string
          esims_activated?: number
          failed_orders?: number
          new_customers?: number
          orders_count?: number
          orders_revenue?: number
          refunds_amount?: number
          refunds_count?: number
        }
        Relationships: []
      }
      esims: {
        Row: {
          activation_code: string | null
          created_at: string
          data_total_bytes: number | null
          data_used_bytes: number | null
          esim_tran_no: string | null
          expires_at: string | null
          iccid: string | null
          id: string
          last_queried_at: string | null
          order_item_id: string
          provider: string
          provider_order_no: string | null
          qr_code_url: string | null
          smdp_status: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          activation_code?: string | null
          created_at?: string
          data_total_bytes?: number | null
          data_used_bytes?: number | null
          esim_tran_no?: string | null
          expires_at?: string | null
          iccid?: string | null
          id?: string
          last_queried_at?: string | null
          order_item_id: string
          provider?: string
          provider_order_no?: string | null
          qr_code_url?: string | null
          smdp_status?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          activation_code?: string | null
          created_at?: string
          data_total_bytes?: number | null
          data_used_bytes?: number | null
          esim_tran_no?: string | null
          expires_at?: string | null
          iccid?: string | null
          id?: string
          last_queried_at?: string | null
          order_item_id?: string
          provider?: string
          provider_order_no?: string | null
          qr_code_url?: string | null
          smdp_status?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "esims_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      fulfillment_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          order_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          order_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          order_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fulfillment_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_coupons: {
        Row: {
          coupon_id: string
          created_at: string
          discount_cents: number
          id: string
          order_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          discount_cents: number
          id?: string
          order_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          discount_cents?: number
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_coupons_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_coupons_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          country_code: string
          created_at: string
          duration_days: number
          fulfillment_error: string | null
          fulfillment_status: string | null
          id: string
          order_id: string
          package_code: string
          package_name: string
          provider: string
          quantity: number
          retry_count: number | null
          unit_price_cents: number
          volume_bytes: string
        }
        Insert: {
          country_code: string
          created_at?: string
          duration_days: number
          fulfillment_error?: string | null
          fulfillment_status?: string | null
          id?: string
          order_id: string
          package_code: string
          package_name: string
          provider?: string
          quantity?: number
          retry_count?: number | null
          unit_price_cents: number
          volume_bytes: string
        }
        Update: {
          country_code?: string
          created_at?: string
          duration_days?: number
          fulfillment_error?: string | null
          fulfillment_status?: string | null
          id?: string
          order_id?: string
          package_code?: string
          package_name?: string
          provider?: string
          quantity?: number
          retry_count?: number | null
          unit_price_cents?: number
          volume_bytes?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_total: number
          created_at: string
          currency: string
          guest_email: string | null
          id: string
          ip_address: string | null
          locale: string
          payment_intent_id: string | null
          payment_invoice_id: string | null
          payment_session_id: string | null
          refunded_amount: number | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_total?: number
          created_at?: string
          currency?: string
          guest_email?: string | null
          id?: string
          ip_address?: string | null
          locale?: string
          payment_intent_id?: string | null
          payment_invoice_id?: string | null
          payment_session_id?: string | null
          refunded_amount?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_total?: number
          created_at?: string
          currency?: string
          guest_email?: string | null
          id?: string
          ip_address?: string | null
          locale?: string
          payment_intent_id?: string | null
          payment_invoice_id?: string | null
          payment_session_id?: string | null
          refunded_amount?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      packages_cache: {
        Row: {
          cached_at: string
          country_code: string
          country_name: string
          data_type: number
          duration_days: number
          is_active: boolean
          is_multi_country: boolean | null
          name: string
          network_list: Json | null
          package_code: string
          price_usd: number
          provider: string
          region: string | null
          retail_price_cents: number
          volume_bytes: string
        }
        Insert: {
          cached_at?: string
          country_code: string
          country_name: string
          data_type?: number
          duration_days: number
          is_active?: boolean
          is_multi_country?: boolean | null
          name: string
          network_list?: Json | null
          package_code: string
          price_usd: number
          provider?: string
          region?: string | null
          retail_price_cents: number
          volume_bytes: string
        }
        Update: {
          cached_at?: string
          country_code?: string
          country_name?: string
          data_type?: number
          duration_days?: number
          is_active?: boolean
          is_multi_country?: boolean | null
          name?: string
          network_list?: Json | null
          package_code?: string
          price_usd?: number
          provider?: string
          region?: string | null
          retail_price_cents?: number
          volume_bytes?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          id: string
          identifier: string
          key: string
        }
        Insert: {
          created_at?: string
          id?: string
          identifier: string
          key: string
        }
        Update: {
          created_at?: string
          id?: string
          identifier?: string
          key?: string
        }
        Relationships: []
      }
      refund_requests: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          order_id: string
          payment_refund_id: string | null
          processed_at: string | null
          reason: string
          status: string
          updated_at: string
          user_email: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          order_id: string
          payment_refund_id?: string | null
          processed_at?: string | null
          reason: string
          status?: string
          updated_at?: string
          user_email?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          order_id?: string
          payment_refund_id?: string | null
          processed_at?: string | null
          reason?: string
          status?: string
          updated_at?: string
          user_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      session_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          token_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          token_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          token_type?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          guest_email: string
          id: string
          order_id: string | null
          priority: Database["public"]["Enums"]["ticket_priority"]
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          guest_email: string
          id?: string
          order_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          guest_email?: string
          id?: string
          order_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          sender_email: string
          sender_type: Database["public"]["Enums"]["ticket_sender"]
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_email: string
          sender_type: Database["public"]["Enums"]["ticket_sender"]
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_email?: string
          sender_type?: Database["public"]["Enums"]["ticket_sender"]
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          event_id: string
          event_type: string
          id: string
          processed_at: string
          provider: string
        }
        Insert: {
          event_id: string
          event_type: string
          id?: string
          processed_at?: string
          provider: string
        }
        Update: {
          event_id?: string
          event_type?: string
          id?: string
          processed_at?: string
          provider?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acquire_fulfillment_lock: { Args: { order_id: string }; Returns: boolean }
      cleanup_expired_tokens: { Args: never; Returns: undefined }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      cleanup_old_webhook_events: { Args: never; Returns: undefined }
      increment_coupon_usage: {
        Args: { coupon_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      update_daily_stats: { Args: never; Returns: undefined }
    }
    Enums: {
      admin_role: "super_admin" | "admin" | "finance" | "support"
      ticket_priority: "low" | "medium" | "high"
      ticket_sender: "customer" | "admin"
      ticket_status: "open" | "pending" | "resolved" | "closed"
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
      admin_role: ["super_admin", "admin", "finance", "support"],
      ticket_priority: ["low", "medium", "high"],
      ticket_sender: ["customer", "admin"],
      ticket_status: ["open", "pending", "resolved", "closed"],
    },
  },
} as const
