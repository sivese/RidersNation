import * as THREE from "three";

export const createGrayscaleShader = async () => {
  return {
    vertexShader: await fetch("/shaders/vertex_gray_scale.glsl").then((r) =>
      r.text()
    ),
    fragmentShader: await fetch("/shaders/fragment_gray_scale.glsl").then((r) =>
      r.text()
    ),
  };
};

// 파트 타입별 색상
export const getPartTypeStyle = (partType?: string) => {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    exhaust: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      border: "border-blue-500",
    },
    seat: {
      bg: "bg-green-100",
      text: "text-green-700",
      border: "border-green-500",
    },
    frame: {
      bg: "bg-purple-100",
      text: "text-purple-700",
      border: "border-purple-500",
    },
    "full-bike": {
      bg: "bg-orange-100",
      text: "text-orange-700",
      border: "border-orange-500",
    },
  };
  return (
    styles[partType || ""] || {
      bg: "bg-gray-100",
      text: "text-gray-700",
      border: "border-gray-500",
    }
  );
};
