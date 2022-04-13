const glow_fragment_shader = `
varying vec2 vUv;
        varying vec3 vPosition;

        uniform float glow1;
        uniform float glow2;
        uniform float glow3;
        uniform float smooth1;
        uniform float smooth2;

        uniform int colorIndex;

        
        vec3 brightnessToColor(float b) {
            b *=0.25;
            if(colorIndex == 0) {
                return (vec3(b,b*b,b*b*b*b)/0.25) * 0.8;
            }
            if(colorIndex == 1) {
                return (vec3(b*b*b*b,b*b,b*0.62)/0.25) * 0.8;
            }
            if(colorIndex == 2) {
                return (vec3(b*b,b*b*b*b,b*b)/0.25) * 0.8;
            }
            
        }
        

    
        void main(){ 
        float radial = glow2 - vPosition.z;    
        radial*=radial * radial * glow1;

        float brightness = 1. + radial;

        gl_FragColor.rgb = brightnessToColor(brightness) * radial;
        
       if(gl_FragColor.a < smooth2) {
         gl_FragColor.a = smoothstep(gl_FragColor.a, smooth2, -vPosition.z * radial);
       }
    }
`
export {glow_fragment_shader}