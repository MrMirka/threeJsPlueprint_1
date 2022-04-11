import * as THREE from './lib/three/build/three.module.js'
import { OrbitControls } from './lib/three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from './lib/three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from './lib/three/examples/jsm/loaders/DRACOLoader.js'
import { RGBELoader } from './lib/three/examples/jsm/loaders/RGBELoader.js'
import Stats  from './lib/three/examples/jsm/libs/stats.module.js'
import * as dat from './lib/dat.gui.module.js'

//Postprocessing
import { EffectComposer } from './lib/three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from './lib/three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from './lib/three/examples/jsm/postprocessing/ShaderPass.js'
import { ClearPass } from './lib/three/examples/jsm/postprocessing/ClearPass.js'
import { CopyShader } from './lib/three/examples/jsm/shaders/CopyShader.js'
import { UnrealBloomPass } from './lib/three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { FilmPass } from './lib/three/examples/jsm/postprocessing/FilmPass.js'

import { TheBALLS } from './balls.js'


let scene, perelinScene, camera, renderer, orbitControl, model, stats, gui, mixer, compose, particleG1, particleG2
let clock = new THREE.Clock()
let loader, barMesh, loaderCircleOut, loaderCircleIn
let loadingManager
let matLogo,  matCircleOut, matCircleIn

let cubeRenderTarget, cubeCamera

let cameraRig = new THREE.Group()

let fireBall1 = new THREE.Group()
let fireBall2 = new THREE.Group()

let perelinGroup = new THREE.Group()

let ballsBlock = new THREE.Group()

let geo, points
let count = 0

let BB

const colorInside = new THREE.Color('#ff0000')
const colorOutside = new THREE.Color('#00ff00')

let particleAlpha = new THREE.TextureLoader().load('./textures/noise/particle_alpha.jpg')

//Compose param
let isCompose = false
 const bloom = {
     exposure:0.1,
     bloomStrength: 0.9,
     bloomThreshold: 0.01,
     bloomRadius: 1.9
 }

//Mouse coordinate
let mouseXY = new THREE.Vector2(0,0)


class Stage{
    constructor(parameters) {
        this.parameters = parameters
    }

    /**
     * LoadingManager
     */
    initLoadingManager(){
        loadingManager = new THREE.LoadingManager(()=>{  
            cameraRig.add(model)
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

               //Releaze model
               scene.add(ballsBlock)
               gsap.to(model.scale, { duration: 1, delay: 0.3, x: 350, y:350, z: 350, onStart: ()=> {
                 updateAllmaterial()
                 
               } }) 
            }, 3000);
        })
    }

    /**
     * Scene
     */
    initScene(){
            scene  = new THREE.Scene()
            perelinScene  = new THREE.Scene()
            perelinScene.add(perelinGroup)
            scene.add(cameraRig)
            camera = new THREE.PerspectiveCamera(this.parameters.camera.fov, this.parameters.canvas.width / this.parameters.canvas.height, 1, 100 )
            
            camera.position.z =6
            ballsBlock.add(fireBall1)
            //ballsBlock.add(fireBall2)

            

            /**
             * Cube camera
             */
             cubeRenderTarget = new THREE.WebGLCubeRenderTarget(
                256,{
                    format: THREE.RGBFormat,
                    generateMipmaps: true,
                    minFilter: THREE.LinearMipMapLinearFilter,
                    encoding: THREE.sRGBEncoding
                }
            )
            cubeCamera = new THREE.CubeCamera(0.1, 10, cubeRenderTarget)
            BB = new TheBALLS(THREE, fireBall1, perelinGroup)
            BB.init()

            

            /**
             * Render
             */
            renderer = new THREE.WebGLRenderer({
                canvas: this.parameters.canvas.canvas,
                antialias: true,
                alpha: true
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
            renderer.autoClear = false
            renderer.render(scene, camera)
            

            /**
             * Resize screen
             */
            window.addEventListener('resize', ()=>{
                // Update sizes
                this.parameters.canvas.width = window.innerWidth
                this.parameters.canvas.height = window.innerHeight
            
                // Update camera
                camera.aspect = this.parameters.canvas.width /  this.parameters.canvas.height
                camera.updateProjectionMatrix()
            
                // Update renderer
                renderer.setSize(this.parameters.canvas.width,  this.parameters.canvas.height)
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
            })

            //Ui
            if(this.parameters.utils.gui) {
                gui = new dat.GUI()
            }

            //Glow parameter
            /* let glowP = {
                glow1: 0.581,
                glow2:0.69,
                glow3:1.015,
                smooth1:0.668,
                smooth2:0.776,
            }
            gui.add(glowP, 'glow1').min(0).max(2).step(0.001).onChange(v=>{
                BB.getGlowMat().uniforms.glow1.value = v
            })

            gui.add(glowP, 'glow2').min(0).max(2).step(0.001).onChange(v=>{
                BB.getGlowMat().uniforms.glow2.value = v
            })

            gui.add(glowP, 'glow3').min(0).max(2).step(0.001).onChange(v=>{
                BB.getGlowMat().uniforms.glow3.value = v
            }) 

            gui.add(glowP, 'smooth1').min(0).max(2).step(0.001).onChange(v=>{
                BB.getGlowMat().uniforms.smooth1.value = v
            }) 
            gui.add(glowP, 'smooth2').min(0).max(2).step(0.001).onChange(v=>{
                BB.getGlowMat().uniforms.smooth2.value = v
            })   */

            let pp = BB.getGlowPosition();
            gui.add(pp.rotation, 'y').min(0).max(Math.PI * 2).step(0.0003).name("GlowRotation")
            

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
     * Postpoces
     */
    initPostprocess(){
        
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

       // fireBall1.position.x = 1.5
        //fireBall2.position.x = -1.5
        fireBall1.position.z = 2

        gui.add(fireBall1.position, 'z').min(-5).max(5).step(0.001).name('BALL_Z')
        gui.add(fireBall1.position, 'y').min(-5).max(5).step(0.001).name('BALL_Y')

        fireBall1.rotation.y -= Math.PI * 0.2
        //fireBall2.position.z = 1.5
        

        particleG1 = new THREE.Group()
        scene.add(particleG1)
        particleG1.position.copy(fireBall1.position)

        particleG2 = new THREE.Group()
       // scene.add(particleG2)
       // particleG2.position.copy(fireBall2.position)


        generateParticles(0.55, 0.05, 8, particleG1)
        generateParticles(0.58, 0.04, 9, particleG1)
        generateParticles(0.61, 0.02, 11, particleG1)
        generateParticles(0.63, 0.07, 7, particleG1)

        generateParticles(0.55, 0.05, 8, particleG2)
        generateParticles(0.58, 0.04, 9, particleG2)
        generateParticles(0.61, 0.02, 11, particleG2)
        generateParticles(0.63, 0.07, 7, particleG2)

        const dracoLoader = new DRACOLoader(loadingManager)
        dracoLoader.setDecoderPath('./lib/draco/')
        const gltfLoader = new GLTFLoader(loadingManager)
        //gltfLoader.setDRACOLoader(dracoLoader)
        gltfLoader.load(url, gltf => {
            model = gltf.scene
            model.name = 'GLTF'
            model.scale.set(0)
            model.position.y = -6
            camera.position.z = 6

            //Animate RIG
            const animations = gltf.animations
            console.log(animations)
            mixer = new THREE.AnimationMixer( model )
            mixer.clipAction(animations[0]).play()
            scene.add(model)
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
        matLogo = new THREE.MeshBasicMaterial({
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
       // if(gui!=undefined) {
        //    const folder = gui.addFolder('Loader')
         //   folder.add(scaleFactor, 'value').min(0).max(2).step(0.002).name('LogoSize').onChange(()=>{
         //       loader.scale.set(scaleFactor.value, scaleFactor.value, scaleFactor.value )
         //   })
      //  }
         
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

    /**
     * Mouse listener
     */
    initMouseListener(){
        window.addEventListener('mousemove', event => {
            let x = ( event.clientX - this.parameters.canvas.width / 2 ) * 0.0004
            let y = ( event.clientY - this.parameters.canvas.height / 2 ) * 0.0004
            mouseXY.set(x,y)
        })
    }
}

function tick(){
    const deltaTime = clock.getDelta()



   count += 0.1
    if(mixer!=undefined) {
		mixer.update( deltaTime );
	}

    //Circle loader
    if(loaderCircleOut!=undefined && loaderCircleIn!=undefined) {
        loaderCircleOut.rotation.z -= 0.015 + deltaTime 
        loaderCircleIn.rotation.z -= 0.04 + deltaTime 
    }

    if(loader!=undefined) {
        loader.rotation.y = Math.sin(count * 0.20) * Math.PI / 9
    }

    if(orbitControl!=undefined){
        orbitControl.update()
    }
    if(stats!=undefined) {
        stats.update()
    }

    perelinGroup.position.copy(fireBall1.position)

    if(cubeCamera!= undefined){
        cubeCamera.update(renderer, perelinScene)
    } 

    BB.getPerelinMat().uniforms.time.value = count
    BB.getColorMat().uniforms.time.value = count

    if(cubeRenderTarget!= undefined){
        BB.getColorMat().uniforms.uPerelin.value = cubeRenderTarget.texture
    }
    

    //Models
    if(model!=undefined){
       // cameraRig.rotation.x += ( mouseXY.y * 0.07 - cameraRig.rotation.x * 0.4 ) * 0.3
	   // cameraRig.rotation.y += ( mouseXY.x  * 0.15 - cameraRig.rotation.y * 0.3 ) * 0.5

        ballsBlock.rotation.copy(cameraRig.rotation)
        fireBall1.position.y = Math.sin(count * 0.23 ) * 0.09 - 0.7
       // fireBall2.position.y = Math.sin(count * 0.3  ) * 0.1 - 0.3

        particleG1.position.y = Math.sin(count * 0.23 ) * 0.09 - 0.7
       // particleG2.position.y = Math.sin(count * 0.3  ) * 0.1 - 0.3

        particleG1.rotation.copy(cameraRig.rotation)
       // particleG2.rotation.copy(cameraRig.rotation)
    }

    
    

    if(isCompose){
        compose.render()
    }else{
        renderer.render(scene, camera)
    }
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
    targetObject.position.x = param.target.x
    targetObject.position.y = param.target.y
    targetObject.position.z = param.target.z
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

        folder.add(spotLight, 'intensity').min(0).max(3000).step(0.01).name('intensity')
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
        
        if(child.name == 'GLTF'){
            child.traverse(item => {
               
                if(item instanceof THREE.Mesh && item.material instanceof THREE.MeshStandardMaterial){
                    item.material.envMapIntensity = 0.01
                    item.material.needsUpdate = true
                    item.material.castShadow = true
                    item.material.receiveShadow = true
                    item.material.metalness = 0
                    //item.material.roughness = 0.1
                    item.receiveShadow = true
                    item.castShadow = true
                    item.material.shadowSide = THREE.DoubleSide
                }
            })
            
            
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


/**
 * Particles fireball orbit
 */
 const generateParticles = (radius, particleSize, speed, group) => {
    geo = new THREE.SphereBufferGeometry(radius, 2, 1)
    const colors = new Float32Array(geo.attributes.position.array)

    for(let i = 0; i < geo.attributes.position.array.length; i++){
        const i3 = i * 3
            const mixedColor = colorInside.clone()
            mixedColor.lerp(colorOutside, 0.5)
            
            colors[i3    ] = mixedColor.r * Math.random()
            colors[i3 + 1] = mixedColor.g * Math.random()
            colors[i3 + 2] = mixedColor.b * Math.random()
    }

    const material = new THREE.PointsMaterial({
        size: particleSize,
        sizeAttenuation: true,
        depthWrite: true,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        transparent: true,
        alphaMap: particleAlpha
    })
    
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    points = new THREE.Points(geo, material)
    points.rotation.x = Math.random() * Math.PI
    points.rotation.z = Math.random() * Math.PI
    points.eulerOrder = 'ZYX';
    gsap.to(points.rotation, {duration: speed, x: Math.PI * 2, repeat: -1, ease: 'none'})
    gsap.to(points.rotation, {duration: speed * 1.8, y: Math.PI * 2, repeat: -1, ease: 'none'})
    group.add(points)
 }

export {Stage}