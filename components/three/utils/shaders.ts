export const loadGrayscaleShader = async () => {
  return {
    vertexShader: await fetch('/shaders/vertex_gray_scale.glsl').then(r => r.text()),
    fragmentShader: await fetch('/shaders/fragment_gray_scale.glsl').then(r => r.text()),
  };
};