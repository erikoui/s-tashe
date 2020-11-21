# Critical

### Very critical
* give feedback to user when voting so that they feel they are actually doing something (tell them the ranking change of the pic or the new score)
* image thumbnails and better css in /tag endpoint (also archive link in front page) - sort by score, auto min votes

### Little bit critical
* chinScanner output to special admin page (not realtime) via saving a file on cloud or db
* limit cos requests (like caching) because free plan will hit cap easy (check heroku transfer caps etc - 500MB storage limit tho)
* generate descriptions for pics (markov chain/random adjective-noun from bag)
    
# Content
* terms of service
* faq
* privacy policy
* 10 blog posts of at least 300 words for ads lmao wtf

# Frontend 
* Nicer frontend for the whole blog system
* Merge report and edittags pages, rename them to picInfo or something
* Login frontend needs to show invalid login message instead of just reloading
* Tell the user when registering when the username is already in use
* Tag and description field for picture uploads
* Diagram explaining how zip file tagging works
* Upload page nicer frontend
* Disable register and change password button on empty fields
    
# New Features
* User leaderboards
* Allow the user to view previous pics (like a history feature underneath the control buttons in the frontpage, similar to what amazon does with last viewed products)
* Points on edit pic info - awarded once per picture, after moderation. Limit edits/day/week
* Allow user to see pics without tags
* Add/edit tags form admin page
* Admin page with buttons for all the hardcore api calls (update archive, delete all pics etc)
* Comments

# Money
* Ads - native recommendataion every N votes (like tinder does)
* Twitter account header image (the thubnails page or a collage of best N pics)
* Marketing on 4chin and twittr
* Donate button

# Ideas
* Multi-word tags
* Vote on the tags to classify the images?
* Refresh page after N votes for new ads
* Moderation for pic uploads & upload link for users
* Dark theme
* Progress for the downloader script
* Suggest tag feature
* Save favorite pics (user favorite pics button)

# Bugs
* sometimes tag leaderboard fails to load
* user can just call the /vote api using external tools. block this somehow - limit votes per day/week


# Security
* Check for SQL/html/xss injection