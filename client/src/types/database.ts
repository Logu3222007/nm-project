// Hand-written mirror of the Supabase schema (see supabase/migrations).
// In a real project this is regenerated with `supabase gen types typescript`.

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          company_name: string | null;
          logo_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          template_id: string | null;
          title: string;
          document_type: string;
          status: "draft" | "generating" | "ready" | "failed" | "archived";
          current_version_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["documents"]["Row"]> & {
          user_id: string;
          title: string;
          document_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Row"]>;
        Relationships: [];
      };
      document_versions: {
        Row: {
          id: string;
          document_id: string;
          version_number: number;
          content_json: unknown;
          plain_text: string;
          created_by: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["document_versions"]["Row"]> & {
          document_id: string;
          version_number: number;
          content_json: unknown;
          plain_text: string;
          created_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["document_versions"]["Row"]>;
        Relationships: [];
      };
      document_templates: {
        Row: {
          id: string;
          name: string;
          slug: string;
          document_type: string;
          description: string | null;
          schema: unknown;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["document_templates"]["Row"]> & {
          name: string;
          slug: string;
          document_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["document_templates"]["Row"]>;
        Relationships: [];
      };
      document_generations: {
        Row: {
          id: string;
          document_id: string;
          user_id: string;
          model: string;
          status: "pending" | "succeeded" | "failed";
          input_hash: string;
          generation_metadata: unknown;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["document_generations"]["Row"]> & {
          document_id: string;
          user_id: string;
          model: string;
          input_hash: string;
        };
        Update: Partial<Database["public"]["Tables"]["document_generations"]["Row"]>;
        Relationships: [];
      };
      document_exports: {
        Row: {
          id: string;
          document_id: string;
          user_id: string;
          format: "pdf" | "docx" | "txt";
          storage_path: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["document_exports"]["Row"]> & {
          document_id: string;
          user_id: string;
          format: "pdf" | "docx" | "txt";
          storage_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["document_exports"]["Row"]>;
        Relationships: [];
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          preferred_export_format: "pdf" | "docx" | "txt";
          branding_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_settings"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["user_settings"]["Row"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          metadata: unknown;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]> & {
          action: string;
          resource_type: string;
        };
        Update: never;
        Relationships: [];
      };
      generation_usage: {
        Row: {
          user_id: string;
          usage_date: string;
          count: number;
        };
        Insert: { user_id: string; usage_date: string; count?: number };
        Update: { count?: number };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
