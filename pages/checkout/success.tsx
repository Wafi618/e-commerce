import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { CheckCircle, ShoppingBag, Receipt } from 'lucide-react';

export default function CheckoutSuccess() {
  const router = useRouter();
  const { session_id, payment_id, trx_id } = router.query;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session_id || payment_id) {
      setTimeout(() => {
        setLoading(false);
      }, 1500);
    }
  }, [session_id, payment_id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing your payment...</h2>
          <p className="text-gray-600">Please wait while we confirm your order</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 animate-bounce">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
            <p className="text-pink-100">Your order has been confirmed</p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium mb-1">✓ Payment completed successfully</p>
              <p className="text-green-700 text-sm">Thank you for shopping with us!</p>
            </div>

            {/* Transaction Details */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Transaction ID</span>
                <span className="text-gray-900 font-mono text-sm">
                  {trx_id || session_id || 'Processing...'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Payment Method</span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-pink-600 rounded flex items-center justify-center text-white text-xs font-bold">
                    bK
                  </div>
                  <span className="text-gray-900 font-semibold">bKash</span>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <Receipt className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-900 font-medium mb-1">
                    Order confirmation sent
                  </p>
                  <p className="text-sm text-blue-700">
                    A confirmation email with your order details will be sent to you shortly.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link 
                href="/"
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3.5 rounded-xl hover:from-pink-700 hover:to-purple-700 font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <ShoppingBag className="w-5 h-5" />
                Continue Shopping
              </Link>
              
              <Link
                href="/"
                className="flex items-center justify-center gap-2 w-full border-2 border-gray-300 text-gray-700 py-3.5 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-semibold transition-all"
              >
                <Receipt className="w-5 h-5" />
                View Order Details
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Help Text */}
        <p className="text-center text-gray-600 text-sm mt-6">
          Need help? <a href="/support" className="text-pink-600 hover:text-pink-700 font-semibold underline">Contact Support</a>
        </p>
      </div>
    </div>
  );
}
