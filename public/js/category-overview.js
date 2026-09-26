// public/assets/js/category-overview.js - Complete Fixed Version with Cart Support

class CategoryOverview {
    constructor(config) {
        this.config = {
            baseUrl: config.baseUrl || '/',
            categoryId: config.categoryId || 0,
            subcategoryId: config.subcategoryId || null,
            minPrice: config.minPrice || 0,
            maxPrice: config.maxPrice || 10000,
            defaultMinPrice: config.defaultMinPrice || 0,
            defaultMaxPrice: config.defaultMaxPrice || 10000,
            perPage: 12,
            currentPage: 1,
            sort: 'latest',
            features: {},
            selectedFeatures: {},
        };
        
        this.isLoading = false;
        this.initialized = false;
        this.loadTimeout = null;
        this.pendingRequest = null;
        this.isUpdatingPriceRange = false;
        this.isInitialLoad = true;
        
        // DOM elements
        this.elements = {
            productGrid: document.getElementById('productGrid'),
            productCount: document.getElementById('countNumber'),
            productCountLabel: document.getElementById('countLabel'),
            paginationWrapper: document.getElementById('paginationWrapper'),
            loadingOverlay: document.querySelector('.product-grid-loading'),
            categoryList: document.getElementById('categoryList'),
            minPrice: document.getElementById('minPrice'),
            maxPrice: document.getElementById('maxPrice'),
            applyPrice: document.getElementById('applyPriceFilter'),
            sortSelect: document.getElementById('sortSelect'),
            activeFilters: document.getElementById('activeFilters'),
            clearAll: document.getElementById('clearAllFilters'),
            mobileFilterToggle: document.getElementById('mobileFilterToggle'),
            mobileSidebarContent: document.getElementById('mobileSidebarContent'),
            breadcrumbCategory: document.getElementById('breadcrumbCategory'),
            breadcrumbSubcategory: document.getElementById('breadcrumbSubcategory'),
            categoryTitle: document.getElementById('categoryTitle'),
        };
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;
        
        this.setupCategoryEvents();
        this.setupPriceEvents();
        this.setupFeatureEvents();
        this.setupSortEvents();
        this.setupPaginationEvents();
        this.setupMobileEvents();
        this.setupClearFilters();
        this.setupMobileSidebar();
        //this.setupCartEvents(); // Add this line
        //this.setupWishlistEvents(); // Add this line
        
        this.loadProducts();
    }
    // ============================================================
    // NEW: NOTIFICATION FUNCTION
    // ============================================================
    showNotification(message, type = 'success') {
        // Remove existing notifications
        document.querySelectorAll('.cart-notification').forEach(el => el.remove());
        
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        
        let icon = 'bi-check-circle-fill';
        let color = '#43e97b';
        let bgColor = '#1a1a2e';
        
        switch(type) {
            case 'success':
                icon = 'bi-check-circle-fill';
                color = '#43e97b';
                bgColor = '#1a1a2e';
                break;
            case 'error':
                icon = 'bi-exclamation-circle-fill';
                color = '#ff6b81';
                bgColor = '#2d1a1a';
                break;
            case 'warning':
                icon = 'bi-exclamation-triangle-fill';
                color = '#f6c23e';
                bgColor = '#2d2a1a';
                break;
            case 'info':
                icon = 'bi-info-circle-fill';
                color = '#4facfe';
                bgColor = '#1a1a2e';
                break;
            default:
                icon = 'bi-check-circle-fill';
                color = '#43e97b';
                bgColor = '#1a1a2e';
        }
        
        notification.innerHTML = `
            <i class="bi ${icon}" style="color: ${color};"></i>
            <span>${message}</span>
        `;
        notification.style.background = bgColor;
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.padding = '15px 25px';
        notification.style.borderRadius = '10px';
        notification.style.display = 'flex';
        notification.style.alignItems = 'center';
        notification.style.gap = '12px';
        notification.style.boxShadow = '0 10px 40px rgba(0,0,0,0.3)';
        notification.style.transform = 'translateY(100px)';
        notification.style.opacity = '0';
        notification.style.transition = 'all 0.3s ease';
        notification.style.zIndex = '9999';
        notification.style.maxWidth = '400px';
        notification.style.color = 'white';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateY(0)';
            notification.style.opacity = '1';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateY(100px)';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ============================================================
    // EXISTING METHODS (Keep all your existing methods below)
    // ============================================================

    setupCategoryEvents() {
        
        if (this.elements.categoryList) {
            this.elements.categoryList.addEventListener('click', (e) => {
                const link = e.target.closest('.category-link');
                if (link) {
                    e.preventDefault();
                    e.stopPropagation();
                    const categoryId = parseInt(link.dataset.categoryId);
                    this.selectCategory(categoryId);
                }
                
                const subLink = e.target.closest('.subcategory-link');
                if (subLink) {
                    e.preventDefault();
                    e.stopPropagation();
                    const categoryId = parseInt(subLink.dataset.categoryId);
                    const subcategoryId = parseInt(subLink.dataset.subcategoryId);
                    this.selectSubcategory(categoryId, subcategoryId);
                }
            });
        }
    }

    selectCategory(categoryId) {
        if (this._selectingCategory) {
            return;
        }
        this._selectingCategory = true;
        document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.category-link').forEach(el => {
            if (parseInt(el.dataset.categoryId) === categoryId) {
                el.closest('.category-item').classList.add('active');
            }
        });
        
        document.querySelectorAll('.subcategory-list').forEach(el => {
            el.classList.remove('open');
        });
        
        const subList = document.getElementById(`subcategoryList_${categoryId}`);
        if (subList) {
            subList.classList.add('open');
        }
        
        this.config.categoryId = categoryId;
        this.config.subcategoryId = null;
        this.config.currentPage = 1;
        this.config.features = {};
        
        const categoryName = document.querySelector(`.category-link[data-category-id="${categoryId}"] .category-name`);
        if (categoryName) {
            if (this.elements.breadcrumbCategory) {
                this.elements.breadcrumbCategory.textContent = categoryName.textContent;
            }
            if (this.elements.breadcrumbSubcategory) {
                this.elements.breadcrumbSubcategory.textContent = '';
            }
            if (this.elements.categoryTitle) {
                this.elements.categoryTitle.textContent = categoryName.textContent;
            }
        }
        
        const firstSub = subList ? subList.querySelector('.subcategory-link') : null;
        if (firstSub) {
            const subId = parseInt(firstSub.dataset.subcategoryId);
            if (this.pendingRequest) {
                this.pendingRequest.abort();
                this.pendingRequest = null;
            }
            this.selectSubcategory(categoryId, subId);
        } else {
             // Only load products if this is not the initial load
            if (!this.isInitialLoad) {
                this.updatePriceRange().then(() => {
                    this.loadProducts();
                });
                this.updateFeatures();
            } else {
                // For initial load, just update features and price range
                this.updatePriceRange();
                this.updateFeatures();
            }
        }
        setTimeout(() => {
            this._selectingCategory = false;
        }, 500);
    }

    selectSubcategory(categoryId, subcategoryId) {
        if (this._selectingSubcategory) {
            return;
        }
        this._selectingSubcategory = true;
        if (this.pendingRequest) {
            this.pendingRequest.abort();
            this.pendingRequest = null;
        }

        document.querySelectorAll('.subcategory-item').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.subcategory-link').forEach(el => {
            if (parseInt(el.dataset.subcategoryId) === subcategoryId) {
                el.closest('.subcategory-item').classList.add('active');
            }
        });

        this.config.categoryId = categoryId;
        this.config.subcategoryId = subcategoryId;
        this.config.currentPage = 1;
        this.config.features = {};

        const subName = document.querySelector(`.subcategory-link[data-subcategory-id="${subcategoryId}"]`);
        if (subName && this.elements.breadcrumbSubcategory) {
            this.elements.breadcrumbSubcategory.textContent = subName.textContent.trim();
        }
        if (subName && this.elements.categoryTitle) {
            this.elements.categoryTitle.textContent = subName.textContent.trim();
        }

        // Only load products if this is not the initial load
        if (!this.isInitialLoad) {
            this.updatePriceRange().then(() => {
                this.loadProducts();
            });
            this.updateFeatures();
        } else {
            // For initial load, just update features and price range
            this.updatePriceRange();
            this.updateFeatures();
        }
        
        // Reset the selecting flag after a short delay
        setTimeout(() => {
            this._selectingSubcategory = false;
        }, 500);
    }

    setupPriceEvents() {
        if (this.elements.applyPrice) {
            this.elements.applyPrice.addEventListener('click', () => {
                const min = parseInt(this.elements.minPrice.value) || 0;
                const max = parseInt(this.elements.maxPrice.value) || 0;
                
                if (min > max) {
                    alert('Min price cannot be greater than max price');
                    return;
                }
                
                this.config.minPrice = min;
                this.config.maxPrice = max;
                this.config.currentPage = 1;
                this.loadProducts();
            });
        }
        
        [this.elements.minPrice, this.elements.maxPrice].forEach(input => {
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        if (this.elements.applyPrice) {
                            this.elements.applyPrice.click();
                        }
                    }
                });
            }
        });
    }

    setupFeatureEvents() {
        document.querySelectorAll('.feature-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateFeatureFilters();
                this.config.currentPage = 1;
                this.loadProducts();
            });
        });
    }

    updateFeatureFilters() {
        const features = {};
        document.querySelectorAll('.feature-group').forEach(group => {
            const featureId = parseInt(group.dataset.featureId);
            const checked = group.querySelectorAll('.feature-checkbox:checked');
            if (checked.length > 0) {
                features[featureId] = Array.from(checked).map(cb => cb.value);
            }
        });
        this.config.features = features;
        this.updateActiveFilters();
    }

    setupSortEvents() {
        if (this.elements.sortSelect) {
            this.elements.sortSelect.addEventListener('change', () => {
                this.config.sort = this.elements.sortSelect.value;
                this.config.currentPage = 1;
                this.loadProducts();
            });
        }
    }

    setupPaginationEvents() {
        if (this.elements.paginationWrapper) {
            this.elements.paginationWrapper.addEventListener('click', (e) => {
                const link = e.target.closest('.page-link');
                if (link && !link.closest('.disabled')) {
                    e.preventDefault();
                    const page = parseInt(link.dataset.page);
                    if (page && page !== this.config.currentPage) {
                        this.config.currentPage = page;
                        this.loadProducts();
                        const content = document.querySelector('.category-content');
                        if (content) {
                            content.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }
                }
            });
        }
    }

    setupMobileEvents() {
        if (this.elements.mobileFilterToggle) {
            this.elements.mobileFilterToggle.addEventListener('click', () => {
                const offcanvas = new bootstrap.Offcanvas(document.getElementById('mobileFilterOffcanvas'));
                offcanvas.show();
            });
        }
    }

    setupMobileSidebar() {
        const sidebar = document.getElementById('categorySidebar');
        if (sidebar && this.elements.mobileSidebarContent) {
            this.elements.mobileSidebarContent.innerHTML = sidebar.innerHTML;
        }
    }

    setupClearFilters() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#clearAllFilters')) {
                this.clearAllFilters();
            }
            
            if (e.target.closest('.filter-chip .remove-chip')) {
                const chip = e.target.closest('.filter-chip');
                const featureId = parseInt(chip.dataset.featureId);
                const value = chip.dataset.value;
                this.removeFeatureFilter(featureId, value);
            }
        });
    }

    clearAllFilters() {
        if (this.elements.minPrice) {
            this.elements.minPrice.value = this.config.defaultMinPrice;
        }
        if (this.elements.maxPrice) {
            this.elements.maxPrice.value = this.config.defaultMaxPrice;
        }
        this.config.minPrice = this.config.defaultMinPrice;
        this.config.maxPrice = this.config.defaultMaxPrice;
        
        document.querySelectorAll('.feature-checkbox').forEach(cb => cb.checked = false);
        this.config.features = {};
        
        if (this.elements.sortSelect) {
            this.elements.sortSelect.value = 'latest';
        }
        this.config.sort = 'latest';
        this.config.currentPage = 1;
        
        this.updateActiveFilters();
        this.loadProducts();
    }

    removeFeatureFilter(featureId, value) {
        if (this.config.features[featureId]) {
            const index = this.config.features[featureId].indexOf(value);
            if (index > -1) {
                this.config.features[featureId].splice(index, 1);
                if (this.config.features[featureId].length === 0) {
                    delete this.config.features[featureId];
                }
            }
        }
        
        document.querySelectorAll(`.feature-checkbox[value="${value}"]`).forEach(cb => {
            if (parseInt(cb.closest('.feature-group').dataset.featureId) === featureId) {
                cb.checked = false;
            }
        });
        
        this.config.currentPage = 1;
        this.updateActiveFilters();
        this.loadProducts();
    }

    updateActiveFilters() {
        const container = this.elements.activeFilters;
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.config.minPrice > this.config.defaultMinPrice || 
            this.config.maxPrice < this.config.defaultMaxPrice) {
            const chip = this.createFilterChip(
                'price',
                `₮${this.config.minPrice} - ₮${this.config.maxPrice}`,
                'price',
                'price'
            );
            container.appendChild(chip);
        }
        
        for (const [featureId, values] of Object.entries(this.config.features)) {
            const featureName = document.querySelector(`.feature-group[data-feature-id="${featureId}"] .feature-title`);
            if (featureName) {
                values.forEach(value => {
                    const chip = this.createFilterChip(
                        featureId,
                        value,
                        featureName.textContent.trim(),
                        value
                    );
                    container.appendChild(chip);
                });
            }
        }
        
        const clearAll = document.getElementById('clearAllFilters');
        if (clearAll) {
            clearAll.style.display = container.children.length > 0 ? 'inline-block' : 'none';
        }
    }

    createFilterChip(featureId, label, featureName, value) {
        const chip = document.createElement('span');
        chip.className = 'filter-chip badge bg-light text-dark border me-1 mb-1';
        chip.dataset.featureId = featureId;
        chip.dataset.value = value;
        chip.innerHTML = `
            ${featureName}: ${label}
            <span class="remove-chip ms-1" style="cursor:pointer;">×</span>
        `;
        return chip;
    }

    updatePriceRange() {
        if (!this.config.categoryId) return Promise.resolve();

        return fetch(this.config.baseUrl + 'category/getPriceRange', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: new URLSearchParams({
                category_id: this.config.categoryId,
                subcategory_id: this.config.subcategoryId || ''
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status) {
                if (this.elements.minPrice) {
                    this.elements.minPrice.min = data.min;
                    this.elements.minPrice.max = data.max;
                    this.elements.minPrice.value = data.min;
                }
                if (this.elements.maxPrice) {
                    this.elements.maxPrice.min = data.min;
                    this.elements.maxPrice.max = data.max;
                    this.elements.maxPrice.value = data.max;
                }
                this.config.minPrice = data.min;
                this.config.maxPrice = data.max;
                this.config.defaultMinPrice = data.min;
                this.config.defaultMaxPrice = data.max;
            }
        })
        .catch(error => console.error('Error updating price range:', error));
    }

    updateFeatures() {
        if (!this.config.categoryId) return;
        
        fetch(this.config.baseUrl + 'category/getFeatures', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: new URLSearchParams({
                category_id: this.config.categoryId,
                subcategory_id: this.config.subcategoryId || ''
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status) {
                const featuresBox = document.querySelector('.features-box');
                if (featuresBox && data.html) {
                    const title = featuresBox.querySelector('.sidebar-title');
                    featuresBox.innerHTML = data.html;
                    if (title) {
                        featuresBox.prepend(title);
                    }
                    this.setupFeatureEvents();
                }
            }
        })
        .catch(error => console.error('Error updating features:', error));
    }

    loadProducts() {
        if (this.isLoading) {
            if (this.pendingRequest) {
                this.pendingRequest.abort();
                this.pendingRequest = null;
            }
            this.isLoading = false;
        }
        
        if (!this.config.categoryId) {
            console.warn('No category selected, skipping load');
            return;
        }
        
        this.isLoading = true;
        this.showLoading();
        
        const data = {
            category_id: this.config.categoryId,
            subcategory_id: this.config.subcategoryId || '',
            min_price: this.config.minPrice,
            max_price: this.config.maxPrice,
            sort: this.config.sort,
            page: this.config.currentPage,
            features: this.config.features,
            per_page: this.config.perPage
        };
        
        const controller = new AbortController();
        this.pendingRequest = controller;
        
        fetch(this.config.baseUrl + 'category/getProducts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: new URLSearchParams({
                category_id: data.category_id,
                subcategory_id: data.subcategory_id,
                min_price: data.min_price,
                max_price: data.max_price,
                sort: data.sort,
                page: data.page,
                features: JSON.stringify(data.features),
                per_page: data.per_page
            }),
            signal: controller.signal
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('HTTP error ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (data.status) {
                if (this.elements.productGrid) {
                    this.elements.productGrid.innerHTML = data.html;
                }
                 
                if (this.elements.productCount) {
                    this.elements.productCount.textContent = data.total || 0;
                }
                
                this.updateActiveFilters();
                
                if (data.html) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = data.html;
                    const paginationNav = tempDiv.querySelector('nav[aria-label="Product pagination"]');
                    if (paginationNav && this.elements.paginationWrapper) {
                        this.elements.paginationWrapper.innerHTML = paginationNav.outerHTML;
                    } else if (this.elements.paginationWrapper) {
                        this.elements.paginationWrapper.innerHTML = '';
                    }
                }
                
                this.setupPaginationEvents();
                 //checkWishlistStatus();
                 if (typeof checkWishlistStatus === 'function') {
                    checkWishlistStatus();
                }
               
            }
        })
        .catch(error => {
            if (error.name === 'AbortError') {
                console.log('Request aborted');
                return;
            }
            console.error('Error loading products:', error);
            if (this.elements.productGrid) {
                this.elements.productGrid.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="fas fa-exclamation-circle fa-2x text-danger mb-3"></i>
                        <h4>Error loading products</h4>
                        <p class="text-muted">Please try again later.</p>
                        <button class="btn btn-primary" onclick="location.reload()">Retry</button>
                    </div>
                `;
            }
        })
        .finally(() => {
            this.isLoading = false;
            this.pendingRequest = null;
            this.hideLoading();
            this.isInitialLoad = false;
        });
    }

    showLoading() {
        const wrapper = document.querySelector('.product-grid-loading');
        if (wrapper) wrapper.style.display = 'flex';
    }

    hideLoading() {
        const wrapper = document.querySelector('.product-grid-loading');
        if (wrapper) wrapper.style.display = 'none';
    }
}

// Initialize the category overview
document.addEventListener('DOMContentLoaded', function() {
    const categoryOverview = new CategoryOverview({
        baseUrl: window.location.origin + '/',
        categoryId: parseInt(document.getElementById('categoryId')?.value || 0),
        subcategoryId: parseInt(document.getElementById('subcategoryId')?.value || 0),
        minPrice: 0,
        maxPrice: 10000,
    });
    categoryOverview.init();

    // Store reference globally for debugging
    window.categoryOverview = categoryOverview;
});