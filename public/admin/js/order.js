// assets/admin/js/order.js

// ===== DELETE ORDER =====
function deleteOrder(orderId) {
    if (!confirm('⚠️ Are you sure you want to delete this order? This action cannot be undone.')) {
        return;
    }
    
    if (!confirm('⚠️ Please confirm again: This will permanently delete the order and all its items.')) {
        return;
    }
    
    const deleteBtn = document.querySelector('.btn-outline-danger');
    const originalText = deleteBtn ? deleteBtn.innerHTML : 'Delete';
    
    if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Deleting...';
    }
    
    $.ajax({
        url: '/admin/orders/delete/' + orderId,
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
                showToast('Order deleted successfully', 'success');
                setTimeout(function() {
                    window.location.href = '/admin/orders';
                }, 500);
            } else {
                showToast(response.message || 'Failed to delete order', 'error');
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

// ===== PRINT ORDER =====
function printOrder() {
    window.print();
}

// ===== EXPORT FUNCTIONS =====
function exportOrders() {
    // Show export options modal
    $('#exportModal').modal('show');
}

function exportCSV() {
    window.location.href = '/admin/orders/export/csv';
}

function exportPDF() {
    showToast('PDF export coming soon!', 'info');
}

function exportExcel() {
    showToast('Excel export coming soon!', 'info');
}

// ===== ORDER TABLE SEARCH =====
$(document).on('keyup', '#search', function() {
    const value = $(this).val().toLowerCase();
    $('#ordersTable tbody tr').filter(function() {
        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
});

// ===== TOOLTIP INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// ===== BULK ACTIONS =====
function selectAllOrders() {
    const checkboxes = document.querySelectorAll('.order-checkbox');
    const selectAll = document.getElementById('selectAll');
    
    if (selectAll) {
        checkboxes.forEach(function(checkbox) {
            checkbox.checked = selectAll.checked;
        });
        updateBulkActions();
    }
}

function updateBulkActions() {
    const checked = document.querySelectorAll('.order-checkbox:checked').length;
    const bulkActions = document.getElementById('bulkActions');
    
    if (bulkActions) {
        if (checked > 0) {
            bulkActions.style.display = 'block';
            document.getElementById('selectedCount').textContent = checked;
        } else {
            bulkActions.style.display = 'none';
        }
    }
}

function bulkAction(action) {
    const selected = [];
    document.querySelectorAll('.order-checkbox:checked').forEach(function(checkbox) {
        selected.push(checkbox.value);
    });
    
    if (selected.length === 0) {
        showToast('Please select at least one order.', 'warning');
        return;
    }
    
    if (!confirm(`Are you sure you want to ${action} ${selected.length} order(s)?`)) {
        return;
    }
    
    // Get CSRF token from meta tag or hidden input
    const csrfToken = $('meta[name="csrf-token"]').attr('content') || $('input[name="<?= csrf_token() ?>"]').val();
    const csrfName = '<?= csrf_token() ?>';
    
    $.ajax({
        url: '/admin/orders/bulk-action',
        method: 'POST',
        data: {
            action: action,
            order_ids: selected,
            [csrfName]: csrfToken
        },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showToast(response.message || 'Bulk action completed successfully', 'success');
                setTimeout(function() {
                    location.reload();
                }, 500);
            } else {
                showToast(response.message || 'Failed to perform bulk action', 'error');
            }
        },
        error: function() {
            showToast('An error occurred. Please try again.', 'error');
        }
    });
}

// ===== ORDER DETAIL VIEW =====
function viewOrder(orderId) {
    window.location.href = '/admin/orders/view/' + orderId;
}

// ===== UNSAVED CHANGES WARNING =====
let formChanged = false;

$(document).ready(function() {
    // Form change detection
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

// ===== AUTO-REFRESH ORDERS =====
let refreshInterval;

function startAutoRefresh() {
    // Clear any existing interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    refreshInterval = setInterval(function() {
        if (!document.hidden) {
            $.ajax({
                url: '/admin/orders/check-updates',
                method: 'GET',
                success: function(response) {
                    if (response.has_updates) {
                        showToast('New orders have been placed!', 'info');
                    }
                },
                error: function() {
                    // Silent fail
                }
            });
        }
    }, 30000);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// Start auto-refresh on page load
$(document).ready(function() {
    startAutoRefresh();
});

// Stop auto-refresh when page is hidden
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        stopAutoRefresh();
    } else {
        startAutoRefresh();
    }
});