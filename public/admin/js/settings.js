
$(document).ready(function() {
    // Smooth scroll to section
    $('.settings-nav').on('click', function(e) {
        e.preventDefault();
        const target = $(this).attr('href');
        $('html, body').animate({
            scrollTop: $(target).offset().top - 80
        }, 500);
        
        $('.settings-nav').removeClass('active');
        $(this).addClass('active');
    });

    // Auto-save indicator
    $('form input, form textarea, form select').on('change', function() {
        $(this).addClass('border-warning');
        setTimeout(() => {
            $(this).removeClass('border-warning');
        }, 2000);
    });
});
// ===== DELETE ITEM =====
function deleteItem(type, id) {
    if (confirm(`Are you sure you want to delete this ${type}?`)) {
        $.ajax({
            url: `/admin/settings/${type}/delete/${id}`,
            method: 'POST',
            data: {
                '<?= csrf_token() ?>': '<?= csrf_hash() ?>'
            },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    showToast(response.message, 'success');
                    setTimeout(() => location.reload(), 500);
                } else {
                    showToast(response.message, 'error');
                }
            },
            error: function() {
                showToast('An error occurred. Please try again.', 'error');
            }
        });
    }
}

// ===== SET DEFAULT =====
function setDefault(type, id) {
    $.ajax({
        url: `/admin/settings/set-default-${type}/${id}`,
        method: 'POST',
        data: {
            '<?= csrf_token() ?>': '<?= csrf_hash() ?>'
        },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showToast(response.message, 'success');
                setTimeout(() => location.reload(), 500);
            } else {
                showToast(response.message, 'error');
            }
        },
        error: function() {
            showToast('An error occurred. Please try again.', 'error');
        }
    });
}

// ===== TOGGLE STATUS =====
function toggleItem(type, id) {
    $.ajax({
        url: `/admin/settings/${type}/toggle/${id}`,
        method: 'POST',
        data: {
            '<?= csrf_token() ?>': '<?= csrf_hash() ?>'
        },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showToast(response.message, 'success');
                setTimeout(() => location.reload(), 500);
            } else {
                showToast(response.message, 'error');
            }
        },
        error: function() {
            showToast('An error occurred. Please try again.', 'error');
        }
    });
}

// ===== MODAL FUNCTIONS =====
function showAddLanguageModal() {
    // Implementation for add language modal
    // You can use Bootstrap modal or a simple prompt
    const code = prompt('Enter language code (e.g., en, es, fr):');
    if (!code) return;
    
    const name = prompt('Enter language name (e.g., English, Spanish):');
    if (!name) return;
    
    const nativeName = prompt('Enter native name (e.g., English, Español):');
    if (!nativeName) return;
    
    const flag = prompt('Enter flag emoji (e.g., 🇬🇧, 🇪🇸):') || '🌍';
    
    $.ajax({
        url: '/admin/settings/language/add',
        method: 'POST',
        data: {
            code: code.toLowerCase(),
            name: name,
            native_name: nativeName,
            flag: flag,
            is_active: 1,
            '<?= csrf_token() ?>': '<?= csrf_hash() ?>'
        },
        success: function(response) {
            if (response.success) {
                showToast('Language added successfully', 'success');
                setTimeout(() => location.reload(), 500);
            } else {
                showToast(response.message || 'Failed to add language', 'error');
            }
        },
        error: function() {
            showToast('An error occurred. Please try again.', 'error');
        }
    });
}

function showAddTimezoneModal() {
    const name = prompt('Enter timezone name (e.g., America/New_York):');
    if (!name) return;
    
    const offset = prompt('Enter offset (e.g., -05:00, +00:00):');
    if (!offset) return;
    
    const abbreviation = prompt('Enter abbreviation (e.g., EST, UTC):');
    if (!abbreviation) return;
    
    $.ajax({
        url: '/admin/settings/timezone/add',
        method: 'POST',
        data: {
            name: name,
            offset: offset,
            abbreviation: abbreviation,
            is_active: 1,
            '<?= csrf_token() ?>': '<?= csrf_hash() ?>'
        },
        success: function(response) {
            if (response.success) {
                showToast('Timezone added successfully', 'success');
                setTimeout(() => location.reload(), 500);
            } else {
                showToast(response.message || 'Failed to add timezone', 'error');
            }
        },
        error: function() {
            showToast('An error occurred. Please try again.', 'error');
        }
    });
}

function showAddThemeModal() {
    const name = prompt('Enter theme name (e.g., purple, orange):');
    if (!name) return;
    
    const displayName = prompt('Enter display name (e.g., Purple, Orange):');
    if (!displayName) return;
    
    const description = prompt('Enter description (optional):') || '';
    
    $.ajax({
        url: '/admin/settings/theme/add',
        method: 'POST',
        data: {
            name: name.toLowerCase(),
            display_name: displayName,
            description: description,
            is_active: 1,
            '<?= csrf_token() ?>': '<?= csrf_hash() ?>'
        },
        success: function(response) {
            if (response.success) {
                showToast('Theme added successfully', 'success');
                setTimeout(() => location.reload(), 500);
            } else {
                showToast(response.message || 'Failed to add theme', 'error');
            }
        },
        error: function() {
            showToast('An error occurred. Please try again.', 'error');
        }
    });
}

function editLanguage(id) {
    // Implementation for edit language
    const newName = prompt('Enter new language name:');
    if (!newName) return;
    // Add more fields as needed
    alert('Edit functionality - implement full modal for editing');
}

function editTimezone(id) {
    alert('Edit functionality - implement full modal for editing');
}

function editTheme(id) {
    alert('Edit functionality - implement full modal for editing');
}

