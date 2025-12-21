import { Palette, Grid3x3, Box, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewMode } from "../types";

interface ViewModeToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewModeToolbar({
  viewMode,
  onViewModeChange,
}: ViewModeToolbarProps) {
  return (
    <div className="mb-4 flex gap-2 flex-wrap">
      <Button
        variant={viewMode === "normal" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("normal")}
        className="gap-2"
      >
        <Eye className="h-4 w-4" />
        Normal
      </Button>
      <Button
        variant={viewMode === "wireframe" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("wireframe")}
        className="gap-2"
      >
        <Grid3x3 className="h-4 w-4" />
        Wireframe
      </Button>
      <Button
        variant={viewMode === "grayscale" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("grayscale")}
        className="gap-2"
      >
        <Palette className="h-4 w-4" />
        Grayscale
      </Button>
      <Button
        variant={viewMode === "wireframe-grayscale" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("wireframe-grayscale")}
        className="gap-2"
      >
        <Box className="h-4 w-4" />
        Wire+Gray
      </Button>
    </div>
  );
}
