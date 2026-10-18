// AP U.S. Government and Politics units 4–5: American Political Ideologies and Beliefs, and
// Political Participation. Same format as gov-a.cjs; data in figures are hypothetical or
// rounded illustrative values unless a stem says otherwise.
const { chart, table } = require('./figures.cjs');
const { draw } = require('./diagram.cjs');

const PINK = '#ec4899', BLUE = '#3b82f6';
const text = (x, y, s, o = {}) => ['text', x, y, s, { italic: false, ...o }];

function ideologyGrid() {
  return draw(360, 300, 'A two-dimensional ideology chart. The horizontal axis measures support for government involvement in the economy, from less on the left to more on the right. The vertical axis measures support for government regulation of personal and social behavior, from less at the bottom to more at the top. Quadrant P is upper left, quadrant Q is upper right, quadrant R is lower left, and quadrant S is lower right', [
    ['rect', 60, 30, 260, 220, { width: 1.8 }], ['line', 190, 30, 190, 250, { dash: true }], ['line', 60, 140, 320, 140, { dash: true }],
    text(125, 90, 'P', { bold: true, size: 18 }), text(255, 90, 'Q', { bold: true, size: 18 }), text(125, 200, 'R', { bold: true, size: 18 }), text(255, 200, 'S', { bold: true, size: 18 }),
    text(190, 20, '↑ more regulation of personal and social behavior', { size: 11 }), text(190, 266, '↓ less regulation of personal and social behavior', { size: 11 }), text(190, 290, 'Government role in the economy: less ← → more', { size: 11, bold: true }),
  ]);
}

const figures = {
  poll: table(['Candidate', 'Poll 1 (n = 400)', 'Poll 2 (n = 1,600)'], [['Candidate A', '48%', '49%'], ['Candidate B', '44%', '45%'], ['Undecided', '8%', '6%'], ['Margin of error', '±5 points', '±2.5 points']], 'Table of two polls of likely voters. Poll 1, with 400 respondents: Candidate A 48 percent, Candidate B 44 percent, undecided 8 percent, margin of error plus or minus 5 points. Poll 2, with 1,600 respondents: Candidate A 49 percent, Candidate B 45 percent, undecided 6 percent, margin of error plus or minus 2.5 points'),
  ideology: ideologyGrid(),
  trust: chart({ type: 'line', title: 'Adults who trust the federal government most of the time (%)', categories: ['1964', '1974', '1984', '1994', '2004', '2014', '2024'], series: [{ name: 'Trust', values: [76, 36, 44, 21, 47, 24, 22] }], ymax: 80, ystep: 20, w: 440,
    alt: 'Line graph of the percentage of adults who say they trust the federal government to do what is right most of the time: 76 percent in 1964, 36 percent in 1974, 44 percent in 1984, 21 percent in 1994, 47 percent in 2004, 24 percent in 2014, and 22 percent in 2024' }),
  generations: chart({ title: 'Party identification by generation (%)', categories: ['Born 1946–1964', 'Born 1965–1980', 'Born 1981–1996', 'Born 1997–2012'], series: [{ name: 'Democrat or lean Democrat', values: [45, 47, 54, 56] }, { name: 'Republican or lean Republican', values: [50, 46, 39, 36] }], ymax: 60, ystep: 10, w: 470,
    alt: 'Bar graph of party identification by generation in a hypothetical survey. Born 1946 to 1964: 45 percent Democratic, 50 percent Republican. Born 1965 to 1980: 47 and 46. Born 1981 to 1996: 54 and 39. Born 1997 to 2012: 56 and 36' }),
  turnoutAge: chart({ title: 'Voter turnout by age in a presidential election (%)', categories: ['18–24', '25–44', '45–64', '65 and older'], series: [{ name: 'Turnout', values: [48, 59, 69, 74] }], ymax: 80, ystep: 20,
    alt: 'Bar graph of voter turnout by age in a presidential election: 48 percent for ages 18 to 24, 59 percent for 25 to 44, 69 percent for 45 to 64, and 74 percent for 65 and older' }),
  midterm: chart({ type: 'line', title: 'Turnout of eligible voters in federal elections (%)', categories: ['2008', '2010', '2012', '2014', '2016', '2018', '2020', '2022'], series: [{ name: 'Turnout', values: [62, 41, 58, 37, 60, 50, 66, 46] }], ymax: 70, ystep: 10, w: 460,
    alt: 'Line graph of approximate turnout of eligible voters in U.S. federal elections: 62 percent in 2008, 41 in 2010, 58 in 2012, 37 in 2014, 60 in 2016, 50 in 2018, 66 in 2020, and 46 in 2022. Turnout rises in presidential years and falls in midterm years, producing a zigzag pattern' }),
  incumbents: chart({ title: 'Reelection rates of incumbents seeking reelection (%)', categories: ['2014', '2016', '2018', '2020', '2022'], series: [{ name: 'House', values: [95, 97, 91, 95, 94] }, { name: 'Senate', values: [82, 93, 84, 84, 100] }], ymax: 100, ystep: 20, w: 460,
    alt: 'Bar graph of approximate reelection rates for incumbents seeking reelection. House: 95, 97, 91, 95, and 94 percent from 2014 to 2022. Senate: 82, 93, 84, 84, and 100 percent' }),
  electoral: table(['Candidate', 'Popular vote', 'States won', 'Electoral votes'], [['Candidate X', '50.4%', '22', '260'], ['Candidate Y', '48.1%', '28', '278'], ['Others', '1.5%', '0', '0']], 'Table of a hypothetical presidential election result. Candidate X: 50.4 percent of the popular vote, 22 states, 260 electoral votes. Candidate Y: 48.1 percent, 28 states, 278 electoral votes. Others: 1.5 percent, no states, no electoral votes'),
  spending: table(['Type of group', 'Can coordinate with candidates?', 'Contribution limits?', 'Must disclose donors?'], [['Political action committee (PAC)', 'Yes, can give directly', 'Yes', 'Yes'], ['Super PAC', 'No', 'No', 'Yes'], ['501(c)(4) social welfare group', 'No', 'No', 'Generally no']], 'Table comparing three types of groups in campaigns. A political action committee can give directly to candidates, has contribution limits, and must disclose donors. A super PAC cannot coordinate with candidates, has no contribution limits, and must disclose donors. A 501(c)(4) social welfare group cannot coordinate with candidates, has no contribution limits, and generally does not have to disclose donors'),
};

const source = String.raw`
@ 4 | - | Core values
Which core American value is most closely associated with Adam Smith's argument in The Wealth of Nations that individuals pursuing their own self-interest in competitive markets promote the public good?
* Free enterprise
- Equality of outcome
- Rule of law
- Popular sovereignty
= Smith described an "invisible hand" by which competition allocates resources efficiently, supporting limited government regulation of the market.

@ 4 | - | Core values
Which policy position is most consistent with the principles in Adam Smith's The Wealth of Nations?
* Reducing tariffs and government regulation so that markets can allocate resources through competition
- Setting government prices for most goods
- Placing all major industries under public ownership
- Raising tariffs to protect domestic industries from all foreign competition
= Smith criticized mercantilist trade restrictions and monopolies. Free trade and competition, in his view, increase the wealth of nations.

@ 4 | - | Core values
Which statement best expresses the core value of equality of opportunity?
* All people should have an equal chance to compete and succeed, though outcomes may differ.
- All people should receive the same income.
- The government should guarantee identical results for everyone.
- Only property owners should participate in politics.
= Americans broadly support equal opportunity, but they disagree about what policies, such as public education funding or affirmative action, are needed to achieve it.

@ 4 | - | Core values
A governor is prosecuted for accepting bribes, under the same laws that apply to private citizens. Which core value does this illustrate?
* Rule of law
- Individualism
- Free enterprise
- Limited government
= The rule of law means that everyone, including those in power, is accountable to the same laws.

@ 4 | - | Core values
Which statement best reflects the American value of individualism?
* People are responsible for their own success and should be free to make their own choices.
- Society should act collectively to ensure equal outcomes.
- The government should control major economic decisions.
- People should defer to traditional authorities.
= Individualism emphasizes personal responsibility and self-reliance. It contributes to Americans' skepticism of large government programs compared with citizens of many other democracies.

@ 4 | - | Political socialization
Which agent of political socialization usually has the greatest early influence on a person's party identification?
* Family
- Social media
- Coworkers
- Political advertising
= Children often adopt their parents' political views and party identification, though later experiences, schooling, and peers can change them.

@ 4 | - | Political socialization | generations
Which conclusion about party identification is best supported by the graph?
* Younger generations are more likely than older generations to identify with or lean toward the Democratic Party.
- All generations have nearly identical party identification.
- The oldest generation is the most Democratic.
- Younger generations are more Republican.
= Democratic identification rises from 45 to 56 percent from the oldest to the youngest generation, while Republican identification falls from 50 to 36 percent.

@ 4 | - | Generational effects | generations
Which concept best explains why each generation in the graph may keep distinct political views as it ages?
* Generational effects: shared experiences during a group's formative years shape lasting political attitudes.
- Life-cycle effects: people become more conservative only because of age.
- Random sampling error in the survey.
- The influence of a single election.
= Events such as wars, economic crises, or social movements during young adulthood can leave a lasting imprint. Life-cycle effects, by contrast, describe changes as people age through different stages of life.

@ 4 | - | Life-cycle effects
A person who rarely voted in their twenties becomes concerned about property taxes and Social Security in their sixties and votes regularly. Which concept does this illustrate?
* Life-cycle effects
- Generational effects
- Globalization
- Political efficacy among young adults
= As people's concerns change with age, such as owning property, raising children, and retirement, their political interests and participation often change as well.

@ 4 | - | Public opinion | trust
Which conclusion about trust in the federal government is best supported by the graph?
* Trust fell sharply from the 1960s and has remained much lower since, with only brief recoveries.
- Trust has risen steadily since 1964.
- Trust has remained constant since 1964.
- Trust was at its lowest in 1964.
= Events such as the Vietnam War and Watergate contributed to the decline in the 1970s. Short rebounds, such as in 2004, have not restored the levels of the early 1960s.

@ 4 | - | Public opinion | trust
By what percentage did the share of adults who trust the government fall from 1964 to 2024, relative to its 1964 level?
* About \(71\%\)
- \(54\%\)
- About \(29\%\)
- \(22\%\)
= The share fell by \(76-22=54\) percentage points, which is \(\tfrac{54}{76}\approx 71\%\) of the 1964 level. A change in percentage points differs from a percentage change.

@ 4 | - | Polling | poll
Which statement about the polls in the table is correct?
* Poll 1's lead for Candidate A is within its margin of error, so the race cannot be called from that poll alone.
- Poll 1 proves that Candidate A will win.
- Poll 2 has a larger margin of error because it surveyed more people.
- Both polls show a statistically certain lead for Candidate B.
= In Poll 1, A's 4-point lead is smaller than the uncertainty in each candidate's share. Poll 2's larger sample shrinks the margin of error but the lead remains narrow.

@ 4 | - | Polling | poll
Why does Poll 2 have a smaller margin of error than Poll 1?
* It has a larger random sample, and the margin of error shrinks as sample size increases.
- It surveyed only likely voters who had decided.
- It asked more questions.
- It was conducted by telephone.
= The margin of error is roughly inversely proportional to the square root of the sample size. Quadrupling the sample from 400 to 1,600 halves the margin of error.

@ 4 | - | Polling
A poll asks, "Do you support cutting wasteful government spending that hurts taxpayers?" What is the main problem with this question?
* Its wording is biased and leads respondents toward a particular answer.
- Its sample is too large.
- It asks about government.
- It cannot be answered yes or no.
= Loaded words such as "wasteful" and "hurts" push respondents toward agreement. Reliable polls use neutral wording, random samples, and weighting to match the population.

@ 4 | - | Polling
A polling firm surveys people who volunteer to answer an online survey on a political website. Why are the results unlikely to represent the public?
* The sample is self-selected rather than random, so it overrepresents people with strong interest in politics.
- Online surveys always have no margin of error.
- The sample is too random.
- Political websites are visited by everyone equally.
= Scientific polls require samples in which every member of the population has a known chance of selection. Self-selected samples can be very large yet badly biased.

@ 4 | - | Ideology | ideology
In the chart, which quadrant best represents libertarian views?
* R
- P
- Q
- S
= Libertarians favor minimal government involvement in both the economy and personal behavior, placing them in the lower left: less economic intervention and less social regulation.

@ 4 | - | Ideology | ideology
Which quadrant of the chart best represents the views typically associated with modern American conservatives?
* P
- Q
- R
- S
= Conservatives generally favor less government regulation of the economy but more support for traditional social values. Modern liberals generally favor more economic intervention and less social regulation, quadrant S.

@ 4 | - | Ideology
Which policy position is most consistent with modern American liberalism?
* Expanding government programs to reduce income inequality and increasing regulation of business
- Reducing taxes and cutting social welfare spending
- Eliminating most government programs
- Restricting individual social choices to promote traditional values
= Liberals generally see government as a tool to promote equality and address market failures, while conservatives emphasize individual responsibility and limited government in the economy.

@ 4 | - | Fiscal policy
During a recession, Congress cuts taxes and increases government spending. What type of policy is this, and which school of thought supports it?
* Expansionary fiscal policy, supported by Keynesian economics
- Contractionary monetary policy, supported by supply-side economics
- Expansionary monetary policy, set by Congress
- Contractionary fiscal policy, supported by Keynesian economics
= Keynesians argue that government spending can boost demand when private spending falls. Fiscal policy is set by Congress and the president; monetary policy is set by the Federal Reserve.

@ 4 | - | Monetary policy
Which institution controls monetary policy in the United States, and what is one of its main tools?
* The Federal Reserve, which adjusts interest rates to influence borrowing and inflation
- Congress, which sets tax rates
- The Treasury Department, which writes the federal budget
- The Supreme Court, which reviews economic laws
= The Fed's independence is meant to insulate monetary decisions from short-term political pressure. Raising interest rates tends to slow inflation, while lowering them encourages borrowing.

@ 4 | - | Supply-side economics
Which policy is most associated with supply-side economics?
* Cutting tax rates, especially on businesses and investment, to encourage production and economic growth
- Increasing government spending during recessions
- Raising tax rates on high incomes to reduce inequality
- Setting government price controls
= Supply-side advocates argue that lower taxes and less regulation increase incentives to work and invest. The approach was central to President Reagan's economic policy.

@ 4 | - | Ideology and policy
Libertarians are most likely to support which policy?
* Reducing government regulation of both the economy and personal choices
- Expanding government health care programs
- Increasing restrictions on personal behavior
- Raising tariffs to protect domestic industries
= Libertarians prioritize individual liberty and limited government across both economic and social issues.

@ 4 | - | Public opinion and policy
Which factor most often limits the influence of public opinion on specific policy decisions?
* Many citizens have little information about specific policies, and opinions on details are often unstable.
- Public opinion polls are illegal in election years.
- Elected officials are forbidden to consider polls.
- Public opinion never changes.
= Officials respond to public opinion on salient issues, but on technical questions they are often guided by interest groups, experts, and party leaders.

@ 4 | - | Political socialization
Which change has most increased the variety of sources that shape Americans' political views?
* The growth of the internet and social media, which allows people to choose sources that match their views
- The decline of public schools
- The end of newspapers
- The elimination of political parties
= Easy access to many sources can increase information but also allows selective exposure, contributing to polarization.

@ 4 | - | Globalization
Which effect has globalization had on American political attitudes?
* It has increased debates over trade, immigration, and the effects of international competition on American workers.
- It has eliminated disagreement over trade.
- It has had no effect on public opinion.
- It has caused all Americans to support free trade.
= Some voters have benefited from trade, while others, such as workers in some manufacturing industries, have faced job losses, shaping views across both parties.

@ 4 | - | Exit polls
What is an exit poll?
* A survey of voters as they leave polling places, used to predict outcomes and analyze voting patterns
- A survey of people who chose not to vote
- A count of ballots done by election officials
- A poll that asks only about candidates who dropped out
= Exit polls help explain why people voted as they did by group. They can be inaccurate if certain voters, such as early or mail-in voters, are not surveyed.

@ 4 | - | Ideology and the role of government
Which statement best explains why liberals and conservatives often disagree about the size of government?
* They hold different views about whether government action or private markets better promote individual well-being and equality.
- They disagree about whether the Constitution exists.
- Liberals oppose all government spending.
- Conservatives oppose all government programs, including the military.
= Both groups support some government functions. They disagree about the balance between individual responsibility, market outcomes, and public programs.

@ 4 | - | Party ideology
Which policy is typically favored by the Republican Party and opposed by the Democratic Party?
* Lowering taxes and reducing federal regulation of business
- Increasing the federal minimum wage
- Expanding federal health insurance programs
- Increasing environmental regulation
= Party platforms reflect ideological differences, though both parties include a range of views.

@ 4 | - | Polling
A pollster conducts a "push poll." What is its purpose?
* To spread negative information about a candidate under the guise of asking questions
- To measure opinion accurately with neutral questions
- To predict election results after polls close
- To test the opinions of experts
= Push polls are campaign tactics, not genuine surveys. Questions such as "Would you vote for X if you knew…" are designed to change opinions.

@ 4 | - | Political efficacy
A citizen believes that voting does not matter because officials ignore people like them. Which concept does this describe?
* Low political efficacy
- High political efficacy
- Strong party identification
- Rational choice voting
= Political efficacy is the belief that one can understand and influence politics. Low efficacy is associated with lower turnout.

@ 4 | - | Public opinion
Which source of data would give a researcher the most reliable measure of national public opinion on an issue?
* A scientific poll of a large, random, national sample with neutral question wording
- Letters sent to members of Congress
- Comments on a popular news website
- Attendance at political rallies
= Letters, comments, and rallies reflect the views of the most motivated people. Random samples represent the whole population.

@ 4 | - | Core values and policy
Which policy debate most directly reflects a tension between the values of individualism and equality of opportunity?
* Whether taxpayers should fund programs such as early-childhood education to help disadvantaged children compete
- Whether to hold elections every two years
- Whether the president commands the military
- Whether states may coin money
= Supporters argue such programs make opportunity real; opponents may see them as an unwarranted expansion of government into individual and family responsibilities.

@ 4 | - | Social policy
Which statement best describes the differences between the parties on social policy?
* Republicans generally emphasize traditional values and limits on some social changes, while Democrats generally emphasize expanding individual and civil rights protections.
- Both parties hold identical social policy positions.
- Democrats oppose civil rights laws.
- Republicans favor expanding all government programs.
= Issues such as abortion, gun policy, and immigration divide the parties' bases, though individuals within each party hold varied views.

@ 4 | - | Polling
Why do pollsters weight survey results?
* To adjust the sample so that its demographic makeup matches that of the population
- To change the results to favor one candidate
- To reduce the size of the sample
- To eliminate the margin of error entirely
= If a sample has too few young respondents, for example, their answers are counted more heavily so that the results better reflect the whole population.

@ 4 | - | Federal Reserve
Why is the Federal Reserve designed to be independent of elected officials?
* So that monetary policy is based on long-term economic stability rather than short-term political pressures
- So that it can set tax rates
- So that it can write the federal budget
- So that it can override Congress
= Elected officials might favor low interest rates before elections even if inflation results. Fed governors serve long, staggered terms.

@ 4 | - | Ideology
Which group is most likely to favor a large role for government in regulating the economy but a limited role in regulating personal behavior?
* Liberals
- Conservatives
- Libertarians
- Populists who oppose all regulation
= Liberals generally support economic regulation and social programs while emphasizing personal freedoms such as privacy.

@ 4 | - | Political culture
Which statement best explains why Americans can share core values yet disagree sharply on policy?
* People interpret and prioritize shared values, such as liberty and equality, differently.
- Americans do not share any core values.
- Core values determine a single correct policy.
- Disagreement occurs only among elected officials.
= Liberty may suggest lower taxes to one person and protection of civil liberties to another. Equality may mean equal treatment or more equal outcomes.

@ 4 | - | Generational effects | generations
A researcher wants to determine whether the patterns in the graph reflect generational effects or life-cycle effects. Which research design would best help?
* Surveying the same people repeatedly over many decades
- Surveying a single generation once
- Asking only the oldest generation about its views
- Counting the number of registered Democrats in one year
= A longitudinal panel shows whether people's views change as they age (life-cycle effects) or stay stable within each generation (generational effects).

@ 4 | - | Public opinion and the courts
Which statement best describes the relationship between public opinion and Supreme Court decisions?
* Justices are not elected and are insulated from public opinion, but rulings can be shaped by and can shape public attitudes over time.
- Justices must follow opinion polls.
- Public opinion has no relationship to court decisions.
- The Court must hold a referendum before major rulings.
= Life tenure insulates the Court, but justices are aware that their legitimacy depends on public acceptance of their rulings.

@ 4 | - | Social movements and ideology
Which development is most likely to shift public opinion on a social issue over time?
* Generational replacement, as younger people with different views replace older generations in the electorate
- A single opinion poll
- A new tax on businesses
- A redistricting plan
= Attitudes toward issues such as same-sex marriage changed dramatically in part because younger cohorts held more accepting views than older ones.

@ 5 | - | Voting rights
Which amendment lowered the voting age to 18?
* The Twenty-sixth Amendment
- The Nineteenth Amendment
- The Twenty-fourth Amendment
- The Fifteenth Amendment
= Ratified in 1971 during the Vietnam War, it was supported by the argument that people old enough to be drafted should be able to vote.

@ 5 | - | Voting rights
Which amendment prohibits poll taxes in federal elections?
* The Twenty-fourth Amendment
- The Twenty-sixth Amendment
- The Seventeenth Amendment
- The Fifteenth Amendment
= Poll taxes had been used to keep poor and Black citizens from voting. The Supreme Court later extended the ban to state elections in Harper v. Virginia Board of Elections (1966).

@ 5 | - | Voter turnout | turnoutAge
Which conclusion about turnout and age is best supported by the graph?
* Turnout increases with age, with voters 65 and older more than 25 percentage points more likely to vote than those 18 to 24.
- Young voters have the highest turnout.
- Turnout is the same in all age groups.
- Turnout decreases with age.
= Older citizens are more likely to be settled in a community, registered, and directly affected by programs such as Social Security. Young people move often and may not yet have the habit of voting.

@ 5 | - | Voter turnout | turnoutAge
Which policy would most likely narrow the gap in turnout shown in the graph?
* Automatic or same-day voter registration
- Requiring voters to register 60 days before an election
- Moving elections to a weekday with no early voting
- Requiring a fee to vote
= Registration requirements are a major barrier for young, mobile citizens. Lowering such barriers tends to raise turnout among groups with lower participation.

@ 5 | - | Voter turnout | midterm
Which best explains the zigzag pattern in the graph?
* Turnout is much higher in presidential election years than in midterm election years.
- Turnout is higher in odd-numbered years.
- Turnout increases steadily over time.
- Midterm elections receive more media attention.
= Presidential races are more visible and competitive and receive more media coverage, so more people vote. Midterm electorates are older and more partisan.

@ 5 | - | Voter turnout | midterm
How many percentage points higher was turnout in the 2020 presidential election than in the 2022 midterm, according to the graph?
* \(20\) percentage points
- \(46\) percentage points
- \(43\%\)
- \(66\) percentage points
= \(66-46=20\) percentage points. Relative to the midterm turnout, presidential turnout was about \(43\%\) higher, a different measure.

@ 5 | - | Voting behavior
A voter supports the incumbent president because the economy improved during the past four years. Which model of voting behavior does this illustrate?
* Retrospective voting
- Prospective voting
- Party-line voting
- Rational choice based on future promises
= Retrospective voters judge officials on past performance. Prospective voters choose based on predictions of future policy.

@ 5 | - | Voting behavior
A voter supports every candidate of one party on the ballot, regardless of the office. Which model does this illustrate?
* Party-line voting
- Retrospective voting
- Split-ticket voting
- Prospective voting
= Party identification provides a shortcut for voters with limited information. Split-ticket voting, choosing candidates of different parties, has declined as polarization has increased.

@ 5 | - | Voting behavior
Which model of voting describes a citizen who compares candidates' positions and votes for the one whose policies best serve the citizen's own interests?
* Rational-choice voting
- Party-line voting
- Retrospective voting
- Habitual voting
= Rational-choice voters weigh the costs and benefits of each candidate's policies for themselves.

@ 5 | - | Political parties
Which is a primary function of political parties in the United States?
* Recruiting candidates, mobilizing voters, and organizing government
- Writing the Constitution
- Appointing federal judges
- Conducting the census
= Parties nominate candidates, help voters make decisions, raise money, and organize Congress through party leadership and committee assignments.

@ 5 | - | Third parties
Which feature of the U.S. electoral system most limits the success of third parties?
* Single-member districts with winner-take-all, plurality elections
- Proportional representation in Congress
- Public financing of all candidates
- Direct election of the president by popular vote
= A party that wins 15 percent of the vote in every district may win no seats. Voters may also see a third-party vote as wasted.

@ 5 | - | Third parties
Third parties rarely win national elections. Which is their most common effect on American politics?
* Raising issues that major parties later adopt, and sometimes influencing election outcomes
- Controlling Congress
- Winning the presidency regularly
- Eliminating one of the major parties
= Ideas such as the progressive income tax and direct election of senators were promoted by third parties before major parties adopted them.

@ 5 | - | Party realignment
Which describes a critical election that produces a party realignment?
* An election that shifts the coalitions supporting the major parties, producing a new, lasting pattern of party control
- An election with very low turnout
- A close election decided by recount
- An election in which a third party wins the presidency
= The election of 1932, which built the New Deal coalition, is a classic example. Realignments reshape party coalitions for decades.

@ 5 | - | Interest groups
Why do interest groups representing broad public interests, such as clean air, often find it harder to organize than groups representing narrow interests?
* Because of the free-rider problem: people can enjoy the benefits without contributing to the group.
- Because broad interests are illegal.
- Because narrow groups are prohibited from lobbying.
- Because members of broad groups cannot vote.
= Groups offer selective benefits, such as magazines or discounts, to overcome free riding. Small groups with concentrated stakes find it easier to organize.

@ 5 | - | Interest groups
Which is an example of lobbying by an interest group?
* Meeting with members of Congress and their staff to provide information and advocate for a bill
- Voting in a primary election
- Issuing an executive order
- Deciding a court case
= Lobbyists provide expertise and information. Groups also file amicus curiae briefs, testify at hearings, and mobilize members.

@ 5 | - | Interest groups and the courts
An interest group files an amicus curiae brief in a Supreme Court case. What is its purpose?
* To present arguments and information to persuade the justices, even though the group is not a party to the case
- To serve as the defendant in the case
- To appoint a justice to hear the case
- To appeal the decision to Congress
= Amicus briefs let groups influence the courts. Groups such as the NAACP have also sponsored test cases to change the law.

@ 5 | - | Campaign finance | spending
Which group in the table may spend unlimited money on political ads without disclosing its donors?
* A 501(c)(4) social welfare group
- A political action committee
- A super PAC
- A candidate's campaign committee
= Such groups, a source of "dark money," may engage in political activity as long as it is not their primary purpose. Super PACs may raise unlimited money but must disclose donors.

@ 5 | - | Campaign finance | spending
Which Supreme Court decision made the growth of super PACs shown in the table possible?
* Citizens United v. Federal Election Commission (2010)
- Buckley v. Valeo (1976)
- Baker v. Carr (1962)
- Marbury v. Madison (1803)
= The Court held that limits on independent political spending by corporations and unions violate the First Amendment. Lower courts then struck down contribution limits for independent-expenditure groups.

@ 5 | - | Campaign finance
Which reasoning did the Supreme Court majority use in Citizens United v. FEC?
* Independent spending on political speech by corporations and unions is protected by the First Amendment and does not give rise to corruption.
- Corporations are not protected by the Constitution.
- Spending money has nothing to do with speech.
- Congress may ban all political advertising.
= Critics argue that the decision increased the influence of wealthy interests in elections. Direct contributions to candidates remain limited.

@ 5 | - | Campaign finance
Which was a main goal of the Bipartisan Campaign Reform Act of 2002 (McCain-Feingold)?
* Banning unlimited "soft money" contributions to national political parties
- Eliminating all campaign contributions
- Requiring public financing for all candidates
- Abolishing the Federal Election Commission
= Soft money had been raised for party-building activities but often used to support candidates. Citizens United struck down other parts of the law limiting corporate election ads.

@ 5 | - | Elections | electoral
Which statement correctly explains the result shown in the table?
* Candidate Y won the presidency with a majority of electoral votes, although Candidate X won more popular votes.
- Candidate X won because of the popular vote.
- No candidate won because neither had 270 electoral votes.
- The House chose the winner because no candidate won a majority of the popular vote.
= A candidate needs 270 of 538 electoral votes. Because nearly all states award all of their electors to the statewide winner, a candidate can win the Electoral College while losing the national popular vote.

@ 5 | - | Elections
Which feature of the Electoral College encourages presidential candidates to focus on a small number of states?
* Winner-take-all allocation of electoral votes in nearly every state, which makes competitive "swing states" decisive
- The proportional allocation of electoral votes in every state
- Direct popular election of the president
- The requirement that candidates visit every state
= Candidates have little reason to campaign in states that reliably favor one party, so swing states receive most of the attention and spending.

@ 5 | - | Incumbency | incumbents
Which conclusion about incumbents is best supported by the graph?
* Incumbents seeking reelection usually win, and House incumbents have generally been reelected at higher rates than Senate incumbents.
- Senate incumbents always lose.
- House incumbents win fewer than half of their races.
- Incumbency makes no difference to election outcomes.
= Incumbency advantages include name recognition, fundraising, constituent service, and favorable districts. Senate races are often more competitive because states are larger and more diverse than House districts.

@ 5 | - | Incumbency
Which advantage do House incumbents have over challengers?
* Name recognition, franking privileges, a record of constituent service, and an easier time raising money
- Guaranteed reelection under the Constitution
- The right to choose their opponents
- Longer terms than senators
= Gerrymandered safe seats add to the advantage. Challengers typically raise far less money.

@ 5 | - | Nominations
How does a closed primary differ from an open primary?
* Only voters registered with a party may vote in its closed primary, while any registered voter may vote in an open primary.
- Closed primaries are held after the general election.
- Open primaries choose the president directly.
- Closed primaries allow anyone to vote.
= Closed primaries tend to produce candidates who appeal to the party's base. Open primaries allow independents and members of other parties to participate.

@ 5 | - | Nominations
Which change in the presidential nomination process since the 1970s has given voters more influence?
* The widespread use of primaries and caucuses to choose delegates, rather than selection by party leaders
- The abolition of national conventions
- The elimination of superdelegates in both parties
- The selection of nominees by Congress
= Reforms after 1968 shifted power from party leaders to rank-and-file voters. Candidates now must campaign intensively in early states such as Iowa and New Hampshire.

@ 5 | - | Media
Which describes "horse-race" journalism?
* Coverage that focuses on who is ahead in polls and campaign strategy rather than candidates' policy positions
- Investigative reporting on government corruption
- Coverage of sporting events
- Editorials endorsing candidates
= Critics argue that horse-race coverage leaves voters less informed about the issues, though it attracts audiences.

@ 5 | - | Media
Which effect of social media and partisan news on political participation concerns many scholars?
* Echo chambers, in which people see mainly information that confirms their views, increasing polarization
- A sharp decline in the availability of political information
- An end to campaign advertising
- Equal coverage of all candidates
= Algorithms and personal choices can narrow the range of viewpoints people encounter. Social media also allows rapid spread of misinformation.

@ 5 | - | Media
Which role of the news media is often called "watchdog" journalism?
* Investigating and exposing wrongdoing by government officials
- Selecting which candidates appear on the ballot
- Writing legislation
- Conducting official election counts
= Investigative reporting, such as coverage of Watergate, holds officials accountable. The media also act as gatekeepers, deciding which stories receive attention.

@ 5 | - | Social movements
Which factor most helped the women's suffrage movement achieve ratification of the Nineteenth Amendment in 1920?
* Decades of organizing, protests, and state-level victories, along with women's contributions during World War I
- A Supreme Court ruling requiring women's suffrage
- An executive order by the president
- A decision by party conventions
= Several western states had granted women the vote before 1920. Sustained pressure built support in Congress and the state legislatures for the amendment.

@ 5 | - | Linkage institutions
Which of the following are linkage institutions that connect citizens to government?
* Political parties, interest groups, elections, and the media
- Congress, the president, and the courts
- The Bill of Rights and the Constitution
- The Federal Reserve and the Treasury
= Linkage institutions channel public preferences to policymakers. The three branches are the institutions of government itself.

@ 5 | - | Voter turnout
Which demographic factor is most strongly associated with higher voter turnout?
* Higher levels of education
- Younger age
- Lower income
- Recent change of residence
= Education increases knowledge of politics, political efficacy, and familiarity with registration procedures. Income and age are also positively associated with turnout.

@ 5 | - | Voting laws
Supporters of strict voter ID laws argue that they prevent fraud. What do opponents most often argue?
* They impose burdens that fall disproportionately on poor, elderly, and minority voters, who are less likely to have ID, while in-person fraud is extremely rare.
- They increase turnout among all groups.
- They are required by the Constitution.
- They apply only to federal judges.
= The debate reflects the tension between protecting the integrity of elections and ensuring access to voting.

@ 5 | - | Political parties
Why have the two major parties become more ideologically polarized in recent decades?
* Partisan sorting, safe districts, primary elections that reward appealing to the base, and polarized media
- The elimination of primary elections
- The rise of a strong third party
- A constitutional amendment requiring polarization
= Conservatives have increasingly sorted into the Republican Party and liberals into the Democratic Party, reducing the overlap between the parties in Congress.

@ 5 | - | Campaigns
How has the internet changed the way campaigns operate?
* It allows candidates to raise small donations from many supporters and target messages to specific groups of voters.
- It has eliminated the need to raise money.
- It has banned television advertising.
- It requires candidates to debate online.
= Online fundraising and microtargeted ads have made campaigns less dependent on party organizations and large donors, while raising concerns about privacy and misinformation.

@ 5 | - | Interest groups
Which describes the "revolving door" between government and interest groups?
* Former government officials take jobs as lobbyists, and lobbyists take positions in government.
- Interest groups are banned from contacting officials.
- Members of Congress must rotate committees each term.
- Voters move between political parties frequently.
= Critics argue that the revolving door gives some interests special access. Federal law imposes waiting periods before former officials may lobby their old agencies.

@ 5 | - | Social movements
Which strategy did the civil rights and environmental movements both use to influence policy?
* Mobilizing public opinion through protests and media attention while lobbying and litigating for change
- Relying only on electing their own third-party presidents
- Avoiding all contact with government
- Using only the amendment process
= Social movements combine grassroots activism with institutional strategies. Earth Day in 1970 built support for the Clean Air Act and the creation of the EPA.

@ 5 | - | Voting rights
The Fifteenth Amendment prohibited denying the vote on the basis of race. Why did many Black Southerners remain unable to vote until the 1960s?
* States used poll taxes, literacy tests, white primaries, and intimidation to keep them from voting.
- The amendment applied only to Northern states.
- The Supreme Court declared the amendment unconstitutional.
- Congress repealed the amendment.
= The Twenty-fourth Amendment and the Voting Rights Act of 1965 dismantled these barriers.

@ 5 | - | Political participation
Besides voting, which is a form of political participation?
* Contributing to a campaign, contacting officials, or participating in a protest
- Paying sales tax
- Receiving a passport
- Attending public school
= Participation includes any activity that seeks to influence government. Different forms require different amounts of time, money, and skill.

@ 5 | - | Elections
What happens if no presidential candidate wins a majority of the electoral votes?
* The House of Representatives chooses the president, with each state delegation casting one vote.
- The candidate with the most popular votes wins.
- The Supreme Court chooses the president.
- The Senate chooses the president with each senator casting one vote.
= Under the Twelfth Amendment, the House chooses among the top three candidates, and the Senate chooses the vice president.
`;

module.exports = { source, figures };
