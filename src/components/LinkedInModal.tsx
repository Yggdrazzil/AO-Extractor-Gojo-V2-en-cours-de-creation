import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LinkedInModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfpId: string;
  onUrlCountChange?: (count: number) => void;
}

interface LinkedInLink {
  id: string;
  url: string;
  visited?: boolean;
}

export function LinkedInModal({ isOpen, onClose, rfpId, onUrlCountChange }: LinkedInModalProps) {
  const [links, setLinks] = useState<LinkedInLink[]>([]);
  const [urls, setUrls] = useState<string[]>(['']);
  const [error, setError] = useState<string | null>('');
  const [visitedLinks, setVisitedLinks] = useState<Set<string>>(new Set());

  const updateUrlCount = useCallback((newLinks: LinkedInLink[]) => {
    if (onUrlCountChange) {
      onUrlCountChange(newLinks.length);
    }
  }, [onUrlCountChange]);
  useEffect(() => {
    // Charger les liens visités depuis le localStorage
    const storedVisitedLinks = localStorage.getItem('visitedLinkedInLinks');
    if (storedVisitedLinks) {
      setVisitedLinks(new Set(JSON.parse(storedVisitedLinks)));
    }
  }, []);

  useEffect(() => {
    if (isOpen && rfpId) {
      loadLinks();
    } else {
      setLinks([]);
      setUrls(['']);
      setError('');
    }
  }, [isOpen, rfpId]);

  const loadLinks = async () => {
    if (!rfpId) {
      console.warn('No RFP ID provided');
      return;
    }

    try {
      setError(null);
      console.log('Loading links for RFP:', rfpId);
      
      const { data, error } = await supabase
        .from('linkedin_links')
        .select('*')
        .eq('rfp_id', rfpId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      console.log('Loaded links:', data);
      // Ajouter l'état visité à chaque lien
      const storedVisitedLinks = new Set(JSON.parse(localStorage.getItem('visitedLinkedInLinks') || '[]'));
      const newLinks = (data || []).map(link => ({
        ...link,
        visited: storedVisitedLinks.has(link.url)
      }));
      setLinks(newLinks);
      updateUrlCount(newLinks);
      setError(null);
    } catch (error) {
      console.error('Error loading LinkedIn links:', error);
      setError('Une erreur est survenue lors du chargement des liens');
    }
  };

  const handleAddField = () => {
    setUrls([...urls, '']);
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleRemoveField = (index: number) => {
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    console.log('Submitting URLs:', urls);
    
    const validUrls = urls.filter(url => url.trim());
    
    if (validUrls.length === 0) {
      setError('Veuillez ajouter au moins une URL LinkedIn');
      return;
    }

    try {
      console.log('Inserting links for RFP:', rfpId);
      const { data, error } = await supabase
        .from('linkedin_links')
        .insert(
          validUrls.map(url => ({
            rfp_id: rfpId,
            url: url.trim()
          }))
        )
        .select();

      if (error) {
        throw error;
      }

      console.log('Successfully added links:', data);
      setLinks([...links, ...(data || [])]);
      setUrls(['']); // Reset avec un champ vide
      updateUrlCount([...links, ...(data || [])]);
      setError(null);
    } catch (error) {
      console.error('Error adding LinkedIn links:', error);
      setError('Erreur lors de l\'ajout des liens');
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      setError(null);
      console.log('Deleting link:', id);
      
      const { error } = await supabase
        .from('linkedin_links')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      console.log('Successfully deleted link');
      const newLinks = links.filter(link => link.id !== id);
      setLinks(newLinks);
      updateUrlCount(newLinks);
      setError(null);
    } catch (error) {
      console.error('Error deleting LinkedIn link:', error);
      setError('Erreur lors de la suppression du lien');
    }
  };

  const handleLinkClick = (url: string) => {
    // Mettre à jour le localStorage et l'état local
    const newVisitedLinks = new Set(visitedLinks);
    newVisitedLinks.add(url);
    localStorage.setItem('visitedLinkedInLinks', JSON.stringify([...newVisitedLinks]));
    setVisitedLinks(newVisitedLinks);
    
    // Mettre à jour l'état des liens
    setLinks(links.map(link => 
      link.url === url ? { ...link, visited: true } : link
    ));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Opérationnels à contacter
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            {urls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="https://..."
                />
                {urls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveField(index)}
                    className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddField}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter un champ
              </button>
              
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Enregistrer les profils
              </button>
            </div>
          </form>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">
              {error}
            </p>
          )}

          <div className="space-y-3">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-1 truncate">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleLinkClick(link.url)}
                    className={`hover:underline ${
                      visitedLinks.has(link.url)
                        ? 'text-purple-400 dark:text-purple-300'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {link.url}
                  </a>
                </div>
                <button
                  onClick={() => handleDeleteLink(link.id)}
                  className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}