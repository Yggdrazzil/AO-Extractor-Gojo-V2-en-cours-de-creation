import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, FileText, Calendar, MapPin, Phone, Mail, Euro, User, Building } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ClientNeed {
  id: string;
  text_content: string | null;
  file_name: string | null;
  file_url: string | null;
  file_content: string | null;
  selected_need_id: string;
  selected_need_title: string;
  availability: string | null;
  daily_rate: number | null;
  residence: string | null;
  mobility: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
  assigned_to: string;
  is_read: boolean | null;
  created_at: string | null;
  salary_expectations: number | null;
}

interface SalesRep {
  id: string;
  name: string;
  code: string;
  email: string;
}

export default function ClientNeedsTable() {
  const [clientNeeds, setClientNeeds] = useState<ClientNeed[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);

  useEffect(() => {
    fetchClientNeeds();
    fetchSalesReps();
  }, []);

  const fetchClientNeeds = async () => {
    try {
      const { data, error } = await supabase
        .from('client_needs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientNeeds(data || []);
    } catch (error) {
      console.error('Error fetching client needs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesReps = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_reps')
        .select('*');

      if (error) throw error;
      setSalesReps(data || []);
    } catch (error) {
      console.error('Error fetching sales reps:', error);
    }
  };

  const toggleReadStatus = async (id: string, currentStatus: boolean | null) => {
    try {
      const { error } = await supabase
        .from('client_needs')
        .update({ is_read: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      setClientNeeds(prev => 
        prev.map(need => 
          need.id === id ? { ...need, is_read: !currentStatus } : need
        )
      );
    } catch (error) {
      console.error('Error updating read status:', error);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('client_needs')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setClientNeeds(prev => 
        prev.map(need => 
          need.id === id ? { ...need, status: newStatus } : need
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getSalesRepName = (id: string) => {
    const rep = salesReps.find(rep => rep.id === id);
    return rep ? rep.name : 'Unknown';
  };

  const showContent = (content: string | null) => {
    setSelectedContent(content);
    setShowContentModal(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'Traité':
        return 'bg-green-100 text-green-800';
      case 'À traiter':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Besoins Clients</h2>
          <p className="text-sm text-gray-600 mt-1">
            {clientNeeds.length} besoin{clientNeeds.length !== 1 ? 's' : ''} client{clientNeeds.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Besoin Sélectionné
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Détails
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigné à
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clientNeeds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium">Aucun besoin client</p>
                    <p className="text-sm">Les besoins clients apparaîtront ici une fois ajoutés.</p>
                  </td>
                </tr>
              ) : (
                clientNeeds.map((need) => (
                  <tr key={need.id} className={`hover:bg-gray-50 ${!need.is_read ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={need.status || 'À traiter'}
                        onChange={(e) => updateStatus(need.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(need.status)}`}
                      >
                        <option value="À traiter">À traiter</option>
                        <option value="Traité">Traité</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {need.selected_need_title}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {need.selected_need_id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {need.email && need.email !== '-' && (
                          <div className="flex items-center text-xs text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            {need.email}
                          </div>
                        )}
                        {need.phone && need.phone !== '-' && (
                          <div className="flex items-center text-xs text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            {need.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {need.residence && need.residence !== '-' && (
                          <div className="flex items-center text-xs text-gray-600">
                            <MapPin className="h-3 w-3 mr-1" />
                            {need.residence}
                          </div>
                        )}
                        {need.daily_rate && (
                          <div className="flex items-center text-xs text-gray-600">
                            <Euro className="h-3 w-3 mr-1" />
                            {need.daily_rate}€/jour
                          </div>
                        )}
                        {need.salary_expectations && (
                          <div className="flex items-center text-xs text-gray-600">
                            <Euro className="h-3 w-3 mr-1" />
                            {need.salary_expectations}K€/an
                          </div>
                        )}
                        {need.availability && need.availability !== '-' && (
                          <div className="flex items-center text-xs text-gray-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            {need.availability}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="h-4 w-4 mr-1" />
                        {getSalesRepName(need.assigned_to)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(need.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleReadStatus(need.id, need.is_read)}
                          className={`p-1 rounded-full ${
                            need.is_read 
                              ? 'text-gray-400 hover:text-gray-600' 
                              : 'text-blue-600 hover:text-blue-800'
                          }`}
                          title={need.is_read ? 'Marquer comme non lu' : 'Marquer comme lu'}
                        >
                          {need.is_read ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        {(need.text_content || need.file_content) && (
                          <button
                            onClick={() => showContent(need.text_content || need.file_content)}
                            className="p-1 rounded-full text-gray-400 hover:text-gray-600"
                            title="Voir le contenu"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Content Modal */}
      {showContentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Contenu du besoin client</h3>
              <button
                onClick={() => setShowContentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Fermer</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                {selectedContent}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { ClientNeedsTable }