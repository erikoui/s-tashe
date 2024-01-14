# Critical

### Very critical
* refactor index-frontend to work each image separately
* put the change tag buttons on front page too
* sort archive by date

# Frontend 
* Tell the user when registering when the username is already in use
* Disable register and change password button on empty fields
* make thumbnails for webm
    
# New Features
* Allow the user to view previous pics (like a history feature underneath the control buttons in the frontpage, similar to what amazon does with last viewed products)

# Bugs
* cannot make thumbnails for some jpg files?

# Security
* Check for SQL/html/xss injection
* user can just call the /vote api using external tools. block this somehow - limit votes per day/week
* probably full of holes