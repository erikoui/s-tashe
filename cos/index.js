const myCOS = require('ibm-cos-sdk');

class Cloud {
    constructor() {
        this.cos = new myCOS.S3({
            endpoint: process.env.COS_ENDPOINT,
            apiKeyId: process.env.COS_APIKEY,
            ibmAuthEndpoint: process.env.COS_AUTH_ENDPOINT,
            serviceInstanceId: process.env.COS_SERVICEINSTANCE,
        });
    }
    async getBucketContents(bucketName) {
        console.log(`Retrieving bucket contents from: ${bucketName}`);
        return this.cos.listObjects(
            { Bucket: bucketName },
        ).promise()
            .then((data) => {
                if (data != null && data.Contents != null) {
                    for (var i = 0; i < data.Contents.length; i++) {
                        var itemKey = data.Contents[i].Key;
                        var itemSize = data.Contents[i].Size;
                        console.log(`Item: ${itemKey} (${itemSize} bytes).`)
                    }
                }
            })
            .catch((e) => {
                console.error(`ERROR: ${e.code} - ${e.message}\n`);
            });
    }
    async getItem(bucketName, itemName, cb) {
        console.log(`Retrieving item from bucket: ${bucketName}, key: ${itemName}`);
        return this.cos.getObject({
            Bucket: bucketName,
            Key: itemName
        }).promise()
            .then((data) => {
                if (data != null) {
                    cb();
                }
            })
            .catch((e) => {
                console.error(`ERROR: ${e.code} - ${e.message}\n`);
            });
    }
}
module.exports = Cloud