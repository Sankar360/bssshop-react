// src/components/front/category/FeaturesSidebar.jsx
import React from 'react';

const FeaturesSidebar = ({ features = [], selected = {}, onToggle }) => {
    if (!features || features.length === 0) {
        return (
            <p className="text-muted small mb-0">
                No filters available for this category.
            </p>
        );
    }

    const isChecked = (featureId, valueId) => {
        const arr = selected[featureId] || [];
        return arr.includes(valueId) || arr.includes(String(valueId));
    };

    return (
        <>
            {features.map((feature) => (
                <div
                    key={feature.id}
                    className="co-feature-group"
                    data-feature-id={feature.id}
                >
                    <h6 className="co-feature-title">{feature.name}</h6>
                    <div className="co-feature-options">
                        {feature.input_type === 'color' ? (
                            (feature.values || []).map((value) => (
                                <label
                                    key={value.id}
                                    className="co-color-option"
                                    title={value.value}
                                >
                                    <input
                                        type="checkbox"
                                        value={value.id}
                                        checked={isChecked(feature.id, value.id)}
                                        onChange={() => onToggle(feature.id, value.id)}
                                    />
                                    <span
                                        className="co-color-swatch"
                                        style={{ background: value.value }}
                                    />
                                    <span className="co-color-label">
                                        {value.value}
                                    </span>
                                </label>
                            ))
                        ) : (
                            (feature.values || []).map((value) => (
                                <label key={value.id} className="co-feature-option">
                                    <input
                                        type="checkbox"
                                        value={value.id}
                                        checked={isChecked(feature.id, value.id)}
                                        onChange={() => onToggle(feature.id, value.id)}
                                    />
                                    <span className="co-option-label">
                                        {value.value}
                                    </span>
                                </label>
                            ))
                        )}
                    </div>
                </div>
            ))}
        </>
    );
};

export default FeaturesSidebar;