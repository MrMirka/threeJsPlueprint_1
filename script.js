import { TetrahedronGeometry } from './lib/three/build/three.module.js'
import {Stage} from './stage.js'

const canvas = document.querySelector('canvas.webgl')

const parameters = {
    utils: {
        orbitControl: true,
        testGeometry: false,
        axesHelper: true,
        grid: true,
        fps: true
    },
    light: {
        ambient: false,
        environment: {
            status: true,
            background: false,
            url: './textures/environment/colosseum_1k.pic'
        }
    },
    canvas : {
        width: window.innerWidth,
        height: window.innerHeight,
        canvas: canvas
    },
    camera: {
        fov: 45
    }
}

const lights = {
    items: [ {
        type: 'pL',
        name: 'PointLigth One',
        position: { x:0, y:2, z:0 },
        intensity: 110,
        distance: 0,
        decay:1,
        shadow: true,
        color: 0xff0000,
        helper: true,
        ui: true
    },
   
    {
        type: 'dL',
        name: 'PointLigth Three',
        position: { x:0, y:2, z:0 },
        intensity: 110,
        shadow: true,
        color: 0x0000ff,
        helper: true,
        ui: true
    },
    {
        type: 'sL',
        name: 'Spot Light1',
        position: {x:1, y:2, z :1},
        intensity: 110,
        shadow: true,
        color: 0x00FF00,
        decay: 1,
        distance: 0,
        angle: Math.PI / 6,
        penumbra: 0,
        helper: true,
        ui: true
    }
    ]
}

const stage = new Stage(parameters)

stage.initScene()
stage.initAnim()
stage.addGLTF('./models/default.gltf')
//stage.initLights(lights)