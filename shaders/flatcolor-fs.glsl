#version 300 es
precision mediump float;
uniform vec4 uColor;
out vec4 fragColor;

#ifdef DISCARD_OUTSIDE
    in vec2 vUnitPos;
#endif

void main(void) {

#ifdef DISCARD_OUTSIDE
    //discard outside the map volume
    vec2 absUnitPos = abs(vUnitPos);
    if (max(absUnitPos.x, absUnitPos.y)>1.){
        discard;
    }
#endif

    fragColor = uColor;
}