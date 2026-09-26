
// ===== DELETE FAQ =====
function deleteFaq(faqId) {
    if (!confirm('⚠️ Are you sure you want to delete this FAQ?')) {
        return;
    }
    
    if (!confirm('⚠️ Please confirm again: This action cannot be undone!')) {
        return;
    }
    
    // Show loading state
    const deleteBtn = document.querySelector('.btn-danger');
    const originalText = deleteBtn.innerHTML;
    deleteBtn.disabled = true;
    deleteBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Deleting...';
    
    $.ajax({
        url: '/admin/faqs/delete/' + faqId,
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
                showToast('FAQ deleted successfully', 'success');
                setTimeout(() => {
                    window.location.href = '/admin/faqs';
                }, 500);
            } else {
                showToast(response.message || 'Failed to delete FAQ', 'error');
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = originalText;
            }
        },
        error: function(xhr, status, error) {
            showToast('An error occurred. Please try again.', 'error');
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = originalText;
            console.error('Delete error:', error);
        }
    });
}


// ===== UNSAVED CHANGES WARNING =====
let formChanged = false;

document.querySelector('form').addEventListener('change', function() {
    formChanged = true;
});

window.addEventListener('beforeunload', function(e) {
    if (formChanged) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
    }
});

// Reset form changed flag on submit
document.querySelector('form').addEventListener('submit', function() {
    formChanged = false;
});

// ===== AUTO-GENERATE CATEGORY SUGGESTIONS =====
$(document).ready(function() {
    // Common FAQ categories for autocomplete suggestions
    const commonCategories = ['General', 'Payments', 'Shipping', 'Returns', 'Products', 'Orders', 'Account', 'Support'];
    
    $('#category').on('keyup', function() {
        const value = $(this).val().toLowerCase();
        if (value.length > 1) {
            const suggestions = commonCategories.filter(cat => 
                cat.toLowerCase().includes(value)
            );
            // You can implement a dropdown suggestions list here if needed
        }
    });
   
});

$(document).ready(function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize Sortable for reordering
    const el = document.getElementById('faqSortable');
    if (el) {
        const sortable = new Sortable(el, {
            handle: '.drag-handle',
            animation: 150,
            onEnd: function() {
                const ids = [];
                $('#faqSortable tr').each(function() {
                    ids.push($(this).data('id'));
                });
                updateOrder(ids);
            }
        });
    }

    function updateOrder(ids) {
        $.ajax({
            url: '/admin/faqs/reorder',
            method: 'POST',
            data: {
                orders: ids,
                '<?= csrf_token() ?>': '<?= csrf_hash() ?>'
            },
            success: function(response) {
                if (response.success) {
                    showToast('FAQs reordered successfully', 'success');
                }
            },
            error: function() {
                showToast('Failed to reorder FAQs', 'error');
            }
        });
    }

    // Toggle status
    $('.toggle-status').on('click', function() {
        const id = $(this).data('id');
        const currentStatus = $(this).data('status');
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        
        if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this FAQ?`)) {
            return;
        }
        
        const button = $(this);
        button.prop('disabled', true).html('<i class="bi bi-spinner bi-spin"></i>');
        
        $.ajax({
            url: '/admin/faqs/toggle-status/' + id,
            method: 'POST',
            data: {
                '<?= csrf_token() ?>': '<?= csrf_hash() ?>'
            },
            success: function(response) {
                if (response.success) {
                    location.reload();
                } else {
                    showToast(response.message, 'error');
                    button.prop('disabled', false);
                }
            },
            error: function() {
                showToast('An error occurred. Please try again.', 'error');
                button.prop('disabled', false);
            }
        });
    });

    // Delete FAQ
    $('.delete-faq').on('click', function() {
        const id = $(this).data('id');
        const question = $(this).data('question');
        $('#deleteFaqId').val(id);
        $('#deleteFaqQuestion').text(question);
        $('#deleteModal').modal('show');
    });

    $('#confirmDelete').on('click', function() {
        const id = $('#deleteFaqId').val();
        const button = $(this);
        button.prop('disabled', true).html('<i class="bi bi-spinner bi-spin"></i>');
        
        $.ajax({
            url: '/admin/faqs/delete/' + id,
            method: 'DELETE',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            data: {
                '<?= csrf_token() ?>': '<?= csrf_hash() ?>'
            },
            success: function(response) {
                if (response.success) {
                    showToast(response.message, 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 500);
                    $('#deleteModal').modal('hide');
                } else {
                    showToast(response.message, 'error');
                }
            },
            error: function() {
                showToast('An error occurred. Please try again.', 'error');
            },
            complete: function() {
                button.prop('disabled', false).html('<i class="bi bi-trash"></i> Delete');
            }
        });
    });
});

function exportFaqs() {
    window.location.href = '/admin/faqs/export/csv';
}
