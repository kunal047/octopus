module.exports = {
    tableName: "script_tweets",
    attributes: {
        id: {
            type: "string",
            columnName: "tweet_id",
            required: true
        },
        created_at: {
            type: "string",
            required: true
        },
        script_id: {
            type: "string",
            required: true
        },
        tweet_url: {
            type: "string",
            required: true
        },
    }
};