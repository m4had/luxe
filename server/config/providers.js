/**
 * Game Aggregator & Provider Configuration
 * 
 * Swap these values once you're onboarded with your chosen aggregator.
 * Supports: SoftSwiss, EveryMatrix, BetConstruct, Salsa Technology
 */

module.exports = {
  // Active aggregator: 'softswiss' | 'everymatrix' | 'betconstruct' | 'salsa'
  activeAggregator: process.env.GAME_AGGREGATOR || 'softswiss',

  softswiss: {
    apiBase: process.env.SOFTSWISS_API_URL || 'https://api.softswiss.com/v1',
    casinoId: process.env.SOFTSWISS_CASINO_ID || '',
    apiKey: process.env.SOFTSWISS_API_KEY || '',
    callbackUrl: process.env.SOFTSWISS_CALLBACK_URL || 'https://yourdomain.com/api/v1/games/callback/softswiss',
    currencies: ['USD', 'EUR', 'BTC', 'ETH', 'USDT', 'LTC'],
    defaultCurrency: 'USD',
  },

  everymatrix: {
    apiBase: process.env.EM_API_URL || 'https://gis.casinomodule.com/api/v2',
    operatorId: process.env.EM_OPERATOR_ID || '',
    apiKey: process.env.EM_API_KEY || '',
    callbackUrl: process.env.EM_CALLBACK_URL || 'https://yourdomain.com/api/v1/games/callback/everymatrix',
    currencies: ['USD', 'EUR', 'GBP', 'BTC'],
    defaultCurrency: 'USD',
  },

  betconstruct: {
    apiBase: process.env.BC_API_URL || 'https://casino.betconstruct.com/api/v1',
    partnerId: process.env.BC_PARTNER_ID || '',
    secretKey: process.env.BC_SECRET_KEY || '',
    callbackUrl: process.env.BC_CALLBACK_URL || 'https://yourdomain.com/api/v1/games/callback/betconstruct',
  },

  salsa: {
    apiBase: process.env.SALSA_API_URL || 'https://hub.salsatechnology.com/api',
    operatorToken: process.env.SALSA_OPERATOR_TOKEN || '',
    callbackUrl: process.env.SALSA_CALLBACK_URL || 'https://yourdomain.com/api/v1/games/callback/salsa',
  },

  // Payment processors
  payments: {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
    coinspaid: {
      apiKey: process.env.COINSPAID_API_KEY || '',
      secretKey: process.env.COINSPAID_SECRET_KEY || '',
      callbackUrl: process.env.COINSPAID_CALLBACK_URL || 'https://yourdomain.com/api/v1/payments/callback/crypto',
    },
    skrill: {
      merchantId: process.env.SKRILL_MERCHANT_ID || '',
      secretWord: process.env.SKRILL_SECRET || '',
    },
    neteller: {
      merchantId: process.env.NETELLER_MERCHANT_ID || '',
      apiKey: process.env.NETELLER_API_KEY || '',
    },
  },
};
