/*
  # Add PLATFORM_URL environment variable

  1. Environment Configuration
    - Set PLATFORM_URL for Edge Functions
    - Configure default URL fallback for email notifications
    - Update all notification functions to use the correct platform URL

  2. Security
    - Environment variable accessible to all Edge Functions
    - Secure configuration for email templates
*/

-- Fonction pour définir les variables d'environnement des Edge Functions
-- Note: Cette migration servira de documentation pour la configuration manuelle

-- Configuration recommandée pour les variables d'environnement Supabase :
-- PLATFORM_URL=https://ao-extractor-v2-en-c-l194.bolt.host
-- SENDGRID_API_KEY=[your-sendgrid-key]

-- Cette migration sert principalement de documentation
-- Les variables d'environnement doivent être configurées dans l'interface Supabase

SELECT 'Platform URL configuration should be set manually in Supabase Environment Variables' as configuration_note;