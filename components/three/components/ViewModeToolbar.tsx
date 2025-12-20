import { Eye, Grid3x3, Palette, Box, Move, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ViewMode, EditMode } from '../types';

interface ViewModeToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  editMode: EditMode;
  onEditModeChange: (mode: EditMode) => void;
}

export function ViewModeToolbar({
  viewMode,
  onViewModeChange,
  editMode,
  onEditModeChange,
}: ViewModeToolbarProps) {
  return (
    <div className="mb-4 flex gap-2 flex-wrap items-center">
      {/* View Mode */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === 'normal' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('normal')}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          Normal
        </Button>
        <Button
          variant={viewMode === 'wireframe' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('wireframe')}
          className="gap-2"
        >
          <Grid3x3 className="h-4 w-4" />
          Wireframe
        </Button>
        <Button
          variant={viewMode === 'grayscale' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('grayscale')}
          className="gap-2"
        >
          <Palette className="h-4 w-4" />
          Grayscale
        </Button>
        <Button
          variant={viewMode === 'wireframe-grayscale' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('wireframe-grayscale')}
          className="gap-2"
        >
          <Box className="h-4 w-4" />
          Wire+Gray
        </Button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* Edit Mode */}
      <div className="flex gap-2">
        <Button
          variant={editMode === 'camera' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onEditModeChange('camera')}
          className="gap-2"
        >
          <Video className="h-4 w-4" />
          Camera
        </Button>
        <Button
          variant={editMode === 'object' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onEditModeChange('object')}
          className="gap-2"
        >
          <Move className="h-4 w-4" />
          Object
        </Button>
      </div>
    </div>
  );
}