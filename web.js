var express = require('express'),
	stylus = require('stylus'),
	nib = require('nib'),
	url = require('url'),
	db = require('./db'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	fs = require('fs');


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

app.use(express.cookieParser());
app.use(express.session({secret : 'r=q%JryR]=us7|@oYL}"~5>T_#rWge;B'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

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

passport.serializeUser(
	function(user,done) {
		done(null,user._id);
	});

passport.deserializeUser(
	function(id,done) {
		db.get('users',{_id : id},
			function(err,results) {
				if(results.length > 0) {
					done(err,results[0]);
				}
				else {
					done(err,null);
				}
			});
	});

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
				{title : 'APIDocs', user : req.user});
		});
	
	//authentication
	
	//login page
	app.get('/login',
		function (req,res) {
			res.render('login',
				{title : 'APIDocs - Login', user : req.user});
		});

	//authenticate a user
	app.post('/login', passport.authenticate('local', { successRedirect: '/',
	                                                    failureRedirect: '/login' }));
	//create a new user
	app.post('/account',
		function (req,res) {
			db.get('users',{username : req.body.username},
				function(err,results) {
					if(results.length > 0) {
						res.writeHead(403,"Forbidden",{'Content-Type' : 'text/plain'});
						res.end();
					}
					else {
						var user = new Object();
						user.username = req.body.username;
						user.password = req.body.password;
						db.put('users',user,
							function (err) {
								if(err) {
									res.writeHead(500,"Internal Server Error",{'Content-Type' : 'text/plain'});
									res.end(err);
								}
								else {
									res.writeHead(201,"Created",{'Content-Type' : 'text/plain'});
									res.end();
								}
							});
					}
				});
		});

	//provides a callback with a list of the 'Language' APIElements (the top-level APIElements)
	function getLangs(callback) {
		// TODO: do this once at start?
		var langFile = __dirname + '/' + 'langs.json';
		fs.readFile(langFile, 'utf8', function(err, data) {
			if (err) {
				console.log(err);
				return;
			}

			// Extract language names from data.
			var langsData = JSON.parse(data);
			var langs = [];
			for (var i = 0; i < langsData.length; i++) {
				var langData = langsData[i];
				var langName = langData.name;
				langs.push(langName);
			}
			callback(langs);
		});
	}

	//respond to a request "req" for an API for which the database contains "results"
	function respondWithApi(err, results, req, res) {
		console.log(results);
		if(results.length > 0) {
			if(typeof req.query.json != 'undefined') {
				res.writeHead(200,'OK', {'Content-Type' : 'application/json'});
				res.end(JSON.stringify(results[0]));
			}
			else {
				res.render('api',{api : results[0],
									title : 'APIDocs - ' + results[0].fullName,
									user : req.user});
			}
		}
		//404
		else {
			res.status(404);
			res.render('404',
				{title : 'APIDocs - 404', user : req.user});
		}
	}

	//get a dummy root api, which has all language roots as children
	app.get("/api",
		function (req, res) {
			getLangs(
				function (langs) {
					var results = [{
						name : '',
        				path : '',
        				fullName : '',
        				type : 'Languages',
        				children : langs,
        				attr: [],
					}];
					respondWithApi(null, results, req, res);
				});
		});

	//get an existing api
	app.get("/api/*",
		function (req,res) {
			var apiFullName = req.params[0]
			console.log(apiFullName);
			db.get('api',{fullName : apiFullName}, function(error, results) {
					respondWithApi(error, results, req, res);
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
				{title : 'APIDocs - 404', user : req.user});
		});
	
	//start the web server
	app.listen(port,ip,
		function () {
			console.log('Listening on port ' + port);
		});
}

exports.start = start
