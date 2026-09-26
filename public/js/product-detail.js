/**
 * ============================================================
 * PRODUCT DETAIL PAGE - Complete Script (Pure JS)
 * ============================================================
 */

(function() {
    'use strict';

    // ============================================================
    // CONFIGURATION - Load from data attributes
    // ============================================================
    const configElement = document.getElementById('productConfig');
    
    const CONFIG = {
        baseUrl: configElement?.dataset.baseUrl || '',
        productId: parseInt(configElement?.dataset.productId) || 0,
        csrfToken: configElement?.dataset.csrfToken || '',
        csrfName: configElement?.dataset.csrfName || 'csrf_test_name',
        defaultImage: configElement?.dataset.defaultImage || '/assets/images/default-product.jpg',
        productName: configElement?.dataset.productName || 'Product',
        isLoggedIn: configElement?.dataset.isLoggedIn === 'true',
        loginUrl: configElement?.dataset.loginUrl || '/auth/login',
        checkoutUrl: configElement?.dataset.checkoutUrl || '/checkout',
        variantEndpoint: configElement?.dataset.variantEndpoint || '/product/findVariant',
        cartEndpoint: configElement?.dataset.cartEndpoint || '/cart/add',
        wishlistEndpoint: configElement?.dataset.wishlistEndpoint || '/wishlist/toggle'
    };

    // ============================================================
    // STATE
    // ============================================================
    const state = {
        currentVariant: null,
        isLoading: false,
        quantity: 1,
        isCartProcessing: false,
        isWishlistProcessing: false,
        isInitialLoad: true
    };

    // ============================================================
    // DOM CACHE
    // ============================================================
    const DOM = {};

    function cacheDomElements() {
        DOM.productContainer = document.querySelector('.product-detail-container');
        DOM.variantSelects = document.querySelectorAll('.variant-select') || [];
        DOM.colorOptions = document.querySelectorAll('.color-option') || [];
        DOM.mainImage = document.getElementById('mainProductImage');
        DOM.thumbnailContainer = document.getElementById('thumbnailContainer');
        DOM.thumbnailBtns = document.querySelectorAll('.thumbnail-btn') || [];
        DOM.priceContainer = document.getElementById('priceContainer');
        DOM.stockContainer = document.getElementById('stockContainer');
        DOM.productTitle = document.getElementById('productTitle');
        DOM.skuElement = document.querySelector('.product-sku span:first-child');
        DOM.ratingStars = document.querySelector('.stars');
        DOM.ratingValue = document.querySelector('.rating-value');
        DOM.quantityInput = document.getElementById('quantityInput');
        DOM.qtyMinus = document.getElementById('qtyMinus');
        DOM.qtyPlus = document.getElementById('qtyPlus');
        DOM.addToCartBtn = document.getElementById('addToCartBtn');
        DOM.buyNowBtn = document.getElementById('buyNowBtn');
        DOM.wishlistBtns = document.querySelectorAll('.wishlist-btn, .related-wishlist') || [];
        DOM.variantContainer = document.getElementById('variantContainer');
        DOM.cartCountElements = document.querySelectorAll('.cart-count, .cart-badge') || [];
        DOM.wishlistCountElements = document.querySelectorAll('.wishlist-count') || [];
    }

    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================

    function escapeHtml(value) {
        if (!value) return '';
        const div = document.createElement('div');
        div.textContent = value;
        return div.innerHTML;
    }

    function formatPrice(value) {
        return Number(value).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function getImageUrl(image) {
        if (!image) return CONFIG.defaultImage;
        if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/')) {
            return image;
        }
        return CONFIG.baseUrl + '/' + image.replace(/^\/+/, '');
    }

    function getCsrfToken() {
        const tokenInput = document.querySelector('input[name="' + CONFIG.csrfName + '"]');
        return tokenInput ? tokenInput.value : CONFIG.csrfToken;
    }

    function buildFormData(data) {
        const formData = new URLSearchParams();
        formData.append(CONFIG.csrfName, getCsrfToken());
        Object.keys(data).forEach(key => {
            if (data[key] !== undefined && data[key] !== null) {
                formData.append(key, data[key]);
            }
        });
        return formData;
    }

    function debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ============================================================
    // NOTIFICATION
    // ============================================================

    function showNotification(message, type = 'success') {
        const notifications = document.querySelectorAll('.product-notification');
        if (notifications && notifications.length > 0) {
            notifications.forEach(el => el.remove());
        }

        const icons = {
            success: 'bi-check-circle-fill',
            error: 'bi-exclamation-circle-fill',
            warning: 'bi-exclamation-triangle-fill',
            info: 'bi-info-circle-fill'
        };

        const colors = {
            success: '#43e97b',
            error: '#ff6b81',
            warning: '#f6c23e',
            info: '#4facfe'
        };

        const bgColors = {
            success: '#1a2e1a',
            error: '#2d1a1a',
            warning: '#2d2a1a',
            info: '#1a1a2e'
        };

        const notification = document.createElement('div');
        notification.className = 'product-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            transform: translateY(100px);
            opacity: 0;
            transition: all 0.3s ease;
            z-index: 9999;
            max-width: 400px;
            color: white;
            background: ${bgColors[type] || bgColors.success};
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        `;

        notification.innerHTML = `
            <i class="bi ${icons[type] || icons.success}" style="color: ${colors[type] || colors.success}; font-size: 20px;"></i>
            <span>${escapeHtml(message)}</span>
        `;

        document.body.appendChild(notification);

        requestAnimationFrame(() => {
            notification.style.transform = 'translateY(0)';
            notification.style.opacity = '1';
        });

        setTimeout(() => {
            notification.style.transform = 'translateY(100px)';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // ============================================================
    // RATING FUNCTIONS
    // ============================================================

    function updateRating(rating) {
        if (!DOM.ratingStars) return;
        rating = Math.max(0, Math.min(5, parseFloat(rating) || 0));
        
        const fullStars = Math.floor(rating);
        const halfStar = (rating - fullStars) >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        let starsHtml = '';
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<i class="bi bi-star-fill"></i>';
        }
        if (halfStar) {
            starsHtml += '<i class="bi bi-star-half"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<i class="bi bi-star"></i>';
        }
        DOM.ratingStars.innerHTML = starsHtml;
        if (DOM.ratingValue) {
            DOM.ratingValue.textContent = rating.toFixed(1);
        }
    }

    // ============================================================
    // STOCK FUNCTIONS
    // ============================================================

    function updateStock(stock) {
        stock = parseInt(stock) || 0;
        if (!DOM.stockContainer) return;
        
        let stockHtml = '';
        const disabled = stock <= 0;
        
        if (stock > 0) {
            stockHtml = `
                <span class="stock-status in-stock">
                    <i class="bi bi-check-circle-fill"></i>
                    In Stock
                </span>
            `;
            if (stock <= 5) {
                stockHtml += `
                    <span class="stock-low">
                        Only ${stock} left
                    </span>
                `;
            }
        } else {
            stockHtml = `
                <span class="stock-status out-of-stock">
                    <i class="bi bi-x-circle-fill"></i>
                    Out of Stock
                </span>
            `;
        }
        DOM.stockContainer.innerHTML = stockHtml;
        
        if (DOM.quantityInput) {
            DOM.quantityInput.max = stock > 0 ? stock : 0;
            DOM.quantityInput.disabled = disabled;
            if (stock > 0 && parseInt(DOM.quantityInput.value) > stock) {
                DOM.quantityInput.value = stock;
            }
        }
        
        const buttons = [DOM.qtyMinus, DOM.qtyPlus, DOM.addToCartBtn, DOM.buyNowBtn];
        if (buttons && buttons.length > 0) {
            buttons.forEach(btn => {
                if (btn) btn.disabled = disabled;
            });
        }
    }

    // ============================================================
    // PRICE FUNCTIONS
    // ============================================================

    function updatePrice(price, salePrice) {
        if (!DOM.priceContainer) return;
        price = parseFloat(price) || 0;
        salePrice = parseFloat(salePrice) || 0;
        
        let priceHtml = '';
        if (salePrice > 0 && salePrice < price) {
            const discount = Math.round((1 - (salePrice / price)) * 100);
            priceHtml = `
                <span class="price-current" id="currentPrice">
                    $${formatPrice(salePrice)}
                </span>
                <span class="price-original">
                    $${formatPrice(price)}
                </span>
                <span class="discount-badge-small">
                    ${discount}% OFF
                </span>
            `;
        } else {
            priceHtml = `
                <span class="price-current" id="currentPrice">
                    $${formatPrice(price)}
                </span>
            `;
        }
        DOM.priceContainer.innerHTML = priceHtml;
    }

    // ============================================================
    // IMAGE FUNCTIONS
    // ============================================================

    function updateVariantImages(images) {
        if (!DOM.mainImage || !DOM.thumbnailContainer) return;
        DOM.thumbnailContainer.innerHTML = '';
        
        const imageArray = Array.isArray(images) ? images : [];
        const validImages = imageArray.filter(img => img && img.image);
        
        if (validImages.length > 0) {
            validImages.forEach((img, index) => {
                const imageUrl = getImageUrl(img.image);
                const button = document.createElement('button');
                button.className = `thumbnail-btn ${index === 0 ? 'active' : ''}`;
                button.dataset.image = imageUrl;
                button.setAttribute('aria-label', `Product image ${index + 1}`);
                const imgElement = document.createElement('img');
                imgElement.src = imageUrl;
                imgElement.alt = `Product image ${index + 1}`;
                button.appendChild(imgElement);
                DOM.thumbnailContainer.appendChild(button);
            });
            DOM.mainImage.src = getImageUrl(validImages[0].image);
        } else {
            const defaultImage = CONFIG.defaultImage;
            DOM.mainImage.src = defaultImage;
            const button = document.createElement('button');
            button.className = 'thumbnail-btn active';
            button.dataset.image = defaultImage;
            const imgElement = document.createElement('img');
            imgElement.src = defaultImage;
            imgElement.alt = CONFIG.productName + ' thumbnail';
            button.appendChild(imgElement);
            DOM.thumbnailContainer.appendChild(button);
        }
    }

    // ============================================================
    // VARIANT FUNCTIONS
    // ============================================================

    function getSelectedFeatures() {
        const features = {};
        if (DOM.variantSelects && DOM.variantSelects.length > 0) {
            DOM.variantSelects.forEach(select => {
                const featureId = select.dataset.featureId;
                const value = select.value;
                if (featureId && value !== '') {
                    features[featureId] = value;
                }
            });
        }
        if (DOM.colorOptions && DOM.colorOptions.length > 0) {
            DOM.colorOptions.forEach(option => {
                if (option.classList.contains('active')) {
                    const featureId = option.dataset.featureId;
                    const value = option.dataset.value;
                    if (featureId && value) {
                        features[featureId] = value;
                    }
                }
            });
        }
        return features;
    }

    function updateSelectedLabels(variant) {
        if (DOM.variantSelects && DOM.variantSelects.length > 0) {
            DOM.variantSelects.forEach(select => {
                const featureId = select.dataset.featureId;
                const value = select.value;
                const label = document.getElementById('selectedValue_' + featureId);
                if (!label) return;
                const selectedOption = select.querySelector('option:checked');
                const color = selectedOption ? selectedOption.dataset.color : null;
                if (color) {
                    label.innerHTML = `
                        <span class="selected-color-preview" style="
                            display: inline-block;
                            width: 16px;
                            height: 16px;
                            border-radius: 50%;
                            background: ${escapeHtml(color)};
                            border: 1px solid #ccc;
                            vertical-align: middle;
                            margin-right: 6px;
                        "></span>
                        ${escapeHtml(value)}
                    `;
                } else {
                    label.textContent = value || '';
                }
            });
        }
        if (DOM.colorOptions && DOM.colorOptions.length > 0) {
            DOM.colorOptions.forEach(option => {
                const featureId = option.dataset.featureId;
                const value = option.dataset.value;
                if (variant && variant.features && variant.features[featureId] === value) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
        }
    }

    async function findVariant(features) {
        if (state.isLoading) return;
        state.isLoading = true;
        if (DOM.variantContainer) {
            DOM.variantContainer.classList.add('loading');
        }
        
        try {
            const response = await fetch(CONFIG.variantEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: buildFormData({
                    product_id: CONFIG.productId,
                    features: JSON.stringify(features)
                })
            });
            const data = await response.json();
            if (data.variant) {
                updateProductUI(data.variant);
                state.currentVariant = data.variant;
                return data.variant;
            } else {
                if (!state.isInitialLoad) {
                    showNotification('Variant not found', 'warning');
                }
                return null;
            }
        } catch (error) {
            console.error('Error finding variant:', error);
            if (!state.isInitialLoad) {
                showNotification('Failed to load variant. Please try again.', 'error');
            }
            return null;
        } finally {
            state.isLoading = false;
            if (DOM.variantContainer) {
                DOM.variantContainer.classList.remove('loading');
            }
        }
    }

    // ============================================================
    // QUANTITY FUNCTIONS
    // ============================================================

    function updateQuantity(value) {
        if (!DOM.quantityInput) return;
        let val = parseInt(value) || 1;
        const min = parseInt(DOM.quantityInput.min) || 1;
        const max = parseInt(DOM.quantityInput.max) || 999;
        val = Math.max(min, Math.min(max, val));
        DOM.quantityInput.value = val;
        state.quantity = val;
        DOM.quantityInput.dispatchEvent(new Event('change'));
    }

    function attachQuantityEvents() {
        DOM.quantityInput = document.getElementById('quantityInput');
        DOM.qtyMinus = document.getElementById('qtyMinus');
        DOM.qtyPlus = document.getElementById('qtyPlus');
        
        if (DOM.qtyMinus) {
            const newQtyMinus = DOM.qtyMinus.cloneNode(true);
            DOM.qtyMinus.parentNode.replaceChild(newQtyMinus, DOM.qtyMinus);
            DOM.qtyMinus = newQtyMinus;
            DOM.qtyMinus.addEventListener('click', function() {
                const current = parseInt(DOM.quantityInput?.value) || 1;
                if (current > 1) {
                    updateQuantity(current - 1);
                }
            });
        }
        
        if (DOM.qtyPlus) {
            const newQtyPlus = DOM.qtyPlus.cloneNode(true);
            DOM.qtyPlus.parentNode.replaceChild(newQtyPlus, DOM.qtyPlus);
            DOM.qtyPlus = newQtyPlus;
            DOM.qtyPlus.addEventListener('click', function() {
                const current = parseInt(DOM.quantityInput?.value) || 1;
                const max = parseInt(DOM.quantityInput?.max) || 999;
                if (current < max) {
                    updateQuantity(current + 1);
                }
            });
        }
        
        if (DOM.quantityInput) {
            const newQuantityInput = DOM.quantityInput.cloneNode(true);
            DOM.quantityInput.parentNode.replaceChild(newQuantityInput, DOM.quantityInput);
            DOM.quantityInput = newQuantityInput;
            DOM.quantityInput.addEventListener('change', function() {
                let val = parseInt(this.value) || 1;
                const min = parseInt(this.min) || 1;
                const max = parseInt(this.max) || 999;
                if (val < min) val = min;
                if (val > max) val = max;
                this.value = val;
                state.quantity = val;
            });
        }
    }

    // ============================================================
    // ADD TO CART / BUY NOW - Event Delegation
    // ============================================================

    document.addEventListener('click', function(e) {
        const addToCartBtn = e.target.closest('#addToCartBtn');
        if (addToCartBtn) {
            e.preventDefault();
            // Get product ID from the button's data attribute
            let productId = addToCartBtn.dataset.productId;
            // If productId is 0 or empty, try to get it from the hidden input
            if (!productId || productId == 0) {
                const productIdInput = document.getElementById('productId');
                productId = productIdInput ? parseInt(productIdInput.value) : 0;
            }
            const variantId = addToCartBtn.dataset.variantId || 0;
            const quantity = parseInt(document.getElementById('quantityInput')?.value) || 1;
            
            console.log('Add to Cart - Product ID:', productId, 'Variant ID:', variantId);
            addToCart(productId, variantId, quantity, false);
            return;
        }
        
        const buyNowBtn = e.target.closest('#buyNowBtn');
        if (buyNowBtn) {
            e.preventDefault();
            // Get product ID from the button's data attribute
            let productId = buyNowBtn.dataset.productId;
            // If productId is 0 or empty, try to get it from the hidden input
            if (!productId || productId == 0) {
                const productIdInput = document.getElementById('productId');
                productId = productIdInput ? parseInt(productIdInput.value) : 0;
            }
            const variantId = buyNowBtn.dataset.variantId || 0;
            const quantity = parseInt(document.getElementById('quantityInput')?.value) || 1;
            
            console.log('Buy Now - Product ID:', productId, 'Variant ID:', variantId);
            addToCart(productId, variantId, quantity, true);
            return;
        }
    });

    // ============================================================
    // CART FUNCTIONS
    // ============================================================

    async function addToCart(productId, variantId, quantity, redirect = false) {
        if (state.isCartProcessing) return;
        state.isCartProcessing = true;
        
        const btn = redirect ? document.getElementById('buyNowBtn') : document.getElementById('addToCartBtn');
        const originalText = btn ? btn.innerHTML : '';
        
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';
        }
        
        try {
            const response = await fetch(CONFIG.cartEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: buildFormData({
                    product_id: productId,
                    variant_id: variantId || 0,
                    quantity: quantity || 1
                })
            });
            const data = await response.json();
            
            if (data.success) {
                showNotification('✓ Product added to cart!', 'success');
                if (data.cart_count !== undefined && DOM.cartCountElements && DOM.cartCountElements.length > 0) {
                    DOM.cartCountElements.forEach(el => {
                        el.textContent = data.cart_count;
                    });
                }
                if (redirect) {
                    window.location.href = CONFIG.checkoutUrl;
                } else {
                    if (btn) {
                        btn.innerHTML = '<i class="bi bi-check-circle"></i> Added!';
                        setTimeout(() => {
                            btn.innerHTML = originalText;
                            btn.disabled = false;
                            state.isCartProcessing = false;
                        }, 2000);
                    }
                }
            } else {
                showNotification(data.message || 'Failed to add to cart', 'error');
                if (btn) {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    state.isCartProcessing = false;
                }
            }
        } catch (error) {
            console.error('Cart error:', error);
            showNotification('Error adding to cart. Please try again.', 'error');
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
                state.isCartProcessing = false;
            }
        }
        if (!redirect) {
            state.isCartProcessing = false;
        }
    }

    // ============================================================
    // WISHLIST FUNCTIONS
    // ============================================================

    async function toggleWishlist(productId, variantId, btn) {
        if (state.isWishlistProcessing) return;
        if (!CONFIG.isLoggedIn) {
            if (confirm('Please login to add items to your wishlist. Would you like to login now?')) {
                window.location.href = CONFIG.loginUrl;
            }
            return;
        }
        state.isWishlistProcessing = true;
        btn.disabled = true;
        
        try {
            const response = await fetch(CONFIG.wishlistEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: buildFormData({
                    product_id: productId,
                    variant_id: variantId || 0
                })
            });
            const data = await response.json();
            if (data.success) {
                const icon = btn.querySelector('i');
                if (data.action === 'added') {
                    btn.classList.add('active');
                    if (icon) {
                        icon.className = 'bi bi-heart-fill';
                        icon.style.color = '#dc3545';
                    }
                } else {
                    btn.classList.remove('active');
                    if (icon) {
                        icon.className = 'bi bi-heart';
                        icon.style.color = '';
                    }
                }
                if (data.count !== undefined && DOM.wishlistCountElements && DOM.wishlistCountElements.length > 0) {
                    DOM.wishlistCountElements.forEach(el => {
                        el.textContent = data.count;
                    });
                }
                showNotification(data.action === 'added' ? 'Added to wishlist!' : 'Removed from wishlist', 'success');
            } else {
                showNotification(data.message || 'Failed to update wishlist', 'error');
            }
        } catch (error) {
            console.error('Wishlist error:', error);
            showNotification('Error updating wishlist. Please try again.', 'error');
        } finally {
            state.isWishlistProcessing = false;
            btn.disabled = false;
        }
    }

    // ============================================================
    // MAIN PRODUCT UI UPDATE
    // ============================================================

    function updateProductUI(variant) {
        if (!variant) return;
        console.log('Updating product UI with variant:', variant);
        
        updateSelectedLabels(variant);
        
        if (DOM.productTitle) {
            let titleHtml = escapeHtml(CONFIG.productName);
            if (variant.variant_name) {
                titleHtml += `<span class="variant-name"> / ${escapeHtml(variant.variant_name)}</span>`;
            }
            DOM.productTitle.innerHTML = titleHtml;
        }
        
        if (variant.rating !== undefined) {
            updateRating(variant.rating);
        }
        if (variant.price !== undefined) {
            updatePrice(variant.price, variant.sale_price);
        }
        if (variant.stock !== undefined) {
            updateStock(variant.stock);
        }
        if (DOM.skuElement) {
            DOM.skuElement.textContent = 'SKU: ' + escapeHtml(variant.sku || 'N/A');
        }
        if (DOM.addToCartBtn) {
            DOM.addToCartBtn.dataset.variantId = variant.id;
        }
        if (DOM.buyNowBtn) {
            DOM.buyNowBtn.dataset.variantId = variant.id;
        }
        if (variant.images !== undefined && variant.images !== null) {
            updateVariantImages(variant.images);
        } else {
            updateVariantImages([]);
        }
        if (variant.slug) {
            const newUrl = CONFIG.baseUrl + '/product/' + encodeURIComponent(variant.slug);
            window.history.pushState({
                productId: CONFIG.productId,
                variantId: variant.id,
                slug: variant.slug
            }, '', newUrl);
        }
        attachQuantityEvents();
        // Re-cache buttons after DOM update
        DOM.addToCartBtn = document.getElementById('addToCartBtn');
        DOM.buyNowBtn = document.getElementById('buyNowBtn');
    }

    // ============================================================
    // EVENT HANDLERS
    // ============================================================

    // --- Variant selection ---
    const handleVariantChange = debounce(function() {
        const features = getSelectedFeatures();
        if (Object.keys(features).length === 0) {
            return;
        }
        findVariant(features);
    }, 300);

    // Variant select change events
    if (DOM.variantSelects && DOM.variantSelects.length > 0) {
        DOM.variantSelects.forEach(select => {
            select.addEventListener('change', function() {
                const featureId = this.dataset.featureId;
                const selectedValue = this.value;
                const displayElement = document.getElementById('selectedValue_' + featureId);
                if (displayElement) {
                    displayElement.textContent = selectedValue;
                }
                handleVariantChange();
            });
        });
    }

    // Color option click events
    if (DOM.colorOptions && DOM.colorOptions.length > 0) {
        DOM.colorOptions.forEach(option => {
            option.addEventListener('click', function() {
                const featureId = this.dataset.featureId;
                const selectedValue = this.dataset.value;
                const siblings = this.parentElement.querySelectorAll('.color-option');
                if (siblings && siblings.length > 0) {
                    siblings.forEach(opt => opt.classList.remove('active'));
                }
                this.classList.add('active');
                const displayElement = document.getElementById('selectedValue_' + featureId);
                if (displayElement) {
                    displayElement.textContent = selectedValue;
                }
                handleVariantChange();
            });
        });
    }

    // --- Thumbnail click ---
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.thumbnail-btn');
        if (!btn) return;
        const image = btn.dataset.image;
        if (!image || !DOM.mainImage) return;
        DOM.mainImage.src = image;
        const thumbnails = document.querySelectorAll('.thumbnail-btn');
        if (thumbnails && thumbnails.length > 0) {
            thumbnails.forEach(b => b.classList.remove('active'));
        }
        btn.classList.add('active');
    });

    // --- Wishlist ---
    if (DOM.wishlistBtns && DOM.wishlistBtns.length > 0) {
        DOM.wishlistBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const productId = this.dataset.productId || CONFIG.productId;
                const variantId = this.dataset.variantId || 0;
                toggleWishlist(productId, variantId, this);
            });
        });
    }

    // --- Browser back/forward navigation ---
    window.addEventListener('popstate', function(e) {
        if (e.state && e.state.variantId) {
            console.log('Popstate:', e.state);
        }
    });

    // ============================================================
    // INITIALIZATION
    // ============================================================

    function init() {
        cacheDomElements();
        
        const buttons = [DOM.addToCartBtn, DOM.buyNowBtn];
        if (buttons && buttons.length > 0) {
            buttons.forEach(btn => {
                if (btn) btn.dataset.productId = CONFIG.productId;
            });
        }
        
        if (DOM.quantityInput) {
            const stock = parseInt(DOM.quantityInput.max) || 0;
            if (stock > 0) {
                DOM.quantityInput.value = 1;
                state.quantity = 1;
            }
        }
        
        state.isInitialLoad = true;
        console.log('Product detail page initialized');
        console.log('Product ID:', CONFIG.productId);
        
        setTimeout(() => {
            state.isInitialLoad = false;
        }, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();