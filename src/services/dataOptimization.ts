/**
 * Service d'optimisation des données pour les gros volumes
 */

import { RFP, Prospect } from '../types';

/**
 * Cache pour éviter les recalculs fréquents
 */
class DataCache {
  private cache = new Map<string, any>();
  private maxSize = 100;

  set(key: string, value: any): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  get(key: string): any {
    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

const dataCache = new DataCache();

/**
 * Optimise le filtrage des RFPs
 */
export function optimizedRFPFilter(
  rfps: RFP[],
  filters: {
    salesRep?: string;
    search?: string;
    status?: string;
  }
): RFP[] {
  const cacheKey = `rfp_filter_${JSON.stringify(filters)}_${rfps.length}`;
  
  if (dataCache.has(cacheKey)) {
    return dataCache.get(cacheKey);
  }

  let filtered = rfps;

  // Filtrage par commercial
  if (filters.salesRep) {
    filtered = filtered.filter(rfp => rfp.assignedTo === filters.salesRep);
  }

  // Filtrage par statut
  if (filters.status) {
    filtered = filtered.filter(rfp => rfp.status === filters.status);
  }

  // Filtrage par recherche textuelle (optimisé)
  if (filters.search?.trim()) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(rfp => {
      // Utiliser includes() qui est plus rapide que regex pour des recherches simples
      return (
        rfp.client.toLowerCase().includes(searchLower) ||
        rfp.mission.toLowerCase().includes(searchLower) ||
        rfp.location.toLowerCase().includes(searchLower)
      );
    });
  }

  dataCache.set(cacheKey, filtered);
  return filtered;
}

/**
 * Optimise le filtrage des Prospects
 */
export function optimizedProspectFilter(
  prospects: Prospect[],
  filters: {
    salesRep?: string;
    search?: string;
    status?: string;
  }
): Prospect[] {
  const cacheKey = `prospect_filter_${JSON.stringify(filters)}_${prospects.length}`;
  
  if (dataCache.has(cacheKey)) {
    return dataCache.get(cacheKey);
  }

  let filtered = prospects;

  // Filtrage par commercial
  if (filters.salesRep) {
    filtered = filtered.filter(prospect => prospect.assignedTo === filters.salesRep);
  }

  // Filtrage par statut
  if (filters.status) {
    filtered = filtered.filter(prospect => prospect.status === filters.status);
  }

  // Filtrage par recherche textuelle (optimisé)
  if (filters.search?.trim()) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(prospect => {
      return (
        prospect.targetAccount.toLowerCase().includes(searchLower) ||
        prospect.residence.toLowerCase().includes(searchLower) ||
        prospect.email.toLowerCase().includes(searchLower) ||
        prospect.phone.toLowerCase().includes(searchLower)
      );
    });
  }

  dataCache.set(cacheKey, filtered);
  return filtered;
}

/**
 * Optimise le tri des données
 */
export function optimizedSort<T>(
  data: T[],
  sortField: keyof T,
  sortDirection: 'asc' | 'desc'
): T[] {
  const cacheKey = `sort_${String(sortField)}_${sortDirection}_${data.length}`;
  
  if (dataCache.has(cacheKey)) {
    return dataCache.get(cacheKey);
  }

  const sorted = [...data].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    // Optimisation pour les nombres
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    // Optimisation pour les dates
    if (aVal instanceof Date && bVal instanceof Date) {
      return sortDirection === 'asc' 
        ? aVal.getTime() - bVal.getTime()
        : bVal.getTime() - aVal.getTime();
    }
    
    // Optimisation pour les chaînes
    const aStr = String(aVal || '').toLowerCase();
    const bStr = String(bVal || '').toLowerCase();
    
    if (sortDirection === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });

  dataCache.set(cacheKey, sorted);
  return sorted;
}

/**
 * Pagination optimisée
 */
export function optimizedPagination<T>(
  data: T[],
  page: number,
  itemsPerPage: number
): {
  items: T[];
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const items = data.slice(startIndex, endIndex);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  return {
    items,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

/**
 * Nettoie le cache périodiquement
 */
export function clearDataCache(): void {
  dataCache.clear();
}

/**
 * Détecte si on est en mode performance (gros volume de données)
 */
export function isPerformanceMode(dataLength: number): boolean {
  return dataLength > 1000;
}

/**
 * Applique les optimisations de performance si nécessaire
 */
export function applyPerformanceOptimizations(dataLength: number): void {
  if (isPerformanceMode(dataLength)) {
    // Désactiver les animations pour améliorer les performances
    document.body.classList.add('performance-mode');
  } else {
    document.body.classList.remove('performance-mode');
  }
}