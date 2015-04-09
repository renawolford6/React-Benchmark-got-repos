'use strict';
var tape = require('tape');
var from2Array = require('from2-array');
var got = require('../');
var server = require('./server.js');
var s = server.createServer();

s.on('/', function (req, res) {
	req.pipe(res);
});

s.on('/method', function (req, res) {
	res.setHeader('method', req.method);
	res.end();
});

s.on('/empty', function (req, res) {
	res.end();
});

tape('setup', function (t) {
	s.listen(s.port, function () {
		t.end();
	});
});

tape('GET can have body', function (t) {
	t.plan(3);

	var stream = from2Array(['wow']);
	stream.on('end', function () {
		t.ok(true); // Ensure, that stream was dumped
	});

	got.get(s.url + '/method', {body: stream}, function (err, data, res) {
		t.error(err);
		t.equal(res.headers.method, 'GET');
	});
});

tape('send data from options with post request', function (t) {
	t.plan(3);

	got(s.url, {body: 'wow'}, function (err, data) {
		t.equal(data, 'wow');
	});

	got(s.url, {body: new Buffer('wow')}, function (err, data) {
		t.equal(data, 'wow');
	});

	got(s.url, {body: from2Array(['wow'])}, function (err, data) {
		t.equal(data, 'wow');
	});
});

tape('works with empty post response', function (t) {
	got(s.url + '/empty', {body: 'wow'}, function (err, data) {
		t.equal(data, '');
		t.end();
	});
});

tape('return readable stream', function (t) {
	got.post(s.url, {body: from2Array(['wow'])})
		.on('data', function (data) {
			t.equal(data.toString(), 'wow');
			t.end();
		});
});

tape('return writeable stream', function (t) {
	got.post(s.url)
		.on('data', function (data) {
			t.equal(data.toString(), 'wow');
			t.end();
		})
		.end('wow');
});

tape('throws on write to stream with body specified', function (t) {
	t.throws(function () {
		got(s.url, {body: 'wow'}).write('wow');
	});
	setTimeout(t.end.bind(t), 10); // wait for request to end
});

tape('cleanup', function (t) {
	s.close();
	t.end();
});
