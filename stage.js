import * as THREE from './lib/three/build/three.module.js'
import { OrbitControls } from './lib/three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from './lib/three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from './lib/three/examples/jsm/loaders/DRACOLoader.js'
import { RGBELoader } from './lib/three/examples/jsm/loaders/RGBELoader.js'
import Stats  from './lib/three/examples/jsm/libs/stats.module.js'
import * as dat from './lib/dat.gui.module.js'


let scene, camera, renderer, orbitControl, model, stats, gui
let clock = new THREE.Clock()
let loader, barMesh, loaderCircleOut, loaderCircleIn
let loadingManager
let matLogo,  matCircleOut, matCircleIn

class Stage{
    constructor(parameters) {
        this.parameters = parameters
    }

    /**
     * LoadingManager
     */
    initLoadingManager(){
        loadingManager = new THREE.LoadingManager(()=>{
            scene.add(model)
            window.setTimeout(() => {   
                let logo, circle
               scene.children.forEach(item=>{
                if(item.name == 'circle_loader'){
                   circle = item
                }else if (item.name == 'logo_loader'){
                    logo = item
                }
               })
               //Hide loader
               gsap.to(matLogo, {duration: 1, opacity: 0, onComplete: () => {
                   scene.remove(logo)
               }})
               gsap.to(matCircleOut, {duration: 1, opacity: 0, onComplete: () => {
                    scene.remove(circle)
               }})
               gsap.to(matCircleIn, {duration: 1, opacity: 0})

               //Release model
               gsap.to(model.scale, { duration: 1, delay: 0.3, x: 1, y:1, z: 1, onStart: ()=> {
                 updateAllmaterial()
               } })
            }, 3000);
        })
    }

    initScene(){
            scene  = new THREE.Scene()
            camera = new THREE.PerspectiveCamera(this.parameters.camera.fov, this.parameters.canvas.width / this.parameters.canvas.height, 1, 100 )
            camera.position.z = 6
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
            if(this.parameters.utils.gui) {
                gui = new dat.GUI()
            }
            

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
        const dracoLoader = new DRACOLoader(loadingManager)
        dracoLoader.setDecoderPath('./lib/draco/')
        const gltfLoader = new GLTFLoader(loadingManager)
        gltfLoader.setDRACOLoader(dracoLoader)
        gltfLoader.load(url, gltf => {
            model = gltf.scene.children[0]
            model.name = 'GLTF'
            model.scale.set(0)
            camera.position.z = 6
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

    /**
     * Loaders
     */

    //Bar
    initBarLoader(){
        const logo = new THREE.TextureLoader().load('./textures/loader/dota.png')
        logo.encoding = THREE.sRGBEncoding
        const geo = new THREE.PlaneGeometry(3,3,1,1)
        const mat = new THREE.MeshBasicMaterial({
            map: logo,
            transparent: true,
            side:THREE.DoubleSide
        })
        loader = new THREE.Mesh(geo, mat)
        loader.scale.set(0.5, 0.5, 0.5)
        scene.add(loader)

        //BAR
         const barGeo = new THREE.BoxGeometry(0.25,0.02, 0.0001)
        const barMat = new THREE.MeshBasicMaterial({color: 0x81583D})

        const barGeoBack = new THREE.BoxGeometry(2.55,0.02, 0.0001)
        const barMatBack = new THREE.MeshBasicMaterial({
            color: 0x81583D,
            transparent: true,
            opacity: 0.3
        })

        barMesh = new THREE.Mesh(barGeo, barMat)
        const barMeshBack = new THREE.Mesh(barGeoBack, barMatBack)
        barMesh.position.y = - 0.56
        barMeshBack.position.y = - 0.562
        barMeshBack.position.z =  -0.02
        scene.add(barMesh, barMeshBack) 
        
    }

    //Circle
    initCircleLoader(){
        const logo = new THREE.TextureLoader(loadingManager).load('./textures/loader/dota_text.png')
        logo.encoding = THREE.sRGBEncoding
        const geo = new THREE.PlaneGeometry(3,3,1,1)
        matLogo = new THREE.MeshStandardMaterial({
            map: logo,
            transparent: true,
            side:THREE.DoubleSide,
            metalness: 1,
            roughness: 0.6,
            envMapIntensity: 0.01
        })
        loader = new THREE.Mesh(geo, matLogo)
        loader.name = 'logo_loader'
        const scaleFactor ={value: 0.5}
        loader.scale.set(scaleFactor.value, scaleFactor.value, scaleFactor.value)

        /**
         * Debug
         */
        if(gui!=undefined) {
            const folder = gui.addFolder('Loader')
            folder.add(scaleFactor, 'value').min(0).max(2).step(0.002).name('LogoSize').onChange(()=>{
                loader.scale.set(scaleFactor.value, scaleFactor.value, scaleFactor.value )
            })
        }
         
        scene.add(loader)

        const circleTexture1 = new THREE.TextureLoader(loadingManager).load('./textures/loader/circle_1.png')
        const circleTexture2 = new THREE.TextureLoader(loadingManager).load('./textures/loader/circle_2.png')
        circleTexture1.encoding = THREE.sRGBEncoding
        circleTexture2.encoding = THREE.sRGBEncoding
        const circleGeo = new THREE.PlaneGeometry(1,1)
        matCircleOut = new THREE.MeshBasicMaterial({
            map: circleTexture1,
            transparent: true,
            side: THREE.DoubleSide,
            opacity: 0.3
        })
        matCircleIn = new THREE.MeshBasicMaterial({
            map: circleTexture2,
            transparent: true,
            side: THREE.DoubleSide
        })

        loaderCircleOut = new THREE.Mesh(circleGeo, matCircleOut)
        loaderCircleIn = new THREE.Mesh(circleGeo, matCircleIn)
        const circleLoaders = new THREE.Group()
        circleLoaders.name = 'circle_loader'
        circleLoaders.add(loaderCircleOut, loaderCircleIn)
        circleLoaders.scale.set(2.8,2.8,2.8)
        scene.add(circleLoaders)
    }
}

function tick(){

    const elapsedTime = clock.getElapsedTime()
    const deltaTime = clock.getDelta()
   
    //Circle loader
    if(loaderCircleOut!=undefined && loaderCircleIn!=undefined) {
        loaderCircleOut.rotation.z -= 0.015 + deltaTime 
        loaderCircleIn.rotation.z -= 0.04 + deltaTime 
    }

    if(loader!=undefined) {
        loader.rotation.y = Math.sin(elapsedTime * 2) * Math.PI / 9
    }

    if(orbitControl!=undefined){
        orbitControl.update()
    }
    if(stats!=undefined) {
        stats.update()
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
    if(gui!=undefined && param.ui) {
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

    if(gui!=undefined && param.ui) {
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
    targetObject.position.z = 0.46
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
    if(gui!=undefined && param.ui){
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
        if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial && child.name == 'GLTF'){
            child.material.envMapIntensity = 0.15
            child.material.needsUpdate = true
            child.material.castShadow = true
            child.material.receiveShadow = true
            child.material.metalness = 1
            child.material.roughness = 0.1
            child.receiveShadow = true
            child.castShadow = true
            child.material.shadowSide = THREE.DoubleSide

            if(gui!=undefined){
                let modelParam = gui.addFolder('Model')
                modelParam.add(child.material, 'envMapIntensity').min(0).max(1).step(0.001).name('HDRI-intencity')
             }
        }
    })
}    

/**
 * Update parameters light
 */
const updateSpotLight = () => {
    scene.traverse(child => {
        if (child instanceof THREE.SpotLightHelper){
            child.update()
        }
    })
}


export {Stage}