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

function get(params,callback) {
	var api = mongoDB.collection('api');
	api.find(params).toArray(
		function(err,items) {
			if(err)
				console.log(err);
			callback(items);
		});
}

function put(items,callback) {
	var api = mongoDB.collection('api');
	api.insert(items,{w:1},
		function(err,res) {
			if(err)
				console.log(err);
		});
}

exports.get = get
exports.put = put
