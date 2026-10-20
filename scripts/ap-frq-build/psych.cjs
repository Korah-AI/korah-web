// AP Psychology free-response practice: six original questions, one Article Analysis Question
// (AAQ) and one Evidence-Based Question (EBQ) for each of 2025 Set 1, 2025 Set 2, and 2026,
// each modeled on the released question type and its 7-point rubric. Every article and source
// describes a hypothetical study written for practice, and the prompt says so.
const { pt, part, tableFigure } = require('./frq-helpers.cjs');

const URL = (year, set) => `https://apcentral.collegeboard.org/media/pdf/ap${String(year).slice(2)}-frq-psychology${set ? `-set-${set}` : ''}.pdf`;
const modeled = (year, n, type, set) => ({ year, ...(set ? { set } : {}), question: n, type, label: `${year} AP Psychology${set ? ` Set ${set}` : ''} Question ${n} (${type})`, url: URL(year, set) });
const AAQ = 'Article Analysis Question', EBQ = 'Evidence-Based Question';
const AAQ_TASKS = 'Using the article, respond to all parts of the question.';
const HYPO = 'The article describes a hypothetical study written for practice.';

// The EBQ rubric (claim, two evidence-plus-reasoning sections) with topic-specific examples.
function ebqParts(id, c) {
  return [
    part('A', 'Propose a specific and defensible claim based on at least one of the provided sources that responds to the question.', [
      pt(`${id}-a1`, 'claim', `Proposes a claim relevant to the question (${c.question}).`, ['restates the question as a question', 'describes a source without making a claim'], c.claim, c.badClaim),
    ]),
    part('B', '(i) Support your claim using at least one piece of specific and relevant evidence from one of the sources. (ii) Explain how the evidence from part B (i) supports your claim using a psychological perspective, theory, concept, or research finding learned in AP Psychology.', [
      pt(`${id}-b1`, 'evidence', 'Uses one piece of correctly cited, specific, accurate, and relevant evidence from one of the sources.', ['gives evidence without citing a source', 'gives nonspecific evidence'], c.evidence1, c.badEvidence),
      pt(`${id}-b2`, 'argumentation', 'Explains the relationship between the evidence and the claim, correctly interpreting the evidence.', ['identifies evidence without explaining how it supports the claim'], c.explain1, 'States the evidence again.'),
      pt(`${id}-b3`, 'application', 'Applies a psychological perspective, theory, concept, or research finding from the course to explain how the evidence supports the claim.', ['names a concept that does not fit the evidence', 'uses a term from the source such as “statistically significant”'], c.apply1, 'This shows psychology is important.'),
    ]),
    part('C', '(i) Support your claim using a different piece of specific and relevant evidence from another source. (ii) Explain how the evidence from part C (i) supports your claim using a different psychological perspective, theory, concept, or research finding than the one used in part B (ii).', [
      pt(`${id}-c1`, 'evidence', 'Uses a different piece of correctly cited, specific, and relevant evidence from a different source than the one used in part B.', ['uses the same source as part B', 'omits the citation'], c.evidence2, 'Uses Source 1 again.'),
      pt(`${id}-c2`, 'argumentation', 'Explains the relationship between the second piece of evidence and the claim.', ['explains without interpreting the evidence'], c.explain2, 'This also supports my claim.'),
      pt(`${id}-c3`, 'application', 'Applies a different psychological perspective, theory, concept, or research finding than the one used in part B to explain how the evidence supports the claim.', ['repeats the concept from part B'], c.apply2, 'Uses the same concept as part B.'),
    ]),
  ];
}

const frqs = [];

// ════════════════ Set modeled on 2025 Set 1 ════════════════

frqs.push({
  id: 'psych-aaq-retrieval-practice', questionNumber: 1, title: 'Quizzing Versus Rereading', topic: 'Article Analysis · Memory and the testing effect',
  modeledOn: modeled(2025, 1, AAQ, 1), timeAllottedMin: 25, calculatorAllowed: false,
  prompt: `${HYPO} Researchers recruited 120 undergraduate students, ages 18 to 22, from introductory psychology courses at one public university; students received course credit. After giving informed consent, participants read a 1,500-word passage about volcanoes. They were then randomly assigned to one of two groups. The rereading group read the passage three more times. The retrieval group took three 10-question short-answer quizzes on the passage without looking at it. One week later, all participants took the same 30-question test on the passage. The retrieval group scored a mean of 78% (standard deviation 9%), and the rereading group scored a mean of 64% (standard deviation 11%). The difference was statistically significant. Participants were debriefed at the end of the study. ${AAQ_TASKS}`,
  parts: [
    part('A', 'Identify the research method used in the study.', [
      pt('psych-aaq-retrieval-practice-a1', 'research-methods', 'Identifies an experiment (participants were randomly assigned to conditions of a manipulated variable).', ['identifies a correlational study', 'identifies a survey'], 'An experiment, because students were randomly assigned to rereading or retrieval.', 'A correlational study.'),
    ]),
    part('B', 'State the operational definition of retrieval practice in the study.', [
      pt('psych-aaq-retrieval-practice-b1', 'research-methods', 'States the measurable definition: taking three 10-question short-answer quizzes on the passage without looking at it.', ['describes retrieval practice in general terms'], 'Retrieval practice was taking three 10-question short-answer quizzes without the passage.', 'Practicing remembering things.'),
    ]),
    part('C', 'Describe what the difference in the mean test scores indicates in the study.', [
      pt('psych-aaq-retrieval-practice-c1', 'statistics', 'Describes that the retrieval group remembered more of the passage a week later than the rereading group (78% versus 64%, a 14-point difference).', ['restates a mean without relating it to the study', 'defines the mean'], 'Students who quizzed themselves scored 14 points higher on the delayed test than students who reread.', 'The mean of the retrieval group was 78%.'),
    ]),
    part('D', 'Identify at least one ethical guideline applied by the researchers in the study.', [
      pt('psych-aaq-retrieval-practice-d1', 'ethics', 'Identifies informed consent or debriefing, both described in the article.', ['names a guideline not described in the article', 'says the study was ethical'], 'The researchers obtained informed consent before the study.', 'The researchers kept the data confidential.'),
    ]),
    part('E', 'Explain the extent to which the research findings may or may not be generalizable using specific and relevant evidence from the study.', [
      pt('psych-aaq-retrieval-practice-e1', 'generalizability', 'Makes a claim about generalizability to a population and supports it with participant variables, such as the sample being 18- to 22-year-old students from one university.', ['refers to sample size or reliability only', 'claims generalizability without evidence'], 'The findings may not generalize to younger students or adults, because all participants were 18- to 22-year-old students at one university.', 'The study is generalizable because it had 120 people.'),
    ]),
    part('F', 'Explain how at least one of the research findings supports or refutes the testing effect.', [
      pt('psych-aaq-retrieval-practice-f1', 'argumentation', 'Uses a result of the study or explains that the testing effect is supported (either alone earns this point).', ['states only that memory was studied'], 'The retrieval group scored higher than the rereading group.', 'The study is about memory.'),
      pt('psych-aaq-retrieval-practice-f2', 'argumentation', 'Uses a specific result to accurately explain how it supports the testing effect: practicing retrieval led to better long-term retention (78%) than restudying (64%).', ['misinterprets which group did better'], 'The testing effect is supported because students who practiced retrieving the information scored 78% a week later, compared with 64% for students who only reread it.', 'The testing effect is refuted because both groups forgot some information.'),
    ]),
  ],
  sampleResponse: 'A Experiment. B Retrieval practice was operationally defined as taking three 10-question short-answer quizzes on the passage without looking at it. C The retrieval group remembered more of the passage one week later, scoring 14 percentage points higher (78% versus 64%) than the rereading group. D The researchers obtained informed consent and debriefed participants. E The findings may not generalize to all learners, because all participants were 18- to 22-year-old college students from one university; younger students or older adults might respond differently. F The results support the testing effect: participants who practiced retrieving the information scored 78% on the delayed test, compared with 64% for those who restudied by rereading, showing that retrieval strengthens long-term memory more than rereading.',
});

frqs.push({
  id: 'psych-ebq-sleep', questionNumber: 2, title: 'Sleep Loss and Thinking', topic: 'Evidence-Based Question · Sleep and cognition',
  modeledOn: modeled(2025, 2, EBQ, 1), timeAllottedMin: 45, calculatorAllowed: false,
  prompt: 'The sources below describe hypothetical studies written for practice. Using the sources, develop and justify an argument about whether getting less sleep than recommended harms cognitive performance. Cite sources as (Source 1), (Source 2), or (Source 3).',
  figures: [tableFigure('Sources', ['Source', 'Method', 'Summary'], [['Source 1', 'experiment', '40 healthy adults were randomly assigned to stay awake for 24 hours or sleep normally. On a computer task requiring them to press a key when a target appeared, the sleep-deprived group made a mean of 14 errors, compared with 5 errors for the rested group.'], ['Source 2', 'correlational study', 'A survey of 2,000 high school students found a positive correlation (r = +0.31) between average hours of sleep on school nights and grade point average.'], ['Source 3', 'archival study', 'A review of hospital records found that nurses working 12-hour night shifts made more medication errors in the last two hours of a shift than in the first two hours.']])],
  parts: ebqParts('psych-ebq-sleep', {
    question: 'whether less sleep harms cognitive performance',
    claim: 'Getting less sleep than recommended harms attention and learning.', badClaim: 'Does sleep affect thinking?',
    evidence1: 'Sleep-deprived adults made 14 errors on the attention task, compared with 5 for rested adults (Source 1).', badEvidence: 'Studies show that tired people do worse.',
    explain1: 'Because the groups were randomly assigned and the only difference was sleep, the extra errors show that sleep loss caused poorer attention.',
    apply1: 'Sleep deprivation impairs selective attention, so tired participants failed to notice targets they would otherwise catch.',
    evidence2: 'Students who slept more on school nights tended to have higher GPAs (r = +0.31) (Source 2).',
    explain2: 'The positive correlation suggests students who sleep less tend to learn and perform less well in school, consistent with the claim.',
    apply2: 'Sleep, especially REM sleep, supports memory consolidation, so students who sleep less may not store what they learned as well.',
  }),
  sampleResponse: 'A Getting less sleep than recommended harms cognitive performance. B (i) In Source 1, sleep-deprived adults made a mean of 14 errors on the target task, compared with 5 for rested adults. (ii) Because participants were randomly assigned, the difference shows that sleep loss caused the extra errors; sleep deprivation impairs selective attention, so participants missed targets they would normally notice. C (i) In Source 2, hours of sleep and GPA were positively correlated (r = +0.31). (ii) Students who sleep less tend to earn lower grades; sleep supports memory consolidation, so less sleep means less of what was learned during the day is stored in long-term memory.',
});

// ════════════════ Set modeled on 2025 Set 2 ════════════════

frqs.push({
  id: 'psych-aaq-screen-time', questionNumber: 1, title: 'Evening Screens and Sleep', topic: 'Article Analysis · Correlational research on sleep',
  modeledOn: modeled(2025, 1, AAQ, 2), timeAllottedMin: 25, calculatorAllowed: false,
  prompt: `${HYPO} Researchers studied 850 adolescents, ages 13 to 17, from 12 public middle and high schools in three states. Parents gave written consent and students gave assent. For two weeks, an app recorded each student’s phone use, and a wrist tracker recorded sleep. Evening screen time was measured as the average number of minutes of phone use per night between 9 p.m. and the time the student fell asleep. Students averaged 74 minutes of evening screen time and 7.1 hours of sleep. Evening screen time and sleep duration were negatively correlated (r = −0.38). All data were stored with code numbers instead of names. The researchers noted that students who were already having trouble sleeping might use their phones more. ${AAQ_TASKS}`,
  parts: [
    part('A', 'Identify the research method used in the study.', [
      pt('psych-aaq-screen-time-a1', 'research-methods', 'Identifies a correlational study (variables were measured, not manipulated).', ['identifies an experiment'], 'A correlational study, because screen time was measured rather than assigned.', 'An experiment.'),
    ]),
    part('B', 'State the operational definition of evening screen time in the study.', [
      pt('psych-aaq-screen-time-b1', 'research-methods', 'States the measurable definition: the average minutes of phone use per night recorded by the app between 9 p.m. and falling asleep.', ['describes screen time in general terms'], 'Average minutes of phone use, recorded by the app, between 9 p.m. and sleep onset each night.', 'How much students use screens.'),
    ]),
    part('C', 'Describe what the correlation coefficient indicates in the study.', [
      pt('psych-aaq-screen-time-c1', 'statistics', 'Describes a moderate negative relationship: students with more evening screen time tended to sleep fewer hours.', ['says screen time causes less sleep', 'describes a positive relationship'], 'r = −0.38 shows that students who used their phones more in the evening tended to sleep less.', 'r = −0.38 means screens cause 38% less sleep.'),
    ]),
    part('D', 'Identify at least one ethical guideline applied by the researchers in the study.', [
      pt('psych-aaq-screen-time-d1', 'ethics', 'Identifies informed consent from parents with assent from minors, or confidentiality (code numbers instead of names).', ['names debriefing, which is not described'], 'Parents gave consent and students gave assent before participating.', 'The researchers debriefed students.'),
    ]),
    part('E', 'Explain the extent to which the research findings may or may not be generalizable using specific and relevant evidence from the study.', [
      pt('psych-aaq-screen-time-e1', 'generalizability', 'Makes a claim about a population supported by participant variables, such as the sample of 13- to 17-year-olds from 12 public schools in three states.', ['refers only to sample size'], 'The findings may generalize to U.S. public school adolescents because students came from 12 schools in three states, but not to adults or younger children.', 'It is generalizable because 850 is a lot.'),
    ]),
    part('F', 'Explain how at least one of the research findings supports or refutes the claim that evening phone use causes adolescents to sleep less.', [
      pt('psych-aaq-screen-time-f1', 'argumentation', 'Uses a result of the study or explains whether the claim is supported or refuted.', ['states only that sleep was studied'], 'Screen time and sleep were negatively correlated.', 'The study measured sleep.'),
      pt('psych-aaq-screen-time-f2', 'argumentation', 'Uses a specific result to explain accurately that the correlation (r = −0.38) shows an association but cannot establish causation, especially since poor sleepers might use phones more (a third variable or reverse direction).', ['concludes the study proves causation'], 'The negative correlation (r = −0.38) is consistent with the claim but does not prove it, because the study did not manipulate screen time, and students who already sleep poorly might use their phones more.', 'The study proves phones cause less sleep.'),
    ]),
  ],
  sampleResponse: 'A Correlational study. B Evening screen time was the average minutes of phone use per night, recorded by the app, between 9 p.m. and falling asleep. C The coefficient of −0.38 shows a moderate negative relationship: students with more evening screen time tended to sleep fewer hours. D Parents gave informed consent and students gave assent; data were kept confidential with code numbers. E The results may generalize to U.S. adolescents in public schools because the sample came from 12 schools in three states, but not to adults or children outside the 13–17 age range. F The finding does not fully support the causal claim. The correlation (r = −0.38) shows that more evening phone use goes with less sleep, but because screen time was not manipulated, it could be that students who already have trouble sleeping use their phones more.',
});

frqs.push({
  id: 'psych-ebq-mindset', questionNumber: 2, title: 'Mindset and School Performance', topic: 'Evidence-Based Question · Motivation and achievement',
  modeledOn: modeled(2025, 2, EBQ, 2), timeAllottedMin: 45, calculatorAllowed: false,
  prompt: 'The sources below describe hypothetical studies written for practice. Using the sources, develop and justify an argument about whether teaching students that abilities can improve with effort helps them succeed academically. Cite sources as (Source 1), (Source 2), or (Source 3).',
  figures: [tableFigure('Sources', ['Source', 'Method', 'Summary'], [['Source 1', 'experiment', '1,200 ninth graders were randomly assigned to two 25-minute online lessons, either about how the brain grows stronger with effort or about general study skills. Among lower-achieving students, GPA over the next year rose 0.10 points in the brain-growth group and fell 0.03 points in the study-skills group.'], ['Source 2', 'correlational study', 'Among 300 middle school students, scores on a survey measuring the belief that intelligence can grow were positively correlated (r = +0.22) with the time students persisted on a difficult puzzle.'], ['Source 3', 'experiment', 'Among 400 high-achieving high school students, the brain-growth lesson produced no difference in grades compared with a control lesson.']])],
  parts: ebqParts('psych-ebq-mindset', {
    question: 'whether teaching that abilities can improve helps students succeed',
    claim: 'Teaching students that abilities can grow with effort helps struggling students succeed academically.', badClaim: 'Mindset is studied by psychologists.',
    evidence1: 'Lower-achieving students who took the brain-growth lesson gained 0.10 GPA points, while those in the study-skills lesson lost 0.03 (Source 1).', badEvidence: 'Mindset lessons help.',
    explain1: 'Because students were randomly assigned, the higher GPA in the brain-growth group suggests the lesson itself improved performance for struggling students.',
    apply1: 'Believing ability can grow increases self-efficacy, so students expect effort to pay off and keep working after setbacks.',
    evidence2: 'Students who believed intelligence could grow persisted longer on a difficult puzzle (r = +0.22) (Source 2).',
    explain2: 'Greater persistence on hard tasks is a likely route to better grades, supporting the claim that this belief helps students succeed.',
    apply2: 'Students who attribute failure to effort rather than fixed ability have an internal, controllable attribution, which motivates them to keep trying.',
  }),
  sampleResponse: 'A Teaching students that abilities can grow with effort helps struggling students succeed academically. B (i) In Source 1, lower-achieving students in the brain-growth lesson gained 0.10 GPA points, while those in the study-skills lesson lost 0.03. (ii) Random assignment means the lesson likely caused the difference; believing ability can grow raises self-efficacy, so students expect effort to pay off and keep working after setbacks. C (i) In Source 2, belief that intelligence can grow was positively correlated with persistence on a difficult puzzle (r = +0.22). (ii) Students who see failure as a result of effort, an internal and controllable attribution, are more motivated to keep trying, which supports better academic outcomes.',
});

// ════════════════ Set modeled on the 2026 exam ════════════════

frqs.push({
  id: 'psych-aaq-online-bystander', questionNumber: 1, title: 'An Emergency in a Video Chat', topic: 'Article Analysis · Social psychology and the bystander effect',
  modeledOn: modeled(2026, 1, AAQ), timeAllottedMin: 25, calculatorAllowed: false,
  prompt: `${HYPO} Researchers recruited 180 adults, ages 18 to 70, from 40 U.S. states through an online research platform; each was paid $3. Participants joined a video discussion that they believed included either 1 other participant or 5 other participants. In fact, the other participants were prerecorded videos. Participants were randomly assigned to one of the two group sizes. Midway through the discussion, one video showed a person appearing to have a medical emergency. The researchers recorded whether each participant clicked a “report emergency” button within 60 seconds. In the 1-other condition, 72% of participants reported the emergency; in the 5-other condition, 39% did. Because the study used deception, an ethics board approved it in advance, and all participants were fully debriefed afterward. ${AAQ_TASKS}`,
  figures: [tableFigure('Results', ['Condition', 'Reported within 60 seconds'], [['1 other participant', '72%'], ['5 other participants', '39%']])],
  parts: [
    part('A', 'Identify the research method used in the study.', [
      pt('psych-aaq-online-bystander-a1', 'research-methods', 'Identifies an experiment (group size was manipulated with random assignment).', ['identifies naturalistic observation'], 'An experiment, because participants were randomly assigned to group sizes.', 'A naturalistic observation.'),
    ]),
    part('B', 'State the operational definition of helping behavior in the study.', [
      pt('psych-aaq-online-bystander-b1', 'research-methods', 'States the measurable definition: clicking the “report emergency” button within 60 seconds.', ['describes helping in general terms'], 'Helping was clicking the report emergency button within 60 seconds of the emergency.', 'Helping someone in need.'),
    ]),
    part('C', 'Describe what the difference in percentages indicates in the study.', [
      pt('psych-aaq-online-bystander-c1', 'statistics', 'Describes that participants were much less likely to report the emergency when they believed 5 others were present (39%) than when they believed 1 other was present (72%).', ['restates a percentage without comparison'], 'Believing more people were watching cut the reporting rate from 72% to 39%.', '72% reported in one group.'),
    ]),
    part('D', 'Identify at least one ethical guideline applied by the researchers in the study.', [
      pt('psych-aaq-online-bystander-d1', 'ethics', 'Identifies debriefing or approval by an ethics board (institutional review), both described in the article.', ['names informed consent, which is not described'], 'Participants were fully debriefed after the deception.', 'The researchers got informed consent.'),
    ]),
    part('E', 'Explain the extent to which the research findings may or may not be generalizable using specific and relevant evidence from the study.', [
      pt('psych-aaq-online-bystander-e1', 'generalizability', 'Makes a claim about a population supported by participant variables, such as the wide age range (18–70) and 40 states supporting generalization to U.S. adults, or the online, paid sample limiting it.', ['refers only to sample size'], 'The findings may generalize to U.S. adults because participants ranged from 18 to 70 and came from 40 states, though only people who join online studies were included.', 'It is generalizable because it is online.'),
    ]),
    part('F', 'Explain how at least one of the research findings supports or refutes the bystander effect.', [
      pt('psych-aaq-online-bystander-f1', 'argumentation', 'Uses a result of the study or explains that the bystander effect is supported.', ['states only that helping was studied'], 'Fewer people reported the emergency in the larger group.', 'The study was about emergencies.'),
      pt('psych-aaq-online-bystander-f2', 'argumentation', 'Uses a specific result to accurately explain support for the bystander effect: when participants believed more bystanders were present, fewer helped (39% versus 72%), consistent with diffusion of responsibility.', ['reverses the direction of the result'], 'The bystander effect is supported: only 39% helped when they thought five others were present, compared with 72% with one other, because responsibility felt shared among more people.', 'The bystander effect is refuted because some people helped.'),
    ]),
  ],
  sampleResponse: 'A Experiment. B Helping was operationally defined as clicking the “report emergency” button within 60 seconds. C Participants who believed five others were present were far less likely to report the emergency (39%) than those who believed one other was present (72%). D The study was approved by an ethics board, and participants were debriefed after the deception. E The findings may generalize to U.S. adults because participants ranged in age from 18 to 70 and came from 40 states, though the sample included only people who take part in paid online studies. F The results support the bystander effect: when participants thought more people were watching, only 39% reported the emergency compared with 72% in the smaller group, consistent with diffusion of responsibility.',
});

frqs.push({
  id: 'psych-ebq-cbt-anxiety', questionNumber: 2, title: 'Treating Anxiety with CBT', topic: 'Evidence-Based Question · Psychological treatment',
  modeledOn: modeled(2026, 2, EBQ), timeAllottedMin: 45, calculatorAllowed: false,
  prompt: 'The sources below describe hypothetical studies written for practice. Using the sources, develop and justify an argument about whether cognitive-behavioral therapy (CBT) is an effective treatment for anxiety disorders. Cite sources as (Source 1), (Source 2), or (Source 3).',
  figures: [tableFigure('Sources', ['Source', 'Method', 'Summary'], [['Source 1', 'experiment', '160 adults with generalized anxiety disorder were randomly assigned to 12 weekly sessions of CBT or to a waitlist. Scores on an anxiety scale fell by 45% in the CBT group and by 10% in the waitlist group.'], ['Source 2', 'longitudinal follow-up', 'Participants from the CBT group in Source 1 were reassessed 12 months later. Their average anxiety scores remained 40% below their starting level.'], ['Source 3', 'experiment', 'Adults with social anxiety disorder who used a self-guided online CBT program improved by 25%, compared with 8% for a control group, but 38% of the online group stopped using the program before finishing.']])],
  parts: ebqParts('psych-ebq-cbt-anxiety', {
    question: 'whether CBT effectively treats anxiety disorders',
    claim: 'Cognitive-behavioral therapy is an effective, lasting treatment for anxiety disorders.', badClaim: 'Anxiety is a common disorder.',
    evidence1: 'Anxiety scores fell 45% with CBT compared with 10% on the waitlist (Source 1).', badEvidence: 'Therapy helps people.',
    explain1: 'Because participants were randomly assigned, the much larger drop in the CBT group shows the therapy, not just time, reduced anxiety.',
    apply1: 'CBT teaches clients to identify and challenge cognitive distortions such as catastrophizing, which reduces the anxious thoughts that maintain the disorder.',
    evidence2: 'Twelve months after treatment, the CBT group’s anxiety remained 40% below its starting level (Source 2).',
    explain2: 'The improvement lasted long after therapy ended, showing CBT’s benefits are durable rather than temporary.',
    apply2: 'The behavioral part of CBT uses exposure therapy, gradually confronting feared situations so the learned fear response is extinguished, which helps gains last.',
  }),
  sampleResponse: 'A CBT is an effective and lasting treatment for anxiety disorders. B (i) In Source 1, anxiety scores fell 45% in the CBT group but only 10% on the waitlist. (ii) With random assignment, the larger improvement shows CBT reduced anxiety beyond the effect of time; CBT trains clients to recognize and challenge cognitive distortions such as catastrophizing, which drive anxious feelings. C (i) In Source 2, the CBT group’s anxiety was still 40% below baseline 12 months later. (ii) The benefits lasted, consistent with the behavioral component of CBT: exposure to feared situations extinguishes the conditioned fear response, so improvement persists after therapy ends.',
});

// Demo data for the grading flow on localhost (see ap-grader.js canned mode).
const canned = {
  frqId: 'psych-aaq-retrieval-practice',
  transcript: 'A It was an experiment because the students were randomly assigned to groups.\n\nB Retrieval practice meant taking three 10-question short-answer quizzes on the passage without looking at it.\n\nC The retrieval group did better on the test a week later, 78% compared with 64%.\n\nD The researchers got informed consent.\n\nE The study is generalizable because 120 students is a big sample.\n\nF This supports the testing effect because the students who quizzed themselves scored 78% while the rereading group scored 64%, so practicing retrieval helped them remember more.',
  evidence: {
    'psych-aaq-retrieval-practice-a1': 'an experiment because the students were randomly assigned', 'psych-aaq-retrieval-practice-b1': 'three 10-question short-answer quizzes on the passage without looking at it',
    'psych-aaq-retrieval-practice-c1': 'The retrieval group did better on the test a week later, 78% compared with 64%.', 'psych-aaq-retrieval-practice-d1': 'The researchers got informed consent.',
    'psych-aaq-retrieval-practice-f1': 'the students who quizzed themselves scored 78% while the rereading group scored 64%', 'psych-aaq-retrieval-practice-f2': 'practicing retrieval helped them remember more',
  },
  missed: { 'psych-aaq-retrieval-practice-e1': 'Sample size does not determine generalizability. Use participant variables: all participants were 18- to 22-year-old students from one university, so the results may not apply to younger students or older adults.' },
  priorityFix: 'For generalizability, name who the participants were (age, school, location) and the population they do or do not represent. Sample size, reliability, and validity do not earn this point.',
  sampleResponseComparison: 'Every part except E matches the sample response. The sample bases its generalizability claim on the participants’ ages and their single university.',
};

module.exports = { course: 'ap-psychology', frqs, canned };
