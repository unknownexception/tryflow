var crypto = require('crypto');
var MongoClient = require('mongodb').MongoClient
var cache = module.exports;
var Promise = require("bluebird");

cache.hash = function(sourceCode) {
  return crypto.createHash('md5').update(sourceCode).digest('hex');
}

cache.init = function(cb) {
  var connectionString = process.env.MONGO_CONNECTION || require('../config').mongo;
  MongoClient.connect(connectionString, function(err, db) {
    if (err) {
      console.error('cannot estabilish connection to mongodb');
      process.exit();
    } else {
      console.log('connection to mongo was estabilished');
      cb(db);
    }
  });
}

cache.get = function (db     , key        , funcToBeCached          ) {
  return new Promise(function (resolve, reject) {
    var collection = db.collection('checks');
    collection.findOne({hash: key}, function(err, result)  {
      console.log(err, result);
      if (err) {
        reject(err);
      } else {
        if(result) {
          resolve(result);
        } else {
          funcToBeCached()
            .then(function(toCache)  {return cache.put(db, key, toCache);})
            .then(resolve);
        }
      }
    });
  });
}

cache.put = function(db, key, toCache) {
  return new Promise(function (resolve, reject) {
    var collection = db.collection('checks');
    toCache.hash = key;
    collection.insert(toCache, function(err)  {
      if (err) {
        reject(err);
      } else {
        resolve(toCache);
      }
    });
  });
}
