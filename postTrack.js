/**
 *   PostTrack
 *   Takes the DDB JSON document as the input (event), and writes it to the Tracker table.
 *   Computes and adds the 'user_trackts' composite range key.
 *   Also adds the 'created' and 'trackEpoch' attributes.
 * 
 *   'trackEpoch' is the Unix Epoch time (in ms), converted from the ISO 8601 format in event.trackTimestamp.
 *   This conversion is needed to support queries based on the date.
 * 
 */

console.log('Loading event');

var aws = require('aws-sdk');
var ddb = new aws.DynamoDB({params: {TableName: 'IR.Track'}});

exports.handler = function(event, context)
{
    console.log('Received event:', JSON.stringify(event, null, 2));
    var epochTrackTime = (new Date(event.Item.trackTimestamp)).getTime().toString();
    console.log('time epoch ', epochTrackTime);
    var createdTime = new Date().toISOString();

    //Save track to DDB
    var itemParams = {Item: {
            userId:           {S: event.Item.userId}, 
            trackEpoch:       {N: epochTrackTime},
            trackTimestamp:   {S: event.Item.trackTimestamp},
            createdTimestamp: {S: createdTime},
            trackStatus:      {N: event.Item.trackStatus}, 
            trackLat:         {N: event.Item.trackLat},
            trackLong:        {N: event.Item.trackLong}
        }};

    ddb.putItem(itemParams, function(err, data) 
    {
        if(err) { context.fail(err)}
        else {
           console.log(data);
           context.succeed({statusCode : 200, message : 'Success'});
        }
    });
    
    //Publish notification to SNS topic
    var msgJSON = JSON.stringify({msgType : 'track_notify', 
                                  msgVersion : '0.2', 
                                  track: { 
                                      userId :         event.Item.userId,
                                      trackTimestamp : event.Item.trackTimestamp,
                                      trackStatus :    parseInt(event.Item.trackStatus),
                                      trackLat :       parseFloat(event.Item.trackLat),
                                      trackLong :      parseFloat(event.Item.trackLong)
                                  }
                              });
    console.log(msgJSON);
    var sns = new aws.SNS();
    var params = {
        Message: msgJSON, 
        Subject: "New Track Notification",
        TopicArn: "arn:aws:sns:us-east-1:844301656928:trackerapp_alldevices_MOBILEHUB_1783878032"
    };

    console.log(params);
    sns.publish(params, function(err, data) {
        if (err) {
            console.log(err.stack);
            return;
        }
        context.done(null, 'Function Finished');  
    });
    
    
    
    
    
};