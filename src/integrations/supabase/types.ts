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
      attendance: {
        Row: {
          break_duration: string | null
          break_start_at: string | null
          break_total_minutes: number
          check_in_at: string | null
          check_in_ip: string | null
          check_in_location: Json | null
          check_out_at: string | null
          check_out_ip: string | null
          check_out_location: Json | null
          created_at: string
          date: string
          employee_id: string
          id: string
          in_time: string | null
          notes: string | null
          out_time: string | null
          status: string
          total_work_minutes: number | null
        }
        Insert: {
          break_duration?: string | null
          break_start_at?: string | null
          break_total_minutes?: number
          check_in_at?: string | null
          check_in_ip?: string | null
          check_in_location?: Json | null
          check_out_at?: string | null
          check_out_ip?: string | null
          check_out_location?: Json | null
          created_at?: string
          date: string
          employee_id: string
          id?: string
          in_time?: string | null
          notes?: string | null
          out_time?: string | null
          status: string
          total_work_minutes?: number | null
        }
        Update: {
          break_duration?: string | null
          break_start_at?: string | null
          break_total_minutes?: number
          check_in_at?: string | null
          check_in_ip?: string | null
          check_in_location?: Json | null
          check_out_at?: string | null
          check_out_ip?: string | null
          check_out_location?: Json | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          in_time?: string | null
          notes?: string | null
          out_time?: string | null
          status?: string
          total_work_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          address: string | null
          created_at: string
          department_id: string | null
          designation: string | null
          emergency_contact: string | null
          employee_id: string
          gender: string | null
          id: string
          joining_date: string
          office_id: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          department_id?: string | null
          designation?: string | null
          emergency_contact?: string | null
          employee_id: string
          gender?: string | null
          id?: string
          joining_date: string
          office_id?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          department_id?: string | null
          designation?: string | null
          emergency_contact?: string | null
          employee_id?: string
          gender?: string | null
          id?: string
          joining_date?: string
          office_id?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      offices: {
        Row: {
          address: string
          city: string
          country: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          postal_code: string | null
          updated_at: string
        }
        Insert: {
          address: string
          city: string
          country: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          country?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      office_settings: {
        Row: {
          allowed_ip_ranges: string[] | null
          break_duration: unknown
          created_at: string
          geo_fencing_enabled: boolean
          id: string
          latitude: number | null
          longitude: number | null
          office_id: string
          radius_meters: number | null
          require_ip_whitelist: boolean
          timezone: string
          updated_at: string
          work_days: string[] | null
          work_end_time: string
          work_start_time: string
        }
        Insert: {
          allowed_ip_ranges?: string[] | null
          break_duration?: unknown
          created_at?: string
          geo_fencing_enabled?: boolean
          id?: string
          latitude?: number | null
          longitude?: number | null
          office_id: string
          radius_meters?: number | null
          require_ip_whitelist?: boolean
          timezone?: string
          updated_at?: string
          work_days?: string[] | null
          work_end_time?: string
          work_start_time?: string
        }
        Update: {
          allowed_ip_ranges?: string[] | null
          break_duration?: unknown
          created_at?: string
          geo_fencing_enabled?: boolean
          id?: string
          latitude?: number | null
          longitude?: number | null
          office_id?: string
          radius_meters?: number | null
          require_ip_whitelist?: boolean
          timezone?: string
          updated_at?: string
          work_days?: string[] | null
          work_end_time?: string
          work_start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_settings_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: true
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      login_logs: {
        Row: {
          id: string
          ip_address: string | null
          login_at: string
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          login_at?: string
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          login_at?: string
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: []
      }
      salaries: {
        Row: {
          amount: number
          created_at: string
          effective_date: string
          employee_id: string
          id: string
          is_current: boolean
          salary_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          effective_date: string
          employee_id: string
          id?: string
          is_current?: boolean
          salary_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          effective_date?: string
          employee_id?: string
          id?: string
          is_current?: boolean
          salary_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "salaries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
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
      app_role: "admin" | "employee"
      user_status: "active" | "inactive" | "locked"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "employee"],
      user_status: ["active", "inactive", "locked"],
    },
  },
} as const
