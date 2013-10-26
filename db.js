var mongo = require('mongodb');

var mongoUri = process.env.MONGOLAB_URI
			|| process.env.MONGOHQ_URL
			|| 'mongodb://localhost/mydb';

var mongoDB;

mongo.Db.connect(mongoUri, function (err, db) {
	if(err)
		console.log(err);
	mongoDB = db;
});

function get(col,params) {
	var api = mongoDB.collection(col);
	return api.find(param);
}

function put(col,items,callback) {
	var api = mongoDB.collection(col);
	api.insert(items,{w:1},
		function(err,res) {
			if(err)
				console.log(err);
		});
}

function update(col,items,callback) {
	var api = mongoDB.collection(col);
	api.update(items,{w:1},
		function(err,res) {
			if(err)
				console.log(err);
		});
}

function remove(col,items,callback) {
	var api = mongoDB.collection(col);
	api.insert(items,{w:1},
		function(err,res) {
			if(err)
				console.log(err);
		});
}

exports.get = get
exports.put = put
exports.update = update
exports.remove = remove
