/* public/assets/js/ecommerce-3d.js */

class EcommerceScene3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.animationProgress = 0;
        this.isAnimating = true;
        this.hasAnimated = false;
        this.budgetValue = 0;
        this.sceneObjects = {};
        
        // Initialize
        this.init();
        this.createSceneElements();
        this.setupEventListeners();
        this.animate();
    }
    
    init() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0e1a);
        this.scene.fog = new THREE.Fog(0x0a0e1a, 10, 30);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
        this.camera.position.set(0, 3, 10);
        this.camera.lookAt(0, 0, 0);
        
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
        
        // Lights
        this.setupLights();
        
        // Ground
        this.createGround();
    }
    
    setupLights() {
        // Ambient
        const ambient = new THREE.AmbientLight(0x404060, 0.5);
        this.scene.add(ambient);
        
        // Key light
        const keyLight = new THREE.DirectionalLight(0xffeedd, 1.5);
        keyLight.position.set(5, 8, 5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 1024;
        keyLight.shadow.mapSize.height = 1024;
        keyLight.shadow.camera.near = 0.1;
        keyLight.shadow.camera.far = 20;
        keyLight.shadow.camera.left = -8;
        keyLight.shadow.camera.right = 8;
        keyLight.shadow.camera.top = 8;
        keyLight.shadow.camera.bottom = -8;
        this.scene.add(keyLight);
        
        // Fill light
        const fillLight = new THREE.DirectionalLight(0x4466ff, 0.3);
        fillLight.position.set(-5, 3, 3);
        this.scene.add(fillLight);
        
        // Rim light
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
        rimLight.position.set(0, -2, -5);
        this.scene.add(rimLight);
        
        // Hemisphere
        const hemiLight = new THREE.HemisphereLight(0x4466ff, 0x6633cc, 0.4);
        this.scene.add(hemiLight);
        
        // Point lights for ambiance
        const pointLight1 = new THREE.PointLight(0x818cf8, 0.3, 10);
        pointLight1.position.set(2, 4, 2);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xa78bfa, 0.3, 10);
        pointLight2.position.set(-2, 3, -2);
        this.scene.add(pointLight2);
    }
    
    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0e1a,
            roughness: 0.8,
            metalness: 0.2,
            transparent: true,
            opacity: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.sceneObjects.ground = ground;
        
        // Grid helper for style
        const gridHelper = new THREE.GridHelper(12, 12, 0x818cf8, 0x4f46e5);
        gridHelper.position.y = -0.49;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.15;
        this.scene.add(gridHelper);
        this.sceneObjects.grid = gridHelper;
    }
    
    createSceneElements() {
        // Store building
        this.createStore();
        
        // Delivery truck
        this.createTruck();
        
        // Human character
        this.createHuman();
        
        // Shopping cart
        this.createCart();
        
        // Products
        this.createProducts();
        
        // Floating particles
        this.createParticles();
    }
    
    createStore() {
        const group = new THREE.Group();
        
        // Main building
        const buildingGeom = new THREE.BoxGeometry(4, 3, 2);
        const buildingMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            roughness: 0.3,
            metalness: 0.7,
            transparent: true,
            opacity: 0.9
        });
        const building = new THREE.Mesh(buildingGeom, buildingMat);
        building.position.set(0, 1.5, -2);
        building.castShadow = true;
        building.receiveShadow = true;
        group.add(building);
        
        // Store sign
        const signGeom = new THREE.BoxGeometry(2.5, 0.3, 0.1);
        const signMat = new THREE.MeshStandardMaterial({
            color: 0x818cf8,
            emissive: 0x6366f1,
            emissiveIntensity: 0.3
        });
        const sign = new THREE.Mesh(signGeom, signMat);
        sign.position.set(0, 3.2, -1.9);
        group.add(sign);
        
        // Windows
        const windowMat = new THREE.MeshStandardMaterial({
            color: 0x4f46e5,
            emissive: 0x818cf8,
            emissiveIntensity: 0.1,
            transparent: true,
            opacity: 0.6
        });
        
        for (let i = -1; i <= 1; i += 0.8) {
            const windowGeom = new THREE.BoxGeometry(0.4, 0.6, 0.05);
            const windowMesh = new THREE.Mesh(windowGeom, windowMat);
            windowMesh.position.set(i, 1.8, -1.95);
            group.add(windowMesh);
        }
        
        // Door
        const doorMat = new THREE.MeshStandardMaterial({
            color: 0x312e81,
            roughness: 0.5,
            metalness: 0.3
        });
        const doorGeom = new THREE.BoxGeometry(0.6, 1.2, 0.05);
        const door = new THREE.Mesh(doorGeom, doorMat);
        door.position.set(0, 0.8, -1.95);
        group.add(door);
        
        // Neon glow ring
        const ringGeom = new THREE.TorusGeometry(1.8, 0.03, 16, 32);
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0x818cf8,
            emissive: 0x6366f1,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.6
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.position.set(0, 1.5, -1.8);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
        
        group.position.set(0, 0, 2);
        this.scene.add(group);
        this.sceneObjects.store = group;
    }
    
    createTruck() {
        const group = new THREE.Group();
        
        // Truck body
        const bodyGeom = new THREE.BoxGeometry(1.8, 0.8, 1.2);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x4f46e5,
            roughness: 0.3,
            metalness: 0.5
        });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = 0.6;
        body.castShadow = true;
        group.add(body);
        
        // Truck cabin
        const cabinGeom = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const cabinMat = new THREE.MeshStandardMaterial({
            color: 0x312e81,
            roughness: 0.3,
            metalness: 0.5
        });
        const cabin = new THREE.Mesh(cabinGeom, cabinMat);
        cabin.position.set(1.2, 0.6, 0);
        cabin.castShadow = true;
        group.add(cabin);
        
        // Wheels
        const wheelMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const positions = [
            [-0.5, 0.1, -0.6],
            [-0.5, 0.1, 0.6],
            [0.8, 0.1, -0.6],
            [0.8, 0.1, 0.6]
        ];
        
        positions.forEach(pos => {
            const wheelGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 8);
            const wheel = new THREE.Mesh(wheelGeom, wheelMat);
            wheel.position.set(pos[0], pos[1], pos[2]);
            wheel.rotation.z = Math.PI / 2;
            group.add(wheel);
        });
        
        // Headlights
        const lightMat = new THREE.MeshStandardMaterial({
            color: 0xffdd44,
            emissive: 0xffaa00,
            emissiveIntensity: 0.5
        });
        const lightGeom = new THREE.SphereGeometry(0.08, 8, 8);
        const light1 = new THREE.Mesh(lightGeom, lightMat);
        light1.position.set(1.5, 0.5, -0.2);
        group.add(light1);
        
        const light2 = new THREE.Mesh(lightGeom, lightMat);
        light2.position.set(1.5, 0.5, 0.2);
        group.add(light2);
        
        group.position.set(-8, -0.2, 0);
        this.scene.add(group);
        this.sceneObjects.truck = group;
    }
    
    createHuman() {
        const group = new THREE.Group();
        
        // Body
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x818cf8,
            roughness: 0.4,
            metalness: 0.2
        });
        const bodyGeom = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 8);
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = 0.8;
        body.castShadow = true;
        group.add(body);
        
        // Head
        const headMat = new THREE.MeshStandardMaterial({
            color: 0xfcd34d,
            roughness: 0.3,
            metalness: 0.1
        });
        const headGeom = new THREE.SphereGeometry(0.2, 8, 8);
        const head = new THREE.Mesh(headGeom, headMat);
        head.position.y = 1.3;
        head.castShadow = true;
        group.add(head);
        
        // Arms (as boxes for simplicity)
        const armMat = new THREE.MeshStandardMaterial({
            color: 0x818cf8,
            roughness: 0.4,
            metalness: 0.2
        });
        
        const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), armMat);
        leftArm.position.set(-0.4, 0.8, 0);
        leftArm.castShadow = true;
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), armMat);
        rightArm.position.set(0.4, 0.8, 0);
        rightArm.castShadow = true;
        group.add(rightArm);
        
        // Legs
        const legMat = new THREE.MeshStandardMaterial({
            color: 0x312e81,
            roughness: 0.4,
            metalness: 0.2
        });
        
        const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), legMat);
        leftLeg.position.set(-0.15, 0.2, 0);
        leftLeg.castShadow = true;
        group.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), legMat);
        rightLeg.position.set(0.15, 0.2, 0);
        rightLeg.castShadow = true;
        group.add(rightLeg);
        
        group.position.set(-3, -0.2, 0.5);
        this.scene.add(group);
        this.sceneObjects.human = group;
        this.sceneObjects.leftArm = leftArm;
        this.sceneObjects.rightArm = rightArm;
    }
    
    createCart() {
        const group = new THREE.Group();
        
        // Cart body
        const cartMat = new THREE.MeshStandardMaterial({
            color: 0x6366f1,
            roughness: 0.2,
            metalness: 0.6
        });
        const cartGeom = new THREE.BoxGeometry(0.6, 0.4, 0.5);
        const cart = new THREE.Mesh(cartGeom, cartMat);
        cart.position.y = 0.4;
        cart.castShadow = true;
        group.add(cart);
        
        // Handle
        const handleMat = new THREE.MeshStandardMaterial({
            color: 0x312e81,
            roughness: 0.3,
            metalness: 0.5
        });
        const handleGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6);
        const handle = new THREE.Mesh(handleGeom, handleMat);
        handle.position.set(0.35, 0.6, 0);
        handle.rotation.z = 0.3;
        group.add(handle);
        
        // Wheels
        const wheelMat2 = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const wheelPositions = [
            [-0.25, 0.1, -0.25],
            [-0.25, 0.1, 0.25],
            [0.25, 0.1, -0.25],
            [0.25, 0.1, 0.25]
        ];
        
        wheelPositions.forEach(pos => {
            const wheelGeom2 = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 6);
            const wheel2 = new THREE.Mesh(wheelGeom2, wheelMat2);
            wheel2.position.set(pos[0], pos[1], pos[2]);
            wheel2.rotation.z = Math.PI / 2;
            group.add(wheel2);
        });
        
        group.position.set(-1, -0.2, 1.5);
        this.scene.add(group);
        this.sceneObjects.cart = group;
    }
    
    createProducts() {
        const products = [];
        const colors = [0xff6b6b, 0x4ecdc4, 0xffd93d, 0x6c5ce7, 0xff8a5c];
        const positions = [
            [-0.5, 0.5, 0.5],
            [0.5, 0.5, 0.5],
            [-0.5, 0.5, -0.5],
            [0.5, 0.5, -0.5]
        ];
        
        positions.forEach((pos, i) => {
            const geom = new THREE.BoxGeometry(0.15, 0.15, 0.15);
            const mat = new THREE.MeshStandardMaterial({
                color: colors[i % colors.length],
                roughness: 0.2,
                metalness: 0.6,
                emissive: colors[i % colors.length],
                emissiveIntensity: 0.1
            });
            const product = new THREE.Mesh(geom, mat);
            product.position.set(pos[0], pos[1], pos[2]);
            product.castShadow = true;
            this.sceneObjects.store.add(product);
            products.push(product);
        });
        
        this.sceneObjects.products = products;
    }
    
    createParticles() {
        const particlesGeom = new THREE.BufferGeometry();
        const count = 200;
        const positions = new Float32Array(count * 3);
        
        for (let i = 0; i < count * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 20;
            positions[i] *= (i % 3 === 1) ? 0.5 : 1;
        }
        
        particlesGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particlesMat = new THREE.PointsMaterial({
            color: 0x818cf8,
            size: 0.02,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particlesGeom, particlesMat);
        particles.position.y = 1;
        this.scene.add(particles);
        this.sceneObjects.particles = particles;
    }
    
    setupEventListeners() {
        // Resize
        window.addEventListener('resize', () => this.onResize());
        
        // Click to replay
        const replayBtn = document.getElementById('replayBtn');
        if (replayBtn) {
            replayBtn.addEventListener('click', () => this.replayAnimation());
        }
        
        // Click on scene to replay
        this.container.addEventListener('click', () => {
            if (this.hasAnimated) {
                this.replayAnimation();
            }
        });
        
        // Mouse move for parallax
        this.container.addEventListener('mousemove', (e) => {
            const rect = this.container.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            
            if (this.camera) {
                const targetX = (x - 0.5) * 2 * 0.1;
                const targetY = (y - 0.5) * 2 * 0.1;
                this.camera.position.x += (targetX - this.camera.position.x) * 0.02;
                this.camera.position.y += (targetY - this.camera.position.y) * 0.02;
                this.camera.lookAt(0, 0.5, 0);
            }
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();
        
        // Animate scene
        this.animateScene(time);
        
        // Animate particles
        if (this.sceneObjects.particles) {
            this.sceneObjects.particles.rotation.y += delta * 0.02;
        }
        
        // Animate store
        if (this.sceneObjects.store) {
            const store = this.sceneObjects.store;
            // Subtle float
            store.position.y = Math.sin(time * 0.5) * 0.05;
        }
        
        // Animate budget
        if (this.isAnimating) {
            this.updateBudget(time);
        }
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
    
    animateScene(time) {
        if (!this.isAnimating) return;
        
        const duration = 15; // Total animation duration in seconds
        const progress = Math.min(time / duration, 1);
        this.animationProgress = progress;
        
        // Scene 1: Truck arrives (0-25%)
        if (progress < 0.25) {
            const truckProgress = progress / 0.25;
            const truckX = -8 + truckProgress * 10;
            if (this.sceneObjects.truck) {
                this.sceneObjects.truck.position.x = truckX;
                this.sceneObjects.truck.rotation.y = Math.sin(truckProgress * Math.PI) * 0.05;
            }
            this.updateStatus('🚚 Delivery truck arriving...');
        }
        
        // Scene 2: Human walks in (25-45%)
        else if (progress < 0.45) {
            const humanProgress = (progress - 0.25) / 0.2;
            if (this.sceneObjects.human) {
                const humanX = -3 + humanProgress * 2;
                this.sceneObjects.human.position.x = humanX;
                // Walking animation
                if (this.sceneObjects.leftArm && this.sceneObjects.rightArm) {
                    this.sceneObjects.leftArm.rotation.z = Math.sin(humanProgress * Math.PI * 4) * 0.3;
                    this.sceneObjects.rightArm.rotation.z = Math.sin(humanProgress * Math.PI * 4 + Math.PI) * 0.3;
                }
            }
            this.updateStatus('👤 Customer walking in...');
        }
        
        // Scene 3: Human picks products (45-60%)
        else if (progress < 0.6) {
            const pickProgress = (progress - 0.45) / 0.15;
            if (this.sceneObjects.human) {
                this.sceneObjects.human.position.x = -1;
                // Arms up to pick products
                if (this.sceneObjects.leftArm && this.sceneObjects.rightArm) {
                    this.sceneObjects.leftArm.rotation.x = -Math.PI / 3;
                    this.sceneObjects.rightArm.rotation.x = -Math.PI / 3;
                }
                // Products float to cart
                if (this.sceneObjects.products) {
                    this.sceneObjects.products.forEach((product, i) => {
                        const targetX = -1 + (i % 2) * 0.5;
                        const targetZ = 1.5 + Math.floor(i / 2) * 0.5;
                        product.position.x += (targetX - product.position.x) * 0.02;
                        product.position.z += (targetZ - product.position.z) * 0.02;
                        product.position.y += Math.sin(time * 2 + i) * 0.005;
                    });
                }
            }
            this.updateStatus('🛒 Selecting products...');
        }
        
        // Scene 4: Shopping cart appears (60-70%)
        else if (progress < 0.7) {
            const cartProgress = (progress - 0.6) / 0.1;
            if (this.sceneObjects.cart) {
                this.sceneObjects.cart.position.x = -1 + cartProgress * 2;
                this.sceneObjects.cart.scale.setScalar(0.5 + cartProgress * 0.5);
            }
            this.updateStatus('🛍️ Shopping cart ready...');
        }
        
        // Scene 5: Human holds products (70-80%)
        else if (progress < 0.8) {
            const holdProgress = (progress - 0.7) / 0.1;
            if (this.sceneObjects.human) {
                // Arms down with products
                if (this.sceneObjects.leftArm && this.sceneObjects.rightArm) {
                    this.sceneObjects.leftArm.rotation.x = 0;
                    this.sceneObjects.leftArm.rotation.z = -0.2;
                    this.sceneObjects.rightArm.rotation.x = 0;
                    this.sceneObjects.rightArm.rotation.z = 0.2;
                }
            }
            // Animate budget fill
            this.budgetValue = 25 + holdProgress * 75;
            this.updateBudgetDisplay();
            this.updateStatus('🤲 Carrying products...');
        }
        
        // Scene 6: Payment/Wallet (80-90%)
        else if (progress < 0.9) {
            const paymentProgress = (progress - 0.8) / 0.1;
            // Flash effect on store
            if (this.sceneObjects.store) {
                const intensity = 0.3 + paymentProgress * 0.7;
                this.sceneObjects.store.children.forEach(child => {
                    if (child.material && child.material.emissiveIntensity !== undefined) {
                        child.material.emissiveIntensity = intensity;
                    }
                });
            }
            this.budgetValue = 100;
            this.updateBudgetDisplay();
            this.updateStatus('💰 Processing payment...');
        }
        
        // Scene 7: Purchase complete (90-100%)
        else if (progress >= 0.9) {
            const completeProgress = (progress - 0.9) / 0.1;
            
            // Celebration particles
            if (this.sceneObjects.particles) {
                this.sceneObjects.particles.material.size = 0.02 + completeProgress * 0.03;
                this.sceneObjects.particles.material.opacity = 0.6 + completeProgress * 0.4;
            }
            
            // Happy human
            if (this.sceneObjects.human) {
                if (this.sceneObjects.leftArm && this.sceneObjects.rightArm) {
                    this.sceneObjects.leftArm.rotation.z = -0.5;
                    this.sceneObjects.rightArm.rotation.z = 0.5;
                }
                // Bounce
                this.sceneObjects.human.position.y = Math.sin(time * 3) * 0.05;
            }
            
            if (progress < 0.95) {
                this.updateStatus('✅ Purchase complete! 🎉');
                this.showHeroText();
            } else {
                this.isAnimating = false;
                this.hasAnimated = true;
                this.updateStatus('✨ Welcome to BSSShop! 🛍️');
                document.getElementById('replayBtn').style.opacity = '1';
            }
        }
    }
    
    updateStatus(text) {
        const statusText = document.querySelector('.status-text');
        if (statusText) {
            statusText.textContent = text;
        }
    }
    
    updateBudget(time) {
        // Budget is updated in the animation sequence
    }
    
    updateBudgetDisplay() {
        const budgetElement = document.getElementById('budgetAmount');
        const fillElement = document.getElementById('budgetFill');
        if (budgetElement) {
            budgetElement.textContent = `$${Math.round(this.budgetValue)}`;
        }
        if (fillElement) {
            fillElement.style.width = `${this.budgetValue}%`;
        }
    }
    
    showHeroText() {
        // Show the main hero text after animation
        const overlay = document.querySelector('.hero-text-overlay');
        if (overlay) {
            overlay.style.opacity = '1';
        }
    }
    
    replayAnimation() {
        // Reset everything
        this.isAnimating = true;
        this.animationProgress = 0;
        this.budgetValue = 0;
        this.hasAnimated = false;
        this.clock.start();
        
        // Reset positions
        if (this.sceneObjects.truck) {
            this.sceneObjects.truck.position.x = -8;
        }
        if (this.sceneObjects.human) {
            this.sceneObjects.human.position.x = -3;
            this.sceneObjects.human.position.y = -0.2;
            if (this.sceneObjects.leftArm && this.sceneObjects.rightArm) {
                this.sceneObjects.leftArm.rotation.x = 0;
                this.sceneObjects.leftArm.rotation.z = 0;
                this.sceneObjects.rightArm.rotation.x = 0;
                this.sceneObjects.rightArm.rotation.z = 0;
            }
        }
        if (this.sceneObjects.cart) {
            this.sceneObjects.cart.position.x = -1;
            this.sceneObjects.cart.scale.setScalar(0.5);
        }
        if (this.sceneObjects.products) {
            this.sceneObjects.products.forEach((product, i) => {
                product.position.x = [-0.5, 0.5, -0.5, 0.5][i];
                product.position.z = [0.5, 0.5, -0.5, -0.5][i];
                product.position.y = 0.5;
            });
        }
        
        // Reset budget
        this.updateBudgetDisplay();
        
        // Reset status
        this.updateStatus('🔄 Replaying animation...');
        
        // Hide hero text
        const overlay = document.querySelector('.hero-text-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
        }
        
        // Hide replay button
        document.getElementById('replayBtn').style.opacity = '0';
    }
    
    onResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('three-container');
    if (container) {
        new EcommerceScene3D('three-container');
    }
});