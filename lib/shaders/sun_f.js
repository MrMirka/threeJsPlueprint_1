const sun_fragment_shader = `
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

    uniform float mouseX;
    uniform float mouseY;


    vec3 brightnessToColor(float b) {
        b *=0.25;
        return (vec3(b,b*b,b*b*b*b)/0.25) * 0.8;
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
 
    brightness += pow(fres, 0.9) * 2.4;

    vec3 color = brightnessToColor(brightness);
    gl_FragColor = vec4(color, 1.0);
    }
`
export {sun_fragment_shader}