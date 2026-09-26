/* public/assets/js/ecommerce-animation.js */

class CinematicEcommerceScene {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.isAnimating = false;
        this.animationType = null;
        this.animationComplete = false;
        this.sceneObjects = {};
        this.cameraTargets = {
            default: { position: new THREE.Vector3(0, 3, 10), lookAt: new THREE.Vector3(0, 0, 0) },
            shop: { position: new THREE.Vector3(2, 2, 4), lookAt: new THREE.Vector3(0, 0.5, 0) },
            delivery: { position: new THREE.Vector3(-3, 2, 6), lookAt: new THREE.Vector3(0, 0, 0) }
        };
        this.currentCameraTarget = 'default';
        this.characterState = 'idle';
        this.lastAnimation = 'visitShop';
        
        this.init();
        this.createCityElements();
        this.setupEventListeners();
        this.animate();
        
        // Start default animation on load
        setTimeout(() => {
            this.playVisitShop();
        }, 1500);
    }
    
    init() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0e1a);
        this.scene.fog = new THREE.FogExp2(0x0a0e1a, 0.015);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
        const target = this.cameraTargets.default;
        this.camera.position.copy(target.position);
        this.camera.lookAt(target.lookAt);
        
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
        const ambient = new THREE.AmbientLight(0x404060, 0.4);
        this.scene.add(ambient);
        
        // Sunlight
        const sunLight = new THREE.DirectionalLight(0xffeedd, 1.2);
        sunLight.position.set(10, 15, 5);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.1;
        sunLight.shadow.camera.far = 30;
        sunLight.shadow.camera.left = -10;
        sunLight.shadow.camera.right = 10;
        sunLight.shadow.camera.top = 10;
        sunLight.shadow.camera.bottom = -10;
        this.scene.add(sunLight);
        this.sceneObjects.sunLight = sunLight;
        
        // Fill light
        const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3);
        fillLight.position.set(-5, 3, 5);
        this.scene.add(fillLight);
        
        // Rim light
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
        rimLight.position.set(0, -2, -8);
        this.scene.add(rimLight);
        
        // Hemisphere
        const hemiLight = new THREE.HemisphereLight(0x4466ff, 0x6633cc, 0.5);
        this.scene.add(hemiLight);
        
        // Street lights
        const streetLightPositions = [
            [-3, 1.5, -2],
            [3, 1.5, -2],
            [-3, 1.5, 2],
            [3, 1.5, 2]
        ];
        
        streetLightPositions.forEach(pos => {
            const light = new THREE.PointLight(0xffdd44, 0.3, 8);
            light.position.set(pos[0], pos[1], pos[2]);
            this.scene.add(light);
        });
    }
    
    createGround() {
        // Main ground
        const groundGeometry = new THREE.PlaneGeometry(30, 30);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.sceneObjects.ground = ground;
        
        // Road
        const roadGeom = new THREE.PlaneGeometry(20, 1.5);
        const roadMat = new THREE.MeshStandardMaterial({
            color: 0x2a2a3e,
            roughness: 0.9,
            metalness: 0.1
        });
        const road = new THREE.Mesh(roadGeom, roadMat);
        road.rotation.x = -Math.PI / 2;
        road.position.set(0, -0.49, 2);
        this.scene.add(road);
        this.sceneObjects.road = road;
        
        // Road markings
        const markingMat = new THREE.MeshStandardMaterial({
            color: 0x444466,
            roughness: 0.5
        });
        for (let i = -4; i <= 4; i++) {
            const marking = new THREE.Mesh(
                new THREE.PlaneGeometry(0.3, 0.05),
                markingMat
            );
            marking.rotation.x = -Math.PI / 2;
            marking.position.set(i * 0.8, -0.48, 2);
            this.scene.add(marking);
        }
    }
    
    createCityElements() {
        // Buildings in background
        const buildingColors = [0x1a1a2e, 0x16213e, 0x0f3460, 0x1a1a2e];
        for (let i = -5; i <= 5; i += 1.5) {
            if (Math.abs(i) < 1.5) continue;
            const height = 1.5 + Math.random() * 2;
            const building = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, height, 0.8),
                new THREE.MeshStandardMaterial({
                    color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
                    roughness: 0.7,
                    metalness: 0.3
                })
            );
            building.position.set(i, height/2 - 0.5, -5);
            building.castShadow = true;
            building.receiveShadow = true;
            this.scene.add(building);
            
            // Windows
            const windowMat = new THREE.MeshStandardMaterial({
                color: 0xffdd44,
                emissive: 0xffaa00,
                emissiveIntensity: 0.1 + Math.random() * 0.2
            });
            for (let j = 0; j < Math.floor(height * 2); j++) {
                const windowMesh = new THREE.Mesh(
                    new THREE.PlaneGeometry(0.1, 0.1),
                    windowMat
                );
                windowMesh.position.set(
                    i + (Math.random() - 0.5) * 0.4,
                    j * 0.4 + 0.2,
                    -4.6
                );
                this.scene.add(windowMesh);
            }
        }
        
        // Create main shop
        this.createShop();
        
        // Create delivery truck
        this.createDeliveryTruck();
        
        // Create human character
        this.createHumanCharacter();
        
        // Create trees
        this.createTrees();
        
        // Create floating particles
        this.createParticles();
    }
    
    createShop() {
        const group = new THREE.Group();
        
        // Main building
        const buildingMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            roughness: 0.3,
            metalness: 0.7,
            transparent: true,
            opacity: 0.9
        });
        const building = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.8, 2.5), buildingMat);
        building.position.set(0, 1.4, -1.5);
        building.castShadow = true;
        building.receiveShadow = true;
        group.add(building);
        
        // Glass front
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x4f46e5,
            emissive: 0x818cf8,
            emissiveIntensity: 0.1,
            transparent: true,
            opacity: 0.4,
            roughness: 0.1,
            metalness: 0.1
        });
        const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2), glassMat);
        glass.position.set(0, 1.2, -1.25);
        group.add(glass);
        
        // Shop sign
        const signMat = new THREE.MeshStandardMaterial({
            color: 0x818cf8,
            emissive: 0x6366f1,
            emissiveIntensity: 0.3
        });
        const sign = new THREE.Mesh(new THREE.BoxGeometry(2, 0.3, 0.1), signMat);
        sign.position.set(0, 2.8, -1.3);
        group.add(sign);
        
        // Sign text using small boxes
        const textMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.1
        });
        const letters = 'BSSSHOP'.split('');
        letters.forEach((letter, i) => {
            const text = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.18, 0.02),
                textMat
            );
            text.position.set(-0.7 + i * 0.18, 2.8, -1.25);
            group.add(text);
        });
        
        // Door
        const doorMat = new THREE.MeshStandardMaterial({
            color: 0x312e81,
            roughness: 0.5,
            metalness: 0.3
        });
        const door = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 0.05), doorMat);
        door.position.set(0, 0.8, -1.25);
        group.add(door);
        this.sceneObjects.shopDoor = door;
        
        // Door handle
        const handleMat = new THREE.MeshStandardMaterial({
            color: 0xffdd44,
            metalness: 0.8,
            roughness: 0.2
        });
        const handle = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), handleMat);
        handle.position.set(0.25, 0.8, -1.22);
        group.add(handle);
        
        // Awning
        const awningMat = new THREE.MeshStandardMaterial({
            color: 0x6366f1,
            roughness: 0.6,
            metalness: 0.1
        });
        const awning = new THREE.Mesh(new THREE.BoxGeometry(3, 0.15, 0.8), awningMat);
        awning.position.set(0, 2.3, -1);
        group.add(awning);
        
        // Interior glow
        const glowMat = new THREE.MeshStandardMaterial({
            color: 0xffdd44,
            emissive: 0xffaa00,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.8), glowMat);
        glow.position.set(0, 1.2, -1.24);
        group.add(glow);
        
        // Products inside (visible through window)
        const productColors = [0xff6b6b, 0x4ecdc4, 0xffd93d, 0x6c5ce7];
        for (let i = 0; i < 6; i++) {
            const product = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.1, 0.1),
                new THREE.MeshStandardMaterial({
                    color: productColors[i % productColors.length],
                    roughness: 0.2,
                    metalness: 0.6
                })
            );
            product.position.set(
                -0.8 + (i % 3) * 0.8,
                0.8 + Math.floor(i / 3) * 0.4,
                -1.35
            );
            group.add(product);
        }
        
        this.scene.add(group);
        this.sceneObjects.shop = group;
        
        // Neon border
        const borderMat = new THREE.MeshStandardMaterial({
            color: 0x818cf8,
            emissive: 0x6366f1,
            emissiveIntensity: 0.5
        });
        const borderPoints = [
            [-1.6, -0.5, -1.3],
            [1.6, -0.5, -1.3],
            [1.6, 2.3, -1.3],
            [-1.6, 2.3, -1.3]
        ];
        for (let i = 0; i < 4; i++) {
            const next = (i + 1) % 4;
            const midX = (borderPoints[i][0] + borderPoints[next][0]) / 2;
            const midY = (borderPoints[i][1] + borderPoints[next][1]) / 2;
            const border = new THREE.Mesh(
                new THREE.BoxGeometry(
                    i % 2 === 0 ? 3.2 : 0.03,
                    i % 2 === 0 ? 0.03 : 2.8,
                    0.03
                ),
                borderMat
            );
            border.position.set(midX, midY + 0.9, -1.28);
            group.add(border);
        }
    }
    
    createDeliveryTruck() {
        const group = new THREE.Group();
        
        // Truck body
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x4f46e5,
            roughness: 0.3,
            metalness: 0.5
        });
        const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.2, 1.5), bodyMat);
        body.position.set(0, 0.8, 0);
        body.castShadow = true;
        group.add(body);
        
        // Truck stripes
        const stripeMat = new THREE.MeshStandardMaterial({
            color: 0x818cf8,
            roughness: 0.2,
            metalness: 0.3
        });
        for (let i = -0.8; i <= 0.8; i += 0.4) {
            const stripe = new THREE.Mesh(
                new THREE.BoxGeometry(0.05, 0.6, 1.4),
                stripeMat
            );
            stripe.position.set(i, 0.8, 0);
            group.add(stripe);
        }
        
        // Cabin
        const cabinMat = new THREE.MeshStandardMaterial({
            color: 0x312e81,
            roughness: 0.3,
            metalness: 0.5
        });
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.2), cabinMat);
        cabin.position.set(1.6, 0.6, 0);
        cabin.castShadow = true;
        group.add(cabin);
        
        // Windshield
        const windshieldMat = new THREE.MeshStandardMaterial({
            color: 0x4f46e5,
            emissive: 0x818cf8,
            emissiveIntensity: 0.1,
            transparent: true,
            opacity: 0.4
        });
        const windshield = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.5), windshieldMat);
        windshield.position.set(2.0, 0.6, 0);
        group.add(windshield);
        
        // Wheels
        const wheelMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            roughness: 0.8,
            metalness: 0.2
        });
        const wheelPositions = [
            [-0.8, 0.1, -0.7],
            [-0.8, 0.1, 0.7],
            [0.8, 0.1, -0.7],
            [0.8, 0.1, 0.7]
        ];
        const wheels = [];
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.25, 0.25, 0.1, 8),
                wheelMat
            );
            wheel.position.set(pos[0], pos[1], pos[2]);
            wheel.rotation.z = Math.PI / 2;
            group.add(wheel);
            wheels.push(wheel);
        });
        this.sceneObjects.truckWheels = wheels;
        
        // Headlights
        const lightMat = new THREE.MeshStandardMaterial({
            color: 0xffdd44,
            emissive: 0xffaa00,
            emissiveIntensity: 0.5
        });
        for (let side = -0.3; side <= 0.3; side += 0.6) {
            const headlight = new THREE.Mesh(
                new THREE.SphereGeometry(0.06, 8, 8),
                lightMat
            );
            headlight.position.set(2.0, 0.4, side);
            group.add(headlight);
        }
        
        // Taillights
        const tailMat = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.3
        });
        for (let side = -0.3; side <= 0.3; side += 0.6) {
            const tail = new THREE.Mesh(
                new THREE.SphereGeometry(0.04, 8, 8),
                tailMat
            );
            tail.position.set(-1.3, 0.4, side);
            group.add(tail);
        }
        
        // Parcel in truck
        const parcelMat = new THREE.MeshStandardMaterial({
            color: 0xfcd34d,
            roughness: 0.4,
            metalness: 0.1
        });
        const parcel = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.3), parcelMat);
        parcel.position.set(-0.5, 1.2, 0);
        group.add(parcel);
        this.sceneObjects.truckParcel = parcel;
        
        group.position.set(-5, -0.2, 2);
        this.scene.add(group);
        this.sceneObjects.truck = group;
    }
    
    createHumanCharacter() {
        const group = new THREE.Group();
        
        // Body
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x818cf8,
            roughness: 0.4,
            metalness: 0.2
        });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.7, 8), bodyMat);
        body.position.set(0, 0.7, 0);
        body.castShadow = true;
        group.add(body);
        
        // Head
        const headMat = new THREE.MeshStandardMaterial({
            color: 0xfcd34d,
            roughness: 0.3,
            metalness: 0.1
        });
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), headMat);
        head.position.set(0, 1.2, 0);
        head.castShadow = true;
        group.add(head);
        
        // Hair
        const hairMat = new THREE.MeshStandardMaterial({
            color: 0x312e81,
            roughness: 0.8
        });
        const hair = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), hairMat);
        hair.position.set(0, 1.28, -0.05);
        hair.scale.set(1, 0.3, 1);
        group.add(hair);
        
        // Eyes
        const eyeMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            roughness: 0.1
        });
        for (let side = -0.07; side <= 0.07; side += 0.14) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), eyeMat);
            eye.position.set(side, 1.22, 0.16);
            group.add(eye);
        }
        
        // Mouth (simple smile)
        const mouthMat = new THREE.MeshStandardMaterial({
            color: 0xdc2626
        });
        const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.01, 4, 6), mouthMat);
        mouth.position.set(0, 1.14, 0.16);
        mouth.rotation.x = 0.3;
        group.add(mouth);
        
        // Arms
        const armMat = new THREE.MeshStandardMaterial({
            color: 0x818cf8,
            roughness: 0.4,
            metalness: 0.2
        });
        const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.06), armMat);
        leftArm.position.set(-0.35, 0.75, 0);
        leftArm.castShadow = true;
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.06), armMat);
        rightArm.position.set(0.35, 0.75, 0);
        rightArm.castShadow = true;
        group.add(rightArm);
        
        // Hands
        const handMat = new THREE.MeshStandardMaterial({
            color: 0xfcd34d,
            roughness: 0.3
        });
        const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), handMat);
        leftHand.position.set(-0.35, 0.55, 0);
        group.add(leftHand);
        
        const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), handMat);
        rightHand.position.set(0.35, 0.55, 0);
        group.add(rightHand);
        
        // Legs
        const legMat = new THREE.MeshStandardMaterial({
            color: 0x312e81,
            roughness: 0.4,
            metalness: 0.2
        });
        const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.08), legMat);
        leftLeg.position.set(-0.12, 0.17, 0);
        leftLeg.castShadow = true;
        group.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.08), legMat);
        rightLeg.position.set(0.12, 0.17, 0);
        rightLeg.castShadow = true;
        group.add(rightLeg);
        
        // Shoes
        const shoeMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            roughness: 0.8
        });
        for (let side = -0.12; side <= 0.12; side += 0.24) {
            const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.15), shoeMat);
            shoe.position.set(side, 0, 0.03);
            group.add(shoe);
        }
        
        // Shopping bag (initially hidden)
        const bagMat = new THREE.MeshStandardMaterial({
            color: 0x6366f1,
            roughness: 0.3,
            metalness: 0.1
        });
        const bag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.08), bagMat);
        bag.position.set(-0.35, 0.6, 0.1);
        bag.visible = false;
        group.add(bag);
        this.sceneObjects.shoppingBag = bag;
        
        // Bag handles
        const handleMat2 = new THREE.MeshStandardMaterial({
            color: 0x4f46e5,
            roughness: 0.3
        });
        for (let side = -0.04; side <= 0.04; side += 0.08) {
            const handle = new THREE.Mesh(
                new THREE.TorusGeometry(0.04, 0.005, 4, 6),
                handleMat2
            );
            handle.position.set(-0.35, 0.7, side);
            handle.rotation.x = 0.3;
            group.add(handle);
        }
        
        // Second bag (for when carrying both hands)
        const bag2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.08), bagMat);
        bag2.position.set(0.35, 0.6, 0.1);
        bag2.visible = false;
        group.add(bag2);
        this.sceneObjects.shoppingBag2 = bag2;
        
        group.position.set(-1, -0.2, 0.5);
        this.scene.add(group);
        this.sceneObjects.character = group;
        this.sceneObjects.leftArm = leftArm;
        this.sceneObjects.rightArm = rightArm;
        this.sceneObjects.leftLeg = leftLeg;
        this.sceneObjects.rightLeg = rightLeg;
        this.sceneObjects.head = head;
        this.sceneObjects.body = body;
    }
    
    createTrees() {
        const treePositions = [
            [-4, 0, -1],
            [4, 0, -1],
            [-4, 0, 3],
            [4, 0, 3]
        ];
        
        treePositions.forEach(pos => {
            const group = new THREE.Group();
            
            // Trunk
            const trunkMat = new THREE.MeshStandardMaterial({
                color: 0x4a3728,
                roughness: 0.8
            });
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.5, 6), trunkMat);
            trunk.position.set(0, 0.25, 0);
            trunk.castShadow = true;
            group.add(trunk);
            
            // Foliage (multiple spheres)
            const foliageMat = new THREE.MeshStandardMaterial({
                color: 0x2d5a27,
                roughness: 0.8,
                metalness: 0.1
            });
            for (let i = 0; i < 5; i++) {
                const foliage = new THREE.Mesh(
                    new THREE.SphereGeometry(0.15 + Math.random() * 0.1, 6, 6),
                    foliageMat
                );
                foliage.position.set(
                    (Math.random() - 0.5) * 0.3,
                    0.6 + Math.random() * 0.2,
                    (Math.random() - 0.5) * 0.3
                );
                foliage.castShadow = true;
                group.add(foliage);
            }
            
            group.position.set(pos[0], -0.2, pos[2]);
            this.scene.add(group);
        });
    }
    
    createParticles() {
        const particlesGeom = new THREE.BufferGeometry();
        const count = 300;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        
        for (let i = 0; i < count * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 30;
            positions[i+1] = Math.random() * 8;
            positions[i+2] = (Math.random() - 0.5) * 20;
            
            colors[i] = 0.5 + Math.random() * 0.5;
            colors[i+1] = 0.4 + Math.random() * 0.3;
            colors[i+2] = 0.8 + Math.random() * 0.2;
        }
        
        particlesGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const particlesMat = new THREE.PointsMaterial({
            size: 0.03,
            transparent: true,
            opacity: 0.6,
            vertexColors: true,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particlesGeom, particlesMat);
        particles.position.y = 0;
        this.scene.add(particles);
        this.sceneObjects.particles = particles;
    }
    
    setupEventListeners() {
        // Resize
        window.addEventListener('resize', () => this.onResize());
        
        // Visit Shop button
        const visitBtn = document.getElementById('visitShopBtn');
        if (visitBtn) {
            visitBtn.addEventListener('click', () => {
                if (!this.isAnimating) {
                    this.playVisitShop();
                }
            });
        }
        
        // Delivery Truck button
        const truckBtn = document.getElementById('deliveryTruckBtn');
        if (truckBtn) {
            truckBtn.addEventListener('click', () => {
                if (!this.isAnimating) {
                    this.playDeliveryTruck();
                }
            });
        }
        
        // Click on scene to replay
        this.container.addEventListener('click', () => {
            if (this.animationComplete && !this.isAnimating) {
                // Replay last animation
                if (this.lastAnimation === 'visitShop') {
                    this.playVisitShop();
                } else if (this.lastAnimation === 'deliveryTruck') {
                    this.playDeliveryTruck();
                } else {
                    this.playVisitShop();
                }
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === '1') {
                this.playVisitShop();
            } else if (e.key === '2') {
                this.playDeliveryTruck();
            }
        });
    }
    
    playVisitShop() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.animationComplete = false;
        this.lastAnimation = 'visitShop';
        this.animationType = 'visitShop';
        
        this.updateStatus('🏪', 'Entering the shop...', 0);
        this.showReplayIndicator(false);
        
        // Reset character position
        const character = this.sceneObjects.character;
        if (character) {
            character.position.set(-1, -0.2, 0.5);
        }
        
        // Animate camera to shop
        this.animateCamera('shop', 2, () => {
            // Step 1: Door opens
            this.updateStatus('🚪', 'Opening shop door...', 15);
            this.animateDoor(true, () => {
                // Step 2: Character walks in
                this.updateStatus('🚶', 'Customer walking in...', 30);
                this.animateCharacterWalk(0, 0.5, () => {
                    // Step 3: Look at products
                    this.updateStatus('👀', 'Browsing products...', 45);
                    this.animateCharacterLookAround(() => {
                        // Step 4: Pick products
                        this.updateStatus('🛒', 'Selecting products...', 55);
                        this.animateCharacterPickProducts(() => {
                            // Step 5: Carry bags
                            this.updateStatus('🛍️', 'Carrying shopping bags...', 70);
                            this.animateCharacterCarryBags(() => {
                                // Step 6: Checkout
                                this.updateStatus('💰', 'Processing payment...', 80);
                                this.animateCheckout(() => {
                                    // Step 7: Purchase complete
                                    this.updateStatus('✅', 'Purchase Completed! 🎉', 95);
                                    this.animateCelebration(() => {
                                        this.isAnimating = false;
                                        this.animationComplete = true;
                                        this.updateStatus('🏪', 'Welcome to BSSShop! 🛍️', 100);
                                        this.showReplayIndicator(true);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }
    
    playDeliveryTruck() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.animationComplete = false;
        this.lastAnimation = 'deliveryTruck';
        this.animationType = 'deliveryTruck';
        
        this.updateStatus('🚚', 'Starting delivery...', 0);
        this.showReplayIndicator(false);
        
        // Reset truck position
        const truck = this.sceneObjects.truck;
        if (truck) {
            truck.position.set(-5, -0.2, 2);
            truck.rotation.y = 0;
        }
        
        this.animateCamera('delivery', 2, () => {
            // Step 1: Truck starts
            this.updateStatus('🚚', 'Truck engine starting...', 10);
            setTimeout(() => {
                // Step 2: Truck drives
                this.updateStatus('🚚', 'Truck driving through city...', 25);
                this.animateTruckDrive(() => {
                    // Step 3: Truck arrives
                    this.updateStatus('📦', 'Truck arrived at destination!', 40);
                    this.animateTruckArrive(() => {
                        // Step 4: Driver unloads
                        this.updateStatus('📦', 'Unloading parcel...', 55);
                        this.animateUnloadParcel(() => {
                            // Step 5: Customer receives
                            this.updateStatus('🎁', 'Customer receiving package...', 70);
                            this.animateCustomerReceive(() => {
                                // Step 6: Open parcel
                                this.updateStatus('🎁', 'Opening parcel...', 85);
                                this.animateOpenParcel(() => {
                                    // Step 7: Happy customer
                                    this.updateStatus('😊', 'Order Delivered! 🎉', 95);
                                    this.animateHappyCustomer(() => {
                                        this.isAnimating = false;
                                        this.animationComplete = true;
                                        this.updateStatus('🚚', 'Delivery Complete! 🛍️', 100);
                                        this.showReplayIndicator(true);
                                    });
                                });
                            });
                        });
                    });
                });
            }, 500);
        });
    }
    
    animateCamera(target, duration, callback) {
        const targetPos = this.cameraTargets[target];
        if (!targetPos) { if (callback) callback(); return; }
        
        const startPos = this.camera.position.clone();
        const endPos = targetPos.position.clone();
        const startLook = new THREE.Vector3(0, 0, 0);
        const endLook = targetPos.lookAt.clone();
        
        const startTime = this.clock.getElapsedTime();
        const animateCam = () => {
            const elapsed = this.clock.getElapsedTime() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = this.easeInOutCubic(progress);
            
            this.camera.position.lerpVectors(startPos, endPos, ease);
            this.camera.lookAt(
                startLook.x + (endLook.x - startLook.x) * ease,
                startLook.y + (endLook.y - startLook.y) * ease,
                startLook.z + (endLook.z - startLook.z) * ease
            );
            
            if (progress < 1) {
                requestAnimationFrame(animateCam);
            } else {
                if (callback) callback();
            }
        };
        animateCam();
    }
    
    animateDoor(open, callback) {
        const door = this.sceneObjects.shopDoor;
        if (!door) { if (callback) callback(); return; }
        
        const targetRot = open ? -Math.PI / 3 : 0;
        const startRot = door.rotation.y;
        const duration = 800;
        const startTime = Date.now();
        
        const animateDoorOpen = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = this.easeInOutCubic(progress);
            
            door.rotation.y = startRot + (targetRot - startRot) * ease;
            
            if (progress < 1) {
                requestAnimationFrame(animateDoorOpen);
            } else {
                if (callback) callback();
            }
        };
        animateDoorOpen();
    }
    
    animateCharacterWalk(targetX, targetZ, callback) {
        const character = this.sceneObjects.character;
        if (!character) { if (callback) callback(); return; }
        
        const startX = character.position.x;
        const startZ = character.position.z;
        const duration = 2000;
        const startTime = Date.now();
        let stepCount = 0;
        
        const animateWalk = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = this.easeInOutCubic(progress);
            
            character.position.x = startX + (targetX - startX) * ease;
            character.position.z = startZ + (targetZ - startZ) * ease;
            
            // Walking animation
            stepCount += 0.05;
            const legSwing = Math.sin(stepCount) * 0.2;
            if (this.sceneObjects.leftLeg) {
                this.sceneObjects.leftLeg.rotation.x = legSwing;
            }
            if (this.sceneObjects.rightLeg) {
                this.sceneObjects.rightLeg.rotation.x = -legSwing;
            }
            
            // Body bob
            character.position.y = -0.2 + Math.abs(Math.sin(stepCount)) * 0.02;
            
            if (progress < 1) {
                requestAnimationFrame(animateWalk);
            } else {
                // Reset legs
                if (this.sceneObjects.leftLeg) {
                    this.sceneObjects.leftLeg.rotation.x = 0;
                }
                if (this.sceneObjects.rightLeg) {
                    this.sceneObjects.rightLeg.rotation.x = 0;
                }
                character.position.y = -0.2;
                if (callback) callback();
            }
        };
        animateWalk();
    }
    
    animateCharacterLookAround(callback) {
        const head = this.sceneObjects.head;
        if (!head) { if (callback) callback(); return; }
        
        const duration = 1500;
        const startTime = Date.now();
        
        const animateLook = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            head.rotation.y = Math.sin(progress * Math.PI * 2) * 0.3;
            head.rotation.x = Math.sin(progress * Math.PI * 1.5) * 0.1;
            
            if (progress < 1) {
                requestAnimationFrame(animateLook);
            } else {
                head.rotation.y = 0;
                head.rotation.x = 0;
                if (callback) callback();
            }
        };
        animateLook();
    }
    
    animateCharacterPickProducts(callback) {
        const leftArm = this.sceneObjects.leftArm;
        const rightArm = this.sceneObjects.rightArm;
        if (!leftArm || !rightArm) { if (callback) callback(); return; }
        
        // Show shopping bag
        if (this.sceneObjects.shoppingBag) {
            this.sceneObjects.shoppingBag.visible = true;
        }
        
        const duration = 2000;
        const startTime = Date.now();
        
        const animatePick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = this.easeInOutCubic(progress);
            
            // Arms reach out and pick products
            if (progress < 0.5) {
                const p = progress / 0.5;
                const armAngle = p * -Math.PI / 2.5;
                leftArm.rotation.x = armAngle;
                rightArm.rotation.x = armAngle;
                leftArm.rotation.z = -0.1 * p;
                rightArm.rotation.z = 0.1 * p;
            } else {
                const p = (progress - 0.5) / 0.5;
                const armAngle = -Math.PI / 2.5 * (1 - p);
                leftArm.rotation.x = armAngle;
                rightArm.rotation.x = armAngle;
                leftArm.rotation.z = -0.1 * (1 - p);
                rightArm.rotation.z = 0.1 * (1 - p);
            }
            
            // Animate bag position
            if (this.sceneObjects.shoppingBag) {
                const bagP = Math.min(progress * 1.5, 1);
                this.sceneObjects.shoppingBag.position.y = 0.6 + bagP * 0.1;
            }
            
            if (progress < 1) {
                requestAnimationFrame(animatePick);
            } else {
                leftArm.rotation.x = 0;
                leftArm.rotation.z = 0;
                rightArm.rotation.x = 0;
                rightArm.rotation.z = 0;
                if (callback) callback();
            }
        };
        animatePick();
    }
    
    animateCharacterCarryBags(callback) {
        const leftArm = this.sceneObjects.leftArm;
        const rightArm = this.sceneObjects.rightArm;
        if (!leftArm || !rightArm) { if (callback) callback(); return; }
        
        // Show both bags
        if (this.sceneObjects.shoppingBag2) {
            this.sceneObjects.shoppingBag2.visible = true;
        }
        
        const duration = 1500;
        const startTime = Date.now();
        
        const animateCarry = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = this.easeInOutCubic(progress);
            
            // Arms holding bags
            const armAngle = -0.3 * ease;
            leftArm.rotation.x = armAngle;
            leftArm.rotation.z = -0.2 * ease;
            rightArm.rotation.x = armAngle;
            rightArm.rotation.z = 0.2 * ease;
            
            // Bags bob
            if (this.sceneObjects.shoppingBag) {
                this.sceneObjects.shoppingBag.position.y = 0.6 + Math.sin(elapsed * 0.003) * 0.02;
            }
            if (this.sceneObjects.shoppingBag2) {
                this.sceneObjects.shoppingBag2.position.y = 0.6 + Math.sin(elapsed * 0.003 + 1) * 0.02;
            }
            
            if (progress < 1) {
                requestAnimationFrame(animateCarry);
            } else {
                if (callback) callback();
            }
        };
        animateCarry();
    }
    
    animateCheckout(callback) {
        // Flash effect on store
        const store = this.sceneObjects.shop;
        if (store) {
            const duration = 1000;
            const startTime = Date.now();
            
            const animateFlash = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const intensity = 0.3 + Math.sin(progress * Math.PI * 4) * 0.5;
                
                store.children.forEach(child => {
                    if (child.material && child.material.emissiveIntensity !== undefined) {
                        child.material.emissiveIntensity = intensity;
                    }
                });
                
                if (progress < 1) {
                    requestAnimationFrame(animateFlash);
                } else {
                    store.children.forEach(child => {
                        if (child.material && child.material.emissiveIntensity !== undefined) {
                            child.material.emissiveIntensity = 0.3;
                        }
                    });
                    if (callback) callback();
                }
            };
            animateFlash();
        } else {
            if (callback) callback();
        }
    }
    
    animateCelebration(callback) {
        const character = this.sceneObjects.character;
        if (!character) { if (callback) callback(); return; }
        
        const duration = 1500;
        const startTime = Date.now();
        
        const animateCelebrate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Happy bounce
            character.position.y = -0.2 + Math.abs(Math.sin(elapsed * 0.005)) * 0.08;
            
            // Raise arms
            if (this.sceneObjects.leftArm && this.sceneObjects.rightArm) {
                const armRaise = Math.sin(elapsed * 0.003) * 0.5 + 0.5;
                this.sceneObjects.leftArm.rotation.x = -armRaise * 0.8;
                this.sceneObjects.rightArm.rotation.x = -armRaise * 0.8;
                this.sceneObjects.leftArm.rotation.z = -0.2;
                this.sceneObjects.rightArm.rotation.z = 0.2;
            }
            
            if (progress < 1) {
                requestAnimationFrame(animateCelebrate);
            } else {
                character.position.y = -0.2;
                if (callback) callback();
            }
        };
        animateCelebrate();
    }
    
    animateTruckDrive(callback) {
        const truck = this.sceneObjects.truck;
        if (!truck) { if (callback) callback(); return; }
        
        const startX = truck.position.x;
        const endX = 2;
        const duration = 3000;
        const startTime = Date.now();
        
        const animateDrive = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = this.easeInOutCubic(progress);
            
            truck.position.x = startX + (endX - startX) * ease;
            
            // Rotate wheels
            if (this.sceneObjects.truckWheels) {
                this.sceneObjects.truckWheels.forEach(wheel => {
                    wheel.rotation.x += 0.05;
                });
            }
            
            // Truck bounce
            truck.position.y = -0.2 + Math.sin(elapsed * 0.01) * 0.02;
            
            if (progress < 1) {
                requestAnimationFrame(animateDrive);
            } else {
                truck.position.y = -0.2;
                if (callback) callback();
            }
        };
        animateDrive();
    }
    
    animateTruckArrive(callback) {
        // Brake lights
        const truck = this.sceneObjects.truck;
        if (truck) {
            // Small brake effect
            truck.position.x += 0.1;
            setTimeout(() => {
                truck.position.x -= 0.1;
            }, 200);
        }
        setTimeout(callback, 500);
    }
    
    animateUnloadParcel(callback) {
        const parcel = this.sceneObjects.truckParcel;
        if (!parcel) { if (callback) callback(); return; }
        
        const duration = 1500;
        const startTime = Date.now();
        const startY = parcel.position.y;
        
        const animateUnload = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = this.easeInOutCubic(progress);
            
            parcel.position.y = startY - ease * 0.8;
            parcel.position.x = -0.5 + ease * 0.5;
            
            if (progress < 1) {
                requestAnimationFrame(animateUnload);
            } else {
                if (callback) callback();
            }
        };
        animateUnload();
    }
    
    animateCustomerReceive(callback) {
        // Bring parcel to customer position
        const parcel = this.sceneObjects.truckParcel;
        const character = this.sceneObjects.character;
        if (!parcel || !character) { if (callback) callback(); return; }
        
        const duration = 1500;
        const startTime = Date.now();
        const startPos = parcel.position.clone();
        const endPos = new THREE.Vector3(
            character.position.x + 0.3,
            character.position.y + 0.8,
            character.position.z + 0.2
        );
        
        const animateReceive = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = this.easeInOutCubic(progress);
            
            parcel.position.lerpVectors(startPos, endPos, ease);
            
            if (progress < 1) {
                requestAnimationFrame(animateReceive);
            } else {
                if (callback) callback();
            }
        };
        animateReceive();
    }
    
    animateOpenParcel(callback) {
        const parcel = this.sceneObjects.truckParcel;
        if (!parcel) { if (callback) callback(); return; }
        
        const duration = 1500;
        const startTime = Date.now();
        
        const animateOpen = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Parcel opens (scale up and rotate)
            parcel.scale.setScalar(1 + progress * 0.5);
            parcel.rotation.y = progress * Math.PI * 2;
            
            // Sparkle effect (change color)
            if (parcel.material) {
                const hue = (progress * 0.5) % 1;
                parcel.material.color.setHSL(hue, 0.8, 0.5);
            }
            
            if (progress < 1) {
                requestAnimationFrame(animateOpen);
            } else {
                parcel.scale.setScalar(1);
                parcel.rotation.y = 0;
                if (callback) callback();
            }
        };
        animateOpen();
    }
    
    animateHappyCustomer(callback) {
        const character = this.sceneObjects.character;
        if (!character) { if (callback) callback(); return; }
        
        const duration = 1500;
        const startTime = Date.now();
        
        const animateHappy = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Jump
            character.position.y = -0.2 + Math.abs(Math.sin(elapsed * 0.008)) * 0.1;
            
            // Arms up
            if (this.sceneObjects.leftArm && this.sceneObjects.rightArm) {
                this.sceneObjects.leftArm.rotation.x = -1.5 + Math.sin(elapsed * 0.005) * 0.3;
                this.sceneObjects.rightArm.rotation.x = -1.5 + Math.sin(elapsed * 0.005 + 1) * 0.3;
            }
            
            if (progress < 1) {
                requestAnimationFrame(animateHappy);
            } else {
                character.position.y = -0.2;
                if (callback) callback();
            }
        };
        animateHappy();
    }
    
    updateStatus(icon, text, progress) {
        const iconEl = document.getElementById('statusIcon');
        const textEl = document.getElementById('statusText');
        const progressBar = document.getElementById('statusProgressBar');
        
        if (iconEl) iconEl.textContent = icon;
        if (textEl) textEl.textContent = text;
        if (progressBar) progressBar.style.width = progress + '%';
    }
    
    showReplayIndicator(show) {
        const indicator = document.getElementById('replayIndicator');
        if (indicator) {
            if (show) {
                indicator.classList.add('visible');
            } else {
                indicator.classList.remove('visible');
            }
        }
    }
    
    easeInOutCubic(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();
        
        // Animate particles
        if (this.sceneObjects.particles) {
            this.sceneObjects.particles.rotation.y += delta * 0.02;
        }
        
        // Animate store float
        if (this.sceneObjects.shop) {
            this.sceneObjects.shop.position.y = Math.sin(time * 0.3) * 0.03;
        }
        
        // Animate character idle
        if (!this.isAnimating && this.sceneObjects.character) {
            const char = this.sceneObjects.character;
            char.position.y = -0.2 + Math.sin(time * 0.5) * 0.01;
            
            if (this.sceneObjects.leftArm && this.sceneObjects.rightArm) {
                // Gentle idle sway
                const sway = Math.sin(time * 0.5) * 0.02;
                this.sceneObjects.leftArm.rotation.z = -0.05 + sway;
                this.sceneObjects.rightArm.rotation.z = 0.05 - sway;
            }
        }
        
        // Animate truck idle
        if (this.sceneObjects.truck && !this.isAnimating) {
            const truck = this.sceneObjects.truck;
            if (truck.position.x < -4) {
                // Gentle bounce
                truck.position.y = -0.2 + Math.sin(time * 0.5) * 0.01;
            }
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
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('three-container-cinematic');
    if (container) {
        window.cinematicScene = new CinematicEcommerceScene('three-container-cinematic');
    }
});