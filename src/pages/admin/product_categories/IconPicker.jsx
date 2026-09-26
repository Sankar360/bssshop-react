// src/pages/admin/product_categories/IconPicker.jsx
import React from 'react';

export const POPULAR_ICONS = [
    'bi-laptop', 'bi-bag', 'bi-house', 'bi-flower1',
    'bi-bicycle', 'bi-microwave', 'bi-phone', 'bi-tv',
    'bi-headphones', 'bi-watch', 'bi-gem', 'bi-cup-hot',
];

/** Renders a grid of clickable icon chips that set a value */
export const IconPicker = ({ onSelect, selected }) => (
    <div className="card mt-4">
        <div className="card-header">
            <h6 className="mb-0">
                <i className="bi bi-grid-3x3-gap"></i> Popular Icon References
            </h6>
        </div>
        <div className="card-body">
            <div className="row g-2">
                {POPULAR_ICONS.map((icon) => (
                    <div className="col-md-3" key={icon}>
                        <span
                            className={`badge p-2 ${
                                selected === icon
                                    ? 'bg-primary text-white'
                                    : 'bg-light text-dark'
                            }`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => onSelect(icon)}
                        >
                            <i className={`bi ${icon}`}></i> {icon}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

/** Renders the shared category preview card */
export const CategoryPreview = ({ name, icon, itemCount }) => (
    <div className="category-card p-3 border rounded">
        <div className="d-flex align-items-center gap-3">
            <div
                className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle"
                style={{ width: 60, height: 60 }}
            >
                <i className={`bi ${icon || 'bi-box'} fs-2`}></i>
            </div>
            <div>
                <h5 className="mb-0">{name || 'Category Name'}</h5>
                <span className="text-muted">{itemCount || 0} items</span>
            </div>
        </div>
    </div>
);