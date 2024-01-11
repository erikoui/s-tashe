/**
 *  @fileOverview Helper to connect to the cloud storage.
 *
 *  @author       erikoui
 *
 *  @requires     NPM:ibm-cos-sdk
 */

// const myCOS = require('ibm-cos-sdk');
// const async = require('async');
const fs = require('fs');
const path = require('path');

// const bucketName = process.env.COS_BUCKETNAME;
const storagePath = './public/Data/';

/**
 * Interface between this app and the cloud server (IBM COS)
 * @class
 */
class Cloud {
  /**
   * Sets up the api keys and passwords, and then connects to the cloud.
   * @constructor
   */
  constructor() {
    // this.cos = new myCOS.S3({
    //   endpoint: process.env.COS_ENDPOINT,
    //   apiKeyId: process.env.COS_APIKEY,
    //   ibmAuthEndpoint: process.env.COS_AUTH_ENDPOINT,
    //   serviceInstanceId: process.env.COS_SERVICEINSTANCE,
    //   cos_hmac_keys: {
    //     access_key_id: process.env.COS_ACCESS_KEY_ID,
    //     secret_access_key: process.env.COS_SECRET_ACCESS_KEY,
    //   },
    // });

    // create folders locally
    function ensureFolderExists(path) {
      try {
        if (!fs.existsSync(path)) {
          fs.mkdirSync(path);
        }
      } catch (error) {
        console.error(`Failed to create data folder at path "${path}".`);
      }
    }

    ensureFolderExists(storagePath);
  }

  /**
   * Returns a promise of a list of all files in the bucket specified by
   * the COS_BUCKETNAME environment variable.
   */
  async getBucketContents() {
    console.log(`Retrieving bucket contents from: ${bucketName}`);

    const files = [];
    const items = fs.readdirSync(directoryPath);

    for (let item of items) {
      if (item.isFile()) {
        files.push(item.name);
      }
    }
    console.log(files)
    return files;
  }

  /**
   * Returns a promise of a readstream
   * @param {string} itemName - The cloud filename (aka Key)
   */
  async getObjectReadStream(itemName) {
    console.log('Getting object');
    return fs.createReadStream(path.join(storagePath, itemName))
  }

  /**
   * Uploads a single file to the cloud
   * @param {string} itemName - The cloud filename (aka Key)
   * @param {string} filePath - The local absolute file path
   */
  async simpleUpload(itemName, filePath) {
    console.log('Starting upload of ' + itemName);
    try {
      fs.copyFileSync(filePath, path.join(storagePath, itemName));
      console.log('file ' + itemName + ' uplaoded.');
    }
    catch (err) {
      console.error('error in simpleupload: ' + err);
      throw err;
    }
  }


  /**
   * Deletes multiple files from the bucket
   * @param {array<string>} filenames - An array of file keys to delete
   */
  async deleteItems(filenames) {
    for (let i = 0; i < filenames.length; i++) {
      try {
        if (fs.existsSync(path.join(storagePath, filenames[i]))) {
          fs.unlinkSync(path.join(storagePath, filenames[i]));
        } else {
          console.log(`The file "${path.join(storagePath, filenames[i])}" does not exist.`);
        }
      } catch (e) {
        console.log(`ERROR in cos.js/deleteItems: ${e.code} - ${e.message}\n`);
      }
    }
  }
}

module.exports = Cloud;
