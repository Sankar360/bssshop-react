// assets/admin/js/product-inline-edit.js

$(document).ready(function() {
    // ===== PRICE MODAL =====
    let priceModal, stockModal;
    
    // Initialize modals
    if (document.getElementById('priceModal')) {
        priceModal = new bootstrap.Modal(document.getElementById('priceModal'));
    }
    if (document.getElementById('stockModal')) {
        stockModal = new bootstrap.Modal(document.getElementById('stockModal'));
    }
    
    // ===== OPEN PRICE MODAL =====
    $(document).on('click', '.price-clickable', function() {
        const $this = $(this);
        const productId = $this.data('product-id');
        const price = $this.data('price');
        const salePrice = $this.data('sale-price');
        
        // Set values in modal
        $('#priceProductId').val(productId);
        $('#priceInput').val(price);
        $('#salePriceInput').val(salePrice || '');
        
        // Clear previous errors
        clearPriceErrors();
        
        // Show modal
        priceModal.show();
    });
    
    // ===== OPEN STOCK MODAL =====
    $(document).on('click', '.stock-clickable', function() {
        const $this = $(this);
        const productId = $this.data('product-id');
        const stock = $this.data('stock');
        
        // Set values in modal
        $('#stockProductId').val(productId);
        $('#stockInput').val(stock);
        
        // Clear previous errors
        clearStockErrors();
        
        // Show modal
        stockModal.show();
    });
    
    // ===== SAVE PRICE =====
    $('#savePriceBtn').on('click', function() {
        const $btn = $(this);
        const form = document.getElementById('priceForm');
        const formData = new FormData(form);
        
        // Disable button and show spinner
        $btn.prop('disabled', true);
        $btn.html('<i class="bi bi-hourglass-split"></i> Saving...');
        
        // Clear previous errors
        clearPriceErrors();
        
        $.ajax({
            url: '/admin/products/update-price',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    // Show success toast
                    showToast(response.message || 'Price updated successfully', 'success');
                    
                    // Update table values
                    const productId = $('#priceProductId').val();
                    updatePriceInTable(productId, response.data.price, response.data.sale_price);
                    
                    // Close modal
                    priceModal.hide();
                } else {
                    // Show validation errors
                    if (response.errors) {
                        displayPriceErrors(response.errors);
                    }
                    if (response.message) {
                        showToast(response.message, 'error');
                    }
                }
            },
            error: function(xhr, status, error) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.errors) {
                        displayPriceErrors(response.errors);
                    }
                    if (response.message) {
                        showToast(response.message, 'error');
                    }
                } catch (e) {
                    showToast('An error occurred. Please try again.', 'error');
                }
            },
            complete: function() {
                // Re-enable button
                $btn.prop('disabled', false);
                $btn.html('<i class="bi bi-save"></i> Save');
            }
        });
    });
    
    // ===== SAVE STOCK =====
    $('#saveStockBtn').on('click', function() {
        const $btn = $(this);
        const form = document.getElementById('stockForm');
        const formData = new FormData(form);
        
        // Disable button and show spinner
        $btn.prop('disabled', true);
        $btn.html('<i class="bi bi-hourglass-split"></i> Saving...');
        
        // Clear previous errors
        clearStockErrors();
        
        $.ajax({
            url: '/admin/products/update-stock',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    // Show success toast
                    showToast(response.message || 'Stock updated successfully', 'success');
                    
                    // Update table values
                    const productId = $('#stockProductId').val();
                    updateStockInTable(productId, response.data.stock);
                    
                    // Close modal
                    stockModal.hide();
                } else {
                    // Show validation errors
                    if (response.errors) {
                        displayStockErrors(response.errors);
                    }
                    if (response.message) {
                        showToast(response.message, 'error');
                    }
                }
            },
            error: function(xhr, status, error) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.errors) {
                        displayStockErrors(response.errors);
                    }
                    if (response.message) {
                        showToast(response.message, 'error');
                    }
                } catch (e) {
                    showToast('An error occurred. Please try again.', 'error');
                }
            },
            complete: function() {
                // Re-enable button
                $btn.prop('disabled', false);
                $btn.html('<i class="bi bi-save"></i> Save');
            }
        });
    });
    
    // ===== UPDATE PRICE IN TABLE =====
    function updatePriceInTable(productId, price, salePrice) {
        const $row = $(`tr[data-product-id="${productId}"]`);
        const $priceCell = $row.find('.price-clickable');
        
        // Update price
        $priceCell.data('price', parseFloat(price.replace('$', '').replace(',', '')));
        if (salePrice) {
            $priceCell.data('sale-price', parseFloat(salePrice.replace('$', '').replace(',', '')));
        }
        
        // Update HTML
        let html = `<span class="price-clickable" 
                          data-product-id="${productId}"
                          data-price="${parseFloat(price.replace('$', '').replace(',', ''))}"
                          data-sale-price="${salePrice ? parseFloat(salePrice.replace('$', '').replace(',', '')) : ''}"
                          style="cursor: pointer; color: #0d6efd;">
                    $${price}`;
        
        if (salePrice) {
            html += `<small class="text-muted text-decoration-line-through"> $${salePrice}</small>`;
        }
        html += `</span>`;
        
        $priceCell.replaceWith(html);
    }
    
    // ===== UPDATE STOCK IN TABLE =====
    function updateStockInTable(productId, stock) {
        const $row = $(`tr[data-product-id="${productId}"]`);
        const $stockCell = $row.find('.stock-clickable');
        
        // Update stock
        $stockCell.data('stock', parseInt(stock));
        $stockCell.text(stock);
    }
    
    // ===== PRICE ERROR HANDLING =====
    function displayPriceErrors(errors) {
        // Clear previous errors
        clearPriceErrors();
        
        // Display errors
        if (errors.price) {
            $('#priceInput').addClass('is-invalid');
            $('#priceError').text(errors.price);
        }
        if (errors.sale_price) {
            $('#salePriceInput').addClass('is-invalid');
            $('#salePriceError').text(errors.sale_price);
        }
    }
    
    function clearPriceErrors() {
        $('#priceInput').removeClass('is-invalid');
        $('#salePriceInput').removeClass('is-invalid');
        $('#priceError').text('');
        $('#salePriceError').text('');
    }
    
    // ===== STOCK ERROR HANDLING =====
    function displayStockErrors(errors) {
        // Clear previous errors
        clearStockErrors();
        
        // Display errors
        if (errors.stock) {
            $('#stockInput').addClass('is-invalid');
            $('#stockError').text(errors.stock);
        }
    }
    
    function clearStockErrors() {
        $('#stockInput').removeClass('is-invalid');
        $('#stockError').text('');
    }
    
    // ===== CLEAR ERRORS ON MODAL HIDE =====
    $('#priceModal').on('hidden.bs.modal', function() {
        clearPriceErrors();
    });
    
    $('#stockModal').on('hidden.bs.modal', function() {
        clearStockErrors();
    });
    
    // ===== ENTER KEY SUPPORT =====
    $('#priceInput, #salePriceInput').on('keypress', function(e) {
        if (e.which === 13) {
            e.preventDefault();
            $('#savePriceBtn').click();
        }
    });
    
    $('#stockInput').on('keypress', function(e) {
        if (e.which === 13) {
            e.preventDefault();
            $('#saveStockBtn').click();
        }
    });
});