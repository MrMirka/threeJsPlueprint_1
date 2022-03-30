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
import { UnrealBloomPass } from './lib/three/examples/jsm/postprocessing/UnrealBloomPass.js'


let scene, camera, renderer, orbitControl, model, stats, gui, mixer, compose
let clock = new THREE.Clock()
let loader, barMesh, loaderCircleOut, loaderCircleIn
let loadingManager
let matLogo,  matCircleOut, matCircleIn
let cameraRig = new THREE.Group()
let orbOne, orbTwo, orb1, orb4, orb5, orbThree, orbMat, orbMat1, orbMat2, orbMat3, orbMat4, orbMat5
let noiseStep = 0.1

let fireBall1 = new THREE.Group()
let fireBall2 = new THREE.Group()

//Compose param
let isCompose = false
 const bloom = {
     exposure:0.1,
     bloomStrength: 0.9,
     bloomThreshold: 0.01,
     bloomRadius: 6
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
            scene.add(cameraRig)
            camera = new THREE.PerspectiveCamera(this.parameters.camera.fov, this.parameters.canvas.width / this.parameters.canvas.height, 1, 100 )
            
            cameraRig.add(camera)
            camera.position.z = 6
            scene.add(camera)
            
            scene.add(fireBall1)
            scene.add(fireBall2)

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
        compose = new EffectComposer(renderer)
        compose.addPass( new RenderPass( scene, camera ) )
        
        //Bloom
        const bloomPass = new UnrealBloomPass(
                 new THREE.Vector2(this.parameters.canvas.width, this.parameters.canvas.height),
                 1.5,
                 0.4,
                 0.85
            )
        bloomPass.threshold = bloom.bloomThreshold
        bloomPass.strength = bloom.bloomStrength
        bloomPass.radius = bloom.bloomRadius 
        
        compose.addPass(bloomPass)
        isCompose = true
        gui.add(bloom, 'bloomThreshold').min(0).max(1).step(0.003).onChange(value => {
            bloomPass.threshold = value
        })
        gui.add(bloom, 'bloomStrength').min(0).max(3).step(0.003).onChange(value => {
            bloomPass.strength = value
        })
        gui.add(bloom, 'bloomRadius').min(0).max(20).step(0.003).onChange(value => {
            bloomPass.radius = value
        })
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

        //GetOrbTexture
        let noise = new THREE.TextureLoader(loadingManager).load('./textures/noise/noise.jpg')
        noise.mapping = THREE.EquirectangularRefractionMapping
        noise.wrapS = THREE.RepeatWrapping
        noise.wrapT = THREE.RepeatWrapping
        noise.repeat.set( 1, 1 )

        let noise2 = new THREE.TextureLoader(loadingManager).load('./textures/noise/noise.jpg')
        noise2.mapping = THREE.EquirectangularRefractionMapping
        noise2.wrapS = THREE.RepeatWrapping
        noise2.wrapT = THREE.RepeatWrapping
        noise2.rotation = Math.PI * 0.2
        noise2.repeat.set( 1, 1 )
      

        let noise_env = new THREE.TextureLoader(loadingManager).load('./textures/noise/noise_env.jpg')
        noise_env.mapping = THREE.EquirectangularRefractionMapping
        noise_env.wrapS = THREE.RepeatWrapping
        noise_env.wrapT = THREE.RepeatWrapping
        noise_env.repeat.set( 1, 1 )

        let cloud = new THREE.TextureLoader(loadingManager).load('./textures/noise/cloud.jpg')
        cloud.mapping = THREE.EquirectangularRefractionMapping
        cloud.wrapS = THREE.RepeatWrapping
        cloud.wrapT = THREE.RepeatWrapping
        cloud.repeat.set( 3, 3 )

        let star = new THREE.TextureLoader(loadingManager).load('./textures/noise/star.jpg')
        star.mapping = THREE.EquirectangularRefractionMapping
        star.wrapS = THREE.RepeatWrapping
        star.wrapT = THREE.RepeatWrapping
        star.repeat.set( 3, 3 )

        //Fireball1
        const fireB1 = [{
            scale: 0.997,
            type: 1,
            color: 0x0000ff,
            alpha: cloud,
            speed: 150
        },
        {
            scale: 0.998,
            type: 1,
            color: 0xffffff,
            alpha: star,
            speed: 132
        },
        {
            scale: 0.999,
            type: 1,
            color: 0x0DE133,
            alpha: noise2,
            speed: 132
        },
        {
            scale: 1,
            type: 1,
            color: 0xff0000,
            alpha: noise,
            speed: 88
        },
        {
            scale: 1.01,
            type: 1,
            color: 0xffffff,
            alpha: noise_env,
            speed: 67
        }
        ]
        makeOrderdBall(fireB1, fireBall1)
        fireBall1.position.x = 2
        
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
    if(mixer!=undefined) {
		mixer.update( deltaTime );
	}

    if(orbMat1!=undefined){
        noiseStep += 0.01
        //orbMat.uniforms[ 'time' ].value = noiseStep
        

        orbMat1.alphaMap.rotation +=0.002
        orbMat2.alphaMap.rotation +=0.002            
        orbMat3.alphaMap.rotation +=0.0005
        orbMat4.alphaMap.rotation +=0.0003
        orbMat5.alphaMap.rotation +=0.0002
       
        
    }
    
   
    //Circle loader
    if(loaderCircleOut!=undefined && loaderCircleIn!=undefined) {
        loaderCircleOut.rotation.z -= 0.015 + deltaTime 
        loaderCircleIn.rotation.z -= 0.04 + deltaTime 
    }

    if(loader!=undefined) {
        loader.rotation.y = Math.sin(deltaTime * 20) * Math.PI / 9
    }

    if(orbitControl!=undefined){
        orbitControl.update()
    }
    if(stats!=undefined) {
        stats.update()
    }

    //Models
    if(model!=undefined){
        cameraRig.rotation.x += ( mouseXY.y * 0.3 - cameraRig.rotation.x * 0.4 ) * 0.3
	    cameraRig.rotation.y += ( mouseXY.x  * 0.5 - cameraRig.rotation.y * 0.3 ) * 0.5
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
                    
    
                   /*  if(gui!=undefined){
                        let modelParam = gui.addFolder('Model')
                        modelParam.add(item.material, 'envMapIntensity').min(0).max(1).step(0.001).name('HDRI-intencity')
                    } */
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
 * Orbs light effect
 */
const initOrbs = () => {
    const sphereGeo = new THREE.SphereBufferGeometry(0.5, 16, 32)
    orbMat = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: noiseStep } 
        },
        vertexShader:`
                varying vec2 vUv;

                void main()
                {
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                
                    vUv = uv;
                }
            `,
            fragmentShader: `

                 #define PI 3.1415926535897932384626433832795

                 varying vec2 vUv;
                 uniform float time;
                 float random(vec2 st)
                    {
                        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                    }

                vec2 rotate(vec2 uv, float rotation, vec2 mid)
                    {
                        return vec2(
                        cos(rotation) * (uv.x - mid.x) + sin(rotation) * (uv.y - mid.y) + mid.x,
                        cos(rotation) * (uv.y - mid.y) - sin(rotation) * (uv.x - mid.x) + mid.y
                        );
                    }

                    vec4 permute(vec4 x)
                    {
                        return mod(((x*34.0)+1.0)*x, 289.0);
                    }
                    
                    vec2 fade(vec2 t)
                    {
                        return t*t*t*(t*(t*6.0-15.0)+10.0);
                    }
                    
                    //Noise 1
                    float cnoise(vec2 P, float time)
                    {
                        vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
                        vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
                        Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
                        vec4 ix = Pi.xzxz;
                        vec4 iy = Pi.yyww;
                        vec4 fx = Pf.xzxz;
                        vec4 fy = Pf.yyww;
                        vec4 i = permute(permute(ix) + iy);
                        vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
                        vec4 gy = abs(gx) - 0.5;
                        vec4 tx = floor(gx + 0.5);
                        gx = gx - tx;
                        vec2 g00 = vec2(gx.x,gy.x);
                        vec2 g10 = vec2(gx.y,gy.y);
                        vec2 g01 = vec2(gx.z,gy.z);
                        vec2 g11 = vec2(gx.w,gy.w);
                        vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
                        g00 *= norm.x;
                        g01 *= norm.y;
                        g10 *= norm.z;
                        g11 *= norm.w;
                        float n00 = dot(g00, vec2(fx.x, fy.x));
                        float n10 = dot(g10, vec2(fx.y, fy.y));
                        float n01 = dot(g01, vec2(fx.z, fy.z));
                        float n11 = dot(g11, vec2(fx.w, fy.w));
                        vec2 fade_xy = fade(Pf.xy);
                        vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
                        float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
                        return 2.3 * n_xy ;
                    }

                    //Noise 2
                    // Some useful functions
                    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                    vec3 permute_l(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

                    float snoise(vec2 v, float time) {

                        // Precompute values for skewed triangular grid
                        const vec4 C = vec4(0.211324865405187,
                                            // (3.0-sqrt(3.0))/6.0
                                            0.366025403784439,
                                            // 0.5*(sqrt(3.0)-1.0)
                                            -0.577350269189626,
                                            // -1.0 + 2.0 * C.x
                                            0.024390243902439);
                                            // 1.0 / 41.0
                    
                        // First corner (x0)
                        vec2 i  = floor(v + dot(v, C.yy));
                        vec2 x0 = v - i + dot(i, C.xx);
                    
                        // Other two corners (x1, x2)
                        vec2 i1 = vec2(0.0);
                        i1 = (x0.x > x0.y)? vec2(1.0, 0.0):vec2(0.0, 1.0);
                        vec2 x1 = x0.xy + C.xx - i1;
                        vec2 x2 = x0.xy + C.zz;
                    
                        // Do some permutations to avoid
                        // truncation effects in permutation
                        i = mod289(i);
                        vec3 p = permute_l(
                                permute_l( i.y + vec3(0.0, i1.y, 1.0))
                                    + i.x + vec3(0.0, i1.x, 1.0 ));
                    
                        vec3 m = max(0.5 - vec3(
                                            dot(x0,x0),
                                            dot(x1,x1),
                                            dot(x2,x2)
                                            ), 0.0);
                    
                        m = m*m ;
                        m = m*m ;
                    
                        // Gradients:
                        //  41 pts uniformly over a line, mapped onto a diamond
                        //  The ring size 17*17 = 289 is close to a multiple
                        //      of 41 (41*7 = 287)
                    
                        vec3 x = 2.0 * fract(p * C.www) - 1.0;
                        vec3 h = abs(x) - 0.5;
                        vec3 ox = floor(x + 0.5);
                        vec3 a0 = x - ox;
                    
                        // Normalise gradients implicitly by scaling m
                        // Approximation of: m *= inversesqrt(a0*a0 + h*h);
                        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0+h*h);
                    
                        // Compute final noise value at P
                        vec3 g = vec3(0.0);
                        g.x  = a0.x  * x0.x  + h.x  * x0.y;
                        g.yz = a0.yz * vec2(x1.x,x2.x) + h.yz * vec2(x1.y,x2.y);
                        return 130.0 * dot(m, g);
                    }




                 void main(){

                    float strength = smoothstep(0.8, sin(cnoise(vUv * 13.0 + time * 3.2, time) * 12.2), 0.71 );

                    float strength2 = smoothstep(1.2, sin(cnoise(vUv * 3.0 + time * 1.5, time) * 3.3), 0.2);

                    float strength3 = smoothstep(0.3, sin(snoise(vUv * 4.0 + time * 1.1, time) * 0.26), 0.2);
                    

                    // Final color
                    vec3 blackColor = vec3(0.0);

                    vec3 uvColor = vec3(vUv.x * sin(time), 0.1, vUv.y * atan(vUv.y) );
                    vec3 uvColor2 = vec3(vUv.x * atan(time * vUv.y ) * 7.0 , vUv.y * atan(time), 0.1);
                    vec3 uvColor3 = vec3(vUv.y * atan(time * vUv.x ) * 1.5 , vUv.x * atan(time * 0.2), 0.3);
                   
                    
                    vec3 mixedColor = mix( blackColor, uvColor, strength );
                    vec3 mixedColor2 = mix( blackColor, uvColor2, strength2 );
                    vec3 mixedColor3 = mix( blackColor, uvColor3 , strength3 );

                    vec3 mixC = mix( mixedColor, mixedColor2, strength2 );
                    vec3 mixC2 = mix( mixC, mixedColor3, strength3 );

                    vec3 mixFinal = mixC2 ;

                    gl_FragColor = vec4(mixFinal, 1.0);
                 }
            `
    })
    orbOne = new THREE.Mesh(sphereGeo, orbMat)
    orbOne.position.x = -2
    //orbOne.scale.set(0.4, 0.4, 0.4)
    scene.add(orbOne)
}

const initOrbs1 = () => {
    const sphereGeo = new THREE.SphereBufferGeometry(0.5, 16, 32)
    let noise = new THREE.TextureLoader().load('./textures/noise/noise_env.jpg')
    noise.mapping = THREE.EquirectangularRefractionMapping;
    noise.wrapS = THREE.RepeatWrapping;
    noise.wrapT = THREE.RepeatWrapping;
    noise.repeat.set( 1, 1 );

    orbMat1 = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        alphaMap: noise

    })
    orb1 = new THREE.Mesh(sphereGeo, orbMat1)
    orb1.position.x = 2
    orb1.scale.set(1.01, 1.01, 1.01)
    scene.add(orb1)
}

const initOrbs2 = () => {
    const sphereGeo = new THREE.SphereBufferGeometry(0.5, 16, 32)
    let noise = new THREE.TextureLoader().load('./textures/noise/noise.jpg') 
    noise.mapping = THREE.EquirectangularRefractionMapping;
    noise.wrapS = THREE.RepeatWrapping;
    noise.wrapT = THREE.RepeatWrapping;
    noise.repeat.set( 1, 1 );

    orbMat2 = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        transparent: true,
        alphaMap: noise,
        metalness: 0,
        roughness: 1
    })
    orbTwo = new THREE.Mesh(sphereGeo, orbMat2)
    orbTwo.position.x = 2
    scene.add(orbTwo)
}

const initOrbs3 = () => {
    const sphereGeo = new THREE.SphereBufferGeometry(0.5, 16, 32)
    let noise = new THREE.TextureLoader().load('./textures/noise/noise.jpg')
    noise.mapping = THREE.EquirectangularRefractionMapping;
    noise.wrapS = THREE.RepeatWrapping;
    noise.wrapT = THREE.RepeatWrapping;
    noise.repeat.set( 1.5, 1.5 );
    noise.rotation = Math.PI * 0.2
    orbMat3 = new THREE.MeshBasicMaterial({
        color: 0x0DE133,
        transparent: true,
        alphaMap: noise
       
    })
    orbThree = new THREE.Mesh(sphereGeo, orbMat3)
    orbThree.position.x = 2
    orbThree.scale.set(0.999, 0.999, 0.999)
    scene.add(orbThree)
}

const initOrbs4 = () => {
    const sphereGeo = new THREE.SphereBufferGeometry(0.5, 16, 32)
    let noise = new THREE.TextureLoader().load('./textures/noise/star.jpg')
    noise.mapping = THREE.EquirectangularRefractionMapping;
    noise.wrapS = THREE.RepeatWrapping;
    noise.wrapT = THREE.RepeatWrapping;
    noise.repeat.set( 3, 3 );
    orbMat4 = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        alphaMap: noise
       
    })
    orb4 = new THREE.Mesh(sphereGeo, orbMat4)
    orb4.position.x = 2
    orb4.scale.set(0.998, 0.998, 0.998)
    scene.add(orb4)
}

const initOrbs5 = () => {
    const sphereGeo = new THREE.SphereBufferGeometry(0.5, 16, 32)
    let noise = new THREE.TextureLoader().load('./textures/noise/cloud.jpg')
    noise.mapping = THREE.EquirectangularRefractionMapping;
    noise.wrapS = THREE.RepeatWrapping;
    noise.wrapT = THREE.RepeatWrapping;
    noise.repeat.set( 3, 3 );
    orbMat5 = new THREE.MeshBasicMaterial({
        color: 0x0000ff,
        transparent: true,
        alphaMap: noise
       
    })
    orb5 = new THREE.Mesh(sphereGeo, orbMat5)
    orb5.position.x = 2
    orb5.scale.set(0.997, 0.997, 0.997)
    scene.add(orb5)
}


/**
 * FIREBALLS
 */
function makeOrderdBall(items, group) {
    if(items.lenght == 0) return
    items.forEach(item => {
        let mesh = createSingleBall(item)
        group.add(mesh)
    })
}

function createSingleBall(item){
    const geo = new THREE.SphereBufferGeometry(0.5, 16, 32)
    let mat = null;
    if(item.type == 1) {
        mat = new THREE.MeshBasicMaterial({
            color: item.color,
            alphaMap: item.alpha,
            transparent: true
        })
    }else{
        mat = new THREE.MeshStandardMaterial({
            color: item.color,
            alphaMap: item.alpha,
            transparent: true,
            metalness: 0,
            roughness: 1
        })
    }
   
    gsap.to(mat.alphaMap, {duration: item.speed, rotation: Math.PI * 2, repeat: -1, ease: 'none'})
    const mesh = new THREE.Mesh(geo, mat)
    mesh.scale.set(item.scale, item.scale, item.scale)

    return mesh
}


export {Stage}