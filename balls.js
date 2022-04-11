//MyShaders
import {perelin_vertex_shader} from './lib/shaders/perelin_v.js'
import {perelin_fragment_shader} from './lib/shaders/perelin_s.js'
import {sun_vertex_shader} from './lib/shaders/sun_v.js'
import {sun_fragment_shader} from './lib/shaders/sun_f.js'
import {glow_vertex_shader} from './lib/shaders/glow_v.js'
import {glow_fragment_shader} from './lib/shaders/glow_f.js'

let clock, mat, colorMat, glowMat, geoGlow
console.log(glow_vertex_shader)

class TheBALLS {
    constructor(THREE,  block, perelinScene){
        this.perelinScene = perelinScene
        this.block = block
        this.T = THREE
    }

    init(){
        clock = new this.T.Clock()
        addPerelinBall(this.T, this.perelinScene)
        addColorBall(this.T, this.block)
        addGlowBall(this.T, this.block)
    }

    setElapsedTime(){
        time = clock.getElapsedTime()
    }

    getPerelinMat(){
        return mat
    }

    getColorMat(){
        return colorMat
    }

    getGlowMat(){
        return glowMat
    }

    getGlowPosition(){
        return geoGlow
    }
}

//Perelin block
function addPerelinBall(T, group){
    const geo = new T.SphereGeometry(0.4, 30, 30)
    mat = new T.ShaderMaterial({
        side: T.DoubleSide,
        vertexShader: perelin_vertex_shader,
        fragmentShader: perelin_fragment_shader,
        uniforms: {
            time: { value: 0 },
            mouseX: {value: 0},
            mouseY: {value: 0},
        }
    })
    const mesh = new T.Mesh(geo, mat)
    group.add(mesh)
}

//Color Ball
function addColorBall(T, group){
    const geo = new T.SphereGeometry(0.45, 30, 30)
    colorMat = new T.ShaderMaterial({
        side: T.DoubleSide,
        vertexShader: sun_vertex_shader,
        fragmentShader: sun_fragment_shader,
        uniforms: {
            time: { value: 0 },
            uPerelin: { value: null },
            mouseX: {value: 0},
            mouseY: {value: 0},
        }
    })
    const mesh = new T.Mesh(geo, colorMat)
    group.add(mesh)
}

//Glow Ball
function addGlowBall(T, group){
    const geo = new T.SphereGeometry(0.75, 30, 30)
    glowMat = new T.ShaderMaterial({
        side: T.BackSide,
        transparent: true,
        vertexShader: glow_vertex_shader,
        fragmentShader: glow_fragment_shader,
        uniforms: {
            time: { value: 0 },
            glow1: { value: 0.581 },
            glow2: { value: 0.69 },
            glow3: { value: 1.015 },
            smooth1: { value: 0.668 },
            smooth2: { value: 0.581 },
        }
    })
    geoGlow = new T.Mesh(geo, glowMat)
    geoGlow.rotation.y = Math.PI * 0.2
    geoGlow.rotation.x -=  0.2

    group.add(geoGlow)
}
export {TheBALLS}

