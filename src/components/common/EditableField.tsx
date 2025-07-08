import React, { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  type?: 'text' | 'number' | 'email' | 'tel' | 'date';
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  title?: string;
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Composant de champ éditable réutilisable
 */
export function EditableField({
  value,
  onSave,
  type = 'text',
  placeholder = '',
  icon,
  className = '',
  title = 'Cliquer pour modifier',
  min,
  max,
  step
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mettre à jour la valeur d'édition lorsque la valeur externe change
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Focus sur l'input lorsqu'on passe en mode édition
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
    setError(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await onSave(editValue);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Styles communs pour l'input
  const inputClasses = 'w-full px-2 py-1 border border-blue-500 dark:border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-xs sm:text-sm';

  // Styles pour le mode affichage
  const displayClasses = `cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 text-xs sm:text-sm break-words ${className}`;

  if (isEditing) {
    return (
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={inputClasses}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            disabled={isSaving}
            autoFocus
          />
          <button 
            onClick={handleSave} 
            className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 flex-shrink-0 disabled:opacity-50" 
            title="Sauvegarder"
            disabled={isSaving}
          >
            <Check className="w-4 h-4" />
          </button>
          <button 
            onClick={handleCancel} 
            className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 flex-shrink-0 disabled:opacity-50" 
            title="Annuler"
            disabled={isSaving}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {error && (
          <div className="text-xs text-red-500 dark:text-red-400">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      onClick={handleEdit} 
      className={displayClasses}
      title={title}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {value || placeholder}
    </div>
  );
}