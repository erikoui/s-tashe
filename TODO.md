# Critical
    moderation for pic uploads & upload link
    *image thumbnails and better css in /tag endpoint (also archive link in front page) - sort by score, auto min votes
    merge report and edittags, rename to picInfo or something
    *chinScanner output to special admin page (not realtime) via saving a file on cloud or db
    twitter and discord buttons
    *give feedback to user when voting so that they feel they are actually doing something (tell them the ranking change of the pic or the new score)
    add tags form admin page
    refresh page after 10 votes for new ads
    limit cos requests (like caching) because free plan will hit cap easy (check heroku transfer caps etc - 500MB storage limit tho)
    ****BLOG SYSTEM
    terms of service
    faq
    privacy policy
    img alts 
    10 blog posts of at least 300 words for ads lmao wtf
    generate descriptions for pics (markov chain/random adjective-noun from bag)

# New Features

## Interface
    User leaderboards
    allow the user to view previous pics (like a history feature)
    nicer login front end (invalid login message or similar)
    tag field for uploaded pictures
    diagram explaining how zip file tagging works
    update archive button for admin
    comments

    
## Operational
    points on edid pic info - awarded once per picture, after moderation.
    enable/disable tags for scanning
    vote on the tags to classify the images?
    allow user to see pics without tags

## money
    ads - native reccomnendataion every 10 votes
    twitter account header image (thubnails page)
    matketing on 4chin and twittr


# Nice-to-haves
    dark theme
    Tell the user when registering when the username is already in use
    progress for the downloader script
    upload page css
    suggest tag feature
    cleanup what ejs does and what frontend javascript does(right now both add elements to the page conditionally)
    replace all ejs with api calls
    save favorites (user favorite pics button)

# Bugs
    sometimes tag leaderboard fails to load
    user can just call the /vote api using external tools. block this somehow - limit votes per day/week
    disable register and change password button on empty fields

# Don't forget
    Check for SQL/html injection