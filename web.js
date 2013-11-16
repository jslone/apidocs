var express = require('express'),
	stylus = require('stylus'),
	nib = require('nib'),
	url = require('url'),
	db = require('./db'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy;


//Use the env port when specified
var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8000;
var ip = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";


var app = express();

app.enable('trust proxy');

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

//Set up the authentication strategy, in this case, just see if
//	the passwords match because we are already sending hashed
//	passwords over https
passport.use(new LocalStrategy(
	function(username, password, done) {
		db.get('users',{ username: username },
			function (err, res) {
				if (err) { return done(err); }
				if (res.length == 0) {return done(null,false);}
				user = res[0];
				if(user.password == password)
					return done(null,user);
				else
					return done(null,false);
			});
	}));



function start() {
	//use https
	app.all('*',
		function(req,res,next) {
			if(req.protocol == 'https' || ip == '127.0.0.1') {
				next();
			}
			else {
				res.redirect('https://' + req.get('host') + req.url);
			}
		});
	
	//homepage
	app.get('/',
		function(req,res) {
			res.render('index',
				{title : 'APIDocs'});
		});
	
	//authentication
	app.post('/login', passport.authenticate('local', { successRedirect: '/',
	                                                    failureRedirect: '/login' }));

	//get an existing api
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
						res.status(404);
						res.render('404',
							{title : 'APIDocs - 404'});
					}
				});
		});
	
	//create a new api
	app.post('/api/*',
		function(req,res) {
			api = req.body;
			if(typeof api == 'undefined' ||
				typeof api.name == 'undefined' ||
				typeof api.path == 'undefined' ||
				typeof api.type == 'undefined') {
				console.log('Invalid PUT request ' + api);
			}
			else {
				if(!api.fullName) {
					api.fullName = api.path + '/' + api.name;
				}
				if(!api.childern) {
					api.children = [];
				}
				if(!api.attr) {
					api.attr = [];
				}
				db.get('api',{fullName : api.fullName},
					function(err,results) {
						if(results.length > 0) { //can't create same name
							res.writeHead(405, "Method not supported", {'Content-Type': 'text/plain'});
							res.end("Allow: GET, PUT, DELETE");
						}
						else {
							db.put('api',api,
								function(err) {
									if(err) {
										res.writeHead(500,"Internal Server Error",{'Content-Type': 'text/plain'});
										res.end(err);
									}
									else {
										res.writeHead(201,"Created",{'Content-Type':'text/plain'});
										res.end();
									}
								});
						}
					});
			}
		});

	//update an existing api
	app.put('/api/*',
		function(req,res) {
			api = req.body;
			if(typeof api == 'undefined' ||
				typeof api.name == 'undefined' ||
				typeof api.path == 'undefined' ||
				typeof api.type == 'undefined') {
				console.log('Invalid PUT request ' + api);
			}
			else {
				if(!api.fullName) {
					api.fullName = api.path + '/' + api.name;
				}
				if(!api.childern) {
					api.children = [];
				}
				if(!api.attr) {
					api.attr = [];
				}
				console.log(api);
				db.update('api',api,
					function(err) {
						if(err) {
							res.writeHead(500,"Internal Server Error",{'Content-Type' : 'text/plain'});
							res.end(err);
						}
						else {
							res.writeHead(200,"OK",{'Content-Type' : 'text/plain'});
							res.end();
						}
					});
			}
		});
	
	//delete an existing api
	app.del('/api/*',
		function(req,res) {
			var apiFullName = req.url.substring(5,req.url.length);
			db.del({fullName : apiFullName});
		});
	
	//404 for everything else
	app.all('*',
		function(req, res, next){
			res.status(404);
			res.render('404',
				{title : 'APIDocs - 404'});
		});
	
	//start the web server
	app.listen(port,ip,
		function () {
			console.log('Listening on port ' + port);
		});
}

exports.start = start
