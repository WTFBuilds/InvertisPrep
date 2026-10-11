import Razorpay from 'razorpay';

let instance = null;

// Razorpay credentials come from env (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).
// Created lazily so the server still boots (and every non-payment route keeps
// working) when the keys are not set — only checkout endpoints will 503.
export const getRazorpay = () => {
  if (!instance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      const err = new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
      err.statusCode = 503;
      throw err;
    }
    instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return instance;
};

export default getRazorpay;
