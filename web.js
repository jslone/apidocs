var express = require('express'),
	stylus = require('stylus'),
	nib = require('nib'),
	url = require("url"),
	db = require('./db');

var app = express();

app.use(express.logger());
app.use(express.compress());
app.use(express.bodyParser());

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
		dest: __dirname + '/public',
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
	
	app.post('/login',
		function(req,res) {
		});
	
	//set up dynamic routing for requesting apis
	app.get("/api/*",
		function (req,res) {
			var apiFullName = req.url.substring(5,req.url.length);
			console.log(apiFullName);
			
			db.get('api',{fullName : apiFullName},
				function(err,results) {
					console.log(results);
					if(results.length > 0) {
						res.render('api',{'api' : results[0]});
					}
					//404
					else {
						res.render('404',
							{title : 'APIDocs - 404'});
					}
				});
		});

	app.post('/api/*',
		function(req,res) {
			api = req.body;
			if(typeof api == undefined ||
				typeof api.name == undefined ||
				typeof api.path == undefined ||
				typeof api.type == undefined ||
				typeof api.children == undefined ||
				typeof api.attr == undefined) {
				
				console.log('Invalid PUT request ' + req);
			}
			else {
				if(!api.fullName) {
					api.fullName = api.path + '/' + api.name;
				}
				db.put('api',api);
			}
		});

	app.put('/api/*',
		function(req,res) {
			api = req.body;
			if(typeof api == undefined ||
				typeof api.name == undefined ||
				typeof api.path == undefined ||
				typeof api.type == undefined ||
				typeof api.children == undefined ||
				typeof api.attr == undefined) {
				
				console.log('Invalid PUT request ' + req);
			}
			else {
				if(!api.fullName) {
					api.fullName = api.path + '/' + api.name;
				}
				db.update('api',api);
			}
		});

	app.del('/api/*',
		function(req,res) {
			var apiFullName = req.url.substring(5,req.url.length);
			db.del({fullName : apiFullName});
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
