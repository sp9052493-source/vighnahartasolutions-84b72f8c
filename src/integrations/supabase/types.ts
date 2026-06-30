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
          charged: number
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
          charged?: number
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
          charged?: number
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
      fssai_application_documents: {
        Row: {
          application_id: string
          created_at: string
          doc_type: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          uploaded_by: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          doc_type: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          doc_type?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fssai_application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "fssai_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      fssai_application_events: {
        Row: {
          actor_id: string | null
          actor_role: string | null
          application_id: string
          created_at: string
          event_type: string
          from_status: Database["public"]["Enums"]["fssai_status"] | null
          id: string
          note: string | null
          to_status: Database["public"]["Enums"]["fssai_status"] | null
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string | null
          application_id: string
          created_at?: string
          event_type: string
          from_status?: Database["public"]["Enums"]["fssai_status"] | null
          id?: string
          note?: string | null
          to_status?: Database["public"]["Enums"]["fssai_status"] | null
        }
        Update: {
          actor_id?: string | null
          actor_role?: string | null
          application_id?: string
          created_at?: string
          event_type?: string
          from_status?: Database["public"]["Enums"]["fssai_status"] | null
          id?: string
          note?: string | null
          to_status?: Database["public"]["Enums"]["fssai_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "fssai_application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "fssai_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      fssai_applications: {
        Row: {
          aadhaar_number: string | null
          applicant_name: string | null
          application_no: string
          business_address: string | null
          business_city: string | null
          business_district: string | null
          business_name: string | null
          business_pincode: string | null
          business_state: string | null
          business_type: string | null
          certificate_url: string | null
          created_at: string
          dob: string | null
          email: string | null
          father_name: string | null
          food_category: string | null
          gender: string | null
          id: string
          license_type: string | null
          mobile: string | null
          pan_number: string | null
          remarks: string | null
          status: Database["public"]["Enums"]["fssai_status"]
          submitted_at: string | null
          total_charged: number | null
          updated_at: string
          user_id: string
          validity_years: number | null
          wallet_txn_id: string | null
        }
        Insert: {
          aadhaar_number?: string | null
          applicant_name?: string | null
          application_no?: string
          business_address?: string | null
          business_city?: string | null
          business_district?: string | null
          business_name?: string | null
          business_pincode?: string | null
          business_state?: string | null
          business_type?: string | null
          certificate_url?: string | null
          created_at?: string
          dob?: string | null
          email?: string | null
          father_name?: string | null
          food_category?: string | null
          gender?: string | null
          id?: string
          license_type?: string | null
          mobile?: string | null
          pan_number?: string | null
          remarks?: string | null
          status?: Database["public"]["Enums"]["fssai_status"]
          submitted_at?: string | null
          total_charged?: number | null
          updated_at?: string
          user_id: string
          validity_years?: number | null
          wallet_txn_id?: string | null
        }
        Update: {
          aadhaar_number?: string | null
          applicant_name?: string | null
          application_no?: string
          business_address?: string | null
          business_city?: string | null
          business_district?: string | null
          business_name?: string | null
          business_pincode?: string | null
          business_state?: string | null
          business_type?: string | null
          certificate_url?: string | null
          created_at?: string
          dob?: string | null
          email?: string | null
          father_name?: string | null
          food_category?: string | null
          gender?: string | null
          id?: string
          license_type?: string | null
          mobile?: string | null
          pan_number?: string | null
          remarks?: string | null
          status?: Database["public"]["Enums"]["fssai_status"]
          submitted_at?: string | null
          total_charged?: number | null
          updated_at?: string
          user_id?: string
          validity_years?: number | null
          wallet_txn_id?: string | null
        }
        Relationships: []
      }
      fssai_service_config: {
        Row: {
          active: boolean
          basic_price: number
          central_price: number
          distributor_commission: number
          id: string
          instructions: string | null
          state_price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          basic_price?: number
          central_price?: number
          distributor_commission?: number
          id?: string
          instructions?: string | null
          state_price?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          basic_price?: number
          central_price?: number
          distributor_commission?: number
          id?: string
          instructions?: string | null
          state_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      gst_application_documents: {
        Row: {
          application_id: string
          doc_type: string
          file_name: string
          id: string
          mime_type: string
          size_bytes: number
          storage_path: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          application_id: string
          doc_type: string
          file_name: string
          id?: string
          mime_type: string
          size_bytes: number
          storage_path: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          application_id?: string
          doc_type?: string
          file_name?: string
          id?: string
          mime_type?: string
          size_bytes?: number
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gst_application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "gst_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      gst_application_events: {
        Row: {
          actor_id: string | null
          actor_role: string | null
          application_id: string
          created_at: string
          event_type: string
          from_status: string | null
          id: string
          message: string | null
          metadata: Json
          to_status: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string | null
          application_id: string
          created_at?: string
          event_type: string
          from_status?: string | null
          id?: string
          message?: string | null
          metadata?: Json
          to_status?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_role?: string | null
          application_id?: string
          created_at?: string
          event_type?: string
          from_status?: string | null
          id?: string
          message?: string | null
          metadata?: Json
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gst_application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "gst_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      gst_applications: {
        Row: {
          aadhaar_last4: string | null
          acknowledgement_path: string | null
          address_line1: string
          address_line2: string | null
          admin_remarks: string | null
          applicant_name: string
          application_no: string
          arn_no: string | null
          assigned_to: string | null
          bank_account_name: string | null
          bank_account_no: string | null
          bank_branch: string | null
          bank_ifsc: string | null
          bank_name: string | null
          business_name: string
          certificate_path: string | null
          city: string
          commencement_date: string | null
          constitution: string
          created_at: string
          district: string
          email: string
          estimated_turnover: number | null
          existing_registration: string | null
          govt_fee: number
          gstin: string | null
          hsn_codes: Json
          id: string
          internal_notes: string | null
          mobile: string
          nature_of_business: string
          pan: string
          pin_code: string
          service_charge: number
          signatory_designation: string | null
          signatory_email: string | null
          signatory_mobile: string | null
          signatory_name: string | null
          signatory_pan: string | null
          state: string
          status: string
          total_charged: number
          trade_name: string | null
          updated_at: string
          user_id: string
          wallet_txn_id: string | null
        }
        Insert: {
          aadhaar_last4?: string | null
          acknowledgement_path?: string | null
          address_line1: string
          address_line2?: string | null
          admin_remarks?: string | null
          applicant_name: string
          application_no: string
          arn_no?: string | null
          assigned_to?: string | null
          bank_account_name?: string | null
          bank_account_no?: string | null
          bank_branch?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          business_name: string
          certificate_path?: string | null
          city: string
          commencement_date?: string | null
          constitution: string
          created_at?: string
          district: string
          email: string
          estimated_turnover?: number | null
          existing_registration?: string | null
          govt_fee?: number
          gstin?: string | null
          hsn_codes?: Json
          id?: string
          internal_notes?: string | null
          mobile: string
          nature_of_business: string
          pan: string
          pin_code: string
          service_charge?: number
          signatory_designation?: string | null
          signatory_email?: string | null
          signatory_mobile?: string | null
          signatory_name?: string | null
          signatory_pan?: string | null
          state: string
          status?: string
          total_charged?: number
          trade_name?: string | null
          updated_at?: string
          user_id: string
          wallet_txn_id?: string | null
        }
        Update: {
          aadhaar_last4?: string | null
          acknowledgement_path?: string | null
          address_line1?: string
          address_line2?: string | null
          admin_remarks?: string | null
          applicant_name?: string
          application_no?: string
          arn_no?: string | null
          assigned_to?: string | null
          bank_account_name?: string | null
          bank_account_no?: string | null
          bank_branch?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          business_name?: string
          certificate_path?: string | null
          city?: string
          commencement_date?: string | null
          constitution?: string
          created_at?: string
          district?: string
          email?: string
          estimated_turnover?: number | null
          existing_registration?: string | null
          govt_fee?: number
          gstin?: string | null
          hsn_codes?: Json
          id?: string
          internal_notes?: string | null
          mobile?: string
          nature_of_business?: string
          pan?: string
          pin_code?: string
          service_charge?: number
          signatory_designation?: string | null
          signatory_email?: string | null
          signatory_mobile?: string | null
          signatory_name?: string | null
          signatory_pan?: string | null
          state?: string
          status?: string
          total_charged?: number
          trade_name?: string | null
          updated_at?: string
          user_id?: string
          wallet_txn_id?: string | null
        }
        Relationships: []
      }
      gst_service_config: {
        Row: {
          active: boolean
          govt_fee: number
          id: string
          instructions_en: string
          instructions_mr: string
          service_charge: number
          turnaround_text: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          govt_fee?: number
          id?: string
          instructions_en?: string
          instructions_mr?: string
          service_charge?: number
          turnaround_text?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          govt_fee?: number
          id?: string
          instructions_en?: string
          instructions_mr?: string
          service_charge?: number
          turnaround_text?: string
          updated_at?: string
        }
        Relationships: []
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
      shopact_application_documents: {
        Row: {
          application_id: string
          created_at: string
          doc_type: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          uploaded_by: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          doc_type: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          doc_type?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopact_application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "shopact_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      shopact_application_events: {
        Row: {
          actor_id: string | null
          actor_role: string | null
          application_id: string
          created_at: string
          event_type: string
          from_status: Database["public"]["Enums"]["shopact_status"] | null
          id: string
          note: string | null
          to_status: Database["public"]["Enums"]["shopact_status"] | null
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string | null
          application_id: string
          created_at?: string
          event_type: string
          from_status?: Database["public"]["Enums"]["shopact_status"] | null
          id?: string
          note?: string | null
          to_status?: Database["public"]["Enums"]["shopact_status"] | null
        }
        Update: {
          actor_id?: string | null
          actor_role?: string | null
          application_id?: string
          created_at?: string
          event_type?: string
          from_status?: Database["public"]["Enums"]["shopact_status"] | null
          id?: string
          note?: string | null
          to_status?: Database["public"]["Enums"]["shopact_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "shopact_application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "shopact_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      shopact_applications: {
        Row: {
          aadhaar_number: string | null
          application_no: string
          business_address: string | null
          business_city: string | null
          business_district: string | null
          business_name: string | null
          business_nature: string | null
          business_pincode: string | null
          business_start_date: string | null
          business_state: string | null
          business_type: string | null
          certificate_url: string | null
          created_at: string
          dob: string | null
          email: string | null
          employees_female: number | null
          employees_male: number | null
          employees_other: number | null
          father_name: string | null
          gender: string | null
          id: string
          mobile: string | null
          owner_name: string | null
          pan_number: string | null
          remarks: string | null
          res_address: string | null
          res_city: string | null
          res_district: string | null
          res_pincode: string | null
          res_state: string | null
          status: Database["public"]["Enums"]["shopact_status"]
          submitted_at: string | null
          total_charged: number | null
          updated_at: string
          user_id: string
          wallet_txn_id: string | null
        }
        Insert: {
          aadhaar_number?: string | null
          application_no?: string
          business_address?: string | null
          business_city?: string | null
          business_district?: string | null
          business_name?: string | null
          business_nature?: string | null
          business_pincode?: string | null
          business_start_date?: string | null
          business_state?: string | null
          business_type?: string | null
          certificate_url?: string | null
          created_at?: string
          dob?: string | null
          email?: string | null
          employees_female?: number | null
          employees_male?: number | null
          employees_other?: number | null
          father_name?: string | null
          gender?: string | null
          id?: string
          mobile?: string | null
          owner_name?: string | null
          pan_number?: string | null
          remarks?: string | null
          res_address?: string | null
          res_city?: string | null
          res_district?: string | null
          res_pincode?: string | null
          res_state?: string | null
          status?: Database["public"]["Enums"]["shopact_status"]
          submitted_at?: string | null
          total_charged?: number | null
          updated_at?: string
          user_id: string
          wallet_txn_id?: string | null
        }
        Update: {
          aadhaar_number?: string | null
          application_no?: string
          business_address?: string | null
          business_city?: string | null
          business_district?: string | null
          business_name?: string | null
          business_nature?: string | null
          business_pincode?: string | null
          business_start_date?: string | null
          business_state?: string | null
          business_type?: string | null
          certificate_url?: string | null
          created_at?: string
          dob?: string | null
          email?: string | null
          employees_female?: number | null
          employees_male?: number | null
          employees_other?: number | null
          father_name?: string | null
          gender?: string | null
          id?: string
          mobile?: string | null
          owner_name?: string | null
          pan_number?: string | null
          remarks?: string | null
          res_address?: string | null
          res_city?: string | null
          res_district?: string | null
          res_pincode?: string | null
          res_state?: string | null
          status?: Database["public"]["Enums"]["shopact_status"]
          submitted_at?: string | null
          total_charged?: number | null
          updated_at?: string
          user_id?: string
          wallet_txn_id?: string | null
        }
        Relationships: []
      }
      shopact_service_config: {
        Row: {
          active: boolean
          distributor_commission: number
          id: string
          instructions: string | null
          price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          distributor_commission?: number
          id?: string
          instructions?: string | null
          price?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          distributor_commission?: number
          id?: string
          instructions?: string | null
          price?: number
          updated_at?: string
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
      udyam_application_documents: {
        Row: {
          application_id: string
          created_at: string
          doc_type: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          uploaded_by: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          doc_type: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          doc_type?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "udyam_application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "udyam_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      udyam_application_events: {
        Row: {
          actor_id: string | null
          actor_role: string | null
          application_id: string
          created_at: string
          event_type: string
          from_status: Database["public"]["Enums"]["udyam_status"] | null
          id: string
          note: string | null
          to_status: Database["public"]["Enums"]["udyam_status"] | null
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string | null
          application_id: string
          created_at?: string
          event_type: string
          from_status?: Database["public"]["Enums"]["udyam_status"] | null
          id?: string
          note?: string | null
          to_status?: Database["public"]["Enums"]["udyam_status"] | null
        }
        Update: {
          actor_id?: string | null
          actor_role?: string | null
          application_id?: string
          created_at?: string
          event_type?: string
          from_status?: Database["public"]["Enums"]["udyam_status"] | null
          id?: string
          note?: string | null
          to_status?: Database["public"]["Enums"]["udyam_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "udyam_application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "udyam_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      udyam_applications: {
        Row: {
          aadhaar_number: string | null
          account_number: string | null
          acknowledgement_url: string | null
          annual_turnover: number | null
          application_no: string
          bank_name: string | null
          business_address: string | null
          business_name: string | null
          business_start_date: string | null
          business_type: string | null
          category: string | null
          certificate_url: string | null
          city: string | null
          created_at: string
          district: string | null
          dob: string | null
          email: string | null
          employees_female: number | null
          employees_male: number | null
          employees_other: number | null
          gender: string | null
          gst_available: boolean | null
          gst_number: string | null
          id: string
          ifsc: string | null
          investment_amount: number | null
          mobile: string | null
          name_as_aadhaar: string | null
          name_as_pan: string | null
          pan_number: string | null
          pincode: string | null
          remarks: string | null
          state: string | null
          status: Database["public"]["Enums"]["udyam_status"]
          submitted_at: string | null
          total_charged: number | null
          updated_at: string
          user_id: string
          village: string | null
          wallet_txn_id: string | null
        }
        Insert: {
          aadhaar_number?: string | null
          account_number?: string | null
          acknowledgement_url?: string | null
          annual_turnover?: number | null
          application_no?: string
          bank_name?: string | null
          business_address?: string | null
          business_name?: string | null
          business_start_date?: string | null
          business_type?: string | null
          category?: string | null
          certificate_url?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          dob?: string | null
          email?: string | null
          employees_female?: number | null
          employees_male?: number | null
          employees_other?: number | null
          gender?: string | null
          gst_available?: boolean | null
          gst_number?: string | null
          id?: string
          ifsc?: string | null
          investment_amount?: number | null
          mobile?: string | null
          name_as_aadhaar?: string | null
          name_as_pan?: string | null
          pan_number?: string | null
          pincode?: string | null
          remarks?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["udyam_status"]
          submitted_at?: string | null
          total_charged?: number | null
          updated_at?: string
          user_id: string
          village?: string | null
          wallet_txn_id?: string | null
        }
        Update: {
          aadhaar_number?: string | null
          account_number?: string | null
          acknowledgement_url?: string | null
          annual_turnover?: number | null
          application_no?: string
          bank_name?: string | null
          business_address?: string | null
          business_name?: string | null
          business_start_date?: string | null
          business_type?: string | null
          category?: string | null
          certificate_url?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          dob?: string | null
          email?: string | null
          employees_female?: number | null
          employees_male?: number | null
          employees_other?: number | null
          gender?: string | null
          gst_available?: boolean | null
          gst_number?: string | null
          id?: string
          ifsc?: string | null
          investment_amount?: number | null
          mobile?: string | null
          name_as_aadhaar?: string | null
          name_as_pan?: string | null
          pan_number?: string | null
          pincode?: string | null
          remarks?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["udyam_status"]
          submitted_at?: string | null
          total_charged?: number | null
          updated_at?: string
          user_id?: string
          village?: string | null
          wallet_txn_id?: string | null
        }
        Relationships: []
      }
      udyam_service_config: {
        Row: {
          active: boolean
          created_at: string
          govt_fee: number
          id: string
          instructions_en: string
          instructions_mr: string
          service_charge: number
          turnaround_text: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          govt_fee?: number
          id?: string
          instructions_en?: string
          instructions_mr?: string
          service_charge?: number
          turnaround_text?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          govt_fee?: number
          id?: string
          instructions_en?: string
          instructions_mr?: string
          service_charge?: number
          turnaround_text?: string
          updated_at?: string
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
      charge_fssai_application: {
        Args: { p_amount: number; p_app_id: string; p_user_id: string }
        Returns: number
      }
      charge_gst_application: {
        Args: { p_amount: number; p_app_id: string; p_user_id: string }
        Returns: number
      }
      charge_shopact_application: {
        Args: { p_amount: number; p_app_id: string; p_user_id: string }
        Returns: number
      }
      charge_udyam_application: {
        Args: { p_amount: number; p_app_id: string; p_user_id: string }
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
      generate_fssai_application_no: { Args: never; Returns: string }
      generate_gst_application_no: { Args: never; Returns: string }
      generate_shopact_application_no: { Args: never; Returns: string }
      generate_udyam_application_no: { Args: never; Returns: string }
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
      fssai_status:
        | "draft"
        | "submitted"
        | "payment_received"
        | "documents_verified"
        | "processing"
        | "need_more_documents"
        | "approved"
        | "rejected"
        | "completed"
      shopact_status:
        | "draft"
        | "submitted"
        | "payment_received"
        | "documents_verified"
        | "processing"
        | "need_more_documents"
        | "approved"
        | "rejected"
        | "completed"
      udyam_status:
        | "draft"
        | "submitted"
        | "payment_received"
        | "documents_verified"
        | "processing"
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
      fssai_status: [
        "draft",
        "submitted",
        "payment_received",
        "documents_verified",
        "processing",
        "need_more_documents",
        "approved",
        "rejected",
        "completed",
      ],
      shopact_status: [
        "draft",
        "submitted",
        "payment_received",
        "documents_verified",
        "processing",
        "need_more_documents",
        "approved",
        "rejected",
        "completed",
      ],
      udyam_status: [
        "draft",
        "submitted",
        "payment_received",
        "documents_verified",
        "processing",
        "approved",
        "rejected",
        "completed",
      ],
    },
  },
} as const
