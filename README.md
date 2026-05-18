# Temporarily Removed
* **Productivity page** (`korah-bot/productivity.html`) — sidebar links commented out in all 13 pages with `<!-- PRODUCTIVITY PAGE TEMPORARILY REMOVED - restore when ready to re-enable -->`. The page file itself is intact. To restore: uncomment those lines and add back the nav link: `<a href="[../]productivity.html" class="sidebar-nav-link productivity-link t-btn"><span class="material-icons-round" style="font-size: 1.25rem;">timer</span> <span class="nav-text">Productivity</span></a>`

# Next Updates
* Need to add Google Drive API for document creation
* Need to add "Import from Quizlet" option for study items
* Focus-based learning integration
  * Daily focus check-in
  * Study-tip of the day
  * Suggest practices for boosting focus or calmness
  * Suggest certain study techniques
  * Send user-mood in AI prompt
* PR for `main` onto `deployment`
* web_fetch tool for the most up-to-date indo
* sat_question fetch tool (chatbot to output SAT problems, JSON formatted)

# Potential Updates
* Find API's for AP classes and make a page regarding AP prep.
* Remake korah landing page to be a 3d scroll interative website that explains the app and introduces it (Maybe using figma or something else). When the users enter, everything like dark (but still a bit visible) with "Korah A.I" lightened up and as they keep scrolling, everything listens up and there are 3d very well animated iphone with korah explaining features.
* Add sat question prep on korah app.
* Add user settings in korah app for user experience.
* Add mood based option like "full focus mode" to match how it is in korah and depending on the mood tips and advice or positive things show up for the user.


TIPS FOR DEVELOPMENT SOURCE CONTROL
* You can't use LiveServer to preview your changes. As you go, you're gonna have to make a commit, wait a bit, then check Korah.app. 
* If you make a mistake just use `git reset --hard HEAD~1  \n  git push --force-with-lease origin BRANCH-NAME` and it'll revert the branch to what it was before your last commit. The next time you commit, it'll update the website.

You can do any other UI updates you think are fit, but make sure these are done first for release. 
