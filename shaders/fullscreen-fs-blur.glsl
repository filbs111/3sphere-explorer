precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec2 uInvSize;

void main(void) {

    vec4 mid = texture2D(uSampler, vTextureCoord);
    vec4 NW = texture2D(uSampler, vTextureCoord + uInvSize*vec2(-1.0,-1.0));
    vec4 NE = texture2D(uSampler, vTextureCoord + uInvSize*vec2(1.0,-1.0));
    vec4 SW = texture2D(uSampler, vTextureCoord + uInvSize*vec2(-1.0,1.0));
    vec4 SE = texture2D(uSampler, vTextureCoord + uInvSize*vec2(1.0,1.0));
    
    vec4 avg = 0.2*(mid + NW + NE + SW + SE);
    avg.a=1.0;
    gl_FragColor = avg;
}