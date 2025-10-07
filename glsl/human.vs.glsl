out vec3 interpolatedNormal;
attribute vec4 skinIndex;
attribute vec4 skinWeight;

uniform mat4 bones[12];

void main(){
    interpolatedNormal = normal;
	
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}