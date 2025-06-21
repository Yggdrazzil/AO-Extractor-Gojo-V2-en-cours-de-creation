import React from 'react';
import { FileText, Users, BarChart3, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
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

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-full lg:w-16 bg-white dark:bg-gray-800 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 flex lg:flex-col">
      {/* Header */}
      <div className="p-3 border-r lg:border-r-0 lg:border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="w-10 h-10 bg-[#1651EE] rounded-lg flex items-center justify-center mx-auto">
          <span className="text-white font-bold text-lg">G</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-x-auto lg:overflow-x-visible">
        <div className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                title={tab.label}
                className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-lg transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-[#1651EE] text-white shadow-lg'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-6 h-6" />
                
                {/* Tooltip */}
                <div className="absolute left-full lg:left-full lg:ml-2 bottom-full lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 mb-2 lg:mb-0 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {tab.label}
                  <div className="absolute left-1/2 lg:left-0 top-full lg:top-1/2 transform -translate-x-1/2 lg:-translate-x-1 lg:-translate-y-1/2 translate-y-0 lg:translate-y-0 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-2 border-l lg:border-l-0 lg:border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="text-xs text-gray-400 dark:text-gray-500 text-center font-mono">
          v1.0
        </div>
      </div>
    </div>
  );
}