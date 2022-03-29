import {Stage} from './stage.js'

const canvas = document.querySelector('canvas.webgl')


const parameters = {
    utils: {
        orbitControl: false,
        testGeometry: false,
        axesHelper: false,
        grid: false,
        fps: true,
        gui: true
    },
    light: {
        ambient: false,
        environment: {
            status: false,
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
        intensity: 0,
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
        intensity: 0,
        shadow: true,
        color: 0x0000ff,
        helper: false,
        ui: false
    },
    {
        type: 'sL',
        name: 'Spot Light1',
        position: {x:1, y:2, z :1},
        intensity: 44,
        shadow: true,
        color: 0x00FF00,
        decay: 1.46,
        distance: 0,
        angle: 0.46,
        penumbra: 0.754,
        helper: true,
        ui: true
    }
    ]
}

const stage = new Stage(parameters)

stage.initScene()
stage.initLoadingManager()
stage.initAnim()
stage.initCircleLoader()
stage.addGLTF('./models/invoker/character.gltf')
stage.initLights(lights)
stage.initMouseListener()
//stage.initPostprocess()