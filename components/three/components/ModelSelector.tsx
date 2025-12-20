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
    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 max-h-[450px] overflow-y-auto min-w-[180px]">
      <h3 className="text-sm font-semibold mb-3 text-gray-700 border-b pb-2">
        Generated Models ({models.length})
      </h3>
      <div className="flex flex-col gap-2">
        {models.map((model) => {
          const style = getPartTypeStyle(model.partType);
          const isSelected = selectedModelId === model.id;

          return (
            <div
              key={model.id}
              className={`
                relative flex items-center gap-3 p-2 rounded-lg transition-all cursor-pointer
                hover:shadow-md
                ${isSelected
                  ? `${style.bg} border-2 ${style.border}`
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                }
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
                <div className={`w-12 h-12 rounded-md flex items-center justify-center ${style.bg}`}>
                  <Box className={`h-6 w-6 ${style.text}`} />
                </div>
              )}

              {/* Model Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {model.name}
                </p>
                {model.partType && (
                  <span className={`
                    inline-block text-xs px-2 py-0.5 rounded-full mt-1
                    ${style.bg} ${style.text}
                  `}>
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
                  className="p-1.5 hover:bg-red-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
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