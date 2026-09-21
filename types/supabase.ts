export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      billing_accounts: {
        Row: { user_id: string; customer_id: string; plan_id: string | null; plan_tier: string; subscription_id: string | null; subscription_status: string | null; current_period_end: string | null; cancel_at_period_end: boolean; revision: number; checkout_token: string | null; checkout_plan: string | null; checkout_expires_at: string | null }
        Insert: { user_id: string; customer_id: string; plan_id?: string | null; plan_tier?: string; subscription_id?: string | null; subscription_status?: string | null; current_period_end?: string | null; cancel_at_period_end?: boolean; revision?: number }
        Update: { plan_id?: string | null; plan_tier?: string; subscription_id?: string | null; subscription_status?: string | null; current_period_end?: string | null; cancel_at_period_end?: boolean; revision?: number }
        Relationships: []
      }
      billing_webhook_events: {
        Row: { event_id: string; processed_at: string }
        Insert: { event_id: string; processed_at?: string }
        Update: { event_id?: string; processed_at?: string }
        Relationships: []
      }
      domains: {
        Row: {
          created_at: string
          created_by: string | null
          domain_name: string | null
          id: string
          name_id: string | null
          purchase_link: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          domain_name?: string | null
          id?: string
          name_id?: string | null
          purchase_link?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          domain_name?: string | null
          id?: string
          name_id?: string | null
          purchase_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_domains_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_domains_name_id_fkey"
            columns: ["name_id"]
            isOneToOne: false
            referencedRelation: "names"
            referencedColumns: ["id"]
          },
        ]
      }
      logos: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          logo_url: string | null
          name_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_logos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_logos_name_id_fkey"
            columns: ["name_id"]
            isOneToOne: false
            referencedRelation: "names"
            referencedColumns: ["id"]
          },
        ]
      }
      names: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          favorited: boolean | null
          id: string
          max_length: number | null
          min_length: number | null
          name: string
          session_id: string | null
          word_placement: string | null
          word_style: string | null
          word_to_include: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          favorited?: boolean | null
          id?: string
          max_length?: number | null
          min_length?: number | null
          name: string
          session_id?: string | null
          word_placement?: string | null
          word_style?: string | null
          word_to_include?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          favorited?: boolean | null
          id?: string
          max_length?: number | null
          min_length?: number | null
          name?: string
          session_id?: string | null
          word_placement?: string | null
          word_style?: string | null
          word_to_include?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_names_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      npm_names: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name_id: string | null
          npm_name: string | null
          purchase_link: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name_id?: string | null
          npm_name?: string | null
          purchase_link?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name_id?: string | null
          npm_name?: string | null
          purchase_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_npm_names_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_npm_names_name_id_fkey"
            columns: ["name_id"]
            isOneToOne: false
            referencedRelation: "names"
            referencedColumns: ["id"]
          },
        ]
      }
      one_pagers: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name_id: string | null
          pdf_url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name_id?: string | null
          pdf_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name_id?: string | null
          pdf_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_one_pagers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_one_pagers_name_id_fkey"
            columns: ["name_id"]
            isOneToOne: false
            referencedRelation: "names"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_deletion_token: string | null
          created_at: string | null
          customer_id: string | null
          email: string | null
          id: string
          name: string | null
          plan_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_deletion_token?: string | null
          created_at?: string | null
          customer_id?: string | null
          email?: string | null
          id: string
          name?: string | null
          plan_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_deletion_token?: string | null
          created_at?: string | null
          customer_id?: string | null
          email?: string | null
          id?: string
          name?: string | null
          plan_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      trademarks: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: number
          keyword: string | null
          link: string | null
          name_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          keyword?: string | null
          link?: string | null
          name_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          keyword?: string | null
          link?: string | null
          name_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_trademarks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_trademarks_name_id_fkey"
            columns: ["name_id"]
            isOneToOne: false
            referencedRelation: "names"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      begin_account_deletion: {
        Args: { p_user_id: string }
        Returns: string | null
      }
      finish_account_deletion: {
        Args: { p_user_id: string; p_token: string }
        Returns: undefined
      }
      renew_billing_checkout: {
        Args: { p_user_id: string; p_token: string; p_expires_at: number }
        Returns: Json
      }
      reserve_billing_checkout: {
        Args: { p_user_id: string; p_plan: string }
        Returns: Json
      }
      apply_billing_snapshot: {
        Args: { p_customer_id: string; p_revision: number; p_snapshot: Json; p_event_id?: string | null }
        Returns: boolean
      }

      checkIfUser: {
        Args: {
          given_mail: string
        }
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
