var express = require('express'),
	url = require("url"),
	uglifyJS = require("uglify-js"),
	sqwish = require('sqwish'),
	htmlminifier = require('html-minifier');
	db = require('./db');

var app = express();
app.use(express.logger());
app.use(express.compress());


//Use the env port when specified
var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8000;

function start() {
	//homepage
	app.get('/',
		function(req,res) {
		});
	
	//set up dynamic routing for requesting apis
	app.get("/*",
		function (req,res) {
			//set up server response here
		});
	
	//start the web server
	app.listen(port,
		function () {
			console.log('Listening on port ' + port);
		});
}

exports.start = start
