out vec3 interpolatedNormal;
attribute vec4 skinIndex;
attribute vec4 skinWeight;

uniform mat4 bones[12];

void main(){
    interpolatedNormal = normal;
    
	vec4 normalizedSkinWeight = normalize(skinWeight);
    mat4 computedPosition = normalizedSkinWeight.r * bones[int(skinIndex.r)] + 
                            normalizedSkinWeight.g * bones[int(skinIndex.g)] + 
                            normalizedSkinWeight.b * bones[int(skinIndex.b)] + 
                            normalizedSkinWeight.a * bones[int(skinIndex.a)];
	gl_Position = projectionMatrix * modelViewMatrix * computedPosition * vec4(position,1.0);
}