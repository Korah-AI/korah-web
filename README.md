<h1>Korah, the Modern Tutor. </h1>

# Korah-bot Prerelease Todo List (from oscar)
* Right before release, fix the redirect paths (marked with todo comments)
* Pro tip alerts: Maybe update the styling and where it pops up, etc
* Add the About to `landingpage.html`
* Switch blog to social media and link the instagram page
* Add mood-based (mood is just focus) learning features into 'korah-bot' (this should kinda be a beta version, very experimental.)
  * Daily focus check-in
  * Study-tip of the day
  * Suggest practices for boosting focus or calmness
  * Suggest certain study techniques
  * Send user-mood in AI prompt
  * Mood should NOT have its own page. You could maybe implement it into `productivity.html`
  * Honestly implement it in any creative ways you think are good
* Replace the typing animation for text streaming from the ai in `index.html` with a Gemini-like skeleton loading like response (kind of like when you Google something and the AI response loads in)
* IF YOU WANT, after you're done all of this, safely implement all of Bronson's changes on `main` with your new changes, but make sure you do this safely on a new branch. I haven't even looked at the changes lol so if they're good just take pics and show me. If not, there's no need to implement them.

# Korah Web Todo List (Jayden's | Things I think That Work/fit or need to be worked on)

* About Korah Link (Make About Korah Page or find somewhere to link to) Lines 853-856
* Social Media Link 

# Korah-bot Todo list (Jayden's)

* Check out creating study item css and check all css and improve.
* Check out using study items to see if there are any flaws.
* Make sure that documents side bar doesn't overlap normal side bar when window is minimized and sidebars are opened.
* Make sure users can see all recent chats and be able to delete all of them.
* ^^ Same with recent study items


# Korah-bot Support.html
* About Korah Link (Make About Korah Page or find somewhere to link to) Lines 285-286
* Social Media Link 




STEPS TO FOLLOW
* You can't use LiveServer to preview your changes. As you go, you're gonna have to make a commit, wait a bit, then check Korah.app. 
* If you make a mistake just use `git reset --hard HEAD~1  \n  git push --force-with-lease origin BRANCH-NAME` and it'll revert the branch to what it was before your last commit. The next time you commit, it'll update the website.

You can do any other UI updates you think are fit, but make sure these are done first for release. 
