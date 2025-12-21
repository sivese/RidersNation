import { Box } from "lucide-react";

interface EmptyStateProps {
  show: boolean;
}

export function EmptyState({ show }: EmptyStateProps) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center text-gray-400">
        <Box className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <p>No models generated yet</p>
        <p className="text-sm">Upload an image and generate 3D models</p>
      </div>
    </div>
  );
}
