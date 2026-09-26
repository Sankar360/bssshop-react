// Initialize tooltips
document.addEventListener('DOMContentLoaded', function() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// Delete invoice
function deleteInvoice(id) {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
        return;
    }
    
    $.ajax({
        url: '/admin/invoices/delete/' + id,
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
            } else {
                showToast(response.message, 'error');
            }
        },
        error: function() {
            showToast('An error occurred. Please try again.', 'error');
        }
    });
}

// Export functions
function exportInvoices() {
    $('#exportModal').modal('show');
}

function exportCSV() {
    window.location.href = '/admin/invoices/export/csv';
}

// Delete invoice
function deleteInvoice(id) {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
        return;
    }
    
    $.ajax({
        url: '/admin/invoices/delete/' + id,
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
                    window.location.href = '/admin/invoices';
                }, 500);
            } else {
                showToast(response.message, 'error');
            }
        },
        error: function() {
            showToast('An error occurred. Please try again.', 'error');
        }
    });
}
