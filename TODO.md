# Critical
Load images based by tag - Save image thumbnails (500px) and load those as a gallery, clicking leads to the /showimage endpoint
upload zip

# New Features
allow the user to view previous pics (like a history feature)
nicer login front end (invalid login message or similar)
user priviledge levels allow tagging, removing tags, adding descriptions, uploading images, etc. This happens in index.ejs and showImage.ejs
automaticaly download threads with 150 images
automatically download threads from /s/
show a loading message while no pics on screen (maybe showing vote and edit stats)
ads
moderation for pic uploads
report incorrect tag button
better scoring for leaderboard (currently just sorts by votes instead of score) - minimum vote requirement

# Nice-to-haves
dark theme
Tell the user when registering when the username is already in use
convert chan-downloader to a module
progress for the downloader script
check if file exists on cloud before uploading (also check database records and add them if missing) - same goes for its database record
upload page css
move some global functions into declutter (pass cloud and db to the declutter constructor)

# Bugs
many errors go unnoticed
rate limiter file uploads because they time out on slow connection - i cannot reproduce this
https://medium.com/developer-rants/how-to-handle-sessions-properly-in-express-js-with-heroku-c35ea8c0e500

# Don't forget
Check if the admin role can be spoofed in any way such as setting `req.user.admin=true` explicitly through the request or something
