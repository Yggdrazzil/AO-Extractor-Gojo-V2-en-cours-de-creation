/**
 * Utilitaires pour la manipulation des dates
 */

/**
 * Formate une date au format français (JJ/MM/AAAA)
 * @param date - Date à formater
 * @returns Date formatée
 */
export function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formate une date ISO ou française pour l'affichage dans un tableau
 * @param dateStr - Chaîne de date (ISO ou JJ/MM/AAAA)
 * @returns Date formatée pour l'affichage
 */
export function formatTableDate(dateStr: string | null): string {
  if (!dateStr) return 'Non spécifié';
  
  const cleanDateStr = dateStr.trim();
  
  // Si déjà au format JJ/MM/AAAA
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanDateStr)) {
    return cleanDateStr;
  }
  
  try {
    const date = new Date(cleanDateStr);
    if (isNaN(date.getTime())) return 'Non spécifié';
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    console.error('Error formatting date:', { dateStr: cleanDateStr, error: e });
    return 'Non spécifié';
  }
}

/**
 * Convertit une date au format français (JJ/MM/AAAA) en format ISO
 * @param dateStr - Date au format JJ/MM/AAAA
 * @returns Date au format ISO ou null si invalide
 */
export function convertFrenchDateToISO(dateStr: string | null): string | null {
  if (!dateStr) return null;
  
  const cleanDateStr = dateStr.trim();
  
  try {
    let date: Date;
    
    const frenchMatch = cleanDateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (frenchMatch) {
      const [, day, month, year] = frenchMatch;
      date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    } else {
      date = new Date(cleanDateStr);
    }
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', cleanDateStr);
      return null;
    }
    
    return date.toISOString();
  } catch (error) {
    console.error('Error converting date:', { dateStr: cleanDateStr, error });
    return null;
  }
}

/**
 * Vérifie si une date est valide
 * @param dateStr - Chaîne de date à vérifier
 * @returns true si la date est valide, false sinon
 */
export function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  
  // Format JJ/MM/AAAA
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getDate() === day && 
           date.getMonth() === month - 1 && 
           date.getFullYear() === year;
  }
  
  // Format ISO
  try {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Calcule la différence en jours entre deux dates
 * @param date1 - Première date
 * @param date2 - Deuxième date (par défaut: aujourd'hui)
 * @returns Nombre de jours de différence
 */
export function daysBetween(date1: Date, date2: Date = new Date()): number {
  const oneDay = 24 * 60 * 60 * 1000; // heures*minutes*secondes*millisecondes
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.round(diffTime / oneDay);
}