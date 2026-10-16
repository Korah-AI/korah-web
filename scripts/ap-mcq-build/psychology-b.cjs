// AP Psychology units 4–5: Social Psychology and Personality, and Mental and Physical
// Health. Same block format as psychology-a.cjs; study results are hypothetical.
const { graph, chart, table } = require('./figures.cjs');
const { draw } = require('./diagram.cjs');

const PINK = '#ec4899', BLUE = '#3b82f6';
const r2 = n => Math.round(n * 100) / 100;
const text = (x, y, s, o = {}) => ['text', x, y, s, { italic: false, ...o }];

// Maslow's hierarchy: a triangle from apex (130, 15) to a base from x 10 to 250 at y 215.
const LEVELS = ['Self-actualization', 'Esteem', 'Love and belonging', 'Safety', 'Physiological'];
const half = y => 120 * (y - 15) / 200;

// Positively skewed distribution: f(x) = (x/12)² e^(2 − x/6), with mode 12, median ≈ 16, mean 18.
const skew = x => (x / 12) ** 2 * Math.exp(2 - x / 6);

const figures = {
  asch: draw(380, 180, 'A standard line on the left and three comparison lines labeled A, B, and C on the right. Line B is the same length as the standard line. Line A is clearly shorter and line C is clearly longer', [
    ['line', 60, 40, 60, 140, { width: 4 }], text(60, 162, 'Standard', { size: 11 }),
    ['line', 200, 65, 200, 140, { width: 4 }], ['line', 260, 40, 260, 140, { width: 4 }], ['line', 320, 15, 320, 140, { width: 4 }],
    text(200, 162, 'A', { bold: true }), text(260, 162, 'B', { bold: true }), text(320, 162, 'C', { bold: true }),
  ]),
  dissonance: chart({ title: 'Rated enjoyment of a dull task (0 = none, 10 = very high)', categories: ['No request (control)', 'Paid $1 to call it fun', 'Paid $20 to call it fun'], series: [{ name: 'Rating', values: [4.4, 6.6, 4.7] }], ymax: 10, ystep: 2, w: 460,
    alt: 'Bar graph of participants\' ratings of how enjoyable a dull task was. The control group, who were not asked to describe the task to anyone, rated it 4.4. Participants paid $1 to tell another person the task was fun rated it 6.6. Participants paid $20 to say the same rated it 4.7' }),
  loafing: chart({ type: 'line', title: 'Effort per person (% of solo effort) by number of people pulling', categories: ['1', '2', '3', '4', '6', '8'], series: [{ name: 'Effort', values: [100, 93, 85, 78, 70, 64] }], ymax: 100, ystep: 20,
    alt: 'Line graph of the average effort each person exerts while pulling a rope as a percentage of solo effort, by the number of people pulling together. Effort is 100 percent alone and falls steadily: 93 percent with 2 people, 85 with 3, 78 with 4, 70 with 6, and 64 with 8' }),
  bystander: chart({ title: 'Participants who sought help for a person having a seizure (%)', categories: ['Alone', '1 other listener', '4 other listeners'], series: [{ name: 'Helped', values: [85, 62, 31] }], ymax: 100, ystep: 20, w: 460,
    alt: 'Bar graph of the percentage of participants who sought help when they heard another participant apparently having a seizure over an intercom, by how many other listeners they believed were present. Alone: 85 percent. With one other listener: 62 percent. With four others: 31 percent' }),
  maslow: draw(460, 230, 'Maslow\'s hierarchy of needs drawn as a pyramid with five levels. From the bottom: physiological needs, safety needs, love and belonging, esteem, and self-actualization at the top', [
    ['poly', [[130, 15], [10, 215], [250, 215]], { fill: true, width: 2 }],
    ...[55, 95, 135, 175].map(y => ['line', r2(130 - half(y)), y, r2(130 + half(y)), y, { width: 1.4 }]),
    ...LEVELS.flatMap((l, i) => { const y = 35 + 40 * i; return [['line', r2(130 + half(y)) + 4, y, 262, y, { width: 0.8, dash: true }], text(268, y + 4, l, { anchor: 'start', size: 12 })]; }),
  ]),
  bigFive: table(['Person', 'Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism'], [['J', '55th', '94th', '40th', '60th', '20th'], ['K', '85th', '35th', '90th', '70th', '45th'], ['L', '30th', '50th', '22nd', '45th', '96th']],
    'Table of percentile scores on the five factors of personality for three people. J: openness 55th, conscientiousness 94th, extraversion 40th, agreeableness 60th, neuroticism 20th. K: 85th, 35th, 90th, 70th, 45th. L: 30th, 50th, 22nd, 45th, 96th'),
  yerkes: graph({ x: [0, 10], y: [0, 10], xstep: 20, ystep: 20, xlabel: '', ylabel: '', xtitle: 'Arousal (low to high)', ytitle: 'Performance', w: 360,
    curves: [{ fn: x => 9 * Math.exp(-(((x - 7) / 2.6) ** 2)), from: 0, to: 10 }, { fn: x => 9 * Math.exp(-(((x - 3.5) / 2.2) ** 2)), from: 0, to: 10, color: PINK }],
    notes: [{ x: 7.3, y: 9.3, text: 'simple task' }, { x: 1.2, y: 9.3, text: 'complex task' }],
    alt: 'Graph of performance versus arousal for two tasks. Both curves are inverted U shapes. Performance on a simple task peaks at a fairly high level of arousal, while performance on a complex task peaks at a lower level of arousal' }),
  emotion: draw(540, 110, 'A diagram of one theory of emotion. A stimulus produces physiological arousal. The person then gives the arousal a cognitive label based on the situation, and the emotion results from the arousal and the label together', [
    ...[['Stimulus', 10], ['Physiological arousal', 145], ['Cognitive label', 280], ['Emotion', 415]].flatMap(([l, x], i) => [['rect', x, 30, 115, 46, { fill: true }], text(x + 57.5, 58, l, { size: 12 }), ...(i < 3 ? [['arrow', x + 117, 53, x + 143, 53]] : [])]),
    text(270, 18, 'Theory X', { bold: true, size: 12 }),
  ]),

  gas: graph({ x: [0, 10], y: [0, 10], xstep: 20, ystep: 20, xlabel: '', ylabel: '', xtitle: 'Time under prolonged stress', ytitle: 'Resistance to stress', w: 380,
    curves: [{ pts: [[0, 5], [0.6, 5], [1.2, 3.2], [1.8, 6.8], [2.4, 7.6], [6.8, 7.6], [7.6, 6], [8.6, 2.5], [10, 1]] }, { pts: [[0, 5], [10, 5]], dash: true, color: 'currentColor' }, { pts: [[2, 0], [2, 10]], dash: true, color: PINK }, { pts: [[7, 0], [7, 10]], dash: true, color: PINK }],
    notes: [{ x: 0.6, y: 8.8, text: 'A' }, { x: 4.4, y: 8.8, text: 'B' }, { x: 8.3, y: 8.8, text: 'C' }, { x: 7.2, y: 5.4, text: 'normal level' }],
    alt: 'Graph of the body\'s resistance to stress over time during prolonged stress, divided into three phases. In phase A, resistance briefly drops below the normal level and then rises sharply. In phase B, resistance stays high above normal for a long time. In phase C, resistance falls well below normal' }),
  scatter: graph({ x: [0, 10], y: [0, 20], xstep: 2, ystep: 4, xlabel: '', ylabel: '', xtitle: 'Stressful life events in the past year', ytitle: 'Days of illness in the past year', w: 370,
    dots: [[1, 3], [1, 6], [2, 4], [2, 9], [3, 5], [3, 8], [4, 7], [4, 11], [5, 6], [5, 12], [6, 10], [6, 14], [7, 9], [7, 15], [8, 13], [9, 12], [9, 17], [10, 16]].map(([x, y]) => ({ x, y })),
    alt: 'Scatterplot of 18 people\'s number of stressful life events in the past year against their days of illness in the past year. The points rise from lower left to upper right with considerable scatter: people with more stressful events tended to have more days of illness' }),
  skewed: graph({ x: [0, 60], y: [0, 1.2], xstep: 10, ystep: 2, xlabel: '', ylabel: '', xtitle: 'Score on a depression inventory', w: 380, h: 250,
    curves: [{ fn: skew, from: 0, to: 60 }, ...[[12, PINK], [16, PINK], [18, PINK]].map(([x, c]) => ({ pts: [[x, 0], [x, skew(x)]], dash: true, color: c }))],
    notes: [{ x: 12, y: 1.06, text: 'P', anchor: 'middle' }, { x: 15.4, y: 1.0, text: 'Q', anchor: 'middle' }, { x: 19.2, y: 0.94, text: 'R', anchor: 'middle' }],
    alt: 'A distribution of scores on a depression inventory in a community sample. Most scores are low, and a long tail extends to the right toward high scores. Three dashed lines mark measures of central tendency: P at the peak, a score of 12; Q slightly to the right, at 16; and R farther right, at 18' }),
  cases: table(['Client', 'Reported symptoms'], [
    ['A', 'For the past month, nearly every day: depressed mood, loss of interest in activities once enjoyed, insomnia, fatigue, and feelings of worthlessness'],
    ['B', 'Repeated, unexpected episodes of pounding heart, shortness of breath, and intense fear of dying that peak within minutes; constant worry about the next episode'],
    ['C', 'For eight months: hears voices commenting on the client\'s actions, believes coworkers are inserting thoughts into the client\'s mind, and speaks in a disorganized way'],
  ], 'Table of symptoms reported by three clients. Client A, for the past month: depressed mood, loss of interest, insomnia, fatigue, and feelings of worthlessness. Client B: repeated, unexpected episodes of pounding heart, shortness of breath, and intense fear that peak within minutes, with constant worry about the next episode. Client C, for eight months: hearing voices commenting on their actions, believing coworkers insert thoughts into their mind, and disorganized speech'),
  therapy: chart({ type: 'line', title: 'Mean depression score (higher = more severe)', categories: ['Week 0', '2', '4', '6', '8', '10', '12'], series: [{ name: 'Cognitive-behavioral therapy', values: [28, 25, 21, 17, 14, 12, 11] }, { name: 'Waitlist control', values: [28, 27, 27, 26, 26, 25, 25] }], ymax: 30, ystep: 5, w: 460,
    alt: 'Line graph of mean depression scores over 12 weeks for two randomly assigned groups. Both start at 28. The cognitive-behavioral therapy group falls steadily to 11 by week 12. The waitlist control group falls only slightly, to 25' }),
  drugs: table(['Medication class', 'Main action in the brain', 'Commonly prescribed for'], [
    ['SSRIs', 'Block the reuptake of serotonin', 'Depression and anxiety disorders'],
    ['Antipsychotics', 'Block dopamine receptors', 'Schizophrenia'],
    ['Lithium', 'Stabilizes mood; mechanism not fully understood', 'Bipolar disorder'],
    ['Benzodiazepines', 'Increase the effect of GABA', 'Short-term relief of anxiety'],
  ], 'Table of four medication classes. SSRIs block the reuptake of serotonin and are prescribed for depression and anxiety disorders. Antipsychotics block dopamine receptors and are prescribed for schizophrenia. Lithium stabilizes mood and is prescribed for bipolar disorder. Benzodiazepines increase the effect of GABA and are prescribed for short-term relief of anxiety'),
};

const source = String.raw`
@ 4 | - | Attribution
When a new coworker arrives late to a meeting, Dana immediately concludes the coworker is lazy and irresponsible, without considering that traffic might have been heavy. Which concept does this illustrate?
* The fundamental attribution error
- The self-serving bias
- The actor–observer bias, from the actor's view
- The just-world phenomenon
= The fundamental attribution error is the tendency to overestimate personal (dispositional) causes and underestimate situational causes when explaining others' behavior.

@ 4 | - | Attribution
When Kai trips on the stairs, Kai blames the slippery steps; when a classmate trips on the same stairs, Kai thinks the classmate is clumsy. Which concept does this illustrate?
* The actor–observer bias
- The self-fulfilling prophecy
- The mere-exposure effect
- In-group bias
= People tend to explain their own behavior by situations, which they can see, and others' behavior by dispositions. This difference in perspective is the actor–observer bias.

@ 4 | - | Attribution
A student says an A on an exam reflects hard work and intelligence, but blames a C on unfair questions. Which concept does this illustrate?
* The self-serving bias
- The fundamental attribution error
- An external locus of control
- Belief perseverance
= The self-serving bias is the tendency to take credit for successes and blame failures on outside factors, which protects self-esteem.

@ 4 | - | Locus of control
A job seeker believes that getting hired depends mainly on preparation and effort, not luck or connections. Which concept does this describe?
* An internal locus of control
- An external locus of control
- Learned helplessness
- The self-serving bias
= People with an internal locus of control believe they control their own outcomes. Those with an external locus of control attribute outcomes to luck, fate, or powerful others.

@ 4 | - | Person perception
Students rate a classmate's face as more likable after seeing the classmate in the hallway many times, though they have never spoken. Which concept does this illustrate?
* The mere-exposure effect
- The halo effect
- Social facilitation
- Cognitive dissonance
= Repeated exposure to a neutral stimulus tends to increase liking for it, even without any interaction.

@ 4 | - | Person perception
Teachers were told, falsely, that certain randomly chosen students were about to bloom intellectually. By year's end those students showed greater gains. Which concept does this illustrate?
* A self-fulfilling prophecy
- The fundamental attribution error
- The false consensus effect
- Group polarization
= Expectations can lead people to act in ways, such as giving more attention and encouragement, that make the expectations come true.

@ 4 | - | Prejudice and discrimination
Which of the following is an example of discrimination rather than a stereotype or prejudice?
* A landlord refuses to rent to applicants of a particular ethnicity.
- A person believes members of a group are all good at math.
- A person feels uneasy around members of an unfamiliar group.
- A person assumes older adults are bad with technology.
= Discrimination is behavior: unjustified negative action toward members of a group. A stereotype is a generalized belief, and prejudice is an attitude or feeling.

@ 4 | - | Group perception
Members of a sports team describe themselves as varied individuals but describe fans of a rival team as "all the same." Which concept does this illustrate?
* The out-group homogeneity effect
- Deindividuation
- Social loafing
- The mere-exposure effect
= People see more variety within their own group and view members of other groups as similar to one another. This tendency, along with in-group bias, can foster stereotyping.

@ 4 | - | Cognitive dissonance | dissonance
In the study shown, participants performed a dull task and some were then paid to tell another person it was fun. Which group rated the task most enjoyable, and why?
* The $1 group, because the small payment did not justify lying, so they changed their attitude to match what they said
- The $20 group, because the larger reward made the task more pleasant
- The control group, because they did not have to lie
- The $1 and $20 groups equally, because both were paid
= Festinger and Carlsmith's cognitive dissonance theory explains the result. The $20 group had ample justification for lying; the $1 group reduced the discomfort of acting against their attitude by deciding the task was enjoyable.

@ 4 | - | Cognitive dissonance | dissonance
Which statement best explains why the $20 group's ratings were similar to the control group's ratings?
* The large payment provided sufficient external justification, so there was little dissonance to reduce.
- The $20 group did not actually perform the task.
- The $20 group was randomly assigned to enjoy the task.
- Money always reduces how much people enjoy a task.
= Dissonance arises when behavior conflicts with attitudes and there is no adequate external reason for it. A large reward explains the behavior, so the attitude does not need to change.

@ 4 | - | Persuasion
A voter carefully compares the evidence in two candidates' policy proposals, while another votes for the candidate with the more attractive campaign ads. Which statement is correct?
* The first voter used the central route to persuasion, which tends to produce more lasting attitude change.
- The first voter used the peripheral route, which relies on careful analysis.
- Both voters used the central route.
- The second voter's attitude is likely to be more lasting.
= The elaboration likelihood model distinguishes the central route, careful evaluation of arguments, from the peripheral route, responding to cues such as attractiveness. Centrally formed attitudes are more durable.

@ 4 | - | Compliance
A salesperson first asks a customer to sign up for a free newsletter and later asks the same customer to buy a subscription. Which technique is this?
* The foot-in-the-door technique
- The door-in-the-face technique
- Normative social influence
- Group polarization
= Agreeing to a small request makes people more likely to agree to a larger one later, partly because they come to see themselves as the kind of person who agrees.

@ 4 | - | Compliance
A fundraiser asks for a $500 donation, is refused, and then asks for $25, which the person gives. Which technique is this?
* The door-in-the-face technique
- The foot-in-the-door technique
- The mere-exposure effect
- Deindividuation
= Following a large request that is refused with a smaller one makes the smaller request seem reasonable and creates pressure to reciprocate the concession.

@ 4 | - | Conformity | asch
In Asch's study, participants judged which comparison line matched the standard after several confederates unanimously gave the wrong answer, line C. About a third of the time, participants also answered C. What best explains this?
* Normative social influence, the desire to be accepted and avoid disapproval
- Informational social influence, because the task was very difficult
- Obedience to the experimenter's direct orders
- Social facilitation, because others were present
= The correct answer, B, was obvious, so participants were unlikely to doubt their own eyes. Many who conformed later said they went along to avoid standing out.

@ 4 | - | Conformity | asch
In a variation of the study shown, one confederate gives the correct answer, B, before the participant responds, while the others say C. How does conformity change?
* It drops sharply, because the group is no longer unanimous.
- It increases, because the participant sees disagreement.
- It stays the same, because the majority is still large.
- It disappears only if the confederate is a friend.
= Asch found that a single dissenter greatly reduced conformity. Unanimity is one of the strongest factors in conformity.

@ 4 | - | Obedience
In Milgram's obedience research, which change most reduced the percentage of participants who delivered the highest shock?
* Placing the learner in the same room, so the participant had to press the learner's hand onto a shock plate
- Having the experimenter wear a lab coat
- Conducting the study at a prestigious university
- Having the experimenter give orders in person rather than by phone
= Obedience fell when the victim was closer and more personal. A legitimate, nearby authority figure increased obedience.

@ 4 | - | Group influence
Students who mildly favor a policy discuss it in a group with others who share that view. Afterward, they favor it more strongly. Which concept does this illustrate?
* Group polarization
- Groupthink
- Social loafing
- Deindividuation
= Discussion among like-minded people tends to strengthen their shared opinions. Groupthink, by contrast, is a desire for harmony that leads a group to make poor decisions by suppressing dissent.

@ 4 | - | Group influence
A leadership team, wanting to keep the peace and confident in its success, dismisses warnings about a product's flaws and launches it, with disastrous results. Which concept best explains this decision?
* Groupthink
- Group polarization
- Social facilitation
- The mere-exposure effect
= Groupthink occurs when the desire for agreement overrides realistic evaluation of alternatives. Assigning someone to argue against a plan and inviting outside experts can help prevent it.

@ 4 | - | Social facilitation
An expert pianist performs better in front of an audience, while a beginner performs worse. Which concept explains both outcomes?
* Social facilitation, in which the presence of others strengthens dominant responses
- Social loafing, in which individuals exert less effort in groups
- Deindividuation, in which people lose self-awareness in groups
- Groupthink, in which people value harmony over accuracy
= An audience increases arousal, which improves performance on well-learned tasks and impairs performance on difficult or new ones.

@ 4 | - | Social loafing | loafing
Which concept is best illustrated by the graph?
* Social loafing
- Social facilitation
- Group polarization
- Obedience
= Individual effort declines as group size increases, because each person's contribution is less identifiable and responsibility feels shared.

@ 4 | - | Deindividuation
Fans wearing identical masks in a large crowd vandalize property in ways they would never do alone. Which concept best explains this behavior?
* Deindividuation
- Social facilitation
- The foot-in-the-door technique
- An internal locus of control
= Group situations that provide arousal and anonymity can reduce self-awareness and self-restraint, a state called deindividuation.

@ 4 | - | Bystander effect | bystander
Which concept best explains the pattern in the graph?
* Diffusion of responsibility: the more others who could help, the less responsible each person feels.
- Social facilitation: the presence of others improves performance.
- Groupthink: the group decided not to help.
- The just-world phenomenon: participants believed the victim deserved it.
= Darley and Latané's research on the bystander effect found that people are less likely to help when others are present, because responsibility seems to be shared among them.

@ 4 | - | Research design | bystander
In the study shown, what are the independent and dependent variables?
* The independent variable is the number of other listeners participants believed were present; the dependent variable is whether they sought help.
- The independent variable is whether participants sought help; the dependent variable is the number of listeners.
- The independent variable is the seizure; the dependent variable is the participants' anxiety.
- Both variables are the number of listeners.
= The researchers manipulated how many others participants believed were present and measured whether, and how quickly, participants sought help.

@ 4 | - | Reducing conflict
At a summer camp, two rival groups of boys who had grown hostile became friendly after working together to fix the camp's broken water supply. Which concept explains the change?
* Superordinate goals, which require cooperation between groups
- Group polarization, which strengthened their views
- Deindividuation, which reduced their self-awareness
- The mere-exposure effect alone
= In Sherif's Robbers Cave study, simple contact did not reduce hostility, but shared goals that neither group could achieve alone did.

@ 4 | - | Psychodynamic theory
After being criticized by a boss, an employee goes home and yells at their dog. Which defense mechanism does this illustrate?
* Displacement
- Projection
- Sublimation
- Regression
= Displacement redirects an impulse, here anger, from its true target to a safer one. Freud proposed defense mechanisms as unconscious ways the ego reduces anxiety.

@ 4 | - | Psychodynamic theory
A person who feels strong unacknowledged hostility toward a sibling becomes excessively and showily affectionate toward that sibling. Which defense mechanism does this illustrate?
* Reaction formation
- Displacement
- Rationalization
- Denial
= In reaction formation, the ego turns an unacceptable impulse into its opposite. The exaggerated quality of the affection is a typical sign.

@ 4 | - | Personality assessment
Which criticism is most often made of projective tests such as the Rorschach inkblot test?
* They have low reliability and validity, because scoring depends heavily on the examiner's interpretation.
- They take too little time to administer.
- They ask direct questions that people answer dishonestly.
- They measure only the five broad personality traits.
= Projective tests ask people to interpret ambiguous stimuli and are meant to reveal unconscious motives. Different examiners often score the same responses differently, and scores predict behavior poorly.

@ 4 | - | Humanistic theory
A therapist accepts a client fully, without judging the client's feelings or behavior, and listens empathetically. According to Carl Rogers, what is the purpose of this approach?
* To provide unconditional positive regard, which helps the client move toward a healthy self-concept and self-actualization
- To uncover repressed childhood conflicts
- To reinforce the client's adaptive behaviors with rewards
- To identify the client's dominant traits
= Rogers believed that genuineness, acceptance, and empathy help people develop a congruent self-concept and grow toward their potential.

@ 4 | - | Motivation | maslow
According to the hierarchy shown, which need would someone stranded without food or water be expected to focus on first?
* Physiological needs
- Safety needs
- Love and belonging
- Esteem
= Maslow proposed that needs at the base of the pyramid, such as hunger and thirst, must be met before people are strongly motivated by higher needs.

@ 4 | - | Motivation | maslow
Which statement is a common criticism of the hierarchy shown?
* People sometimes pursue higher needs, such as creative work or helping others, even when lower needs are unmet.
- The hierarchy ignores biological needs entirely.
- The hierarchy places self-actualization at the bottom.
- The hierarchy was developed from controlled laboratory experiments.
= Critics note that the order of needs is not fixed: people risk safety for principles or create art in poverty. Maslow's ideas also came from studying selected individuals rather than experiments.

@ 4 | - | Social-cognitive theory
A student's anxiety about speaking leads them to avoid class discussions, which keeps them from gaining confidence, which increases their anxiety. Which concept from Bandura best describes this pattern of mutual influence?
* Reciprocal determinism
- Unconditional positive regard
- The collective unconscious
- Reaction formation
= Bandura proposed that behavior, personal factors such as thoughts and feelings, and the environment all influence one another.

@ 4 | - | Self-efficacy
After successfully finishing several difficult practice problems, a student feels confident they can master the next unit and works harder. Which concept does this describe?
* Self-efficacy
- Self-serving bias
- Reaction formation
- An external locus of control
= Self-efficacy is a person's belief in their ability to succeed at a specific task. Past successes are one of its strongest sources, and it affects effort and persistence.

@ 4 | - | Trait theory | bigFive
Based on the table, which person is most likely to experience frequent anxiety and mood swings?
* L
- J
- K
- None, because the table does not measure emotional stability
= Neuroticism, the opposite of emotional stability, reflects a tendency toward anxiety, worry, and mood changes. L scores at the 96th percentile on this trait.

@ 4 | - | Trait theory | bigFive
Based on the table, which person is most likely to be organized, careful, and reliable about meeting deadlines?
* J
- K
- L
- K and L equally
= Conscientiousness describes organization, discipline, and dependability. J is at the 94th percentile, while K, who is highly extraverted and open, is low on conscientiousness.

@ 4 | - | Trait theory
Which statistical technique did researchers use to identify the clusters of related behaviors that became the five-factor model of personality?
* Factor analysis
- Random assignment
- A t-test comparing two groups
- Meta-analysis
= Factor analysis identifies groups of items that correlate with one another, revealing underlying factors such as extraversion and conscientiousness.

@ 4 | - | Arousal theory | yerkes
Based on the graph, when would a student most likely perform best on a difficult, unfamiliar exam?
* At a relatively low to moderate level of arousal
- At the highest possible level of arousal
- At no arousal at all
- At the same level of arousal that is best for a simple task
= The Yerkes–Dodson law states that performance is best at a moderate level of arousal, and that the best level is lower for complex tasks than for simple ones.

@ 4 | - | Intrinsic and extrinsic motivation
Children who loved drawing were promised a reward for drawing. Later, when no reward was offered, they drew less than children who had never been rewarded. Which concept does this illustrate?
* The overjustification effect
- Drive-reduction theory
- Self-actualization
- Arousal theory
= Offering an external reward for an activity that is already enjoyable can reduce intrinsic motivation, as people begin to see the reward as their reason for doing it.

@ 4 | - | Theories of emotion | emotion
Which theory of emotion does the diagram represent?
* The Schachter–Singer two-factor theory
- The James–Lange theory
- The Cannon–Bard theory
- The facial feedback hypothesis
= The two-factor theory holds that emotion requires both physiological arousal and a cognitive label for it. The same arousal could be labeled as fear or excitement depending on the situation.

@ 4 | - | Theories of emotion
A hiker sees a snake, notices their heart pounding, and then feels afraid. Which theory of emotion best fits the order of these events?
* The James–Lange theory
- The Cannon–Bard theory
- The two-factor theory
- The Yerkes–Dodson law
= The James–Lange theory proposes that emotion is the awareness of the body's physiological response. The Cannon–Bard theory proposes that the bodily response and the emotion occur at the same time and independently.

@ 4 | - | Emotional expression
Participants who held a pen between their teeth, which forces a smile, rated cartoons as funnier than participants who held a pen between their lips. Which concept does this support?
* The facial feedback hypothesis
- The two-factor theory
- Display rules
- The overjustification effect
= The facial feedback hypothesis proposes that facial expressions can influence the emotions people feel, not just express them. Some replications have found smaller effects than the original study.

@ 5 | - | Stress | gas
In the graph, which phase is characterized by the body's high, sustained mobilization against a continuing stressor?
* B, the resistance phase
- A, the alarm reaction
- C, the exhaustion phase
- The normal level before the stressor
= Selye's general adaptation syndrome has three phases. In the alarm reaction, the sympathetic system activates; in resistance, stress hormones keep the body mobilized; in exhaustion, the body's reserves are depleted.

@ 5 | - | Stress | gas
According to the model shown, why is a person more vulnerable to illness during phase C?
* Prolonged release of stress hormones depletes the body's resources and suppresses the immune system.
- The person's sympathetic system has not yet activated.
- The stressor has ended, so the body stops producing white blood cells.
- The person's resistance is at its highest point.
= Chronic stress keeps stress hormones such as cortisol elevated, which over time weakens the immune response and wears down the body.

@ 5 | - | Coping
A student who is anxious about failing a class makes a study schedule and meets with the teacher for extra help. Which kind of coping is this?
* Problem-focused coping
- Emotion-focused coping
- Displacement
- Learned helplessness
= Problem-focused coping attacks the stressor directly by changing the situation. Emotion-focused coping, such as seeking comfort from friends, manages the emotional reaction, which is useful when a stressor cannot be changed.

@ 5 | - | Stress and health
Research on Type A behavior has found that one component is most strongly linked to heart disease. Which component is it?
* Hostility, especially anger
- Competitiveness at work
- A fast speaking pace
- Being highly organized
= Of the Type A traits, hostility and frequent anger are most consistently associated with heart disease, likely because of repeated activation of stress responses.

@ 5 | - | Responses to stress
After a stressful day, a person seeks out friends and family and takes care of their children rather than fighting or fleeing. Which concept describes this response?
* The tend-and-befriend response
- The fight-or-flight response
- The general adaptation syndrome
- Learned helplessness
= The tend-and-befriend response describes coping with stress by nurturing others and seeking social support. It has been observed especially, but not only, in women.

@ 5 | - | Correlation | scatter
Which conclusion is best supported by the scatterplot?
* There is a positive correlation between stressful events and illness, but the data alone cannot show that stress causes illness.
- Stressful events cause illness.
- There is a negative correlation between stressful events and illness.
- Stressful events and illness are unrelated.
= The points rise from lower left to upper right, a positive correlation. Correlation does not establish causation: illness might cause stress, or a third factor, such as poverty, might increase both.

@ 5 | - | Correlation | scatter
Which correlation coefficient best describes the data in the scatterplot?
* \(+0.8\)
- \(-0.8\)
- \(+0.1\)
- \(+1.0\)
= The relationship is clearly positive and fairly strong, but the points do not fall on a single line. A coefficient of \(+1.0\) would require a perfect straight-line relationship, and \(+0.1\) would show almost no relationship.

@ 5 | - | Positive psychology
Participants who wrote down three things they were grateful for each week reported greater well-being after two months than participants who wrote about neutral events. Which field of psychology is most interested in such findings?
* Positive psychology, which studies human strengths and well-being
- Psychodynamic psychology, which studies unconscious conflicts
- Behavioral genetics, which studies heredity
- Abnormal psychology, which studies disorders
= Positive psychology studies the factors that help people flourish, such as gratitude, optimism, and character strengths, rather than focusing only on illness.

@ 5 | - | Resilience
Some people who survive serious trauma report deeper relationships, a greater appreciation for life, and a stronger sense of personal strength afterward. Which concept does this describe?
* Posttraumatic growth
- Posttraumatic stress disorder
- Reaction formation
- The general adaptation syndrome
= Posttraumatic growth refers to positive psychological change that can follow a struggle with trauma. It can coexist with distress and does not mean the trauma was good.

@ 5 | - | Classifying disorders
What is the main purpose of the Diagnostic and Statistical Manual of Mental Disorders, or DSM?
* To provide standardized criteria so that clinicians can diagnose disorders consistently
- To explain the causes of each psychological disorder
- To prescribe a specific treatment for each disorder
- To measure intelligence and personality
= The DSM describes symptoms and criteria for diagnosis. It improves reliability, the agreement among clinicians, but it generally does not explain causes or prescribe treatments.

@ 5 | - | Perspectives on disorders
A person with a family history of depression develops the disorder only after losing a job and going through a divorce. Which model best explains this?
* The diathesis–stress model
- The medical model alone
- The psychodynamic model alone
- The humanistic model alone
= The diathesis–stress model proposes that a predisposition, such as a genetic vulnerability, combines with environmental stressors to produce a disorder. It is one form of the biopsychosocial approach.

@ 5 | - | Defining abnormality
A person washes their hands for three hours a day, which causes great distress and keeps them from holding a job. Which feature most clearly indicates that the behavior reflects a psychological disorder?
* It is significantly distressing and interferes with daily functioning.
- It is unusual in the general population.
- It would be unusual in any culture.
- It involves a behavior that most people perform.
= Clinicians judge whether behavior reflects a disorder by significant disturbance in thoughts, emotions, or behavior, usually with distress or impaired functioning. Rarity alone is not enough, since many rare traits are healthy.

@ 5 | - | Labeling
In Rosenhan's study, healthy people admitted to psychiatric hospitals after reporting hearing voices behaved normally afterward, yet staff interpreted their ordinary behaviors, such as note-taking, as symptoms. What concern did this study raise?
* Diagnostic labels can bias how others interpret a person's behavior.
- Psychological disorders are always easy to diagnose.
- Hearing voices is a normal experience.
- Hospital staff are better at diagnosis than other clinicians.
= Once labeled, the pseudopatients' normal behavior was seen through the lens of their diagnosis. Labels can also bring stigma, though they are needed to guide treatment.

@ 5 | - | Depressive disorders | cases
Which diagnosis best fits client A in the table?
* Major depressive disorder
- Bipolar disorder
- Generalized anxiety disorder
- Persistent depressive disorder
= Major depressive disorder requires at least five symptoms, including depressed mood or loss of interest, nearly every day for at least two weeks. Client A shows these symptoms for a month; persistent depressive disorder requires milder symptoms lasting at least two years.

@ 5 | - | Anxiety disorders | cases
Which diagnosis best fits client B in the table?
* Panic disorder
- Generalized anxiety disorder
- Specific phobia
- Obsessive-compulsive disorder
= Panic disorder involves recurrent, unexpected panic attacks with intense physical symptoms, followed by persistent worry about further attacks. Generalized anxiety disorder involves constant, unfocused worry rather than sudden attacks.

@ 5 | - | Schizophrenia | cases
Which diagnosis best fits client C in the table?
* Schizophrenia
- Dissociative identity disorder
- Bipolar disorder
- Obsessive-compulsive disorder
= Client C shows hallucinations (voices), delusions (thought insertion), and disorganized speech for more than six months. These are positive symptoms of schizophrenia. Dissociative identity disorder involves distinct identities, not hallucinations.

@ 5 | - | Schizophrenia
Which of the following is a negative symptom of schizophrenia?
* Flat affect, showing little emotional expression
- Hearing voices that others do not hear
- Believing one is being followed by spies
- Speaking in a jumbled, disorganized way
= Negative symptoms involve the absence of normal behaviors, such as flat affect or lack of motivation. Hallucinations and delusions are positive symptoms because they add abnormal experiences.

@ 5 | - | Causes of schizophrenia
Which finding supports the dopamine hypothesis of schizophrenia?
* Drugs that block dopamine receptors reduce hallucinations and delusions.
- People with schizophrenia have unusually low dopamine activity in all brain regions.
- Increasing serotonin cures schizophrenia.
- Schizophrenia occurs only in people with no family history of the disorder.
= Antipsychotic drugs reduce positive symptoms by blocking dopamine receptors, and drugs that increase dopamine, such as amphetamines, can produce psychotic symptoms.

@ 5 | - | Bipolar disorder
For a week, a person sleeps only two hours a night, talks rapidly, spends thousands of dollars impulsively, and believes they are destined for fame. Months earlier, the person experienced a period of severe depression. Which disorder is most likely?
* Bipolar I disorder
- Major depressive disorder
- Generalized anxiety disorder
- Antisocial personality disorder
= The person shows a manic episode: decreased need for sleep, pressured speech, risky behavior, and grandiosity. Episodes of mania, often alternating with depression, define bipolar disorder.

@ 5 | - | Anxiety disorders
For more than six months, a person has felt worried and tense about many everyday matters, such as work, health, and money, and has trouble sleeping and concentrating. Which disorder is most likely?
* Generalized anxiety disorder
- Panic disorder
- Specific phobia
- Posttraumatic stress disorder
= Generalized anxiety disorder involves excessive, hard-to-control worry about many matters, lasting at least six months. The anxiety is not tied to one object or situation.

@ 5 | - | Obsessive-compulsive disorder
A person is tormented by intrusive thoughts that the door is unlocked and feels driven to check it dozens of times before leaving home. Which disorder do these symptoms best fit?
* Obsessive-compulsive disorder
- Generalized anxiety disorder
- Specific phobia
- Dissociative amnesia
= Obsessions are unwanted, persistent thoughts that cause anxiety; compulsions are repetitive behaviors performed to reduce that anxiety.

@ 5 | - | Trauma-related disorders
Months after a serious car accident, a person has vivid flashbacks and nightmares, avoids driving, and startles easily. Which disorder is most likely?
* Posttraumatic stress disorder
- Panic disorder
- Specific phobia of cars
- Major depressive disorder
= PTSD follows exposure to trauma and includes intrusive memories, avoidance of reminders, negative changes in mood and thinking, and heightened arousal, lasting more than a month.

@ 5 | - | Dissociative disorders
After a traumatic event, a person suddenly cannot remember important personal information, including their name, though no brain injury is found. Which disorder is most likely?
* Dissociative amnesia
- Dissociative identity disorder
- Schizophrenia
- Retrograde amnesia caused by a concussion
= Dissociative disorders involve a disruption of consciousness, memory, or identity, often linked to trauma. Dissociative amnesia is an inability to recall personal information that cannot be explained by ordinary forgetting or injury.

@ 5 | - | Feeding and eating disorders
A teenager of normal weight repeatedly eats large amounts of food in a short time and then vomits to prevent weight gain. Which disorder is most likely?
* Bulimia nervosa
- Anorexia nervosa
- Binge-eating disorder
- Obsessive-compulsive disorder
= Bulimia nervosa involves cycles of binge eating followed by compensatory behaviors such as vomiting, often at a normal weight. Anorexia nervosa involves severe restriction and significantly low body weight.

@ 5 | - | Personality disorders
An adult has a long history of lying, stealing, and harming others without showing remorse, beginning in adolescence. Which disorder is most likely?
* Antisocial personality disorder
- Borderline personality disorder
- Bipolar disorder
- Schizophrenia
= Antisocial personality disorder involves a persistent disregard for others' rights and a lack of remorse. Personality disorders are enduring patterns that impair functioning.

@ 5 | - | Neurodevelopmental disorders
A 7-year-old has persistent difficulty sustaining attention, often fidgets, and interrupts others at home and at school. Which diagnosis is most likely, and how is it classified?
* Attention-deficit/hyperactivity disorder, a neurodevelopmental disorder
- Autism spectrum disorder, an anxiety disorder
- Conduct disorder, a mood disorder
- Generalized anxiety disorder, a neurodevelopmental disorder
= ADHD involves inattention and hyperactivity-impulsivity that appear in more than one setting and begin in childhood. Neurodevelopmental disorders, including ADHD and autism spectrum disorder, emerge early in development.

@ 5 | - | Statistics | skewed
The distribution shown is positively skewed. Which marked line represents the mean?
* R
- P
- Q
- The mean cannot be determined from a skewed distribution.
= The few very high scores pull the mean toward the long right tail. P marks the mode, the most common score, and Q the median; in a positively skewed distribution the mean is greatest.

@ 5 | - | Statistics | skewed
A researcher wants to report the typical score in the distribution shown. Which measure is most appropriate, and why?
* The median, because it is not pulled toward the extreme scores in the tail
- The mean, because it uses every score
- The range, because it shows the spread of scores
- The mean, because the distribution is normal
= In skewed distributions, the median better represents the typical case, because extreme scores inflate the mean.

@ 5 | - | Psychodynamic therapy
A therapist asks a client to say whatever comes to mind and notes that the client has begun reacting to the therapist with the anger once directed at a parent. Which therapeutic approach is this?
* Psychodynamic therapy, using free association and interpreting transference
- Client-centered therapy, using active listening
- Behavior therapy, using systematic desensitization
- Cognitive therapy, using disputation of irrational beliefs
= Psychodynamic therapy seeks insight into unconscious conflicts. Transference occurs when the client directs feelings about important people from the past toward the therapist.

@ 5 | - | Humanistic therapy
A therapist restates and clarifies a client's feelings, saying, "It sounds like you felt hurt when your friend ignored you," without offering advice. Which technique is this?
* Active listening, a technique of client-centered therapy
- Free association, a technique of psychodynamic therapy
- Systematic desensitization, a technique of behavior therapy
- Aversive conditioning, a technique of behavior therapy
= In Rogers' nondirective approach, the therapist echoes, restates, and clarifies, conveying empathy and acceptance so that the client can gain self-understanding.

@ 5 | - | Behavior therapy
A therapist teaches a client with a fear of spiders to relax deeply and then has the client imagine a series of increasingly frightening spider scenes while staying relaxed. Which treatment is this?
* Systematic desensitization
- Aversive conditioning
- A token economy
- Free association
= Systematic desensitization is a form of exposure therapy based on counterconditioning: relaxation, which is incompatible with anxiety, is paired with a gradual hierarchy of feared stimuli.

@ 5 | - | Behavior therapy
On a hospital ward, patients earn points for making their beds and attending group sessions, and they can exchange the points for privileges. Which technique is this?
* A token economy, based on operant conditioning
- Aversive conditioning, based on classical conditioning
- Exposure therapy, based on classical conditioning
- Cognitive restructuring
= A token economy reinforces desired behaviors with tokens that can be exchanged for rewards. It is an application of operant conditioning principles.

@ 5 | - | Cognitive therapy
A therapist helps a client recognize the automatic thought "I failed one test, so I'm a total failure" and test whether the evidence supports it. Which approach is this?
* Cognitive therapy, as developed by Aaron Beck
- Psychodynamic therapy
- Client-centered therapy
- Systematic desensitization
= Beck's cognitive therapy targets distorted automatic thoughts, such as overgeneralization, that contribute to depression. Cognitive-behavioral therapy combines this with changing behavior.

@ 5 | - | Evaluating therapy | therapy
Why did the researchers include a waitlist control group in the study shown?
* To show how much symptoms change over time without therapy, such as through natural recovery or the passage of time
- To ensure that every participant eventually received medication
- To measure the participants' intelligence
- To increase the number of participants receiving therapy
= Some people improve without treatment. Comparing the therapy group with a control group shows how much of the improvement can be attributed to the therapy itself.

@ 5 | - | Research design | therapy
The participants in the study shown were randomly assigned to the two groups. Why is random assignment important here?
* It makes the groups likely to be similar at the start, so differences at week 12 can be attributed to the therapy.
- It ensures the sample represents the entire population.
- It guarantees that every participant improves.
- It allows the researchers to choose who receives therapy.
= Random assignment controls for confounding variables, such as motivation or severity, by distributing them evenly across groups. Random sampling, by contrast, affects how well results generalize to a population.

@ 5 | - | Biomedical therapies | drugs
Long-term use of one medication class in the table can cause tardive dyskinesia, involuntary movements of the face and tongue. Which class is it?
* Antipsychotics
- SSRIs
- Lithium
- Benzodiazepines
= Older antipsychotics block dopamine receptors, including in brain areas that control movement. Over time, this can produce tardive dyskinesia.

@ 5 | - | Biomedical therapies | drugs
Based on the table, which medication is a client with alternating episodes of mania and depression most likely to be prescribed?
* Lithium
- SSRIs alone
- Antipsychotics alone
- Benzodiazepines
= Lithium, a mood stabilizer, reduces the extreme highs and lows of bipolar disorder. An antidepressant alone can sometimes trigger mania in people with bipolar disorder.

@ 5 | - | Biomedical therapies
A patient with severe depression has not improved after trying several medications and therapy. Which treatment might a psychiatrist consider next?
* Electroconvulsive therapy, in which a brief electrical current is applied to the brain under anesthesia
- A token economy
- Free association
- A lobotomy
= Electroconvulsive therapy is used mainly for severe depression that has not responded to other treatments, and it is often effective, though it can cause short-term memory loss. Lobotomies are no longer performed.

@ 5 | - | Anxiety disorders
A person is so afraid of being in crowds, on public transportation, and in open places where escape might be difficult that they have not left home in months. Which disorder is most likely?
* Agoraphobia
- Specific phobia
- Social anxiety disorder
- Generalized anxiety disorder
= Agoraphobia is fear and avoidance of situations in which escape might be difficult or help unavailable, often leading people to stay home. A specific phobia, by contrast, is focused on one object or situation, such as heights or dogs.

@ 5 | - | Approaches to treatment
A therapist treating a teenager's eating disorder meets with the whole family to change patterns of communication that may maintain the problem. Which approach is this?
* Family therapy, which treats the family as a system
- Psychodynamic therapy, which focuses on transference
- Aversive conditioning
- Biomedical therapy
= Family therapy assumes that a person's problems are influenced by, and influence, the people around them. Changing how family members interact can support recovery.
`;

module.exports = { source, figures };
