const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    dailyApplications: 5,
    features: [
      'Search and view jobs',
      'Apply to 5 jobs per day',
      'Basic resume parsing',
      'Job match scoring'
    ]
  },
  basic: {
    name: 'Basic',
    price: 9.99,
    priceId: 'price_basic_monthly', // Replace with actual Stripe price ID
    dailyApplications: 25,
    features: [
      'All Free features',
      'Apply to 25 jobs per day',
      'Advanced resume analysis',
      'Job recommendations',
      'Application tracking',
      'Email notifications'
    ]
  },
  premium: {
    name: 'Premium',
    price: 19.99,
    priceId: 'price_premium_monthly', // Replace with actual Stripe price ID
    dailyApplications: 100,
    features: [
      'All Basic features',
      'Apply to 100 jobs per day',
      'Priority job scraping',
      'Custom resume suggestions',
      'Interview preparation tips',
      'Premium support',
      'Advanced analytics',
      'Export application data'
    ]
  }
};

// Get available subscription plans
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    plans: SUBSCRIPTION_PLANS
  });
});

// Get current user's subscription
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('subscription');
    
    const currentPlan = SUBSCRIPTION_PLANS[user.subscription.plan] || SUBSCRIPTION_PLANS.free;
    
    res.json({
      success: true,
      subscription: {
        ...user.subscription.toObject(),
        planDetails: currentPlan
      }
    });
  } catch (error) {
    console.error('Subscription fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription'
    });
  }
});

// Create Stripe checkout session
router.post('/create-checkout-session', authenticateToken, [
  body('planType').isIn(['basic', 'premium']).withMessage('Invalid plan type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { planType } = req.body;
    const plan = SUBSCRIPTION_PLANS[planType];
    
    if (!plan || !plan.priceId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }

    const user = await User.findById(req.user._id);
    
    // Create or retrieve Stripe customer
    let customerId = user.subscription.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString()
        }
      });
      customerId = customer.id;
      
      // Update user with customer ID
      user.subscription.stripeCustomerId = customerId;
      await user.save();
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: plan.priceId,
          quantity: 1
        }
      ],
      success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/subscription/cancel`,
      metadata: {
        userId: user._id.toString(),
        planType
      }
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Checkout session creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating checkout session'
    });
  }
});

// Handle successful payment
router.post('/success', authenticateToken, [
  body('sessionId').notEmpty().withMessage('Session ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { sessionId } = req.body;
    
    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    const user = await User.findById(req.user._id);
    const planType = session.metadata.planType;
    
    // Update user subscription
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription
    
    user.subscription = {
      plan: planType,
      status: 'active',
      startDate: now,
      endDate: endDate,
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription
    };

    await user.save();

    res.json({
      success: true,
      message: 'Subscription activated successfully',
      subscription: user.subscription
    });
  } catch (error) {
    console.error('Payment success handling error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment success'
    });
  }
});

// Cancel subscription
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.subscription.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription to cancel'
      });
    }

    // Cancel subscription in Stripe
    await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    // Update user subscription status
    user.subscription.status = 'cancelled';
    await user.save();

    res.json({
      success: true,
      message: 'Subscription cancelled successfully. You can continue using premium features until the end of your billing period.'
    });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription'
    });
  }
});

// Reactivate subscription
router.post('/reactivate', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.subscription.stripeSubscriptionId || user.subscription.status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'No cancelled subscription to reactivate'
      });
    }

    // Reactivate subscription in Stripe
    await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
      cancel_at_period_end: false
    });

    // Update user subscription status
    user.subscription.status = 'active';
    await user.save();

    res.json({
      success: true,
      message: 'Subscription reactivated successfully',
      subscription: user.subscription
    });
  } catch (error) {
    console.error('Subscription reactivation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reactivating subscription'
    });
  }
});

// Get subscription usage
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's application count
    const todayEntry = user.applicationStats.dailyApplications.find(
      entry => entry.date.toDateString() === today.toDateString()
    );
    const todayCount = todayEntry ? todayEntry.count : 0;
    
    const currentPlan = SUBSCRIPTION_PLANS[user.subscription.plan] || SUBSCRIPTION_PLANS.free;
    const dailyLimit = currentPlan.dailyApplications;
    
    res.json({
      success: true,
      usage: {
        todayApplications: todayCount,
        dailyLimit,
        remainingApplications: Math.max(0, dailyLimit - todayCount),
        totalApplications: user.applicationStats.totalApplications,
        plan: user.subscription.plan,
        planName: currentPlan.name
      }
    });
  } catch (error) {
    console.error('Usage fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching usage information'
    });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
});

// Helper function to handle subscription changes
async function handleSubscriptionChange(subscription) {
  try {
    const user = await User.findOne({ 
      'subscription.stripeSubscriptionId': subscription.id 
    });
    
    if (!user) return;

    const isActive = subscription.status === 'active';
    const isCancelled = subscription.cancel_at_period_end;
    
    user.subscription.status = isCancelled ? 'cancelled' : 
                              isActive ? 'active' : 'inactive';
    
    if (subscription.current_period_end) {
      user.subscription.endDate = new Date(subscription.current_period_end * 1000);
    }

    await user.save();
    console.log(`Updated subscription for user ${user._id}: ${user.subscription.status}`);
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}

// Helper function to handle successful payments
async function handlePaymentSucceeded(invoice) {
  try {
    const user = await User.findOne({ 
      'subscription.stripeCustomerId': invoice.customer 
    });
    
    if (!user) return;

    // Extend subscription if it was about to expire
    if (user.subscription.status !== 'active') {
      const now = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      
      user.subscription.status = 'active';
      user.subscription.startDate = now;
      user.subscription.endDate = endDate;
      
      await user.save();
      console.log(`Renewed subscription for user ${user._id}`);
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

// Helper function to handle failed payments
async function handlePaymentFailed(invoice) {
  try {
    const user = await User.findOne({ 
      'subscription.stripeCustomerId': invoice.customer 
    });
    
    if (!user) return;

    // Mark subscription as inactive after payment failure
    user.subscription.status = 'inactive';
    await user.save();
    
    console.log(`Marked subscription inactive for user ${user._id} due to payment failure`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Get billing history
router.get('/billing-history', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.subscription.stripeCustomerId) {
      return res.json({
        success: true,
        invoices: []
      });
    }

    const invoices = await stripe.invoices.list({
      customer: user.subscription.stripeCustomerId,
      limit: 10
    });

    const formattedInvoices = invoices.data.map(invoice => ({
      id: invoice.id,
      amount: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency,
      status: invoice.status,
      date: new Date(invoice.created * 1000),
      description: invoice.description || 'Subscription payment',
      invoiceUrl: invoice.hosted_invoice_url
    }));

    res.json({
      success: true,
      invoices: formattedInvoices
    });
  } catch (error) {
    console.error('Billing history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching billing history'
    });
  }
});

module.exports = router;