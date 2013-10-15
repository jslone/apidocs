var db = require('./db');

function purge(attr,purgeChildren) {
	var res = new Object();
	for(var i = 0; i < attr.length; i++) {
		res[attr[i]] = this[attr[i]];
	}
	for(var i = 0; i < this.children.length && purgeChildren; i++) {
		if(typeof(this.children[i] == 'APIElem')) {
			res.children[i] = this.children[i].purge(attr,purgeChildren);
		}
	}
}

function APIElem(name,path,type,version,children,attr) {
	this.name = name;
	this.fullName = path + '/' + name;
	this.type = type;
	this.version = version;
	this.children = children;
	this.attr = attr;
	this.purge = purge;
}

function loadChildren(item) {
	if(item.children) {
		//finish this up, loadChildren from db and replace names with APIElem
	}
}

function getMasterList(callback) {
	db.get({type : 'language'},
		function(items) {
			for(var i = 0; i < items.length; i++) {
				loadChildren(items[i]);//Load children then purge them
			}
		});
}
