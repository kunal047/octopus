module.exports = {
    tableName: "tweets_desc",
    attributes: {
        id: {
            type: "number",
            columnName: "id",
            required: true
        },
        tweet_id: {
            type: "string",
            required: true
        },
        script_id: {
            type: "string",
            required: true
        },
        security_code: {
            type: "string",
            allowNull: true
        },
        headline: {
            type: "string",
            allowNull: true
        },
        description: {
            type: "string",
            allowNull: true
        },
        pdf_url: {
            type: "string",
            allowNull: true
        },
        received_time: {
            type: "string",
            allowNull: true
        },
        disseminated_time : {
            type: "string",
            allowNull: true
        }
    }
};