// assets/admin/js/product.js

// ===== PRODUCT FORM INITIALIZATION =====
$(document).ready(function() {
    // Auto-generate slug from name
    const nameInput = $('#name');
    const slugInput = $('#slug');
    
    if (nameInput.length && slugInput.length) {
        nameInput.on('keyup', function() {
            const name = $(this).val();
            if (!slugInput.val() || slugInput.data('auto') === true) {
                const slug = name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                slugInput.val(slug);
                slugInput.data('auto', true);
            }
        });
        
        slugInput.on('keyup', function() {
            $(this).data('auto', false);
        });
        
        slugInput.data('auto', true);
    }
    
    // Preview image if already exists
    const currentImage = $('#currentImage').val();
    if (currentImage) {
        const preview = document.getElementById('imagePreview');
        const placeholder = document.getElementById('imagePreviewPlaceholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        if (preview) {
            preview.style.display = 'block';
            preview.src = currentImage;
        }
    }
    
    // Stock validation
    $('#stock').on('change', function() {
        if ($(this).val() < 0) {
            $(this).val(0);
        }
    });
    
    // Price validation
    $('#price, #sale_price').on('change', function() {
        if ($(this).val() < 0) {
            $(this).val(0);
        }
    });
    
    // Drag and drop for image upload
    const dropZone = document.querySelector('.product-image-preview');
    if (dropZone) {
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#4e73df';
            this.style.background = '#e8f0fe';
            this.style.borderRadius = '8px';
            this.style.padding = '10px';
        });
        
        dropZone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = '';
            this.style.background = '';
            this.style.padding = '';
        });
        
        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = '';
            this.style.background = '';
            this.style.padding = '';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const fileInput = document.getElementById('image');
                if (fileInput) {
                    fileInput.files = files;
                    previewImage(fileInput);
                    uploadImage();
                }
            }
        });
    }
});

// ===== PREVIEW IMAGE =====
function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    const placeholder = document.getElementById('imagePreviewPlaceholder');
    
    if (!preview) return;
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            if (placeholder) {
                placeholder.style.display = 'none';
            }
            preview.style.display = 'block';
            preview.src = e.target.result;
        };
        
        reader.readAsDataURL(input.files[0]);
    } else {
        if (placeholder) {
            placeholder.style.display = 'flex';
        }
        preview.style.display = 'none';
        preview.src = '';
    }
}

// ===== UPLOAD IMAGE =====
function uploadImage() {
    const fileInput = document.getElementById('image');
    const file = fileInput.files[0];
    
    if (!file) {
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('File size exceeds 5MB limit.', 'error');
        fileInput.value = '';
        return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showToast('Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.', 'error');
        fileInput.value = '';
        return;
    }
    
    const form = document.getElementById('imageUploadForm');
    const formData = new FormData(form);
    
    const button = fileInput.nextElementSibling;
    if (button) {
        button.disabled = true;
        button.textContent = 'Uploading...';
    }
    
    showToast('Uploading image...', 'info');
    
    $.ajax({
        url: form.action,
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showToast('Image uploaded successfully', 'success');
                setTimeout(function() {
                    location.reload();
                }, 1000);
            } else {
                showToast(response.message || 'Failed to upload image', 'error');
                fileInput.value = '';
                if (button) {
                    button.disabled = false;
                    button.textContent = 'Upload';
                }
            }
        },
        error: function() {
            showToast('An error occurred. Please try again.', 'error');
            fileInput.value = '';
            if (button) {
                button.disabled = false;
                button.textContent = 'Upload';
            }
        },
        complete: function() {
            if (button) {
                button.disabled = false;
                button.textContent = 'Upload';
            }
        }
    });
}

// ===== REMOVE IMAGE =====
function removeImage(productId) {
    if (!confirm('Are you sure you want to remove this image?')) {
        return;
    }
    
    $.ajax({
        url: '/admin/products/remove-image/' + productId,
        method: 'POST',
        data: {
            '<?= csrf_token() ?>': '<?= csrf_hash() ?>'
        },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showToast('Image removed successfully', 'success');
                setTimeout(function() {
                    location.reload();
                }, 500);
            } else {
                showToast(response.message || 'Failed to remove image', 'error');
            }
        },
        error: function() {
            showToast('An error occurred. Please try again.', 'error');
        }
    });
}

// ===== DELETE PRODUCT =====
function deleteProduct(productId) {
    if (!confirm('⚠️ Are you sure you want to delete this product?')) {
        return;
    }
    
    if (!confirm('⚠️ Please confirm again: This action cannot be undone!')) {
        return;
    }
    
    const deleteBtn = document.querySelector('.btn-danger');
    const originalText = deleteBtn ? deleteBtn.innerHTML : 'Delete';
    
    if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Deleting...';
    }
    
    $.ajax({
        url: '/admin/products/delete/' + productId,
        method: 'DELETE',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        data: {
            '<?= csrf_token() ?>': '<?= csrf_hash() ?>'
        },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showToast('Product deleted successfully', 'success');
                setTimeout(function() {
                    window.location.href = '/admin/products';
                }, 500);
            } else {
                showToast(response.message || 'Failed to delete product', 'error');
                if (deleteBtn) {
                    deleteBtn.disabled = false;
                    deleteBtn.innerHTML = originalText;
                }
            }
        },
        error: function() {
            showToast('An error occurred. Please try again.', 'error');
            if (deleteBtn) {
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = originalText;
            }
        }
    });
}

// ===== REGENERATE SLUG =====
function regenerateSlug() {
    const name = document.getElementById('name').value;
    if (!name) {
        showToast('Please enter a product name first', 'warning');
        return;
    }
    
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    
    document.getElementById('slug').value = slug;
    showToast('Slug regenerated successfully', 'success');
}

// Add these functions to your product.js file

// ===== MULTIPLE IMAGE UPLOAD =====
function uploadMultipleImages(productId) {
    const fileInput = document.getElementById('multipleImages');
    const files = fileInput.files;
    
    if (files.length === 0) {
        showToast('Please select images to upload', 'warning');
        return;
    }
    
    const progressDiv = document.getElementById('uploadProgress');
    const progressBar = progressDiv.querySelector('.progress-bar');
    progressDiv.classList.remove('d-none');
    progressBar.style.width = '0%';
    progressBar.textContent = '0%';
    
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('images[]', files[i]);
    }
    
    $.ajax({
        url: '/admin/products/upload-multiple-images/' + productId,
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        xhr: function() {
            const xhr = new window.XMLHttpRequest();
            xhr.upload.addEventListener('progress', function(e) {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    progressBar.style.width = percent + '%';
                    progressBar.textContent = percent + '%';
                }
            });
            return xhr;
        },
        success: function(response) {
            progressBar.style.width = '100%';
            progressBar.textContent = '100%';
            
            if (response.success) {
                showToast(response.message || 'Images uploaded successfully', 'success');
                setTimeout(function() {
                    location.reload();
                }, 1000);
            } else {
                showToast(response.message || 'Failed to upload images', 'error');
                progressDiv.classList.add('d-none');
            }
        },
        error: function() {
            showToast('An error occurred. Please try again.', 'error');
            progressDiv.classList.add('d-none');
        }
    });
}

// ===== SET PRIMARY IMAGE =====
function setPrimaryImage(productId, imageId) {
    $.ajax({
        url: '/admin/products/set-primary-image/' + productId + '/' + imageId,
        method: 'POST',
        data: {
            '<?= csrf_token() ?>': '<?= csrf_hash() ?>'
        },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showToast('Primary image updated successfully', 'success');
                setTimeout(function() {
                    location.reload();
                }, 500);
            } else {
                showToast(response.message || 'Failed to update primary image', 'error');
            }
        },
        error: function() {
            showToast('An error occurred. Please try again.', 'error');
        }
    });
}

// ===== REMOVE MULTIPLE IMAGE =====
function removeMultipleImage(productId, imageId) {
    if (!confirm('Are you sure you want to remove this image?')) {
        return;
    }
    
    $.ajax({
        url: '/admin/products/remove-multiple-image/' + productId + '/' + imageId,
        method: 'DELETE',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        data: {
            '<?= csrf_token() ?>': '<?= csrf_hash() ?>'
        },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showToast('Image removed successfully', 'success');
                $('#image-' + imageId).fadeOut(300, function() {
                    $(this).remove();
                });
            } else {
                showToast(response.message || 'Failed to remove image', 'error');
            }
        },
        error: function() {
            showToast('An error occurred. Please try again.', 'error');
        }
    });
}