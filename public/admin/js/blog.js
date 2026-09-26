// assets/admin/js/blog.js

// ===== REGENERATE SLUG =====
function regenerateSlug() {
    const title = document.getElementById('title').value;
    if (!title) {
        showToast('Please enter a title first', 'warning');
        return;
    }
    
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    
    document.getElementById('slug').value = slug;
    showToast('Slug regenerated successfully', 'success');
}

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
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('File size exceeds 5MB limit.', 'error');
        fileInput.value = '';
        return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showToast('Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.', 'error');
        fileInput.value = '';
        return;
    }
    
    const form = document.getElementById('imageUploadForm');
    const formData = new FormData(form);
    
    // Show loading state
    const button = fileInput.nextElementSibling;
    if (button) {
        button.disabled = true;
        button.textContent = 'Uploading...';
    }
    
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
            }
        },
        error: function(xhr, status, error) {
            showToast('An error occurred. Please try again.', 'error');
            fileInput.value = '';
            console.error('Upload error:', error);
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
function removeImage(blogId) {
    if (!confirm('Are you sure you want to remove this image?')) {
        return;
    }
    
    $.ajax({
        url: '/admin/blog/remove-image/' + blogId,
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

// ===== DELETE BLOG =====
function deleteBlog(blogId) {
    if (!confirm('⚠️ Are you sure you want to delete this blog post?')) {
        return;
    }
    
    if (!confirm('⚠️ Please confirm again: This will permanently delete the blog post and all its data. This action cannot be undone!')) {
        return;
    }
    
    // Show loading state
    const deleteBtn = document.querySelector('.btn-danger');
    const originalText = deleteBtn ? deleteBtn.innerHTML : 'Delete';
    
    if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Deleting...';
    }
    
    $.ajax({
        url: '/admin/blog/delete/' + blogId,
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
                showToast('Blog post deleted successfully', 'success');
                setTimeout(function() {
                    window.location.href = '/admin/blog';
                }, 500);
            } else {
                showToast(response.message || 'Failed to delete blog post', 'error');
                if (deleteBtn) {
                    deleteBtn.disabled = false;
                    deleteBtn.innerHTML = originalText;
                }
            }
        },
        error: function(xhr, status, error) {
            showToast('An error occurred. Please try again.', 'error');
            if (deleteBtn) {
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = originalText;
            }
            console.error('Delete error:', error);
        }
    });
}

// ===== BLOG FORM INITIALIZATION =====
$(document).ready(function() {
    // Auto-generate slug from title
    const titleInput = $('#title');
    const slugInput = $('#slug');
    
    if (titleInput.length && slugInput.length) {
        titleInput.on('keyup', function() {
            const title = $(this).val();
            if (!slugInput.val() || slugInput.data('auto') === true) {
                const slug = title
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
        
        // Initialize slug auto-generation flag
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
    
    // Meta Title counter
    $('#meta_title').on('keyup', function() {
        const count = $(this).val().length;
        $('#metaTitleCount').text(count);
        if (count > 60) {
            $('#metaTitleCount').css('color', 'red');
        } else {
            $('#metaTitleCount').css('color', '');
        }
    });
    
    // Meta Description counter
    $('#meta_description').on('keyup', function() {
        const count = $(this).val().length;
        $('#metaDescCount').text(count);
        if (count > 160) {
            $('#metaDescCount').css('color', 'red');
        } else {
            $('#metaDescCount').css('color', '');
        }
    });
    
    // ===== DRAG AND DROP FOR IMAGE UPLOAD =====
    const dropZone = document.querySelector('.blog-image-preview');
    
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
    
    // ===== UNSAVED CHANGES WARNING =====
    let formChanged = false;
    
    $('form input, form textarea, form select').on('change', function() {
        formChanged = true;
    });
    
    window.addEventListener('beforeunload', function(e) {
        if (formChanged) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    });
    
    $('form').on('submit', function() {
        formChanged = false;
    });
    
    
});