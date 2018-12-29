module.exports = function (context, cb) {
    console.log('starting webtask');
    if (!context.headers['authentication'] || context.headers['authentication'] !== context.secrets.apiToken) {
        console.log('Unauthorized request.');
        cb(null, 'You\'re not authorized to do that!');
    } else {
        const rp = require('request-promise');
        const twilioClient = require('twilio')(context.secrets.twilioAccountSid, context.secrets.twilioAuthToken);
        const query = '#dadjokes';
        fetchTweets(context.secrets.twitterConsumerApiToken, rp, query)
            .then( (response) => {
                const srcNum = context.secrets.twilioNumber;
                const dstNum = context.secrets.twilioVerifiedDstNumber;
                const smsBody = (response.statuses.length > 0) ? response.statuses[0].text : 'Sorry, no tweets for ' + query;
                sendSMS(twilioClient, srcNum, dstNum, smsBody);
                return smsBody;
            })
            .then(text => cb(null, text));
        }
};

var fetchTweets = function (bearerToken, rp, query) {
    console.log('fetching tweets for query: ' + query);
    const options = {
        qs: {
            q: query,
            result_type: 'recent',
            count: 1
        },
        auth: {
            bearer: bearerToken
        },
        json: true
    };
    const twitterUrl = 'https://api.twitter.com/1.1/search/tweets.json';

    return rp(twitterUrl, options);
};

var sendSMS = function (client, srcPhoneNumber, dstPhoneNumber, msg) {
    console.log('sending sms from: ' + srcPhoneNumber + ', to: ' + dstPhoneNumber + ', msg: ' + msg);
    // NOTE: twilio trial accounts can only send sms to verified numbers.
    client.messages
        .create({
            body: msg,
            from: srcPhoneNumber,
            to: dstPhoneNumber
        })
        .then(message => console.log(message.sid))
        .done();
};

