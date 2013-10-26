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
}

function purge(api) {
	var newAPI = new Object();
	newAPI.name = api.name;
	newAPI.children = api.children;
	mapChildren(newAPI,purge);
	return newAPI;
}

//api has to be either elem or full name
function loadChildren(api) {
	mapChildren(api,
		function(child) {
			if(typeof child == 'string') {
				var res = db.get({fullName : api.fullName + '/' + child});
				if(res.length != 1)
					console.log('Error loading children: db responded with ' + res);
				else
					child = res[0];
			}
			loadChildren(child);
			return child;
		});
	return api;
}
