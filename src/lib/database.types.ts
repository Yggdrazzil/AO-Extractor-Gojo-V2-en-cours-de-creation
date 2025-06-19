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
          created_at: string
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
      sales_reps: {
        Row: {
          id: string
          name: string
          code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
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
          created_at: string
          start_date: string
          status: 'À traiter' | 'En cours' | 'Traité' | 'Refusé'
          assigned_to: string  // UUID référençant sales_reps.id
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
          start_date: string
          status?: 'À traiter' | 'En cours' | 'Traité' | 'Refusé'
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
          start_date?: string
          status?: 'À traiter' | 'En cours' | 'Traité' | 'Refusé'
          assigned_to?: string
          raw_content?: string
          is_read?: boolean
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
      [_ in never]: never
    }
  }
}