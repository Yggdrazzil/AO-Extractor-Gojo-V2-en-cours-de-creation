export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      linkedin_links: {
        Row: {
          id: string
          rfp_id: string
          url: string
          created_at: string | null
        }
        Insert: {
          id?: string
          rfp_id: string
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          rfp_id?: string
          url?: string
          created_at?: string
        }
      }
      prospects: {
        Row: {
          id: string
          text_content: string | null
          file_name: string | null
          file_url: string | null
          availability: string | null
          daily_rate: number | null
          residence: string | null
          mobility: string | null
          phone: string | null
          email: string | null
          status: 'À traiter' | 'Traité' | null
          assigned_to: string
          is_read: boolean
          created_at: string | null
          target_account: string | null
          file_content: string | null
          salary_expectations: number | null
        }
        Insert: {
          id?: string
          text_content?: string | null
          file_name?: string | null
          file_url?: string | null
          availability?: string | null
          daily_rate?: number | null
          residence?: string | null
          mobility?: string | null
          phone?: string | null
          email?: string | null
          status?: 'À traiter' | 'Traité' | null
          assigned_to: string
          is_read?: boolean
          created_at?: string
          target_account?: string | null
          file_content?: string | null
          salary_expectations?: number | null
        }
        Update: {
          id?: string
          text_content?: string | null
          file_name?: string | null
          file_url?: string | null
          availability?: string | null
          daily_rate?: number | null
          residence?: string | null
          mobility?: string | null
          phone?: string | null
          email?: string | null
          status?: 'À traiter' | 'Traité' | null
          assigned_to?: string
          is_read?: boolean
          created_at?: string
          target_account?: string | null
          file_content?: string | null
          salary_expectations?: number | null
        }
      }
      sales_reps: {
        Row: {
          id: string
          name: string
          code: string
          email: string
          is_admin: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          code: string
          email: string
          is_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          email?: string
          is_admin?: boolean
          created_at?: string
        }
      }
      rfps: {
        Row: {
          id: string
          client: string
          mission: string
          location: string
          max_rate: number | null
          created_at: string | null
          start_date: string | null
          status: 'À traiter' | 'En cours' | 'Traité' | 'Refusé' | null
          assigned_to: string
          raw_content: string
          is_read: boolean
        }
        Insert: {
          id?: string
          client: string
          mission: string
          location: string
          max_rate?: number | null
          created_at?: string
          start_date?: string | null
          status?: 'À traiter' | 'En cours' | 'Traité' | 'Refusé' | null
          assigned_to: string
          raw_content: string
          is_read?: boolean
        }
        Update: {
          id?: string
          client?: string
          mission?: string
          location?: string
          max_rate?: number | null
          created_at?: string
          start_date?: string | null
          status?: 'À traiter' | 'En cours' | 'Traité' | 'Refusé' | null
          assigned_to?: string
          raw_content?: string
          is_read?: boolean
        }
      }
      client_needs: {
        Row: {
          id: string
          text_content: string | null
          file_name: string | null
          file_url: string | null
          file_content: string | null
          selected_need_id: string
          selected_need_title: string
          availability: string | null
          daily_rate: number | null
          residence: string | null
          mobility: string | null
          phone: string | null
          email: string | null
          status: string | null
          assigned_to: string
          is_read: boolean | null
          created_at: string | null
          salary_expectations: number | null
        }
        Insert: {
          id?: string
          text_content?: string | null
          file_name?: string | null
          file_url?: string | null
          file_content?: string | null
          selected_need_id: string
          selected_need_title: string
          availability?: string | null
          daily_rate?: number | null
          residence?: string | null
          mobility?: string | null
          phone?: string | null
          email?: string | null
          status?: string | null
          assigned_to: string
          is_read?: boolean | null
          created_at?: string | null
          salary_expectations?: number | null
        }
        Update: {
          id?: string
          text_content?: string | null
          file_name?: string | null
          file_url?: string | null
          file_content?: string | null
          selected_need_id?: string
          selected_need_title?: string
          availability?: string | null
          daily_rate?: number | null
          residence?: string | null
          mobility?: string | null
          phone?: string | null
          email?: string | null
          status?: string | null
          assigned_to?: string
          is_read?: boolean | null
          created_at?: string | null
          salary_expectations?: number | null
        }
      }
      needs: {
        Row: {
          id: string
          title: string
          client: string
          description: string | null
          location: string | null
          skills: string | null
          max_rate: number | null
          start_date: string | null
          end_date: string | null
          status: 'Annulé' | 'En cours' | 'Ouvert' | 'Pourvu' | null
          created_by: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          client: string
          description?: string | null
          location?: string | null
          skills?: string | null
          max_rate?: number | null
          start_date?: string | null
          end_date?: string | null
          status?: 'Annulé' | 'En cours' | 'Ouvert' | 'Pourvu' | null
          created_by: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          client?: string
          description?: string | null
          location?: string | null
          skills?: string | null
          max_rate?: number | null
          start_date?: string | null
          end_date?: string | null
          status?: 'Annulé' | 'En cours' | 'Ouvert' | 'Pourvu' | null
          created_by?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      rfp_status: 'En cours' | 'Refusé' | 'Traité' | 'À traiter'
      prospect_status: 'Traité' | 'À traiter'
      need_status: 'Annulé' | 'En cours' | 'Ouvert' | 'Pourvu'
    }
  }
}