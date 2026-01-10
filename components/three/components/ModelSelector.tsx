import { Box, X, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { ModelOption } from '../types';
import { getPartTypeStyle } from '../utils/styles';

interface ModelSelectorProps {
  models: ModelOption[];
  selectedModelId?: string | null;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ModelSelector({
  models,
  selectedModelId,
  onSelect,
  onDelete,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find selected model
  const selectedModel = models.find((m) => m.id === selectedModelId) || models[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (models.length === 0) return null;

  const handleSelect = (modelId: string) => {
    onSelect?.(modelId);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="absolute top-4 right-4 z-50">
      {/* Dropdown Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="model-selector-trigger"
      >
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          {/* Selected Model Thumbnail */}
          {selectedModel?.thumbnail ? (
            <img
              src={selectedModel.thumbnail}
              alt={selectedModel.name}
              className="w-8 h-8 md:w-10 md:h-10 object-cover rounded-md flex-shrink-0"
            />
          ) : (
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-md flex items-center justify-center flex-shrink-0 ${getPartTypeStyle(selectedModel?.partType)}`}>
              <Box className="h-4 w-4 md:h-5 md:w-5" />
            </div>
          )}

          {/* Selected Model Info */}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs md:text-sm font-medium text-foreground truncate">
              {selectedModel?.name || 'Select Model'}
            </p>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              {models.length} {models.length === 1 ? 'model' : 'models'}
            </p>
          </div>

          {/* Chevron Icon */}
          <ChevronDown 
            className={`h-4 w-4 md:h-5 md:w-5 text-muted-foreground transition-transform flex-shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="model-selector-dropdown">
          <div className="model-selector-dropdown-header">
            Generated Models ({models.length})
          </div>
          <div className="model-selector-dropdown-list">
            {models.map((model) => {
              const partTypeClass = getPartTypeStyle(model.partType);
              const isSelected = selectedModelId === model.id;

              return (
                <div
                  key={model.id}
                  className={`
                    model-selector-dropdown-item
                    ${partTypeClass}
                    ${isSelected ? 'model-selector-item-selected' : ''}
                  `}
                  onClick={() => handleSelect(model.id)}
                >
                  {/* Thumbnail */}
                  {model.thumbnail ? (
                    <img
                      src={model.thumbnail}
                      alt={model.name}
                      className="w-8 h-8 md:w-10 md:h-10 object-cover rounded-md flex-shrink-0"
                    />
                  ) : (
                    <div className={`model-selector-item-thumbnail ${partTypeClass}`}>
                      <Box className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                  )}

                  {/* Model Info */}
                  <div className="flex-1 min-w-0">
                    <p className="model-selector-item-name">
                      {model.name}
                    </p>
                    {model.partType && (
                      <span className={`model-selector-item-badge ${partTypeClass}`}>
                        {model.partType}
                      </span>
                    )}
                  </div>

                  {/* Delete Button */}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(model.id);
                      }}
                      className="model-selector-delete-btn opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 md:h-4 md:w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
