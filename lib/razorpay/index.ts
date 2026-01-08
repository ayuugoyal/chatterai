// lib/razorpay/index.ts
import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay instance
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * Create a Razorpay subscription
 * @param planId Razorpay plan ID
 * @param customerId Razorpay customer ID
 * @param totalCount Number of billing cycles (0 for infinite)
 * @returns Razorpay subscription object
 */
export async function createRazorpaySubscription(
  planId: string,
  customerId: string,
  totalCount: number = 0
) {
  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_id: customerId,
      total_count: totalCount,
      quantity: 1,
      notify_customer: true,
      notes: {
        created_via: "Chatter AI Platform",
      },
    });

    return { success: true, subscription };
  } catch (error) {
    console.error("Error creating Razorpay subscription:", error);
    return { success: false, error };
  }
}

/**
 * Create a Razorpay customer
 * @param email Customer email
 * @param name Customer name
 * @returns Razorpay customer object
 */
export async function createRazorpayCustomer(email: string, name: string) {
  try {
    const customer = await razorpay.customers.create({
      email,
      name,
      notes: {
        created_via: "Chatter AI Platform",
      },
    });

    return { success: true, customer };
  } catch (error) {
    console.error("Error creating Razorpay customer:", error);
    return { success: false, error };
  }
}

/**
 * Create a Razorpay order for one-time payments
 * @param amount Amount in paise (e.g., 50000 for ₹500)
 * @param currency Currency code (default: INR)
 * @param receipt Receipt ID
 * @returns Razorpay order object
 */
export async function createRazorpayOrder(
  amount: number,
  currency: string = "INR",
  receipt?: string
) {
  try {
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: {
        created_via: "Chatter AI Platform",
      },
    });

    return { success: true, order };
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return { success: false, error };
  }
}

/**
 * Cancel a Razorpay subscription
 * @param subscriptionId Razorpay subscription ID
 * @param cancelAtCycleEnd Whether to cancel at the end of current billing cycle
 * @returns Success status
 */
export async function cancelRazorpaySubscription(
  subscriptionId: string,
  cancelAtCycleEnd: boolean = true
) {
  try {
    const subscription = await razorpay.subscriptions.cancel(subscriptionId, {
      cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0,
    });

    return { success: true, subscription };
  } catch (error) {
    console.error("Error cancelling Razorpay subscription:", error);
    return { success: false, error };
  }
}

/**
 * Verify Razorpay webhook signature
 * @param body Webhook request body (raw string)
 * @param signature Razorpay signature from headers
 * @returns Whether the signature is valid
 */
export function verifyRazorpayWebhook(body: string, signature: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    return expectedSignature === signature;
  } catch (error) {
    console.error("Error verifying Razorpay webhook:", error);
    return false;
  }
}

/**
 * Verify Razorpay payment signature
 * @param orderId Razorpay order ID
 * @param paymentId Razorpay payment ID
 * @param signature Razorpay signature
 * @returns Whether the payment signature is valid
 */
export function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    return expectedSignature === signature;
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    return false;
  }
}

/**
 * Fetch subscription details
 * @param subscriptionId Razorpay subscription ID
 * @returns Subscription details
 */
export async function fetchRazorpaySubscription(subscriptionId: string) {
  try {
    const subscription = await razorpay.subscriptions.fetch(subscriptionId);
    return { success: true, subscription };
  } catch (error) {
    console.error("Error fetching Razorpay subscription:", error);
    return { success: false, error };
  }
}

/**
 * Fetch payment details
 * @param paymentId Razorpay payment ID
 * @returns Payment details
 */
export async function fetchRazorpayPayment(paymentId: string) {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return { success: true, payment };
  } catch (error) {
    console.error("Error fetching Razorpay payment:", error);
    return { success: false, error };
  }
}
