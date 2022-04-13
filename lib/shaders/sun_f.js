const sun_fragment_shader = `
    
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

    uniform float mouseX;
    uniform float mouseY;

    uniform int colorIndex;
    uniform float fresnel;


    vec3 brightnessToColor(float b) {
        b *=0.25;
        if(colorIndex == 0) {
            return (vec3(b,b*b,b*b*b*b)/0.25) * 0.8;
        }
        if(colorIndex == 1) {
            return (vec3(b*b*b*b,b*b,b * 0.62)/0.25) * 0.8;
        }
        if(colorIndex == 2) {
            return (vec3(b*b*0.85,b*b*b*b,b*b)/0.25) * 0.8;
        }

        
    }

    float supersun() {
        float sum = 0.;
        sum += textureCube(uPerelin, vLayer0).r ;
        sum += textureCube(uPerelin, vLayer1).r ;
        sum += textureCube(uPerelin, vLayer2).r ;
        sum*=0.27;
        return sum;
    }

    float Fresnel(vec3 eyeVector, vec3 worldNormal) {
        return pow(1.0 + dot(eyeVector, worldNormal), 3.0);
    }

    void main(){
    float brightness = supersun();
    brightness = brightness * 4. + 1.;
    
    float fres = Fresnel(eyeVector, vNormal);
 
    brightness += pow(fres, 0.9) * fresnel;

    vec3 color = brightnessToColor(brightness);
    gl_FragColor = vec4(color, 1.0);
    }
`
export {sun_fragment_shader}