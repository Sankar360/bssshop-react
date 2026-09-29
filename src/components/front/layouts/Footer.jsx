// src/components/front/layouts/Footer.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { showToast } from '../../../utils/toast';
import { useSettings } from '../../../contexts/SettingsContext';

const Footer = ({ footerMenus = [] }) => {
    const year = new Date().getFullYear();
    const [email, setEmail] = useState('');
    const { settings } = useSettings();

    const handleNewsletterSubmit = (e) => {
        e.preventDefault();
        if (email) {
            showToast('✓ Subscribed successfully!', 'success');
            setEmail('');
        }
    };

    /* -------------------------------------------------------------- */
    /*  Normalise URLs so we never emit "//"                          */
    /* -------------------------------------------------------------- */
    const normaliseUrl = (url) => {
        if (!url) return '/';
        if (/^https?:\/\//i.test(url)) return url;
        return url.replace(/([^:]\/)\/+/g, '$1');
    };

    /* -------------------------------------------------------------- */
    /*  Render menu link                                              */
    /* -------------------------------------------------------------- */
    const renderMenuLink = (menu) => {
        const url = normaliseUrl(menu.url || '/');
        const isExternal = /^https?:\/\//i.test(url);

        const content = (
            <>
                <i
                    className="bi bi-chevron-right text-primary me-1"
                    style={{ fontSize: '0.7rem' }}
                ></i>
                {menu.menu_name}
            </>
        );

        if (isExternal) {
            return (
                <a href={url} target="_blank" rel="noopener noreferrer">
                    {content}
                </a>
            );
        }
        return <Link to={url}>{content}</Link>;
    };

    /* -------------------------------------------------------------- */
    /*  Fallback static menus                                          */
    /* -------------------------------------------------------------- */
    const fallbackMenus = [
        { id: 'home',      menu_name: 'Home',      url: '/' },
        { id: 'category',  menu_name: 'Products',  url: '/category' },
        { id: 'blog',      menu_name: 'Blog',      url: '/blog' },
        { id: 'faq',       menu_name: 'FAQ',       url: '/faq' },
        { id: 'contact',   menu_name: 'Contact',   url: '/contact' },
    ];
    const menusToRender = footerMenus.length > 0 ? footerMenus : fallbackMenus;

    /* -------------------------------------------------------------- */
    /*  Social links — only render those with a URL                   */
    /* -------------------------------------------------------------- */
    const socialLinks = [
        { key: 'social_facebook',  icon: 'bi-facebook',  label: 'Facebook' },
        { key: 'social_twitter',   icon: 'bi-twitter',   label: 'Twitter' },
        { key: 'social_instagram', icon: 'bi-instagram', label: 'Instagram' },
        { key: 'social_youtube',   icon: 'bi-youtube',   label: 'YouTube' },
        { key: 'social_linkedin',  icon: 'bi-linkedin',  label: 'LinkedIn' },
    ].filter((s) => settings[s.key]);

    /* -------------------------------------------------------------- */
    /*  Pretty address — adds spaces after commas                     */
    /* -------------------------------------------------------------- */
    const prettyAddress = String(settings.site_address || '')
        .replace(/,\s*/g, ', ')
        .trim();

    return (
        <footer className="footer">
            <div className="container">
                <div className="row g-4">
                    <div className="col-lg-4 col-md-6">
                        <div className="footer-brand">
                            <h4>
                                <i className="bi bi-shop text-primary"></i>{' '}
                                {settings.site_name || 'BSSShop'}
                            </h4>
                            <p className="text-muted mt-3">
                                {settings.site_description ||
                                    'Your one-stop destination for premium products.'}
                            </p>

                            {socialLinks.length > 0 && (
                                <div className="social-links mt-3">
                                    {socialLinks.map((s) => (
                                        <a
                                            key={s.key}
                                            href={settings[s.key]}
                                            className="social-link"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={s.label}
                                        >
                                            <i className={`bi ${s.icon}`}></i>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="col-lg-2 col-md-6 mb-4">
                        <h6 className="footer-heading">Quick Links</h6>
                        <ul className="list-unstyled footer-links">
                            {menusToRender.map((menu) => (
                                <li className="mb-2" key={menu.id}>
                                    {renderMenuLink(menu)}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="col-lg-2 col-md-6">
                        <h5 className="footer-heading">Customer Service</h5>
                        <ul className="footer-links">
                            <li>
                                <Link to="/orders">
                                    <i className="bi bi-chevron-right"></i> My Orders
                                </Link>
                            </li>
                            <li>
                                <Link to="/wishlist">
                                    <i className="bi bi-chevron-right"></i> Wishlist
                                </Link>
                            </li>
                            <li>
                                <Link to="/cart">
                                    <i className="bi bi-chevron-right"></i> Cart
                                </Link>
                            </li>
                            <li>
                                <Link to="/auth/login">
                                    <i className="bi bi-chevron-right"></i> Login
                                </Link>
                            </li>
                            <li>
                                <Link to="/auth/register">
                                    <i className="bi bi-chevron-right"></i> Register
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="col-lg-4 col-md-6">
                        <h5 className="footer-heading">Stay Connected</h5>
                        <div className="footer-contact">
                            {settings.site_email && (
                                <p>
                                    <i className="bi bi-envelope"></i>{' '}
                                    <a
                                        href={`mailto:${settings.site_email}`}
                                        className="text-decoration-none text-muted"
                                    >
                                        {settings.site_email}
                                    </a>
                                </p>
                            )}
                            {settings.site_phone && (
                                <p>
                                    <i className="bi bi-phone"></i>{' '}
                                    <a
                                        href={`tel:${settings.site_phone.replace(/\s+/g, '')}`}
                                        className="text-decoration-none text-muted"
                                    >
                                        {settings.site_phone}
                                    </a>
                                </p>
                            )}
                            {settings.site_address && (
                                <p>
                                    <i className="bi bi-geo-alt"></i> {prettyAddress}
                                </p>
                            )}
                        </div>
                        <div className="newsletter mt-3">
                            <p className="mb-2 text-muted">
                                Subscribe to our newsletter
                            </p>
                            <form
                                id="newsletterForm"
                                className="d-flex"
                                onSubmit={handleNewsletterSubmit}
                            >
                                <input
                                    type="email"
                                    className="form-control form-control-sm"
                                    placeholder="Your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-sm ms-2"
                                >
                                    <i className="bi bi-send"></i>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <hr className="footer-divider" />

                <div className="footer-bottom">
                    <div className="row align-items-center">
                        <div className="col-md-6 text-center text-md-start">
                            <p className="mb-0">
                                &copy; {year} {settings.site_name || 'BSSShop'}. All rights reserved.
                            </p>
                        </div>
                        <div className="col-md-6 text-center text-md-end">
                            <div className="payment-icons">
                                <i className="bi bi-credit-card"></i>
                                <i className="bi bi-paypal"></i>
                                <i className="bi bi-stripe"></i>
                                <i className="bi bi-apple"></i>
                                <i className="bi bi-google-play"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;