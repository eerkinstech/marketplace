"use client";

import { useEffect, useState } from "react";
import { useAccessToken } from "@/lib/auth/use-access-token";
import toast from "react-hot-toast";

// Mock data for vendor payment requests
const mockVendorPayments = [
    {
        id: "vpmt-001",
        vendorId: "vendor-001",
        vendorName: "Electronics Plus",
        vendorEmail: "contact@electronicsplus.com",
        vendorImage: "https://via.placeholder.com/40",
        requestAmount: 2500,
        status: "pending",
        submittedDate: new Date(Date.now() - 5 * 24 * 60 * 60000),
        lastReminderDate: null,
        description: "Payment request for March 2026 sales",
        bankDetails: {
            accountName: "Electronics Plus",
            bankName: "Global Bank",
            accountNumber: "****7890"
        },
        ordersCount: 62,
        totalSales: 16667,
        commissionRate: 15
    },
    {
        id: "vpmt-002",
        vendorId: "vendor-002",
        vendorName: "Fashion World",
        vendorEmail: "support@fashionworld.com",
        vendorImage: "https://via.placeholder.com/40",
        requestAmount: 1800,
        status: "pending",
        submittedDate: new Date(Date.now() - 2 * 24 * 60 * 60000),
        lastReminderDate: null,
        description: "Withdrawal request for March 2026",
        bankDetails: {
            accountName: "Fashion World Inc",
            bankName: "First Bank",
            accountNumber: "****5432"
        },
        ordersCount: 45,
        totalSales: 12000,
        commissionRate: 15
    },
    {
        id: "vpmt-003",
        vendorId: "vendor-003",
        vendorName: "Home Decor Elite",
        vendorEmail: "team@homedecor.com",
        vendorImage: "https://via.placeholder.com/40",
        requestAmount: 3200,
        status: "pending",
        submittedDate: new Date(Date.now() - 10 * 24 * 60 * 60000),
        lastReminderDate: new Date(Date.now() - 3 * 24 * 60 * 60000),
        description: "Monthly payout request",
        bankDetails: {
            accountName: "Home Decor Elite Ltd",
            bankName: "Global Bank",
            accountNumber: "****8765"
        },
        ordersCount: 78,
        totalSales: 21333,
        commissionRate: 15
    },
    {
        id: "vpmt-004",
        vendorId: "vendor-001",
        vendorName: "Electronics Plus",
        vendorEmail: "contact@electronicsplus.com",
        vendorImage: "https://via.placeholder.com/40",
        requestAmount: 5000,
        status: "approved",
        submittedDate: new Date(Date.now() - 30 * 24 * 60 * 60000),
        lastReminderDate: null,
        approvedDate: new Date(Date.now() - 15 * 24 * 60 * 60000),
        description: "Monthly payout for February 2026",
        bankDetails: {
            accountName: "Electronics Plus",
            bankName: "Global Bank",
            accountNumber: "****7890"
        },
        ordersCount: 125,
        totalSales: 33333,
        commissionRate: 15,
        approvedBy: "Admin"
    },
    {
        id: "vpmt-005",
        vendorId: "vendor-002",
        vendorName: "Fashion World",
        vendorEmail: "support@fashionworld.com",
        vendorImage: "https://via.placeholder.com/40",
        requestAmount: 4200,
        status: "completed",
        submittedDate: new Date(Date.now() - 60 * 24 * 60 * 60000),
        approvedDate: new Date(Date.now() - 55 * 24 * 60 * 60000),
        completedDate: new Date(Date.now() - 45 * 24 * 60 * 60000),
        description: "Monthly payout for January 2026",
        bankDetails: {
            accountName: "Fashion World Inc",
            bankName: "First Bank",
            accountNumber: "****5432"
        },
        ordersCount: 105,
        totalSales: 28000,
        commissionRate: 15
    }
];

export default function AdminPaymentsPage() {
    const { token } = useAccessToken("Login with an admin account to manage vendor payments.");
    const [payments, setPayments] = useState(mockVendorPayments);
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [reminderMessage, setReminderMessage] = useState("");

    const filteredPayments = filterStatus === "all"
        ? payments
        : payments.filter(p => p.status === filterStatus);

    // Calculate statistics
    const stats = {
        pending: payments.filter(p => p.status === "pending").length,
        pendingAmount: payments.filter(p => p.status === "pending").reduce((sum, p) => sum + p.requestAmount, 0),
        approved: payments.filter(p => p.status === "approved").length,
        approvedAmount: payments.filter(p => p.status === "approved").reduce((sum, p) => sum + p.requestAmount, 0),
        completed: payments.filter(p => p.status === "completed").length,
        completedAmount: payments.filter(p => p.status === "completed").reduce((sum, p) => sum + p.requestAmount, 0),
    };

    const handleApprovePayment = () => {
        if (!selectedPayment) return;

        setPayments(payments.map(p =>
            p.id === selectedPayment.id
                ? { ...p, status: "approved", approvedDate: new Date(), approvedBy: "Admin" }
                : p
        ));

        setSelectedPayment(null);
        setShowApprovalModal(false);
        toast.success(`Payment of $${selectedPayment.requestAmount} approved for ${selectedPayment.vendorName}`);
    };

    const handleRejectPayment = () => {
        if (!selectedPayment) return;

        setPayments(payments.filter(p => p.id !== selectedPayment.id));

        setSelectedPayment(null);
        setShowApprovalModal(false);
        toast.success(`Payment request rejected and notification sent to ${selectedPayment.vendorName}`);
    };

    const handleSendReminder = () => {
        if (!selectedPayment || !reminderMessage.trim()) {
            toast.error("Please enter a message");
            return;
        }

        setPayments(payments.map(p =>
            p.id === selectedPayment.id
                ? { ...p, lastReminderDate: new Date() }
                : p
        ));

        setReminderMessage("");
        setShowReminderModal(false);
        setSelectedPayment(null);
        toast.success(`Reminder sent to ${selectedPayment.vendorName}`);
    };

    const handleMarkAsCompleted = () => {
        if (!selectedPayment) return;

        setPayments(payments.map(p =>
            p.id === selectedPayment.id
                ? { ...p, status: "completed", completedDate: new Date() }
                : p
        ));

        setSelectedPayment(null);
        setShowApprovalModal(false);
        toast.success(`Payment marked as completed for ${selectedPayment.vendorName}`);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD"
        }).format(value);
    };

    const formatDate = (date) => {
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "approved":
                return "bg-blue-100 text-blue-800";
            case "completed":
                return "bg-green-100 text-green-800";
            case "rejected":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getDaysWaiting = (date) => {
        const days = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
        return days;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Vendor Payment Management</h1>
                    <p className="text-gray-600">Review, approve, and manage vendor payment requests</p>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md border-l-4 border-yellow-500 p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Pending Requests</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pending}</p>
                                <p className="text-lg font-semibold text-yellow-600 mt-1">{formatCurrency(stats.pendingAmount)}</p>
                            </div>
                            <i className="fas fa-hourglass-end text-3xl text-yellow-500 opacity-20"></i>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md border-l-4 border-blue-500 p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Approved</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.approved}</p>
                                <p className="text-lg font-semibold text-blue-600 mt-1">{formatCurrency(stats.approvedAmount)}</p>
                            </div>
                            <i className="fas fa-check-circle text-3xl text-blue-500 opacity-20"></i>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md border-l-4 border-green-500 p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Completed</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completed}</p>
                                <p className="text-lg font-semibold text-green-600 mt-1">{formatCurrency(stats.completedAmount)}</p>
                            </div>
                            <i className="fas fa-money-bill-check text-3xl text-green-500 opacity-20"></i>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="flex gap-2 flex-wrap">
                        {[
                            { value: "all", label: "All Payments", count: filteredPayments.length },
                            { value: "pending", label: "Pending", count: stats.pending },
                            { value: "approved", label: "Approved", count: stats.approved },
                            { value: "completed", label: "Completed", count: stats.completed }
                        ].map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => setFilterStatus(tab.value)}
                                className={`px-6 py-2 rounded-lg font-medium transition ${filterStatus === tab.value
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    }`}
                            >
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Payment Requests Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Vendor</th>
                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Amount</th>
                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Status</th>
                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Submitted</th>
                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Days Waiting</th>
                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredPayments.length > 0 ? (
                                    filteredPayments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={payment.vendorImage}
                                                        alt={payment.vendorName}
                                                        className="w-10 h-10 rounded-full"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-gray-900">{payment.vendorName}</p>
                                                        <p className="text-xs text-gray-600">{payment.vendorEmail}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-lg text-gray-900">{formatCurrency(payment.requestAmount)}</p>
                                                <p className="text-xs text-gray-500">
                                                    {payment.ordersCount} orders • {formatCurrency(payment.totalSales)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-700">
                                                {formatDate(payment.submittedDate)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-medium ${getDaysWaiting(payment.submittedDate) > 7 ? "text-red-600" : "text-gray-700"}`}>
                                                    {getDaysWaiting(payment.submittedDate)}d
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPayment(payment);
                                                            setShowApprovalModal(true);
                                                        }}
                                                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                                                        title="View details"
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    {payment.status === "pending" && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedPayment(payment);
                                                                setShowReminderModal(true);
                                                            }}
                                                            className="px-3 py-2 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition"
                                                            title="Send reminder"
                                                        >
                                                            <i className="fas fa-bell"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                            No payment requests found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Approval Modal */}
            {showApprovalModal && selectedPayment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">Payment Details</h3>
                            <button
                                onClick={() => setShowApprovalModal(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="px-6 py-4 space-y-4">
                            {/* Vendor Info */}
                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={selectedPayment.vendorImage}
                                        alt={selectedPayment.vendorName}
                                        className="w-12 h-12 rounded-full"
                                    />
                                    <div>
                                        <p className="font-semibold text-gray-900">{selectedPayment.vendorName}</p>
                                        <p className="text-sm text-gray-600">{selectedPayment.vendorEmail}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Details */}
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Request Amount:</span>
                                    <span className="font-bold text-lg">{formatCurrency(selectedPayment.requestAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Status:</span>
                                    <span className={`font-medium px-2 py-1 rounded ${getStatusColor(selectedPayment.status)}`}>
                                        {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Submitted:</span>
                                    <span>{formatDate(selectedPayment.submittedDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Orders:</span>
                                    <span>{selectedPayment.ordersCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Sales:</span>
                                    <span>{formatCurrency(selectedPayment.totalSales)}</span>
                                </div>
                            </div>

                            {/* Bank Details */}
                            <div className="border-t border-gray-200 pt-4">
                                <p className="font-semibold text-gray-900 mb-3">Bank Details</p>
                                <div className="space-y-2 text-sm bg-gray-50 rounded-lg p-3">
                                    <div>
                                        <p className="text-gray-600">Account Name</p>
                                        <p className="font-medium">{selectedPayment.bankDetails.accountName}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Bank</p>
                                        <p className="font-medium">{selectedPayment.bankDetails.bankName}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Account</p>
                                        <p className="font-medium">{selectedPayment.bankDetails.accountNumber}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="border-t border-gray-200 pt-4">
                                <p className="font-semibold text-gray-900 mb-2">Description</p>
                                <p className="text-gray-700 text-sm">{selectedPayment.description}</p>
                            </div>

                            {/* Actions */}
                            {selectedPayment.status === "pending" && (
                                <div className="border-t border-gray-200 pt-4 space-y-2">
                                    <button
                                        onClick={handleApprovePayment}
                                        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                                    >
                                        <i className="fas fa-check"></i>
                                        Approve Payment
                                    </button>
                                    <button
                                        onClick={handleRejectPayment}
                                        className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition flex items-center justify-center gap-2"
                                    >
                                        <i className="fas fa-times"></i>
                                        Reject Request
                                    </button>
                                </div>
                            )}

                            {selectedPayment.status === "approved" && (
                                <div className="border-t border-gray-200 pt-4">
                                    <button
                                        onClick={handleMarkAsCompleted}
                                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                                    >
                                        <i className="fas fa-check-double"></i>
                                        Mark as Completed
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={() => setShowApprovalModal(false)}
                                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reminder Modal */}
            {showReminderModal && selectedPayment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">Send Reminder</h3>
                            <button
                                onClick={() => setShowReminderModal(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="px-6 py-4 space-y-4">
                            <div>
                                <p className="font-medium text-gray-900 mb-2">{selectedPayment.vendorName}</p>
                                <p className="text-sm text-gray-600">
                                    Amount: <span className="font-semibold">{formatCurrency(selectedPayment.requestAmount)}</span>
                                </p>
                            </div>

                            {selectedPayment.lastReminderDate && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
                                    <p className="font-medium">Last reminder sent: {formatDate(selectedPayment.lastReminderDate)}</p>
                                </div>
                            )}

                            <textarea
                                value={reminderMessage}
                                onChange={(e) => setReminderMessage(e.target.value)}
                                placeholder="Enter reminder message (optional)"
                                rows="4"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />

                            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                                <p className="font-medium mb-1">Reminder email will include:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Payment request details</li>
                                    <li>Bank transfer information</li>
                                    <li>Custom message (if provided)</li>
                                </ul>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleSendReminder}
                                    className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition flex items-center justify-center gap-2"
                                >
                                    <i className="fas fa-paper-plane"></i>
                                    Send Reminder
                                </button>
                                <button
                                    onClick={() => setShowReminderModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
