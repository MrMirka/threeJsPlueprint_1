const glow_fragment_shader = `
varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vLayer0;
        varying vec3 vLayer1;
        varying vec3 vLayer2;
        varying vec3 vNormal;
        varying vec3 eyeVector;
        uniform samplerCube uPerelin;
        uniform float time;
        uniform float progress;
        uniform vec4 resolution;
        float PI = 3.1415926535897932384626433832795;

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
        
        float supersun() {
            float sum = 0.;
            sum += textureCube(uPerelin, vLayer0).r;
            sum += textureCube(uPerelin, vLayer1).r;
            sum += textureCube(uPerelin, vLayer2).r;
            sum*=0.33;
            return sum;
        }

        float Fresnel(vec3 eyeVector, vec3 worldNormal) {
            return pow(1.0 + dot(eyeVector, worldNormal), 3.0);
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