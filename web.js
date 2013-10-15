var express = require('express'),
	stylus = require('stylus'),
	nib = require('nib'),
	url = require("url"),
	db = require('./db');

var app = express();

app.use(express.logger());
app.use(express.compress());

//extend compile function for stylus to use nib
function compile(str, path) {
	return stylus(str)
			.set('filename', path)
			.set('compress', true)
			.use(nib());
}

//setup stylus
app.use(stylus.middleware(
	{
		src: __dirname + '/style',
		dest: __dirname + '/public/css',
		compile: compile
	}
	  ));

//setup jade
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

//turn on static file hosting for stylesheets and javascript
//	may turn this off later and open files manually to reduce
//	disk io
app.use(express.static(__dirname + '/public'));


function start() {
	//homepage
	app.get('/',
		function(req,res) {
			res.render('index',
				{title : 'APIDocs'});
		});
	
	//set up dynamic routing for requesting apis
	app.get("/api/*",
		function (req,res) {
			//set up server response here
		});
	
	
	//Use the env port when specified
	var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8000;
	var ip = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
	//start the web server
	app.listen(port,ip,
		function () {
			console.log('Listening on port ' + port);
		});
}

exports.start = start
