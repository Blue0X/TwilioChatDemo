const express = require('express'); // eslint-disable-line
const bodyParser = require('body-parser'); // eslint-disable-line
const config = require('./configuration.json');
const TokenProvider = require('./token-provider');

const app = express();

app.set('json spaces', 2);
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.get('/configuration', (req, res) => {
  if (config) {
    res.json(config);
  } else {
    res.json({});
  }
});

app.get('/token', (req, res) => {
  if (req.query.identity) {
    res.json({ token: TokenProvider.getToken(req.query.identity, req.query.pushChannel) });
  } else {
    throw new Error('no `identity` query parameter is provided');
  }
});

app.listen(3002, () => {
  console.log('Token provider listening on port 3002!');
});
