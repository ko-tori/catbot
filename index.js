var express = require('express');
var request = require('request');
var path = require('path');

var getlinks = function(callback) {
	console.log('getting links...');
	var subs = ['cats', 'catpictures', 'CatsStandingUp', 'LazyCats', 'CatConspiracy'];
	//var subs = ['cats'];

	var headers = {
		"User-Agent": "catbot/0.1 by ___Troll"
	};
	var post_data = {
		"grant_type": "password",
		"username": "___Troll",
		"password": "091398-908601"
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
	}, function(error, response, body) {
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
					limit: 10
				}
			}, function(error, response, body) {
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
};

var app = express();
var server = require("http").Server(app);

app.use(express.static("static"));

app.get("/", function(req, res) {
	res.sendFile(path.join(__dirname, '/index.html'));
});

app.post("/", function(req, res) {
	getlinks(function(links) {
		res.setHeader('Content-Type', 'application/json');
    	res.send(JSON.stringify(links));
	});
});

server.listen(3000, function() {
	console.log(`Running on port 3000...`);
});

