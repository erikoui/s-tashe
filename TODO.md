# Critical
    ->user priviledge levels allow adding descriptions, etc. This happens in index.ejs and showImage.ejs
    moderation for pic uploads & upload link
    image thumbnails and better css in /tag endpoint (also archive link in front page)
    archive link in navbar

# New Features

## Interface
    User leaderboards
    allow the user to view previous pics (like a history feature)
    nicer login front end (invalid login message or similar)
    tag field for uploaded pictures
    diagram explaining how zip file tagging works
    
## Operational

## money
    ads - exoclick probably

# Nice-to-haves
    keep track of users selected tag when not logged in (with cookie)
    dark theme
    Tell the user when registering when the username is already in use
    progress for the downloader script
    upload page css
    suggest tag feature
    cleanup what ejs does and what frontend javascript does(right now both add elements to the page conditionally)
    replace all ejs with api calls

# Bugs
    rate limiter file uploads because they time out on slow connection
    user can just call the /vote api using external tools. block this somehow
    disable register and change password button on empty fields

# Don't forget
    Check for SQL/html injection