// assets/admin/js/profile.js

// ===== DELETE ACCOUNT =====
function deleteAccount() {
    if (confirm('⚠️ Are you sure you want to delete your account? This action cannot be undone!')) {
        if (confirm('⚠️ Please confirm again: This will permanently delete all your data.')) {
            // Show loading state
            const deleteBtn = document.querySelector('.btn-danger');
            const originalText = deleteBtn ? deleteBtn.innerHTML : 'Delete';
            
            if (deleteBtn) {
                deleteBtn.disabled = true;
                deleteBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Deleting...';
            }
            
            $.ajax({
                url: '/admin/profile/delete-account',
                method: 'POST',
                data: {
                    confirm: true,
                    '<?= csrf_token() ?>': '<?= csrf_hash() ?>'
                },
                dataType: 'json',
                success: function(response) {
                    if (response.success) {
                        showToast('Account deleted successfully', 'success');
                        setTimeout(function() {
                            window.location.href = response.redirect || '/';
                        }, 500);
                    } else {
                        showToast(response.message || 'Failed to delete account', 'error');
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
                    console.error('Delete account error:', error);
                }
            });
        }
    }
}

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
    const passwordField = document.getElementById('new_password');
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
    const password = document.getElementById('new_password');
    const confirm = document.getElementById('confirm_password');
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

// ===== FORM VALIDATION =====
$(document).ready(function() {
    // Password change form validation
    $('form').on('submit', function(e) {
        const password = document.getElementById('new_password');
        const confirm = document.getElementById('confirm_password');
        
        // Check if this is the change password form
        if (password && confirm) {
            // Only validate if password field has value (user is trying to change password)
            if (password.value.length > 0) {
                if (password.value.length < 8) {
                    e.preventDefault();
                    showToast('Password must be at least 8 characters long.', 'error');
                    password.focus();
                    return false;
                }
                
                if (password.value !== confirm.value) {
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

// ===== TOOLTIP INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// ===== DELETE ACCOUNT BUTTON HANDLER =====
$(document).on('click', '.btn-danger.delete-account', function(e) {
    e.preventDefault();
    deleteAccount();
});