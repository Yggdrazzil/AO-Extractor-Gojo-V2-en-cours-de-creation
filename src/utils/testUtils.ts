import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '../context/ThemeContext';
import React, { ReactElement } from 'react';

/**
 * Options pour le rendu personnalisé
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  theme?: 'light' | 'dark';
}

/**
 * Fonction de rendu personnalisée pour les tests
 * @param ui - Élément React à rendre
 * @param options - Options de rendu
 * @returns Résultat du rendu
 */
export function renderWithProviders(
  ui: ReactElement,
  { theme = 'light', ...renderOptions }: CustomRenderOptions = {}
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>;
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Mock de l'objet supabase pour les tests
 */
export const mockSupabase = {
  auth: {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis()
  }),
  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
      remove: jest.fn()
    })
  },
  functions: {
    invoke: jest.fn()
  }
};

/**
 * Génère des données de test pour les RFPs
 * @param count - Nombre de RFPs à générer
 * @returns Tableau de RFPs de test
 */
export function generateTestRFPs(count = 5) {
  return Array.from({ length: count }, (_, i) => ({
    id: `rfp-${i}`,
    client: `Client Test ${i}`,
    mission: `Mission Test ${i}`,
    location: `Location Test ${i}`,
    maxRate: i * 100,
    createdAt: new Date(2025, 0, i + 1).toISOString(),
    startDate: new Date(2025, 1, i + 1).toISOString(),
    status: i % 2 === 0 ? 'À traiter' : 'Traité',
    assignedTo: `sales-rep-${i % 3}`,
    content: `Contenu de test pour l'AO ${i}`,
    isRead: i % 2 === 1
  }));
}

/**
 * Génère des données de test pour les commerciaux
 * @param count - Nombre de commerciaux à générer
 * @returns Tableau de commerciaux de test
 */
export function generateTestSalesReps(count = 3) {
  const codes = ['EPO', 'IKH', 'BVI', 'GMA', 'TSA', 'BCI', 'VIE', 'JVO'];
  return Array.from({ length: count }, (_, i) => ({
    id: `sales-rep-${i}`,
    code: codes[i % codes.length],
    name: `Commercial Test ${i}`,
    email: `commercial${i}@example.com`,
    is_admin: i === 0,
    created_at: new Date().toISOString()
  }));
}