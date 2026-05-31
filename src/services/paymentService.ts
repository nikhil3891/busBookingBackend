import Payment from '../models/paymentModel';
import Booking from '../models/bookingModel';
import Bus from '../models/busModel';

// simulate UPI payment call (in production use PSP SDK)
export async function processUpiPayment(userId: any, bookingId: string, upiId: string) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error('Booking not found');

  const payment = await Payment.findById(booking.paymentId);
  if (!payment) throw new Error('Payment record not found');

  // Simulate success
  payment.method = 'upi';
  payment.providerReference = `UPI-${Date.now()}`;
  payment.status = 'success';
  payment.metadata = { upiId };
  await payment.save();

  // mark booking as confirmed
  booking.status = 'confirmed';
  await booking.save();

  // update bus seat statuses already marked as booked during allocation
  return { success: true, payment, booking };
}
