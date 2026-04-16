"use client";

import { useEffect, useState } from "react";
import { useAccessToken } from "@/lib/auth/use-access-token";
import toast from "react-hot-toast";

// Mock data for vendor payments
const mockPaymentHistory = [
    {
        id: "pmt-001",
        date: new Date(Date.now() - 30 * 24 * 60 * 60000), // 30 days ago
        amount: 5000,
        status: "completed",
        method: "Bank Transfer",
        ordersCount: 125,
        commissionRate: 15,
        description: "Monthly payout for March orders"
    },
    {
        id: "pmt-002",
        date: new Date(Date.now() - 60 * 24 * 60 * 60000), // 60 days ago
        amount: 4200,
        status: "completed",
        method: "Bank Transfer",
        ordersCount: 105,
        commissionRate: 15,
        description: "Monthly payout for February orders"
    },
    {
        id: "pmt-003",
        date: new Date(Date.now() - 90 * 24 * 60 * 60000), // 90 days ago
        amount: 3800,
        status: "completed",
        method: "Bank Transfer",
        ordersCount: 95,
        commissionRate: 15,
        description: "Monthly payout for January orders"
    },
    {
        id: "pmt-004",
        date: new Date(Date.now() - 5 * 24 * 60 * 60000), // 5 days ago
        amount: 2500,
        status: "pending",
        method: "Bank Transfer",
        ordersCount: 62,
        commissionRate: 15,
        description: "Payment request submitted for approval"
    }
];

export default function VendorPaymentsPage() {
    const { token } = useAccessToken("Login with a vendor account to manage payments.");
    const [payments, setPayments] = useState(mockPaymentHistory);
    const [showPaymentRequest, setShowPaymentRequest] = useState(false);
    const [requestAmount, setRequestAmount] = useState("");
    const [requestDescription, setRequestDescription] = useState("");
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("bank");
    const [bankDetails, setBankDetails] = useState({
        accountName: "Electronics Plus",
        accountNumber: "1234567890",
        bankName: "Global Bank",
        swiftCode: "GBKUUS33",
        routingNumber: "123456789"
    });
    const [editingBank, setEditingBank] = useState(false);

    // Calculate statistics
    const totalEarnings = payments
        .filter(p => p.status === "completed")
        .reduce((sum, p) => sum + p.amount, 0);

    const pendingPayments = payments
        .filter(p => p.status === "pending")
        .reduce((sum, p) => sum + p.amount, 0);

    const completedCount = payments.filter(p => p.status === "completed").length;

    const handleRequestPayment = (e) => {
        e.preventDefault();
        if (!requestAmount || !requestDescription) {
            toast.error("Please fill all fields");
            return;
        }

        const newPayment = {
            id: `pmt-${Date.now()}`,
            date: new Date(),
            amount: parseFloat(requestAmount),
            status: "pending",
            method: selectedPaymentMethod === "bank" ? "Bank Transfer" : "E-Wallet",
            ordersCount: Math.floor(Math.random() * 100) + 50,
            commissionRate: 15,
            description: requestDescription
        };

        setPayments([newPayment, ...payments]);
        setRequestAmount("");
        setRequestDescription("");
        setShowPaymentRequest(false);
        toast.success("Payment request submitted successfully!");
    };

    const handleUpdateBankDetails = () => {
        setEditingBank(false);
        toast.success("Bank details updated successfully!");
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
            case "completed":
                return "bg-green-100 text-green-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "failed":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Vendor Payments</h1>
                    <p className="text-gray-600">Manage your earnings and payment requests</p>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md border-l-4 border-green-500 p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Total Earned</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(totalEarnings)}</p>
                            </div>
                            <i className="fas fa-money-bill-wave text-3xl text-green-500 opacity-20"></i>
                        </div>
                        <p className="text-xs text-gray-500 mt-4">{completedCount} completed payments</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md border-l-4 border-yellow-500 p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Pending Amount</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(pendingPayments)}</p>
                            </div>
                            <i className="fas fa-hourglass-end text-3xl text-yellow-500 opacity-20"></i>
                        </div>
                        <p className="text-xs text-gray-500 mt-4">{payments.filter(p => p.status === "pending").length} pending requests</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md border-l-4 border-blue-500 p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Last Payment</p>
                                <p className="text-2xl font-bold text-gray-900 mt-2">
                                    {payments[0]?.status === "completed" ? formatCurrency(payments[0]?.amount) : "-"}
                                </p>
                            </div>
                            <i className="fas fa-calendar-check text-3xl text-blue-500 opacity-20"></i>
                        </div>
                        <p className="text-xs text-gray-500 mt-4">
                            {payments[0]?.status === "completed" ? formatDate(payments[0]?.date) : "No completed payment"}
                        </p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Payment Request Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Request Payment</h2>

                            {!showPaymentRequest ? (
                                <button
                                    onClick={() => setShowPaymentRequest(true)}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition flex items-center justify-center gap-2"
                                >
                                    <i className="fas fa-plus"></i>
                                    New Payment Request
                                </button>
                            ) : (
                                <form onSubmit={handleRequestPayment} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount (USD)</label>
                                        <input
                                            type="number"
                                            value={requestAmount}
                                            onChange={(e) => setRequestAmount(e.target.value)}
                                            placeholder="Enter amount"
                                            min="0"
                                            step="0.01"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                                        <select
                                            value={selectedPaymentMethod}
                                            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value="bank">Bank Transfer</option>
                                            <option value="wallet">E-Wallet</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                        <textarea
                                            value={requestDescription}
                                            onChange={(e) => setRequestDescription(e.target.value)}
                                            placeholder="Enter payment description"
                                            rows="3"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
                                        >
                                            Submit Request
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowPaymentRequest(false)}
                                            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Bank Details */}
                        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Bank Details</h3>
                                <button
                                    onClick={() => setEditingBank(!editingBank)}
                                    className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                                >
                                    {editingBank ? "Cancel" : "Edit"}
                                </button>
                            </div>

                            {!editingBank ? (
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <p className="text-gray-600">Account Name</p>
                                        <p className="font-medium text-gray-900">{bankDetails.accountName}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Account Number</p>
                                        <p className="font-medium text-gray-900">{bankDetails.accountNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Bank Name</p>
                                        <p className="font-medium text-gray-900">{bankDetails.bankName}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">SWIFT Code</p>
                                        <p className="font-medium text-gray-900">{bankDetails.swiftCode}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Routing Number</p>
                                        <p className="font-medium text-gray-900">{bankDetails.routingNumber}</p>
                                    </div>
                                </div>
                            ) : (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleUpdateBankDetails();
                                    }}
                                    className="space-y-3"
                                >
                                    <input
                                        type="text"
                                        value={bankDetails.accountName}
                                        onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                                        placeholder="Account Name"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <input
                                        type="text"
                                        value={bankDetails.accountNumber}
                                        onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                                        placeholder="Account Number"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <input
                                        type="text"
                                        value={bankDetails.bankName}
                                        onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                                        placeholder="Bank Name"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <input
                                        type="text"
                                        value={bankDetails.swiftCode}
                                        onChange={(e) => setBankDetails({ ...bankDetails, swiftCode: e.target.value })}
                                        placeholder="SWIFT Code"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <input
                                        type="text"
                                        value={bankDetails.routingNumber}
                                        onChange={(e) => setBankDetails({ ...bankDetails, routingNumber: e.target.value })}
                                        placeholder="Routing Number"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <button
                                        type="submit"
                                        className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition text-sm"
                                    >
                                        Save Details
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Payment History */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-700">Date</th>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-700">Amount</th>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-700">Method</th>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-700">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {payments.map((payment) => (
                                            <tr key={payment.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {formatDate(payment.date)}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-gray-900">
                                                    {formatCurrency(payment.amount)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-700">{payment.method}</td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs text-gray-600">
                                                        <p>{payment.description}</p>
                                                        <p className="mt-1 text-gray-500">
                                                            {payment.ordersCount} orders • {payment.commissionRate}% commission
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
