attribute vec3 aVertexPosition;
attribute vec2 aVertexGradient;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
varying vec2 vPos;
varying vec2 vGrad;
varying vec2 vTexBlend;

varying vec4 vDebugColor;

varying vec2 vZW;	//for custom depth

void main(void) {
	// vec4 transformedCoord = uMVMatrix * vec4(aVertexPosition*0.5,1.0);	//todo use 4x3 mat?
		//^^3d version from terrainTest. 
		
	// vec3 uModelScale = vec3(5.0);	//TODO pass in? maybe pointless for terrain
 	// vec4 aVertexPositionNormalized = normalize(vec4(uModelScale*aVertexPosition, 1.0));

//mapping to duocylinder surface
//TODO pretransform vertices (and guarantee no seam on wraparound)
// x = cosCylRadius * Math.sin(ang1));
// y = cosCylRadius * Math.cos(ang1));
	
// z = sinCylRadius * Math.sin(ang2));
// w = sinCylRadius * Math.cos(ang2));

	vec3 scaledPosition = 2.0*3.141593*aVertexPosition;

	float cylRad =  3.141593/4.0 + scaledPosition.z;
	float cosR = cos(cylRad);
	float sinR = sin(cylRad);
	vec4 aVertexPositionNormalized = normalize(vec4(cosR*sin(scaledPosition.x), cosR*cos(scaledPosition.x), sinR*sin(scaledPosition.y), sinR*cos(scaledPosition.y)));

    vec4 transformedCoord = uMVMatrix * aVertexPositionNormalized;

	gl_Position = uPMatrix * transformedCoord;	
	vPos = aVertexPosition.xy;
	vGrad = 1024.0*aVertexGradient;	//should be muiltiplied by grid squares per unit.
	float amountTexB = smoothstep (-0.01, 0.01, aVertexPosition.z);
	vTexBlend = vec2(1.0-amountTexB, amountTexB);

	vDebugColor = vec4(1.0 + 0.0*amountTexB);	//add 0*something to prevent what i suspect is compiler playing silly buggers
	//and stripping out varying.

	vZW = vec2(.5*transformedCoord.w, transformedCoord.z-1.);
}