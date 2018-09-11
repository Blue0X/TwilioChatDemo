const Twilio = require('twilio'); // eslint-disable-line

const { AccessToken } = Twilio.jwt;
const credentialsFromFile = require('./configuration.json');

const TokenProvider = {

  getToken(identity, pushChannel = null, customTTL = 3600) {
    if (!credentialsFromFile.tokenGenerator ||
        !credentialsFromFile.tokenGenerator.accountSid ||
        !credentialsFromFile.tokenGenerator.serviceSid ||
        !credentialsFromFile.tokenGenerator.signingKeySid ||
        !credentialsFromFile.tokenGenerator.signingKeySecret) {
      throw new Error(`${new Date()} [token-generator] [ERROR] No full credentials found in configuration.json`);
    }
    const token = new AccessToken(
      credentialsFromFile.tokenGenerator.accountSid,
      credentialsFromFile.tokenGenerator.signingKeySid,
      credentialsFromFile.tokenGenerator.signingKeySecret, {
        identity,
        ttl: (Number.isInteger(customTTL) ? customTTL : 3600),
      });

    const grant = new AccessToken.ChatGrant({ serviceSid: credentialsFromFile.tokenGenerator.serviceSid });
    if (pushChannel) {
      if (credentialsFromFile.tokenGenerator[pushChannel]) {
        grant.pushCredentialSid = credentialsFromFile.tokenGenerator[pushChannel];
      }
    }
    token.addGrant(grant);

    return token.toJwt();
  },
};

module.exports = TokenProvider;

