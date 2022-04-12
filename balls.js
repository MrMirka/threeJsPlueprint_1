//MyShaders
import {perelin_vertex_shader} from './lib/shaders/perelin_v.js'
import {perelin_fragment_shader} from './lib/shaders/perelin_s.js'
import {sun_vertex_shader} from './lib/shaders/sun_v.js'
import {sun_fragment_shader} from './lib/shaders/sun_f.js'
import {glow_vertex_shader} from './lib/shaders/glow_v.js'
import {glow_fragment_shader} from './lib/shaders/glow_f.js'
import { CompressedTextureLoader } from './lib/three/build/three.module.js'

let clock, mat, colorMat, glowMat, geoGlow

let ball1, ball2, ball3

class TheBALLS {
    constructor(THREE,  block, perelinScene){
        this.perelinScene = perelinScene
        this.block = block
        this.T = THREE
    }

    init(){
        clock = new this.T.Clock()
        ball1 = new this.T.Group()
        ball2 = new this.T.Group()
        ball3 = new this.T.Group()
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
    let mesh2 = new T.Mesh(geo, colorMat)
    let mesh3 = new T.Mesh(geo, colorMat)
    mesh.position.set(0,0.7,0)
    mesh2.position.set(-0.8,-0.5,0)
    mesh3.position.set(0.8,-0.5,0)

    ball1.name = 'ball1'
    ball2.name = 'ball2'
    ball3.name = 'ball3'
    
    ball1.add(mesh)
    ball2.add(mesh2)
    ball3.add(mesh3)

    group.add(ball1, ball2, ball3)
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
    geoGlow.rotation.x -=  0.2

    let geoGlow2 = new T.Mesh(geo, glowMat)
    let geoGlow3 = new T.Mesh(geo, glowMat)

    geoGlow.position.set(0,0.75,0)
    geoGlow2.position.set(-0.835,-0.62,0)
    geoGlow3.position.set(0.833,-0.62,0)

   ball1.add(geoGlow)
   ball2.add(geoGlow2)
   ball3.add(geoGlow3)
}
export {TheBALLS}

