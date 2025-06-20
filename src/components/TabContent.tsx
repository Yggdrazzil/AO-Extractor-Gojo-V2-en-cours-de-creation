import React from 'react';
import { RFPForm } from './RFPForm';
import { RFPTable } from './RFPTable';
import { ProspectsForm } from './ProspectsForm';
import type { RFP, SalesRep } from '../types';

interface TabContentProps {
  activeTab: string;
  // Props pour l'extracteur AO
  rfps?: RFP[];
  salesReps?: SalesRep[];
  onAnalyzeRFP?: (content: string, assignedTo: string) => Promise<void>;
  isAnalyzing?: boolean;
  onStatusChange?: (id: string, status: RFP['status']) => Promise<void>;
  onAssigneeChange?: (id: string, assignedTo: string) => Promise<void>;
  onClientChange?: (id: string, client: string) => Promise<void>;
  onMissionChange?: (id: string, mission: string) => Promise<void>;
  onLocationChange?: (id: string, location: string) => Promise<void>;
  onMaxRateChange?: (id: string, maxRate: string) => Promise<void>;
  onStartDateChange?: (id: string, startDate: string) => Promise<void>;
  onCreatedAtChange?: (id: string, createdAt: string) => Promise<void>;
  onView?: (rfp: RFP) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

function PlaceholderTab({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🚧</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
}

export function TabContent({ 
  activeTab, 
  rfps = [], 
  salesReps = [], 
  onAnalyzeRFP,
  isAnalyzing = false,
  onStatusChange,
  onAssigneeChange,
  onClientChange,
  onMissionChange,
  onLocationChange,
  onMaxRateChange,
  onStartDateChange,
  onCreatedAtChange,
  onView,
  onDelete
}: TabContentProps) {
  switch (activeTab) {
    case 'rfp-extractor':
      return (
        <div className="space-y-6">
          {onAnalyzeRFP && (
            <RFPForm
              salesReps={salesReps}
              onSubmit={onAnalyzeRFP}
              isLoading={isAnalyzing}
            />
          )}
          {onStatusChange && onAssigneeChange && onClientChange && onMissionChange && 
           onLocationChange && onMaxRateChange && onStartDateChange && onCreatedAtChange && 
           onView && onDelete && (
            <RFPTable
              rfps={rfps}
              salesReps={salesReps}
              onStatusChange={onStatusChange}
              onAssigneeChange={onAssigneeChange}
              onClientChange={onClientChange}
              onMissionChange={onMissionChange}
              onLocationChange={onLocationChange}
              onMaxRateChange={onMaxRateChange}
              onStartDateChange={onStartDateChange}
              onCreatedAtChange={onCreatedAtChange}
              onView={onView}
              onDelete={onDelete}
            />
          )}
        </div>
      );

    case 'prospects':
      return (
        <div className="space-y-6">
          <ProspectsForm
            salesReps={salesReps}
            onSubmit={async (textContent: string, file: File | null, assignedTo: string) => {
              console.log('Analyzing prospects:', { textContent, file: file?.name, assignedTo });
              // TODO: Implémenter l'analyse des profils
              alert('Fonctionnalité d\'analyse des profils en cours de développement');
            }}
            isLoading={false}
          />
          
          {/* Placeholder pour le tableau des profils */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Tableau des Profils
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Le tableau d'affichage des profils analysés sera disponible prochainement.
              </p>
            </div>
          </div>
        </div>
      );

    case 'analytics':
      return (
        <PlaceholderTab
          title="Analytics & Reporting"
          description="Tableaux de bord et analyses des performances. Fonctionnalité en cours de développement."
        />
      );

    case 'tools':
      return (
        <PlaceholderTab
          title="Outils Additionnels"
          description="Suite d'outils complémentaires pour optimiser votre workflow. Fonctionnalité en cours de développement."
        />
      );

    default:
      return (
        <PlaceholderTab
          title="Page non trouvée"
          description="La page demandée n'existe pas."
        />
      );
  }
}