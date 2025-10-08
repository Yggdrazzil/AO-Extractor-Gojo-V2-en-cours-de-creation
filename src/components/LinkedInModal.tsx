import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Users } from 'lucide-react';
import { 
  fetchLinkedInLinks, 
  addLinkedInLinks, 
  deleteLinkedInLink,
  type LinkedInLink 
} from '../services/linkedin';

interface LinkedInModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfpId: string;
  onUrlCountChange?: (count: number) => void;
}

export function LinkedInModal({ isOpen, onClose, rfpId, onUrlCountChange }: LinkedInModalProps) {
  const [links, setLinks] = useState<LinkedInLink[]>([]);
  const [urls, setUrls] = useState<string[]>(['']);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [visitedLinks, setVisitedLinks] = useState<Set<string>>(new Set());
  const firstInputRef = React.useRef<HTMLInputElement>(null);

  const updateUrlCount = useCallback((newLinks: LinkedInLink[]) => {
    if (onUrlCountChange) {
      onUrlCountChange(newLinks.length);
    }
  }, [onUrlCountChange]);

  useEffect(() => {
    // Charger les liens visités depuis le localStorage
    const storedVisitedLinks = localStorage.getItem('visitedLinkedInLinks');
    if (storedVisitedLinks) {
      try {
        setVisitedLinks(new Set(JSON.parse(storedVisitedLinks)));
      } catch (e) {
        console.warn('Error parsing visited links from localStorage:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen && rfpId) {
      loadLinks();
    } else {
      setLinks([]);
      setUrls(['']);
      setError(null);
    }
  }, [isOpen, rfpId]);

  useEffect(() => {
    if (isOpen) {
      // Utiliser requestAnimationFrame pour s'assurer que le DOM est complètement rendu
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (firstInputRef.current) {
            firstInputRef.current.focus();
          }
        });
      });
    }
  }, [isOpen]);

  const loadLinks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (rfpId) {
        console.log('Loading links for RFP ID:', rfpId);
        const data = await fetchLinkedInLinks(rfpId);
        console.log('Loaded links:', data);
        
        // Ajouter l'état visité à chaque lien
        const storedVisitedLinks = new Set(JSON.parse(localStorage.getItem('visitedLinkedInLinks') || '[]'));
        const newLinks = data.map(link => ({
          ...link,
          visited: storedVisitedLinks.has(link.url)
        }));
        
        setLinks(newLinks);
        updateUrlCount(newLinks);
      } else {
        setLinks([]);
        updateUrlCount([]);
      }
    } catch (error) {
      console.error('Error loading LinkedIn links:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Detailed error:', errorMessage);
      setError(`Erreur lors du chargement des liens LinkedIn: ${errorMessage}`);
    } finally {
      setIsLoading(false);
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
    
    if (!rfpId) {
      setError('Aucun ID d\'AO fourni');
      return;
    }
    
    const validUrls = urls.filter(url => url.trim());
    
    if (validUrls.length === 0) {
      setError('Veuillez ajouter au moins une URL LinkedIn');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Submitting URLs for RFP:', rfpId, 'URLs:', validUrls);
      const newLinksData = await addLinkedInLinks(rfpId, validUrls);
      console.log('Added links:', newLinksData);
      
      const newLinks = [...links, ...newLinksData];
      setLinks(newLinks);
      setUrls(['']); // Reset avec un champ vide
      updateUrlCount(newLinks);

      // Refocus sur le premier champ après ajout
      requestAnimationFrame(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus();
        }
      });
    } catch (error) {
      console.error('Error adding LinkedIn links:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Detailed error:', errorMessage);
      setError(`Erreur lors de l'ajout des liens LinkedIn: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await deleteLinkedInLink(id);
      
      const newLinks = links.filter(link => link.id !== id);
      setLinks(newLinks);
      updateUrlCount(newLinks);
    } catch (error) {
      console.error('Error deleting LinkedIn link:', error);
      setError('Erreur lors de la suppression du lien: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setIsLoading(false);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permettre Ctrl+V (ou Cmd+V sur Mac) pour coller
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      // Le navigateur gère automatiquement le collage
      return;
    }
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
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-4 mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Chargement...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            {urls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <input
                  ref={index === 0 ? firstInputRef : null}
                  type="url"
                  value={url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Collez ici le lien LinkedIn ou autre profil..."
                  disabled={isLoading}
                  autoFocus={index === 0}
                />
                {urls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveField(index)}
                    className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                    disabled={isLoading}
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
                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                <Plus className="w-4 h-4" />
                Ajouter un champ
              </button>
              
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={isLoading || urls.every(url => !url.trim())}
              >
                {isLoading ? 'Enregistrement...' : 'Enregistrer les profils'}
              </button>
            </div>
          </form>

          {error && (
            <div className="p-3 mb-4 text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {links.length === 0 && !isLoading && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Aucun profil LinkedIn ajouté pour cet AO
              </p>
            )}
            
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
                  className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                  disabled={isLoading}
                  title="Supprimer ce lien"
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