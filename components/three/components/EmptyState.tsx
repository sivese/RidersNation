import { Box } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = 'No models generated yet',
  description = 'Upload an image and generate 3D models',
}: EmptyStateProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center text-gray-400">
        <Box className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <p>{title}</p>
        <p className="text-sm">{description}</p>
      </div>
    </div>
  );
}