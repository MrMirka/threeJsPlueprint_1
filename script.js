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
        name: 'PointLigth 1',
        position: { x:-2.19, y:1.8, z:-3.7 },
        intensity: 44,
        distance: 10,
        decay:0.486,
        shadow: false,
        color: 0xe84343,
        helper: false,
        ui: false
    },
   
    {
        type: 'pL',
        name: 'PointLigth 2',
        position: { x:2, y:2.44, z:-3.51 },
        intensity: 24,
        distance: 6,
        decay:1,
        shadow: false,
        color: 0x88b96f,
        helper: false,
        ui: false
    },
    {
        type: 'pL',
        name: 'PointLigth 3',
        position: { x:0.02, y:-1.09, z:1.12 },
        intensity: 11.27,
        distance: 3,
        decay:0.927,
        shadow: false,
        color: 0xed8a1c,
        helper: false,
        ui: false
    },
     {
        type: 'sL',
        name: 'Spot Light1',
        position: {x:-3.29, y:1.34, z :8.84},
        target:{x: -0.87, y: 0, z: 1.56},
        intensity: 55,
        shadow: true,
        color: 0xffffff,
        decay: 1.13,
        distance: 0,
        angle: 0.46,
        penumbra: 0.754,
        helper: false,
        ui: false
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
stage.initPostprocess()