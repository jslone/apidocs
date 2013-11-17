var db = require('./db');

function APIElem(name,path,type,version,children,attr) {
	this.name = name;
	this.path = path;
	this.fullName = name + path;
	this.type = type;
	this.children = children;
	this.attr = attr;
}

function mapChildren(api,f) {
	if(api.children) {
		for(var i = 0; i < api.children.length; i++) {
			api.children[i] = f(api.children[i]);
		}
	}
	return api;
}

function purge(api) {
	var newAPI = new Object();
	newAPI.name = api.name;
	newAPI.children = api.children;
	newAPI = mapChildren(newAPI,purge);
	return newAPI;
}

//api has to be either elem or full name
function loadChildren(api,callback) {
	api = mapChildren(api,
		function(name) {
			return api.fullName + '/' + name;
		});
	db.get({fullName:{$in:api.children}},
		function(err,res) {
			callback(res);
		});
}
