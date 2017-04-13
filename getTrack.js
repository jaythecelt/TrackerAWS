console.log('Loading event getTrack');

var aws = require('aws-sdk');
//var ddb = new aws.DynamoDB({params: {TableName: 'Tracker'}});
var ddb = new aws.DynamoDB.DocumentClient();

exports.handler = function(event, context)
{
    console.log('Received event:', JSON.stringify(event, null, 2));
    var user = event.user;
    var startTimeEpoch = (new Date(event.startTime)).getTime();
    console.log('Returning tracks for user ', event.user, ' starting at time epoch ', startTimeEpoch );

    var params = {
            TableName: "IR.Track",
            KeyConditionExpression: "userId = :u and trackEpoch >= :start_time",
            ExpressionAttributeValues: {
                ":u": user,
                ":start_time": startTimeEpoch
            },
            ProjectionExpression: "userId, trackTimestamp, trackStatus, trackLat, trackLong",
        };
     
    ddb.query(params, function(err, data) 
    {
        if(err) { context.fail(err)}
        else {
           console.log(data);
           context.succeed({statusCode : 200, message : 'Success', tracks : data.Items });
        }
    });


};

