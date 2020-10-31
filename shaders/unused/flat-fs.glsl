precision mediump float;
uniform vec4 uColor;
varying float fog;
uniform vec4 uFogColor;
varying vec3 veclight;

void main(void) {
    gl_FragColor = vec4( fog*( veclight + uFogColor.xyz ), 1.0)*uColor + (1.0-fog)*uFogColor;
    //gl_FragColor = vec4(1.,0.,0.,1.);
    //gl_FragColor = uColor;
    gl_FragColor.a =1.0;
}