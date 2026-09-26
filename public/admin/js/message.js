
// Initialize tooltips
document.addEventListener('DOMContentLoaded', function() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// Select all functionality
function toggleSelectAll() {
    const checked = $('#selectAll').prop('checked');
    $('.message-checkbox').prop('checked', checked);
    updateSelectedCount();
}

$(document).on('change', '.message-checkbox', function() {
    updateSelectedCount();
});

function updateSelectedCount() {
    const count = $('.message-checkbox:checked').length;
    $('#selectedCount').text(count + ' messages selected');
}

// Reply modal
$(document).on('click', '.reply-btn', function() {
    const id = $(this).data('id');
    const name = $(this).data('name');
    const email = $(this).data('email');
    const subject = $(this).data('subject');
    
    $('#replyMessageId').val(id);
    $('#replyTo').html('<strong>' + name + '</strong> &lt;' + email + '&gt;');
    $('#replySubject').text('Re: ' + subject);
    $('#replyMessage').val('');
    $('#replyModal').modal('show');
});

// Send reply
$('#sendReply').on('click', function() {
    const id = $('#replyMessageId').val();
    const reply = $('#replyMessage').val();
    const button = $(this);
    
    if (!reply.trim()) {
        alert('Please enter a reply message.');
        return;
    }
    
    button.prop('disabled', true).html('<i class="bi bi-spinner bi-spin"></i> Sending...');
    
    $.ajax({
        url: '/admin/messages/reply/' + id,
        method: 'POST',
        data: {
            reply: reply,
            '<?= csrf_token() ?>': '<?= csrf_hash() ?>'
        },
        success: function(response) {
            if (response.success) {
                showToast(response.message, 'success');
                $('#replyModal').modal('hide');
                setTimeout(() => {
                    location.reload();
                }, 500);
            } else {
                showToast(response.message, 'error');
            }
        },
        error: function() {
            showToast('An error occurred. Please try again.', 'error');
        },
        complete: function() {
            button.prop('disabled', false).html('<i class="bi bi-send"></i> Send Reply');
        }
    });
});

// Delete message
$(document).on('click', '.delete-message', function() {
    const id = $(this).data('id');
    $('#deleteMessageId').val(id);
    $('#deleteModal').modal('show');
});

$('#confirmDelete').on('click', function() {
    const id = $('#deleteMessageId').val();
    const button = $(this);
    button.prop('disabled', true).html('<i class="bi bi-spinner bi-spin"></i>');
    
    $.ajax({
        url: '/admin/messages/delete/' + id,
        method: 'DELETE',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        data: {
            '<?= csrf_token() ?>': '<?= csrf_hash() ?>'
        },
        success: function(response) {
            if (response.success) {
                const row = $(`tr[data-id="${id}"]`);
                row.fadeOut(400, function() {
                    $(this).remove();
                    showToast(response.message, 'success');
                    updateStats();
                });
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

// Bulk action
function bulkAction() {
    const action = $('#bulkAction').val();
    const selectedIds = $('.message-checkbox:checked').map(function() {
        return $(this).val();
    }).get();
    
    if (!action) {
        alert('Please select an action.');
        return;
    }
    
    if (selectedIds.length === 0) {
        alert('Please select at least one message.');
        return;
    }
    
    if (!confirm('Are you sure you want to perform this action on ' + selectedIds.length + ' messages?')) {
        return;
    }
    
    $.ajax({
        url: '/admin/messages/bulk-action',
        method: 'POST',
        data: {
            action: action,
            message_ids: selectedIds,
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

// Export messages
function exportMessages() {
    window.location.href = '/admin/messages/export/csv';
}

// Update stats
function updateStats() {
    const total = $('#messagesTable tbody tr:visible').length;
    const unread = $('#messagesTable tbody tr:visible .badge.bg-danger').length;
    const read = $('#messagesTable tbody tr:visible .badge.bg-info').length;
    const replied = $('#messagesTable tbody tr:visible .badge.bg-success').length;
    
    $('.stat-card').eq(0).find('h3').text(total);
    $('.stat-card').eq(1).find('h3').text(unread);
    $('.stat-card').eq(2).find('h3').text(read);
    $('.stat-card').eq(3).find('h3').text(replied);
    $('.badge.bg-primary.rounded-pill').text(total);
    $('#unreadCount').text(unread);
}

// Auto-refresh for new messages
let refreshInterval = setInterval(function() {
    if (!document.hidden) {
        $.ajax({
            url: '/admin/messages/check-updates',
            method: 'GET',
            success: function(response) {
                if (response.has_updates) {
                    showToast(response.unread_count + ' new message(s) received!', 'info');
                    $('#unreadCount').text(response.unread_count);
                    // Update badge in sidebar
                    if (response.unread_count > 0) {
                        $('#messageBadge').text(response.unread_count).show();
                    } else {
                        $('#messageBadge').hide();
                    }
                }
            }
        });
    }
}, 30000);

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        clearInterval(refreshInterval);
    }
});

// Reply functionality
$(document).on('click', '.reply-btn', function() {
    const id = $(this).data('id');
    const name = $(this).data('name');
    const email = $(this).data('email');
    const subject = $(this).data('subject');
    
    $('#replyMessageId').val(id);
    $('#replyTo').html('<strong>' + name + '</strong> &lt;' + email + '&gt;');
    $('#replySubject').text('Re: ' + subject);
    $('#replyMessage').val('');
    $('#replyModal').modal('show');
});

$('#sendReply').on('click', function() {
    const id = $('#replyMessageId').val();
    const reply = $('#replyMessage').val();
    const button = $(this);
    
    if (!reply.trim()) {
        alert('Please enter a reply message.');
        return;
    }
    
    button.prop('disabled', true).html('<i class="bi bi-spinner bi-spin"></i> Sending...');
    
    $.ajax({
        url: '/admin/messages/reply/' + id,
        method: 'POST',
        data: {
            reply: reply,
            '<?= csrf_token() ?>': '<?= csrf_hash() ?>'
        },
        success: function(response) {
            if (response.success) {
                showToast(response.message, 'success');
                $('#replyModal').modal('hide');
                setTimeout(() => {
                    location.reload();
                }, 500);
            } else {
                showToast(response.message, 'error');
            }
        },
        error: function() {
            showToast('An error occurred. Please try again.', 'error');
        },
        complete: function() {
            button.prop('disabled', false).html('<i class="bi bi-send"></i> Send Reply');
        }
    });
});

// Delete message
$(document).on('click', '.delete-message', function() {
    const id = $(this).data('id');
    
    if (!confirm('Are you sure you want to delete this message?')) {
        return;
    }
    
    $.ajax({
        url: '/admin/messages/delete/' + id,
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
                    window.location.href = '/admin/messages';
                }, 500);
            } else {
                showToast(response.message, 'error');
            }
        },
        error: function() {
            showToast('An error occurred. Please try again.', 'error');
        }
    });
});

