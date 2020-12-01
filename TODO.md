# Critical

### Very critical
* the entire content section below

### Little bit critical
* Merge report and edittags pages, rename them to picInfo or something and make it work with webms, and add next/previous buttons and edit history for admins
* generate descriptions for pics (markov chain/random adjective-noun from bag)
    
# Content
* faq
* 10 blog posts of at least 300 words for ads lmao wtf
* ChanScanner picks the longest reply chain from each thread and puts it as the blog post body with some nice formatting.

# Frontend 
* Nicer frontend for the whole blog system
* Login frontend needs to show invalid login message instead of just reloading
* Tell the user when registering when the username is already in use
* Tag and description field for picture uploads
* Diagram explaining how zip file tagging works
* Upload page nicer frontend
* Disable register and change password button on empty fields
* pages for /tag
    
# New Features
* User leaderboards
* Allow the user to view previous pics (like a history feature underneath the control buttons in the frontpage, similar to what amazon does with last viewed products)
* Points on edit pic info - awarded once per picture, after moderation. Limit edits/day/week
* Allow user to see pics without tags
* Add/edit tags form admin page
* Admin page with buttons for all the hardcore api calls (update archive, delete all pics etc) - section to list all users with point controls (add/remove points/make admin/delete) 
* Comments

# Money
* Ads - native recommendataion every N votes (like tinder does)
* Twitter account header image (the thubnails page or a collage of best N pics)
* Marketing on 4chin and twittr
* Donate button
* limit cos requests (like caching) because free plan will hit cap easy (check heroku transfer caps etc - 500MB storage limit tho)

# Ideas
* Voting bar chart when showing scores
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
* heroku Server cannot make thumbnails for some jpg files?


# Security
* Check for SQL/html/xss injection