/**
 * MOCK BILLING SERVICE
 * Currently returns Pro status for all users as per latest requirements.
 * Online payment integration (Razorpay) will be implemented later.
 */

export const createCheckoutSession = async (_priceId: string) => {
  // Disabled for now
  console.warn('Checkout is temporarily disabled. All users have Pro access.');
  return { url: '#' };
};

export const getSubscriptionStatus = async () => {
  // Hardcoded Pro status for now
  return {
    plan: 'PRO',
    status: 'active',
    usage: 0,
    limit: 10000,
    tier: 'pro'
  };
};

export const getBillingPortalUrl = async () => {
  return { url: '#' };
};
