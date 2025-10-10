/*
  # Rendre selected_need_id nullable dans client_needs

  1. Modifications
    - Modifier la colonne `selected_need_id` pour accepter les valeurs NULL
    - Cette colonne n'est pas toujours fournie lors de la création d'un besoin client
    
  2. Raison
    - L'application ne fournit pas toujours un ID de besoin spécifique
    - Seul le titre du besoin (selected_need_title) est requis
*/

-- Rendre selected_need_id nullable
ALTER TABLE client_needs 
ALTER COLUMN selected_need_id DROP NOT NULL;