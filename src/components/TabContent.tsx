import React from 'react';
import { RFPForm } from './RFPForm';
import { RFPTable } from './RFPTable';
import { ProspectsForm } from './ProspectsForm';
import { ProspectsTable } from './ProspectsTable';
import { ClientNeedsForm } from './BoondmanagerProspectsForm';
import { ClientNeedsTable } from './ClientNeedsTable';
import { DailySummaryTest } from './DailySummaryTest';
import { DailyProspectsSummaryTest } from './DailyProspectsSummaryTest';
import { DailyClientNeedsSummaryTest } from './DailyClientNeedsSummaryTest';
import { NotificationSystemStatus } from './NotificationSystemStatus';
import { EmailDiagnosticPanel } from './EmailDiagnosticPanel';
import type { RFP, SalesRep } from '../types';
import type { Prospect } from '../types';
import type { BoondmanagerProspect } from '../types';

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
  onCommentsChange?: (id: string, comments: string) => Promise<void>;
  onView?: (rfp: RFP) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  
  // Props pour les prospects
  prospects?: Prospect[];
  boondmanagerProspects?: BoondmanagerProspect[];
  onAnalyzeProspect?: (textContent: string, targetAccount: string, file: File | null, assignedTo: string) => Promise<void>;
  onAnalyzeBoondmanagerProspect?: (textContent: string, selectedNeedId: string, selectedNeedTitle: string, file: File | null, assignedTo: string) => Promise<void>;
  isAnalyzingProspect?: boolean;
  isAnalyzingBoondmanagerProspect?: boolean;
  onProspectStatusChange?: (id: string, status: Prospect['status']) => Promise<void>;
  onProspectAssigneeChange?: (id: string, assignedTo: string) => Promise<void>;
  onProspectTargetAccountChange?: (id: string, targetAccount: string) => Promise<void>;
  onProspectAvailabilityChange?: (id: string, availability: string) => Promise<void>;
  onProspectDailyRateChange?: (id: string, dailyRate: string) => Promise<void>;
  onProspectResidenceChange?: (id: string, residence: string) => Promise<void>;
  onProspectMobilityChange?: (id: string, mobility: string) => Promise<void>;
  onProspectPhoneChange?: (id: string, phone: string) => Promise<void>;
  onProspectEmailChange?: (id: string, email: string) => Promise<void>;
  onProspectView?: (prospect: Prospect) => Promise<void>;
  onProspectDelete?: (id: string) => Promise<void>;
  onProspectCommentsChange?: (id: string, comments: string) => Promise<void>;
  
  // Props pour les besoins clients
  onBoondmanagerProspectStatusChange?: (id: string, status: 'À traiter' | 'Traité') => Promise<void>;
  onBoondmanagerProspectAssigneeChange?: (id: string, assignedTo: string) => Promise<void>;
  onBoondmanagerProspectSelectedNeedChange?: (id: string, besoin: string) => Promise<void>;
  onBoondmanagerProspectAvailabilityChange?: (id: string, availability: string) => Promise<void>;
  onBoondmanagerProspectDailyRateChange?: (id: string, dailyRate: string) => Promise<void>;
  onBoondmanagerProspectResidenceChange?: (id: string, residence: string) => Promise<void>;
  onBoondmanagerProspectMobilityChange?: (id: string, mobility: string) => Promise<void>;
  onBoondmanagerProspectPhoneChange?: (id: string, phone: string) => Promise<void>;
  onBoondmanagerProspectEmailChange?: (id: string, email: string) => Promise<void>;
  onBoondmanagerProspectView?: (prospect: BoondmanagerProspect) => Promise<void>;
  onBoondmanagerProspectDelete?: (id: string) => Promise<void>;
  onBoondmanagerProspectCommentsChange?: (id: string, comments: string) => Promise<void>;
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
  boondmanagerProspects = [],
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
  onCommentsChange,
  onView,
  onDelete,
  onAnalyzeProspect,
  onAnalyzeBoondmanagerProspect,
  isAnalyzingProspect = false,
  isAnalyzingBoondmanagerProspect = false,
  onProspectStatusChange,
  onProspectAssigneeChange,
  onProspectTargetAccountChange,
  onProspectAvailabilityChange,
  onProspectDailyRateChange,
  onProspectResidenceChange,
  onProspectMobilityChange,
  onProspectPhoneChange,
  onProspectEmailChange,
  onProspectView,
  onProspectDelete,
  onProspectCommentsChange,
  onBoondmanagerProspectStatusChange,
  onBoondmanagerProspectAssigneeChange,
  onBoondmanagerProspectSelectedNeedChange,
  onBoondmanagerProspectAvailabilityChange,
  onBoondmanagerProspectDailyRateChange,
  onBoondmanagerProspectResidenceChange,
  onBoondmanagerProspectMobilityChange,
  onBoondmanagerProspectPhoneChange,
  onBoondmanagerProspectEmailChange,
  onBoondmanagerProspectView,
 onBoondmanagerProspectDelete,
  onBoondmanagerProspectCommentsChange
}: TabContentProps) {
  switch (activeTab) {
    case 'rfp-extractor':
      return (
        <div className="p-6 space-y-6 h-full overflow-auto">
          {onAnalyzeRFP && (
            <RFPForm
              salesReps={salesReps}
              onSubmit={onAnalyzeRFP}
              isLoading={isAnalyzing}
            />
          )}
          <RFPTable
            rfps={rfps}
            salesReps={salesReps}
            onStatusChange={onStatusChange || (() => Promise.resolve())}
            onAssigneeChange={onAssigneeChange || (() => Promise.resolve())}
            onClientChange={onClientChange || (() => Promise.resolve())}
            onMissionChange={onMissionChange || (() => Promise.resolve())}
            onLocationChange={onLocationChange || (() => Promise.resolve())}
            onMaxRateChange={onMaxRateChange || (() => Promise.resolve())}
            onStartDateChange={onStartDateChange || (() => Promise.resolve())}
            onCreatedAtChange={onCreatedAtChange || (() => Promise.resolve())}
            onCommentsChange={onCommentsChange || (() => Promise.resolve())}
            onView={onView || (() => Promise.resolve())}
            onDelete={onDelete || (() => Promise.resolve())}
          />
        </div>
      );

    case 'prospects':
      return (
        <div className="p-6 space-y-6 h-full overflow-auto">
          {onAnalyzeProspect && (
            <ProspectsForm
              salesReps={salesReps}
              onSubmit={onAnalyzeProspect}
              isLoading={isAnalyzingProspect}
            />
          )}
          <ProspectsTable
            prospects={prospects}
            salesReps={salesReps}
            onStatusChange={onProspectStatusChange || (() => Promise.resolve())}
            onAssigneeChange={onProspectAssigneeChange || (() => Promise.resolve())}
            onTargetAccountChange={onProspectTargetAccountChange || (() => Promise.resolve())}
            onAvailabilityChange={onProspectAvailabilityChange || (() => Promise.resolve())}
            onDailyRateChange={onProspectDailyRateChange || (() => Promise.resolve())}
            onResidenceChange={onProspectResidenceChange || (() => Promise.resolve())}
            onMobilityChange={onProspectMobilityChange || (() => Promise.resolve())}
            onPhoneChange={onProspectPhoneChange || (() => Promise.resolve())}
            onEmailChange={onProspectEmailChange || (() => Promise.resolve())}
            onView={onProspectView || (() => Promise.resolve())}
            onDelete={onProspectDelete || (() => Promise.resolve())}
            onCommentsChange={onProspectCommentsChange || (() => Promise.resolve())}
          />
        </div>
      );

    case 'boondmanager-prospects':
      return (
        <div className="p-6 space-y-6 h-full overflow-auto">
          {onAnalyzeBoondmanagerProspect && (
            <ClientNeedsForm
              salesReps={salesReps}
              onSubmit={(textContent, selectedNeedId, selectedNeedTitle, file, assignedTo) => 
                onAnalyzeBoondmanagerProspect(textContent, selectedNeedId, selectedNeedTitle, file, assignedTo)
              }
              isLoading={isAnalyzingBoondmanagerProspect}
            />
          )}
          <ClientNeedsTable
            prospects={boondmanagerProspects}
            salesReps={salesReps}
            onStatusChange={onBoondmanagerProspectStatusChange!}
            onAssigneeChange={onBoondmanagerProspectAssigneeChange || (() => Promise.resolve())}
            onSelectedNeedChange={onBoondmanagerProspectSelectedNeedChange || (() => Promise.resolve())}
            onAvailabilityChange={onBoondmanagerProspectAvailabilityChange || (() => Promise.resolve())}
            onDailyRateChange={onBoondmanagerProspectDailyRateChange || (() => Promise.resolve())}
            onResidenceChange={onBoondmanagerProspectResidenceChange || (() => Promise.resolve())}
            onMobilityChange={onBoondmanagerProspectMobilityChange || (() => Promise.resolve())}
            onPhoneChange={onBoondmanagerProspectPhoneChange || (() => Promise.resolve())}
            onEmailChange={onBoondmanagerProspectEmailChange || (() => Promise.resolve())}
            onView={onBoondmanagerProspectView || (() => Promise.resolve())}
            onDelete={onBoondmanagerProspectDelete || (() => Promise.resolve())}
            onCommentsChange={onBoondmanagerProspectCommentsChange || (() => Promise.resolve())}
          />
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
        <div className="p-6 space-y-6 h-full overflow-auto">
          <EmailDiagnosticPanel />
          <NotificationSystemStatus />
          <DailySummaryTest />
          <DailyProspectsSummaryTest />
          <DailyClientNeedsSummaryTest />
        </div>
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