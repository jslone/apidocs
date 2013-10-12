var mongo = require('mongodb');

var mongoUri = process.env.MONGOLAB_URI
			|| process.env.MONGOHQ_URL
			|| 'mongodb://localhost/mydb';

var mongoDB;

mongo.Db.connect(mongoUri, function (err, db) {
	mongoDB = db;
});
