import { Box, X } from 'lucide-react';
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
  if (models.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 model-selector-container">
      <h3 className="model-selector-header">
        Generated Models ({models.length})
      </h3>
      <div className="flex flex-col gap-2 px-2">
        {models.map((model) => {
          const partTypeClass = getPartTypeStyle(model.partType);
          const isSelected = selectedModelId === model.id;

          return (
            <div
              key={model.id}
              className={`
                model-selector-item
                ${partTypeClass}
                ${isSelected ? 'model-selector-item-selected' : ''}
              `}
              onClick={() => onSelect?.(model.id)}
            >
              {/* Thumbnail */}
              {model.thumbnail ? (
                <img
                  src={model.thumbnail}
                  alt={model.name}
                  className="w-12 h-12 object-cover rounded-md"
                />
              ) : (
                <div className={`model-selector-item-thumbnail ${partTypeClass}`}>
                  <Box className="h-6 w-6" />
                </div>
              )}

              {/* Model Info */}
              <div className="flex-1 min-w-0 pr-4">
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
                  className="model-selector-delete-btn"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
