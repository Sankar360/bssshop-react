// assets/admin/js/product-list.js

$(document).ready(function() {
    // ===== STATE =====
    let currentPage = 1;
    let perPage = 25;
    let currentFilter = 'all';
    let searchQuery = '';
    let allProducts = [];
    let filteredProducts = [];
    
    // ===== INIT =====
    function init() {
        // Store all products data
        $('#productsTableBody tr').each(function() {
            const $row = $(this);
            const productId = $row.data('product-id');
            const status = $row.data('status');
            const name = $row.find('.product-name-link').text().trim();
            const sku = $row.find('td:eq(0)').text().trim();
            
            allProducts.push({
                id: productId,
                status: status,
                name: name,
                sku: sku,
                element: $row
            });
        });
        
        // Initial render
        applyFiltersAndSearch();
        renderPagination();
        updateResultsCount();
        
        // Event listeners
        setupEventListeners();
    }
    
    // ===== SETUP EVENT LISTENERS =====
    function setupEventListeners() {
        // Search input
        $('#searchInput').on('keyup', function(e) {
            searchQuery = $(this).val().toLowerCase().trim();
            currentPage = 1;
            applyFiltersAndSearch();
            renderPagination();
            updateResultsCount();
        });
        
        // Clear search
        $('#clearSearchBtn').on('click', function() {
            $('#searchInput').val('');
            searchQuery = '';
            currentPage = 1;
            applyFiltersAndSearch();
            renderPagination();
            updateResultsCount();
        });
        
        // Filter buttons
        $('.filter-btn').on('click', function() {
            $('.filter-btn').removeClass('active');
            $(this).addClass('active');
            currentFilter = $(this).data('filter');
            currentPage = 1;
            applyFiltersAndSearch();
            renderPagination();
            updateResultsCount();
        });
        
        // Per page change
        $('#perPageSelect').on('change', function() {
            perPage = parseInt($(this).val());
            currentPage = 1;
            applyFiltersAndSearch();
            renderPagination();
            updateResultsCount();
        });
    }
    
    // ===== APPLY FILTERS AND SEARCH =====
    function applyFiltersAndSearch() {
        // Reset all rows
        $('#productsTableBody tr').show();
        
        // Filter by status
        if (currentFilter !== 'all') {
            $('#productsTableBody tr').each(function() {
                const status = $(this).data('status');
                if (status !== currentFilter) {
                    $(this).hide();
                }
            });
        }
        
        // Filter by search
        if (searchQuery) {
            $('#productsTableBody tr:visible').each(function() {
                const $row = $(this);
                const name = $row.find('.product-name-link').text().toLowerCase();
                const id = $row.find('td:eq(0)').text();
                const matches = name.includes(searchQuery) || id.includes(searchQuery);
                if (!matches) {
                    $row.hide();
                }
            });
        }
        
        // Get visible rows
        filteredProducts = [];
        $('#productsTableBody tr:visible').each(function() {
            filteredProducts.push($(this));
        });
        
        // Apply pagination
        applyPagination();
    }
    
    // ===== APPLY PAGINATION =====
    function applyPagination() {
        const totalItems = filteredProducts.length;
        const totalPages = Math.ceil(totalItems / perPage);
        
        // Hide all rows first
        $('#productsTableBody tr').hide();
        
        // Show only current page items
        const start = (currentPage - 1) * perPage;
        const end = Math.min(start + perPage, totalItems);
        
        for (let i = start; i < end; i++) {
            if (filteredProducts[i]) {
                filteredProducts[i].show();
            }
        }
        
        // Update pagination info
        const showingStart = totalItems > 0 ? start + 1 : 0;
        const showingEnd = end;
        $('#paginationInfo').text(`Showing ${showingStart}-${showingEnd} of ${totalItems}`);
        
        // Update pagination buttons
        renderPaginationButtons(totalPages);
    }
    
    // ===== RENDER PAGINATION =====
    function renderPagination() {
        const totalItems = filteredProducts.length;
        const totalPages = Math.ceil(totalItems / perPage);
        renderPaginationButtons(totalPages);
    }
    
    function renderPaginationButtons(totalPages) {
        const $container = $('#paginationContainer');
        $container.empty();
        
        if (totalPages <= 1) {
            return;
        }
        
        // Previous button
        const prevDisabled = currentPage === 1 ? 'disabled' : '';
        $container.append(`
            <li class="page-item ${prevDisabled}">
                <a class="page-link" href="#" data-page="${currentPage - 1}">
                    <i class="bi bi-chevron-left"></i>
                </a>
            </li>
        `);
        
        // Page numbers
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);
        
        // Show first page
        if (startPage > 1) {
            $container.append(`
                <li class="page-item">
                    <a class="page-link" href="#" data-page="1">1</a>
                </li>
            `);
            if (startPage > 2) {
                $container.append(`
                    <li class="page-item disabled">
                        <span class="page-link">...</span>
                    </li>
                `);
            }
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            const active = i === currentPage ? 'active' : '';
            $container.append(`
                <li class="page-item ${active}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `);
        }
        
        // Show last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                $container.append(`
                    <li class="page-item disabled">
                        <span class="page-link">...</span>
                    </li>
                `);
            }
            $container.append(`
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>
                </li>
            `);
        }
        
        // Next button
        const nextDisabled = currentPage === totalPages ? 'disabled' : '';
        $container.append(`
            <li class="page-item ${nextDisabled}">
                <a class="page-link" href="#" data-page="${currentPage + 1}">
                    <i class="bi bi-chevron-right"></i>
                </a>
            </li>
        `);
        
        // Click handler for pagination links
        $container.find('a.page-link').on('click', function(e) {
            e.preventDefault();
            const page = parseInt($(this).data('page'));
            if (page && page !== currentPage) {
                currentPage = page;
                applyPagination();
                // Scroll to top of table
                $('html, body').animate({
                    scrollTop: $('#productsTable').offset().top - 100
                }, 300);
            }
        });
    }
    
    // ===== UPDATE RESULTS COUNT =====
    function updateResultsCount() {
        const total = filteredProducts.length;
        const showing = $('#productsTableBody tr:visible').length;
        $('#resultsCount').text(`Showing ${showing} of ${total} products`);
    }
    
    // ===== EXPORT FUNCTIONS =====
    // Update table after inline edit
    window.updateProductTable = function(productId, field, value) {
        const $row = $(`tr[data-product-id="${productId}"]`);
        if (field === 'stock') {
            const $stockCell = $row.find('.stock-clickable');
            $stockCell.data('stock', value);
            $stockCell.text(value);
        } else if (field === 'price' || field === 'sale_price') {
            // Re-fetch or update price display
            // This will be handled by the inline edit JS
        }
        
        // Re-apply filters to update counts
        applyFiltersAndSearch();
        updateResultsCount();
    };
    
    // ===== RE-INITIALIZE AFTER AJAX =====
    $(document).ajaxComplete(function() {
        // Re-apply filters after AJAX operations
        if ($('#productsTable').length) {
            applyFiltersAndSearch();
            updateResultsCount();
        }
    });
    
    // ===== KEYBOARD SHORTCUTS =====
    $(document).keydown(function(e) {
        // Ctrl+F or / to focus search
        if ((e.ctrlKey && e.key === 'f') || e.key === '/') {
            e.preventDefault();
            $('#searchInput').focus();
        }
        // Escape to clear search
        if (e.key === 'Escape' && $('#searchInput').is(':focus')) {
            $('#searchInput').val('');
            searchQuery = '';
            currentPage = 1;
            applyFiltersAndSearch();
            renderPagination();
            updateResultsCount();
            $('#searchInput').blur();
        }
    });
    
    // ===== INIT =====
    init();
    
    console.log('Product list with search and pagination initialized');
});