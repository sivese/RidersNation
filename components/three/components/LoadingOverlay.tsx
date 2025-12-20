interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading model...' }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2" />
        <p>{message}</p>
      </div>
    </div>
  );
}