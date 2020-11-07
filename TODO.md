# Critical
    make chan-downloader into a module so it can use the global ratelimiter in declutter.

    ->user priviledge levels allow tagging, removing tags, adding descriptions, uploading images, etc. This happens in index.ejs and showImage.ejs
    check if file exists on cloud before uploading (also check database records and add them if missing) - same goes for its database record
    moderation for pic uploads & upload link
    webm support
    image thumbnails and better css in /tag endpoint (also archive link in front page)
    report wrong tag button
    user profile page
    

# New Features

## Interface
    allow the user to view previous pics (like a history feature)
    nicer login front end (invalid login message or similar)
    show a loading message while no pics on screen (maybe showing vote and edit stats)
    tag field for uploaded pictures
    report incorrect tag button
    diagram explaining how zip file tagging works
    

## Operational
    truncate pictures table on /deleteallfiles

## money
    ads - exoclick probably

# Nice-to-haves
    keep track of users selected tag when not logged in (with cookie)
    dark theme
    Tell the user when registering when the username is already in use
    convert chan-downloader to a module
    progress for the downloader script
    upload page css
    suggest tag feature
    move some global functions into declutter (pass cloud and db to the declutter constructor)

# Bugs
    many errors go unnoticed
    rate limiter file uploads because they time out on slow connection - i cannot reproduce this
    https://medium.com/developer-rants/how-to-handle-sessions-properly-in-express-js-with-heroku-c35ea8c0e500

# Don't forget
    Check if the admin role can be spoofed in any way such as setting `req.user.admin=true` explicitly through the request or something
