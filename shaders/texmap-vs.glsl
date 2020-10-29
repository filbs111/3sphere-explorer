attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;
varying vec3 vTextureCoord;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform vec4 uDropLightPos;	//position in camera frame ( 0,0,0,1 if light at camera )
varying float fog;
uniform vec3 uModelScale;
varying vec3 veclight;

void main(void) {
    vec4 aVertexPositionNormalized = normalize(vec4(uModelScale*aVertexPosition, 1.0));
    vec4 transformedCoord = uMVMatrix * aVertexPositionNormalized;
    
    gl_Position = uPMatrix * transformedCoord;

    vec4 transformedNormal = uMVMatrix * vec4(aVertexNormal,0.0);
    vec4 adjustedPos = transformedCoord - uDropLightPos;
    float light = -dot( normalize(adjustedPos), transformedNormal);
    light = max(light,0.0);	//unnecessary if camera pos = light pos
    //falloff
    light/=0.1 + 5.0*dot(adjustedPos,adjustedPos);	//1st num some const to ensure light doesn't go inf at short dist
                                                //guess maybe similar to some gaussian light source
    
    veclight=vec3(light);
    
    fog = 0.5*(1.0 + transformedCoord.w);
    
    float myZ = aVertexPositionNormalized.w;
    vTextureCoord = vec3( aTextureCoord.st*myZ, myZ );
}