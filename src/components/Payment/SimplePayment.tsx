import { useState } from 'react';
import { Loader2, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { redirectToStripeCheckout, verifyPayment } from '../../lib/payment';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SimplePaymentProps {
  amount: number; // Amount in cents
  itemName: string;
  itemDescription?: string;
  onPaymentComplete?: (paymentData: any) => void;
}

export function SimplePayment({
  amount,
  itemName,
  itemDescription,
  onPaymentComplete,
}: SimplePaymentProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentVerified, setPaymentVerified] = useState(false);

  // Check if we're returning from Stripe payment
  const handleCheckPaymentStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get session ID from URL
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');

      if (!sessionId) {
        setError('No payment session found. Please try again.');
        return;
      }

      // Verify payment with backend
      const paymentData = await verifyPayment({ sessionId });

      if (paymentData.verified) {
        setPaymentVerified(true);
        onPaymentComplete?.(paymentData);

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        setError('Please login to make a payment');
        return;
      }

      // Redirect to Stripe checkout
      await redirectToStripeCheckout({
        amount,
        email: user.email || '',
        userId: user.id,
        itemName,
        itemDescription,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to start payment');
      setLoading(false);
    }
  };

  // Check for payment on component mount
  if (typeof window !== 'undefined' && window.location.search.includes('session_id')) {
    const params = new URLSearchParams(window.location.search);
    if (params.get('session_id') && !paymentVerified && !loading) {
      handleCheckPaymentStatus();
    }
  }

  if (paymentVerified) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-900 mb-2">Payment Successful!</h3>
          <p className="text-green-700 mb-4">Your payment has been verified and processed.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{itemName}</h2>
          <p className="text-gray-600 mb-4">{itemDescription}</p>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-semibold">Total Amount:</span>
              <span className="text-3xl font-bold text-blue-600">
                ${(amount / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={loading || !user}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Pay with Stripe
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-500 mt-4">
          Your payment is secure and encrypted with Stripe
        </p>
      </div>
    </div>
  );
}
