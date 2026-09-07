# Practice Test Logic Spec

## These files provide context
- korah-bot/docs/practice-tests/scoring-sat-practice-test-4-digital.pdf
- korah-bot/sat/questions.html
  - the "player" that displays the visual content on the page, you will create a practice test section very similar to that of the rest of the sections included with a redirect to a separate page
- korah-bot/sat/js/sat-player.js
  - the script that serves as a backend for question rendering which you will take inspiration from
- korah-bot/sat/js/sat-shared.js
- korah-bot/sat/js/sat-rush.js and korah-bot/sat/rush.html
- korah-bot/sat/js/sat-analytics.js
## Arbitrary file structure:



### This will display the visual content of the page.
#### Top Bar features and visuals
- Include a module indicator (whether you are taking the reading and writing section or the math section, and indicating whether or not you are in module 1 or module 2)

- Include a timer on the top of the page that resets depending on the module of the exam (Reading and Writing will have two 39 minute modules, Math will have two 43 minute modules.)
- The top bar should include a dropdown menu that includes a reference sheet (simply a png or svg) as well as accessibility options, the option to exit the test entirely (in which case the timer would be frozen at whatever state it is in and saved with the rest of the user’s data and the progress of the test would be saved), and an option to create an unscheduled break (the timer will not stop if the break is not meant to happen, more on this later)
#### Bottom Bar features and visuals
- The bottom bar will feature your full name on one side and a menu for viewing questions answered.


#### This will handle any API calls (like to the Vercel Backend) to save the time and test progress to a database, as well as displaying SVGs for every math problem, and switching the visibility of specific divs like “results” and specific modules depending on specific conditions.

- The menu I mentioned for questions answered should be a popup that, when clicked, should highlight and enumerate every question that has been answered thus far, and clearly show what questions have not yet been answered. It should also show what questions have been marked for review, remember you must provide a count for questions in each of these categories.
- There should be a “Review Page” that can be made visible by the script in two ways, by finishing the module obviously, or by clicking a button labeled “Review Page” within the popup menu that labels the questions
- There should be divs for each subject, subdivs for every module, and a div that separates the results page, all activated in their visibility by the PTWindow.js Script.
- VERY IMPORTANT: Do NOT allow users to go back to modules they have already completed, this can be through a state machine that tracks their progress. 
  - For example, if math module 1 has been completed (give the user the option to select next and move on to the next module but NEVER the previous one) or the timer has run out, the next module would be made visible. 
  - Once module 2 of a subject (RW or MATH) is completed do not let them switch subjects, the one-way timeline goes: Reading and Writing Mod 1 -> Reading and Writing Mod 2 -> Math Mod 1 -> Math Mod 2 -> Exit Test
  - IMPORTANT: There should be a 10 minute break period separating the two subjects that can be skipped through a "resume testing now" button
  - Do not start the next subject until the student selects resume testing after the timer is complete, it is simply for time management purposes.
  - Remember, there should be review pages at the end of every section of the test to check your progress within each module individually.
  - After starting a practice test, there should be a widget in the dashboard that allows them to continue from where they left off (again progress should be saved either through localstorage or firestore depending on the most efficient application) 
  - After finishing a practice test, there should be a widget that displays their most recent performance.
  
# Final Check
#### You will know you are done when a student can successfully enter a practice test, see every GUI element previously mentioned (Review Page, Question progress popup, Reference Sheet, etc.), Move on to the next module and NOT be allowed to travel backwards. While also having a 10 minute break period in-between RW and Math sections of the practice exam.
#### Make sure at the very end you display and save a breakdown of what the student's total score was, (featuring scaled score per section) aswell as their score per subject area.


