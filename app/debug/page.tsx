"use client";

import { Model3DViewer } from "@/components/three";
import { ModelOption } from "@/components/three/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, RotateCcw } from "lucide-react";
import { useState } from "react";

export default function DebugPage() {
    const [generatedModels, setGeneratedModels] = useState<ModelOption[]>([]);
    const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

    const handleReset = () => {
        setGeneratedModels([]);
        setSelectedModelId(null);
    };

    const loadSampleModel = () => {
        const sampleModels = [
            { name: "Duck", url: "/models/1.glb" }, // public 폴더에 파일이 있어야 함
        ];

        const sample = sampleModels[Math.floor(Math.random() * sampleModels.length)];
        const newModel: ModelOption = {
            id: `sample-${Date.now()}`,
            name: `🎯 ${sample.name} (Sample)`,
            url: sample.url,
            partType: "sample",
        };

        setGeneratedModels((prev) => [...prev, newModel]);
        setSelectedModelId(newModel.id);
    };

    const loadLocalModel = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const localUrl = URL.createObjectURL(file);
        const newModel: ModelOption = {
          id: `local-${Date.now()}`,
          name: `📁 ${file.name}`,
          url: localUrl,
          partType: "local",
        };
    
        setGeneratedModels((prev) => [...prev, newModel]);
        setSelectedModelId(newModel.id);
    };
    
    return (
        <div>
        <h1 className="text-xl mb-2">Debug Page</h1>
        <div className="flex gap-2 mb-2">
            <label
                style={{
                padding: "8px 16px",
                backgroundColor: "#4a90d9",
                color: "white",
                cursor: "pointer",
                }}
            >
                📁 Load Model File
                <Input
                onChange={loadLocalModel}
                type="file"
                accept=".glb"
                className="hidden"
                id="local-model-input"
                />
            </label>
            <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
            </Button>
            <Button onClick={loadSampleModel}>
                Load Sample Model
            </Button>
        </div>
        <Card className="p-6 bg-[#111] border-gray-800">
        <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
            3D Model Viewer
            {generatedModels.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({generatedModels.length} models)
                </span>
            )}
            </h3>
        </div>

        {generatedModels.length > 0 ? (
            <Model3DViewer
            modelOptions={generatedModels}
            selectedModelId={selectedModelId}
            onModelSelect={setSelectedModelId}
            showControls={true}
            autoRotate={false}
            className="h-[600px] border border-gray-700 rounded-lg"
            />
        ) : (
            <div className="flex items-center justify-center h-[600px] border-2 border-dashed border-gray-700 rounded-lg text-gray-500">
            <p>Load a model using the debug panel above ☝️</p>
            </div>
        )}
        </Card>
        </div>
    );
}