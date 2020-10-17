// Class Cloud:
//Interface between this app and the cloud server (IBM COS)

const myCOS = require('ibm-cos-sdk');
const async = require('async')
var fs = require("fs")

const bucketName=process.env.COS_BUCKETNAME

class Cloud {
    constructor() {
        this.cos = new myCOS.S3({
            endpoint: process.env.COS_ENDPOINT,
            apiKeyId: process.env.COS_APIKEY,
            ibmAuthEndpoint: process.env.COS_AUTH_ENDPOINT,
            serviceInstanceId: process.env.COS_SERVICEINSTANCE,
        });
    }

    async getBucketContents(cb) {
        //cb(err,data)
        console.log(`Retrieving bucket contents from: ${bucketName}`);
        try {
            const data = await this.cos.listObjects({
                Bucket: bucketName
            }).promise();
            if (data != null && data.Contents != null) {
                // data should contain:
                //   data.Contents[].Key : the filenames
                //   data.Contents[].Size: the filesize
                //   data.Contents[].LastModified : (Date)
                return cb(null, data);
            }
        } catch (e) {
            //TODO: put this error in the callback
            console.error(`ERROR: ${e.code} - ${e.message}\n`);
            return cb(e, null)
        }
    }

    async getItem(itemName, cb) {
        //cb(err,data)
        console.log(`Retrieving item from bucket: ${bucketName}, key: ${itemName}`);
        try {
            const data = await this.cos.getObject({
                Bucket: bucketName,
                Key: itemName
            }).promise();
            if (data != null) {
                return cb(null, data);
            }
        } catch (e) {
            //TODO: put this error in the callback
            console.error(`ERROR: ${e.code} - ${e.message}\n`);
            return cb(e, null)
        }
    }

    async simpleUpload(itemName, filePath) {
        console.log("Starting upload of "+itemName)
        await this.cos.upload({
            Bucket: bucketName,
            Key: itemName,
            Body: fs.createReadStream(filePath),
        }).promise()
            .then((data) => {
                console.log("file " + itemName + " uplaoded.")
            })
            .catch((err) => {
                console.error(`ERROR: ${err.code} - ${err.message}\n`);
            });
    }

    async multiPartUpload(itemName, filePath) {

        var uploadID = null;

        if (!fs.existsSync(filePath)) {
            log.error(new Error(`The file \'${filePath}\' does not exist or is not accessible.`));
            return;
        }

        console.log(`Starting multi-part upload for ${itemName} to bucket: ${bucketName}`);
        return this.cos.createMultipartUpload({
            Bucket: bucketName,
            Key: itemName
        }).promise()
            .then((data) => {
                uploadID = data.UploadId;

                //begin the file upload        
                fs.readFile(filePath, (e, fileData) => {
                    //min 5MB part
                    var partSize = 1024 * 1024 * 5;
                    var partCount = Math.ceil(fileData.length / partSize);

                    async.timesSeries(partCount, (partNum, next) => {
                        var start = partNum * partSize;
                        var end = Math.min(start + partSize, fileData.length);

                        partNum++;

                        console.log(`Uploading to ${itemName} (part ${partNum} of ${partCount})`);

                        this.cos.uploadPart({
                            Body: fileData.slice(start, end),
                            Bucket: bucketName,
                            Key: itemName,
                            PartNumber: partNum,
                            UploadId: uploadID
                        }).promise()
                            .then((data) => {
                                next(e, { ETag: data.ETag, PartNumber: partNum });
                            })
                            .catch((e) => {
                                cancelMultiPartUpload(bucketName, itemName, uploadID);
                                console.error(`ERROR: ${e.code} - ${e.message}\n`);
                            });
                    }, (e, dataPacks) => {
                        this.cos.completeMultipartUpload({
                            Bucket: bucketName,
                            Key: itemName,
                            MultipartUpload: {
                                Parts: dataPacks
                            },
                            UploadId: uploadID
                        }).promise()
                            .then(console.log(`Upload of all ${partCount} parts of ${itemName} successful.`))
                            .catch((e) => {
                                cancelMultiPartUpload(bucketName, itemName, uploadID);
                                console.error(`ERROR: ${e.code} - ${e.message}\n`);
                            });
                    });
                });
            })
            .catch((e) => {
                console.error(`ERROR: ${e.code} - ${e.message}\n`);
            });
    }
}
module.exports = Cloud