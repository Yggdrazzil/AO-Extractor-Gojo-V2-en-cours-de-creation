import React from 'react';
import { RFPForm } from './RFPForm';
import { RFPTable } from './RFPTable';
import { ProspectsForm } from './ProspectsForm';
import { ProspectsTable } from './ProspectsTable';
import type { RFP, SalesRep } from '../types';
import type { Prospect } from '../types';

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
  
  // Props pour les prospects
  prospects?: Prospect[];
  onAnalyzeProspect?: (textContent: string, file: File | null, assignedTo: string) => Promise<void>;
  isAnalyzingProspect?: boolean;
  onProspectStatusChange?: (id: string, status: Prospect['status']) => Promise<void>;
  onProspectAssigneeChange?: (id: string, assignedTo: string) => Promise<void>;
  onProspectDateUpdateChange?: (id: string, dateUpdate: string) => Promise<void>;
  onProspectAvailabilityChange?: (id: string, availability: string) => Promise<void>;
  onProspectDailyRateChange?: (id: string, dailyRate: string) => Promise<void>;
  onProspectResidenceChange?: (id: string, residence: string) => Promise<void>;
  onProspectMobilityChange?: (id: string, mobility: string) => Promise<void>;
  onProspectPhoneChange?: (id: string, phone: string) => Promise<void>;
  onProspectEmailChange?: (id: string, email: string) => Promise<void>;
  onProspectView?: (prospect: Prospect) => Promise<void>;
  onProspectDelete?: (id: string) => Promise<void>;
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
  prospects = [],
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
  onDelete,
  onAnalyzeProspect,
  isAnalyzingProspect = false,
  onProspectStatusChange,
  onProspectAssigneeChange,
  onProspectDateUpdateChange,
  onProspectAvailabilityChange,
  onProspectDailyRateChange,
  onProspectResidenceChange,
  onProspectMobilityChange,
  onProspectPhoneChange,
  onProspectEmailChange,
  onProspectView,
  onProspectDelete
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
          {onAnalyzeProspect && (
            <ProspectsForm
              salesReps={salesReps}
              onSubmit={onAnalyzeProspect}
              isLoading={isAnalyzingProspect}
            />
          )}
          {onProspectStatusChange && onProspectAssigneeChange && onProspectDateUpdateChange && 
           onProspectAvailabilityChange && onProspectDailyRateChange && onProspectResidenceChange && 
           onProspectMobilityChange && onProspectPhoneChange && onProspectEmailChange && 
           onProspectView && onProspectDelete && (
            <ProspectsTable
              prospects={prospects}
              salesReps={salesReps}
              onStatusChange={onProspectStatusChange}
              onAssigneeChange={onProspectAssigneeChange}
              onDateUpdateChange={onProspectDateUpdateChange}
              onAvailabilityChange={onProspectAvailabilityChange}
              onDailyRateChange={onProspectDailyRateChange}
              onResidenceChange={onProspectResidenceChange}
              onMobilityChange={onProspectMobilityChange}
              onPhoneChange={onProspectPhoneChange}
              onEmailChange={onProspectEmailChange}
              onView={onProspectView}
              onDelete={onProspectDelete}
            />
          )}
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