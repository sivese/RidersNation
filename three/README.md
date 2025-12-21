# 3D Viewer Modular Architecture

This directory contains a modularized 3D viewer component built with Three.js and React.

## 📁 Directory Structure

```
three/
├── 3d-viewer.tsx           # Main component (orchestrator)
├── types.ts                # TypeScript interfaces and types
├── modular-system.ts       # Existing modular system utilities
├── mouse.ts                # Mouse utilities
├── components/             # UI Components
│   ├── ViewModeToolbar.tsx    # View mode buttons (Normal, Wireframe, etc.)
│   ├── ModelSelector.tsx      # Model selection sidebar panel
│   ├── LoadingOverlay.tsx     # Loading state overlay
│   └── EmptyState.tsx         # Empty state display
├── hooks/                  # Custom React Hooks
│   ├── useThreeScene.ts       # Scene, camera, renderer setup
│   ├── useModelLoader.ts      # GLTF model loading logic
│   ├── useDragControls.ts     # Drag-and-drop functionality
│   └── useViewModel.ts        # View mode state and application
├── utils/                  # Utility Functions
│   ├── materials.ts           # Material utilities (shaders, colors)
│   └── sceneHelpers.ts        # Scene helper functions
└── model/
    └── motorcycle.ts       # Motorcycle model utilities
```

## 🎯 Key Components

### Main Component

**`3d-viewer.tsx`**

- Orchestrates all hooks and components
- Handles props from parent components
- Renders UI components in proper layout
- ~90 lines (down from 600+ lines!)

### Custom Hooks

**`useThreeScene.ts`**

- Initializes Three.js scene, camera, renderer
- Sets up lighting (ambient, spotlight, directional)
- Handles canvas lifecycle and resize events
- Returns: `sceneRef`, `cameraRef`, `rendererRef`, `controlsRef`

**`useModelLoader.ts`**

- Loads GLTF models using GLTFLoader
- Manages model lifecycle (loading, cleanup)
- Centers and scales models automatically
- Stores original materials for view mode changes
- Returns: `modelRef`, `originalMaterialsRef`, `isLoading`

**`useDragControls.ts`**

- Implements raycasting for object selection
- Handles mouse events for drag-and-drop
- Updates object positions in 3D space
- Returns: `raycasterRef`, `mouseRef`, `selectedObjectRef`, `isDraggingRef`

**`useViewModel.ts`**

- Manages view mode state (normal, wireframe, grayscale, etc.)
- Applies material changes based on view mode
- Handles shader creation for grayscale mode
- Returns: `viewMode`, `setViewMode`

### UI Components

**`ViewModeToolbar.tsx`**

- Displays view mode buttons
- Highlights active mode
- Icons from lucide-react

**`ModelSelector.tsx`**

- Shows list of generated models in sidebar
- Displays thumbnails and part types
- Color-coded by part type (exhaust, seat, frame, etc.)
- Delete button per model

**`LoadingOverlay.tsx`**

- Displays loading spinner
- Shown during model loading

**`EmptyState.tsx`**

- Shows message when no models exist
- Guides user to upload and generate models

### Utilities

**`materials.ts`**

- `createGrayscaleShader()`: Fetches and creates grayscale shader
- `getPartTypeStyle()`: Returns color styles for part types

**`sceneHelpers.ts`**

- `centerAndScaleModel()`: Centers and scales model to fit viewport
- `enableShadows()`: Enables shadow casting/receiving
- `storeOriginalMaterials()`: Saves original materials for restoration

### Types

**`types.ts`**

- `ModelOption`: Model data structure
- `Model3DViewerProps`: Component props
- `LightingSettings`: Lighting configuration
- `ViewMode`: View mode types
- `EditMode`: Edit mode types

## 🚀 Usage

```tsx
import { Model3DViewer, ModelOption } from "@/three/3d-viewer";

const models: ModelOption[] = [
  {
    id: "1",
    name: "Bike Model 1",
    url: "/models/bike1.glb",
    thumbnail: "/thumbnails/bike1.png",
    partType: "full-bike",
  },
];

function MyComponent() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <Model3DViewer
      modelOptions={models}
      selectedModelId={selectedId}
      onModelSelect={setSelectedId}
      onModelDelete={(id) => console.log("Delete", id)}
      autoRotate={true}
    />
  );
}
```

## ✨ Benefits of Modular Structure

1. **Separation of Concerns**: UI, logic, and utilities are separated
2. **Reusability**: Hooks can be used in other Three.js components
3. **Testability**: Each piece can be tested independently
4. **Maintainability**: Easier to find and modify specific functionality
5. **Readability**: Smaller, focused files
6. **Scalability**: Easy to add new features or view modes

## 🔧 Extending the System

### Adding a New View Mode

1. Update `ViewMode` type in `types.ts`
2. Add button in `ViewModeToolbar.tsx`
3. Add case in `useViewModel.ts` `applyViewMode()` function

### Adding a New Hook

1. Create hook file in `hooks/` directory
2. Import and use in `3d-viewer.tsx`
3. Follow existing hook patterns for consistency

### Adding a New UI Component

1. Create component file in `components/` directory
2. Import types from `../types`
3. Import utilities from `../utils/` as needed
4. Add to `3d-viewer.tsx` layout

## 📝 Notes

- The original 600+ line monolithic component is now ~90 lines
- All TypeScript types are properly defined
- Components follow React best practices
- Hooks handle cleanup properly
- UI components are self-contained and reusable
