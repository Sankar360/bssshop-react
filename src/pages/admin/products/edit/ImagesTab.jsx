// src/pages/admin/products/edit/ImagesTab.jsx
import React, { useEffect, useState } from 'react';
import { Images, CloudUpload, StarFill, Star, Trash } from 'react-bootstrap-icons';
import { showToast } from '../../../../utils/toast';
import API_URL from "../../../../api/config";
import { productImage as imageUrl } from "../../../../utils/productImage";

const API_BASE = API_URL + "/admin";
const getToken = () => localStorage.getItem('admin_token') || '';

const ImagesTab = ({ productId, onRefresh }) => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        try {
            const res = await fetch(`${API_BASE}/products/get-images/${productId}`, {
                headers: { Accept: 'application/json', Authorization: `Bearer ${getToken()}` },
            });
            const data = await res.json();
            if (data.success) {
    const list = data.data || data.images || [];
    setImages(Array.isArray(list) ? list : []);
}
        } catch {/* ignore */}
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [productId]);

    const upload = async (files) => {
        setLoading(true);
        const fd = new FormData();
        files.forEach((f) => fd.append('images[]', f));
        try {
            const res = await fetch(`${API_BASE}/products/upload-multiple-images/${productId}`, {
                method: 'POST',
                headers: { Accept: 'application/json', Authorization: `Bearer ${getToken()}` },
                body: fd,
            });
            const data = await res.json();
            if (data.success) {
                showToast('Images uploaded', 'success');
                load();
                onRefresh?.();
            } else showToast(data.message || 'Upload failed', 'error');
        } catch {
            showToast('Upload error', 'error');
        } finally {
            setLoading(false);
        }
    };

    const setPrimary = async (imageId) => {
        try {
            const res = await fetch(`${API_BASE}/products/set-primary-image/${productId}/${imageId}`, {
                method: 'POST',
                headers: { Accept: 'application/json', Authorization: `Bearer ${getToken()}` },
            });
            const data = await res.json();
            if (data.success) { showToast('Primary image updated', 'success'); load(); }
            else showToast(data.message, 'error');
        } catch {
            showToast('Error', 'error');
        }
    };

    const remove = async (imageId) => {
        if (!window.confirm('Delete this image?')) return;
        try {
            const res = await fetch(`${API_BASE}/products/remove-multiple-image/${productId}/${imageId}`, {
                method: 'DELETE',
                headers: { Accept: 'application/json', Authorization: `Bearer ${getToken()}` },
            });
            const data = await res.json();
            if (data.success) { showToast('Removed', 'success'); load(); onRefresh?.(); }
            else showToast(data.message, 'error');
        } catch {
            showToast('Error', 'error');
        }
    };

    return (
        <div className="card mt-3">
            <div className="card-header"><h6 className="mb-0"><Images className="me-1" /> Product Images</h6></div>
            <div className="card-body">
                <div className="mb-4">
                    <label className="form-label fw-semibold">Upload Multiple Images</label>
                    <label
                        className="dropzone-area d-block"
                        style={{
                            border: '3px dashed #dee2e6', borderRadius: 10,
                            padding: '40px 20px', textAlign: 'center',
                            cursor: 'pointer', background: '#f8f9fa',
                        }}
                    >
                        <CloudUpload style={{ fontSize: '3rem' }} />
                        <p className="mb-0">Drag & drop images here or click to select</p>
                        <small className="text-muted">Max 5MB each | JPG, PNG, GIF, WEBP</small>
                        <input
                            type="file" multiple accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => e.target.files && upload(Array.from(e.target.files))}
                        />
                    </label>
                    {loading && <div className="progress mt-2"><div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: '100%' }} /></div>}
                </div>

                <div className="row g-3">
                    {images.length === 0 ? (
                        <div className="col-12 text-center py-5">
                            <Images className="text-muted" style={{ fontSize: '4rem' }} />
                            <p className="text-muted mt-3">No images uploaded yet</p>
                        </div>
                    ) : (
                        images.map((img) => (
                            <div className="col-3 col-md-2" key={img.id}>
                                <div
                                    className="product-image-card position-relative"
                                    style={{
                                        borderRadius: 8, overflow: 'hidden',
                                        border: img.is_primary ? '3px solid #4e73df' : '3px solid transparent',
                                    }}
                                >
                                    <img src={imageUrl(img.image)} alt="" style={{ width: '100%', height: 150, objectFit: 'cover' }} />
                                    <div
                                        className="image-actions position-absolute bottom-0 start-0 end-0 p-1 d-flex justify-content-center gap-1"
                                        style={{ background: 'rgba(0,0,0,.4)' }}
                                    >
                                        {img.is_primary ? (
                                            <span className="badge bg-primary"><StarFill /> Primary</span>
                                        ) : (
                                            <button className="btn btn-sm btn-primary" onClick={() => setPrimary(img.id)}>
                                                <Star />
                                            </button>
                                        )}
                                        <button className="btn btn-sm btn-danger" onClick={() => remove(img.id)}>
                                            <Trash />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImagesTab;