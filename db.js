var mongo = require('mongodb'),
	ObjectID = require('mongodb').ObjectID;

var mongoUri = (process.env.OPENSHIFT_MONGODB_DB_HOST ?
			'mongodb://admin:E3W9bKIybng5@'
			+ process.env.OPENSHIFT_MONGODB_DB_HOST
			+ ':' + process.env.OPENSHIFT_MONGODB_DB_PORT
			+ '/apidocs'
			: 'mongodb://localhost/test');

var mongoDB;

mongo.Db.connect(mongoUri, function (err, db) {
	if(err)
		console.log(err);
	mongoDB = db;
});

function get(col,params,callback) {
	var collection = mongoDB.collection(col);
	collection.find(params).toArray(callback);
}

function put(col,items,callback) {
	var api = mongoDB.collection(col);
	api.insert(items,{w:1},
		function(err,res) {
			if(err)
				console.log(err);
			callback(err,res);
		});
}

function update(col,items,params,callback) {
	var api = mongoDB.collection(col);
	api.update(items,params, {upsert : true},
		function(err,res) {
			if(err)
				console.log(err);
			callback(err,res);
		});
}

function del(col,items,callback) {
	var api = mongoDB.collection(col);
	api.insert(items,{w:1},
		function(err,res) {
			if(err)
				console.log(err);
			callback(err,res);
		});
}

exports.get = get
exports.put = put
exports.update = update
exports.del = del
exports.ObjectID = ObjectID
