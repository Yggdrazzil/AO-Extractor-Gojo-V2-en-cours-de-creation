/*
  # Correction des noms et prénoms des commerciaux

  1. Mise à jour des noms complets
    - BCI : Benoît Civel
    - BVI : Benjamin Vives  
    - EPO : Etienne Poulain (déjà correct)
    - GMA : Guillaume Manuel
    - IKH : Imane Khinache
    - TSA : Thibaut Sage
    - VIE : Vincent Ientile
    - JVO : Jordan Vogel

  2. Mise à jour des emails correspondants
    - Format : prénom.nom@hito.digital
*/

-- Mise à jour des noms et emails des commerciaux
UPDATE sales_reps SET 
  name = 'Benoît Civel',
  email = 'benoit.civel@hito.digital'
WHERE code = 'BCI';

UPDATE sales_reps SET 
  name = 'Benjamin Vives',
  email = 'benjamin.vives@hito.digital'
WHERE code = 'BVI';

UPDATE sales_reps SET 
  name = 'Etienne Poulain',
  email = 'etienne.poulain@hito.digital'
WHERE code = 'EPO';

UPDATE sales_reps SET 
  name = 'Guillaume Manuel',
  email = 'guillaume.manuel@hito.digital'
WHERE code = 'GMA';

UPDATE sales_reps SET 
  name = 'Imane Khinache',
  email = 'imane.khinache@hito.digital'
WHERE code = 'IKH';

UPDATE sales_reps SET 
  name = 'Thibaut Sage',
  email = 'thibaut.sage@hito.digital'
WHERE code = 'TSA';

UPDATE sales_reps SET 
  name = 'Vincent Ientile',
  email = 'vincent.ientile@hito.digital'
WHERE code = 'VIE';

UPDATE sales_reps SET 
  name = 'Jordan Vogel',
  email = 'jordan.vogel@hito.digital'
WHERE code = 'JVO';