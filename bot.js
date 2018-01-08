var request = require('request');
var login = require('facebook-chat-api');

var subscribed = ['1823409617686241'];

var getlink = function(callback) {
    console.log('getting link...');
    //var subs = ['cats', 'catpictures', 'CatsStandingUp', 'LazyCats', 'CatConspiracy'];
    var subs = ['cats'];

    var headers = {
        "User-Agent": "catbot/0.1 by ___Troll"
    };
    var post_data = {
        "grant_type": "password",
        "username": "process.env.REDDITUSER",
        "password": "process.env.REDDITPASS"
    };
    var auth = {
        'user': 'i6jYKN4cMG5XVQ',
        'pass': 'tBNlZKAIEORco84dWvsG1U6dhLg',
        'sendImmediately': false
    };

    var access_token;
    var links = [];

    request({
        url: 'https://www.reddit.com/api/v1/access_token',
        headers: headers,
        method: 'POST',
        qs: post_data,
        auth: auth
    }, (error, response, body) => {
        body = JSON.parse(body);
        access_token = body.access_token;
        console.log('access_token: ', access_token);
        (function loopsubs(i) {
            if (i >= subs.length) {
                callback(links);
                return;
            }
            console.log(`checking sub: ${subs[i]}`);
            request({
                url: `https://oauth.reddit.com/r/${subs[i]}/hot`,
                headers: headers,
                auth: {
                    bearer: access_token
                },
                qs: {
                    limit: 5
                }
            }, (error, response, body) => {
                body = JSON.parse(body);
                let c = 0;
                body.data.children.forEach(function(post) {
                    if (post.data.post_hint == 'image') {
                        links.push(post.data.url);
                        c++;
                    }
                });
                console.log(`retrieved ${c} images from ${subs[i]}`);
                loopsubs(i + 1);
            });
        })(0);
    });
}

var prev_urls = [];

login({email: process.env.EMAIL, password: process.env.PASSWORD}, (err, api) => {
    if(err) return console.error(err);
 
    api.listen((err, message) => {
        if(err) console.log(err);
        if(typeof message == 'undefined'){
            console.log('failed');
            return;
        }
        if(typeof message.body == 'undefined'){
            console.log('empty');
            return;
        }
        var senderid=message.senderID;
        var tid=message.threadID;
        var txt=message.body;
        if (message.body == '!subscribe') {
            if (subscribed.indexOf(tid) >= 0) {
                api.sendMessage('This thread is already subscribed :/', tid);
            } else {
                subscribed.push(tid);
                console.log(`subscribed thread ${tid}`);
                api.sendMessage('Subscribed! :D', tid);
            }
        }
        if (message.body == '!unsubscribe') {
            var i = subscribed.indexOf(tid);
            if (i >= 0) {
                subscribed.splice(i, 1);
                console.log(`unsubscribed thread ${tid}`);
                api.sendMessage('Unsubscribed :(', tid);
            } else {
                api.sendMessage('This thread isn\'t subscribed :/', tid);
            }
        }
    });

    var sendImage = (url, threadID) => {
        console.log(`sending image ${url} to ${threadID}.`);
        api.sendMessage({ url: url }, threadID);
    };

    var doStuff = () => {
        getlink((urls) => {
            (function next(i) {
                if (i >= urls.length)
                    return;
                url = urls[i];
                console.log(url, prev_urls, url in prev_urls, prev_urls.indexOf(url));
                if (prev_urls.indexOf(url) >= 0) {
                    next(i + 1);
                } else {
                    subscribed.forEach((threadID) => {
                        sendImage(url, threadID);
                    });
                    prev_urls.push(url);
                }
            })(0);
        });
    };

    setInterval(doStuff, 60000);
});
