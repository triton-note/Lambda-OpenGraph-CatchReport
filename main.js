var async = require('async');
var aws = require("aws-sdk");
var dbdoc = require('dynamodb-doc');
var s3 = new aws.S3();

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

    var region = event.region;
    var bucketName = event.bucketName;
    var urlTimeout = event.urlTimeout;
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
    					 TableName: table_report,
    					 Key: {}
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
    					 Expires: urlTimeout,
    					 Bucket: bucketName,
    					 Key: "photo/reduced/mainview/" + cognitoId + "/" + reportId + "/photo_file.jpg"
    			 };
    			 log("S3 getURL: ", params);
    			 
    			 s3.getSignedUrl("getObject", params, next);
    		 },
    		 function(url, next) {
    			 log("Image URL: ", url);
    			 report.IMAGE_URL = url;
    			 
    			 var params = {
    					 TableName: table_catch,
    					 IndexName: indexName,
    					 KeyConditions: [
    					                   docClient.Condition(column_cognitoId, "EQ", cognitoId),
    					                   docClient.Condition(column_reportId, "EQ", reportId)
    					                   ]
    			 };
    			 log("Query: ", params);
    			 
    			 docClient.query(params, next);
    		 },
    		 function(res, next) {
    			 log("Result of Query: ", res);
    			 
    			 report.title = "Report:" + reportId;
    			 report.description = report.title;
    			 report.CATCHES = res.Items.map(function(fish) {
    				 if (!fish.CONTENT.length) fish.CONTENT.length = "";
    				 if (!fish.CONTENT.weight) fish.CONTENT.weight = "";
    				 return fish;
    			 });
    			 next(null, report);
    		 },
    		 function(report, next) {
    			 log("Report: ", report);
    			 
    			 var base64 = new Buffer(JSON.stringify(event)).toString('base64');
    			 
    			 next(null, {
    				 "info": event,
    				 "info_base64": base64,
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
