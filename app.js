'use strict';

// This will work with Node.js on CommonJS mode (TypeScript or not)
const { TwitterApi } = require('twitter-api-v2');
var express = require('express');
var app = express();

const port = process.env.PORT || 3001;

const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;
const CALLBACK = process.env.CALLBACK;

var oauth_token_secret;


app.use(express.static('public'));

app.get('/callback', (req, res) => {
    // Extract tokens from query string
    const { oauth_token, oauth_verifier } = req.query;

    if (!oauth_token || !oauth_verifier || !oauth_token_secret) {
        return res.status(400).send('You denied the app or your session expired!');
    }

    // Obtain the persistent tokens
    // Create a client from temporary tokens
    const client = new TwitterApi({
        appKey: CONSUMER_KEY,
        appSecret: CONSUMER_SECRET,
        accessToken: oauth_token,
        accessSecret: oauth_token_secret,
    });

    client.login(oauth_verifier)
        .then(({ client: loggedClient, accessToken, accessSecret }) => {
            // loggedClient is an authenticated client in behalf of some user
            // Store accessToken & accessSecret somewhere
            console.log(accessToken);
            console.log(accessSecret);

        })
        .catch(() => res.status(403).send('Invalid verifier or access tokens!'));
});

app.listen(port, function () {
});

async function init() {
    const client = new TwitterApi({
        appKey: CONSUMER_KEY,
        appSecret: CONSUMER_SECRET,
    });

    const authLink = await client.generateAuthLink(CALLBACK);
    oauth_token_secret = authLink.oauth_token_secret;
    console.log(authLink);

}

