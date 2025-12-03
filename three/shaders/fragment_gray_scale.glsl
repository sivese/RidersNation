uniform float ambientIntensity;
uniform float directionalIntensity;
uniform vec3 lightDirection;
varying vec3 vNormal;

void main() {
vec3 normal = normalize(vNormal);
vec3 lightDir = normalize(lightDirection);
float ambient = ambientIntensity;
float diff = max(dot(normal, lightDir), 0.0);
float diffuse = diff * directionalIntensity;
float brightness = clamp(ambient + diffuse, 0.0, 1.0);
vec3 gray = vec3(brightness * 0.7);
gl_FragColor = vec4(gray, 1.0);
}