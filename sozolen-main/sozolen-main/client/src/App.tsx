import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductsByCategory from "@/pages/ProductsByCategory";
import ProductDetail from "@/pages/ProductDetail";
import CustomRequest from "@/pages/CustomRequest";
import Track from "@/pages/Track";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import ThankYou from "@/pages/ThankYou";
import OrderDetail from "@/pages/OrderDetail";
import CustomerLogin from "@/pages/CustomerLogin";
import CustomerRegister from "@/pages/CustomerRegister";
import Profile from "@/pages/Profile";
import ForgotPassword from "@/pages/ForgotPassword";

import AdminLogin from "@/pages/admin/AdminLogin";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminRequests from "@/pages/admin/AdminRequests";
import AdminAdmins from "@/pages/admin/AdminAdmins";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminInvoiceTemplate from "@/pages/admin/AdminInvoiceTemplate";
import AdminReports from "@/pages/admin/AdminReports";
import AdminColors from "@/pages/admin/AdminColors";
import AdminSizes from "@/pages/admin/AdminSizes";
import AdminOthers from "@/pages/admin/AdminOthers";
import AdminShippingPricing from "@/pages/admin/AdminShippingPricing";
import AdminProductAttributes from "@/pages/admin/AdminProductAttributes";
import AdminThemeConfig from "@/pages/admin/AdminThemeConfig";
import AdminProductDetails from "@/pages/admin/AdminProductDetails";
import { useThemeSync } from "@/hooks/use-theme-sync";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function Router() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <>
        <ScrollToTop />
        <Switch>
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/categories">
          <AdminLayout>
            <AdminCategories />
          </AdminLayout>
        </Route>
        <Route path="/admin/products">
          <AdminLayout>
            <AdminProducts />
          </AdminLayout>
        </Route>
        <Route path="/admin/products/new">
          <AdminLayout>
            <AdminProductDetails />
          </AdminLayout>
        </Route>
        <Route path="/admin/products/:id">
          <AdminLayout>
            <AdminProductDetails />
          </AdminLayout>
        </Route>
        <Route path="/admin/attributes">
          <AdminLayout>
            <AdminProductAttributes />
          </AdminLayout>
        </Route>
        <Route path="/admin/attributes/colors">
          <AdminLayout>
            <AdminColors />
          </AdminLayout>
        </Route>
        <Route path="/admin/attributes/size">
          <AdminLayout>
            <AdminSizes />
          </AdminLayout>
        </Route>
        <Route path="/admin/attributes/decoration">
          <AdminLayout>
            <AdminOthers />
          </AdminLayout>
        </Route>
        <Route path="/admin/attributes/shipping-charge">
          <AdminLayout>
            <AdminShippingPricing />
          </AdminLayout>
        </Route>
        <Route path="/admin/colors">
          <AdminLayout>
            <AdminColors />
          </AdminLayout>
        </Route>
        <Route path="/admin/sizes">
          <AdminLayout>
            <AdminSizes />
          </AdminLayout>
        </Route>
        <Route path="/admin/others">
          <AdminLayout>
            <AdminOthers />
          </AdminLayout>
        </Route>
        <Route path="/admin/shipping">
          <AdminLayout>
            <AdminShippingPricing />
          </AdminLayout>
        </Route>
        <Route path="/admin/orders">
          <AdminLayout>
            <AdminOrders />
          </AdminLayout>
        </Route>
        <Route path="/admin/requests">
          <AdminLayout>
            <AdminRequests />
          </AdminLayout>
        </Route>
        <Route path="/admin/customers">
          <AdminLayout>
            <AdminCustomers />
          </AdminLayout>
        </Route>
        <Route path="/admin/invoice-template">
          <AdminLayout>
            <AdminInvoiceTemplate />
          </AdminLayout>
        </Route>
        <Route path="/admin/reports">
          <AdminLayout>
            <AdminReports />
          </AdminLayout>
        </Route>
        <Route path="/admin/theme-config">
          <AdminLayout>
            <AdminThemeConfig />
          </AdminLayout>
        </Route>
        <Route path="/admin/admins">
          <AdminLayout>
            <AdminAdmins />
          </AdminLayout>
        </Route>
        <Route path="/admin">
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        </Route>
        <Route path="/admin/:splat" component={NotFound} />
      </Switch>
      </>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/category" component={Products} />
          <Route path="/products" component={Products} />
          <Route path="/products/category/:id" component={ProductsByCategory} />
          <Route path="/products/:id" component={ProductDetail} />
          <Route path="/custom" component={CustomRequest} />
          <Route path="/track" component={Track} />
          <Route path="/cart" component={Cart} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/checkout/thank-you" component={ThankYou} />
          <Route path="/:categoryName/:productName" component={ProductDetail} />
          <Route path="/login" component={CustomerLogin} />
          <Route path="/register" component={CustomerRegister} />
          <Route path="/profile/orders/:id" component={OrderDetail} />
          <Route path="/profile" component={Profile} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/:categoryName" component={ProductsByCategory} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  useThemeSync();
  return <Router />;
}

export default App;
