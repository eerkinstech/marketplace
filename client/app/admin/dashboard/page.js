"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";
import { toast } from "react-hot-toast";

export default function AdminDashboardPage() {
  const { token, error: authError } = useAccessToken(
    "Login with an admin account to access this dashboard."
  );
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
      if (!token) return;
      try {
        setLoading(true);
        const response = await marketplaceApi.getAdminDashboard(token);
        const data = response.data;
        
        setStats({
          totalUsers: data.users || 0,
          totalProducts: data.totalProducts || 0,
          totalOrders: data.orders || 0,
          totalRevenue: data.revenue || 0
        });

        if (data.recentOrders) {
          setRecentOrders(data.recentOrders.slice(0, 5));
        }
      } catch (err) {
        toast.error(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [token]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-slate-600">Welcome to your marketplace admin control center</p>
      </div>

      {authError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-800">
          {authError}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Users Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Total Users</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalUsers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <i className="fas fa-users text-blue-600"></i>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <Link href="/admin/customers" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View all customers →
            </Link>
          </div>
        </div>

        {/* Products Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Total Products</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalProducts}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <i className="fas fa-box text-green-600"></i>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <Link href="/admin/products" className="text-green-600 hover:text-green-700 text-sm font-medium">
              Manage products →
            </Link>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Total Orders</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalOrders}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <i className="fas fa-clipboard-list text-orange-600"></i>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <Link href="/admin/orders" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
              View orders →
            </Link>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">${stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <i className="fas fa-chart-line text-purple-600"></i>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <Link href="/admin/analytics" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
              View analytics →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link
            href="/admin/products"
            className="flex flex-col items-center gap-3 p-6 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group"
          >
            <div className="p-3 bg-blue-200 rounded-lg group-hover:bg-blue-300 transition-colors">
              <i className="fas fa-boxes text-blue-600 text-lg"></i>
            </div>
            <span className="text-center text-sm font-medium text-slate-900">All Products</span>
          </Link>

          <Link
            href="/admin/products/new"
            className="flex flex-col items-center gap-3 p-6 rounded-xl bg-green-50 hover:bg-green-100 transition-colors group"
          >
            <div className="p-3 bg-green-200 rounded-lg group-hover:bg-green-300 transition-colors">
              <i className="fas fa-plus text-green-600 text-lg"></i>
            </div>
            <span className="text-center text-sm font-medium text-slate-900">Add Product</span>
          </Link>

          <Link
            href="/admin/categories"
            className="flex flex-col items-center gap-3 p-6 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors group"
          >
            <div className="p-3 bg-orange-200 rounded-lg group-hover:bg-orange-300 transition-colors">
              <i className="fas fa-tags text-orange-600 text-lg"></i>
            </div>
            <span className="text-center text-sm font-medium text-slate-900">Categories</span>
          </Link>

          <Link
            href="/admin/orders"
            className="flex flex-col items-center gap-3 p-6 rounded-xl bg-red-50 hover:bg-red-100 transition-colors group"
          >
            <div className="p-3 bg-red-200 rounded-lg group-hover:bg-red-300 transition-colors">
              <i className="fas fa-shopping-cart text-red-600 text-lg"></i>
            </div>
            <span className="text-center text-sm font-medium text-slate-900">Orders</span>
          </Link>

          <Link
            href="/admin/inventory"
            className="flex flex-col items-center gap-3 p-6 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors group"
          >
            <div className="p-3 bg-purple-200 rounded-lg group-hover:bg-purple-300 transition-colors">
              <i className="fas fa-warehouse text-purple-600 text-lg"></i>
            </div>
            <span className="text-center text-sm font-medium text-slate-900">Inventory</span>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Order ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Items</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Total</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <Link href={`/admin/orders/${order._id}`} className="text-blue-600 hover:text-blue-700 font-medium">
                        {order._id.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{order.customerName || "Guest"}</td>
                    <td className="py-3 px-4 text-slate-700">{order.items?.length || 0}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">${order.total?.toFixed(2) || "0.00"}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Database</h3>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              <span className="text-sm text-green-600 font-medium">Online</span>
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-2">All systems operational</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">API</h3>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              <span className="text-sm text-green-600 font-medium">Online</span>
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-2">Response time: &lt;100ms</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Admin Coverage</h3>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              <span className="text-sm text-green-600 font-medium">Global</span>
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-2">All features available</p>
        </div>
      </div>
    </div>
  );
}
