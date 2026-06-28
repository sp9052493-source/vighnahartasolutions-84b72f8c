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
      aaple_sarkar_applications: {
        Row: {
          address: string
          admin_remarks: string | null
          applicant_name: string
          applicant_name_mr: string | null
          cost: number
          created_at: string
          district: string | null
          documents: Json
          email: string | null
          father_name: string | null
          id: string
          mobile: string
          notes: string | null
          pincode: string | null
          purpose: string | null
          receipt_no: string
          result_doc_url: string | null
          service_label: string
          service_type: string
          status: Database["public"]["Enums"]["application_status"]
          taluka: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          admin_remarks?: string | null
          applicant_name: string
          applicant_name_mr?: string | null
          cost?: number
          created_at?: string
          district?: string | null
          documents?: Json
          email?: string | null
          father_name?: string | null
          id?: string
          mobile: string
          notes?: string | null
          pincode?: string | null
          purpose?: string | null
          receipt_no: string
          result_doc_url?: string | null
          service_label: string
          service_type: string
          status?: Database["public"]["Enums"]["application_status"]
          taluka?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          admin_remarks?: string | null
          applicant_name?: string
          applicant_name_mr?: string | null
          cost?: number
          created_at?: string
          district?: string | null
          documents?: Json
          email?: string | null
          father_name?: string | null
          id?: string
          mobile?: string
          notes?: string | null
          pincode?: string | null
          purpose?: string | null
          receipt_no?: string
          result_doc_url?: string | null
          service_label?: string
          service_type?: string
          status?: Database["public"]["Enums"]["application_status"]
          taluka?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      aaple_sarkar_services: {
        Row: {
          active: boolean
          config: Json
          created_at: string
          desc_en: string
          desc_mr: string
          extra_fields: Json
          id: string
          name_en: string
          name_mr: string
          price: number
          required_docs: Json
          sort_order: number
          tone: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          config?: Json
          created_at?: string
          desc_en?: string
          desc_mr?: string
          extra_fields?: Json
          id?: string
          name_en: string
          name_mr: string
          price?: number
          required_docs?: Json
          sort_order?: number
          tone?: string
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          config?: Json
          created_at?: string
          desc_en?: string
          desc_mr?: string
          extra_fields?: Json
          id?: string
          name_en?: string
          name_mr?: string
          price?: number
          required_docs?: Json
          sort_order?: number
          tone?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_requests: {
        Row: {
          cost: number
          created_at: string
          document_url: string | null
          error_message: string | null
          id: string
          input_value: string
          result_data: Json | null
          service_id: string
          service_name: string
          status: string
          user_id: string
        }
        Insert: {
          cost?: number
          created_at?: string
          document_url?: string | null
          error_message?: string | null
          id?: string
          input_value: string
          result_data?: Json | null
          service_id: string
          service_name: string
          status?: string
          user_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          document_url?: string | null
          error_message?: string | null
          id?: string
          input_value?: string
          result_data?: Json | null
          service_id?: string
          service_name?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateways: {
        Row: {
          display_name: string
          enabled: boolean
          extra: Json
          is_primary: boolean
          key_id_public: string | null
          merchant_id: string | null
          mode: string
          provider: string
          secret_key_name: string | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          display_name: string
          enabled?: boolean
          extra?: Json
          is_primary?: boolean
          key_id_public?: string | null
          merchant_id?: string | null
          mode?: string
          provider: string
          secret_key_name?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          display_name?: string
          enabled?: boolean
          extra?: Json
          is_primary?: boolean
          key_id_public?: string | null
          merchant_id?: string | null
          mode?: string
          provider?: string
          secret_key_name?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      payment_orders: {
        Row: {
          amount: number
          created_at: string
          credited: boolean
          id: string
          order_id: string
          provider: string
          provider_response: Json | null
          provider_txn_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          credited?: boolean
          id?: string
          order_id: string
          provider?: string
          provider_response?: Json | null
          provider_txn_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          credited?: boolean
          id?: string
          order_id?: string
          provider?: string
          provider_response?: Json | null
          provider_txn_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          business_name: string | null
          created_at: string
          full_name: string
          id: string
          kyc_aadhaar_url: string | null
          kyc_extra_url: string | null
          kyc_pan_url: string | null
          parent_id: string | null
          phone: string | null
          photo_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          full_name?: string
          id: string
          kyc_aadhaar_url?: string | null
          kyc_extra_url?: string | null
          kyc_pan_url?: string | null
          parent_id?: string | null
          phone?: string | null
          photo_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          business_name?: string | null
          created_at?: string
          full_name?: string
          id?: string
          kyc_aadhaar_url?: string | null
          kyc_extra_url?: string | null
          kyc_pan_url?: string | null
          parent_id?: string | null
          phone?: string | null
          photo_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_drafts: {
        Row: {
          created_at: string
          customer_name: string | null
          form_data: Json
          id: string
          service_key: string
          service_label: string
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          form_data?: Json
          id?: string
          service_key: string
          service_label: string
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          form_data?: Json
          id?: string
          service_key?: string
          service_label?: string
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          api_enabled: boolean
          api_endpoint: string | null
          api_notes: string | null
          api_provider: string
          category: string
          code: string
          created_at: string
          description: string | null
          distributor_commission: number
          id: string
          input_label: string
          name: string
          price: number
          retailer_commission: number
          sort_order: number
        }
        Insert: {
          active?: boolean
          api_enabled?: boolean
          api_endpoint?: string | null
          api_notes?: string | null
          api_provider?: string
          category?: string
          code: string
          created_at?: string
          description?: string | null
          distributor_commission?: number
          id?: string
          input_label?: string
          name: string
          price?: number
          retailer_commission?: number
          sort_order?: number
        }
        Update: {
          active?: boolean
          api_enabled?: boolean
          api_endpoint?: string | null
          api_notes?: string | null
          api_provider?: string
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          distributor_commission?: number
          id?: string
          input_label?: string
          name?: string
          price?: number
          retailer_commission?: number
          sort_order?: number
        }
        Relationships: []
      }
      site_pages: {
        Row: {
          content_md: string
          meta_description: string | null
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content_md?: string
          meta_description?: string | null
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content_md?: string
          meta_description?: string | null
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          brand_tagline: string | null
          business_hours: string | null
          city: string | null
          company_name: string
          contact_email: string | null
          country: string | null
          favicon_url: string | null
          gst_number: string | null
          id: string
          logo_url: string | null
          phone: string | null
          pincode: string | null
          social: Json
          state: string | null
          support_email: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          brand_tagline?: string | null
          business_hours?: string | null
          city?: string | null
          company_name?: string
          contact_email?: string | null
          country?: string | null
          favicon_url?: string | null
          gst_number?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          pincode?: string | null
          social?: Json
          state?: string | null
          support_email?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          brand_tagline?: string | null
          business_hours?: string | null
          city?: string | null
          company_name?: string
          contact_email?: string | null
          country?: string | null
          favicon_url?: string | null
          gst_number?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          pincode?: string | null
          social?: Json
          state?: string | null
          support_email?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_service_pricing: {
        Row: {
          created_at: string
          distributor_commission: number
          id: string
          note: string | null
          price: number
          service_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          distributor_commission?: number
          id?: string
          note?: string | null
          price: number
          service_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          distributor_commission?: number
          id?: string
          note?: string | null
          price?: number
          service_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_service_pricing_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_service_pricing_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_adjust_wallet: {
        Args: { p_amount: number; p_description: string; p_user_id: string }
        Returns: number
      }
      complete_document_request: {
        Args: {
          p_doc_url: string
          p_input: string
          p_result: Json
          p_service_id: string
          p_user_id: string
        }
        Returns: {
          cost: number
          created_at: string
          document_url: string | null
          error_message: string | null
          id: string
          input_value: string
          result_data: Json | null
          service_id: string
          service_name: string
          status: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "document_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "distributor" | "retailer"
      application_status:
        | "submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "completed"
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
      app_role: ["admin", "distributor", "retailer"],
      application_status: [
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "completed",
      ],
    },
  },
} as const
