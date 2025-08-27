import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { SettingsModal } from './SettingsModal';

interface HeaderProps {
  activeTab: string;
}

const tabTitles = {
  'rfp-extractor': 'Appels d\'Offres',
  'prospects': 'Prises de Références', 
  'boondmanager-prospects': 'Besoins Clients',
  'analytics': 'Analytics',
  'tools': 'Outils'
};

export function Header({ activeTab }: HeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const currentTitle = tabTitles[activeTab as keyof typeof tabTitles] || 'GOJO';

  return (
    <>
      <header className="flex items-center px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16">
        <div className="w-12"></div>
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentTitle}</h1>
        </div>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-6 h-6" />
        </button>
      </header>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}