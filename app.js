'use strict';

// This will work with Node.js on CommonJS mode (TypeScript or not)
const { TwitterApi } = require('twitter-api-v2');
const express = require('express');
const cookieParser = require('cookie-parser');
const { response } = require('express');

var app = express();
app.use(cookieParser());


const port = process.env.PORT || 3001;

const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;
const CALLBACK = process.env.CALLBACK;

var oauth_token_secret;

app.use(express.static('public'));

app.get('/auth', async (req, res) => {

    const client = new TwitterApi({
        appKey: CONSUMER_KEY,
        appSecret: CONSUMER_SECRET,
    });

    const authLink = await client.generateAuthLink(CALLBACK);
    oauth_token_secret = authLink.oauth_token_secret;
    res.redirect(authLink.url);
});

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

            res.cookie('token', accessToken, { maxAge: 60000, httpOnly: false });
            res.cookie('sec', accessSecret, { maxAge: 60000, httpOnly: false });
            res.redirect("/");

        })
        .catch(() => res.status(403).send('Invalid verifier or access tokens!'));
});

app.get('/timeline', async (req, res) => {

    var client = getClient(req.cookies);
    var v2 = client.v2;

    var id = await getMeId(v2);
    var timeline = await v2.userTimeline(id);
    if (timeline.data != null) {
        console.log(timeline.data);
        res.json(timeline.data);
    } else {
        res.json({ "response": "nodata" });
    }

});

app.get('/followers', async (req, res) => {

    var client = getClient(req.cookies);
    var v2 = client.v2;

    var id = await getMeId(v2);
    var followers = await v2.followers(id);

    if (followers.data != null) {
        res.json(followers.data);
    } else {
        res.json({ "response": "nodata" });
    }
});

app.get('/following', async (req, res) => {

    var client = getClient(req.cookies);
    var v2 = client.v2;

    var id = await getMeId(v2);
    var following = await v2.following(id);

    if (following.data != null) {
        res.json(following.data);
    } else {
        res.json({ "response": "nodata" });
    }
});


app.get('/liked', async (req, res) => {

    var client = getClient(req.cookies);
    var v2 = client.v2;

    var id = await getMeId(v2);
    var liked = await v2.userLikedTweets(id);

    if (liked.data != null) {
        res.json(liked.data);
    } else {
        res.json({ "response": "nodata" });
    }
});

function getClient(cookie) {

    var accessToken = cookie.token;
    var accessSecret = cookie.sec;

    const client = new TwitterApi({
        appKey: CONSUMER_KEY,
        appSecret: CONSUMER_SECRET,
        accessToken: accessToken,
        accessSecret: accessSecret,
    });

    return client;
}

async function getMeId(v2){
    var response = await v2.me();
    return response.data.id;
};

app.listen(port, function () {
});

