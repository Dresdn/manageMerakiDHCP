var express = require('express'),
    router = express.Router(),
    jsonQuery = require('json-query'),
    form = require('express-form'),
    debug = require('debug')('networks');

// Status message
var status = new Object();
status.message = false;

function badRequest(error, res, url) {
  res.render('badRequest', {
    message: 'Unexpected Response: ' + res.req.statusCode,
    url: url,
    code: error.code
  });
}

async function postMerakiData(req, res, url, updateJson, callback) {

  let response;
  let dashboardUrl;

  response = await req.request(url, {
    method: 'HEAD',
    followAllRedirects: true
  }, function(error, response, body) {
    dashboardUrl = response.request.href;
    debug('HEAD Request Received:' + dashboardUrl);
  });

  var options = {
    method: 'PUT',
    url: dashboardUrl,
    headers: 
     { 'cache-control': 'no-cache',
       accept: 'application/json',
       'content-type': 'application/json'
     },
    json: true,
    body: updateJson
  };

  debug('STARTING PUT REQUEST:\nURL: %s\nDATA: %O\n', dashboardUrl, updateJson);

  response = await req.request(options, function (error, response, body) {
    if (error) {
      debug('PUT RECEIVED ERROR: %i', response.statusCode);
      throw new Error(error);
    };
  });

  debug('Doing Callback in function postMerakiData');
  callback(req, res);
};

/* GET home page. */
router.get('/', function(req, res, next) {

  var url = 'https://dashboard.meraki.com/api/v0/organizations/' + req.config.get('orgID') + '/networks';

  req.request({
    url: url
  }, function (error, response, body) {

      if (!error && response.statusCode === 200) {
        //Filter out only 'appliance' types
        networks = jsonQuery('[* type=appliance || type=combined]', {data: body}).value;

        res.render('networks', {
            results: networks,
        });
      } else {
        badRequest(error, res, url);
      }
  });
});

router.get('/:networkId', function(req, res, next) {

  var url = 'https://dashboard.meraki.com/api/v0/networks/' + req.params.networkId + '/vlans';

  req.request({
    url: url
  }, function (error, response, body) {

      if (!error && response.statusCode === 200) {

        res.render('vlans', {
            results: body,
            networkID: req.params.networkId
        });
      } else {
        badRequest(error, res, url);
      }
  });
});

router.get('/:networkId/:vlan', function(req, res, next) {

  var url = 'https://dashboard.meraki.com/api/v0/networks/' + req.params.networkId + '/vlans/' + req.params.vlan;

  req.request({
    url: url
  }, function (error, response, body) {

      if (!error && response.statusCode === 200) {

        //Sanitize our fixedIpAssignments into an array
        var fixedIpAssignments = [];

        for(var x in body.fixedIpAssignments){
          body.fixedIpAssignments[x].macAddress = x;
          fixedIpAssignments.push(body.fixedIpAssignments[x])
        };

        res.render('vlan', {
            results: body,
            fixedIpAssignments: fixedIpAssignments
        });
      } else {
        badRequest(error, res, url);
      }
  });
});

// Form handling
var formField = form.field;

router.post('/:networkId/:vlan', 

  form(
    formField('vlanName').trim().required().is(/^[a-z]+$/),
    formField('vlanSubnet').trim().required().is(/^[0-9]+$/),
    formField('fixedIpAssignments').array().required()
   ),

  function(req, res, next) {
    var url = 'https://dashboard.meraki.com/api/v0/networks/' + req.params.networkId + '/vlans/' + req.params.vlan;

    var formattedFixedIpAssignments = {};
    var data = req.form.fixedIpAssignments;

    // Reformat data into proper JSON Meraki API expects to receive
    for(var x in data){
      mac = data[x].mac;
      formattedFixedIpAssignments [mac] = { "ip": data[x].ip, "name": data[x].name};
    };

    // Set the JSON we want to update
    var updateJson = {
      fixedIpAssignments: formattedFixedIpAssignments
    };

    debug('Calling function postMerakiData');
    postMerakiData(req, res, url, updateJson, function (req, res) {

      // Redirect post-save
      res.redirect('/networks/' + req.params.networkId);
    });
});

module.exports = router;
