// AP U.S. Government and Politics free-response practice: eight original questions, one full
// set of four for each of the 2025 (Set 1) and 2026 released exams, each modeled on the released
// question type with the same point total (3, 4, 4, 6). Charts use hypothetical data and say so.
// SCOTUS comparisons pair a required case with a real non-required case, described accurately.
const { chart, graph } = require('../ap-mcq-build/figures.cjs');
const { pt, part, fig } = require('./frq-helpers.cjs');

const BLUE = '#3b82f6', PINK = '#ec4899';
const URL = (year, set) => `https://apcentral.collegeboard.org/media/pdf/ap${String(year).slice(2)}-frq-us-gov-pol${set ? `-set-${set}` : ''}.pdf`;
const modeled = (year, n, type, set) => ({ year, ...(set ? { set } : {}), question: n, type, label: `${year} AP U.S. Government and Politics${set ? ` Set ${set}` : ''} Question ${n} (${type})`, url: URL(year, set) });

// The argument essay rubric (Rows A–D) as six independent points.
function essayPoints(id, topic, listed) {
  return [
    pt(`${id}-a1`, 'claim', `Responds to the prompt with a defensible claim or thesis about ${topic} that establishes a line of reasoning.`, ['restates the prompt', 'takes no position'], 'States a position and previews why, such as the reasons it will develop.', 'Restates the question as a statement.'),
    pt(`${id}-b1`, 'evidence', 'Provides at least one piece of evidence relevant to the topic of the prompt.', ['gives evidence unrelated to the topic'], 'Accurately describes one relevant constitutional provision, document, or political example.', 'Refers to the topic in general terms only.'),
    pt(`${id}-b2`, 'evidence', 'Uses one piece of specific and relevant evidence to support the claim, or provides two pieces of relevant evidence.', ['lists evidence without tying it to the claim'], 'Uses a specific provision or example and shows how it supports the thesis.', 'Mentions a document without explaining what it says.'),
    pt(`${id}-b3`, 'evidence', `Uses two pieces of specific and relevant evidence to support the claim, one of which comes from a listed foundational document (${listed}). Requires a defensible claim.`, ['uses no listed document', 'uses two pieces from course concepts only'], 'Uses a listed document accurately plus a second specific piece of evidence, each supporting the thesis.', 'Uses two examples, neither from the list.'),
    pt(`${id}-c1`, 'reasoning', 'Uses reasoning (classification, process, causation, or comparison) to explain how or why the evidence supports the claim.', ['states evidence and claim with no connection'], 'Explains why the evidence leads to the conclusion, for example by showing a cause-and-effect relationship.', 'Repeats the evidence.'),
    pt(`${id}-d1`, 'rebuttal', 'Describes an opposing or alternate perspective and responds to it with rebuttal, concession, or refutation. Requires a defensible claim.', ['states the opposite view without responding', 'rebuts a document instead of a perspective'], 'Presents the strongest opposing argument and explains why it is less persuasive.', '“Some people disagree.”'),
  ];
}

const frqs = [];

// ════════════════ Set modeled on the 2025 exam (Set 1) ════════════════

// ── 1. Concept application (2025 Q1) ──
frqs.push({
  id: 'gov-concept-veto', questionNumber: 1, title: 'A Vetoed Infrastructure Bill', topic: 'Concept Application · Checks and balances between Congress and the president',
  modeledOn: modeled(2025, 1, 'Concept Application', 1), timeAllottedMin: 20, calculatorAllowed: false,
  prompt: 'After months of negotiation, both chambers of Congress passed a bill to fund state highway repairs. The House and Senate were controlled by one party, and the president belonged to the other party. The president rejected the bill, arguing that it spent too much. The House then voted 301 to 128 to pass the bill again, but in the Senate the vote was 61 to 39, and the bill did not become law.',
  parts: [
    part('A', 'Describe the presidential power used in the scenario.', [
      pt('gov-concept-veto-a1', 'concept', 'Describes the veto: the president’s constitutional power to reject a bill passed by Congress, returning it unsigned with objections.', ['calls it an executive order', 'describes a pocket veto when Congress voted again'], 'The president used the veto, refusing to sign the bill and sending it back to Congress.', 'The president issued an executive order.'),
    ]),
    part('B', 'Explain why the bill did not become law even though a majority in both chambers voted for it again.', [
      pt('gov-concept-veto-b1', 'concept', 'Explains that overriding a veto requires a two-thirds vote in both chambers; the House reached two-thirds (301 of 429), but the Senate’s 61 votes fell short of the 67 needed.', ['says a simple majority overrides', 'says the House fell short'], 'An override requires two-thirds of each chamber. The House cleared it, but 61 senators is fewer than the 67 required.', 'The Supreme Court struck it down.'),
    ]),
    part('C', 'Explain how divided government contributed to the outcome in the scenario.', [
      pt('gov-concept-veto-c1', 'concept', 'Explains that with Congress and the presidency controlled by different parties, the president had partisan incentives to block the majority’s bill, and the minority party in the Senate held enough seats to sustain the veto.', ['defines divided government without applying it'], 'Because the president was from the other party, he opposed the majority’s spending plan, and enough senators from his party voted with him to sustain the veto.', 'Divided government is when parties split control.'),
    ]),
  ],
  sampleResponse: 'A The president used the veto, the constitutional power to reject a bill and return it to Congress unsigned. B Overriding a veto requires a two-thirds vote in both chambers. The House’s 301 votes met that threshold, but the Senate’s 61 votes were short of the 67 needed, so the veto was sustained. C Under divided government, the president’s party opposed the majority’s bill. The president had a partisan reason to veto it, and the minority party in the Senate had enough votes to prevent an override.',
});

// ── 2. Quantitative analysis (2025 Q2) ──
frqs.push({
  id: 'gov-quant-turnout-age', questionNumber: 2, title: 'Turnout by Age Group', topic: 'Quantitative Analysis · Voting behavior and participation',
  modeledOn: modeled(2025, 2, 'Quantitative Analysis', 1), timeAllottedMin: 20, calculatorAllowed: false,
  prompt: 'The bar graph shows voter turnout by age group in a presidential election year and in the following midterm election year. The data are hypothetical, created for this practice question.',
  figures: [fig('Figure 1', chart({ title: 'Voter turnout by age group (hypothetical data)', categories: ['18–29', '30–44', '45–64', '65+'], series: [{ name: 'Presidential year (%)', values: [48, 58, 68, 72], color: BLUE }, { name: 'Midterm year (%)', values: [24, 38, 52, 62], color: PINK }], ymax: 80, ystep: 20, alt: 'Grouped bar graph of hypothetical voter turnout by age group. Presidential year: ages 18 to 29, 48 percent; 30 to 44, 58 percent; 45 to 64, 68 percent; 65 and over, 72 percent. Midterm year: 24, 38, 52, and 62 percent' }))],
  parts: [
    part('A', 'Identify the turnout of voters aged 18–29 in the midterm year.', [
      pt('gov-quant-turnout-age-a1', 'data-analysis', 'Identifies 24 percent.', ['reports the presidential-year value (48%)'], '24%.', '48%.'),
    ]),
    part('B', 'Describe a pattern in the data.', [
      pt('gov-quant-turnout-age-b1', 'data-analysis', 'Describes a pattern such as turnout rising with age in both years, or turnout being lower in the midterm year for every age group.', ['describes a single value only'], 'In both years, turnout increases with each older age group.', 'Young people voted 48%.'),
    ]),
    part('C', 'Draw a conclusion about how a candidate’s campaign could use the pattern you described in part B.', [
      pt('gov-quant-turnout-age-c1', 'data-analysis', 'Draws a plausible conclusion, such as a midterm campaign focusing outreach and issues on older voters, or investing in get-out-the-vote drives for younger voters.', ['restates the data without a conclusion'], 'Because older voters turn out at higher rates, a midterm campaign would emphasize issues such as Social Security to win their votes.', 'Older people vote more.'),
    ]),
    part('D', 'Explain how a factor that influences political participation could account for the difference in turnout between the youngest and oldest voters.', [
      pt('gov-quant-turnout-age-d1', 'data-analysis', 'Explains a factor such as older voters having more stable residences (registration is easier), stronger party identification, greater political efficacy, or more experience voting.', ['names a factor without connecting it to age'], 'Young voters move often, so they must re-register more frequently, which lowers their turnout compared with older voters who have lived in one place for years.', 'Young people do not care.'),
    ]),
  ],
  sampleResponse: 'A 24 percent. B In both years, turnout rises with age, from the 18–29 group to the 65+ group. C A midterm campaign would focus its resources and messages on older voters, who make up a larger share of the people who actually vote in midterms. D Younger voters move more often and must re-register after each move, which raises the cost of voting; older voters with stable residences face fewer barriers, so they turn out at higher rates.',
});

// ── 3. SCOTUS comparison (2025 Q3) ──
frqs.push({
  id: 'gov-scotus-student-speech', questionNumber: 3, title: 'Student Speech: Tinker and Morse', topic: 'SCOTUS Comparison · First Amendment speech in public schools',
  modeledOn: modeled(2025, 3, 'SCOTUS Comparison', 1), timeAllottedMin: 20, calculatorAllowed: false,
  prompt: 'In 2002, students in Juneau, Alaska, were released from class to watch the Olympic torch relay pass their school. A high school student unfurled a 14-foot banner reading “BONG HiTS 4 JESUS” across the street. The principal confiscated the banner and suspended the student, who sued, arguing that his speech was protected. In Morse v. Frederick (2007), the Supreme Court ruled 5–4 that the school did not violate the student’s rights, because schools may restrict student speech at a school-supervised event that can reasonably be viewed as promoting illegal drug use. Base your response on the description of Morse v. Frederick and your knowledge of Tinker v. Des Moines Independent Community School District (1969).',
  parts: [
    part('A', 'Identify the constitutional provision that is the basis for both Tinker v. Des Moines and Morse v. Frederick.', [
      pt('gov-scotus-student-speech-a1', 'case-analysis', 'Identifies the First Amendment’s free speech clause (applied to the states through the Fourteenth Amendment).', ['identifies the Fourth Amendment', 'identifies the establishment clause'], 'The free speech clause of the First Amendment.', 'The Fourth Amendment.'),
    ]),
    part('B', 'Explain how the facts in Tinker v. Des Moines and Morse v. Frederick led to different holdings.', [
      pt('gov-scotus-student-speech-b1', 'case-analysis', 'Describes relevant facts or the holding of Tinker: students wore black armbands to protest the Vietnam War, and the Court held this symbolic political speech was protected because it did not substantially disrupt school.', ['confuses Tinker with a flag-burning case'], 'In Tinker, students wore armbands to protest the Vietnam War, and the Court ruled that students do not lose their free speech rights at school.', 'Tinker was about school prayer.'),
      pt('gov-scotus-student-speech-b2', 'case-analysis', 'Explains the different outcomes: Tinker involved peaceful political speech that caused no substantial disruption, so it was protected; Morse involved a message reasonably read as promoting illegal drug use at a school event, which the school could restrict.', ['describes both cases without comparing their facts'], 'The armbands were political protest that did not disrupt learning, but the banner promoted drug use at a school-supervised event, so the Court allowed the school to restrict it.', 'One student won and the other lost.'),
    ]),
    part('C', 'Explain how the holding in Morse v. Frederick reflects the balance between individual liberty and social order.', [
      pt('gov-scotus-student-speech-c1', 'case-analysis', 'Explains that Morse limited a student’s individual expression to protect the school’s interest in maintaining order and discouraging illegal drug use, showing that civil liberties can be restricted when the government has a strong interest.', ['describes the case without addressing the balance'], 'The Court let the school limit one student’s speech to protect its mission of deterring drug use, favoring order over individual expression in that setting.', 'Students have rights.'),
    ]),
  ],
  sampleResponse: 'A The free speech clause of the First Amendment. B In Tinker, students wore black armbands to protest the Vietnam War; the Court held that this symbolic political speech was protected because it did not substantially disrupt the school. In Morse, the banner was displayed at a school-supervised event and could reasonably be read as promoting illegal drug use, so the Court held the school could restrict it. Peaceful political speech was protected, while pro-drug speech at a school event was not. C Morse shows the Court balancing liberty against order: it allowed a school to limit a student’s expression to protect its interest in deterring illegal drug use among students.',
});

// ── 4. Argument essay (2025 Q4) ──
frqs.push({
  id: 'gov-argument-presidential-power', questionNumber: 4, title: 'How Strong Should the Presidency Be?', topic: 'Argument Essay · Presidential power and checks and balances',
  modeledOn: modeled(2025, 4, 'Argument Essay', 1), timeAllottedMin: 40, calculatorAllowed: false,
  prompt: 'Develop an argument that explains whether the Constitution gives the president too much power or an appropriate amount of power. Use at least one piece of evidence from one of the following foundational documents: the Constitution of the United States (Article II), Federalist No. 51, Federalist No. 70. In your response you should: articulate a defensible claim or thesis that responds to the prompt and establishes a line of reasoning; support your claim with at least two pieces of specific and relevant evidence, one from a listed document and one from a different listed document or your knowledge of course concepts; use reasoning to explain why your evidence supports your claim; and respond to an opposing or alternate perspective using refutation, concession, or rebuttal.',
  parts: [
    part('Essay', 'Write your argument essay.', essayPoints('gov-argument-presidential-power', 'presidential power', 'Article II, Federalist No. 51, or Federalist No. 70')),
  ],
  sampleResponse: 'The Constitution gives the president an appropriate amount of power, because it creates an energetic executive while keeping that executive answerable to the other branches. In Federalist No. 70, Hamilton argues that “energy in the executive” is essential to good government, and that a single president can act with decision and speed in a crisis, which a committee could not. Article II reflects this by making the president commander in chief and giving the power to veto legislation. At the same time, Federalist No. 51 explains that “ambition must be made to counteract ambition”: Congress can override vetoes with two-thirds of each chamber, the Senate must confirm appointments and ratify treaties, and Congress controls spending and can impeach. Because the president has the tools to act quickly but cannot make law or spend money alone, the office is strong enough to lead without becoming dangerous. Some argue that the growth of executive orders and military action without a declaration of war shows the president has too much power. However, executive orders can be overturned by courts and later presidents, and Congress can cut off funding for military operations, so these powers remain checked; the problem is Congress choosing not to use its checks, not the Constitution’s design.',
});

// ════════════════ Set modeled on the 2026 exam ════════════════

// ── 5. Concept application (2026 Q1) ──
frqs.push({
  id: 'gov-concept-oversight', questionNumber: 1, title: 'An Agency Rule Under Scrutiny', topic: 'Concept Application · Bureaucratic discretion and congressional oversight',
  modeledOn: modeled(2026, 1, 'Concept Application'), timeAllottedMin: 20, calculatorAllowed: false,
  prompt: 'A federal agency issued a new rule requiring trucking companies to install electronic devices that limit how many hours drivers can work without rest. Congress had given the agency general authority to “promote highway safety” but had not mentioned the devices. A House committee called the agency’s director to a hearing, and several members proposed reducing the agency’s budget in the next appropriations bill. A national trucking association lobbied committee members to block the rule.',
  parts: [
    part('A', 'Describe the bureaucratic power the agency used in the scenario.', [
      pt('gov-concept-oversight-a1', 'concept', 'Describes discretionary or rule-making authority: the agency used the broad power delegated by Congress to write specific regulations that carry out the law.', ['says the agency passed a law', 'describes an executive order'], 'The agency used its rule-making authority, filling in the details of a broad law Congress passed by writing a specific regulation.', 'The agency passed a bill.'),
    ]),
    part('B', 'Explain how Congress could use one of its powers to influence the agency’s actions in the scenario.', [
      pt('gov-concept-oversight-b1', 'concept', 'Explains a check such as oversight hearings that pressure the agency, the power of the purse (cutting its budget), or passing a law that overturns the rule or narrows the agency’s authority.', ['names a power without explaining its effect'], 'Congress could use the power of the purse to cut the agency’s funding, pressuring it to delay or withdraw the rule.', 'Congress has oversight.'),
    ]),
    part('C', 'Explain how the trucking association’s actions illustrate an iron triangle.', [
      pt('gov-concept-oversight-c1', 'concept', 'Explains the mutually beneficial relationships among an interest group, a congressional committee, and an agency: the association supports committee members, who in turn shape the agency’s budget and rules in the association’s favor.', ['defines an iron triangle without applying it'], 'The trucking association lobbies and supports committee members, who use their control over the agency’s budget to push it toward rules the industry prefers.', 'An iron triangle has three parts.'),
    ]),
  ],
  sampleResponse: 'A The agency used its rule-making authority, using discretion under a broad law to write a specific regulation requiring the devices. B Congress could use the power of the purse to reduce the agency’s budget in the next appropriations bill, pressuring the agency to delay or weaken the rule. C The trucking association lobbies the committee that oversees and funds the agency; committee members, who rely on industry support, use hearings and budget threats to push the agency toward rules the industry favors, forming a mutually beneficial iron triangle.',
});

// ── 6. Quantitative analysis (2026 Q2) ──
frqs.push({
  id: 'gov-quant-trust', questionNumber: 2, title: 'Trust in the Federal Government', topic: 'Quantitative Analysis · Political attitudes and participation',
  modeledOn: modeled(2026, 2, 'Quantitative Analysis'), timeAllottedMin: 20, calculatorAllowed: false,
  prompt: 'The line graph shows the percentage of adults who say they trust the federal government to do what is right “most of the time” or “just about always.” The data are hypothetical, created for this practice question.',
  figures: [fig('Figure 1', graph({ x: [1964, 2024], y: [0, 80], xstep: 10, ystep: 20, xlabel: '', ylabel: '', xtitle: 'Year', ytitle: 'Trust in government (%) (hypothetical)', curves: [{ pts: [[1964, 76], [1974, 36], [1984, 44], [1994, 21], [2004, 36], [2014, 24], [2024, 20]] }], dots: [[1964, 76], [1974, 36], [1984, 44], [1994, 21], [2004, 36], [2014, 24], [2024, 20]].map(([x, y]) => ({ x, y })), w: 400, h: 280, alt: 'Line graph of hypothetical trust in the federal government: 76 percent in 1964, 36 in 1974, 44 in 1984, 21 in 1994, 36 in 2004, 24 in 2014, and 20 in 2024' }))],
  parts: [
    part('A', 'Identify the percentage of adults who trusted the federal government in 1984.', [
      pt('gov-quant-trust-a1', 'data-analysis', 'Identifies 44 percent (accept 42–46).', ['reads the 1974 value'], '44%.', '36%.'),
    ]),
    part('B', 'Describe the overall trend in the data from 1964 to 2024.', [
      pt('gov-quant-trust-b1', 'data-analysis', 'Describes an overall decline in trust, from 76 percent in 1964 to 20 percent in 2024, despite short increases.', ['describes only one interval'], 'Trust fell sharply overall, from 76% to 20%, with brief rebounds in the 1980s and 2000s.', 'It went up and down.'),
    ]),
    part('C', 'Draw a conclusion about how the trend could affect political participation.', [
      pt('gov-quant-trust-c1', 'data-analysis', 'Draws a plausible conclusion, such as low trust lowering turnout and efficacy, or motivating protest, outsider candidates, or interest-group activity.', ['restates the trend'], 'As trust declines, fewer people may believe voting makes a difference, lowering turnout.', 'Trust went down.'),
    ]),
    part('D', 'Explain how one event or factor could have contributed to the decline from 1964 to 1974.', [
      pt('gov-quant-trust-d1', 'data-analysis', 'Explains a factor such as the Vietnam War or the Watergate scandal, which led many Americans to believe government officials had misled them.', ['names an event from a different period without explanation'], 'The Watergate scandal revealed that the president had covered up crimes, leading many Americans to distrust national leaders.', 'Politics.'),
    ]),
  ],
  sampleResponse: 'A 44 percent. B Trust declined overall from 76% in 1964 to 20% in 2024, with temporary rebounds around 1984 and 2004. C Declining trust can reduce political efficacy, so fewer citizens may vote or contact officials because they doubt the government will respond. D The Watergate scandal showed that President Nixon’s administration had covered up illegal activity, which led many Americans to believe national leaders could not be trusted.',
});

// ── 7. SCOTUS comparison (2026 Q3) ──
frqs.push({
  id: 'gov-scotus-districting', questionNumber: 3, title: 'Drawing Districts: Baker and Rucho', topic: 'SCOTUS Comparison · Redistricting and the role of the courts',
  modeledOn: modeled(2026, 3, 'SCOTUS Comparison'), timeAllottedMin: 20, calculatorAllowed: false,
  prompt: 'Voters in North Carolina and Maryland challenged congressional district maps drawn by their state legislatures. In North Carolina, the majority party drew districts to maximize its seats; in Maryland, the other party did the same to a single district. The voters argued that these partisan gerrymanders violated their constitutional rights. In Rucho v. Common Cause (2019), the Supreme Court ruled 5–4 that claims of partisan gerrymandering present political questions that federal courts cannot decide, because there are no judicially manageable standards for deciding how much partisanship is too much. Base your response on the description of Rucho v. Common Cause and your knowledge of Baker v. Carr (1962).',
  parts: [
    part('A', 'Identify the constitutional clause that the Court relied on in Baker v. Carr.', [
      pt('gov-scotus-districting-a1', 'case-analysis', 'Identifies the equal protection clause of the Fourteenth Amendment.', ['identifies the due process clause', 'identifies the First Amendment'], 'The equal protection clause of the Fourteenth Amendment.', 'The commerce clause.'),
    ]),
    part('B', 'Explain how the facts in Baker v. Carr and Rucho v. Common Cause led to different holdings.', [
      pt('gov-scotus-districting-b1', 'case-analysis', 'Describes relevant facts or the holding of Baker: Tennessee had not redrawn its legislative districts in decades, leaving districts of very unequal population, and the Court held that such apportionment claims are justiciable.', ['says Baker banned gerrymandering'], 'In Baker, Tennessee had not redistricted since 1901, so rural and urban districts had very unequal populations; the Court ruled federal courts could hear the case.', 'Baker was about voter ID laws.'),
      pt('gov-scotus-districting-b2', 'case-analysis', 'Explains the different outcomes: unequal population could be measured with a clear standard (one person, one vote), so courts could decide it, while partisan advantage has no manageable standard, so Rucho left it to the political branches.', ['describes both cases without comparing their facts'], 'Population inequality in Baker could be measured precisely, but the Court in Rucho found no clear test for how much partisanship is unconstitutional, so it declined to decide.', 'Different justices decided them.'),
    ]),
    part('C', 'Explain how the holding in Rucho v. Common Cause reflects the concept of federalism.', [
      pt('gov-scotus-districting-c1', 'case-analysis', 'Explains that by keeping federal courts out of partisan gerrymandering disputes, Rucho leaves redistricting decisions to state legislatures, state courts, state commissions, or Congress, preserving state authority over drawing districts.', ['defines federalism without applying it'], 'Rucho left limits on partisan maps to the states, which can create independent commissions or rely on state constitutions and state courts.', 'Federalism divides power.'),
    ]),
  ],
  sampleResponse: 'A The equal protection clause of the Fourteenth Amendment. B In Baker v. Carr, Tennessee had not redrawn its districts since 1901, so districts had very unequal populations; the Court held that apportionment challenges are justiciable, opening the door to “one person, one vote.” In Rucho, voters challenged districts drawn for partisan advantage; the Court held there was no judicially manageable standard for measuring too much partisanship, so the claims were political questions. Unequal population could be measured, but partisan fairness could not. C Rucho reflects federalism because it leaves limits on partisan gerrymandering to the states, which can act through state courts, state constitutions, or independent redistricting commissions.',
});

// ── 8. Argument essay (2026 Q4) ──
frqs.push({
  id: 'gov-argument-life-tenure', questionNumber: 4, title: 'Should Federal Judges Serve for Life?', topic: 'Argument Essay · Judicial independence and accountability',
  modeledOn: modeled(2026, 4, 'Argument Essay'), timeAllottedMin: 40, calculatorAllowed: false,
  prompt: 'Develop an argument that explains whether federal judges should continue to serve with life tenure during good behavior. Use at least one piece of evidence from one of the following foundational documents: the Constitution of the United States (Article III), Federalist No. 78, Brutus No. 1. In your response you should: articulate a defensible claim or thesis that responds to the prompt and establishes a line of reasoning; support your claim with at least two pieces of specific and relevant evidence, one from a listed document and one from a different listed document or your knowledge of course concepts; use reasoning to explain why your evidence supports your claim; and respond to an opposing or alternate perspective using refutation, concession, or rebuttal.',
  parts: [
    part('Essay', 'Write your argument essay.', essayPoints('gov-argument-life-tenure', 'life tenure for federal judges', 'Article III, Federalist No. 78, or Brutus No. 1')),
  ],
  sampleResponse: 'Federal judges should keep life tenure, because it protects their independence so they can uphold the Constitution against popular majorities. Article III provides that judges “shall hold their Offices during good Behaviour” and that their pay cannot be reduced, which removes the threat of losing a job or salary for an unpopular ruling. In Federalist No. 78, Hamilton calls the judiciary the “least dangerous” branch because it has neither the sword nor the purse, and argues that permanent tenure is the best way to secure judges who will guard individual rights. Brown v. Board of Education shows why this matters: judges who did not face reelection struck down school segregation even though it was popular in many states. Because judges cannot be punished for their decisions, they can protect minority rights that elected officials might ignore. Anti-Federalist critics warned that unelected judges with life tenure would answer to no one and could steadily expand federal power over the states. That concern is real, but judges remain checked: the president and Senate control appointments, Congress can impeach judges and limit the courts’ appellate jurisdiction, and constitutional amendments can overturn rulings, so independence does not mean unlimited power.',
});

// Demo data for the grading flow on localhost (see ap-grader.js canned mode).
const canned = {
  frqId: 'gov-concept-veto',
  transcript: 'A The president vetoed the bill, which means he refused to sign it and sent it back to Congress.\n\nB To override a veto, both chambers need a two-thirds vote. The House got enough votes, but 61 senators is less than the 67 needed.\n\nC Divided government is when one party controls Congress and another party controls the presidency.',
  evidence: { 'gov-concept-veto-a1': 'he refused to sign it and sent it back to Congress', 'gov-concept-veto-b1': 'both chambers need a two-thirds vote. The House got enough votes, but 61 senators is less than the 67 needed' },
  missed: { 'gov-concept-veto-c1': 'This defines divided government but does not apply it. Explain how it shaped this outcome: the president from the other party had a reason to block the majority’s bill, and his party had enough Senate votes to sustain the veto.' },
  priorityFix: 'In concept application questions, a definition alone does not earn the point. Connect the concept to a specific event in the scenario.',
  sampleResponseComparison: 'Parts A and B match the sample response. In C the sample connects divided government to the president’s partisan motive and the Senate minority’s votes.',
};

module.exports = { course: 'ap-us-government', frqs, canned };
