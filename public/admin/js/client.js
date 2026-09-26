// assets/admin/js/client.js

// ===== TOGGLE PASSWORD VISIBILITY =====
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const icon = document.getElementById(fieldId + 'Icon');
    
    if (!field || !icon) return;
    
    if (field.type === 'password') {
        field.type = 'text';
        icon.className = 'bi bi-eye-slash';
    } else {
        field.type = 'password';
        icon.className = 'bi bi-eye';
    }
}

// ===== PASSWORD STRENGTH INDICATOR =====
document.addEventListener('DOMContentLoaded', function() {
    const passwordField = document.getElementById('password');
    if (passwordField) {
        passwordField.addEventListener('input', function() {
            const password = this.value;
            const container = document.getElementById('passwordStrengthContainer');
            const strengthBar = document.getElementById('passwordStrength');
            const label = document.getElementById('passwordStrengthLabel');
            
            if (!container || !strengthBar || !label) return;
            
            if (password.length > 0) {
                container.style.display = 'block';
                const score = checkPasswordStrength(password);
                const colors = ['#dc3545', '#dc3545', '#ffc107', '#17a2b8', '#28a745'];
                const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
                
                strengthBar.style.width = (score / 5 * 100) + '%';
                strengthBar.style.background = colors[score - 1] || '#e1e5ea';
                label.textContent = labels[score - 1] || '';
                label.style.color = colors[score - 1] || '#6c757d';
            } else {
                container.style.display = 'none';
            }
        });
    }
    
    // Password match validation
    const password = document.getElementById('password');
    const confirm = document.getElementById('password_confirm');
    const feedback = document.getElementById('passwordMatchFeedback');
    
    if (password && confirm && feedback) {
        confirm.addEventListener('input', function() {
            const match = this.value === password.value;
            
            if (this.value.length === 0) {
                feedback.textContent = '';
                feedback.style.display = 'none';
            } else if (match) {
                feedback.innerHTML = '✅ <span style="color: #28a745;">Passwords match!</span>';
                feedback.style.display = 'block';
            } else {
                feedback.innerHTML = '❌ <span style="color: #dc3545;">Passwords do not match!</span>';
                feedback.style.display = 'block';
            }
        });
    }
});

function checkPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*]/.test(password)) score++;
    return score;
}

// ===== PREVIEW AVATAR =====
function previewAvatar(input) {
    const preview = document.getElementById('avatarPreview');
    const placeholder = document.getElementById('avatarPlaceholder');
    
    if (!preview) return;
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            if (placeholder) {
                placeholder.style.display = 'none';
            }
            preview.style.display = 'inline-block';
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

// ===== DELETE CLIENT =====
function deleteClient(clientId) {
    if (!confirm('⚠️ Are you sure you want to delete this client?')) {
        return;
    }
    
    if (!confirm('⚠️ Please confirm again: This will permanently delete the client and all their data. This action cannot be undone!')) {
        return;
    }
    
    const deleteBtn = document.querySelector('.btn-danger');
    const originalText = deleteBtn ? deleteBtn.innerHTML : 'Delete';
    
    if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Deleting...';
    }
    
    $.ajax({
        url: '/admin/clients/delete/' + clientId,
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
                showToast('Client deleted successfully', 'success');
                setTimeout(function() {
                    window.location.href = '/admin/clients';
                }, 500);
            } else {
                showToast(response.message || 'Failed to delete client', 'error');
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

// ===== QUICK ACTIONS =====
function viewClient(clientId) {
    window.location.href = '/admin/clients/view/' + clientId;
}

function viewOrders(clientId) {
    window.location.href = '/admin/orders?client_id=' + clientId;
}

function sendEmail(clientId) {
    window.location.href = '/admin/clients/email/' + clientId;
}

function resetPassword(clientId) {
    if (confirm('Send password reset link to this client?')) {
        $.ajax({
            url: '/admin/clients/reset-password/' + clientId,
            method: 'POST',
            data: {
                '<?= csrf_token() ?>': '<?= csrf_hash() ?>'
            },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    showToast('Password reset link sent successfully', 'success');
                } else {
                    showToast(response.message || 'Failed to send reset link', 'error');
                }
            },
            error: function() {
                showToast('An error occurred. Please try again.', 'error');
            }
        });
    }
}

// ===== TOGGLE CLIENT STATUS =====
function toggleStatus(clientId) {
    // Get current status from the button data or element
    const button = document.querySelector(`.toggle-status[data-id="${clientId}"]`);
    if (!button) return;
    
    const currentStatus = button.dataset.status || 'active';
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} this client?`)) {
        return;
    }
    
    const $button = $(button);
    const originalHtml = $button.html();
    $button.prop('disabled', true).html('<i class="bi bi-spinner bi-spin"></i>');
    
    $.ajax({
        url: '/admin/clients/toggle-status/' + clientId,
        method: 'POST',
        data: {
            status: newStatus,
            '<?= csrf_token() ?>': '<?= csrf_hash() ?>'
        },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showToast(`Client ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`, 'success');
                setTimeout(function() {
                    location.reload();
                }, 500);
            } else {
                showToast(response.message || 'Failed to update status', 'error');
                $button.prop('disabled', false).html(originalHtml);
            }
        },
        error: function() {
            showToast('An error occurred. Please try again.', 'error');
            $button.prop('disabled', false).html(originalHtml);
        }
    });
}

// ===== FORM VALIDATION =====
$(document).ready(function() {
    // Form validation before submit
    $('form').on('submit', function(e) {
        const password = document.getElementById('password');
        const confirm = document.getElementById('password_confirm');
        
        // Check if this is a create page (password required) or edit page (password optional)
        const isCreatePage = window.location.pathname.includes('/create');
        
        if (isCreatePage) {
            // For create page, password is required
            if (password && confirm && password.value !== confirm.value) {
                e.preventDefault();
                showToast('Passwords do not match!', 'error');
                confirm.focus();
                return false;
            }
            
            if (password && password.value.length > 0 && password.value.length < 8) {
                e.preventDefault();
                showToast('Password must be at least 8 characters long.', 'error');
                password.focus();
                return false;
            }
        } else {
            // For edit page, password is optional but must match if provided
            if (password && password.value.length > 0) {
                if (password.value.length < 8) {
                    e.preventDefault();
                    showToast('Password must be at least 8 characters long.', 'error');
                    password.focus();
                    return false;
                }
                
                if (confirm && password.value !== confirm.value) {
                    e.preventDefault();
                    showToast('Passwords do not match!', 'error');
                    confirm.focus();
                    return false;
                }
            }
        }
        
        return true;
    });
});

// ===== UNSAVED CHANGES WARNING =====
let formChanged = false;

$(document).ready(function() {
    $('form input, form textarea, form select').on('change', function() {
        formChanged = true;
    });
    
    $('form').on('submit', function() {
        formChanged = false;
    });
});

window.addEventListener('beforeunload', function(e) {
    if (formChanged) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
    }
});

// ===== CLIENT TABLE SEARCH =====
$(document).on('keyup', '#search', function() {
    const value = $(this).val().toLowerCase();
    $('#clientsTable tbody tr').filter(function() {
        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
    
    // Update counts
    const visible = $('#clientsTable tbody tr:visible').length;
    $('.table-count').text(visible);
});

// ===== CHECK FOR FLASH MESSAGES =====


// ===== TOOLTIP INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});