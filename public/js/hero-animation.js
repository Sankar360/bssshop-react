/* public/assets/js/hero-animation.js */

class ApplePremiumHero {
    constructor() {
        this.isAnimating = false;
        this.animationComplete = false;
        this.hoverTimelines = {};
        this.priceValues = {
            1: 0,
            2: 0,
            3: 0
        };
        this.maxPrices = {
            1: 450,
            2: 480,
            3: 420
        };
        this.personData = {
            1: {
                products: ['💻', '📱', '⌚', '🎧', '📷'],
                names: ['Laptop', 'Phone', 'Watch', 'Headphones', 'Camera'],
                prices: [100, 80, 50, 40, 180],
                label: 'Electronics'
            },
            2: {
                products: ['👟', '👜', '🧴', '📋', '🎧'],
                names: ['Shoes', 'Bag', 'Perfume', 'Tablet', 'Headphones'],
                prices: [120, 90, 60, 110, 100],
                label: 'Fashion'
            },
            3: {
                products: ['☕', '🌿', '🍳', '🔊', '📱'],
                names: ['Coffee Machine', 'Plant', 'Kitchen Items', 'Speaker', 'Phone'],
                prices: [150, 40, 80, 70, 180],
                label: 'Home'
            }
        };
        
        // DOM Elements - with null checks
        this.persons = {
            1: document.getElementById('person1'),
            2: document.getElementById('person2'),
            3: document.getElementById('person3')
        };
        this.baskets = {
            1: document.getElementById('basketProducts1'),
            2: document.getElementById('basketProducts2'),
            3: document.getElementById('basketProducts3')
        };
        this.smiles = {
            1: document.getElementById('smile1'),
            2: document.getElementById('smile2'),
            3: document.getElementById('smile3')
        };
        this.prices = {
            1: document.getElementById('price1'),
            2: document.getElementById('price2'),
            3: document.getElementById('price3')
        };
        this.welcomeMsg = document.getElementById('welcomeMessage');
        this.statusIcon = document.getElementById('statusIcon');
        this.statusText = document.getElementById('statusText');
        this.statusProgressBar = document.getElementById('statusProgressBar');
        
        // Initialize
        this.init();
    }
    
    init() {
        // Check if GSAP is loaded
        if (typeof gsap === 'undefined') {
            console.error('GSAP is not loaded');
            return;
        }
        
        // Check if all required elements exist
        const allElementsExist = this.checkElements();
        if (!allElementsExist) {
            console.warn('Some elements are missing, animation may not work correctly');
            return;
        }
        
        try {
            // Set initial states - only if elements exist
            this.safeSet(this.persons[1], { opacity: 0, y: 30, scale: 0.95 });
            this.safeSet(this.persons[2], { opacity: 0, y: 30, scale: 0.95 });
            this.safeSet(this.persons[3], { opacity: 0, y: 30, scale: 0.95 });
            this.safeSet(this.smiles[1], { opacity: 0, scale: 0 });
            this.safeSet(this.smiles[2], { opacity: 0, scale: 0 });
            this.safeSet(this.smiles[3], { opacity: 0, scale: 0 });
            this.safeSet(this.welcomeMsg, { opacity: 0, y: 30 });
            
            // Hide all product icons initially
            document.querySelectorAll('.product-icon').forEach(el => {
                if (el) {
                    gsap.set(el, { opacity: 0, scale: 0 });
                }
            });
            
            // Setup hover events
            this.setupHoverEvents();
            
            // Start animation
            setTimeout(() => {
                this.playAnimation();
            }, 800);
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }
    
    checkElements() {
        // Check all required elements
        const requiredElements = [
            this.persons[1], this.persons[2], this.persons[3],
            this.baskets[1], this.baskets[2], this.baskets[3],
            this.smiles[1], this.smiles[2], this.smiles[3],
            this.prices[1], this.prices[2], this.prices[3],
            this.welcomeMsg
        ];
        
        let allExist = true;
        requiredElements.forEach((el, index) => {
            if (!el) {
                console.warn(`Element at index ${index} is missing`);
                allExist = false;
            }
        });
        
        return allExist;
    }
    
    safeSet(target, properties) {
        if (target && typeof gsap !== 'undefined') {
            try {
                gsap.set(target, properties);
            } catch (e) {
                console.warn('GSAP set failed for target:', target, e);
            }
        }
    }
    
    safeTo(target, properties) {
        if (target && typeof gsap !== 'undefined') {
            try {
                return gsap.to(target, properties);
            } catch (e) {
                console.warn('GSAP to failed for target:', target, e);
                return null;
            }
        }
        return null;
    }
    
    updateStatus(icon, text, progress) {
        if (this.statusIcon) this.statusIcon.textContent = icon || '✨';
        if (this.statusText) this.statusText.textContent = text || 'Loading...';
        if (this.statusProgressBar) {
            this.statusProgressBar.style.width = (progress || 0) + '%';
        }
    }
    
    playAnimation() {
        if (this.isAnimating) return;
        if (typeof gsap === 'undefined') {
            console.error('GSAP not available');
            return;
        }
        
        // Check if all elements exist
        if (!this.persons[1] || !this.persons[2] || !this.persons[3]) {
            console.error('Required DOM elements not found');
            return;
        }
        
        this.isAnimating = true;
        this.animationComplete = false;
        
        this.updateStatus('✨', 'Loading experience...', 0);
        
        try {
            // Create master timeline
            const tl = gsap.timeline({
                onComplete: () => {
                    this.isAnimating = false;
                    this.animationComplete = true;
                    this.updateStatus('🎉', 'Welcome to BSSShop!', 100);
                    if (this.welcomeMsg) {
                        gsap.to(this.welcomeMsg, {
                            duration: 1,
                            opacity: 1,
                            y: 0,
                            ease: 'power2.out'
                        });
                    }
                },
                defaults: { ease: 'power2.inOut' }
            });
            
            // === PERSON 1 ===
            this.updateStatus('👨', 'Person 1 arriving...', 5);
            if (this.persons[1]) {
                tl.to(this.persons[1], {
                    duration: 1,
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    ease: 'power2.out'
                });
            }
            
            tl.call(() => {
                this.updateStatus('💻', 'Adding products to basket...', 15);
            });
            
            tl.add(() => this.addProductsToBasket(1, tl), '-=0.2');
            
            // Person 1 smiles
            tl.call(() => {
                this.updateStatus('😊', 'Basket full!', 30);
            });
            if (this.smiles[1]) {
                tl.to(this.smiles[1], {
                    duration: 0.6,
                    opacity: 1,
                    scale: 1,
                    ease: 'back.out(1.7)'
                });
            }
            
            // === PERSON 2 ===
            tl.call(() => {
                this.updateStatus('👩', 'Person 2 arriving...', 35);
            });
            if (this.persons[2]) {
                tl.to(this.persons[2], {
                    duration: 1,
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    ease: 'power2.out'
                });
            }
            
            tl.call(() => {
                this.updateStatus('👟', 'Adding products to basket...', 45);
            });
            
            tl.add(() => this.addProductsToBasket(2, tl), '-=0.2');
            
            // Person 2 smiles
            tl.call(() => {
                this.updateStatus('😊', 'Basket full!', 60);
            });
            if (this.smiles[2]) {
                tl.to(this.smiles[2], {
                    duration: 0.6,
                    opacity: 1,
                    scale: 1,
                    ease: 'back.out(1.7)'
                });
            }
            
            // === PERSON 3 ===
            tl.call(() => {
                this.updateStatus('👨', 'Person 3 arriving...', 65);
            });
            if (this.persons[3]) {
                tl.to(this.persons[3], {
                    duration: 1,
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    ease: 'power2.out'
                });
            }
            
            tl.call(() => {
                this.updateStatus('☕', 'Adding products to basket...', 75);
            });
            
            tl.add(() => this.addProductsToBasket(3, tl), '-=0.2');
            
            // Person 3 smiles
            tl.call(() => {
                this.updateStatus('😊', 'Basket full!', 90);
            });
            if (this.smiles[3]) {
                tl.to(this.smiles[3], {
                    duration: 0.6,
                    opacity: 1,
                    scale: 1,
                    ease: 'back.out(1.7)'
                });
            }
            
            // All people gentle float - only if all exist
            const allPersons = [];
            if (this.persons[1]) allPersons.push(this.persons[1]);
            if (this.persons[2]) allPersons.push(this.persons[2]);
            if (this.persons[3]) allPersons.push(this.persons[3]);
            
            if (allPersons.length > 0) {
                tl.to(allPersons, {
                    duration: 2,
                    y: -8,
                    yoyo: true,
                    repeat: -1,
                    ease: 'sine.inOut'
                }, '-=0.5');
            }
            
        } catch (error) {
            console.error('Error during animation:', error);
            this.isAnimating = false;
        }
    }
    
    addProductsToBasket(personId, masterTl) {
        const basket = this.baskets[personId];
        if (!basket) return;
        
        const productIcons = basket.querySelectorAll('.product-icon');
        const data = this.personData[personId];
        let totalPrice = 0;
        const priceEl = this.prices[personId];
        
        if (productIcons.length === 0) {
            console.warn(`No product icons found for person ${personId}`);
            return;
        }
        
        // Create a sub-timeline for adding products
        const tl = gsap.timeline();
        
        productIcons.forEach((icon, index) => {
            if (!icon) return;
            
            // Stagger the appearance
            tl.to(icon, {
                duration: 0.4,
                opacity: 1,
                scale: 1,
                ease: 'back.out(1.7)',
                delay: index * 0.3
            })
            .call(() => {
                // Update price counter
                totalPrice += data.prices[index];
                this.priceValues[personId] = totalPrice;
                
                // Update price display - use DOM manipulation instead of GSAP textContent
                if (priceEl) {
                    priceEl.textContent = '$' + totalPrice;
                    if (totalPrice >= this.maxPrices[personId]) {
                        priceEl.classList.add('active');
                    }
                }
            }, '-=0.1')
            // Product lift effect
            .to(icon, {
                duration: 0.15,
                y: -5,
                yoyo: true,
                repeat: 1,
                ease: 'power2.out'
            }, '-=0.2');
        });
        
        // Add to master timeline
        masterTl.add(tl, '-=0.2');
    }
    
    setupHoverEvents() {
        [1, 2, 3].forEach(personId => {
            const person = this.persons[personId];
            if (!person) return;
            
            person.addEventListener('mouseenter', () => {
                if (this.animationComplete) {
                    this.playHoverAnimation(personId);
                }
            });
            
            person.addEventListener('mouseleave', () => {
                if (this.hoverTimelines[personId]) {
                    try {
                        this.hoverTimelines[personId].reverse();
                    } catch (e) {
                        // Ignore errors on reverse
                    }
                }
            });
        });
    }
    
    playHoverAnimation(personId) {
        // Kill any existing hover timeline
        if (this.hoverTimelines[personId]) {
            try {
                this.hoverTimelines[personId].kill();
            } catch (e) {
                // Ignore kill errors
            }
        }
        
        const basket = this.baskets[personId];
        const icons = basket ? basket.querySelectorAll('.product-icon') : [];
        const priceEl = this.prices[personId];
        const person = this.persons[personId];
        const data = this.personData[personId];
        let currentPrice = this.priceValues[personId] || 0;
        
        if (icons.length === 0 || !person) return;
        
        const tl = gsap.timeline({
            defaults: { ease: 'power2.inOut' }
        });
        
        // Products lift slightly
        icons.forEach((icon, i) => {
            if (icon) {
                tl.to(icon, {
                    duration: 0.3,
                    y: -8,
                    delay: i * 0.05,
                    ease: 'power2.out'
                });
            }
        });
        
        // New product drops in
        tl.call(() => {
            // Add a new random product
            const newIndex = Math.floor(Math.random() * icons.length);
            const icon = icons[newIndex];
            const newPrice = data.prices[newIndex] || 50;
            
            if (icon) {
                // Show a flash effect
                gsap.to(icon, {
                    duration: 0.1,
                    scale: 1.3,
                    yoyo: true,
                    repeat: 1,
                    ease: 'power2.out'
                });
            }
            
            // Update price - use DOM manipulation
            currentPrice += newPrice;
            this.priceValues[personId] = currentPrice;
            if (priceEl) {
                priceEl.textContent = '$' + currentPrice;
                if (currentPrice >= this.maxPrices[personId]) {
                    priceEl.classList.add('active');
                }
            }
        })
        .delay(0.3);
        
        // Glow effect
        tl.to(person, {
            duration: 0.5,
            boxShadow: '0 0 60px rgba(99, 102, 241, 0.2)',
            ease: 'power2.out'
        });
        
        // Products return
        icons.forEach((icon) => {
            if (icon) {
                tl.to(icon, {
                    duration: 0.3,
                    y: 0,
                    ease: 'power2.in'
                }, '-=0.5');
            }
        });
        
        // Remove glow
        tl.to(person, {
            duration: 0.5,
            boxShadow: 'none',
            ease: 'power2.in'
        });
        
        this.hoverTimelines[personId] = tl;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if GSAP is loaded
    if (typeof gsap !== 'undefined') {
        try {
            window.heroAnimation = new ApplePremiumHero();
        } catch (error) {
            console.error('Failed to initialize hero animation:', error);
        }
    } else {
        console.warn('GSAP not loaded, loading now...');
        // Load GSAP if not available
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
        script.onload = () => {
            try {
                window.heroAnimation = new ApplePremiumHero();
            } catch (error) {
                console.error('Failed to initialize hero animation after GSAP load:', error);
            }
        };
        script.onerror = () => {
            console.error('Failed to load GSAP');
        };
        document.head.appendChild(script);
    }
});

// Fallback if DOMContentLoaded already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(function() {
        if (typeof gsap !== 'undefined' && !window.heroAnimation) {
            try {
                window.heroAnimation = new ApplePremiumHero();
            } catch (error) {
                console.error('Failed to initialize hero animation (fallback):', error);
            }
        }
    }, 500);
}