# s-tashe
The website where we stash some pics. Also we rate them. Also we tag them. Also we may be using incognito mode.

## Credits
Special thanks to antoniouaa, nuclearace, vitaly-t and stackoverflow for the help.


## The idea
ok so the site archives images from 4chan, and tags them using some keywords from the thread title. the site's users can vote on the tags to classify the images. users can also browse by tag, which also allows them to rate pictures by comparing two random ones. the more people rate, the higher their rank, which gives them more power, e.g. editing metadata, weighted rating and even uploading pictures, similar to stackoverflow or newgrounds. images are rated by votes/views system, until some better alternative is found.

## Installation
### Requirements
* `nodejs >= 10`
* Access to a postgresql database
* IBM cloud object storage account and a bucket
  * note: the bucket is like a folder on the ibm cos, not a literal bucket
* A literal bucket for when you see the code

### Setup
* Setup the requirements
* Clone the repo
* `npm install`
* Load the following environment variables: 
  * `DATABASE_URL=<your postgres database url>`
  _The URL looks like:_ `postgres://<domain>/<something>`

  * `COS_APIKEY=<your ibm cos "apikey">`
  _This can be found in your COS page, service credentials tab._

  * `COS_ENDPOINT=<the bucket public endpoint url>`
  _This can be found in the IBM COS page->Buckets->Configuration->public. If you append a filename to the end of this, (`/cba7a8b8c9ab9.jpg`) this becomes the img src_

  * `COS_AUTH_ENDPOINT=https://iam.cloud.ibm.com/identity/token`

  * `COS_SERVICEINSTANCE=<the bucket's "resource_instance_id"`
  _This is also in the service credentials tab_

  * `COS_BUCKETNAME=<your bucket name>`
  _Also called a Key name_
* `node index.js`
* Open your browser to `localhost:5000`
* Reach out for help if you need to
