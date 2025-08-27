import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { Logo } from './Logo';
import { SettingsModal } from './SettingsModal';

export function Header() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="flex items-center px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16">
        <div className="flex items-center w-12">
          <Logo />
        </div>
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">GOJO</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">RFP Extractor</p>
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