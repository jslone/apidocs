var express = require('express'),
	url = require("url"),
	uglifyJS = require("uglify-js"),
	sqwish = require('sqwish'),
	htmlminifier = require('html-minifier');
	db = require('./db.js');

var app = express();
app.use(express.logger());
app.use(express.compress());


//Use the env port when specified
var port = process.env.PORT || 8000;

function start() {
	//set up dynamic routing
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

export start = start
