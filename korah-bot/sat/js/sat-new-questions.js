(() => {
  // ── 270 New College Board Questions ──
  const NEW_QUESTIONS = [
    {id:"58817765",s:"english",d:"Information and Ideas",sk:"Inferences",sc:"INF",df:"H"},
    {id:"8e6a96f5",s:"english",d:"Information and Ideas",sk:"Inferences",sc:"INF",df:"H"},
    {id:"09d942c6",s:"english",d:"Information and Ideas",sk:"Inferences",sc:"INF",df:"H"},
    {id:"5bcee487",s:"english",d:"Information and Ideas",sk:"Inferences",sc:"INF",df:"M"},
    {id:"5f16d809",s:"english",d:"Information and Ideas",sk:"Inferences",sc:"INF",df:"H"},
    {id:"7bdf094b",s:"english",d:"Information and Ideas",sk:"Inferences",sc:"INF",df:"H"},
    {id:"db57afa3",s:"english",d:"Information and Ideas",sk:"Inferences",sc:"INF",df:"H"},
    {id:"8209f485",s:"english",d:"Information and Ideas",sk:"Inferences",sc:"INF",df:"H"},
    {id:"6abe5e3c",s:"english",d:"Information and Ideas",sk:"Inferences",sc:"INF",df:"E"},
    {id:"71c2cea9",s:"english",d:"Information and Ideas",sk:"Inferences",sc:"INF",df:"H"},
    {id:"b603f00b",s:"english",d:"Information and Ideas",sk:"Inferences",sc:"INF",df:"H"},
    {id:"6ca4f991",s:"english",d:"Information and Ideas",sk:"Inferences",sc:"INF",df:"M"},
    {id:"f9884b7a",s:"english",d:"Information and Ideas",sk:"Inferences",sc:"INF",df:"M"},
    {id:"b9a3941b",s:"english",d:"Information and Ideas",sk:"Inferences",sc:"INF",df:"H"},
    {id:"45f66433",s:"english",d:"Information and Ideas",sk:"Inferences",sc:"INF",df:"H"},
    {id:"27ea642e",s:"english",d:"Information and Ideas",sk:"Inferences",sc:"INF",df:"H"},
    {id:"2903668a",s:"english",d:"Information and Ideas",sk:"Command of Evidence",sc:"COE",df:"H"},
    {id:"ebe1eabd",s:"english",d:"Information and Ideas",sk:"Command of Evidence",sc:"COE",df:"H"},
    {id:"7575e417",s:"english",d:"Information and Ideas",sk:"Command of Evidence",sc:"COE",df:"H"},
    {id:"d6e97054",s:"english",d:"Information and Ideas",sk:"Command of Evidence",sc:"COE",df:"E"},
    {id:"b0b40727",s:"english",d:"Information and Ideas",sk:"Command of Evidence",sc:"COE",df:"M"},
    {id:"3a489e1e",s:"english",d:"Information and Ideas",sk:"Command of Evidence",sc:"COE",df:"H"},
    {id:"8e22efd9",s:"english",d:"Information and Ideas",sk:"Command of Evidence",sc:"COE",df:"H"},
    {id:"10455a19",s:"english",d:"Information and Ideas",sk:"Command of Evidence",sc:"COE",df:"M"},
    {id:"4ef17800",s:"english",d:"Information and Ideas",sk:"Command of Evidence",sc:"COE",df:"H"},
    {id:"0992bd73",s:"english",d:"Information and Ideas",sk:"Command of Evidence",sc:"COE",df:"E"},
    {id:"6eb0223c",s:"english",d:"Information and Ideas",sk:"Command of Evidence",sc:"COE",df:"H"},
    {id:"b238a07a",s:"english",d:"Information and Ideas",sk:"Command of Evidence",sc:"COE",df:"E"},
    {id:"2398ffbf",s:"english",d:"Information and Ideas",sk:"Command of Evidence",sc:"COE",df:"H"},
    {id:"e35aa99b",s:"english",d:"Information and Ideas",sk:"Command of Evidence",sc:"COE",df:"H"},
    {id:"629fb8a9",s:"english",d:"Information and Ideas",sk:"Command of Evidence",sc:"COE",df:"H"},
    {id:"43f4013a",s:"english",d:"Information and Ideas",sk:"Command of Evidence",sc:"COE",df:"H"},
    {id:"46a31ca1",s:"english",d:"Information and Ideas",sk:"Command of Evidence",sc:"COE",df:"H"},
    {id:"9c199797",s:"english",d:"Information and Ideas",sk:"Command of Evidence",sc:"COE",df:"H"},
    {id:"c6d7dc78",s:"english",d:"Information and Ideas",sk:"Central Ideas and Details",sc:"CID",df:"E"},
    {id:"640b60c2",s:"english",d:"Information and Ideas",sk:"Central Ideas and Details",sc:"CID",df:"M"},
    {id:"2b252bbd",s:"english",d:"Information and Ideas",sk:"Central Ideas and Details",sc:"CID",df:"H"},
    {id:"411739db",s:"english",d:"Information and Ideas",sk:"Central Ideas and Details",sc:"CID",df:"M"},
    {id:"c5cba39c",s:"english",d:"Information and Ideas",sk:"Central Ideas and Details",sc:"CID",df:"H"},
    {id:"8d88740e",s:"english",d:"Information and Ideas",sk:"Central Ideas and Details",sc:"CID",df:"H"},
    {id:"e65dfc41",s:"english",d:"Information and Ideas",sk:"Central Ideas and Details",sc:"CID",df:"M"},
    {id:"8c39592a",s:"english",d:"Information and Ideas",sk:"Central Ideas and Details",sc:"CID",df:"H"},
    {id:"7aa510fb",s:"english",d:"Information and Ideas",sk:"Central Ideas and Details",sc:"CID",df:"H"},
    {id:"024eb2ec",s:"english",d:"Information and Ideas",sk:"Central Ideas and Details",sc:"CID",df:"H"},
    {id:"4a5bda7a",s:"english",d:"Information and Ideas",sk:"Central Ideas and Details",sc:"CID",df:"H"},
    {id:"5869a196",s:"english",d:"Information and Ideas",sk:"Central Ideas and Details",sc:"CID",df:"H"},
    {id:"dd412b31",s:"english",d:"Information and Ideas",sk:"Central Ideas and Details",sc:"CID",df:"M"},
    {id:"153aaae2",s:"english",d:"Craft and Structure",sk:"Text Structure and Purpose",sc:"TSP",df:"H"},
    {id:"37c481f8",s:"english",d:"Craft and Structure",sk:"Text Structure and Purpose",sc:"TSP",df:"H"},
    {id:"8af926b1",s:"english",d:"Craft and Structure",sk:"Text Structure and Purpose",sc:"TSP",df:"H"},
    {id:"2ec0e43e",s:"english",d:"Craft and Structure",sk:"Text Structure and Purpose",sc:"TSP",df:"M"},
    {id:"70e6af39",s:"english",d:"Craft and Structure",sk:"Text Structure and Purpose",sc:"TSP",df:"H"},
    {id:"735b0776",s:"english",d:"Craft and Structure",sk:"Text Structure and Purpose",sc:"TSP",df:"M"},
    {id:"c762ca58",s:"english",d:"Craft and Structure",sk:"Text Structure and Purpose",sc:"TSP",df:"H"},
    {id:"dbb56a02",s:"english",d:"Craft and Structure",sk:"Text Structure and Purpose",sc:"TSP",df:"M"},
    {id:"de059199",s:"english",d:"Craft and Structure",sk:"Text Structure and Purpose",sc:"TSP",df:"H"},
    {id:"72bae7f4",s:"english",d:"Craft and Structure",sk:"Text Structure and Purpose",sc:"TSP",df:"M"},
    {id:"e19e8478",s:"english",d:"Craft and Structure",sk:"Text Structure and Purpose",sc:"TSP",df:"E"},
    {id:"1917ba9a",s:"english",d:"Craft and Structure",sk:"Cross-Text Connections",sc:"CTC",df:"H"},
    {id:"3cfbf077",s:"english",d:"Craft and Structure",sk:"Cross-Text Connections",sc:"CTC",df:"H"},
    {id:"9828ab3d",s:"english",d:"Craft and Structure",sk:"Cross-Text Connections",sc:"CTC",df:"H"},
    {id:"dd0aada1",s:"english",d:"Craft and Structure",sk:"Words in Context",sc:"WIC",df:"M"},
    {id:"4d13a0c0",s:"english",d:"Craft and Structure",sk:"Words in Context",sc:"WIC",df:"H"},
    {id:"49d3dc62",s:"english",d:"Craft and Structure",sk:"Words in Context",sc:"WIC",df:"M"},
    {id:"0e033f9b",s:"english",d:"Craft and Structure",sk:"Words in Context",sc:"WIC",df:"H"},
    {id:"15daaded",s:"english",d:"Craft and Structure",sk:"Words in Context",sc:"WIC",df:"H"},
    {id:"7d60a322",s:"english",d:"Craft and Structure",sk:"Words in Context",sc:"WIC",df:"E"},
    {id:"089b0b41",s:"english",d:"Craft and Structure",sk:"Words in Context",sc:"WIC",df:"E"},
    {id:"6557f7fc",s:"english",d:"Craft and Structure",sk:"Words in Context",sc:"WIC",df:"H"},
    {id:"1eeb9bb8",s:"english",d:"Craft and Structure",sk:"Words in Context",sc:"WIC",df:"H"},
    {id:"644f59cd",s:"english",d:"Craft and Structure",sk:"Words in Context",sc:"WIC",df:"E"},
    {id:"177ed7dc",s:"english",d:"Craft and Structure",sk:"Words in Context",sc:"WIC",df:"H"},
    {id:"5ccbfe22",s:"english",d:"Craft and Structure",sk:"Words in Context",sc:"WIC",df:"H"},
    {id:"be069e38",s:"english",d:"Craft and Structure",sk:"Words in Context",sc:"WIC",df:"M"},
    {id:"9ff88d6b",s:"english",d:"Craft and Structure",sk:"Words in Context",sc:"WIC",df:"H"},
    {id:"3021d9ef",s:"english",d:"Craft and Structure",sk:"Words in Context",sc:"WIC",df:"H"},
    {id:"3bd32343",s:"english",d:"Craft and Structure",sk:"Words in Context",sc:"WIC",df:"M"},
    {id:"4ce8e2fa",s:"english",d:"Craft and Structure",sk:"Words in Context",sc:"WIC",df:"H"},
    {id:"2a6c71a4",s:"english",d:"Craft and Structure",sk:"Words in Context",sc:"WIC",df:"M"},
    {id:"8a1ad52b",s:"english",d:"Expression of Ideas",sk:"Transitions",sc:"TRA",df:"M"},
    {id:"94c9788e",s:"english",d:"Expression of Ideas",sk:"Transitions",sc:"TRA",df:"M"},
    {id:"e1079609",s:"english",d:"Expression of Ideas",sk:"Transitions",sc:"TRA",df:"E"},
    {id:"1e655377",s:"english",d:"Expression of Ideas",sk:"Transitions",sc:"TRA",df:"E"},
    {id:"28c7a762",s:"english",d:"Expression of Ideas",sk:"Transitions",sc:"TRA",df:"M"},
    {id:"fb56b593",s:"english",d:"Expression of Ideas",sk:"Transitions",sc:"TRA",df:"M"},
    {id:"9f7ac40d",s:"english",d:"Expression of Ideas",sk:"Transitions",sc:"TRA",df:"E"},
    {id:"7dbcb7f4",s:"english",d:"Expression of Ideas",sk:"Transitions",sc:"TRA",df:"M"},
    {id:"64bcdf3d",s:"english",d:"Expression of Ideas",sk:"Transitions",sc:"TRA",df:"E"},
    {id:"b5ed1a8b",s:"english",d:"Expression of Ideas",sk:"Transitions",sc:"TRA",df:"H"},
    {id:"991e849a",s:"english",d:"Expression of Ideas",sk:"Transitions",sc:"TRA",df:"E"},
    {id:"e225cf02",s:"english",d:"Expression of Ideas",sk:"Transitions",sc:"TRA",df:"H"},
    {id:"0a9b36f9",s:"english",d:"Expression of Ideas",sk:"Transitions",sc:"TRA",df:"M"},
    {id:"b4123d99",s:"english",d:"Expression of Ideas",sk:"Transitions",sc:"TRA",df:"E"},
    {id:"70c19cf6",s:"english",d:"Expression of Ideas",sk:"Transitions",sc:"TRA",df:"H"},
    {id:"c61fb134",s:"english",d:"Expression of Ideas",sk:"Transitions",sc:"TRA",df:"M"},
    {id:"8fbf206d",s:"english",d:"Expression of Ideas",sk:"Transitions",sc:"TRA",df:"H"},
    {id:"bfab730e",s:"english",d:"Expression of Ideas",sk:"Transitions",sc:"TRA",df:"E"},
    {id:"5803befc",s:"english",d:"Expression of Ideas",sk:"Transitions",sc:"TRA",df:"E"},
    {id:"b6d9068e",s:"english",d:"Expression of Ideas",sk:"Transitions",sc:"TRA",df:"M"},
    {id:"578ca79a",s:"english",d:"Expression of Ideas",sk:"Transitions",sc:"TRA",df:"H"},
    {id:"539abc58",s:"english",d:"Expression of Ideas",sk:"Rhetorical Synthesis",sc:"SYN",df:"M"},
    {id:"c3b854fa",s:"english",d:"Expression of Ideas",sk:"Rhetorical Synthesis",sc:"SYN",df:"M"},
    {id:"be3363dd",s:"english",d:"Expression of Ideas",sk:"Rhetorical Synthesis",sc:"SYN",df:"H"},
    {id:"8e9e473d",s:"english",d:"Expression of Ideas",sk:"Rhetorical Synthesis",sc:"SYN",df:"H"},
    {id:"ee51ad04",s:"english",d:"Expression of Ideas",sk:"Rhetorical Synthesis",sc:"SYN",df:"H"},
    {id:"742695d7",s:"english",d:"Expression of Ideas",sk:"Rhetorical Synthesis",sc:"SYN",df:"E"},
    {id:"1c60119d",s:"english",d:"Expression of Ideas",sk:"Rhetorical Synthesis",sc:"SYN",df:"M"},
    {id:"19b08ead",s:"english",d:"Expression of Ideas",sk:"Rhetorical Synthesis",sc:"SYN",df:"H"},
    {id:"7f5715e4",s:"english",d:"Expression of Ideas",sk:"Rhetorical Synthesis",sc:"SYN",df:"H"},
    {id:"0f64ded3",s:"english",d:"Expression of Ideas",sk:"Rhetorical Synthesis",sc:"SYN",df:"M"},
    {id:"d4b07ce6",s:"english",d:"Expression of Ideas",sk:"Rhetorical Synthesis",sc:"SYN",df:"H"},
    {id:"bfad4508",s:"english",d:"Expression of Ideas",sk:"Rhetorical Synthesis",sc:"SYN",df:"M"},
    {id:"c3397d25",s:"english",d:"Standard English Conventions",sk:"Boundaries",sc:"BOU",df:"M"},
    {id:"e2f77ae7",s:"english",d:"Standard English Conventions",sk:"Boundaries",sc:"BOU",df:"M"},
    {id:"5ef9fc48",s:"english",d:"Standard English Conventions",sk:"Boundaries",sc:"BOU",df:"H"},
    {id:"e67f9967",s:"english",d:"Standard English Conventions",sk:"Boundaries",sc:"BOU",df:"H"},
    {id:"ffea47e1",s:"english",d:"Standard English Conventions",sk:"Boundaries",sc:"BOU",df:"E"},
    {id:"e41018de",s:"english",d:"Standard English Conventions",sk:"Boundaries",sc:"BOU",df:"H"},
    {id:"6181924a",s:"english",d:"Standard English Conventions",sk:"Boundaries",sc:"BOU",df:"H"},
    {id:"235c8338",s:"english",d:"Standard English Conventions",sk:"Boundaries",sc:"BOU",df:"H"},
    {id:"b771d175",s:"english",d:"Standard English Conventions",sk:"Boundaries",sc:"BOU",df:"H"},
    {id:"05a14e18",s:"english",d:"Standard English Conventions",sk:"Boundaries",sc:"BOU",df:"H"},
    {id:"e7afd0a1",s:"english",d:"Standard English Conventions",sk:"Boundaries",sc:"BOU",df:"H"},
    {id:"952fd392",s:"english",d:"Standard English Conventions",sk:"Boundaries",sc:"BOU",df:"H"},
    {id:"72b3db98",s:"english",d:"Standard English Conventions",sk:"Boundaries",sc:"BOU",df:"E"},
    {id:"c88d6301",s:"english",d:"Standard English Conventions",sk:"Boundaries",sc:"BOU",df:"E"},
    {id:"aacddbd8",s:"english",d:"Standard English Conventions",sk:"Boundaries",sc:"BOU",df:"H"},
    {id:"261f4ca6",s:"english",d:"Standard English Conventions",sk:"Boundaries",sc:"BOU",df:"E"},
    {id:"5cc69ee1",s:"english",d:"Standard English Conventions",sk:"Boundaries",sc:"BOU",df:"H"},
    {id:"8999c0c5",s:"english",d:"Standard English Conventions",sk:"Boundaries",sc:"BOU",df:"M"},
    {id:"8d00cd7c",s:"english",d:"Standard English Conventions",sk:"Boundaries",sc:"BOU",df:"H"},
    {id:"92f309b2",s:"english",d:"Standard English Conventions",sk:"Boundaries",sc:"BOU",df:"H"},
    {id:"4b424102",s:"english",d:"Standard English Conventions",sk:"Boundaries",sc:"BOU",df:"H"},
    {id:"9127635a",s:"english",d:"Standard English Conventions",sk:"Form, Structure, and Sense",sc:"FSS",df:"H"},
    {id:"36e89f74",s:"english",d:"Standard English Conventions",sk:"Form, Structure, and Sense",sc:"FSS",df:"E"},
    {id:"16740ab4",s:"english",d:"Standard English Conventions",sk:"Form, Structure, and Sense",sc:"FSS",df:"H"},
    {id:"74253458",s:"english",d:"Standard English Conventions",sk:"Form, Structure, and Sense",sc:"FSS",df:"E"},
    {id:"353890a1",s:"english",d:"Standard English Conventions",sk:"Form, Structure, and Sense",sc:"FSS",df:"E"},
    {id:"ee4aa2aa",s:"english",d:"Standard English Conventions",sk:"Form, Structure, and Sense",sc:"FSS",df:"H"},
    {id:"4320b4ad",s:"english",d:"Standard English Conventions",sk:"Form, Structure, and Sense",sc:"FSS",df:"E"},
    {id:"0560b2b8",s:"english",d:"Standard English Conventions",sk:"Form, Structure, and Sense",sc:"FSS",df:"E"},
    {id:"2d6f8304",s:"english",d:"Standard English Conventions",sk:"Form, Structure, and Sense",sc:"FSS",df:"E"},
    {id:"c7cb5186",s:"english",d:"Standard English Conventions",sk:"Form, Structure, and Sense",sc:"FSS",df:"H"},
    {id:"43b88827",s:"english",d:"Standard English Conventions",sk:"Form, Structure, and Sense",sc:"FSS",df:"M"},
    {id:"99dedf36",s:"english",d:"Standard English Conventions",sk:"Form, Structure, and Sense",sc:"FSS",df:"H"},
    {id:"2cb1ee22",s:"english",d:"Standard English Conventions",sk:"Form, Structure, and Sense",sc:"FSS",df:"H"},
    {id:"c9a677e9",s:"english",d:"Standard English Conventions",sk:"Form, Structure, and Sense",sc:"FSS",df:"H"},
    {id:"6205f7e4",s:"english",d:"Standard English Conventions",sk:"Form, Structure, and Sense",sc:"FSS",df:"M"},
    {id:"505054e3",s:"english",d:"Standard English Conventions",sk:"Form, Structure, and Sense",sc:"FSS",df:"H"},
    {id:"f570cece",s:"english",d:"Standard English Conventions",sk:"Form, Structure, and Sense",sc:"FSS",df:"M"},
    {id:"55ea0659",s:"math",d:"Algebra",sk:"Linear equations in one variable",sc:"H.A.",df:"H"},
    {id:"088bc84e",s:"math",d:"Algebra",sk:"Linear equations in one variable",sc:"H.A.",df:"M"},
    {id:"f8fa0cf0",s:"math",d:"Algebra",sk:"Linear equations in one variable",sc:"H.A.",df:"M"},
    {id:"5eb4918d",s:"math",d:"Algebra",sk:"Linear equations in one variable",sc:"H.A.",df:"E"},
    {id:"935f3403",s:"math",d:"Algebra",sk:"Linear equations in one variable",sc:"H.A.",df:"E"},
    {id:"30b1e186",s:"math",d:"Algebra",sk:"Linear inequalities in one or two variables",sc:"H.E.",df:"M"},
    {id:"d914abec",s:"math",d:"Algebra",sk:"Linear inequalities in one or two variables",sc:"H.E.",df:"M"},
    {id:"e8fd6d99",s:"math",d:"Algebra",sk:"Linear inequalities in one or two variables",sc:"H.E.",df:"M"},
    {id:"59813abf",s:"math",d:"Algebra",sk:"Systems of two linear equations in two variables",sc:"H.D.",df:"H"},
    {id:"ea8bd66f",s:"math",d:"Algebra",sk:"Systems of two linear equations in two variables",sc:"H.D.",df:"M"},
    {id:"5e9b6079",s:"math",d:"Algebra",sk:"Systems of two linear equations in two variables",sc:"H.D.",df:"H"},
    {id:"18ac8354",s:"math",d:"Algebra",sk:"Systems of two linear equations in two variables",sc:"H.D.",df:"H"},
    {id:"0e926898",s:"math",d:"Algebra",sk:"Systems of two linear equations in two variables",sc:"H.D.",df:"E"},
    {id:"340afb12",s:"math",d:"Algebra",sk:"Systems of two linear equations in two variables",sc:"H.D.",df:"M"},
    {id:"080e75c2",s:"math",d:"Algebra",sk:"Systems of two linear equations in two variables",sc:"H.D.",df:"M"},
    {id:"d4572f55",s:"math",d:"Algebra",sk:"Linear functions",sc:"H.B.",df:"H"},
    {id:"1a2a0f59",s:"math",d:"Algebra",sk:"Linear functions",sc:"H.B.",df:"H"},
    {id:"590d662d",s:"math",d:"Algebra",sk:"Linear functions",sc:"H.B.",df:"H"},
    {id:"fc4a0d2a",s:"math",d:"Algebra",sk:"Linear functions",sc:"H.B.",df:"M"},
    {id:"2493c767",s:"math",d:"Algebra",sk:"Linear functions",sc:"H.B.",df:"M"},
    {id:"0c490cd5",s:"math",d:"Algebra",sk:"Linear functions",sc:"H.B.",df:"E"},
    {id:"107d0c62",s:"math",d:"Algebra",sk:"Linear equations in two variables",sc:"H.C.",df:"H"},
    {id:"4722abd2",s:"math",d:"Algebra",sk:"Linear equations in two variables",sc:"H.C.",df:"M"},
    {id:"f6c18a66",s:"math",d:"Problem-Solving and Data Analysis",sk:"One-variable data: Distributions and measures of center and spread",sc:"Q.C.",df:"H"},
    {id:"d73a67d7",s:"math",d:"Problem-Solving and Data Analysis",sk:"One-variable data: Distributions and measures of center and spread",sc:"Q.C.",df:"M"},
    {id:"89ff6a0a",s:"math",d:"Problem-Solving and Data Analysis",sk:"Probability and conditional probability",sc:"Q.E.",df:"H"},
    {id:"8bb94668",s:"math",d:"Problem-Solving and Data Analysis",sk:"Percentages",sc:"Q.B.",df:"H"},
    {id:"dbd89c59",s:"math",d:"Problem-Solving and Data Analysis",sk:"T wo-variable data: Models and scatterplots",sc:"Q.D.",df:"E"},
    {id:"b3547a10",s:"math",d:"Problem-Solving and Data Analysis",sk:"T wo-variable data: Models and scatterplots",sc:"Q.D.",df:"M"},
    {id:"4c5ea142",s:"math",d:"Problem-Solving and Data Analysis",sk:"Ratios, rates, proportional relationships, and units",sc:"Q.A.",df:"H"},
    {id:"1b96c116",s:"math",d:"Problem-Solving and Data Analysis",sk:"Ratios, rates, proportional relationships, and units",sc:"Q.A.",df:"H"},
    {id:"2bab1399",s:"math",d:"Problem-Solving and Data Analysis",sk:"Inference from sample statistics and margin of error",sc:"Q.F.",df:"M"},
    {id:"f496d2c0",s:"math",d:"Problem-Solving and Data Analysis",sk:"Probability and conditional probability",sc:"Q.E.",df:"H"},
    {id:"da978ee6",s:"math",d:"Problem-Solving and Data Analysis",sk:"Inference from sample statistics and margin of error",sc:"Q.F.",df:"H"},
    {id:"6feae9c3",s:"math",d:"Problem-Solving and Data Analysis",sk:"Percentages",sc:"Q.B.",df:"H"},
    {id:"559476f4",s:"math",d:"Problem-Solving and Data Analysis",sk:"One-variable data: Distributions and measures of center and spread",sc:"Q.C.",df:"E"},
    {id:"70a2776f",s:"math",d:"Problem-Solving and Data Analysis",sk:"T wo-variable data: Models and scatterplots",sc:"Q.D.",df:"M"},
    {id:"de799680",s:"math",d:"Problem-Solving and Data Analysis",sk:"Ratios, rates, proportional relationships, and units",sc:"Q.A.",df:"E"},
    {id:"98818acf",s:"math",d:"Problem-Solving and Data Analysis",sk:"Percentages",sc:"Q.B.",df:"H"},
    {id:"f01108a8",s:"math",d:"Advanced Math",sk:"Nonlinear functions",sc:"P.C.",df:"H"},
    {id:"71b74a44",s:"math",d:"Advanced Math",sk:"Nonlinear functions",sc:"P.C.",df:"M"},
    {id:"3cf2698e",s:"math",d:"Advanced Math",sk:"Nonlinear functions",sc:"P.C.",df:"E"},
    {id:"58b4c6f3",s:"math",d:"Advanced Math",sk:"Nonlinear functions",sc:"P.C.",df:"H"},
    {id:"7bbfbe70",s:"math",d:"Advanced Math",sk:"Nonlinear functions",sc:"P.C.",df:"H"},
    {id:"a1e65979",s:"math",d:"Advanced Math",sk:"Nonlinear functions",sc:"P.C.",df:"H"},
    {id:"5acbdc30",s:"math",d:"Advanced Math",sk:"Nonlinear functions",sc:"P.C.",df:"H"},
    {id:"c95686e9",s:"math",d:"Advanced Math",sk:"Nonlinear functions",sc:"P.C.",df:"H"},
    {id:"fe62f031",s:"math",d:"Advanced Math",sk:"Nonlinear functions",sc:"P.C.",df:"E"},
    {id:"46308566",s:"math",d:"Advanced Math",sk:"Nonlinear equations in one variable and systems of equations in two variables",sc:"P.B.",df:"H"},
    {id:"e833de9a",s:"math",d:"Advanced Math",sk:"Nonlinear equations in one variable and systems of equations in two variables",sc:"P.B.",df:"H"},
    {id:"5da5c665",s:"math",d:"Advanced Math",sk:"Nonlinear equations in one variable and systems of equations in two variables",sc:"P.B.",df:"H"},
    {id:"6bd40794",s:"math",d:"Advanced Math",sk:"Nonlinear equations in one variable and systems of equations in two variables",sc:"P.B.",df:"M"},
    {id:"c8db0e19",s:"math",d:"Advanced Math",sk:"Nonlinear equations in one variable and systems of equations in two variables",sc:"P.B.",df:"H"},
    {id:"5f10c095",s:"math",d:"Advanced Math",sk:"Nonlinear equations in one variable and systems of equations in two variables",sc:"P.B.",df:"M"},
    {id:"f123e039",s:"math",d:"Advanced Math",sk:"Nonlinear equations in one variable and systems of equations in two variables",sc:"P.B.",df:"E"},
    {id:"9a1f1941",s:"math",d:"Advanced Math",sk:"Nonlinear equations in one variable and systems of equations in two variables",sc:"P.B.",df:"H"},
    {id:"30596346",s:"math",d:"Advanced Math",sk:"Nonlinear equations in one variable and systems of equations in two variables",sc:"P.B.",df:"H"},
    {id:"38c90632",s:"math",d:"Advanced Math",sk:"Equivalent expressions",sc:"P.A.",df:"H"},
    {id:"00165291",s:"math",d:"Advanced Math",sk:"Equivalent expressions",sc:"P.A.",df:"H"},
    {id:"04887c7b",s:"math",d:"Advanced Math",sk:"Equivalent expressions",sc:"P.A.",df:"M"},
    {id:"91aa9aa9",s:"math",d:"Advanced Math",sk:"Equivalent expressions",sc:"P.A.",df:"E"},
    {id:"f8871ccd",s:"math",d:"Advanced Math",sk:"Equivalent expressions",sc:"P.A.",df:"M"},
    {id:"efc469c4",s:"math",d:"Advanced Math",sk:"Equivalent expressions",sc:"P.A.",df:"H"},
    {id:"2289b199",s:"math",d:"Advanced Math",sk:"Equivalent expressions",sc:"P.A.",df:"H"},
    {id:"1fe41c6b",s:"math",d:"Geometry and Trigonometry",sk:"Area and volume",sc:"S.A.",df:"H"},
    {id:"124bc42b",s:"math",d:"Geometry and Trigonometry",sk:"Area and volume",sc:"S.A.",df:"E"},
    {id:"30aa51b7",s:"math",d:"Geometry and Trigonometry",sk:"Area and volume",sc:"S.A.",df:"H"},
    {id:"179edb12",s:"math",d:"Geometry and Trigonometry",sk:"Area and volume",sc:"S.A.",df:"H"},
    {id:"c8ab85ad",s:"math",d:"Geometry and Trigonometry",sk:"Area and volume",sc:"S.A.",df:"E"},
    {id:"e6c557f9",s:"math",d:"Geometry and Trigonometry",sk:"Area and volume",sc:"S.A.",df:"H"},
    {id:"f3f06c3a",s:"math",d:"Geometry and Trigonometry",sk:"Area and volume",sc:"S.A.",df:"E"},
    {id:"73e1b793",s:"math",d:"Geometry and Trigonometry",sk:"Area and volume",sc:"S.A.",df:"H"},
    {id:"cab8f907",s:"math",d:"Geometry and Trigonometry",sk:"Area and volume",sc:"S.A.",df:"E"},
    {id:"9fdc4eaa",s:"math",d:"Geometry and Trigonometry",sk:"Area and volume",sc:"S.A.",df:"H"},
    {id:"f6ca90cc",s:"math",d:"Geometry and Trigonometry",sk:"Area and volume",sc:"S.A.",df:"H"},
    {id:"25cc5327",s:"math",d:"Geometry and Trigonometry",sk:"Area and volume",sc:"S.A.",df:"M"},
    {id:"4757123b",s:"math",d:"Geometry and Trigonometry",sk:"Area and volume",sc:"S.A.",df:"H"},
    {id:"17049054",s:"math",d:"Geometry and Trigonometry",sk:"Area and volume",sc:"S.A.",df:"E"},
    {id:"42155bac",s:"math",d:"Geometry and Trigonometry",sk:"Area and volume",sc:"S.A.",df:"M"},
    {id:"1b687ae3",s:"math",d:"Geometry and Trigonometry",sk:"Area and volume",sc:"S.A.",df:"M"},
    {id:"d12bca0a",s:"math",d:"Geometry and Trigonometry",sk:"Circles",sc:"S.D.",df:"H"},
    {id:"408b39ea",s:"math",d:"Geometry and Trigonometry",sk:"Circles",sc:"S.D.",df:"M"},
    {id:"8493fd10",s:"math",d:"Geometry and Trigonometry",sk:"Circles",sc:"S.D.",df:"H"},
    {id:"267f82b5",s:"math",d:"Geometry and Trigonometry",sk:"Circles",sc:"S.D.",df:"M"},
    {id:"a5ff1a96",s:"math",d:"Geometry and Trigonometry",sk:"Circles",sc:"S.D.",df:"H"},
    {id:"186fdbca",s:"math",d:"Geometry and Trigonometry",sk:"Circles",sc:"S.D.",df:"E"},
    {id:"149021da",s:"math",d:"Geometry and Trigonometry",sk:"Circles",sc:"S.D.",df:"H"},
    {id:"11301fb6",s:"math",d:"Geometry and Trigonometry",sk:"Circles",sc:"S.D.",df:"M"},
    {id:"10e059a6",s:"math",d:"Geometry and Trigonometry",sk:"Circles",sc:"S.D.",df:"H"},
    {id:"27f1db42",s:"math",d:"Geometry and Trigonometry",sk:"Circles",sc:"S.D.",df:"H"},
    {id:"44d67c6c",s:"math",d:"Geometry and Trigonometry",sk:"Circles",sc:"S.D.",df:"H"},
    {id:"2c3aefc9",s:"math",d:"Geometry and Trigonometry",sk:"Right triangles and trigonometry",sc:"S.C.",df:"H"},
    {id:"2757549e",s:"math",d:"Geometry and Trigonometry",sk:"Right triangles and trigonometry",sc:"S.C.",df:"M"},
    {id:"c4a9c94d",s:"math",d:"Geometry and Trigonometry",sk:"Right triangles and trigonometry",sc:"S.C.",df:"H"},
    {id:"f389569d",s:"math",d:"Geometry and Trigonometry",sk:"Right triangles and trigonometry",sc:"S.C.",df:"H"},
    {id:"e3158182",s:"math",d:"Geometry and Trigonometry",sk:"Right triangles and trigonometry",sc:"S.C.",df:"H"},
    {id:"98e02472",s:"math",d:"Geometry and Trigonometry",sk:"Right triangles and trigonometry",sc:"S.C.",df:"H"},
    {id:"de9148c4",s:"math",d:"Geometry and Trigonometry",sk:"Right triangles and trigonometry",sc:"S.C.",df:"E"},
    {id:"4fb972f2",s:"math",d:"Geometry and Trigonometry",sk:"Right triangles and trigonometry",sc:"S.C.",df:"H"},
    {id:"6c67dd47",s:"math",d:"Geometry and Trigonometry",sk:"Right triangles and trigonometry",sc:"S.C.",df:"H"},
    {id:"e89f63bf",s:"math",d:"Geometry and Trigonometry",sk:"Lines, angles, and triangles",sc:"S.B.",df:"M"},
    {id:"ecc98c87",s:"math",d:"Geometry and Trigonometry",sk:"Lines, angles, and triangles",sc:"S.B.",df:"M"},
    {id:"1dc7e423",s:"math",d:"Geometry and Trigonometry",sk:"Lines, angles, and triangles",sc:"S.B.",df:"H"},
    {id:"b5d62bba",s:"math",d:"Geometry and Trigonometry",sk:"Lines, angles, and triangles",sc:"S.B.",df:"H"},
    {id:"4a141e77",s:"math",d:"Geometry and Trigonometry",sk:"Lines, angles, and triangles",sc:"S.B.",df:"E"},
    {id:"7a11ceea",s:"math",d:"Geometry and Trigonometry",sk:"Lines, angles, and triangles",sc:"S.B.",df:"H"},
    {id:"858809e7",s:"math",d:"Geometry and Trigonometry",sk:"Lines, angles, and triangles",sc:"S.B.",df:"H"},
    {id:"d21270da",s:"math",d:"Geometry and Trigonometry",sk:"Lines, angles, and triangles",sc:"S.B.",df:"E"},
    {id:"697b3954",s:"math",d:"Geometry and Trigonometry",sk:"Lines, angles, and triangles",sc:"S.B.",df:"M"},
    {id:"ffc39dc5",s:"math",d:"Geometry and Trigonometry",sk:"Lines, angles, and triangles",sc:"S.B.",df:"M"},
    {id:"8364487a",s:"math",d:"Geometry and Trigonometry",sk:"Lines, angles, and triangles",sc:"S.B.",df:"M"},
    {id:"0013adbd",s:"math",d:"Geometry and Trigonometry",sk:"Lines, angles, and triangles",sc:"S.B.",df:"M"},
    {id:"1dacfb94",s:"math",d:"Geometry and Trigonometry",sk:"Lines, angles, and triangles",sc:"S.B.",df:"H"},
    {id:"769b612d",s:"math",d:"Advanced Math",sk:"Nonlinear functions",sc:"P.C.",df:"M"},
    {id:"7bf77c19",s:"math",d:"Advanced Math",sk:"Nonlinear functions",sc:"P.C.",df:"H"},
    {id:"28ff3966",s:"math",d:"Problem-Solving and Data Analysis",sk:"Percentages",sc:"Q.B.",df:"H"},
    {id:"3e1bd4e2",s:"math",d:"Problem-Solving and Data Analysis",sk:"Inference from sample statistics and margin of error",sc:"Q.F.",df:"M"},
    {id:"cf2be18d",s:"math",d:"Problem-Solving and Data Analysis",sk:"One-variable data: Distributions and measures of center and spread",sc:"Q.C.",df:"H"},
    {id:"7ce2e728",s:"math",d:"Geometry and Trigonometry",sk:"Lines, angles, and triangles",sc:"S.B.",df:"H"},
    {id:"9f9112ab",s:"math",d:"Geometry and Trigonometry",sk:"Circles",sc:"S.D.",df:"H"}
  ];

  // ── Section catalog with question counts ──
  const SECTIONS = [
    {
      key: "english",
      label: "English Reading & Writing",
      description: "150 new questions from College Board",
      domains: [
        {key:"Information and Ideas",code:"INI",skills:[
          {key:"Inferences",code:"INF",count:16},
          {key:"Command of Evidence",code:"COE",count:18},
          {key:"Central Ideas and Details",code:"CID",count:13}
        ]},
        {key:"Craft and Structure",code:"CAS",skills:[
          {key:"Words in Context",code:"WIC",count:18},
          {key:"Text Structure and Purpose",code:"TSP",count:11},
          {key:"Cross-Text Connections",code:"CTC",count:3}
        ]},
        {key:"Expression of Ideas",code:"EOI",skills:[
          {key:"Rhetorical Synthesis",code:"SYN",count:12},
          {key:"Transitions",code:"TRA",count:21}
        ]},
        {key:"Standard English Conventions",code:"SEC",skills:[
          {key:"Boundaries",code:"BOU",count:21},
          {key:"Form, Structure, and Sense",code:"FSS",count:17}
        ]}
      ]
    },
    {
      key: "math",
      label: "Math",
      description: "120 new questions from College Board",
      domains: [
        {key:"Algebra",code:"H",skills:[
          {key:"Linear equations in one variable",code:"H.A.",count:5},
          {key:"Linear functions",code:"H.B.",count:6},
          {key:"Linear equations in two variables",code:"H.C.",count:2},
          {key:"Systems of two linear equations in two variables",code:"H.D.",count:7},
          {key:"Linear inequalities in one or two variables",code:"H.E.",count:3}
        ]},
        {key:"Advanced Math",code:"P",skills:[
          {key:"Equivalent expressions",code:"P.A.",count:7},
          {key:"Nonlinear equations in one variable and systems of equations",code:"P.B.",count:9},
          {key:"Nonlinear functions",code:"P.C.",count:11}
        ]},
        {key:"Problem-Solving and Data Analysis",code:"Q",skills:[
          {key:"Ratios, rates, proportional relationships, and units",code:"Q.A.",count:3},
          {key:"Percentages",code:"Q.B.",count:4},
          {key:"One-variable data: Distributions and measures of center and spread",code:"Q.C.",count:4},
          {key:"Two-variable data: Models and scatterplots",code:"Q.D.",count:3},
          {key:"Probability and conditional probability",code:"Q.E.",count:2},
          {key:"Inference from sample statistics and margin of error",code:"Q.F.",count:3}
        ]},
        {key:"Geometry and Trigonometry",code:"S",skills:[
          {key:"Area and volume",code:"S.A.",count:16},
          {key:"Lines, angles, and triangles",code:"S.B.",count:14},
          {key:"Right triangles and trigonometry",code:"S.C.",count:9},
          {key:"Circles",code:"S.D.",count:12}
        ]}
      ]
    }
  ];

  const sectionColumns = document.getElementById("sectionColumns");
  const selectionPill = document.getElementById("selectionPill");
  const pillCountLabel = document.getElementById("pillCountLabel");
  const pillRandomize = document.getElementById("pillRandomize");
  const pillStart = document.getElementById("pillStart");

  const state = {
    selectedSection: null,
    selectedSkills: [],
    random: false,
  };

  // ── SVG icons ──
  function svg(body, extra) {
    return '<svg class="sat-ico ' + (extra || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
  }

  // ── Count questions per skill ──
  function countForSkill(skillCode) {
    return NEW_QUESTIONS.filter(function(q) { return q.sc === skillCode; }).length;
  }

  function countForSection(sectionKey) {
    return NEW_QUESTIONS.filter(function(q) { return q.s === sectionKey; }).length;
  }

  // ── Render ──
  function renderSections() {
    var totalForFilter = state.selectedSection
      ? NEW_QUESTIONS.filter(function(q) { return q.s === state.selectedSection; }).length
      : NEW_QUESTIONS.length;

    sectionColumns.innerHTML = SECTIONS.map(function(section) {
      var isActive = state.selectedSection === section.key;
      var sectionCount = countForSection(section.key);
      var sectionLabel = section.label + ' \u2014 ' + sectionCount + ' Questions';

      var domainsHtml = section.domains.map(function(domain) {
        var domainSelected = isActive && domain.skills.some(function(sk) {
          return state.selectedSkills.indexOf(sk.code) !== -1;
        });

        var skillsHtml = domain.skills.filter(function(sk) { return sk.count > 0; }).map(function(skill) {
          var skillSelected = state.selectedSkills.indexOf(skill.code) !== -1;
          return '<div class="sat-topic-row">' +
            '<button class="sat-check ' + (skillSelected ? 'is-active' : '') + '" type="button" data-select-skill="' + section.key + '::' + domain.key + '::' + skill.code + '" aria-label="Select ' + skill.key + '"></button>' +
            '<span class="sat-topic-heading">' + skill.key + '</span>' +
            '<div class="sat-topic-progress"><span class="sat-progress-frac"><b>' + skill.count + '</b> questions</span></div>' +
            '<div class="sat-topic-accuracy"><span class="sat-acc-val">' + (skill.count > 0 ? skill.count : '\u2013') + '</span></div>' +
          '</div>';
        }).join('');

        return '<section class="sat-domain-group">' +
          '<div class="sat-domain-row">' +
            '<button class="sat-check ' + (domainSelected ? 'is-active' : '') + '" type="button" data-select-domain="' + section.key + '::' + domain.key + '" aria-label="Select ' + domain.key + '"></button>' +
            '<button class="sat-domain-heading" type="button" data-select-domain="' + section.key + '::' + domain.key + '">' +
              '<strong class="sat-domain-name">' + domain.key + '</strong>' +
            '</button>' +
          '</div>' +
          (skillsHtml ? '<div class="sat-topic-list">' + skillsHtml + '</div>' : '') +
        '</section>';
      }).join('');

      return '<article class="sat-section-card is-' + section.key + '">' +
        '<header class="sat-section-header">' +
          '<button class="sat-section-check ' + (isActive ? 'is-active' : '') + '" type="button" data-select-section="' + section.key + '" aria-label="Select all ' + section.label + ' domains"></button>' +
          '<button class="sat-section-heading" type="button" data-select-section="' + section.key + '">' +
            '<div>' +
              '<h2 class="sat-section-title">' + sectionLabel + '</h2>' +
              '<p class="sat-section-count">' + section.description + '</p>' +
            '</div>' +
          '</button>' +
        '</header>' +
        '<div class="sat-topic-columns">' +
          '<span class="sat-col-topic">Topic</span>' +
          '<span class="sat-col-progress">Questions</span>' +
          '<span class="sat-col-accuracy">Count</span>' +
        '</div>' +
        '<div class="sat-domain-grid">' + domainsHtml + '</div>' +
      '</article>';
    }).join('');
  }

  function renderPill() {
    var n = state.selectedSkills.length;
    if (n > 0) {
      selectionPill.removeAttribute("hidden");
      pillCountLabel.textContent = n + " topic" + (n === 1 ? "" : "s") + " selected";
    } else {
      selectionPill.setAttribute("hidden", "");
    }
    pillRandomize.classList.toggle("is-active", state.random);
    pillRandomize.setAttribute("aria-pressed", state.random ? "true" : "false");
  }

  // ── Selection ──
  function selectSection(sectionKey) {
    var section = SECTIONS.find(function(s) { return s.key === sectionKey; });
    if (!section) return;

    if (state.selectedSection === sectionKey) {
      state.selectedSection = null;
      state.selectedSkills = [];
    } else {
      state.selectedSection = sectionKey;
      state.selectedSkills = [];
      section.domains.forEach(function(domain) {
        domain.skills.forEach(function(sk) {
          if (sk.count > 0) state.selectedSkills.push(sk.code);
        });
      });
    }
    renderAll();
  }

  function toggleDomain(sectionKey, domainKey) {
    var section = SECTIONS.find(function(s) { return s.key === sectionKey; });
    if (!section) return;
    var domain = section.domains.find(function(d) { return d.key === domainKey; });
    if (!domain) return;

    if (state.selectedSection !== sectionKey) {
      state.selectedSection = sectionKey;
      state.selectedSkills = [];
    }

    var allSelected = domain.skills.filter(function(sk) { return sk.count > 0; }).every(function(sk) {
      return state.selectedSkills.indexOf(sk.code) !== -1;
    });

    domain.skills.forEach(function(sk) {
      if (sk.count <= 0) return;
      if (allSelected) {
        state.selectedSkills = state.selectedSkills.filter(function(s) { return s !== sk.code; });
      } else {
        if (state.selectedSkills.indexOf(sk.code) === -1) {
          state.selectedSkills.push(sk.code);
        }
      }
    });

    if (state.selectedSkills.length === 0) {
      state.selectedSection = null;
    }
    renderAll();
  }

  function toggleSkill(sectionKey, domainKey, skillCode) {
    if (state.selectedSection !== sectionKey) {
      state.selectedSection = sectionKey;
      state.selectedSkills = [];
    }

    var idx = state.selectedSkills.indexOf(skillCode);
    if (idx !== -1) {
      state.selectedSkills.splice(idx, 1);
    } else {
      state.selectedSkills.push(skillCode);
    }

    if (state.selectedSkills.length === 0) {
      state.selectedSection = null;
    }
    renderAll();
  }

  function renderAll() {
    renderSections();
    renderPill();
  }

  // ── Navigation ──
  function navigate() {
    var ids = NEW_QUESTIONS
      .filter(function(q) { return state.selectedSkills.indexOf(q.sc) !== -1; })
      .map(function(q) { return q.id; });

    if (ids.length === 0) return;

    var url = "./questions.html?questionIds=" + ids.join(",");
    if (state.random) url += "&random=1";
    window.KorahTransitions.go(url);
  }

  // ── Event delegation ──
  sectionColumns.addEventListener("click", function(event) {
    var sectionTrigger = event.target.closest("[data-select-section]");
    var domainTrigger = event.target.closest("[data-select-domain]");
    var skillTrigger = event.target.closest("[data-select-skill]");

    if (sectionTrigger) {
      selectSection(sectionTrigger.dataset.selectSection);
      return;
    }
    if (skillTrigger) {
      var parts = skillTrigger.dataset.selectSkill.split("::");
      toggleSkill(parts[0], parts[1], parts[2]);
      return;
    }
    if (domainTrigger) {
      var parts = domainTrigger.dataset.selectDomain.split("::");
      toggleDomain(parts[0], parts[1]);
      return;
    }
  });

  pillRandomize.addEventListener("click", function() {
    state.random = !state.random;
    renderPill();
  });
  pillStart.addEventListener("click", function() { navigate(); });

  renderAll();
})();