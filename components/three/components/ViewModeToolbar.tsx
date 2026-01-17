import { Eye, Grid3x3, Palette, Box, Move, Video, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ViewMode, EditMode } from '../types';

interface ViewModeToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  editMode: EditMode;
  onEditModeChange: (mode: EditMode) => void;
  showBackground: boolean;
  onShowBackgroundChange: (show: boolean) => void;
}

export function ViewModeToolbar({
  viewMode,
  onViewModeChange,
  editMode,
  onEditModeChange,
  showBackground,
  onShowBackgroundChange,
}: ViewModeToolbarProps) {
  return (
    <div className="mb-2 md:mb-4 flex gap-1 md:gap-2 flex-wrap items-center">
      {/* View Mode */}
      <div className="flex gap-1 md:gap-2">
        <Button
          variant={viewMode === 'normal' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('normal')}
          className="gap-1 md:gap-2 h-7 md:h-8 px-2 md:px-3 text-[10px] md:text-xs"
        >
          <Eye className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">Normal</span>
        </Button>
        <Button
          variant={viewMode === 'wireframe' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('wireframe')}
          className="gap-1 md:gap-2 h-7 md:h-8 px-2 md:px-3 text-[10px] md:text-xs"
        >
          <Grid3x3 className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">Wireframe</span>
        </Button>
        <Button
          variant={viewMode === 'grayscale' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('grayscale')}
          className="gap-1 md:gap-2 h-7 md:h-8 px-2 md:px-3 text-[10px] md:text-xs"
        >
          <Palette className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">Grayscale</span>
        </Button>
        <Button
          variant={viewMode === 'wireframe-grayscale' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('wireframe-grayscale')}
          className="gap-1 md:gap-2 h-7 md:h-8 px-2 md:px-3 text-[10px] md:text-xs"
        >
          <Box className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">Wire+Gray</span>
        </Button>
      </div>

      {/* Divider */}
      <div className="w-px h-4 md:h-6 bg-gray-300 mx-1 md:mx-2" />

      {/* Studio Background Toggle */}
      <div className="flex gap-1 md:gap-2">
        <Button
          variant={showBackground ? 'default' : 'outline'}
          size="sm"
          onClick={() => onShowBackgroundChange(!showBackground)}
          className="gap-1 md:gap-2 h-7 md:h-8 px-2 md:px-3 text-[10px] md:text-xs"
        >
          <Layers className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">{showBackground ? 'Studio ON' : 'Focus Mode'}</span>
        </Button>
      </div>

      {/* Divider */}
      <div className="w-px h-4 md:h-6 bg-gray-300 mx-1 md:mx-2" />

      {/* Edit Mode */}
      <div className="flex gap-1 md:gap-2">
        <Button
          variant={editMode === 'camera' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onEditModeChange('camera')}
          className="gap-1 md:gap-2 h-7 md:h-8 px-2 md:px-3 text-[10px] md:text-xs"
        >
          <Video className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">Camera</span>
        </Button>
        <Button
          variant={editMode === 'object' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onEditModeChange('object')}
          className="gap-1 md:gap-2 h-7 md:h-8 px-2 md:px-3 text-[10px] md:text-xs"
        >
          <Move className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">Object</span>
        </Button>
      </div>
    </div>
  );
}