var express = require('express');
var router = express.Router();
var jsonQuery = require('json-query');

// Form handing
var form = require('express-form');
var field = form.field;

// Status message
var status = new Object();
status.message = false;

function badRequest(res, response, url) {
  res.render('badRequest', {
    message: "Unexpected Response: " + response.statusCode,
    url: url,
    code: response.statusCode
  });
}

/* GET home page. */
router.get('/', function(req, res, next) {

  //var url = "https://qrng.anu.edu.au/API/jsonI.php?length=4&type=uint8&#8217";

  var url = "https://dashboard.meraki.com/api/v0/organizations/" + req.config.get('orgID') + "/networks";

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
        badRequest(res, response, url);
      }
  });
});

router.get('/:networkId', function(req, res, next) {

  var url = "https://dashboard.meraki.com/api/v0/networks/" + req.params.networkId + "/vlans";

  req.request({
    url: url
  }, function (error, response, body) {

      if (!error && response.statusCode === 200) {

        res.render('vlans', {
            results: body,
            networkID: req.params.networkId
        });
      } else {
        badRequest(res, response, url);
      }
  });
});

router.get('/:networkId/:vlan', function(req, res, next) {

  var url = "https://dashboard.meraki.com/api/v0/networks/" + req.params.networkId + "/vlans/" + req.params.vlan;

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
        badRequest(res, response, url);
      }
  });
});

router.post('/:networkId/:vlan', 

  form(
    field("vlanName").trim().required().is(/^[a-z]+$/),
    field("vlanSubnet").trim().required().is(/^[0-9]+$/)
   ),


  function(req, res, next) {
    console.log("Middleware!");
    console.log("VLAN Name:", req.form.vlanName);
    console.log("VLAN Subnet:", req.form.vlanSubnet);
    next();
  },

  function(req, res, next) {

    //Do stuff to the form data
    status.message = true;

    status.success = true;
    status.text = "Changes successfully saved.";

    var url = "https://dashboard.meraki.com/api/v0/networks/" + req.params.networkId + "/vlans/" + req.params.vlan;
    //var updateJson = JSON.stringify({
    var updateJson = {
      name: req.form.vlanName,
      subnet: req.form.vlanSubnet
    };

    console.log('Sending JSON:' + updateJson);

    req.request(
        { method: 'PUT',
          url: url,
          json: updateJson,
          followAllRedirects: true, // Follows Meraki's 302 redirect
        },
        function (error, response, body) {
          if(response.statusCode == 201){
            console.log('document saved as: ' + url)
          } else {
            console.log('error: '+ response.statusCode)
            console.log(body)
          }
        }
      );

    next();
  },

  function(req, res, next) {

    console.log("Getting VLAN data now...");

    //Render the latest info
    var url = "https://dashboard.meraki.com/api/v0/networks/" + req.params.networkId + "/vlans/" + req.params.vlan;

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

          // Render the page
          res.render('vlan', {
              results: body,
              fixedIpAssignments: fixedIpAssignments,
              status: status
          });
        } else {
          badRequest(res, response, url);
        }
    });
});


module.exports = router;
