# Critical
    check if file exists on cloud before uploading (also check database records and add them if missing) - same goes for its database record
    user priviledge levels allow tagging, removing tags, adding descriptions, uploading images, etc. This happens in index.ejs and showImage.ejs
    moderation for pic uploads
    Put things in the side panel

# New Features

## Interface
    allow the user to view previous pics (like a history feature)
    nicer login front end (invalid login message or similar)
    show a loading message while no pics on screen (maybe showing vote and edit stats)
    image thumbnails and better css in /tag endpoint
    tag field for uploaded pictures
    report incorrect tag button
    diagram explaining how zip file tagging works

## Operational
    automaticaly download threads with 150 images
    automatically download threads from /s/
    truncate pictures table on /deleteallfiles

## money
    ads

# Nice-to-haves
    dark theme
    Tell the user when registering when the username is already in use
    convert chan-downloader to a module
    progress for the downloader script
    upload page css
    move some global functions into declutter (pass cloud and db to the declutter constructor)

# Bugs
    many errors go unnoticed
    rate limiter file uploads because they time out on slow connection - i cannot reproduce this
    https://medium.com/developer-rants/how-to-handle-sessions-properly-in-express-js-with-heroku-c35ea8c0e500

# Don't forget
    Check if the admin role can be spoofed in any way such as setting `req.user.admin=true` explicitly through the request or something
