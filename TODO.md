# Critical

### Very critical
* Ads - native recommendataion every N votes (like tinder does)
* rate limit api calls
* Pages in archive
* thumbnail limiter faster

### Little bit critical
* pages in blog post list
* use number of words to determine good blog posts

# Content
* faq

# Frontend 
* Login frontend needs to show invalid login message instead of just reloading
* Tell the user when registering when the username is already in use
* Tag and description field for picture uploads
* Diagram explaining how zip file tagging works
* Upload page nicer frontend
* Disable register and change password button on empty fields
* declutter.beautifyContent
* report button opens a popup form instead of taking to /image
    
# New Features
* User leaderboards
* Points on edit pic info - awarded once per picture. Limit edits/day/week
* Allow user to see pics without tags
* Add/edit tags form admin page
* Admin page with buttons for all the hardcore api calls (update archive, delete all pics etc) - section to list all users with point controls (add/remove points/make admin/delete) 
* Comments
* sauce field
* Allow the user to view previous pics (like a history feature underneath the control buttons in the frontpage, similar to what amazon does with last viewed products)

# Money

* Twitter account header image (the thubnails page or a collage of best N pics)
* Marketing on 4chin and twittr
* Donate button
* limit cos requests (like caching) because free plan will hit cap easy (check heroku transfer caps etc - 500MB storage limit tho)

# Ideas
* log user votes and ability to remove all of one user's votes??
* Voting bar chart when showing scores
* Multi-word tags
* Vote on the tags to classify the images?
* Refresh page after N votes for new ads
* Moderation for pic uploads & upload link for users
* Dark theme
* Progress for the downloader script
* Suggest tag feature
* Save favorite pics (user favorite pics button)
* generate descriptions for pics (markov chain/random adjective-noun from bag)

# Bugs
* sometimes tag leaderboard fails to load
* user can just call the /vote api using external tools. block this somehow - limit votes per day/week
* heroku Server cannot make thumbnails for some jpg files?
* force update archive causes error 500 but actuallly works?

# Security
* Check for SQL/html/xss injection