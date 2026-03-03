/**
 * Game Aggregator Abstraction Layer
 * 
 * Provides a unified interface across SoftSwiss, EveryMatrix, BetConstruct, etc.
 * Each aggregator has its own API shape — this normalizes them.
 */

const crypto = require('crypto');
const config = require('../config/providers');

class GameAggregator {
  constructor() {
    this.provider = config.activeAggregator;
    this.config = config[this.provider];
    if (!this.config) throw new Error(`Unknown aggregator: ${this.provider}`);
  }

  /**
   * Fetch full game catalog from aggregator
   */
  async getGames({ currency = 'USD', country = null, limit = 100, offset = 0 } = {}) {
    const params = { currency, limit, offset };
    if (country) params.country = country;

    switch (this.provider) {
      case 'softswiss':
        return this._request('GET', '/games', params, {
          transform: (data) => (data.games || []).map(g => ({
            id: g.identifier,
            externalId: g.identifier,
            name: g.title,
            provider: g.provider,
            category: g.category,
            type: g.type, // 'slots' | 'live_dealer' | 'table' | 'crash'
            rtp: g.payout,
            volatility: g.volatility,
            thumbnail: g.image,
            hasDemo: g.has_demo,
            isNew: g.is_new,
            isPopular: g.is_popular,
            currencies: g.currencies,
            minBet: g.min_bet,
            maxBet: g.max_bet,
            features: g.features || [],
            liveDealerInfo: g.live_dealer_info || null,
          })),
        });

      case 'everymatrix':
        return this._request('GET', '/games/list', params, {
          transform: (data) => (data.items || []).map(g => ({
            id: g.gameId,
            externalId: g.gameId,
            name: g.gameName,
            provider: g.vendorName,
            category: g.gameType,
            type: this._mapEMType(g.gameType),
            rtp: g.theoreticalPayOut,
            volatility: g.volatility || 'Medium',
            thumbnail: g.thumbnail,
            hasDemo: g.funMode,
            isNew: g.isNew,
            isPopular: g.popularity > 80,
            minBet: g.minBet,
            maxBet: g.maxBet,
          })),
        });

      case 'betconstruct':
        return this._request('GET', '/casino/games', params, {
          transform: (data) => (data.result || []).map(g => ({
            id: g.id,
            externalId: g.id,
            name: g.name,
            provider: g.provider_name,
            category: g.category_name,
            type: g.game_type,
            rtp: g.rtp,
            thumbnail: g.icon,
            hasDemo: g.has_demo,
          })),
        });

      default:
        throw new Error(`getGames not implemented for ${this.provider}`);
    }
  }

  /**
   * Launch a game session — returns a URL to embed in an iframe
   */
  async launchGame({ gameId, userId, username, currency = 'USD', mode = 'real', returnUrl, ip, locale = 'en' }) {
    switch (this.provider) {
      case 'softswiss':
        return this._request('POST', '/sessions', {
          casino_id: this.config.casinoId,
          game: gameId,
          currency,
          locale,
          ip,
          client_type: 'desktop',
          urls: { return_url: returnUrl, deposit_url: `${returnUrl}/deposit` },
          user: mode === 'real' ? { id: userId, firstname: username, currency } : null,
          demo: mode === 'demo',
        }, {
          transform: (data) => ({
            sessionId: data.session_id,
            gameUrl: data.game_url,
            strategy: 'iframe',
          }),
        });

      case 'everymatrix':
        return this._request('POST', '/games/launch', {
          gameId,
          playerId: userId,
          currency,
          language: locale,
          funMode: mode === 'demo',
          platform: 'MOBILE',
          returnUrl,
        }, {
          transform: (data) => ({
            sessionId: data.sessionId,
            gameUrl: data.launchUrl,
            strategy: 'iframe',
          }),
        });

      case 'betconstruct':
        return this._request('POST', '/casino/session/create', {
          game_id: gameId,
          player_id: userId,
          currency,
          is_demo: mode === 'demo',
          return_url: returnUrl,
        }, {
          transform: (data) => ({
            sessionId: data.session_id,
            gameUrl: data.url,
            strategy: 'iframe',
          }),
        });

      default:
        throw new Error(`launchGame not implemented for ${this.provider}`);
    }
  }

  /**
   * Process wallet callback from aggregator (bet, win, refund)
   * This is the critical integration point — the aggregator calls YOUR server
   * to debit/credit the player's wallet.
   */
  processCallback(provider, body, headers) {
    switch (provider) {
      case 'softswiss':
        return this._processSoftSwissCallback(body, headers);
      case 'everymatrix':
        return this._processEveryMatrixCallback(body, headers);
      case 'betconstruct':
        return this._processBetConstructCallback(body, headers);
      default:
        throw new Error(`Callback not implemented for ${provider}`);
    }
  }

  _processSoftSwissCallback(body, headers) {
    // Verify signature
    const signature = headers['x-sign'];
    if (signature) {
      const expected = crypto.createHmac('sha256', this.config.apiKey).update(JSON.stringify(body)).digest('hex');
      if (signature !== expected) throw new Error('Invalid signature');
    }

    // Normalize callback actions
    const action = body.action; // 'balance', 'bet', 'win', 'refund', 'rollback'
    return {
      action,
      userId: body.user_id,
      transactionId: body.transaction_id,
      roundId: body.round_id,
      gameId: body.game,
      amount: body.amount ? parseFloat(body.amount) / 100 : 0, // SoftSwiss sends cents
      currency: body.currency,
      finished: body.finished, // true if round is complete
      provider: 'softswiss',
    };
  }

  _processEveryMatrixCallback(body, headers) {
    const action = body.TransactionType?.toLowerCase(); // 'debit' | 'credit' | 'rollback'
    const actionMap = { debit: 'bet', credit: 'win', rollback: 'refund' };
    return {
      action: actionMap[action] || action,
      userId: body.ExternalPlayerId,
      transactionId: body.TransactionId,
      roundId: body.RoundId,
      gameId: body.GameId,
      amount: parseFloat(body.Amount || 0),
      currency: body.Currency,
      finished: body.RoundFinished,
      provider: 'everymatrix',
    };
  }

  _processBetConstructCallback(body, headers) {
    const actionMap = { bet: 'bet', win: 'win', rollback: 'refund', cancel_bet: 'refund' };
    return {
      action: actionMap[body.action] || body.action,
      userId: body.player_id,
      transactionId: body.transaction_id,
      roundId: body.round_id,
      gameId: body.game_id,
      amount: parseFloat(body.amount || 0),
      currency: body.currency,
      finished: body.is_round_finished,
      provider: 'betconstruct',
    };
  }

  _mapEMType(gameType) {
    const map = { 'Slot': 'slots', 'LiveCasino': 'live_dealer', 'TableGame': 'table', 'CrashGame': 'crash' };
    return map[gameType] || 'slots';
  }

  async _request(method, path, params, { transform } = {}) {
    const url = new URL(this.config.apiBase + path);
    const headers = { 'Content-Type': 'application/json' };

    // Auth headers per provider
    switch (this.provider) {
      case 'softswiss':
        headers['X-Casino-Id'] = this.config.casinoId;
        headers['X-Api-Key'] = this.config.apiKey;
        break;
      case 'everymatrix':
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        headers['X-Operator-Id'] = this.config.operatorId;
        break;
      case 'betconstruct':
        headers['X-Partner-Id'] = this.config.partnerId;
        const sig = crypto.createHmac('sha256', this.config.secretKey).update(JSON.stringify(params)).digest('hex');
        headers['X-Signature'] = sig;
        break;
    }

    const fetchOpts = { method, headers };
    if (method === 'GET') {
      Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
    } else {
      fetchOpts.body = JSON.stringify(params);
    }

    const res = await fetch(url.toString(), fetchOpts);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Aggregator API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    return transform ? transform(data) : data;
  }
}

module.exports = new GameAggregator();
