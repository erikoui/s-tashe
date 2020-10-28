/**
 *  @fileOverview Helper to connect to the cloud storage.
 *
 *  @author       erikoui
 *
 *  @requires     NPM:ibm-cos-sdk
 */

/**
 * Interface between this app and the cloud server (IBM COS)
 * @module cos
*/

const myCOS = require('ibm-cos-sdk');
const async = require('async');
const fs = require('fs');

const bucketName = process.env.COS_BUCKETNAME;

// TODO: Convert everything to promises (no callbacks)

/**
 * @class
 */
class Cloud {
  /**
   * Sets up the api keys and passwords, and then connects to the cloud.
   * @constructor
   */
  constructor() {
    this.cos = new myCOS.S3({
      endpoint: process.env.COS_ENDPOINT,
      apiKeyId: process.env.COS_APIKEY,
      ibmAuthEndpoint: process.env.COS_AUTH_ENDPOINT,
      serviceInstanceId: process.env.COS_SERVICEINSTANCE,
      cos_hmac_keys: {
        access_key_id: process.env.COS_ACCESS_KEY_ID,
        secret_access_key: process.env.COS_SECRET_ACCESS_KEY,
      },
    });
  }

  /**
   * Returns a promise of a list of all files in the bucket specified by
   * the COS_BUCKETNAME environment variable.
   */
  async getBucketContents() {
    console.log(`Retrieving bucket contents from: ${bucketName}`);
    return await this.cos.listObjects({
      Bucket: bucketName,
    }).promise().then((data) => {
      if (data != null && data.Contents != null) {
        return data;
      }
    }).catch((e) => {
      throw e;
    });
  }

  /**
   * Uploads a single file to the cloud
   * @param {string} itemName - The cloud filename (aka Key)
   * @param {string} filePath - The local absolute file path
   */
  async simpleUpload(itemName, filePath) {
    console.log('Starting upload of ' + itemName);
    await this.cos.upload({
      Bucket: bucketName,
      Key: itemName,
      Body: fs.createReadStream(filePath),
    }).promise().then((data) => {
      console.log('file ' + itemName + ' uplaoded.');
    })
        .catch((err) => {
          console.error(`ERROR: ${err.code} - ${err.message}\n`);
        });
  }

  /**
   * Uploads a single file to the cloud, in multiple parts. This is
   * useful when uploading files greater than 5 MB
   * @param {string} itemName - The cloud filename (aka Key)
   * @param {string} filePath - The local absolute file path
   */
  async multiPartUpload(itemName, filePath) {
    let uploadID = null;

    if (!fs.existsSync(filePath)) {
      throw new Error(`The file \'${filePath}\' does not exist or is not 
        accessible.`);
    }

    console.log(`Starting multi-part upload for ${itemName} to bucket: 
      ${bucketName}`);
    return this.cos.createMultipartUpload({
      Bucket: bucketName,
      Key: itemName,
    }).promise()
        .then((data) => {
          uploadID = data.UploadId;

          // begin the file upload
          fs.readFile(filePath, (e, fileData) => {
          // min 5MB part
            const partSize = 1024 * 1024 * 5;
            const partCount = Math.ceil(fileData.length / partSize);

            async.timesSeries(partCount, (partNum, next) => {
              const start = partNum * partSize;
              const end = Math.min(start + partSize, fileData.length);

              partNum++;

              console.log(`Uploading to ${itemName} (part ${partNum} of 
                ${partCount})`);

              this.cos.uploadPart({
                Body: fileData.slice(start, end),
                Bucket: bucketName,
                Key: itemName,
                PartNumber: partNum,
                UploadId: uploadID,
              }).promise()
                  .then((data) => {
                    next(e, {ETag: data.ETag, PartNumber: partNum});
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
                  Parts: dataPacks,
                },
                UploadId: uploadID,
              }).promise()
                  .then(console.log(`Upload of all ${partCount} parts of
                    ${itemName} successful.`))
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

  /**
   * Deletes multiple files from the bucket
   * @param {array<string>} filenames - An array of file keys to delete
   */
  async deleteItems(filenames) {
    const deleteRequest = {'Objects': []};
    for (let i = 0; i < filenames.length; i++) {
      deleteRequest.Objects.push({'Key': filenames[i]});
    }
    console.log();

    return this.cos.deleteObjects({
      Bucket: bucketName,
      Delete: deleteRequest,
    }).promise()
        .then((data) => {
          console.log(`Deleted items for ${bucketName}`);
          console.log(data.Deleted);
        })
        .catch((e) => {
          console.log(`ERROR: ${e.code} - ${e.message}\n`);
        });
  }
}

module.exports = Cloud;
