// src/services/upi-adapter.ts
// Build provider-specific orders here (Razorpay/Cashfree). This is a stub.

export async function createUpiOrder(amount: number, meta?: any) {
  // contact gateway API, return order / deeplink
  return { orderId: `MOCK_${Date.now()}`, amount, deepLink: 'upi://pay?pa=...' };
}
 

