#version 300 es
#define M_PI 3.141593

#ifdef FOUR_VEC_VERTS
    in vec4 aVertexPosition;
#else
    in vec3 aVertexPosition;
#endif

#ifdef VERTCOLORS
    in vec3 aVertexColor;
    out vec3 vColor;
#endif
uniform mat4 uMVMatrix;
uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform vec3 uModelScale;
uniform vec2 uObjCentreAngleCoords;
uniform vec2 uObjCentreRelativeToCameraAngleCoords;
uniform float uBendFactor;
uniform float uTetrahedronism;

float wrapToMinusPiToPi(float inputAngle){
    return (mod((inputAngle/M_PI) + 1.0, 2.0) - 1.0)*M_PI;   //note could just divide whole thing by PI, reduce distance viewing map from to 
        //compensate for map being smaller.
}

vec2 pos4ToMapAngles(vec4 fourVecPos){
    vec2 uvAng = vec2(atan(fourVecPos.x,fourVecPos.y), atan(fourVecPos.z,fourVecPos.w));
    vec2 uvAngRelativeToObjectCentre = uvAng- uObjCentreAngleCoords;
    return vec2(wrapToMinusPiToPi(uvAngRelativeToObjectCentre.x), wrapToMinusPiToPi(uvAngRelativeToObjectCentre.y))
     + uObjCentreRelativeToCameraAngleCoords;
}

vec3 convertToFatTetrahedron(vec2 mapAngles, vec4 fourVecPos){
    vec4 squaredPos = fourVecPos*fourVecPos;
    float lenxy = sqrt( squaredPos.x+squaredPos.y);
	float lenzw = sqrt( squaredPos.z+squaredPos.w);
    vec2 tetrahedronMulitplier = mix(vec2(.707), vec2(lenxy, lenzw),uTetrahedronism);
	float xOut = mapAngles.x* tetrahedronMulitplier.x;     //would rather use mapAngles.u,v for clarity, but "illegal vector field selection"!!
    float yOut = mapAngles.y* tetrahedronMulitplier.y;
	float zOut = atan( lenzw, lenxy);

    //retain some pringle curvature to reduce map distortion, make more readable.
    // perhaps circular curvature is better, but to first order, parabolic/cubic should be equivalent
    // perhaps can do better by different curvatures for different z. 

	float multiplier1 = uBendFactor*uBendFactor*0.5;
	float multiplier2 = uBendFactor*multiplier1*0.3333;	//could be about right amount would like terrain dots evenly spaced on map. would like corners to be 90deg
			//guess cos ~ 1 - (1/2)*(bx)^2. sin ~ x + (1/6)(bx)^3 	
    float bend = multiplier1*(xOut*xOut - yOut*yOut);
	return vec3(xOut,yOut,zOut) + bend*vec3(-multiplier2*xOut, multiplier2*yOut, 1.);
}

void main(void) {
#ifdef FOUR_VEC_VERTS
    vec4 transformedCoordWorld = uMMatrix * aVertexPosition;
#else
    vec4 vertexPositionFourvec = (vec4(uModelScale*aVertexPosition, 1.0));
    vec4 transformedCoordWorld = uMMatrix * normalize(vertexPositionFourvec);
#endif
    //translate this into map angle, subtract the map centre position (usually player position) and move by steps of 2*PI so within +/-PI
    vec2 vertexMapAnglesCentred = pos4ToMapAngles(transformedCoordWorld);

    //transform from cube to fat tetrahedron
    vec3 vertexPositionInFatTetrahedron = convertToFatTetrahedron(vertexMapAnglesCentred, transformedCoordWorld);

    //transform map in frame of output camera
    vec4 transformedCoord = uMVMatrix * vec4(vertexPositionInFatTetrahedron, 1.0);
    gl_Position = uPMatrix * transformedCoord;

    #ifdef VERTCOLORS
        vColor=aVertexColor;
    #endif
}