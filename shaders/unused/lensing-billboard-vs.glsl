uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform vec4 uDropLightPos;	//not used as a light, but position is coincident

attribute vec4 aVertexCentrePosition;	//instanced attribute
attribute vec2 aVertexPosition;			//offset position

//todo make larger and fade with distance to avoid resolution problems (or make larger generally and use mipmapped blob texture)
//todo tile towards camera or scale so appears correctly in rectilinear projection (sphere off axis should appear as ellipse)

void main(void) {
    vec4 transformedCoord = uMVMatrix * aVertexCentrePosition;
    
    //various ways can displace, this is fairly simple:
    vec4 differenceVec = transformedCoord - uDropLightPos;
    //float perturbRad = 0.001
    float differenceSq = dot(differenceVec,differenceVec) + 0.000001;	//small + to avoid /0
    transformedCoord = normalize( transformedCoord + 0.00001*differenceVec/differenceSq );
    
    gl_Position = uPMatrix * ( transformedCoord + vec4(aVertexPosition, vec2(0.)));
}
// version where pushed away from input position for aerodynamic effect. currently subtle/pointless