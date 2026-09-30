// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";


// ─── Layouts ─────────────────────────────────────────────────────
import AdminLayout from "../components/admin/layouts/AdminLayout";
import FrontLayout from "../layouts/FrontLayout";

// ─── Admin Pages ─────────────────────────────────────────────────
import AdminLogin from "../pages/admin/Login";
import Dashboard from "../pages/admin/Dashboard";

import Orders from "../pages/admin/orders/Orders";
import OrderView from "../pages/admin/orders/OrderView";

import Products from "../pages/admin/products/Products";
import ProductCreate from "../pages/admin/products/ProductCreate";
import ProductEdit from "../pages/admin/products/ProductEdit";

import ProductCategories from "../pages/admin/product_categories/ProductCategories";
import ProductCategoryCreate from "../pages/admin/product_categories/ProductCategoryCreate";
import ProductCategoryEdit from "../pages/admin/product_categories/ProductCategoryEdit";
import ProductCategoryView from "../pages/admin/product_categories/ProductCategoryView";

import Features from "../pages/admin/features/Features";
import FeatureAssign from "../pages/admin/features/FeatureAssign";

import Invoices from "../pages/admin/invoices/Invoices";
import InvoiceView from "../pages/admin/invoices/InvoiceView";

import Menus from "../pages/admin/menus/Menus";
import MenuForm from "../pages/admin/menus/MenuForm";

import Blog from "../pages/admin/blog/Blog";
import BlogForm from "../pages/admin/blog/BlogForm";
import BlogEdit from "../pages/admin/blog/BlogEdit";

import Faqs from "../pages/admin/faqs/Faqs";
import FaqCreate from "../pages/admin/faqs/FaqCreate";
import FaqEdit from "../pages/admin/faqs/FaqEdit";

import Messages from "../pages/admin/messages/Messages";
import MessageView from "../pages/admin/messages/MessageView";

import Settings from "../pages/admin/settings/Settings";
import SettingsPreferences from "../pages/admin/settings/SettingsPreferences";

import Profile from "../pages/admin/profile/Profile";

import HomeBanner from "../pages/admin/home_banner/HomeBanner";

import Clients from "../pages/admin/clients/Clients";
import ClientCreate from "../pages/admin/clients/ClientCreate";
import ClientEdit from "../pages/admin/clients/ClientEdit";
import ClientView from "../pages/admin/clients/ClientView";

// ─── Frontend (customer) Pages ───────────────────────────────────
import CustomerLogin from "../pages/auth/Login";
import CustomerRegister from "../pages/auth/Register";

// Frontend pages that exist today:
import Home from "../pages/front/Home";
import CategoryOverview from "../pages/front/category/CategoryOverview";
import ProductDetail from "../pages/front/product/ProductDetail";
import Cart from "../pages/front/cart/Cart";
import Checkout from "../pages/front/checkout/Checkout";
import Success from "../pages/front/checkout/Success";
import Wishlist from "../pages/front/wishlist/Wishlist";
import BlogList from "../pages/front/blog/BlogList";
import BlogDetail from "../pages/front/blog/BlogDetail";
import Faq from "../pages/front/faq/Faq";
import Contact from "../pages/front/contact/Contact";
import Search from "../pages/front/search/Search";

// Pages not built yet — leave commented until you create the files:
import MyOrders from "../pages/front/orders/MyOrders";
import OrderDetail from "../pages/front/orders/OrderDetail";
import MyProfile from "../pages/front/profile/MyProfile";
import ProfileEdit from "../pages/front/profile/ProfileEdit";



const ProtectedRoute = ({ children }) => {
    const { user, loading, isAdmin } = useAuth();

    if (loading) {
        return (
            <div
                className="d-flex justify-content-center align-items-center"
                style={{ minHeight: '100vh' }}
            >
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!user || !isAdmin) {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
};

/* ------------------------------------------------------------------ */
/*  AppRoutes                                                          */
/* ------------------------------------------------------------------ */
const AppRoutes = () => {
    return (
        <Routes>
            {/* ============================================================ */}
            {/*  FRONTEND (customer) — Header + Footer via FrontLayout        */}
            {/* ============================================================ */}
            <Route element={<FrontLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/category/:slug1?/:slug2?" element={<CategoryOverview />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/search" element={<Search />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/checkout/success" element={<Success />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/blog" element={<BlogList />} />
                <Route path="/blog/:id" element={<BlogDetail />} />
                <Route path="/faq" element={<Faq />} />
                <Route path="/contact" element={<Contact />} />

                {/* Uncomment when the files are created: */}
                <Route path="/orders" element={<MyOrders />} />
<Route path="/orders/view/:id" element={<OrderDetail />} />
<Route path="/profile" element={<MyProfile />} />
<Route path="/profile/edit" element={<ProfileEdit />} />
            </Route>

            {/* ============================================================ */}
            {/*  PUBLIC — Customer Auth (no header/footer)                    */}
            {/* ============================================================ */}
            <Route path="/auth/login" element={<CustomerLogin />} />
            <Route path="/auth/register" element={<CustomerRegister />} />

            {/* ============================================================ */}
            {/*  PUBLIC — Admin login                                         */}
            {/* ============================================================ */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* ============================================================ */}
            {/*  PROTECTED ADMIN                                              */}
            {/* ============================================================ */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute>
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />

                <Route path="home-banner" element={<HomeBanner />} />

                {/* Clients */}
                <Route path="clients" element={<Clients />} />
                <Route path="clients/create" element={<ClientCreate />} />
                <Route path="clients/edit/:id" element={<ClientEdit />} />
                <Route path="clients/view/:id" element={<ClientView />} />

                {/* Orders */}
                <Route path="orders" element={<Orders />} />
                <Route path="orders/view/:id" element={<OrderView />} />

                {/* Features */}
                <Route path="features" element={<Features />} />
                <Route path="features/assign/:featureId" element={<FeatureAssign />} />

                {/* Product Categories */}
                <Route path="product-categories" element={<ProductCategories />} />
                <Route path="product-categories/create" element={<ProductCategoryCreate />} />
                <Route path="product-categories/edit/:id" element={<ProductCategoryEdit />} />
                <Route path="product-categories/view/:id" element={<ProductCategoryView />} />

                {/* Products */}
                <Route path="products" element={<Products />} />
                <Route path="products/create" element={<ProductCreate />} />
                <Route path="products/edit/:id" element={<ProductEdit />} />

                {/* Invoices */}
                <Route path="invoices" element={<Invoices />} />
                <Route path="invoices/view/:id" element={<InvoiceView />} />

                {/* Menus */}
                <Route path="menus" element={<Menus />} />
                <Route path="menus/create" element={<MenuForm />} />
                <Route path="menus/edit/:id" element={<MenuForm />} />

                {/* Blog */}
                <Route path="blog" element={<Blog />} />
                <Route path="blog/create" element={<BlogForm />} />
                <Route path="blog/edit/:id" element={<BlogEdit />} />

                {/* FAQs */}
                <Route path="faqs" element={<Faqs />} />
                <Route path="faqs/create" element={<FaqCreate />} />
                <Route path="faqs/edit/:id" element={<FaqEdit />} />

                {/* Messages */}
                <Route path="messages" element={<Messages />} />
                <Route path="messages/view/:id" element={<MessageView />} />

                {/* Settings */}
                <Route path="settings" element={<Settings />} />
                <Route path="settings/preferences" element={<SettingsPreferences />} />

                {/* Profile */}
                <Route path="profile" element={<Profile />} />
            </Route>

            {/* ============================================================ */}
            {/*  FALLBACK — single catch-all, points to home                  */}
            {/* ============================================================ */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;
