# Critical
    ->user priviledge levels allow adding descriptions, uploading images, etc. This happens in index.ejs and showImage.ejs
    moderation for pic uploads & upload link
    webm support
    image thumbnails and better css in /tag endpoint (also archive link in front page)
    user profile page
    make it check more boards
    persistent login
    change every requiredLevel in index.js to a middleware thingy

# New Features

## Interface
    User settings
    User leaderboards
    allow the user to view previous pics (like a history feature)
    nicer login front end (invalid login message or similar)
    show a loading message while no pics on screen (maybe showing vote and edit stats)
    tag field for uploaded pictures
    diagram explaining how zip file tagging works
    

## Operational
    truncate pictures table on /deleteallfiles
    index.js requiredlevels move to declutter as constants

## money
    ads - exoclick probably

# Nice-to-haves
    refactor index.js to have separate api calls (returning json) and html requests (rendering ejs)
    keep track of users selected tag when not logged in (with cookie)
    dark theme
    Tell the user when registering when the username is already in use
    progress for the downloader script
    upload page css
    suggest tag feature
    cleanup what ejs does and what frontend javascript does(right now both add elements to the page conditionally)

# Bugs
    rate limiter file uploads because they time out on slow connection
    https://medium.com/developer-rants/how-to-handle-sessions-properly-in-express-js-with-heroku-c35ea8c0e500

# Don't forget
    Check if the admin role can be spoofed in any way such as setting `req.user.admin=true` explicitly through the request or something
    Check for SQL/html injection