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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      album_photos: {
        Row: {
          album_id: string
          caption: string | null
          created_at: string
          height: number | null
          id: string
          path: string
          sort: number
          width: number | null
        }
        Insert: {
          album_id: string
          caption?: string | null
          created_at?: string
          height?: number | null
          id?: string
          path: string
          sort?: number
          width?: number | null
        }
        Update: {
          album_id?: string
          caption?: string | null
          created_at?: string
          height?: number | null
          id?: string
          path?: string
          sort?: number
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "album_photos_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
      albums: {
        Row: {
          cover_path: string | null
          created_at: string
          event_id: string | null
          id: string
          is_published: boolean
          sort: number
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_path?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          is_published?: boolean
          sort?: number
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_path?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          is_published?: boolean
          sort?: number
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "albums_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "albums_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      app_content: {
        Row: {
          key: string
          tenant_id: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          tenant_id: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          tenant_id?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "app_content_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          channel: Database["public"]["Enums"]["delivery_channel"]
          created_at: string
          created_by: string | null
          destination_hash: string
          error: string | null
          id: string
          provider_id: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          tenant_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["delivery_channel"]
          created_at?: string
          created_by?: string | null
          destination_hash: string
          error?: string | null
          id?: string
          provider_id?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          tenant_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["delivery_channel"]
          created_at?: string
          created_by?: string | null
          destination_hash?: string
          error?: string | null
          id?: string
          provider_id?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      event_templates: {
        Row: {
          event_id: string
          sort: number
          template_id: string
        }
        Insert: {
          event_id: string
          sort?: number
          template_id: string
        }
        Update: {
          event_id?: string
          sort?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_templates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_templates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          city: string | null
          cover_path: string | null
          created_at: string
          description: string
          ends_at: string
          id: string
          is_published: boolean
          lat: number | null
          lng: number | null
          print_grace_minutes: number
          print_price_cents: number
          printing_enabled: boolean
          slug: string
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          tenant_id: string
          ticket_url: string | null
          timezone: string
          title: string
          updated_at: string
          venue_name: string | null
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          address?: string | null
          city?: string | null
          cover_path?: string | null
          created_at?: string
          description?: string
          ends_at: string
          id?: string
          is_published?: boolean
          lat?: number | null
          lng?: number | null
          print_grace_minutes?: number
          print_price_cents?: number
          printing_enabled?: boolean
          slug: string
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          tenant_id: string
          ticket_url?: string | null
          timezone?: string
          title: string
          updated_at?: string
          venue_name?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          address?: string | null
          city?: string | null
          cover_path?: string | null
          created_at?: string
          description?: string
          ends_at?: string
          id?: string
          is_published?: boolean
          lat?: number | null
          lng?: number | null
          print_grace_minutes?: number
          print_price_cents?: number
          printing_enabled?: boolean
          slug?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          tenant_id?: string
          ticket_url?: string | null
          timezone?: string
          title?: string
          updated_at?: string
          venue_name?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          converted_event_id: string | null
          created_at: string
          email: string | null
          event_type: string | null
          guest_count: number | null
          hours: number | null
          id: string
          location: string | null
          name: string
          notes: string | null
          package: string | null
          phone: string | null
          preferred_date: string | null
          reference: string
          status: Database["public"]["Enums"]["inquiry_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          converted_event_id?: string | null
          created_at?: string
          email?: string | null
          event_type?: string | null
          guest_count?: number | null
          hours?: number | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          package?: string | null
          phone?: string | null
          preferred_date?: string | null
          reference?: string
          status?: Database["public"]["Enums"]["inquiry_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          converted_event_id?: string | null
          created_at?: string
          email?: string | null
          event_type?: string | null
          guest_count?: number | null
          hours?: number | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          package?: string | null
          phone?: string | null
          preferred_date?: string | null
          reference?: string
          status?: Database["public"]["Enums"]["inquiry_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_converted_event_id_fkey"
            columns: ["converted_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      print_jobs: {
        Row: {
          cash_cents: number | null
          code: string
          created_by: string | null
          event_id: string
          expires_at: string
          id: string
          issued_at: string
          price_cents: number
          redeemed_at: string | null
          redeemed_by: string | null
          render_path: string
          status: Database["public"]["Enums"]["print_status"]
          template_id: string | null
          tenant_id: string
          variant_label: string | null
        }
        Insert: {
          cash_cents?: number | null
          code: string
          created_by?: string | null
          event_id: string
          expires_at: string
          id?: string
          issued_at?: string
          price_cents?: number
          redeemed_at?: string | null
          redeemed_by?: string | null
          render_path: string
          status?: Database["public"]["Enums"]["print_status"]
          template_id?: string | null
          tenant_id: string
          variant_label?: string | null
        }
        Update: {
          cash_cents?: number | null
          code?: string
          created_by?: string | null
          event_id?: string
          expires_at?: string
          id?: string
          issued_at?: string
          price_cents?: number
          redeemed_at?: string | null
          redeemed_by?: string | null
          render_path?: string
          status?: Database["public"]["Enums"]["print_status"]
          template_id?: string | null
          tenant_id?: string
          variant_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "print_jobs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_jobs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          completed_at: string | null
          event_id: string | null
          filter_id: string | null
          id: string
          install_id: string | null
          printed: boolean
          saved: boolean
          share_destination: string | null
          shared: boolean
          shot_count: number | null
          started_at: string
          surface: Database["public"]["Enums"]["capture_surface"]
          template_id: string | null
          tenant_id: string
          variant_label: string | null
        }
        Insert: {
          completed_at?: string | null
          event_id?: string | null
          filter_id?: string | null
          id?: string
          install_id?: string | null
          printed?: boolean
          saved?: boolean
          share_destination?: string | null
          shared?: boolean
          shot_count?: number | null
          started_at?: string
          surface?: Database["public"]["Enums"]["capture_surface"]
          template_id?: string | null
          tenant_id: string
          variant_label?: string | null
        }
        Update: {
          completed_at?: string | null
          event_id?: string | null
          filter_id?: string | null
          id?: string
          install_id?: string | null
          printed?: boolean
          saved?: boolean
          share_destination?: string | null
          shared?: boolean
          shot_count?: number | null
          started_at?: string
          surface?: Database["public"]["Enums"]["capture_surface"]
          template_id?: string | null
          tenant_id?: string
          variant_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      share_links: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          render_path: string
          revoked_at: string | null
          slug: string
          tenant_id: string
          views: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          render_path: string
          revoked_at?: string | null
          slug?: string
          tenant_id: string
          views?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          render_path?: string
          revoked_at?: string | null
          slug?: string
          tenant_id?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "share_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["staff_role"]
          status: Database["public"]["Enums"]["staff_status"]
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["staff_role"]
          status?: Database["public"]["Enums"]["staff_status"]
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["staff_role"]
          status?: Database["public"]["Enums"]["staff_status"]
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      template_variants: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          label: string
          overlay_path: string
          sort: number
          template_id: string
          text_color: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          label: string
          overlay_path: string
          sort?: number
          template_id: string
          text_color?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          overlay_path?: string
          sort?: number
          template_id?: string
          text_color?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_variants_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          name: string
          printable: boolean
          published_at: string | null
          shot_count: number
          spec: Json
          status: Database["public"]["Enums"]["publish_status"]
          tenant_id: string
          thumbnail_path: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string
          id?: string
          name: string
          printable?: boolean
          published_at?: string | null
          shot_count: number
          spec: Json
          status?: Database["public"]["Enums"]["publish_status"]
          tenant_id: string
          thumbnail_path?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          printable?: boolean
          published_at?: string | null
          shot_count?: number
          spec?: Json
          status?: Database["public"]["Enums"]["publish_status"]
          tenant_id?: string
          thumbnail_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_settings: {
        Row: {
          created_at: string
          plan: string
          sending_domain: string | null
          sms_provider: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          plan?: string
          sending_domain?: string | null
          sms_provider?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          plan?: string
          sending_domain?: string | null
          sms_provider?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          brand: Json
          created_at: string
          currency: string
          id: string
          is_active: boolean
          name: string
          slug: string
          timezone: string
          updated_at: string
        }
        Insert: {
          brand?: Json
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          brand?: Json
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_code: { Args: { len?: number }; Returns: string }
      issue_print_job: {
        Args: {
          p_event_id: string
          p_render_path: string
          p_template_id: string
          p_variant: string
        }
        Returns: {
          cash_cents: number | null
          code: string
          created_by: string | null
          event_id: string
          expires_at: string
          id: string
          issued_at: string
          price_cents: number
          redeemed_at: string | null
          redeemed_by: string | null
          render_path: string
          status: Database["public"]["Enums"]["print_status"]
          template_id: string | null
          tenant_id: string
          variant_label: string | null
        }
        SetofOptions: {
          from: "*"
          to: "print_jobs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      live_events: {
        Args: { target_tenant: string }
        Returns: {
          address: string | null
          city: string | null
          cover_path: string | null
          created_at: string
          description: string
          ends_at: string
          id: string
          is_published: boolean
          lat: number | null
          lng: number | null
          print_grace_minutes: number
          print_price_cents: number
          printing_enabled: boolean
          slug: string
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          tenant_id: string
          ticket_url: string | null
          timezone: string
          title: string
          updated_at: string
          venue_name: string | null
          visibility: Database["public"]["Enums"]["event_visibility"]
        }[]
        SetofOptions: {
          from: "*"
          to: "events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      purge_expired: {
        Args: never
        Returns: {
          dead_links: number
          expired_passes: number
        }[]
      }
      redeem_print_job: {
        Args: { p_cash_cents: number; p_code: string; p_tenant_id: string }
        Returns: {
          cash_cents: number | null
          code: string
          created_by: string | null
          event_id: string
          expires_at: string
          id: string
          issued_at: string
          price_cents: number
          redeemed_at: string | null
          redeemed_by: string | null
          render_path: string
          status: Database["public"]["Enums"]["print_status"]
          template_id: string | null
          tenant_id: string
          variant_label: string | null
        }
        SetofOptions: {
          from: "*"
          to: "print_jobs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_inquiry: {
        Args: {
          p_email?: string
          p_event_type?: string
          p_guest_count?: number
          p_location?: string
          p_name: string
          p_notes?: string
          p_phone?: string
          p_preferred_date?: string
          p_tenant_id: string
        }
        Returns: string
      }
    }
    Enums: {
      capture_surface: "app" | "web"
      delivery_channel: "email" | "sms"
      delivery_status: "queued" | "sent" | "failed"
      event_status:
        | "inquiry"
        | "confirmed"
        | "deposit_paid"
        | "completed"
        | "cancelled"
      event_visibility: "public" | "private"
      inquiry_status:
        | "new"
        | "contacted"
        | "quoted"
        | "booked"
        | "completed"
        | "lost"
      print_status: "issued" | "redeemed" | "expired" | "deleted"
      publish_status: "draft" | "published" | "archived"
      staff_role: "owner" | "manager" | "editor" | "booth"
      staff_status: "invited" | "active" | "revoked"
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
      capture_surface: ["app", "web"],
      delivery_channel: ["email", "sms"],
      delivery_status: ["queued", "sent", "failed"],
      event_status: [
        "inquiry",
        "confirmed",
        "deposit_paid",
        "completed",
        "cancelled",
      ],
      event_visibility: ["public", "private"],
      inquiry_status: [
        "new",
        "contacted",
        "quoted",
        "booked",
        "completed",
        "lost",
      ],
      print_status: ["issued", "redeemed", "expired", "deleted"],
      publish_status: ["draft", "published", "archived"],
      staff_role: ["owner", "manager", "editor", "booth"],
      staff_status: ["invited", "active", "revoked"],
    },
  },
} as const
