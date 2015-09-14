var async = require('async');
var aws = require("aws-sdk");
var dbdoc = require('dynamodb-doc');

var log = function() {
	var args = Array.prototype.map.call(arguments, function(value) {
		if (typeof value === 'string') {
			return value;
		} else {
			return JSON.stringify(value, null, 2)
		}
	});
	console.log.apply(this, args);
}

exports.handler = function(event, context) {
    log('Received event:', event);

	var appId = event.appId;
	var appName = event.appName;
    var region = event.region;
    var table_report = event.table_report;
    var table_catch = event.table_catch;
    var column_cognitoId = "COGNITO_ID";
    var column_reportId = "REPORT_ID";
    var indexName = "COGNITO_ID-REPORT_ID-index";
    var cognitoId = event.cognitoId;
    var reportId = event.reportId;

    aws.config.update({region: region});
    var docClient = new dbdoc.DynamoDB();
    
    var report = null;

    async.waterfall(
    		[
    		 function(next) {
    			 var params = {
    					 "TableName": table_report,
    					 "Key": {}
    			 };
        		 params.Key[column_cognitoId] = cognitoId;
        		 params.Key[column_reportId] = reportId;
    			 log("GetItem: ", params);
    			 
    			 docClient.getItem(params, next);
    		 },
    		 function(res, next) {
    			 log("Result of GetItem: ", res);
    			 report = res.Item;
    			 
    			 var params = {
    					 "TableName": table_catch,
    					 "IndexName": indexName,
    					 "KeyConditions": [
    					                   docClient.Condition(column_cognitoId, "EQ", cognitoId),
    					                   docClient.Condition(column_reportId, "EQ", reportId)
    					                   ]
    			 };
    			 log("Query: ", params);
    			 
    			 docClient.query(params, next);
    		 },
    		 function(res, next) {
    			 log("Result of Query: ", res);
    			 
    			 report.CATCHES = res.Items.map(function(fish) {
    				 if (!fish.CONTENT.length) fish.CONTENT.length = "";
    				 if (!fish.CONTENT.weight) fish.CONTENT.weight = "";
    				 return fish;
    			 });
    			 next(null, report);
    		 },
    		 function(report, next) {
    			 next(null, {
    				 "appId": appId,
    				 "appName": appName,
    				 "report": report
    			 });
    		 }
            ],
    		function(err, result) {
    			if (err) {
    				context.fail(err);
    			} else {
    				log("Result: ", result);
    				context.succeed(result);
    			}
    		});
}
