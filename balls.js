//MyShaders
import {perelin_vertex_shader} from './lib/shaders/perelin_v.js'
import {perelin_fragment_shader} from './lib/shaders/perelin_s.js'
import {sun_vertex_shader} from './lib/shaders/sun_v.js'
import {sun_fragment_shader} from './lib/shaders/sun_f.js'

let clock, time, mat

class TheBALLS {
    constructor(THREE,  block, perelinScene, cubeRenderTarget){
        this.perelinScene = perelinScene
        this.block = block
        this.T = THREE
        this.cubeRenderTarget = cubeRenderTarget
    }

    init(){
        clock = new this.T.Clock()
        addPerelinBall(this.T, this.perelinScene)
        console.log(this.cubeRenderTarget)
    }

    setElapsedTime(){
        time = clock.getElapsedTime()
    }

    getPerelinMat(){
        return mat
    }
}

//Perelin block
function addPerelinBall(T, group){
    const geo = new T.SphereGeometry(1, 30, 30)
    mat = new T.ShaderMaterial({
        side: T.DoubleSide,
        vertexShader: perelin_vertex_shader,
        fragmentShader: perelin_fragment_shader,
        uniforms: {
            time: { value: 0 },
        }
    })
    const mesh = new T.Mesh(geo, mat)
    group.add(mesh)
}
export {TheBALLS}