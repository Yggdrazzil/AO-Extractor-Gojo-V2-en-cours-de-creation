import { supabase } from '../lib/supabase';
import type { BoondmanagerProspect } from '../types';
import { uploadFile } from './fileUpload';

/**
 * Service pour la gestion des profils pour besoins clients
 */

// Stockage local pour simuler une base de données
// Utiliser une clé unique pour tous les utilisateurs
const STORAGE_KEY = 'clientNeeds';

/**
 * Récupère tous les profils pour besoins clients
 */
export async function fetchClientNeeds(): Promise<BoondmanagerProspect[]> {
  try {
    // Récupérer depuis le localStorage
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const clientNeeds = JSON.parse(savedData);
      console.log('Loaded client needs from localStorage:', clientNeeds.length);
      return clientNeeds;
    } else {
      console.log('No client needs found in localStorage');
      return [];
    }
  } catch (error) {
    console.error('Error loading client needs from localStorage:', error);
    return [];
  }
}

/**
 * Sauvegarde les profils dans le localStorage
 */
async function saveClientNeedsToStorage(clientNeeds: BoondmanagerProspect[]): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clientNeeds));
    console.log('Saved client needs to localStorage:', clientNeeds.length);
  } catch (error) {
    console.error('Error saving client needs to localStorage:', error);
  }
}

/**
 * Ajoute un profil pour besoin client
 */
export async function addClientNeed(newProspect: BoondmanagerProspect): Promise<BoondmanagerProspect> {
  try {
    // Récupérer les profils existants
    const clientNeeds = await fetchClientNeeds();
    
    // Ajouter le nouveau profil
    clientNeeds.unshift(newProspect);
    
    // Sauvegarder dans le localStorage
    await saveClientNeedsToStorage(clientNeeds);
    
    return newProspect;
  } catch (error) {
    console.error('Failed to add client need:', error);
    throw error;
  }
}

/**
 * Récupère un profil par son ID
 */
async function getClientNeedById(id: string): Promise<BoondmanagerProspect | undefined> {
  const clientNeeds = await fetchClientNeeds();
  return clientNeeds.find(p => p.id === id);
}

/**
 * Met à jour un profil dans le localStorage
 */
async function updateClientNeed(id: string, updates: Partial<BoondmanagerProspect>): Promise<void> {
  const clientNeeds = await fetchClientNeeds();
  const index = clientNeeds.findIndex(p => p.id === id);
  
  if (index !== -1) {
    clientNeeds[index] = { ...clientNeeds[index], ...updates };
    await saveClientNeedsToStorage(clientNeeds);
  }
}

/**
 * Supprime un profil du localStorage
 */
async function removeClientNeed(id: string): Promise<void> {
  const clientNeeds = await fetchClientNeeds();
  const filteredNeeds = clientNeeds.filter(p => p.id !== id);
  
  if (filteredNeeds.length !== clientNeeds.length) {
    await saveClientNeedsToStorage(filteredNeeds);
  }
}

/**
 * Met à jour le statut d'un profil
 */
export async function updateClientNeedStatus(id: string, status: BoondmanagerProspect['status']): Promise<void> {
  await updateClientNeed(id, { status });
}

/**
 * Met à jour le commercial assigné
 */
export async function updateClientNeedAssignee(id: string, assignedTo: string): Promise<void> {
  await updateClientNeed(id, { assignedTo });
}

/**
 * Met à jour le besoin sélectionné
 */
export async function updateClientNeedSelectedNeed(id: string, selectedNeedTitle: string): Promise<void> {
  await updateClientNeed(id, { selectedNeedTitle });
}

/**
 * Met à jour la disponibilité
 */
export async function updateClientNeedAvailability(id: string, availability: string): Promise<void> {
  await updateClientNeed(id, { availability });
}

/**
 * Met à jour le TJM
 */
export async function updateClientNeedDailyRate(id: string, dailyRate: number | null): Promise<void> {
  await updateClientNeed(id, { dailyRate });
}

/**
 * Met à jour la résidence
 */
export async function updateClientNeedResidence(id: string, residence: string): Promise<void> {
  await updateClientNeed(id, { residence });
}

/**
 * Met à jour la mobilité
 */
export async function updateClientNeedMobility(id: string, mobility: string): Promise<void> {
  await updateClientNeed(id, { mobility });
}

/**
 * Met à jour le téléphone
 */
export async function updateClientNeedPhone(id: string, phone: string): Promise<void> {
  await updateClientNeed(id, { phone });
}

/**
 * Met à jour l'email
 */
export async function updateClientNeedEmail(id: string, email: string): Promise<void> {
  await updateClientNeed(id, { email });
}

/**
 * Marque un profil comme lu
 */
export async function markClientNeedAsRead(id: string): Promise<void> {
  await updateClientNeed(id, { isRead: true });
}

/**
 * Supprime un profil
 */
export async function deleteClientNeed(id: string): Promise<void> {
  await removeClientNeed(id);
}