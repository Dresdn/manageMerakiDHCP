var express = require('express');
var router = express.Router();
var request = require('request');

exports.index = function(req, res){
  var config = req.app.get('config');
  // config is now available
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
