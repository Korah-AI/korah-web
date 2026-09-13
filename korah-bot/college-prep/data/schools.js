/**
 * schools.js - Supplemental essay prompts and school values for grading
 */

const SCHOOLS = {
  harvard: {
    name: 'Harvard University',
    prompts: [
      { value: 'Harvard has long recognized the importance of enrolling a diverse student body. How will the life experiences that you bring to our community help the Harvard community?', label: 'Diversity and community contribution' },
      { value: 'Describe a time when you made a meaningful contribution to others in which the greater good was your focus. Discuss the challenges and rewards of making a contribution.', label: 'Meaningful contribution to others' },
      { value: 'Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?', label: 'Questioning or challenging a belief' },
      { value: 'What would you teach a Harvard course on? What would you explore?', label: 'Hypothetical Harvard course' },
      { value: 'Describe an experience that has shaped who you are today and how it influences your view of the future.', label: 'Experience shaping your future view' },
    ],
    values: 'Harvard values intellectual curiosity, leadership, civic engagement, and the ability to make a difference in the world. They seek students who are self-aware, resilient, and committed to using their education for the greater good. They value diverse perspectives and the ability to engage with people from different backgrounds.',
  },
  mit: {
    name: 'MIT',
    prompts: [
      { value: 'Tell us about something you do simply for the fun of it.', label: 'Something you do for fun' },
      { value: 'Tell us about a significant challenge you have faced or something that did not go as expected. How did you manage the situation?', label: 'Managing a challenge' },
      { value: 'Describe the world you come from and how it has shaped your dreams and aspirations.', label: 'Your world and aspirations' },
      { value: 'MIT brings people with diverse passions together and encourages them to collaborate on projects, form new clubs, and pursue their goals. What would you create or build at MIT?', label: 'What you would create at MIT' },
    ],
    values: 'MIT values hands-on problem solving, collaboration, creativity, and the intersection of science and humanities. They seek students who are makers, tinkerers, and collaborative problem-solvers. They value intellectual playfulness, risk-taking, and the ability to work across disciplines. They want students who will contribute to the collaborative spirit of the MIT community.',
  },
  stanford: {
    name: 'Stanford University',
    prompts: [
      { value: 'The Stanford community is deeply curious and driven to learn in and out of the classroom. Reflect on an idea or experience that makes you genuinely excited about learning.', label: 'Genuine excitement about learning' },
      { value: 'Virtually all of Stanford\'s undergraduates live on campus. Write a note to your future roommate that reveals something about you or that will help your roommate get to know you better.', label: 'Note to future roommate' },
      { value: 'Tell us about something that is meaningful to you and why.', label: 'Something meaningful to you' },
      { value: 'What is the most significant challenge that society faces today?', label: 'Significant societal challenge' },
    ],
    values: 'Stanford values intellectual vitality, creative thinking, and leadership with a sense of purpose. They seek students who are self-directed, resilient, and passionate about making a difference. They value the ability to navigate ambiguity, think interdisciplinary, and contribute to a community of diverse thinkers.',
  },
  yale: {
    name: 'Yale University',
    prompts: [
      { value: 'Reflect on a community to which you belong. How has it shaped your perspective?', label: 'Community that shaped you' },
      { value: 'Yale\'s residential colleges regularly host conversations with guests representing a wide range of experiences and perspectives. What person, past or present, would you invite to speak? What would you ask?', label: 'Guest speaker you would invite' },
      { value: 'What is something about you that is not reflected elsewhere in your application?', label: 'Something not reflected elsewhere' },
      { value: 'Reflect on a time you have worked with a team to achieve a shared goal.', label: 'Working with a team' },
    ],
    values: 'Yale values intellectual engagement, community spirit, and a commitment to using education for the public good. They seek students who are curious, collaborative, and committed to making a difference. They value the ability to engage with complex ideas, work with diverse people, and contribute to a vibrant intellectual community.',
  },
  princeton: {
    name: 'Princeton University',
    prompts: [
      { value: 'Tell us about a subject or activity that you find genuinely exciting and explain why.', label: 'Genuinely exciting subject or activity' },
      { value: 'Princeton values community and encourages students to learn from each other\'s perspectives. Describe a time you learned from someone different from you.', label: 'Learning from different perspectives' },
      { value: 'What is a skill or talent you would like to bring to the Princeton community?', label: 'Skill or talent for Princeton' },
      { value: 'Reflect on a time when you had to make a difficult decision and what you learned from it.', label: 'Difficult decision and what you learned' },
    ],
    values: 'Princeton values intellectual depth, community engagement, and service to humanity. They seek students who are deeply curious, committed to learning, and motivated to use their education for the greater good. They value the ability to think deeply, engage with complex problems, and contribute to a community of scholars.',
  },
  duke: {
    name: 'Duke University',
    prompts: [
      { value: 'We believe a wide range of perspectives, beliefs, and lived experiences are essential to making Duke a vibrant and meaningful living and learning community. Feel free to share with us anything in this context that might help us better understand you and what you\'ll bring to our community.', label: 'Perspectives and experiences' },
      { value: 'Tell us about an experience in the past year or two that reflects your imagination, creativity, or intellectual curiosity.', label: 'Recent creative or intellectual experience' },
      { value: 'Duke seeks students who will contribute to its mission of knowledge in service to society. How will you contribute to Duke\'s mission?', label: 'Contributing to Duke\'s mission' },
    ],
    values: 'Duke values intellectual curiosity, leadership, and commitment to service. They seek students who are collaborative, innovative, and committed to making a difference in the world. They value diversity of thought and experience, and the ability to engage with complex issues.',
  },
  columbia: {
    name: 'Columbia University',
    prompts: [
      { value: 'Columbia students take an active role in their community, whether by starting a new club, organizing an event, or simply being a good neighbor. What would you contribute to our community?', label: 'Contributing to Columbia community' },
      { value: 'Please tell us what from your current and past experiences (either academic or personal) draws you to the specific areas of study listed in your application.', label: 'What draws you to your areas of study' },
      { value: 'In the margins of the books you read for class or on your own, what do you write, draw, or design?', label: 'What you write in the margins' },
      { value: 'Why are you interested in attending Columbia University? What aspects of Columbia appeal to you most?', label: 'Why Columbia' },
    ],
    values: 'Columbia values intellectual curiosity, diversity, and the ability to engage with complex ideas. They seek students who are self-directed, collaborative, and committed to making a difference. They value the ability to think critically, engage with diverse perspectives, and contribute to a vibrant intellectual community.',
  },
  upenn: {
    name: 'University of Pennsylvania',
    prompts: [
      { value: 'How will you explore your intellectual and academic interests at the University of Pennsylvania?', label: 'Exploring intellectual interests at Penn' },
      { value: 'Penn has a tradition of crossing disciplines. Describe a cross-disciplinary experience that has shaped your worldview.', label: 'Cross-disciplinary experience' },
      { value: 'At Penn, you will find a community of diverse perspectives and experiences. How will you contribute to this community?', label: 'Contributing to Penn community' },
    ],
    values: 'Penn values practical knowledge, interdisciplinary thinking, and the ability to apply learning to real-world problems. They seek students who are innovative, collaborative, and committed to making a difference. They value the ability to think across disciplines, engage with diverse perspectives, and contribute to a community of changemakers.',
  },
  caltech: {
    name: 'Caltech',
    prompts: [
      { value: 'Tell us about a time when you collaborated with others to solve a problem.', label: 'Collaborative problem solving' },
      { value: 'The empirical nature of science and engineering at Caltech requires that our students engage with the world beyond campus. Describe a time when you used science or engineering to solve a real-world problem.', label: 'Using science to solve real-world problems' },
      { value: 'Caltech students are known for their intellectual curiosity and playful nature. Describe a topic or idea that excites you.', label: 'Topic that excites you' },
    ],
    values: 'Caltech values scientific curiosity, rigorous thinking, and the ability to solve complex problems. They seek students who are collaborative, innovative, and committed to advancing human knowledge. They value the ability to think deeply, work with precision, and contribute to the scientific community.',
  },
  brown: {
    name: 'Brown University',
    prompts: [
      { value: 'Brown\'s Open Curriculum allows students to explore broadly while also diving deeply into their academic interests. What would you choose to study and why?', label: 'What you would study at Brown' },
      { value: 'Tell us about a community you belong to and your role within it.', label: 'Your role in a community' },
      { value: 'What is the most significant challenge that you have faced, and how did you overcome it?', label: 'Significant challenge and how you overcame it' },
    ],
    values: 'Brown values intellectual independence, creative thinking, and the ability to navigate ambiguity. They seek students who are self-directed, collaborative, and committed to making a difference. They value the ability to think across disciplines, engage with diverse perspectives, and contribute to a community of independent thinkers.',
  },
  dartmouth: {
    name: 'Dartmouth College',
    prompts: [
      { value: 'Dartmouth celebrates the ways in which its profound sense of place informs its character and values. How has Dartmouth\'s place in the world shaped who you are?', label: 'Dartmouth\'s place in shaping you' },
      { value: 'Tell us about a time you made a meaningful contribution to your community.', label: 'Meaningful community contribution' },
      { value: 'What aspect of your identity or background do you feel is underrepresented in higher education, and how would it contribute to the Dartmouth community?', label: 'Underrepresented aspect of your identity' },
    ],
    values: 'Dartmouth values intellectual curiosity, community spirit, and a commitment to the common good. They seek students who are collaborative, resilient, and committed to making a difference. They value the ability to engage with complex ideas, work with diverse people, and contribute to a close-knit community.',
  },
  northwestern: {
    name: 'Northwestern University',
    prompts: [
      { value: 'What is the hardest part of being a teenager now? What advice would you give a younger sibling or friend?', label: 'Hardest part of being a teenager' },
      { value: 'Northwestern has a strong tradition of blending the arts, humanities, and sciences. How would you take advantage of this interdisciplinary approach?', label: 'Interdisciplinary approach' },
      { value: 'Tell us about a time when you had to make a difficult choice between two options.', label: 'Difficult choice between two options' },
    ],
    values: 'Northwestern values interdisciplinary thinking, creativity, and the ability to work across boundaries. They seek students who are innovative, collaborative, and committed to making a difference. They value the ability to think creatively, engage with diverse perspectives, and contribute to a vibrant community.',
  },
  georgetown: {
    name: 'Georgetown University',
    prompts: [
      { value: 'Georgetown\'s commitment to a Jesuit education asks students to examine their faith, values, and ideals. Reflect on a time when you questioned or challenged a belief or idea.', label: 'Questioning or challenging a belief' },
      { value: 'Describe a significant issue or problem you would like to address through your work or studies.', label: 'Significant issue you would like to address' },
      { value: 'What does it mean to you to be a member of a community? How will your experiences contribute to the Georgetown community?', label: 'Being a member of a community' },
    ],
    values: 'Georgetown values intellectual curiosity, social justice, and a commitment to service. They seek students who are self-aware, reflective, and committed to making a difference in the world. They value the ability to engage with complex moral and ethical issues, work with diverse people, and contribute to a community of principled leaders.',
  },
  vanderbilt: {
    name: 'Vanderbilt University',
    prompts: [
      { value: 'Vanderbilt believes the most meaningful learning occurs when students are challenged and their beliefs are questioned. Describe a time when you were challenged or your beliefs were questioned.', label: 'Time you were challenged' },
      { value: 'Share a meaningful experience that has shaped who you are today.', label: 'Experience that shaped you' },
      { value: 'Vanderbilt is a community that values collaboration and teamwork. Describe a time when you worked with others to achieve a common goal.', label: 'Collaborative achievement' },
    ],
    values: 'Vanderbilt values academic excellence, collaboration, and a commitment to service. They seek students who are intellectually curious, resilient, and committed to making a difference. They value the ability to engage with complex ideas, work with diverse people, and contribute to a close-knit community.',
  },
  notre dame: {
    name: 'University of Notre Dame',
    prompts: [
      { value: 'What is one thing you want the Notre Dame admissions committee to know about you?', label: 'What you want Notre Dame to know' },
      { value: 'Notre Dame values its Catholic intellectual tradition. How has your faith or spiritual life shaped who you are?', label: 'Faith and spiritual life' },
      { value: 'Describe a time when you made a meaningful contribution to your community.', label: 'Meaningful community contribution' },
    ],
    values: 'Notre Dame values intellectual rigor, moral character, and a commitment to the common good. They seek students who are self-aware, reflective, and committed to making a difference in the world. They value the ability to engage with complex moral and ethical issues, work with diverse people, and contribute to a community of principled leaders.',
  },
  washu: {
    name: 'Washington University in St. Louis',
    prompts: [
      { value: 'Describe a significant challenge you have faced and how you overcame it.', label: 'Significant challenge and how you overcame it' },
      { value: 'WashU values diversity and inclusion. How will your experiences contribute to our community?', label: 'Contributing to diversity and inclusion' },
      { value: 'What excites you most about attending WashU?', label: 'What excites you about WashU' },
    ],
    values: 'WashU values intellectual curiosity, collaboration, and a commitment to making a difference. They seek students who are innovative, resilient, and committed to contributing to a diverse and inclusive community. They value the ability to think across disciplines, engage with diverse perspectives, and contribute to a vibrant intellectual community.',
  },
  rice: {
    name: 'Rice University',
    prompts: [
      { value: 'Rice University values the diversity of its student body. How will your unique background and experiences contribute to the Rice community?', label: 'Unique background contributing to Rice' },
      { value: 'Describe a time when you had to think outside the box to solve a problem.', label: 'Thinking outside the box' },
      { value: 'What is the most meaningful community you belong to, and how has it shaped you?', label: 'Meaningful community that shaped you' },
    ],
    values: 'Rice values intellectual curiosity, innovation, and a commitment to making a difference. They seek students who are collaborative, creative, and committed to contributing to a diverse and inclusive community. They value the ability to think across disciplines, engage with diverse perspectives, and contribute to a close-knit residential community.',
  },
  emory: {
    name: 'Emory University',
    prompts: [
      { value: 'Which book, song, or piece of art has had the most profound impact on you and why?', label: 'Book, song, or art with profound impact' },
      { value: 'Describe a significant challenge you have faced and what you learned from it.', label: 'Significant challenge and what you learned' },
      { value: 'How will your experiences contribute to the Emory community?', label: 'Contributing to Emory community' },
    ],
    values: 'Emory values intellectual curiosity, collaboration, and a commitment to service. They seek students who are self-aware, reflective, and committed to making a difference. They value the ability to engage with complex ideas, work with diverse people, and contribute to a community of scholars.',
  },
  georgetown_college: {
    name: 'Georgetown College',
    prompts: [
      { value: 'As Georgetown is a Jesuit university, we value the whole person. How have your faith, values, or moral principles shaped who you are?', label: 'Faith, values, and moral principles' },
      { value: 'Describe a time when you questioned or challenged a belief or idea.', label: 'Questioning or challenging a belief' },
      { value: 'What does it mean to you to be a member of a community? How will your experiences contribute to the Georgetown community?', label: 'Being a member of a community' },
    ],
    values: 'Georgetown College values intellectual curiosity, moral character, and a commitment to social justice. They seek students who are self-aware, reflective, and committed to making a difference in the world. They value the ability to engage with complex moral and ethical issues, work with diverse people, and contribute to a community of principled leaders.',
  },
  boston_college: {
    name: 'Boston College',
    prompts: [
      { value: 'Boston College is committed to the ideals of the Jesuit tradition. How will your education at BC help you become a person for others?', label: 'Becoming a person for others' },
      { value: 'Describe a time when you made a meaningful contribution to your community.', label: 'Meaningful community contribution' },
      { value: 'What is one thing you want the BC admissions committee to know about you?', label: 'What you want BC to know' },
    ],
    values: 'Boston College values intellectual rigor, moral character, and a commitment to service. They seek students who are self-aware, reflective, and committed to making a difference in the world. They value the ability to engage with complex moral and ethical issues, work with diverse people, and contribute to a community of principled leaders.',
  },
  tufts: {
    name: 'Tufts University',
    prompts: [
      { value: 'What makes you happy? Describe the activities, experiences, or ideas that bring you joy.', label: 'What makes you happy' },
      { value: 'Tufts values intellectual curiosity and creative thinking. Describe a time when you had to think creatively to solve a problem.', label: 'Creative problem solving' },
      { value: 'How will your experiences contribute to the Tufts community?', label: 'Contributing to Tufts community' },
    ],
    values: 'Tufts values intellectual curiosity, creative thinking, and active citizenship. They seek students who are innovative, collaborative, and committed to making a difference. They value the ability to think across disciplines, engage with diverse perspectives, and contribute to a vibrant intellectual community.',
  },
  usc: {
    name: 'University of Southern California',
    prompts: [
      { value: 'USC values the unique perspectives that each student brings. How will your background and experiences contribute to our community?', label: 'Unique perspectives contributing to USC' },
      { value: 'Describe a significant challenge you have faced and what you learned from it.', label: 'Significant challenge and what you learned' },
      { value: 'What excites you most about attending USC?', label: 'What excites you about USC' },
    ],
    values: 'USC values innovation, creativity, and global perspective. They seek students who are entrepreneurial, collaborative, and committed to making a difference. They value the ability to think creatively, engage with diverse perspectives, and contribute to a vibrant and diverse community.',
  },
  nyu: {
    name: 'New York University',
    prompts: [
      { value: 'NYU is located in the heart of one of the world\'s most dynamic cities. How will your experiences in New York City contribute to your education?', label: 'Experiences in New York City' },
      { value: 'Describe a time when you had to adapt to a new or challenging situation.', label: 'Adapting to new situations' },
      { value: 'What does it mean to you to be a global citizen? How will your experiences at NYU contribute to this identity?', label: 'Being a global citizen' },
    ],
    values: 'NYU values global perspective, innovation, and the ability to thrive in a dynamic urban environment. They seek students who are adaptable, creative, and committed to making a difference. They value the ability to engage with diverse perspectives, think across disciplines, and contribute to a vibrant global community.',
  },
  uva: {
    name: 'University of Virginia',
    prompts: [
      { value: 'UVA was founded by Thomas Jefferson. How will you contribute to the university\'s mission of developing citizen-leaders?', label: 'Contributing to citizen-leader mission' },
      { value: 'Describe a time when you had to make a difficult decision and what you learned from it.', label: 'Difficult decision and what you learned' },
      { value: 'What is a community you belong to, and how has it shaped who you are?', label: 'Community that shaped you' },
    ],
    values: 'UVA values intellectual curiosity, leadership, and a commitment to public service. They seek students who are self-directed, collaborative, and committed to making a difference. They value the ability to engage with complex ideas, work with diverse people, and contribute to a community of citizen-leaders.',
  },
  michigan: {
    name: 'University of Michigan',
    prompts: [
      { value: 'Everyone belongs to many different communities and/or groups defined by shared geography, religion, ethnicity, income, cuisine, interest, race, ideology, or intellectual heritage. Choose one of the communities to which you belong and describe that community and your place within it.', label: 'Community you belong to' },
      { value: 'Describe the unique qualities that attract you to the specific undergraduate college or school at Michigan.', label: 'Unique qualities of Michigan' },
      { value: 'What is a challenge you have faced and how did you overcome it?', label: 'Challenge and how you overcame it' },
    ],
    values: 'Michigan values intellectual curiosity, leadership, and a commitment to public service. They seek students who are collaborative, innovative, and committed to making a difference. They value the ability to engage with diverse perspectives, think across disciplines, and contribute to a vibrant intellectual community.',
  },
  ucla: {
    name: 'University of California, Los Angeles',
    prompts: [
      { value: 'Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced.', label: 'Educational opportunity or barrier' },
      { value: 'Describe the most significant challenge you have faced and the steps you have taken to overcome this challenge.', label: 'Significant challenge and steps to overcome' },
      { value: 'What have you done to make your school or your community a better place?', label: 'Making your community better' },
    ],
    values: 'UCLA values diversity, innovation, and a commitment to public service. They seek students who are collaborative, creative, and committed to making a difference. They value the ability to engage with diverse perspectives, think across disciplines, and contribute to a vibrant and diverse community.',
  },
  berkeley: {
    name: 'University of California, Berkeley',
    prompts: [
      { value: 'Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced.', label: 'Educational opportunity or barrier' },
      { value: 'Describe the most significant challenge you have faced and the steps you have taken to overcome this challenge.', label: 'Significant challenge and steps to overcome' },
      { value: 'What have you done to make your school or your community a better place?', label: 'Making your community better' },
    ],
    values: 'Berkeley values intellectual curiosity, social justice, and a commitment to public good. They seek students who are innovative, collaborative, and committed to making a difference. They value the ability to engage with diverse perspectives, think across disciplines, and contribute to a vibrant intellectual community.',
  },
  uw_madison: {
    name: 'University of Wisconsin-Madison',
    prompts: [
      { value: 'Tell us why you decided to apply to the University of Wisconsin-Madison.', label: 'Why UW-Madison' },
      { value: 'Tell us about your ability to work with others in a collaborative or cooperative setting.', label: 'Working with others' },
      { value: 'Describe a time when you had to make a difficult decision and what you learned from it.', label: 'Difficult decision and what you learned' },
    ],
    values: 'UW-Madison values intellectual curiosity, collaboration, and a commitment to public service. They seek students who are innovative, resilient, and committed to making a difference. They value the ability to engage with diverse perspectives, think across disciplines, and contribute to a vibrant intellectual community.',
  },
  ut_austin: {
    name: 'University of Texas at Austin',
    prompts: [
      { value: 'Why are you interested in the University of Texas at Austin?', label: 'Why UT Austin' },
      { value: 'Describe a unique aspect of your identity, background, or experience that has shaped who you are.', label: 'Unique aspect of your identity' },
      { value: 'What is a challenge you have faced and how did you overcome it?', label: 'Challenge and how you overcame it' },
    ],
    values: 'UT Austin values innovation, leadership, and a commitment to public service. They seek students who are collaborative, creative, and committed to making a difference. They value the ability to engage with diverse perspectives, think across disciplines, and contribute to a vibrant and diverse community.',
  },
  ohio_state: {
    name: 'Ohio State University',
    prompts: [
      { value: 'Ohio State values the diverse perspectives that each student brings. How will your background and experiences contribute to our community?', label: 'Diverse perspectives contributing to Ohio State' },
      { value: 'Describe a time when you had to work with others to achieve a common goal.', label: 'Working with others for a common goal' },
      { value: 'What is one thing you want the Ohio State admissions committee to know about you?', label: 'What you want Ohio State to know' },
    ],
    values: 'Ohio State values intellectual curiosity, collaboration, and a commitment to public service. They seek students who are innovative, resilient, and committed to making a difference. They value the ability to engage with diverse perspectives, think across disciplines, and contribute to a vibrant intellectual community.',
  },
  penn_state: {
    name: 'Penn State University',
    prompts: [
      { value: 'Penn State values the diverse perspectives that each student brings. How will your background and experiences contribute to our community?', label: 'Diverse perspectives contributing to Penn State' },
      { value: 'Describe a time when you had to adapt to a new or challenging situation.', label: 'Adapting to new situations' },
      { value: 'What is one thing you want the Penn State admissions committee to know about you?', label: 'What you want Penn State to know' },
    ],
    values: 'Penn State values intellectual curiosity, collaboration, and a commitment to public service. They seek students who are innovative, resilient, and committed to making a difference. They value the ability to engage with diverse perspectives, think across disciplines, and contribute to a vibrant intellectual community.',
  },
  purdue: {
    name: 'Purdue University',
    prompts: [
      { value: 'Purdue values innovation and hands-on learning. Describe a time when you had to think creatively to solve a problem.', label: 'Creative problem solving' },
      { value: 'How will your experiences contribute to the Purdue community?', label: 'Contributing to Purdue community' },
      { value: 'What is one thing you want the Purdue admissions committee to know about you?', label: 'What you want Purdue to know' },
    ],
    values: 'Purdue values innovation, hands-on learning, and a commitment to public service. They seek students who are creative, collaborative, and committed to making a difference. They value the ability to think across disciplines, engage with diverse perspectives, and contribute to a vibrant intellectual community.',
  },
  umd: {
    name: 'University of Maryland',
    prompts: [
      { value: 'UMD values the diverse perspectives that each student brings. How will your background and experiences contribute to our community?', label: 'Diverse perspectives contributing to UMD' },
      { value: 'Describe a time when you had to work with others to achieve a common goal.', label: 'Working with others for a common goal' },
      { value: 'What is one thing you want the UMD admissions committee to know about you?', label: 'What you want UMD to know' },
    ],
    values: 'UMD values intellectual curiosity, collaboration, and a commitment to public service. They seek students who are innovative, resilient, and committed to making a difference. They value the ability to engage with diverse perspectives, think across disciplines, and contribute to a vibrant intellectual community.',
  },
  virginia_tech: {
    name: 'Virginia Tech',
    prompts: [
      { value: 'Virginia Tech values hands-on learning and innovation. Describe a time when you had to think creatively to solve a problem.', label: 'Creative problem solving' },
      { value: 'How will your experiences contribute to the Virginia Tech community?', label: 'Contributing to Virginia Tech community' },
      { value: 'What is one thing you want the Virginia Tech admissions committee to know about you?', label: 'What you want Virginia Tech to know' },
    ],
    values: 'Virginia Tech values innovation, hands-on learning, and a commitment to service. They seek students who are creative, collaborative, and committed to making a difference. They value the ability to think across disciplines, engage with diverse perspectives, and contribute to a vibrant intellectual community.',
  },
  william_mary: {
    name: 'College of William & Mary',
    prompts: [
      { value: 'William & Mary values intellectual curiosity and a commitment to service. How will your education at William & Mary help you make a difference in the world?', label: 'Making a difference through William & Mary' },
      { value: 'Describe a time when you questioned or challenged a belief or idea.', label: 'Questioning or challenging a belief' },
      { value: 'What is a community you belong to, and how has it shaped who you are?', label: 'Community that shaped you' },
    ],
    values: 'William & Mary values intellectual curiosity, moral character, and a commitment to service. They seek students who are self-aware, reflective, and committed to making a difference in the world. They value the ability to engage with complex moral and ethical issues, work with diverse people, and contribute to a community of principled leaders.',
  },
  tulane: {
    name: 'Tulane University',
    prompts: [
      { value: 'Tulane values community engagement and service. Describe a time when you made a meaningful contribution to your community.', label: 'Meaningful community contribution' },
      { value: 'What is a challenge you have faced and how did you overcome it?', label: 'Challenge and how you overcame it' },
      { value: 'How will your experiences contribute to the Tulane community?', label: 'Contributing to Tulane community' },
    ],
    values: 'Tulane values intellectual curiosity, community engagement, and a commitment to service. They seek students who are innovative, collaborative, and committed to making a difference. They value the ability to engage with diverse perspectives, think across disciplines, and contribute to a vibrant intellectual community.',
  },
  wake_forest: {
    name: 'Wake Forest University',
    prompts: [
      { value: 'Wake Forest values intellectual curiosity and a commitment to service. How will your education at Wake Forest help you make a difference in the world?', label: 'Making a difference through Wake Forest' },
      { value: 'Describe a time when you had to think creatively to solve a problem.', label: 'Creative problem solving' },
      { value: 'What is a community you belong to, and how has it shaped who you are?', label: 'Community that shaped you' },
    ],
    values: 'Wake Forest values intellectual curiosity, moral character, and a commitment to service. They seek students who are self-aware, reflective, and committed to making a difference in the world. They value the ability to engage with complex moral and ethical issues, work with diverse people, and contribute to a community of principled leaders.',
  },
  unc: {
    name: 'University of North Carolina at Chapel Hill',
    prompts: [
      { value: 'UNC values the diverse perspectives that each student brings. How will your background and experiences contribute to our community?', label: 'Diverse perspectives contributing to UNC' },
      { value: 'Describe a time when you had to work with others to achieve a common goal.', label: 'Working with others for a common goal' },
      { value: 'What is one thing you want the UNC admissions committee to know about you?', label: 'What you want UNC to know' },
    ],
    values: 'UNC values intellectual curiosity, collaboration, and a commitment to public service. They seek students who are innovative, resilient, and committed to making a difference. They value the ability to engage with diverse perspectives, think across disciplines, and contribute to a vibrant intellectual community.',
  },
  georgia_tech: {
    name: 'Georgia Institute of Technology',
    prompts: [
      { value: 'Georgia Tech values innovation and hands-on learning. Describe a time when you had to think creatively to solve a problem.', label: 'Creative problem solving' },
      { value: 'How will your experiences contribute to the Georgia Tech community?', label: 'Contributing to Georgia Tech community' },
      { value: 'What is one thing you want the Georgia Tech admissions committee to know about you?', label: 'What you want Georgia Tech to know' },
    ],
    values: 'Georgia Tech values innovation, hands-on learning, and a commitment to public service. They seek students who are creative, collaborative, and committed to making a difference. They value the ability to think across disciplines, engage with diverse perspectives, and contribute to a vibrant intellectual community.',
  },
  case_western: {
    name: 'Case Western Reserve University',
    prompts: [
      { value: 'Case Western Reserve values innovation and hands-on learning. Describe a time when you had to think creatively to solve a problem.', label: 'Creative problem solving' },
      { value: 'How will your experiences contribute to the Case Western Reserve community?', label: 'Contributing to Case Western Reserve community' },
      { value: 'What is one thing you want the Case Western Reserve admissions committee to know about you?', label: 'What you want Case Western Reserve to know' },
    ],
    values: 'Case Western Reserve values innovation, hands-on learning, and a commitment to public service. They seek students who are creative, collaborative, and committed to making a difference. They value the ability to think across disciplines, engage with diverse perspectives, and contribute to a vibrant intellectual community.',
  },
  lehigh: {
    name: 'Lehigh University',
    prompts: [
      { value: 'Lehigh values innovation and hands-on learning. Describe a time when you had to think creatively to solve a problem.', label: 'Creative problem solving' },
      { value: 'How will your experiences contribute to the Lehigh community?', label: 'Contributing to Lehigh community' },
      { value: 'What is one thing you want the Lehigh admissions committee to know about you?', label: 'What you want Lehigh to know' },
    ],
    values: 'Lehigh values innovation, hands-on learning, and a commitment to public service. They seek students who are creative, collaborative, and committed to making a difference. They value the ability to think across disciplines, engage with diverse perspectives, and contribute to a vibrant intellectual community.',
  },
  northeastern: {
    name: 'Northeastern University',
    prompts: [
      { value: 'Northeastern values experiential learning and a commitment to service. Describe a time when you had to apply your learning to a real-world problem.', label: 'Applying learning to real-world problems' },
      { value: 'How will your experiences contribute to the Northeastern community?', label: 'Contributing to Northeastern community' },
      { value: 'What is one thing you want the Northeastern admissions committee to know about you?', label: 'What you want Northeastern to know' },
    ],
    values: 'Northeastern values experiential learning, innovation, and a commitment to public service. They seek students who are creative, collaborative, and committed to making a difference. They value the ability to think across disciplines, engage with diverse perspectives, and contribute to a vibrant intellectual community.',
  },
  brandeis: {
    name: 'Brandeis University',
    prompts: [
      { value: 'Brandeis values social justice and a commitment to service. Describe a time when you made a meaningful contribution to your community.', label: 'Meaningful community contribution' },
      { value: 'What is a challenge you have faced and how did you overcome it?', label: 'Challenge and how you overcame it' },
      { value: 'How will your experiences contribute to the Brandeis community?', label: 'Contributing to Brandeis community' },
    ],
    values: 'Brandeis values intellectual curiosity, social justice, and a commitment to service. They seek students who are innovative, collaborative, and committed to making a difference. They value the ability to engage with diverse perspectives, think across disciplines, and contribute to a vibrant intellectual community.',
  },
  drexel: {
    name: 'Drexel University',
    prompts: [
      { value: 'Drexel values experiential learning and a commitment to service. Describe a time when you had to apply your learning to a real-world problem.', label: 'Applying learning to real-world problems' },
      { value: 'How will your experiences contribute to the Drexel community?', label: 'Contributing to Drexel community' },
      { value: 'What is one thing you want the Drexel admissions committee to know about you?', label: 'What you want Drexel to know' },
    ],
    values: 'Drexel values experiential learning, innovation, and a commitment to public service. They seek students who are creative, collaborative, and committed to making a difference. They value the ability to think across disciplines, engage with diverse perspectives, and contribute to a vibrant intellectual community.',
  },
  stevens: {
    name: 'Stevens Institute of Technology',
    prompts: [
      { value: 'Stevens values innovation and hands-on learning. Describe a time when you had to think creatively to solve a problem.', label: 'Creative problem solving' },
      { value: 'How will your experiences contribute to the Stevens community?', label: 'Contributing to Stevens community' },
      { value: 'What is one thing you want the Stevens admissions committee to know about you?', label: 'What you want Stevens to know' },
    ],
    values: 'Stevens values innovation, hands-on learning, and a commitment to public service. They seek students who are creative, collaborative, and committed to making a difference. They value the ability to think across disciplines, engage with diverse perspectives, and contribute to a vibrant intellectual community.',
  },
  rochester: {
    name: 'University of Rochester',
    prompts: [
      { value: 'Rochester values intellectual curiosity and a commitment to service. How will your education at Rochester help you make a difference in the world?', label: 'Making a difference through Rochester' },
      { value: 'Describe a time when you questioned or challenged a belief or idea.', label: 'Questioning or challenging a belief' },
      { value: 'What is a community you belong to, and how has it shaped who you are?', label: 'Community that shaped you' },
    ],
    values: 'Rochester values intellectual curiosity, moral character, and a commitment to service. They seek students who are self-aware, reflective, and committed to making a difference in the world. They value the ability to engage with complex moral and ethical issues, work with diverse people, and contribute to a community of principled leaders.',
  },
  wpi: {
    name: 'Worcester Polytechnic Institute',
    prompts: [
      { value: 'WPI values hands-on learning and innovation. Describe a time when you had to think creatively to solve a problem.', label: 'Creative problem solving' },
      { value: 'How will your experiences contribute to the WPI community?', label: 'Contributing to WPI community' },
      { value: 'What is one thing you want the WPI admissions committee to know about you?', label: 'What you want WPI to know' },
    ],
    values: 'WPI values innovation, hands-on learning, and a commitment to public service. They seek students who are creative, collaborative, and committed to making a difference. They value the ability to think across disciplines, engage with diverse perspectives, and contribute to a vibrant intellectual community.',
  },
  rit: {
    name: 'Rochester Institute of Technology',
    prompts: [
      { value: 'RIT values innovation and hands-on learning. Describe a time when you had to think creatively to solve a problem.', label: 'Creative problem solving' },
      { value: 'How will your experiences contribute to the RIT community?', label: 'Contributing to RIT community' },
      { value: 'What is one thing you want the RIT admissions committee to know about you?', label: 'What you want RIT to know' },
    ],
    values: 'RIT values innovation, hands-on learning, and a commitment to public service. They seek students who are creative, collaborative, and committed to making a difference. They value the ability to think across disciplines, engage with diverse perspectives, and contribute to a vibrant intellectual community.',
  },
};

function getSchoolData(key) {
  return SCHOOLS[key] || null;
}

function getSchoolList() {
  return Object.entries(SCHOOLS).map(([key, data]) => ({
    key,
    name: data.name,
  }));
}

function getSchoolPrompts(key) {
  const school = SCHOOLS[key];
  return school ? school.prompts : [];
}

function getSchoolValues(key) {
  const school = SCHOOLS[key];
  return school ? school.values : '';
}

window.SCHOOLS = SCHOOLS;
window.getSchoolData = getSchoolData;
window.getSchoolList = getSchoolList;
window.getSchoolPrompts = getSchoolPrompts;
window.getSchoolValues = getSchoolValues;
