#version 300 es
precision mediump float;
uniform vec4 uColor;
in vec3 vColor;

#ifdef DISCARD_OUTSIDE
    in vec2 vUnitPos;
#endif

out vec4 fragColor;

void main(void) {

#ifdef DISCARD_OUTSIDE
    //discard outside the map volume
    vec2 absUnitPos = abs(vUnitPos);
    if (max(absUnitPos.x, absUnitPos.y)>1.){
        discard;
    }
#endif

    fragColor = vec4(vColor,1.)*uColor;
}