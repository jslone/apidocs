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
				if (err) { return done(err,false); }
				if (res.length == 0) {return done(null,false);}
				var user = res[0];
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
		db.get('users',{_id : db.ObjectID(id)},
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
	//log the user out
	app.get('/logout', 
		function(req,res) {
			req.logout();
			res.redirect('/');
		});

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
			db.get('api', {path : ''},
				function(err, results) {
					var api =
					{
						name : 'APIDocs',
						path : '',
						type : 'Collection',
						children : results.map(function(api) {return api.name}),
						attr : []
					};
					respondWithApi(err, [api], req, res);
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
	
	app.get('/upload',
		function(req,res) {
			res.render('upload',{title : 'APIDocs - Upload',
									user : req.user});
		});

	//
	function validAPI(api) {
		if(typeof api == 'undefined' ||
			typeof api.name == 'undefined' ||
			typeof api.path == 'undefined' ||
			typeof api.type == 'undefined') {
			return false;
		}
		if(!api.fullName) {
			api.fullName = api.path + '/' + api.name;
		}
		if(!api.children) {
			api.children = [];
		}
		if(!api.attr) {
			api.attr = [];
		}
		return true;
	}

	//upload a single api elem
	function uploadAPI(api,user,done) {
		if(validAPI(api)) {
			db.get('api',{fullName : api.fullName},
				function(err,results) {
					if(results.length > 0 &&
						results[0].user_id &&
						!results[0].user_id.equals(user._id)) { //can't create same name
						done("Permission Denied");
					}
					else {
						if(results.length == 0 && api.path != '') {
							db.get('api', {fullName : api.path},
								function(err,results) {
									if(results.length == 0) {
										done("No parent exists");
									}
									else if(results[0].user_id && !results[0].user_id.equals(user._id)) {
										done("Permission Denied");
									}
									else {
										if(!api.user_id)
											api.user_id = user._id;
										db.update('api',
											{fullName : api.fullName},
											api,
											function(err) {
												if(err) {
													console.log(err);
													done(err);
												}
												else {
													updateParents(api,done);
												}
											});
									}
								});
						}
						if(typeof api.user_id == 'undefined')
							api.user_id = user._id;
						db.update('api',
							{fullName : api.fullName},
							api,
							function(err) {
								if(err) {
									console.log(err);
									done(err);
								}
								else {
									updateParents(api,done);
								}
							});
					}
				});
		}
		else {
			done("Invalid API");
		}
	}
	//upload a list of api elems
	function uploadAPIs(apis,user,done) {
		function uploadAPIsHelper(toLoad,loaded,index) {
			console.log(toLoad);
			console.log(loaded);
			console.log(index);
			if(apis.length == 0) {
				done(false);
			}
			else if(index == toLoad.length) {
				if(loaded == 0) {
					done("Could not load one or more elements");
				}
				else {
					uploadAPIsHelper(toLoad,0,0);
				}
			}
			else {
				uploadAPI(toLoad[index],user,
					function (err) {
						if(err) {
							console.log(err);
							uploadAPIsHelper(toLoad,loaded,index + 1);
						}
						else {
							toLoad.splice(index,1);
							uploadAPIsHelper(toLoad,loaded + 1,index);
						}
					});
			}
		}
		uploadAPIsHelper(apis,0,0);
	}

	//create a new api
	app.post('/upload',
		function(req,res) {
			fs.readFile(req.files.api.path,
				function(err,data) {
					var valid = true;
					var input;
					try {
						input = JSON.parse(data);
					}
					catch(e) {
						valid = false;
					}
					if(!valid) {
						res.status(400);
						res.render('uploaded',
							{title : 'APIDocs - Uploaded',
								user : req.user,
								error : "Malformed File"});
					}
					else {
						uploadAPIs(input,req.user,
							function(err) {
								res.status(err ? 403 : 201);
								res.render('uploaded',
									{title : 'APIDocs - Uploaded',
										user: req.user,
										error : err});
							});
					}
				});
		});

	// After an apis are successfully added to the database, updates their
	// parents to recognize their children. Will not re-add a child.
	function updateParents(api, done) {
		db.update('api', {fullName: api.path}, {$addToSet: {children: api.name}},done);
	}

	
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
