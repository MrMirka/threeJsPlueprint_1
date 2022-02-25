import * as THREE from './lib/three/build/three.module.js'
import { OrbitControls } from './lib/three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from './lib/three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from './lib/three/examples/jsm/loaders/DRACOLoader.js'
import { RGBELoader } from './lib/three/examples/jsm/loaders/RGBELoader.js'
import Stats  from './lib/three/examples/jsm/libs/stats.module.js'
import * as dat from './lib/dat.gui.module.js'

let scene, camera, renderer, orbitControl, model, stats, gui

class Stage{
    constructor(parameters) {
        this.parameters = parameters
    }

    initScene(){
            scene  = new THREE.Scene()
            camera = new THREE.PerspectiveCamera(this.parameters.camera.fov, this.parameters.canvas.width / this.parameters.canvas.height, 1, 100 )
            scene.add(camera)

            /**
             * Render
             */
            renderer = new THREE.WebGLRenderer({
                canvas: this.parameters.canvas.canvas,
                antialias: true,
                alpha: false
            })
            renderer.setSize(this.parameters.canvas.width, this.parameters.canvas.height)
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
            renderer.shadowMap.enabled = true
            renderer.physicallyCorrectLights = true
            renderer.outputEncoding = THREE.sRGBEncoding
            renderer.shadowMap.type = THREE.PCFSoftShadowMap
            renderer.toneMapping = THREE.ACESFilmicToneMapping
            renderer.toneMappingExposure = 1
            renderer.logarithmicDepthBuffer = true

            renderer.render(scene, camera)

            //Ui
            gui = new dat.GUI()

            //Add test geometry
            if(this.parameters.utils.testGeometry) {
                addTestGeometry()
            }

            //AddOrbit
            if(this.parameters.utils.orbitControl) {
                addOrbit()
            }

            //Add axeshelper
            if(this.parameters.utils.axesHelper) {
                addAxesHelper()
            }


            //Grid
           if(this.parameters.utils.grid){
               addGrid()
           }

           /**
            * Ambient
            */
           if(this.parameters.light.ambient) {
                addAmbient()
           }

           /**
            * Environment
            */
           if(this.parameters.light.environment.status) {
               addEnvironment(this.parameters.light.environment)
           }

           /**
            * FPS
            */
           if(this.parameters.utils.fps) {
               addFPS()
           }

        }


    /**
     * Init animation
     */
    initAnim(){
        tick()
    }

    /**
     * Add GLTF to scene
     */
    addGLTF(url) {
        const dracoLoader = new DRACOLoader()
        dracoLoader.setDecoderPath('./lib/draco/')
        const gltfLoader = new GLTFLoader()
        gltfLoader.setDRACOLoader(dracoLoader)
        gltfLoader.load(url, gltf => {
            model = gltf.scene
            scene.add(model)
            camera.position.z = 6
            updateAllmaterial()
        })
    }

    /**
     * Light source
     */
    initLights(lights) {
        let items = lights.items
        if (items) {
            items.forEach(element => {
                switch (element.type) {
                    case 'pL':
                        addPointLight(element)
                        break
                      
                    case 'dL':
                        addDirectionLight(element)
                        break    

                    case 'sL':
                        addSpotLight(element)
                        break
                }
            });
        }
    }
}

function tick(){
    if(orbitControl!=undefined){
        orbitControl.update()
    }
    if(stats!=undefined) {
        stats.update()
    }
    if(model){
       // model.rotation.y += 0.01
    }
    renderer.render(scene, camera)
    requestAnimationFrame(tick)
}
/**
 * Test geometry
 */
function addTestGeometry(){
    const geo = new THREE.SphereGeometry(1, 32,16)
    const mat = new THREE.MeshBasicMaterial({color: 0xff0000})
    const mesh = new THREE.Mesh(geo, mat)
    scene.add(mesh)
    camera.position.z = 3

    renderer.render(scene, camera)
}

  /**
     * OrbitControl
     */
function addOrbit(){
    orbitControl = new OrbitControls(camera, renderer.domElement)
}

/**
 * Axis helper
 */
function addAxesHelper(){
    const axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );
}

/**
 * Grid
 */
function addGrid(){
    const size = 10;
    const divisions = 10;

    const gridHelper = new THREE.GridHelper( size, divisions )
    scene.add( gridHelper )
}

/**
 * Ambient
 */
function addAmbient(){
    const light = new THREE.AmbientLight( 0x404040 ) 
    scene.add( light )
}

/**
 * Envoronment
 */
function addEnvironment(parameters){
    const rgbloader = new RGBELoader()
    rgbloader.load(parameters.url, texture => {
    texture.encoding = THREE.sRGBEncoding
    texture.mapping = THREE.EquirectangularRefractionMapping
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapP = THREE.RepeatWrapping
    texture.repeat.set( 1, 1 )
    scene.environment = texture
    if(parameters.background) {
        scene.background = texture
    }
 })
}

/**
 * FPS
 */
function addFPS(){
    stats = new Stats();
    document.body.appendChild( stats.dom )
}

/**
 * PointLight
 */
function addPointLight(param) {
    const color = {color: param.color}
    const light = new THREE.PointLight(  )
    light.intensity = param.intensity
    light.distance = param.distance
    light.decay = param.decay
    light.color.set(color.color)
    light.position.set(
        param.position.x,
        param.position.y,
        param.position.z
    )
    if(param.shadow){
        light.castShadow = true
        light.shadow.normalBias = 0.05
    }
    scene.add( light );
    if(param.helper) {
        addHelper(param.type, light, param.color)
         }
    if(param.ui) {
        const folder = gui.addFolder(param.name)
        folder.add(light.position,'x').min(-10).max(10).step(0.01).name('position X')
        folder.add(light.position,'y').min(-10).max(10).step(0.01).name('position Y')
        folder.add(light.position,'z').min(-10).max(10).step(0.01).name('position Z')
        folder.add(light,'intensity').min(0).max(300).step(0.001).name('intensity')
        folder.add(light,'distance').min(0).max(10).step(0.001).name('distance')
        folder.add(light,'decay').min(0).max(10).step(0.001).name('decay')
        folder.addColor(color, 'color').onChange(()=>{
            light.color.set(color.color)
        })
    }     
    }

/**
 * Direction light
 * */
function addDirectionLight(param){
    const color = {color: param.color}
    const directionalLight = new THREE.DirectionalLight()
    directionalLight.color.set(color.color)
    directionalLight.intensity = param.intensity
    directionalLight.position.set(
        param.position.x,
        param.position.y,
        param.position.z
    )
    if(param.shadow){
        directionalLight.castShadow = true
        directionalLight.shadow.normalBias = 0.05
    }
    directionalLight.lookAt(0,0,0)
    scene.add( directionalLight )
    if(param.helper){
        addHelper(param.type, directionalLight, param.color)
    }

    if(param.ui) {
        const folder = gui.addFolder(param.name)
        folder.add(directionalLight.position,'x').min(-10).max(10).step(0.01).name('position X').onChange(()=>{directionalLight.lookAt(0,0,0)})
        folder.add(directionalLight.position,'y').min(-10).max(10).step(0.01).name('position Y').onChange(()=>{directionalLight.lookAt(0,0,0)})
        folder.add(directionalLight.position,'z').min(-10).max(10).step(0.01).name('position Z').onChange(()=>{directionalLight.lookAt(0,0,0)})
        folder.add(directionalLight, 'intensity').min(0).max(300).step(0.02).name('intensity')
        folder.addColor(color, 'color').onChange(()=>{
            directionalLight.color.set(color.color)
        })
    }
}

/**
 * Spot light
 */
function addSpotLight(param){
    const color = {color: param.color}
    const spotLight = new THREE.SpotLight()
    spotLight.intensity = param.intensity
    spotLight.distance = param.distance
    spotLight.angle = param.angle
    spotLight.decay = param.decay
    spotLight.penumbra = param.penumbra
    spotLight.position.set(
        param.position.x,
        param.position.y,
        param.position.z
    )
    spotLight.name = param.name

    const targetGeo = new THREE.SphereGeometry(0.05, 15,15)
    const targetMat = new THREE.MeshBasicMaterial({color: 'yellow'})
    targetMat.transparent = true
    targetMat.opacity = 0
    const targetObject = new THREE.Mesh(targetGeo, targetMat)
    scene.add(targetObject)

    spotLight.target = targetObject
    if(param.shadow){
        spotLight.castShadow = true
        spotLight.shadow.normalBias = 0.05
    }
    scene.add(spotLight)
    if(param.helper) {
        targetMat.transparent = true
        targetMat.opacity = 1
        addHelper(param.type, spotLight, param.color)
    }
    if(param.ui){
        const folder = gui.addFolder(param.name)
        folder.add(spotLight.position,'x').min(-10).max(10).step(0.01).name('position X').onChange(()=>{updateSpotLight()})
        folder.add(spotLight.position,'y').min(-10).max(10).step(0.01).name('position Y').onChange(()=>{updateSpotLight()})
        folder.add(spotLight.position,'z').min(-10).max(10).step(0.01).name('position Z').onChange(()=>{updateSpotLight()})

        folder.add(targetObject.position,'x').min(-10).max(10).step(0.01).name('target X').onChange(()=>{updateSpotLight()})
        folder.add(targetObject.position,'y').min(-10).max(10).step(0.01).name('target Y').onChange(()=>{updateSpotLight()})
        folder.add(targetObject.position,'z').min(-10).max(10).step(0.01).name('target Z').onChange(()=>{updateSpotLight()})

        folder.add(spotLight, 'intensity').min(0).max(300).step(0.01).name('intensity')
        folder.add(spotLight, 'distance').min(0).max(30).step(0.01).name('distance')
        folder.add(spotLight, 'decay').min(0).max(30).step(0.01).name('decay')
        folder.add(spotLight, 'angle').min(0).max(Math.PI / 2).step(0.01).name('angle').onChange(()=>{updateSpotLight()})
        folder.add(spotLight, 'penumbra').min(0).max(1).step(0.001).name('penumbra').onChange(()=>{updateSpotLight()})
        folder.addColor(color, 'color').onChange(()=>{
            spotLight.color.set(color.color)
        })
    }
}
    


/**
 * Helpers
 */  
function addHelper(type, ligth, color){
    switch(type) {
        case 'pL':
            const sphereSize = 0.4
            const pointLightHelper = new THREE.PointLightHelper( ligth, sphereSize, color )
            scene.add( pointLightHelper )
            break
    
        case 'dL':
            const directionLighthelper = new THREE.DirectionalLightHelper( ligth, 2 );
            scene.add( directionLighthelper );
            break

        case 'sL':
            const spotLightHelper = new THREE.SpotLightHelper( ligth );
            scene.add( spotLightHelper );    
        }
    }
/**
 * Update AllMaterial
 */
 const updateAllmaterial = () => {
    scene.traverse(child => {
        if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial){
            child.material.envMapIntensity = 0.05
            child.material.needsUpdate = true
            child.material.castShadow = true
            child.material.receiveShadow = true
            child.material.metalness = 1
            child.material.roughness = 0.1
            child.receiveShadow = true
            child.castShadow = true
            child.material.shadowSide = THREE.DoubleSide

            //UI
            const modelParam = gui.addFolder('Model')
            modelParam.add(child.material, 'envMapIntensity').min(0).max(1).step(0.001).name('HDRI-intencity')
        }
        
    })
}    

const updateSpotLight = () => {
    scene.traverse(child => {
        if (child instanceof THREE.SpotLightHelper){
            child.update()
        }
    })
}





export {Stage}