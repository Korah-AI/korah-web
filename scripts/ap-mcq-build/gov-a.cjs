// AP U.S. Government and Politics units 1–3: Foundations of American Democracy, Interactions
// Among Branches of Government, and Civil Liberties and Civil Rights. Block format with "-"
// in the second field. Questions apply the required foundational documents (including the
// four added for 2026–27) and the required Supreme Court cases. Data in figures are
// hypothetical or rounded unless a stem says otherwise.
const { chart, table } = require('./figures.cjs');
const { draw } = require('./diagram.cjs');

const PINK = '#ec4899', BLUE = '#3b82f6';
const text = (x, y, s, o = {}) => ['text', x, y, s, { italic: false, ...o }];

function venn() {
  return draw(500, 260, 'A Venn diagram of powers in the federal system. The left circle, national government only, lists coining money, declaring war, and regulating interstate commerce. The right circle, state governments only, lists conducting elections, establishing local governments, and regulating intrastate commerce. The overlap, shared by both, lists collecting taxes, borrowing money, and establishing courts', [
    ['circle', 180, 135, 120, { fill: BLUE, color: BLUE, width: 1.6 }], ['circle', 320, 135, 120, { fill: PINK, color: PINK, width: 1.6 }],
    ['circle', 180, 135, 120, { width: 1.6 }], ['circle', 320, 135, 120, { width: 1.6 }],
    text(120, 16, 'X', { bold: true, size: 13 }), text(380, 16, 'Z', { bold: true, size: 13 }), text(250, 16, 'Y', { bold: true, size: 13 }),
    ...['Coin money', 'Declare war', 'Regulate interstate', 'commerce'].map((l, i) => text(124, 112 + i * 16, l, { size: 11, color: '#fff' })),
    ...['Collect taxes', 'Borrow money', 'Establish', 'courts'].map((l, i) => text(250, 112 + i * 16, l, { size: 11, color: '#fff' })),
    ...['Conduct elections', 'Create local', 'governments', 'Regulate intrastate', 'commerce'].map((l, i) => text(378, 104 + i * 16, l, { size: 11, color: '#fff' })),
  ]);
}

function billFlow() {
  const steps = ['Introduced', 'Committee', 'Floor vote', 'Other chamber', 'Conference', 'President'];
  return draw(500, 120, 'Flowchart of how a bill becomes law, with six boxes in a row: introduced; referred to committee; floor vote; passed in the same form by the other chamber; differences resolved in a conference committee if needed; sent to the president to sign or veto. The committee box is labeled with the letter J and the president box with the letter K', [
    ...steps.flatMap((l, i) => [['rect', 6 + i * 82, 40, 76, 40, { fill: true }], text(44 + i * 82, 64, l, { size: l.length > 11 ? 9 : 10 }), ...(i < 5 ? [['arrow', 83 + i * 82, 60, 87 + i * 82, 60, { width: 1.4 }]] : [])]),
    text(126, 30, 'J', { bold: true, size: 13 }), text(454, 30, 'K', { bold: true, size: 13 }),
  ]);
}

const figures = {
  venn: venn(),
  grants: chart({ title: 'Federal grants to a state, by type (billions of dollars)', categories: ['2000', '2005', '2010', '2015', '2020'], series: [{ name: 'Categorical grants', values: [18, 22, 30, 28, 34] }, { name: 'Block grants', values: [6, 7, 7, 8, 9] }], ymax: 40, ystep: 10, w: 460,
    alt: 'Bar graph of a state’s federal grants, in billions of dollars, from 2000 to 2020. Categorical grants: 18, 22, 30, 28, and 34. Block grants: 6, 7, 7, 8, and 9. Categorical grants are larger in every year and grow faster' }),
  billFlow: billFlow(),
  cloture: chart({ type: 'line', title: 'Cloture motions filed in the Senate per two-year Congress', categories: ['1970s', '1980s', '1990s', '2000s', '2010s'], series: [{ name: 'Cloture motions', values: [25, 45, 80, 120, 260] }], ymax: 300, ystep: 50, w: 440,
    alt: 'Line graph of the average number of cloture motions filed per two-year Congress, by decade: about 25 in the 1970s, 45 in the 1980s, 80 in the 1990s, 120 in the 2000s, and 260 in the 2010s' }),
  vetoes: table(['President', 'Years', 'Regular vetoes', 'Pocket vetoes', 'Vetoes overridden'], [['A', '8', '12', '2', '1'], ['B', '4', '30', '5', '9'], ['C', '8', '4', '0', '0']], 'Table of veto statistics for three hypothetical presidents. President A served 8 years with 12 regular vetoes, 2 pocket vetoes, and 1 override. President B served 4 years with 30 regular vetoes, 5 pocket vetoes, and 9 overrides. President C served 8 years with 4 regular vetoes, no pocket vetoes, and no overrides'),
  budget: chart({ title: 'Approximate shares of federal spending in a recent year (%)', categories: ['Mandatory spending', 'Discretionary spending', 'Interest on the debt'], series: [{ name: 'Share', values: [62, 27, 11] }], ymax: 70, ystep: 10, w: 460,
    alt: 'Bar graph of approximate shares of federal spending: mandatory spending, such as Social Security and Medicare, 62 percent; discretionary spending, 27 percent; and interest on the debt, 11 percent' }),
  incorporation: table(['Right', 'Case that applied it to the states'], [['Freedom of speech', 'Gitlow v. New York (1925)'], ['Right to counsel in felony cases', 'Gideon v. Wainwright (1963)'], ['Right to keep and bear arms', 'McDonald v. Chicago (2010)'], ['Protection against excessive fines', 'Timbs v. Indiana (2019)']], 'Table of rights and the cases that applied them to the states: freedom of speech, Gitlow v. New York, 1925; right to counsel in felony cases, Gideon v. Wainwright, 1963; right to keep and bear arms, McDonald v. Chicago, 2010; protection against excessive fines, Timbs v. Indiana, 2019'),
  registration: chart({ title: 'Black voting-age residents registered to vote in a Southern state (%)', categories: ['1960', '1964', '1968', '1972'], series: [{ name: 'Registered', values: [5, 7, 59, 62] }], ymax: 70, ystep: 10,
    alt: 'Bar graph of the percentage of Black voting-age residents registered to vote in a hypothetical Southern state: 5 percent in 1960, 7 percent in 1964, 59 percent in 1968, and 62 percent in 1972' }),
};

const source = String.raw`
@ 1 | - | Democratic ideals
The Declaration of Independence states that governments derive "their just powers from the consent of the governed." Which democratic ideal does this phrase most directly express?
* Popular sovereignty
- Federalism
- Judicial review
- Separation of powers
= Popular sovereignty holds that the people are the ultimate source of a government's authority. Jefferson drew on the social contract theory of John Locke.

@ 1 | - | Democratic ideals
The Declaration of Independence asserts that people are endowed with "unalienable Rights," including "Life, Liberty and the pursuit of Happiness." Which political philosopher's ideas does this most closely reflect?
* John Locke, who argued that people have natural rights that governments must protect
- Thomas Hobbes, who argued for an absolute sovereign
- Baron de Montesquieu, who described the separation of powers
- Adam Smith, who described free markets
= Locke argued that people are born with natural rights to life, liberty, and property, and that a government violating them may be replaced. Montesquieu's influence is clearest in the Constitution's structure.

@ 1 | - | Democratic ideals
In the Gettysburg Address, Abraham Lincoln described the nation as "conceived in Liberty, and dedicated to the proposition that all men are created equal." Which document's ideals was he deliberately invoking?
* The Declaration of Independence
- The Articles of Confederation
- The Federalist No. 10
- The Emancipation Proclamation
= Lincoln dated the nation's founding to 1776, "four score and seven years ago," and echoed the Declaration's claim of equality, reaffirming equality and popular sovereignty as foundations of democracy.

@ 1 | - | Democratic ideals
Lincoln ended the Gettysburg Address by resolving that "government of the people, by the people, for the people, shall not perish from the earth." Which principle does this most directly express?
* Popular sovereignty and representative democracy
- Federalism and states' rights
- Judicial independence
- Free enterprise
= The phrase describes a government that draws its authority from and acts on behalf of the people, linking the Union's survival during the Civil War to the survival of self-government.

@ 1 | - | Models of democracy
A city holds town meetings where any resident may vote directly on local budgets and laws. Which model of democracy does this best illustrate?
* Participatory democracy
- Elite democracy
- Pluralist democracy
- Indirect democracy
= Participatory democracy emphasizes broad, direct citizen involvement in politics. Elite democracy emphasizes limited participation, and pluralist democracy emphasizes group-based activism.

@ 1 | - | Models of democracy
A political scientist argues that policy results from competition among many organized interest groups, such as unions, business associations, and environmental organizations. Which model does this argument reflect?
* Pluralist democracy
- Participatory democracy
- Elite democracy
- Direct democracy
= Pluralist theory sees groups as the main vehicles of participation, with policy emerging from bargaining among them. Interest groups and the First Amendment's protections reflect this model.

@ 1 | - | Models of democracy
Which feature of the original Constitution best reflects elite democracy?
* The selection of senators by state legislatures rather than by voters
- The direct election of members of the House
- The right to petition the government
- The amendment process
= The framers limited direct popular influence over the Senate, the president (through the Electoral College), and the courts. The Seventeenth Amendment later provided for the direct election of senators.

@ 1 | - | Federalist No. 10
In Federalist No. 10, James Madison argues that the causes of faction cannot be removed without destroying liberty. What remedy does he propose?
* Controlling the effects of factions through a large republic, where many competing factions make it hard for any one to dominate
- Banning political parties and interest groups
- Creating a small, direct democracy where citizens know one another
- Giving states complete authority over policy
= Madison concluded that "the most common and durable source of factions has been the various and unequal distribution of property." A large, diverse republic with representation makes it harder for a majority faction to form and oppress others.

@ 1 | - | Brutus No. 1
Which argument did the Anti-Federalist author of Brutus No. 1 make against the proposed Constitution?
* A large republic could not represent the people's diverse interests, and the necessary and proper and supremacy clauses would let the national government swallow the states.
- The Articles of Confederation gave the national government too much power.
- The Constitution did not create a strong enough executive.
- A large republic would control factions better than a small one.
= Brutus favored a small, decentralized republic in which representatives were close to the people. He warned that broad national powers would erode state authority and individual liberty.

@ 1 | - | Federalist No. 10 and Brutus No. 1
On which issue did Federalist No. 10 and Brutus No. 1 most directly disagree?
* Whether a large republic could protect liberty and the public good
- Whether the people should have any role in government
- Whether a monarchy was preferable to a republic
- Whether the United States should declare independence
= Madison argued that size was a strength because it multiplied factions, while Brutus argued that size would make representation distant and government unresponsive.

@ 1 | - | Articles of Confederation
Which weakness of the Articles of Confederation was highlighted by Shays' Rebellion in 1786–1787?
* The national government could not raise an army or collect taxes to respond to domestic unrest.
- The national government had too much power over the states.
- The president had the power to veto state laws.
- The Supreme Court struck down state debt-relief laws.
= Under the Articles, Congress could only request money from the states and lacked an effective army. The rebellion of indebted farmers convinced many leaders that a stronger national government was needed.

@ 1 | - | Articles of Confederation
Which feature of the Articles of Confederation made it nearly impossible to fix the system's weaknesses?
* Amendments required the unanimous consent of all thirteen states.
- Amendments required a simple majority of Congress.
- The president could amend the Articles alone.
- The Supreme Court could rewrite the Articles.
= A single state could block any change. Instead of amending the Articles, the Constitutional Convention replaced them.

@ 1 | - | Constitutional compromises
The Great (Connecticut) Compromise resolved a dispute between large and small states by creating which structure?
* A bicameral Congress with representation by population in the House and equal representation in the Senate
- A unicameral Congress with equal representation for each state
- A Senate elected by population and a House with equal representation
- A president chosen by the state legislatures
= The Virginia Plan favored representation by population, and the New Jersey Plan favored equal representation. The compromise combined the two.

@ 1 | - | Constitutional compromises
The Electoral College was created at the Constitutional Convention in part as a compromise between which positions?
* Selecting the president by Congress and selecting the president by direct popular vote
- Having one president and having several presidents
- Giving the president a veto and giving no veto
- Electing senators and appointing senators
= Electors chosen by each state balanced fears of an uninformed electorate with fears of an executive dependent on Congress, and gave states a role in selecting the president.

@ 1 | - | Amendment process
Which describes the most common method of amending the Constitution?
* Proposal by a two-thirds vote of both houses of Congress and ratification by three-fourths of the state legislatures
- Proposal by the president and ratification by the Supreme Court
- Proposal by a majority of Congress and ratification by a national referendum
- Proposal by a national convention and ratification by Congress
= Article V's demanding supermajorities protect the Constitution from hasty change. Only the Twenty-first Amendment was ratified by state conventions.

@ 1 | - | Federalist No. 51
In Federalist No. 51, Madison wrote, "Ambition must be made to counteract ambition." Which constitutional principle does this best support?
* Checks and balances among separate branches
- Popular sovereignty through direct democracy
- The supremacy of the national government
- Judicial review of state laws
= Madison argued that because "If men were angels, no government would be necessary," each branch must have the means and motive to resist encroachment by the others.

@ 1 | - | Federalist No. 51
In Federalist No. 51, Madison also argued that dividing power between the national and state governments provides "a double security" to the rights of the people. What does this phrase refer to?
* Power is divided between two levels of government, and then within each level among separate branches.
- The president and vice president share executive power.
- Citizens vote for both the House and the Senate.
- Two-thirds of Congress can override a veto.
= Federalism and the separation of powers together prevent any single group from accumulating unchecked power.

@ 1 | - | Federalist No. 39
In Federalist No. 39, Madison describes the proposed government as neither wholly national nor wholly federal. Which feature best illustrates its national character?
* Members of the House of Representatives are elected directly by the people in proportion to population.
- Senators were originally chosen by state legislatures.
- The Constitution was ratified by conventions in each state.
- Amendments must be ratified by three-fourths of the states.
= Madison noted that the House draws its authority from the people of the nation, a national feature, while the Senate represents the states as equal political bodies, a federal feature.

@ 1 | - | Federalist No. 39
Which argument does Federalist No. 39 make about the federal system?
* Combining national and state features limits the concentration of power while creating multiple access points for political participation.
- The states should be abolished in favor of a unitary government.
- The national government should have no direct authority over citizens.
- Only the states can protect individual rights.
= Madison described a compound republic in which some powers rest on the people as a nation and others on the states, so that neither level dominates.

@ 1 | - | Federalism | venn
In the diagram, which type of power is represented in region Y?
* Concurrent powers
- Exclusive powers
- Reserved powers
- Implied powers
= Concurrent powers, such as taxing and borrowing, belong to both levels of government. Region X shows powers granted only to the national government, and region Z shows powers reserved to the states.

@ 1 | - | Federalism | venn
Which constitutional provision is the main basis for the powers listed in region Z?
* The Tenth Amendment
- The supremacy clause
- The necessary and proper clause
- The commerce clause
= The Tenth Amendment reserves to the states, or to the people, powers not delegated to the national government nor prohibited to the states.

@ 1 | - | McCulloch v. Maryland
In McCulloch v. Maryland (1819), the Supreme Court ruled that Congress could create a national bank and that Maryland could not tax it. Which two constitutional provisions were central to the ruling?
* The necessary and proper clause and the supremacy clause
- The commerce clause and the Tenth Amendment
- The establishment clause and the free exercise clause
- The full faith and credit clause and the privileges and immunities clause
= The necessary and proper clause gives Congress implied powers to carry out its enumerated powers, and the supremacy clause makes valid national laws superior to state laws.

@ 1 | - | United States v. Lopez
In United States v. Lopez (1995), the Supreme Court struck down the Gun-Free School Zones Act. What was the Court's reasoning?
* Carrying a gun near a school is not an economic activity that substantially affects interstate commerce, so the law exceeded Congress's commerce power.
- The law violated the Second Amendment right to bear arms.
- Congress cannot pass any laws about schools.
- The president had not signed the law.
= Lopez was the first case in decades to limit the commerce clause, supporting the reserved powers of states over matters such as local policing.

@ 1 | - | McCulloch v. Maryland and United States v. Lopez
How do the outcomes of McCulloch v. Maryland and United States v. Lopez compare?
* McCulloch expanded national power through implied powers, while Lopez limited national power by narrowing the commerce clause.
- Both expanded national power.
- Both limited national power.
- McCulloch limited national power, while Lopez expanded it.
= The two cases illustrate the ongoing debate over the balance of power between the national and state governments.

@ 1 | - | Fiscal federalism | grants
Based on the graph, which statement is accurate, and what does it suggest about federal influence over the state?
* Categorical grants grew faster than block grants, increasing federal control over how the state spends federal money.
- Block grants grew faster, increasing state discretion.
- Both types of grants declined.
- Block grants exceeded categorical grants in every year.
= Categorical grants fund specific purposes and come with strict conditions, while block grants give states more flexibility. Categorical grants nearly doubled while block grants rose only slightly.

@ 1 | - | Fiscal federalism
The national government withholds a share of federal highway funds from states that do not set the minimum drinking age at 21. What is this an example of?
* A condition attached to federal grants
- An unfunded mandate
- A block grant with no requirements
- Devolution of power to the states
= In South Dakota v. Dole (1987), the Court upheld this use of the spending power. Conditions let the national government influence policy in areas otherwise reserved to the states.

@ 1 | - | Unfunded mandates
Why do state governments often oppose unfunded mandates?
* They require states to carry out federal policies without providing the money to pay for them.
- They give states money with no requirements.
- They allow states to ignore federal laws.
- They transfer federal powers to the states.
= Requirements such as accessibility standards or environmental rules can impose large costs on states, which must raise taxes or cut other programs.

@ 1 | - | Federalism
A state legalizes the recreational use of marijuana, though federal law still prohibits it. Which concept does this conflict best illustrate?
* The ongoing tension over the balance of power between the national and state governments
- The supremacy clause being repealed
- Judicial review of state constitutions
- The full faith and credit clause
= Under the supremacy clause, federal law still applies, but the national government relies heavily on states to enforce laws. States can act as "laboratories of democracy."

@ 1 | - | Separation of powers
Which constitutional provision gives the Senate a check on the president's appointment power?
* The requirement that the Senate give "advice and consent" to nominations
- The president's power to grant pardons
- The House's power to originate revenue bills
- The president's role as commander in chief
= Nominations of judges, ambassadors, and executive officials require Senate confirmation by a majority vote.

@ 1 | - | Constitutional compromises
The Three-Fifths Compromise concerned which issue?
* How enslaved people would be counted for purposes of representation and taxation
- How many senators each state would have
- How the president would be elected
- How amendments would be ratified
= Southern states wanted enslaved people counted fully for representation, and Northern states opposed counting them. The compromise counted three-fifths of the enslaved population, increasing Southern power in the House.

@ 1 | - | Ratification
Which concession helped the Federalists secure ratification of the Constitution in states such as Massachusetts and Virginia?
* A promise to add a bill of rights through amendments
- An agreement to keep the Articles of Confederation
- A guarantee that states could leave the Union
- The elimination of the presidency
= Anti-Federalists feared that the new government would threaten individual liberties. The first Congress proposed the amendments that became the Bill of Rights.

@ 1 | - | Limited government
Which constitutional feature most directly expresses the principle of limited government?
* Article I's list of enumerated powers granted to Congress
- The president's power to veto bills
- The census every ten years
- The number of members in the House
= By listing what Congress may do, the Constitution implies that powers not granted are withheld. The Bill of Rights further limits government by protecting individual liberties.

@ 1 | - | Republicanism
Which idea most closely defines republicanism as the framers understood it?
* A system in which citizens elect representatives to make laws on their behalf
- A system in which a monarch shares power with a parliament
- A system in which all citizens vote directly on every law
- A system controlled by a single political party
= The framers favored a representative republic over direct democracy, believing that elected representatives would "refine and enlarge the public views," in Madison's phrase.

@ 1 | - | Federalism
Which constitutional clause requires states to honor the public acts, records, and judicial proceedings of other states, such as marriages and court judgments?
* The full faith and credit clause
- The privileges and immunities clause
- The supremacy clause
- The necessary and proper clause
= Article IV's full faith and credit clause promotes cooperation among states, so that, for example, a court judgment in one state can be enforced in another.

@ 1 | - | Devolution
Which policy change best illustrates devolution?
* Congress replaces several categorical grants with a single block grant that gives states more control over welfare programs.
- Congress passes a law requiring all states to adopt the same speed limit.
- The Supreme Court strikes down a state law under the supremacy clause.
- The president issues an executive order directing state officials.
= Devolution shifts responsibility from the national government to the states. The 1996 welfare reform law, which created block grants to states, is a classic example.

@ 1 | - | Constitutional interpretation
The commerce clause has been used to justify a wide range of federal laws, from civil rights protections in restaurants to environmental regulations. Which best explains this expansion?
* The Supreme Court has interpreted "commerce among the several States" broadly to include activities that substantially affect interstate commerce.
- The Constitution lists all of these regulations explicitly.
- States have voluntarily given these powers to Congress.
- The president has the power to define commerce.
= Cases such as Heart of Atlanta Motel v. United States (1964) upheld civil rights laws under the commerce clause, while Lopez showed that the power has limits.

@ 1 | - | Social contract
Which statement best describes social contract theory as it influenced the founders?
* People agree to form a government and give up some freedoms in exchange for the protection of their natural rights.
- Rulers receive authority directly from God.
- Government power comes from military strength.
- People have no rights until a government grants them.
= In Locke's version, government's legitimacy rests on the consent of the governed, and people may alter or abolish a government that violates their rights.

@ 1 | - | Constitutional design
Why did the framers include the necessary and proper clause in Article I?
* To give Congress flexibility to carry out its enumerated powers in ways the framers could not anticipate
- To limit Congress to only the powers listed
- To give the states the power to override Congress
- To create the Supreme Court
= Also called the elastic clause, it allowed national power to grow as the country changed, a result Anti-Federalists such as Brutus feared.

@ 1 | - | Articles of Confederation
Which feature of the Articles of Confederation reflected the founders' fear of a strong central government after the Revolution?
* There was no national executive or judiciary, and each state had one vote in Congress.
- The national government could levy taxes directly on citizens.
- The president commanded a large standing army.
- The national government controlled all trade between states.
= After experiencing what they saw as tyranny under the British king, the states created a weak national government. Its failures led to the Constitutional Convention.

@ 1 | - | Federalism
Which of the following is an example of a power the Constitution denies to state governments?
* Coining money and entering into treaties with foreign nations
- Establishing public schools
- Conducting elections
- Collecting taxes
= Article I, Section 10 prohibits states from coining money, making treaties, and taxing imports without the consent of Congress.

@ 2 | - | Congress
Which power is given to the House of Representatives but not to the Senate?
* Originating revenue bills and bringing articles of impeachment
- Ratifying treaties
- Confirming federal judges
- Trying impeachment cases
= The House, closer to the people with two-year terms, starts bills for raising revenue and impeaches officials. The Senate ratifies treaties, confirms appointments, and holds impeachment trials.

@ 2 | - | Congress
Why is the Senate generally considered more deliberative than the House?
* It is smaller, its members serve longer six-year terms, and its rules allow unlimited debate.
- Its members are elected every two years.
- It has a powerful Rules Committee that limits debate.
- Its members represent smaller districts.
= Longer terms and staggered elections insulate senators from short-term public pressure, and the filibuster allows extended debate.

@ 2 | - | Legislative process | billFlow
At stage J of the flowchart, most bills that are introduced in Congress:
* never advance, because committees decline to hold hearings or vote on them
- are automatically sent to the president
- are approved with no changes
- are reviewed by the Supreme Court
= Committees are the main filters of the legislative process. Committee chairs decide which bills receive attention, so most bills die in committee.

@ 2 | - | Legislative process | billFlow
At stage K of the flowchart, the president neither signs nor vetoes a bill, and Congress adjourns within ten days (excluding Sundays) of sending it. What happens to the bill?
* It is killed by a pocket veto.
- It becomes law automatically.
- It returns to committee.
- It is sent to the Supreme Court.
= If Congress remains in session, an unsigned bill becomes law after ten days. If Congress has adjourned, the bill dies, and Congress cannot override a pocket veto.

@ 2 | - | Senate procedures | cloture
Which conclusion about the Senate is best supported by the graph?
* The use of filibusters, as measured by attempts to end debate, has increased greatly, making a 60-vote supermajority effectively necessary for most major legislation.
- The Senate has eliminated the filibuster.
- Cloture motions have become less common since the 1970s.
- The House now uses cloture motions more than the Senate.
= Cloture requires three-fifths of senators, normally 60 votes. More cloture motions indicate more frequent filibusters or threatened filibusters.

@ 2 | - | Senate procedures | cloture
Which is a likely consequence of the trend shown in the graph?
* Legislation is harder to pass, especially during divided government, contributing to gridlock.
- Bills pass the Senate more quickly.
- The House gains the power to confirm judges.
- The president gains the power to end filibusters.
= When the majority party has fewer than 60 seats, the minority can block most bills. The Senate has created exceptions, such as reconciliation for some budget bills and a simple majority for nominations.

@ 2 | - | House procedures
Which committee in the House of Representatives sets the terms of debate for most bills, including whether amendments may be offered?
* The Rules Committee
- The Ways and Means Committee
- The Appropriations Committee
- The Judiciary Committee
= The Rules Committee, controlled by the majority party, is a key tool of the Speaker. Closed rules prevent amendments, while open rules allow them.

@ 2 | - | Legislative process
The House and Senate pass different versions of the same bill. Which committee usually resolves the differences?
* A conference committee
- A standing committee
- A select committee
- The Rules Committee
= A conference committee includes members of both chambers. Its compromise version must be passed again by both chambers before going to the president.

@ 2 | - | Congressional representation
A member of Congress votes for a bill that most constituents oppose because the member believes it serves the national interest. Which model of representation does this illustrate?
* The trustee model
- The delegate model
- The politico model
- The partisan model
= Trustees rely on their own judgment. Delegates follow constituents' wishes, and politicos balance the two depending on the issue.

@ 2 | - | Redistricting
Which case established that federal courts could hear challenges to legislative apportionment, opening the way to the "one person, one vote" principle?
* Baker v. Carr (1962)
- Shaw v. Reno (1993)
- Marbury v. Madison (1803)
- Citizens United v. FEC (2010)
= Before Baker, courts treated redistricting as a political question. Unequal district populations dilute the votes of people in larger districts, violating the equal protection clause.

@ 2 | - | Redistricting
In Shaw v. Reno (1993), the Supreme Court addressed a bizarrely shaped congressional district in North Carolina. What did the Court hold?
* Districts drawn primarily on the basis of race may violate the equal protection clause and must be subjected to strict scrutiny.
- Districts must have equal populations.
- States may draw districts based entirely on race to increase minority representation.
- Federal courts may not review redistricting decisions.
= Shaw limited majority-minority districting, ruling that race cannot be the predominant factor in drawing districts unless narrowly tailored to a compelling interest.

@ 2 | - | Gerrymandering
A state legislature draws district lines so that the opposing party's voters are concentrated in a few districts and spread thinly across the rest. Which practice is this?
* Partisan gerrymandering, through "packing" and "cracking"
- Reapportionment based on the census
- Malapportionment of the Senate
- Racial gerrymandering approved by Shaw v. Reno
= Packing concentrates opponents into a few districts they win overwhelmingly, while cracking divides them among many districts they lose. Both maximize the drawing party's seats.

@ 2 | - | Congressional spending | budget
Based on the graph, which statement best explains why Congress has limited control over most federal spending in a given year?
* Most spending is mandatory, determined by existing laws for entitlement programs such as Social Security and Medicare, rather than by annual appropriations.
- Most spending is discretionary and controlled by the president.
- Interest on the debt is the largest category of spending.
- The Supreme Court sets mandatory spending levels.
= Mandatory spending continues automatically unless Congress changes the underlying law. Only the discretionary portion is set each year through appropriations bills.

@ 2 | - | Congressional spending
A member of Congress adds funding for a new bridge in the member's district to a larger spending bill. What is this called?
* Pork barrel spending, often through an earmark
- Logrolling
- A filibuster
- An unfunded mandate
= Pork barrel spending directs federal money to a member's district, which can help reelection. Logrolling is trading votes with other members to pass such projects.

@ 2 | - | Divided government
Which outcome is most likely during a period of divided government?
* Gridlock, with fewer major laws passed and more vetoes and confirmation battles
- Faster passage of the president's agenda
- No use of the veto
- Automatic confirmation of nominees
= When different parties control Congress and the presidency, each can block the other's priorities, making compromise necessary for major legislation.

@ 2 | - | Presidential powers | vetoes
Based on the table, which president most likely faced a Congress controlled by the opposing party?
* President B, who issued many vetoes in only four years and had a large number overridden
- President A, who served eight years
- President C, who issued few vetoes
- None, because all had similar veto records
= Frequent vetoes and overrides indicate conflict with a hostile Congress. Overrides require two-thirds of both chambers, so many overrides suggest strong opposition.

@ 2 | - | Presidential powers | vetoes
What percentage of President B's regular vetoes did Congress override?
* \(30\%\)
- \(9\%\)
- \(26\%\)
- \(70\%\)
= Nine of the 30 regular vetoes were overridden: \(\tfrac{9}{30}=30\%\). Pocket vetoes cannot be overridden, so they are excluded from the calculation.

@ 2 | - | Federalist No. 70
In Federalist No. 70, Alexander Hamilton argued that "Energy in the executive is a leading character in the definition of good government." What did he favor?
* A single executive able to act quickly and be held accountable
- An executive council of several people sharing power
- A weak executive subordinate to Congress
- An executive chosen by the Supreme Court
= Hamilton argued that unity, rather than a plural executive, produces decisiveness, secrecy when needed, and clear responsibility.

@ 2 | - | Presidential powers
Which is an informal power of the president?
* Issuing executive orders to direct the executive branch
- Vetoing bills passed by Congress
- Serving as commander in chief
- Granting pardons
= Informal powers are not listed in the Constitution but have developed over time, such as executive orders, executive agreements, and signing statements. The veto, command of the military, and pardons are formal powers.

@ 2 | - | Presidential powers
Why do presidents often negotiate executive agreements rather than treaties with foreign nations?
* Executive agreements do not require ratification by two-thirds of the Senate.
- Executive agreements require approval by the House.
- Treaties cannot be negotiated by the president.
- Executive agreements are permanent and cannot be changed.
= Executive agreements avoid the Senate's supermajority requirement, but a later president can more easily reverse them.

@ 2 | - | Presidential communication
A president gives a televised address urging the public to pressure Congress to pass a bill. Which concept does this illustrate?
* Using the bully pulpit to go public
- Exercising a formal constitutional power
- Issuing a signing statement
- Using a pocket veto
= Presidents use their visibility to shape public opinion and influence Congress. Modern media and social media have made this informal power more important.

@ 2 | - | Presidential term limits
Which amendment limits a president to two elected terms?
* The Twenty-second Amendment
- The Twentieth Amendment
- The Twenty-fifth Amendment
- The Seventeenth Amendment
= Ratified in 1951 after Franklin Roosevelt won four elections, it formalized the two-term tradition set by Washington.

@ 2 | - | Federalist No. 78
In Federalist No. 78, Hamilton called the judiciary "the least dangerous" branch. Which reason did he give?
* It has neither the power of the sword nor the power of the purse, only judgment.
- Judges are elected every two years.
- The judiciary can be abolished by the president.
- Judges must follow public opinion.
= Courts depend on the other branches to enforce their rulings. Hamilton argued that life tenure during good behavior would protect judicial independence.

@ 2 | - | Marbury v. Madison
What principle did the Supreme Court establish in Marbury v. Madison (1803)?
* Judicial review, the power of courts to declare acts of Congress unconstitutional
- The supremacy of state law over federal law
- The right to counsel for criminal defendants
- Congress's power to create a national bank
= Chief Justice John Marshall ruled that part of the Judiciary Act of 1789 conflicted with the Constitution and was void, asserting the Court's role in interpreting the Constitution.

@ 2 | - | Judicial decision making
A justice argues that courts should defer to elected branches and overturn their laws only when they clearly violate the Constitution. Which philosophy does this reflect?
* Judicial restraint
- Judicial activism
- Stare decisis
- Judicial review
= Restraint emphasizes the limited role of unelected judges. Activism is a willingness to strike down laws or depart from precedent to protect rights.

@ 2 | - | Judicial decision making
Why does the principle of stare decisis promote stability in the law?
* It encourages courts to follow precedents set in earlier cases.
- It requires courts to follow public opinion.
- It allows judges to ignore earlier decisions.
- It requires unanimous decisions.
= Following precedent makes the law predictable. Courts can still overturn precedent, as Brown v. Board of Education did with Plessy v. Ferguson.

@ 2 | - | Checks on the judiciary
Which is a check that Congress has on the federal courts?
* Proposing constitutional amendments to reverse a decision, and changing the courts' appellate jurisdiction
- Firing judges whose decisions it disagrees with
- Lowering the salaries of sitting judges
- Requiring the Supreme Court to issue advisory opinions
= Congress can also pass new legislation, confirm or reject nominees, and impeach judges for misconduct. Judges' salaries cannot be reduced while they serve.

@ 2 | - | Bureaucracy
A congressional committee, an executive agency, and an interest group form a stable, mutually beneficial relationship over farm policy. What is this relationship called?
* An iron triangle
- An issue network
- A conference committee
- A cabinet
= Interest groups provide electoral support to members of Congress, Congress provides funding and favorable laws for the agency, and the agency provides favorable regulation to the group.

@ 2 | - | Bureaucracy
Congress passes a law requiring "clean air" and leaves the Environmental Protection Agency to set specific pollution limits. Which concept does this illustrate?
* Delegated discretionary authority
- Judicial review
- Executive privilege
- A pocket veto
= Congress often writes broad laws and relies on agencies' expertise to make detailed rules. This gives the bureaucracy considerable policy-making power.

@ 2 | - | Bureaucratic accountability
Which is a way Congress holds the federal bureaucracy accountable?
* Holding oversight hearings and controlling agency budgets through appropriations
- Appointing agency heads without the president
- Issuing executive orders to agencies
- Reviewing agency regulations in the Supreme Court
= Committees investigate agencies and can restrict funding or rewrite their authority. The president also controls the bureaucracy by appointing and removing top officials.

@ 2 | - | Bureaucracy
Which law created the merit-based civil service system, in which most federal jobs are filled by competitive examination rather than political loyalty?
* The Pendleton Civil Service Act (1883)
- The War Powers Resolution (1973)
- The Voting Rights Act (1965)
- The Federal Election Campaign Act (1971)
= The act was passed after the assassination of President Garfield by a disappointed office seeker, ending much of the spoils system.

@ 2 | - | War powers
The War Powers Resolution of 1973 was intended to do which of the following?
* Limit the president's ability to commit troops abroad without congressional approval
- Give the president the power to declare war
- Allow the Supreme Court to approve military actions
- End the president's role as commander in chief
= It requires the president to notify Congress within 48 hours and to withdraw troops within 60 days without authorization, reflecting Congress's check on the president's military power.

@ 2 | - | Impeachment
Which correctly describes the impeachment process?
* The House impeaches with a majority vote, and the Senate removes the official only with a two-thirds vote after a trial.
- The Senate impeaches, and the House holds the trial.
- The Supreme Court impeaches, and Congress removes.
- A simple majority of the Senate removes the official.
= The high bar for removal means that no president has been removed by the Senate, though several have been impeached.

@ 2 | - | Congressional powers
Which power of Congress derives from the necessary and proper clause rather than from an enumerated power?
* Creating a national bank
- Declaring war
- Coining money
- Regulating commerce with foreign nations
= McCulloch v. Maryland held that creating a bank was a reasonable means to carry out enumerated powers such as taxing and borrowing.

@ 2 | - | Legislative process
Which describes a discharge petition in the House?
* A way for a majority of members to force a bill out of a committee that has refused to act on it
- A motion to end a filibuster
- A vote to override a veto
- A request for the president to sign a bill
= It requires 218 signatures, a majority of the House, and lets members bypass committee chairs and leadership, though it is rarely successful.

@ 2 | - | Policy making
A senator agrees to vote for another senator's farm bill in exchange for support of the first senator's highway bill. What is this practice called?
* Logrolling
- Filibustering
- Gerrymandering
- Pork barrel spending
= Logrolling is the trading of votes to build coalitions. It often accompanies pork barrel spending.

@ 2 | - | Executive branch
The president issues a signing statement while signing a bill. What is its purpose?
* To explain the president's interpretation of the law and sometimes signal parts the president considers unconstitutional or will not enforce
- To veto part of a bill
- To send the bill back to Congress
- To make the law take effect immediately
= Presidents have no line-item veto. Signing statements are an informal tool that critics argue can undermine congressional intent.

@ 2 | - | Judicial appointments
Why are presidents' nominations to the federal courts often highly contested?
* Judges serve for life, so their decisions can shape policy long after the president leaves office.
- Judges serve only four-year terms.
- Judges are elected by the public after confirmation.
- The House must approve every nominee.
= Because of life tenure and the power of judicial review, appointments have long-lasting policy effects, especially to the Supreme Court.

@ 3 | - | Bill of Rights
Which amendment protects against unreasonable searches and seizures?
* The Fourth Amendment
- The Fifth Amendment
- The Sixth Amendment
- The Eighth Amendment
= The Fourth Amendment generally requires warrants supported by probable cause. The exclusionary rule bars illegally obtained evidence from trial.

@ 3 | - | Selective incorporation | incorporation
Which constitutional provision has the Supreme Court used to apply most of the Bill of Rights to the states, as shown in the table?
* The due process clause of the Fourteenth Amendment
- The supremacy clause
- The Tenth Amendment
- The necessary and proper clause
= Originally, the Bill of Rights limited only the national government. Through selective incorporation, the Court has applied most of its protections to the states case by case.

@ 3 | - | Selective incorporation | incorporation
Which conclusion is supported by the table?
* Incorporation has occurred gradually over many decades, case by case, and continued into the twenty-first century.
- All rights were incorporated at once in 1868.
- The Second Amendment was incorporated before the First Amendment.
- Incorporation ended in 1963.
= The Fourteenth Amendment was ratified in 1868, but rights were applied to the states one at a time through cases such as Gitlow, Gideon, McDonald, and Timbs.

@ 3 | - | McDonald v. Chicago
In McDonald v. Chicago (2010), the Supreme Court considered a city's handgun ban. What did it hold?
* The Second Amendment right to keep and bear arms applies to state and local governments through the Fourteenth Amendment.
- The Second Amendment applies only to the national government.
- Cities may ban all firearms.
- The Second Amendment protects only state militias.
= Building on District of Columbia v. Heller (2008), which recognized an individual right to keep a handgun at home, McDonald incorporated that right against the states.

@ 3 | - | Establishment clause
In Engel v. Vitale (1962), the Supreme Court ruled on a New York policy of beginning the school day with a state-written, nondenominational prayer. What did it hold?
* School-sponsored prayer in public schools violates the establishment clause, even if voluntary and nondenominational.
- Students may not pray privately at school.
- The free exercise clause requires schools to hold prayer.
- Religious schools may not receive any public services.
= The establishment clause bars government endorsement of religion. Students remain free to pray on their own.

@ 3 | - | Free exercise clause
In Wisconsin v. Yoder (1972), what did the Supreme Court decide about Amish parents who refused to send their children to school after eighth grade?
* The state's compulsory education law, as applied, violated the parents' free exercise of religion.
- The parents were required to send their children to high school.
- The establishment clause required the state to fund Amish schools.
- The case violated the Fourteenth Amendment's equal protection clause.
= The Court held that the state's interest in two more years of schooling did not outweigh the Amish community's religious way of life.

@ 3 | - | Establishment and free exercise
Which situation would most likely raise a free exercise clause challenge rather than an establishment clause challenge?
* A state law prohibits a religious group from using a substance in its ceremonies.
- A public school leads students in daily prayer.
- A city funds the construction of a church.
- A state declares an official religion.
= The free exercise clause protects individuals' religious practice from government interference. The establishment clause prevents government from promoting or endorsing religion.

@ 3 | - | Symbolic speech
In Tinker v. Des Moines Independent Community School District (1969), what did the Supreme Court decide about students who wore black armbands to protest the Vietnam War?
* The armbands were protected symbolic speech, because they did not substantially disrupt school activities.
- Students lose their free speech rights at school.
- The school could ban the armbands to avoid any controversy.
- Only spoken words are protected by the First Amendment.
= Students do not "shed their constitutional rights … at the schoolhouse gate." Schools may restrict speech only if it would materially and substantially disrupt education.

@ 3 | - | Limits on speech
In Schenck v. United States (1919), the Court upheld the conviction of a man who distributed leaflets urging resistance to the military draft during World War I. Which test did the Court establish?
* The clear and present danger test
- The strict scrutiny test
- The actual malice test
- The Lemon test
= Justice Holmes wrote that speech creating a clear and present danger of substantive evils that Congress may prevent is not protected. Later cases, such as Brandenburg v. Ohio (1969), narrowed this test.

@ 3 | - | Freedom of the press
In New York Times Co. v. United States (1971), the government tried to stop newspapers from publishing the Pentagon Papers. What did the Supreme Court decide?
* The government failed to justify prior restraint, so the newspapers could publish the documents.
- The government may always block publication of classified documents.
- Newspapers are not protected by the First Amendment.
- The newspapers were guilty of treason.
= Prior restraint, preventing publication in advance, carries a heavy presumption against its constitutionality. The government must show grave and immediate harm.

@ 3 | - | Rights of the accused
In Gideon v. Wainwright (1963), what did the Supreme Court decide?
* States must provide an attorney to defendants in felony cases who cannot afford one.
- Police must inform suspects of their rights before questioning.
- Illegally obtained evidence cannot be used in state courts.
- The death penalty is unconstitutional.
= Gideon incorporated the Sixth Amendment right to counsel. Miranda v. Arizona (1966) required warnings before questioning, and Mapp v. Ohio (1961) applied the exclusionary rule to the states.

@ 3 | - | Rights of the accused
Police question a suspect in custody without informing the suspect of the right to remain silent. The suspect confesses. Which outcome is most likely?
* The confession may be excluded from trial under Miranda v. Arizona.
- The confession must be used because it was voluntary.
- The suspect is automatically acquitted.
- The case is moved to federal court.
= Miranda requires warnings about the rights to remain silent and to an attorney before custodial interrogation, protecting the Fifth Amendment privilege against self-incrimination.

@ 3 | - | Right to privacy
Roe v. Wade (1973) extended the right to privacy to include a woman's decision to have an abortion. What later happened to this precedent?
* It was overturned in Dobbs v. Jackson Women's Health Organization (2022), returning the regulation of abortion to the states.
- It was strengthened by Planned Parenthood v. Casey to ban all state regulation.
- It was made part of the Constitution by amendment.
- It still governs abortion law nationwide without change.
= The Dobbs majority held that the Constitution does not confer a right to abortion, illustrating that the Court can overturn its own precedents.

@ 3 | - | Right to privacy
The right to privacy that the Supreme Court has recognized in some cases is best described as:
* an implied right derived from several amendments, including the protections of the First, Third, Fourth, Fifth, and Ninth Amendments and the due process clause
- a right explicitly listed in the First Amendment
- a right created by Congress through legislation
- a right found only in state constitutions
= Griswold v. Connecticut (1965) found privacy in the "penumbras" of several amendments. Because it is not explicit, its scope remains debated.

@ 3 | - | Eighth Amendment
Which right is protected by the Eighth Amendment?
* Protection against cruel and unusual punishment and excessive bail
- The right to a speedy and public trial
- Protection against double jeopardy
- The right to bear arms
= The Court has used the Eighth Amendment to limit the death penalty, for example for crimes committed by juveniles. The speedy trial right is in the Sixth Amendment.

@ 3 | - | Equal protection
Which case overturned the "separate but equal" doctrine of Plessy v. Ferguson in public education?
* Brown v. Board of Education (1954)
- Baker v. Carr (1962)
- Shaw v. Reno (1993)
- Marbury v. Madison (1803)
= The Court held unanimously that segregated public schools were "inherently unequal" and violated the equal protection clause of the Fourteenth Amendment.

@ 3 | - | Civil rights
Which effect did Brown v. Board of Education have, and what limited its immediate impact?
* It declared school segregation unconstitutional, but many Southern states resisted, and desegregation proceeded slowly until federal enforcement increased.
- It immediately ended segregation in all schools.
- It upheld segregation in public schools.
- It applied only to private schools.
= Brown II (1955) ordered desegregation "with all deliberate speed," and resistance was widespread. The Civil Rights Act of 1964 gave the federal government tools to cut off funds to segregated schools.

@ 3 | - | Emancipation Proclamation
Which statement accurately describes the Emancipation Proclamation of 1863?
* It declared enslaved people free in states in rebellion against the United States, and the Thirteenth Amendment later abolished slavery everywhere in the country.
- It abolished slavery in every state, including those loyal to the Union.
- It granted formerly enslaved men the right to vote.
- It was a constitutional amendment ratified by the states.
= Issued as a war measure, the proclamation did not apply to loyal border states. The Thirteenth Amendment, ratified in 1865, permanently abolished slavery and began a shift toward civil rights for the formerly enslaved.

@ 3 | - | Letter from Birmingham Jail
In his "Letter from Birmingham Jail," Martin Luther King Jr. wrote that "Injustice anywhere is a threat to justice everywhere." Which argument does the letter make?
* People have a moral responsibility to disobey unjust laws through nonviolent civil disobedience and to act without waiting.
- Change should come only through the courts, at a gradual pace.
- Violence is justified to achieve civil rights.
- Segregation should be decided by each state.
= King responded to clergy who called his protests "unwise and untimely," arguing that "wait" had almost always meant "never" and that unjust laws do not deserve obedience.

@ 3 | - | Voting rights | registration
Which federal action most likely explains the change shown in the graph between 1964 and 1968?
* The Voting Rights Act of 1965, which banned literacy tests and authorized federal oversight of voter registration
- The Nineteenth Amendment, which gave women the right to vote
- The Seventeenth Amendment, which provided for the direct election of senators
- The Twenty-sixth Amendment, which lowered the voting age to 18
= Federal examiners registered voters directly in counties with histories of discrimination. The act is widely considered the most effective civil rights law.

@ 3 | - | Voting rights | registration
By how many percentage points did registration increase from 1964 to 1968, according to the graph?
* \(52\) percentage points
- \(59\) percentage points
- About \(740\) percentage points
- \(7\) percentage points
= Registration rose from \(7\%\) to \(59\%\), an increase of \(59-7=52\) percentage points. In relative terms, the registered share increased more than eightfold.

@ 3 | - | Civil rights legislation
Which law prohibited discrimination in public accommodations, such as hotels and restaurants, on the basis of race?
* The Civil Rights Act of 1964
- The Voting Rights Act of 1965
- Title IX of the Education Amendments of 1972
- The Americans with Disabilities Act of 1990
= Congress based the law partly on its commerce power, and the Supreme Court upheld it. Title VII of the same law prohibited employment discrimination.

@ 3 | - | Civil rights legislation
Title IX of the Education Amendments of 1972 prohibits discrimination on the basis of sex in which settings?
* Education programs and activities that receive federal funds
- All private businesses
- Only military academies
- Elections for federal office
= Title IX dramatically increased opportunities for women and girls in education and school athletics, using federal funding as leverage.

@ 3 | - | Civil liberties and civil rights
Which statement correctly distinguishes civil liberties from civil rights?
* Civil liberties protect individuals from government interference, while civil rights protect individuals from discrimination.
- Civil liberties apply only to citizens, while civil rights apply to everyone.
- Civil rights are found in the Bill of Rights, while civil liberties are found in the Fourteenth Amendment.
- The two terms mean the same thing.
= Liberties, such as free speech, limit what government may do. Rights, such as equal protection, require government to treat people equally.

@ 3 | - | Balancing liberty and order
After a terrorist attack, Congress expands government surveillance powers. Which tension does this best illustrate?
* Balancing individual liberty and privacy against national security and public order
- Balancing federal and state power over elections
- Balancing the powers of the House and Senate
- Balancing free exercise and establishment of religion
= Courts weigh government interests against Fourth Amendment protections. Laws such as the USA PATRIOT Act prompted debate over this balance.

@ 3 | - | Free speech
Which type of speech receives the least First Amendment protection?
* Speech intended to incite imminent lawless action
- Criticism of government officials
- Political advertisements
- Peaceful protest on a public sidewalk
= Under Brandenburg v. Ohio (1969), speech may be punished if it is directed to inciting imminent lawless action and is likely to do so. Political speech receives the highest protection.

@ 3 | - | Affirmative action
In Students for Fair Admissions v. Harvard (2023), the Supreme Court addressed race-conscious college admissions. What did it hold?
* The admissions programs violated the equal protection clause, sharply limiting the use of race as a factor in admissions.
- Colleges must use racial quotas.
- Race must be the main factor in admissions.
- The case applied only to private high schools.
= The decision effectively ended race-conscious admissions programs at colleges that receive federal funds, reversing the approach of earlier cases such as Grutter v. Bollinger.

@ 3 | - | Social movements
Which strategy was central to the civil rights movement's success in the 1950s and 1960s?
* Nonviolent protest, such as boycotts and sit-ins, combined with litigation and pressure on Congress
- Armed rebellion against the federal government
- Relying only on state legislatures
- Avoiding the courts
= The NAACP's legal strategy won Brown, while protests such as the Montgomery bus boycott built public support for the landmark laws of 1964 and 1965.

@ 3 | - | Equal protection
Which amendment's equal protection clause has been the main constitutional basis for civil rights protections against state discrimination?
* The Fourteenth Amendment
- The First Amendment
- The Tenth Amendment
- The Twenty-sixth Amendment
= Ratified in 1868, the Fourteenth Amendment declares that no state may "deny to any person within its jurisdiction the equal protection of the laws."

@ 3 | - | Free speech
A public university punishes a student for a peaceful political speech that criticized the university's president. Which constitutional protection is most directly involved?
* The First Amendment's protection of free speech, applied to the state university through the Fourteenth Amendment
- The Fourth Amendment's protection against searches
- The Second Amendment's right to bear arms
- The Tenth Amendment's reserved powers
= Public universities are government actors, so they are bound by the First Amendment. Private universities are generally not, though some states extend similar protections.

@ 3 | - | Minority rights
Which statement best explains why the protection of minority rights has sometimes depended on the courts rather than on Congress?
* Courts are insulated from majority opinion by life tenure, so they can protect unpopular minorities when elected officials will not.
- Courts are elected and must follow majority opinion.
- Congress has no power to protect civil rights.
- The Constitution prohibits Congress from passing civil rights laws.
= Brown v. Board of Education came a decade before major civil rights legislation. Courts, however, depend on other branches to enforce their decisions.

@ 2 | - | Executive privilege
In United States v. Nixon (1974), the president claimed executive privilege to withhold tape recordings subpoenaed in a criminal investigation. What did the Supreme Court decide?
* Executive privilege is not absolute, and the president had to turn over the tapes.
- The president may withhold any information from the courts.
- Congress, not the courts, decides claims of executive privilege.
- The president is immune from all criminal investigations.
= The Court recognized a limited privilege but held that it must yield to the specific needs of a criminal trial, reinforcing the rule of law. Nixon resigned soon afterward.

@ 2 | - | Bureaucracy
Why do independent regulatory commissions, such as the Federal Communications Commission, have more independence from the president than cabinet departments?
* Their members serve fixed, staggered terms and generally cannot be removed simply for policy disagreements.
- Their members are elected by the public.
- They are part of the judicial branch.
- They are funded by private donations.
= Cabinet secretaries serve at the president's pleasure. Commissions are designed to make expert decisions insulated from short-term political pressure, often with members from both parties.

@ 3 | - | Rights of the accused
In Mapp v. Ohio (1961), what did the Supreme Court decide?
* Evidence obtained through an illegal search may not be used in state criminal trials.
- Police may search homes without a warrant.
- Defendants must be provided with attorneys.
- Suspects must be informed of their rights.
= Mapp incorporated the exclusionary rule, applying the Fourth Amendment to state courts. The Court has since recognized exceptions, such as good-faith reliance on a warrant.

@ 3 | - | Free speech
A city requires protesters to obtain a permit and limits protests near a hospital to daytime hours, regardless of the protesters' message. How are courts likely to view this policy?
* As a permissible time, place, and manner restriction, if it is content-neutral and leaves other ways to communicate
- As unconstitutional, because the First Amendment allows no restrictions on speech
- As permissible only if it targets the protesters' message
- As a violation of the establishment clause
= Government may regulate when, where, and how speech occurs, as long as the rules do not discriminate based on content and are narrowly tailored to a significant interest.

@ 3 | - | Freedom of the press
Under New York Times Co. v. Sullivan (1964), what must a public official prove to win a libel suit against a newspaper?
* That the newspaper published a false statement with actual malice, knowing it was false or with reckless disregard for the truth
- That the article was critical of the official
- That the newspaper made any factual error
- That the article caused the official to lose an election
= The high standard protects robust debate about public officials. Private individuals generally face a lower burden of proof.

@ 3 | - | Establishment clause
A public high school invites a member of the clergy to lead a prayer at its graduation ceremony. Based on the reasoning in Engel v. Vitale, how would a court most likely rule?
* The prayer is unconstitutional, because it is school-sponsored religious activity that pressures students to participate.
- The prayer is constitutional, because graduation is optional.
- The prayer is required by the free exercise clause.
- The prayer is constitutional, because it is led by clergy rather than a teacher.
= In Lee v. Weisman (1992), the Court applied similar reasoning to graduation prayers. School sponsorship makes the religious activity government endorsement.

@ 3 | - | Free exercise
Which limit on the free exercise of religion has the Supreme Court recognized?
* Generally applicable laws that are neutral toward religion may be enforced even if they burden some religious practices.
- Religious beliefs may be punished by government.
- Religious groups are exempt from all laws.
- Only established religions are protected.
= In Employment Division v. Smith (1990), the Court held that a neutral drug law could be applied to religious ceremonies. Congress responded with the Religious Freedom Restoration Act.

@ 3 | - | Unenumerated rights
Which amendment states that the listing of certain rights in the Constitution does not deny other rights retained by the people?
* The Ninth Amendment
- The Tenth Amendment
- The First Amendment
- The Fourteenth Amendment
= The Ninth Amendment answered the Federalist concern that listing rights might imply that unlisted rights were unprotected. It has been cited in privacy cases.

@ 3 | - | Equal protection
Which level of scrutiny do courts apply to laws that classify people by race?
* Strict scrutiny, requiring a compelling government interest and a narrowly tailored law
- Rational basis review, the most lenient standard
- Intermediate scrutiny, as for classifications by sex
- No review, because race classifications are left to legislatures
= Racial classifications are presumed unconstitutional and rarely survive strict scrutiny. Classifications by sex receive intermediate scrutiny, and most others receive rational basis review.

@ 3 | - | Reconstruction amendments
Which statement best describes the Reconstruction amendments?
* The Thirteenth abolished slavery, the Fourteenth guaranteed citizenship, due process, and equal protection, and the Fifteenth prohibited denying the vote on the basis of race.
- They gave women the right to vote.
- They established the Bill of Rights.
- They limited presidents to two terms.
= These amendments expanded civil rights after the Civil War, though Southern states used poll taxes, literacy tests, and violence to undermine them for nearly a century.

@ 3 | - | Civil rights legislation
Which requirement of the Americans with Disabilities Act of 1990 reflects the principle of equal protection for people with disabilities?
* Employers and public accommodations must make reasonable accommodations and remove barriers to access.
- Public schools must be segregated by disability.
- People with disabilities may not hold public office.
- Only federal agencies must comply.
= The ADA extended civil rights protections modeled on the Civil Rights Act of 1964 to people with disabilities, in employment, transportation, and public accommodations.
`;

module.exports = { source, figures };
