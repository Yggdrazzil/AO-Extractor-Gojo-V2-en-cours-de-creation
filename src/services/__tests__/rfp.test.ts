import { fetchRFPs, createRFP, updateRFPStatus, deleteRFP } from '../rfp';
import { supabase } from '../../lib/supabase';

// Mock de supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn()
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn()
  }
}));

describe('RFP Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchRFPs', () => {
    it('should fetch RFPs successfully', async () => {
      // Mock de la session
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { email: 'test@example.com' } } },
        error: null
      });

      // Mock de la réponse de Supabase
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'rfp-1',
                client: 'Client Test',
                mission: 'Mission Test',
                location: 'Location Test',
                max_rate: 500,
                created_at: '2025-01-01T00:00:00Z',
                start_date: '2025-02-01T00:00:00Z',
                status: 'À traiter',
                assigned_to: 'sales-rep-1',
                raw_content: 'Contenu test',
                is_read: false
              }
            ],
            error: null
          })
        })
      });

      const result = await fetchRFPs();

      expect(result).toHaveLength(1);
      expect(result[0].client).toBe('Client Test');
      expect(supabase.from).toHaveBeenCalledWith('rfps');
      expect(supabase.from().select).toHaveBeenCalledWith(
        'id, client, mission, location, max_rate, created_at, start_date, status, assigned_to, raw_content, is_read'
      );
    });

    it('should handle authentication error', async () => {
      // Mock d'une session non existante
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null
      });

      await expect(fetchRFPs()).rejects.toThrow('Authentication required');
    });

    it('should handle database error', async () => {
      // Mock de la session
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { email: 'test@example.com' } } },
        error: null
      });

      // Mock d'une erreur de base de données
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      });

      await expect(fetchRFPs()).rejects.toThrow('Database error');
    });
  });

  // Autres tests pour createRFP, updateRFPStatus, deleteRFP, etc.
});