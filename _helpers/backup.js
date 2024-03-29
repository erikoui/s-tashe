
/**
 *  @fileOverview Helper to backup files from the cloud storage.
 *
 *  @author       erikoui
 *
 */

const archiver = require('archiver');
const fs = require('fs');
const fetch = require('node-fetch');
/**
  * Backups from the ibm server
  * @class
  */
class Backup {
  /**
    * constructs
    * @constructor
    * @param {Declutter} decl - an instance of the declutter as loaded in index
    * @param {db} database - an instance of the db as loaded in index
    * @param {Cloud} cos - an instance of the cloud as loaded in index
    */
  constructor(decl, database, cos) {
    this.declutter=decl;
    this.cloud=cos;
    this.db=database;
  }

  /**
    * Returns a promise of a zip file
    * @param {integer} tagId - tag id
    * @param {string} destination - where to save the zip file
    * @param {string} prefixURL - cloud storage link prefix
    *
    * @return {string} path to the zip file
    * works only locally cuz 500mb limit on heroku - no need to make it send a
    * download response
    */
  async download(tagId, destination, prefixURL) {
    // TODO: cleanup some variables and console.log
    console.log('In the zip file function');
    const allFileLinks=[];
    console.log('loading query');
    const rawData=await this.db.pictures.getAllByTagId(tagId);
    for (let i=0; i<rawData.length; i++) {
      // eslint-disable-next-line max-len
      allFileLinks.push({name: rawData[i].filename, source: prefixURL+rawData[i].filename});
    }

    const archive = archiver('zip', {
      zlib: {level: 9}, // Sets the compression level.
    });

    archive.on('error', function(err) {
      throw err;
    });

    const output = fs.createWriteStream(__dirname + `/${destination}.zip`);
    archive.pipe(output);

    for (let i=0; i<allFileLinks.length; i++) {
      const name = allFileLinks[i].name;
      console.log('loop number', i, '/', allFileLinks.length);
      const sourceFile = allFileLinks[i].source;
      console.log(sourceFile, name);
      const remoteFile = await this.cloud.getObjectReadStream(name);
      const readFile = remoteFile;
      await archive.append(readFile, {name: name});
      readFile
          .on('error', function(err) {
            console.log(err);
          })
          .on('response', function(response) {
            console.log('writing file', name);
          })
          .on('end', function() {
            console.log('file downloaded', i, '/', allFileLinks.length, name);
            // The file is fully downloaded.
          });
    }

    archive.finalize();
    return destination;
  }

  /**
    * Downloads a tag directly to the server
    * @param {integer} tagId - tag id
    * @param {string} destination - where to save the zip file
    * @param {string} prefixURL - cloud storage link prefix
    *
    * @return {string} path to the zip file
    * works only locally cuz 500mb limit on heroku - no need to make it send a
    * download response
    */
  async dlPics(tagId, destination, prefixURL) {
    return;// remove this when running locally
    console.log('In the download files function');
    const allFileLinks=[];
    console.log('loading query');
    const rawData=await this.db.pictures.getAllByTagId(tagId);

    // get existing files
    const existingFiles=fs.readdirSync(
        `${__dirname}/${destination}`, {withFileTypes: true},
    ).filter((item) => !item.isDirectory())
        .map((item) => item.name);

    let c=0;
    for (let i=0; i<rawData.length; i++) {
      // if filename i is not in existingfiles, add it to the list.
      if (!existingFiles.includes(rawData[i].filename)) {
        allFileLinks.push({
          name: rawData[i].filename,
          source: prefixURL+rawData[i].filename,
          index: c,
        });
        c++;
      }
    }
    console.log(`${allFileLinks.length} images to download.`);
    allFileLinks.map((file) => {
      fetch(file.source).then((response) => {
        new Promise((resolve, reject) => {
          // eslint-disable-next-line max-len
          console.log('Downloading ' +file.source +' ('+file.index+'/'+allFileLinks.length+')');
          const ws=fs.createWriteStream(
              `${__dirname}/${destination}/${file.name}`,
          );
          response.body.pipe(ws);
          response.body.on('end', () => resolve('Downloaded '+file.name));
          ws.on('error', reject);
        });
      }).then((x) => console.log(x));
    });
  }
}


module.exports = Backup;
