import React from 'react';
import { FileText, Users, BarChart3, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  rfps?: any[];
  prospects?: any[];
  boondmanagerProspects?: any[];
}

const tabs = [
  {
    id: 'rfp-extractor',
    label: 'Extracteur AO',
    icon: FileText,
    description: 'Analyse d\'appels d\'offres'
  },
  {
    id: 'prospects',
    label: 'Profils pour prise de Références',
    icon: Users,
    description: 'Analyse de profils pour références'
  },
  {
    id: 'boondmanager-prospects',
    label: 'Profils pour besoins Boondmanager',
    icon: Users,
    description: 'Analyse de profils pour besoins clients'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Tableaux de bord'
  },
  {
    id: 'tools',
    label: 'Outils',
    icon: Settings,
    description: 'Outils additionnels'
  }
];

export function Sidebar({ activeTab, onTabChange, rfps = [], prospects = [], boondmanagerProspects = [] }: SidebarProps) {
  return (
    <div className="w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10 h-10 bg-[#1651EE] rounded-lg flex items-center justify-center mx-auto">
          <span className="text-white font-bold text-lg">G</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <div className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                title={tab.label}
                className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-[#1651EE] text-white shadow-lg'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-6 h-6" />
                
                {/* Tooltip */}
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {tab.label}
                  <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-400 dark:text-gray-500 text-center font-mono">
          v1.0
        </div>
      </div>
    </div>
  );
}