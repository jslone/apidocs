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

function get(name,path,callback) {
	var api = mongoDB.collection('api');
	api.findOne({fullName : path + '/' +  name},
		function(err,res) {
			if(err)
				console.log(err);
			callback(res);
		});
}

function put(obj,callback) {
	var api = mongoDB.collection('api');
	api.insert(obj,{w:1},
		function(err,res) {
			if(err)
				console.log(err);
		});
}

exports.get = get
exports.put = put
