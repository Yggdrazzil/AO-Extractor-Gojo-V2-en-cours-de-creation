import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, MapPin, DollarSign, Users, AlertCircle, Check, X } from 'lucide-react';
import { fetchNeeds, createNeed, updateNeed, deleteNeed } from '../services/needs';
import { supabase } from '../lib/supabase';
import type { Need } from '../types';

interface EditingNeed {
  id?: string;
  title: string;
  client: string;
  description: string;
  location: string;
  skills: string;
  maxRate: string;
  startDate: string;
  endDate: string;
  status: Need['status'];
}

export function NeedsManagement() {
  const [needs, setNeeds] = useState<Need[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingNeed, setEditingNeed] = useState<EditingNeed | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const emptyForm: EditingNeed = {
    title: '',
    client: '',
    description: '',
    location: '',
    skills: '',
    maxRate: '',
    startDate: '',
    endDate: '',
    status: 'Ouvert'
  };

  useEffect(() => {
    loadNeeds();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        // Récupérer l'ID du commercial basé sur l'email
        const { data: salesRep } = await supabase
          .from('sales_reps')
          .select('id')
          .eq('email', session.user.email)
          .single();
        
        if (salesRep) {
          setCurrentUserId(salesRep.id);
        }
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const loadNeeds = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const needsData = await fetchNeeds();
      setNeeds(needsData);
    } catch (err) {
      console.error('Error loading needs:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNeed || !currentUserId) return;

    try {
      setError(null);
      
      if (editingNeed.id) {
        // Mise à jour
        await updateNeed(editingNeed.id, {
          title: editingNeed.title,
          client: editingNeed.client,
          description: editingNeed.description,
          location: editingNeed.location,
          skills: editingNeed.skills,
          maxRate: editingNeed.maxRate ? parseInt(editingNeed.maxRate) : null,
          startDate: editingNeed.startDate || null,
          endDate: editingNeed.endDate || null,
          status: editingNeed.status
        });
      } else {
        // Création
        await createNeed({
          title: editingNeed.title,
          client: editingNeed.client,
          description: editingNeed.description,
          location: editingNeed.location,
          skills: editingNeed.skills,
          maxRate: editingNeed.maxRate ? parseInt(editingNeed.maxRate) : null,
          startDate: editingNeed.startDate || null,
          endDate: editingNeed.endDate || null,
          status: editingNeed.status,
          createdBy: currentUserId
        });
      }

      await loadNeeds();
      setShowForm(false);
      setEditingNeed(null);
    } catch (err) {
      console.error('Error saving need:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (need: Need) => {
    setEditingNeed({
      id: need.id,
      title: need.title,
      client: need.client,
      description: need.description,
      location: need.location,
      skills: need.skills,
      maxRate: need.maxRate?.toString() || '',
      startDate: need.startDate || '',
      endDate: need.endDate || '',
      status: need.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce besoin ?')) return;

    try {
      setError(null);
      await deleteNeed(id);
      await loadNeeds();
    } catch (err) {
      console.error('Error deleting need:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (status: Need['status']) => {
    const styles = {
      'Ouvert': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'En cours': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Pourvu': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      'Annulé': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Gestion des Besoins
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Créez et gérez les besoins clients pour vos prospects
          </p>
        </div>
        <button
          onClick={() => {
            setEditingNeed(emptyForm);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau besoin
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Formulaire */}
      {showForm && editingNeed && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            {editingNeed.id ? 'Modifier le besoin' : 'Nouveau besoin'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Titre du besoin *
                </label>
                <input
                  type="text"
                  required
                  value={editingNeed.title}
                  onChange={(e) => setEditingNeed({ ...editingNeed, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Consultant Java Senior"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Client *
                </label>
                <input
                  type="text"
                  required
                  value={editingNeed.client}
                  onChange={(e) => setEditingNeed({ ...editingNeed, client: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nom du client"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={editingNeed.description}
                onChange={(e) => setEditingNeed({ ...editingNeed, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Description détaillée du besoin..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Localisation
                </label>
                <input
                  type="text"
                  value={editingNeed.location}
                  onChange={(e) => setEditingNeed({ ...editingNeed, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Paris, Télétravail, France entière"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  TJM Maximum (€)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingNeed.maxRate}
                  onChange={(e) => setEditingNeed({ ...editingNeed, maxRate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="750"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Compétences requises
              </label>
              <input
                type="text"
                value={editingNeed.skills}
                onChange={(e) => setEditingNeed({ ...editingNeed, skills: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Java, Spring Boot, Microservices, Docker..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={editingNeed.startDate}
                  onChange={(e) => setEditingNeed({ ...editingNeed, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={editingNeed.endDate}
                  onChange={(e) => setEditingNeed({ ...editingNeed, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Statut
                </label>
                <select
                  value={editingNeed.status}
                  onChange={(e) => setEditingNeed({ ...editingNeed, status: e.target.value as Need['status'] })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Ouvert">Ouvert</option>
                  <option value="En cours">En cours</option>
                  <option value="Pourvu">Pourvu</option>
                  <option value="Annulé">Annulé</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Check className="w-4 h-4" />
                {editingNeed.id ? 'Mettre à jour' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingNeed(null);
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des besoins */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {needs.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Aucun besoin créé
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Créez votre premier besoin client pour commencer
            </p>
            <button
              onClick={() => {
                setEditingNeed(emptyForm);
                setShowForm(true);
              }}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Créer un besoin
            </button>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Besoin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Localisation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      TJM Max
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {needs.map((need) => (
                    <tr key={need.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {need.title}
                          </div>
                          {need.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {need.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {need.client}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {need.location || 'Non spécifié'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {need.maxRate ? `${need.maxRate}€` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(need.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(need)}
                            className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(need.id)}
                            className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}