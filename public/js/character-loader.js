/* public/assets/js/character-loader.js */

class PremiumCharacterScene {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Container not found');
            return;
        }
        
        // Check if Three.js is loaded
        if (typeof THREE === 'undefined') {
            console.error('Three.js is not loaded');
            this.showError('Three.js library not loaded. Please refresh the page.');
            return;
        }
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.character = null;
        this.mixer = null;
        this.animations = {};
        this.currentAnimation = 'idle';
        this.isCharacterLoaded = false;
        this.particles = null;
        
        // Model path - Update this to your actual model
        this.modelPath = '/assets/models/character.glb';
        this.basketPath = '/assets/models/shopping_basket.glb';
        
        this.init();
        this.setupLights();
        this.setupScene();
        this.loadCharacter();
        this.setupEventListeners();
        this.animate();
    }
    
    init() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0e1a);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
        this.camera.position.set(0, 1.8, 4.5);
        this.camera.lookAt(0, 1.5, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.container.appendChild(this.renderer.domElement);
    }
    
    setupLights() {
        // Key light
        const keyLight = new THREE.DirectionalLight(0xffeedd, 1.5);
        keyLight.position.set(3, 5, 5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.camera.near = 0.1;
        keyLight.shadow.camera.far = 20;
        keyLight.shadow.camera.left = -5;
        keyLight.shadow.camera.right = 5;
        keyLight.shadow.camera.top = 5;
        keyLight.shadow.camera.bottom = -5;
        keyLight.shadow.bias = -0.001;
        this.scene.add(keyLight);
        
        // Fill light
        const fillLight = new THREE.DirectionalLight(0x4488ff, 0.4);
        fillLight.position.set(-3, 2, 4);
        this.scene.add(fillLight);
        
        // Rim light
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
        rimLight.position.set(0, 3, -5);
        this.scene.add(rimLight);
        
        // Bottom fill
        const bottomLight = new THREE.DirectionalLight(0x4466aa, 0.3);
        bottomLight.position.set(0, -2, 3);
        this.scene.add(bottomLight);
        
        // Ambient
        const ambient = new THREE.AmbientLight(0x404060, 0.2);
        this.scene.add(ambient);
        
        // Hemisphere
        const hemiLight = new THREE.HemisphereLight(0x4466ff, 0x6633cc, 0.3);
        this.scene.add(hemiLight);
        
        // Studio spotlight
        const spotLight = new THREE.SpotLight(0x818cf8, 0.3);
        spotLight.position.set(0, 8, 0);
        spotLight.angle = 0.3;
        spotLight.penumbra = 0.5;
        spotLight.decay = 1;
        spotLight.distance = 20;
        this.scene.add(spotLight);
    }
    
    setupScene() {
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(10, 10);
        const groundMaterial = new THREE.ShadowMaterial({
            opacity: 0.3,
            color: 0x000000
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.01;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Circular platform
        const platformGeo = new THREE.CircleGeometry(1.5, 32);
        const platformMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            roughness: 0.3,
            metalness: 0.7,
            transparent: true,
            opacity: 0.6,
            emissive: 0x2a2a4e,
            emissiveIntensity: 0.1
        });
        const platform = new THREE.Mesh(platformGeo, platformMat);
        platform.rotation.x = -Math.PI / 2;
        platform.position.y = 0;
        platform.receiveShadow = true;
        this.scene.add(platform);
        
        // Particles
        this.createParticles();
    }
    
    createParticles() {
        const particlesGeom = new THREE.BufferGeometry();
        const count = 200;
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        
        for (let i = 0; i < count * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 8;
            positions[i+1] = Math.random() * 4;
            positions[i+2] = (Math.random() - 0.5) * 8;
            sizes[i/3] = Math.random() * 0.02 + 0.01;
        }
        
        particlesGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const particlesMat = new THREE.PointsMaterial({
            color: 0x818cf8,
            size: 0.02,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        this.particles = new THREE.Points(particlesGeom, particlesMat);
        this.particles.position.y = 0.5;
        this.scene.add(this.particles);
    }
    
    loadCharacter() {
        // Check if GLTFLoader is available
        if (typeof THREE.GLTFLoader === 'undefined') {
            console.warn('GLTFLoader not available, creating fallback character');
            this.createFallbackCharacter();
            return;
        }
        
        const loader = new THREE.GLTFLoader();
        this.showLoading();
        
        loader.load(
            this.modelPath,
            (gltf) => {
                this.handleCharacterLoaded(gltf);
            },
            (xhr) => {
                const progress = (xhr.loaded / xhr.total) * 100;
                this.updateLoading(progress);
            },
            (error) => {
                console.warn('Could not load character, creating fallback:', error);
                this.hideLoading();
                this.createFallbackCharacter();
            }
        );
    }
    
    handleCharacterLoaded(gltf) {
        this.character = gltf.scene;
        this.character.scale.set(1, 1, 1);
        this.character.position.set(0, 0, 0);
        
        // Setup shadows and materials
        this.character.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                if (node.material) {
                    node.material.roughness = Math.min(node.material.roughness || 0.5, 0.8);
                    node.material.metalness = Math.min(node.material.metalness || 0, 0.5);
                }
            }
        });
        
        this.scene.add(this.character);
        
        // Setup animations
        if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.character);
            gltf.animations.forEach((clip) => {
                this.animations[clip.name] = this.mixer.clipAction(clip);
            });
            this.playAnimation('idle');
        }
        
        this.isCharacterLoaded = true;
        this.hideLoading();
        this.loadBasket();
    }
    
    loadBasket() {
        if (typeof THREE.GLTFLoader === 'undefined') {
            this.createFallbackBasket();
            return;
        }
        
        const loader = new THREE.GLTFLoader();
        
        loader.load(
            this.basketPath,
            (gltf) => {
                const basket = gltf.scene;
                basket.scale.set(0.5, 0.5, 0.5);
                basket.position.set(0.4, 0.8, 0.3);
                basket.rotation.y = -0.2;
                if (this.character) {
                    this.character.add(basket);
                }
            },
            undefined,
            () => {
                this.createFallbackBasket();
            }
        );
    }
    
    createFallbackBasket() {
        const group = new THREE.Group();
        
        // Basket body
        const basketMat = new THREE.MeshStandardMaterial({
            color: 0x818cf8,
            roughness: 0.3,
            metalness: 0.5,
            emissive: 0x6366f1,
            emissiveIntensity: 0.1
        });
        const basket = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.25), basketMat);
        basket.position.y = 0.1;
        group.add(basket);
        
        // Handle
        const handleMat = new THREE.MeshStandardMaterial({
            color: 0x6366f1,
            roughness: 0.2,
            metalness: 0.6
        });
        const handle = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.015, 8, 12), handleMat);
        handle.position.set(0, 0.25, 0);
        handle.rotation.x = Math.PI / 2;
        group.add(handle);
        
        // Products in basket
        const productColors = [0xff6b6b, 0x4ecdc4, 0xffd93d, 0x6c5ce7];
        const productPositions = [
            [-0.08, 0.2, -0.06],
            [0.08, 0.2, 0.06],
            [-0.06, 0.2, 0.08],
            [0.06, 0.2, -0.08]
        ];
        
        productPositions.forEach((pos, i) => {
            const product = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 0.04, 0.04),
                new THREE.MeshStandardMaterial({
                    color: productColors[i % productColors.length],
                    roughness: 0.2,
                    metalness: 0.6,
                    emissive: productColors[i % productColors.length],
                    emissiveIntensity: 0.05
                })
            );
            product.position.set(pos[0], pos[1], pos[2]);
            group.add(product);
        });
        
        group.position.set(0.4, 0.8, 0.3);
        group.rotation.y = -0.2;
        group.scale.set(0.8, 0.8, 0.8);
        
        if (this.character) {
            this.character.add(group);
        }
    }
    
    createFallbackCharacter() {
        const group = new THREE.Group();
        
        // Body
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x4a4a6a,
            roughness: 0.4,
            metalness: 0.1,
            emissive: 0x2a2a4a,
            emissiveIntensity: 0.05
        });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.8, 12), bodyMat);
        body.position.y = 0.8;
        body.castShadow = true;
        group.add(body);
        
        // Head
        const headMat = new THREE.MeshStandardMaterial({
            color: 0xf5d0b8,
            roughness: 0.3,
            metalness: 0.05
        });
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), headMat);
        head.position.y = 1.3;
        head.castShadow = true;
        group.add(head);
        
        // Hair
        const hairMat = new THREE.MeshStandardMaterial({
            color: 0x2d1b0e,
            roughness: 0.8,
            metalness: 0
        });
        const hair = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 12), hairMat);
        hair.position.set(0, 1.38, -0.02);
        hair.scale.set(1, 0.3, 1);
        group.add(hair);
        
        // Eyes
        const eyeMat = new THREE.MeshStandardMaterial({
            color: 0x2d1b0e,
            roughness: 0.1
        });
        for (let side = -0.07; side <= 0.07; side += 0.14) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), eyeMat);
            eye.position.set(side, 1.32, 0.15);
            group.add(eye);
        }
        
        // Arms
        const armMat = new THREE.MeshStandardMaterial({
            color: 0x4a4a6a,
            roughness: 0.4,
            metalness: 0.1
        });
        const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.4, 8), armMat);
        leftArm.position.set(-0.35, 0.75, 0);
        leftArm.rotation.z = 0.2;
        leftArm.castShadow = true;
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.4, 8), armMat);
        rightArm.position.set(0.35, 0.75, 0);
        rightArm.rotation.z = -0.2;
        rightArm.castShadow = true;
        group.add(rightArm);
        
        // Legs
        const legMat = new THREE.MeshStandardMaterial({
            color: 0x2d1b0e,
            roughness: 0.6,
            metalness: 0.1
        });
        const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.35, 8), legMat);
        leftLeg.position.set(-0.12, 0.17, 0);
        leftLeg.castShadow = true;
        group.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.35, 8), legMat);
        rightLeg.position.set(0.12, 0.17, 0);
        rightLeg.castShadow = true;
        group.add(rightLeg);
        
        group.position.set(0, 0, 0);
        this.scene.add(group);
        this.character = group;
        this.isCharacterLoaded = true;
        this.hideLoading();
    }
    
    playAnimation(name) {
        if (!this.mixer) return;
        if (this.currentAnimation && this.animations[this.currentAnimation]) {
            this.animations[this.currentAnimation].stop();
        }
        if (this.animations[name]) {
            this.animations[name].reset();
            this.animations[name].play();
            this.currentAnimation = name;
        }
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.onResize());
        
        this.container.addEventListener('mousemove', (e) => {
            if (!this.isCharacterLoaded) return;
            const rect = this.container.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const targetX = (x - 0.5) * 0.3;
            const targetY = (y - 0.5) * 0.1 + 1.8;
            this.camera.position.x += (targetX - this.camera.position.x) * 0.02;
            this.camera.position.y += (targetY - this.camera.position.y) * 0.02;
            this.camera.lookAt(0, 1.5, 0);
        });
        
        this.container.addEventListener('click', () => {
            this.cycleAnimation();
        });
    }
    
    cycleAnimation() {
        const animNames = Object.keys(this.animations);
        if (animNames.length === 0) return;
        const currentIndex = animNames.indexOf(this.currentAnimation);
        const nextIndex = (currentIndex + 1) % animNames.length;
        this.playAnimation(animNames[nextIndex]);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        
        if (this.mixer) {
            this.mixer.update(delta);
        }
        
        if (this.character && this.isCharacterLoaded) {
            const time = this.clock.getElapsedTime();
            this.character.position.y = Math.sin(time * 0.3) * 0.01;
            this.character.rotation.y = Math.sin(time * 0.1) * 0.02;
        }
        
        if (this.particles) {
            this.particles.rotation.y += delta * 0.02;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    onResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'flex';
    }
    
    updateLoading(progress) {
        const bar = document.querySelector('.loading-bar-fill');
        if (bar) bar.style.width = Math.min(progress, 100) + '%';
    }
    
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'none';
    }
    
    showError(message) {
        const error = document.getElementById('errorMessage');
        if (error) {
            error.style.display = 'block';
            error.innerHTML = `<p>⚠️ ${message || 'Unable to load 3D character. Please refresh the page.'}</p>`;
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('character-container');
    if (container) {
        // Wait for Three.js to load
        if (typeof THREE !== 'undefined') {
            window.characterScene = new PremiumCharacterScene('character-container');
        } else {
            // Load Three.js if not loaded
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            script.onload = function() {
                // Load GLTFLoader
                const loaderScript = document.createElement('script');
                loaderScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
                loaderScript.onload = function() {
                    window.characterScene = new PremiumCharacterScene('character-container');
                };
                document.head.appendChild(loaderScript);
            };
            document.head.appendChild(script);
        }
    }
});

// Fallback if DOMContentLoaded already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(function() {
        const container = document.getElementById('character-container');
        if (container && !window.characterScene && typeof THREE !== 'undefined') {
            window.characterScene = new PremiumCharacterScene('character-container');
        }
    }, 1000);
}