/**
 *   PostSpotReport
 *   Takes JSON as the input (event), and writes it to the IRail.SpotReport table.
 *   Computes and adds the 'srEpoch' composite range key.
 *   Also adds the 'created' attributes.
 * 
 *   'srEpoch' is the Unix Epoch time (in ms), converted from the ISO 8601 format in event.srTimestamp.
 *   This conversion is needed to support queries based on the date.
 * 
 */

console.log('Loading event');

var aws = require('aws-sdk');
var ddb = new aws.DynamoDB({params: {TableName: 'IR.SpotReport'}});

exports.handler = function(event, context)
{
    console.log('Received event:', JSON.stringify(event, null, 2));
    var epochSRTime = (new Date(event.Item.srTimestamp)).getTime().toString();
    console.log('time epoch ', epochSRTime);
    var createdTime = new Date().toISOString();



    //Save spot report to DDB
    var itemParams = {Item: {
            userId:           {S: event.Item.userId}, 
            spotReportEpoch:  {N: epochSRTime},
            srTimestamp:      {S: event.Item.srTimestamp},
            createdTimestamp: {S: createdTime},
            srStatus:         {N: event.Item.srStatus}, 
            srLat:            {N: event.Item.srLat},
            srLong:           {N: event.Item.srLong},
            srTitle:          {S: event.Item.title},
            srDescription:    {S: event.Item.srDescription},
            srImageARN:       {S: event.Item.srImageARN},
            srImageKey:       {S: event.Item.srImageKey},
            srThumbnail:      {S: event.Item.srThumbnail}
        }};

console.log('ItemParams for DDB', itemParams);

    ddb.putItem(itemParams, function(err, data) 
    {
        if(err) { context.fail(err)}
        else {
           console.log(data);
           context.succeed({statusCode : 200, message : 'Success'});
        }
    });
    
console.log('DDB Put Compelted');
    
    //Publish notification to SNS topic
    var msgJSON = JSON.stringify({msgType : 'spot_report_notify', 
                                  msgVersion : '0.2', 
                                  spotReport: { 
                                      userId :      event.Item.userId,
                                      srTimestamp : event.Item.srTimestamp,
                                      srStatus :    parseInt(event.Item.srStatus),
                                      srLat :       parseFloat(event.Item.srLat),
                                      srLong :      parseFloat(event.Item.srLong),
                                      title:        event.Item.title,
                                      srDescription:event.Item.srDescription,
                                      srImageARN:   event.Item.srImageARN,
                                      srImageKey:   event.Item.srImageKey,
                                      srThumbnail:  event.Item.srThumbnail
                                  }
                              });
    console.log(msgJSON);
    var sns = new aws.SNS();
    var params = {
        Message: msgJSON, 
        Subject: "New Spot Report Notification",
        TopicArn: "arn:aws:sns:us-east-1:844301656928:trackerapp_alldevices_MOBILEHUB_1783878032"
    };

    console.log(params);
    sns.publish(params, function(err, data) {
        if (err) {
            console.log(err.stack);
            return;
        }
        context.done(null, data);  
    });
    
    
    
    
    
};