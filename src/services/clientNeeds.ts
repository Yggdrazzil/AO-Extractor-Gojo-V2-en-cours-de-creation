import { supabase } from '../lib/supabase';
import type { BoondmanagerProspect } from '../types';

/**
 * Service pour la gestion des profils pour besoins clients
 */

// Stockage local pour simuler une base de données
let clientNeedsStore: BoondmanagerProspect[] = [];

/**
 * Récupère tous les profils pour besoins clients
 */
export async function fetchClientNeeds(): Promise<BoondmanagerProspect[]> {
  // Si le store est vide, essayer de récupérer depuis le localStorage
  if (clientNeedsStore.length === 0) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        const storageKey = `clientNeeds_${session.user.email}`;
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          clientNeedsStore = JSON.parse(savedData);
          console.log('Loaded client needs from localStorage:', clientNeedsStore.length);
        }
      }
    } catch (error) {
      console.error('Error loading client needs from localStorage:', error);
    }
  }
  
  return [...clientNeedsStore];
}

/**
 * Sauvegarde les profils dans le localStorage
 */
async function saveClientNeedsToStorage(): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      const storageKey = `clientNeeds_${session.user.email}`;
      localStorage.setItem(storageKey, JSON.stringify(clientNeedsStore));
      console.log('Saved client needs to localStorage:', clientNeedsStore.length);
    }
  } catch (error) {
    console.error('Error saving client needs to localStorage:', error);
  }
}

/**
 * Ajoute un profil pour besoin client
 */
export async function addClientNeed(prospect: BoondmanagerProspect): Promise<BoondmanagerProspect> {
  // Ajouter au store local
  clientNeedsStore.unshift(prospect);
  
  // Sauvegarder dans le localStorage
  await saveClientNeedsToStorage();
  
  return prospect;
}

/**
 * Met à jour le statut d'un profil
 */
export async function updateClientNeedStatus(id: string, status: BoondmanagerProspect['status']): Promise<void> {
  const index = clientNeedsStore.findIndex(p => p.id === id);
  if (index !== -1) {
    console.log(`Updating client need status: ${id} from ${clientNeedsStore[index].status} to ${status}`);
    clientNeedsStore[index].status = status;
    await saveClientNeedsToStorage();
  }
}

/**
 * Met à jour le commercial assigné
 */
export async function updateClientNeedAssignee(id: string, assignedTo: string): Promise<void> {
  const index = clientNeedsStore.findIndex(p => p.id === id);
  if (index !== -1) {
    clientNeedsStore[index].assignedTo = assignedTo;
    await saveClientNeedsToStorage();
  }
}

/**
 * Met à jour le besoin sélectionné
 */
export async function updateClientNeedSelectedNeed(id: string, selectedNeedTitle: string): Promise<void> {
  const index = clientNeedsStore.findIndex(p => p.id === id);
  if (index !== -1) {
    clientNeedsStore[index].selectedNeedTitle = selectedNeedTitle;
    await saveClientNeedsToStorage();
  }
}

/**
 * Met à jour la disponibilité
 */
export async function updateClientNeedAvailability(id: string, availability: string): Promise<void> {
  const index = clientNeedsStore.findIndex(p => p.id === id);
  if (index !== -1) {
    clientNeedsStore[index].availability = availability;
    await saveClientNeedsToStorage();
  }
}

/**
 * Met à jour le TJM
 */
export async function updateClientNeedDailyRate(id: string, dailyRate: number | null): Promise<void> {
  const index = clientNeedsStore.findIndex(p => p.id === id);
  if (index !== -1) {
    clientNeedsStore[index].dailyRate = dailyRate;
    await saveClientNeedsToStorage();
  }
}

/**
 * Met à jour la résidence
 */
export async function updateClientNeedResidence(id: string, residence: string): Promise<void> {
  const index = clientNeedsStore.findIndex(p => p.id === id);
  if (index !== -1) {
    clientNeedsStore[index].residence = residence;
    await saveClientNeedsToStorage();
  }
}

/**
 * Met à jour la mobilité
 */
export async function updateClientNeedMobility(id: string, mobility: string): Promise<void> {
  const index = clientNeedsStore.findIndex(p => p.id === id);
  if (index !== -1) {
    clientNeedsStore[index].mobility = mobility;
    await saveClientNeedsToStorage();
  }
}

/**
 * Met à jour le téléphone
 */
export async function updateClientNeedPhone(id: string, phone: string): Promise<void> {
  const index = clientNeedsStore.findIndex(p => p.id === id);
  if (index !== -1) {
    clientNeedsStore[index].phone = phone;
    await saveClientNeedsToStorage();
  }
}

/**
 * Met à jour l'email
 */
export async function updateClientNeedEmail(id: string, email: string): Promise<void> {
  const index = clientNeedsStore.findIndex(p => p.id === id);
  if (index !== -1) {
    clientNeedsStore[index].email = email;
    await saveClientNeedsToStorage();
  }
}

/**
 * Marque un profil comme lu
 */
export async function markClientNeedAsRead(id: string): Promise<void> {
  const index = clientNeedsStore.findIndex(p => p.id === id);
  if (index !== -1) {
    clientNeedsStore[index].isRead = true;
    await saveClientNeedsToStorage();
  }
}

/**
 * Supprime un profil
 */
export async function deleteClientNeed(id: string): Promise<void> {
  clientNeedsStore = clientNeedsStore.filter(p => p.id !== id);
  await saveClientNeedsToStorage();
}