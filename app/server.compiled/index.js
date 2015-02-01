var express = require('express');
var app = express();
var flowCheck = require('./flow_check');
var cache = require('./cache');
var bodyParser = require('body-parser');
var beautify = require('js-beautify').js_beautify;
var reactTools = require('react-tools');

function errorHandler(err, req, res, next) {
  console.log(err);
  res.status(500).json('Unexpected error, please try again');
}

function flowES6toES5(code) {
  return beautify(
    reactTools.transform(code, {
      harmony: true,
      stripTypes: true
    }), {
      indent_size: 4
  });
}

function fillCache(code) {
  return flowCheck(code)
    .then(function(gotErrors)  {
      return {
        views: 1,
        source: code,
        target: flowES6toES5(code),
        errors: flowCheck.transformErrors(gotErrors),
        created_at: new Date(),
        updated_at: new Date()
      }
  });
}

app.use(express.static('./dist', {}));
app.use(bodyParser.json());

app.post('/load_code', function (req, res) {
  cache
  .get(app.db, req.body.hash)
  .then(function(fromCache)  {return res.json(fromCache);});
});

app.post('/flow_check', function (req, res) {
  cache
    .get(app.db, cache.hash(req.body.source), function()  {return fillCache (req.body.source);})
    .then(function(fromCache)  {return res.json(fromCache);});
});

app.get('/flow_version', function (req, res) {
  flowCheck.version(function(err, version)  {return res.json({err: err, version: version});});
});

app.use(errorHandler);

var server = app.listen(process.env.PORT || 3000, function () {

  var host = server.address().address
  var port = server.address().port
  cache.init(function(db)  {return app.db = db;});
  console.log('app listening at http://%s:%s', host, port)
});
