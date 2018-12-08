var csv         = require('csvtojson');
var Twitter     = require("twitter");
var rp          = require('request-promise');
var request     = require('request');
var cheerio     = require('cheerio');
var cron = require('node-cron');


var client = new Twitter({
    consumer_key: "uRrWr3DrwPAeSPUWeA46vdFDq",
    consumer_secret: "0YZ0zVTdYLeYp5bL25fW17YlWmFzDsVg2CagQ8E2TrWdLi2Ksy",
    access_token_key: "1378803818-P6iZEXVz3VcrTftms9ThR061wF6ZvOAo3vAkIIV",
    access_token_secret: "ChJwSzCL0N0WJoUlY8t8VbdOcH3uIgAC2ouLjs68PuURL",
});

module.exports = {

    index : async function(req, res, next) {
        var scripts = await Equity.find({});
        return res.view("pages/index", { scripts });
    },

    csvToDB : async function(req, res, next) {
    
        csvFilePath = "C:/Users/kunal/Desktop/octopus/assets/uploads/ListOfScrips.csv"
        var scriptArray = await csv().fromFile(csvFilePath);
        async.eachSeries(scriptArray, async function(script, callback) {
            var securityCode = script['security_code'];
            var securityId = script['security_id'];
            var securityName = script['security_name'];
            var status = script['status'];
            var group = script['group'];
            var face_value = script['face_value'];
            var isin_no = script['isin_no'] || "undefined";
            var industry = script['industry'] || "null";


            var createdUser = await Equity.create({
                id: securityCode,
                security_id: securityId,
                security_name: securityName,
                status: status,
                security_group: group,
                face_value: face_value,
                isin_no: isin_no,
                industry: industry
            }).fetch();
            callback();
        }, function (err) {
            console.log('all done!!!');
            if (err) {
                return res.serverError(err);
            }
            return res.send("ok");
        });
    },

    getTweetsOfBSE: async function(req, res, next) {

        

        var task = cron.schedule('* * * * *', async function() {
            var latestTweet = await ScriptTweets.find({}).sort('id DESC').limit(1);
            if (latestTweet.length !== 0) {
                latestTweetID = latestTweet[0]['id'];
            } else {
                latestTweetID = 0;
            }
            var params = '';
            if (latestTweetID === 0) {
                params = { screen_name: "BSE_News", count: 3200 };
            } else {
                params = { screen_name: "BSE_News", count: 3200, since_id: latestTweetID };
            }
            client.get('statuses/user_timeline', params, function (error, tweets, response) {

                if (!error) {
                    sails.log("loading number ---" + tweets.length);
                    async.eachSeries(tweets, async function (tweet, callback) {

                        var tweetID = tweet['id_str'];
                        var createdAt = tweet['created_at'];
                        var tweetText = tweet['text'];
                        var scriptID = tweetText.split('-')[0].trim();

                        var urlRegex = /(https?:\/\/[^ ]*)/;
                        var tweetURL = tweetText.match(urlRegex)[1];
                        await ScriptTweets.create({
                            id: tweetID,
                            created_at: createdAt,
                            script_id: scriptID,
                            tweet_url: tweetURL
                        });

                        request({
                            method: 'GET',
                            url: tweetURL
                        }, async function (err, response, body) {
                            if (err) 
                                sails.log(err);

                            // Tell Cherrio to load the HTML
                            $ = cheerio.load(body);
                            var securityCode = $("#ctl00_ContentPlaceHolder1_tdCompNm .spn02").first().text() || "";
                            var companyCode = $("#ctl00_ContentPlaceHolder1_tdCompNm .spn02 .tablebluelink").text() || "";
                            // var leng                = $(".TTHeadergrey").get().length();
                            var header = $(".TTHeadergrey").text() || "";
                            var pdfURL = $(".TTHeadergrey .tablebluelink").attr('href') || "";
                            var allText = $(".TTRow_leftnotices").parent().prev().text() || "";
                            if (allText.includes("Time Taken")) {
                                var receivedSubStr = allText.match(new RegExp("Exchange Received Time(.*)Exchange Disseminated Time")) || "";
                                var disseminatedSubStr = allText.match(new RegExp("Exchange Disseminated Time(.*)Time Taken")) || "";
                                if (receivedSubStr) {
                                    var receivedTime = receivedSubStr[1];
                                }
                                if (disseminatedSubStr) {
                                    var disseminatedTime = disseminatedSubStr[1];
                                }
                            } else if (allText.includes("Disseminated")) {
                                sails.log("<<<<<<<<<<<<<<<<<<<<<<<<< IN THIS THING >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                                var receivedTime = "";
                                var disseminatedTime = allText.substring(allText.indexOf("Time") + 4);
                            }

                            var description = $(".TTRow_leftnotices").text();
                            var totalTweets = await TweetsDesc.count({});
                            var countID = totalTweets + 1;
                            sails.log(`creating row ${countID} `)
                            // sails.log(`html loaded for tweet ${tweetURL} security code is ${securityCode}\n company code is ${companyCode} \n header is  ${header} \n description is ${description}\n pdf is ${pdfURL}\n time is ${receivedTime}\ndiss time is ${disseminatedTime}\n\n\n`);
                            try {
                                var tweetCreated = await TweetsDesc.create({
                                    id: countID,
                                    tweet_id: tweetID,
                                    script_id: scriptID,
                                    security_code: securityCode,
                                    headline: header,
                                    description: description,
                                    pdf_url: pdfURL,
                                    received_time: receivedTime,
                                    disseminated_time: disseminatedTime
                                }).fetch();

                            } catch (err) {
                                sails.log(">>>>>>>>>>>>>>>>>>>>>>>>>>> error is <<<<<<<<<<<<<<<<<<<<< " + err)
                            }
                            if (tweetCreated) {
                            } else {
                                sails.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>> error in creation of tweet <<<<<<<<<<<<<<<<<<<<<<")
                            }

                            callback();

                            // const options = {
                            //     uri: url,
                            //     transform: function (body) {
                            //         return cheerio.load(body);
                            //     }
                            // };
                            // sails.log("fetching url " + url);
                            // rp(options).then(($) => {
                            //     callback();
                            // }).catch((err) => {
                            //     sails.log(err);
                            // });

                        });
                    }, function (err) {
                        // sails.log('all done!!!');
                        if (err) {
                            sails.log(err)
                            // res.status(500).json({ error: error });
                        }

                        // res.view('pages/tweets', { tweets: tweets });
                    });
                } else {
                    sails.log(error)
                    // res.status(500).json({ error: error });
                }
            });
        });

        task.start();

    },
    latestTweetsofBSE : async function(req, res, next) {
        var latestTweetID = req.param('tweet_id');
        var params = { screen_name: "BSE_News", count: 3200, since_id : latestTweetID};
        cron.schedule("* * * * *", function () {
            console.log("running a task every minute");
            client.get('statuses/user_timeline', params, function (error, tweets, response) {
                if (!error) {
                    res.view('pages/tweets', { tweets: tweets });
                }
                else {
                    res.status(500).json({ error: error });
                }
            });
        });
        
    }
};