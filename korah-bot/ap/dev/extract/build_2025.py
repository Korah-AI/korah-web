# Builds the 2025 AP Calculus AB FRQ objects and splices them into frqs.json.
# Display fields (prompt, part text, criterion, sampleResponse) carry KaTeX in
# \(...\) delimiters. Model-only fields (commonErrors, exampleEarning,
# exampleFailing) stay bare LaTeX. All content is transcribed from
# ap25-scoreguide-calculus-ab.pdf and the calc-ab-2025-qN.png question sheets.
import io
import json
import sys

FRQS_JSON = r'C:\devbushi\korah-internship\korah-bot\ap\data\ap-calculus-ab\frqs.json'


# ---------- helpers ----------

def pt(q, label, n, criterion, category, commonErrors, earns, fails):
    return {
        "id": "calc-ab-2025-%s%s-%d" % (q, label, n),
        "criterion": criterion,
        "category": category,
        "commonErrors": commonErrors,
        "exampleEarning": earns,
        "exampleFailing": fails,
    }

def part(q, label, text, points):
    return {"label": label, "text": text, "rubricPoints": points}

def frq(n, title, topic, calc, stimulus, prompt, parts, sample):
    return {
        "id": "calc-ab-2025-q%d" % n,
        "course": "ap-calculus-ab",
        "year": 2025,
        "questionNumber": n,
        "title": title,
        "topic": topic,
        "timeAllottedMin": 15,
        "calculatorAllowed": calc,
        "sample": False,
        "stimulus": {"type": "text", "content": stimulus},
        "prompt": prompt,
        "parts": parts,
        "sampleResponse": sample,
    }

# ---------- 2025 Q1: Invasive species, C(t) = 7.6 arctan(0.2t) ----------

q1 = frq(
    1, "Invasive Species Spread",
    "Average Value, Mean Value Theorem, Limits, and Optimization",
    True,
    r"The question presents no figure. The calculator should be in radian mode.",
    r"An invasive species of plant appears in a fruit grove at time \( t = 0 \) and begins to spread. The function C defined by \( C(t) = 7.6\arctan(0.2t) \) models the number of acres in the fruit grove affected by the species t weeks after the species appears. It can be shown that \( C'(t) = \frac{38}{25 + t^2} \). (Note: Your calculator should be in radian mode.)",
    [
        part(q1a := "q1", "(a)",
            r"Find the average number of acres affected by the invasive species from time \( t = 0 \) to time \( t = 4 \) weeks. Show the setup for your calculations.",
            [
                pt(q1a, "a", 1,
                    r"Presents the average value formula \( \frac{1}{4 - 0}\int_0^4 C(t)\,dt = \frac{1}{4}\int_0^4 C(t)\,dt \), i.e. a correct integral together with evidence of division by 4 (with or without the differential dt).",
                    "computation",
                    [
                        r"presents only \( \int_0^4 C(t)\,dt \) with no factor of \( \frac{1}{4} \)",
                        r"uses the average rate of change \( \frac{C(4)-C(0)}{4-0} \) instead of the average value",
                        r"omits the differential dt and treats the whole expression as the antiderivative"
                    ],
                    r"\frac{1}{4}\int_0^4 C(t)\,dt = \frac{1}{4}\int_0^4 7.6\arctan(0.2t)\,dt or the integral together with the correct answer 2.778224",
                    r"\int_0^4 C(t)\,dt = 11.112896 with no division by 4 and no average value"),
                pt(q1a, "a", 2,
                    r"Gives the correct answer 2.778 (or 2.778224), with or without supporting work, accurate to three places after the decimal point.",
                    "evaluation",
                    [
                        r"reports 11.112896, the value of the integral before dividing by 4",
                        r"reports the answer to only two decimal places", 
                        r"reports the average rate of change 1.282 instead of the average value"
                    ],
                    r"\frac{1}{4}(11.112896) = 2.778224, so 2.778 acres",
                    r"11.112896"),
            ]),
        part(q1a, "(b)",
            r"Find the time \( t \) when the instantaneous rate of change of C equals the average rate of change of C over the time interval \( 0 \le t \le 4 \). Show the setup for your calculations.",
            [
                pt(q1a, "b", 1,
                    r"Presents the average rate of change \( \frac{C(4)-C(0)}{4-0} \) and evaluates it to 1.282008, or an equivalent expression such as \( \frac{1}{4}\int_0^4 C'(t)\,dt \).",
                    "computation",
                    [
                        r"presents only t = 1.282 (the value of the average rate of change itself) as the answer",
                        r"computes \( \frac{C(4)-C(0)}{2} \) with the wrong denominator",
                        r"presents the average rate of change expression but never evaluates it"
                    ],
                    r"\frac{C(4)-C(0)}{4-0} = \frac{5.128031 - 0}{4} = 1.282008",
                    r"just t = 1.282 with no setup"),
                pt(q1a, "b", 2,
                    r"Solves \( C'(t) = 1.282008 \) (i.e. \( \frac{38}{25 + t^2} = 1.282008 \)) and reports \( t = 2.154298 \), so \( t = 2.154 \), with supporting work.",
                    "evaluation",
                    [
                        r"solves \( C'(t) = 0 \) instead of \( C'(t) = 1.282008 \)",
                        r"reports 1.282 (the rate value) instead of the time",
                        r"solves \( C(t) = 1.282008 \), finding a time where the number of acres, not the rate, equals the average rate"
                    ],
                    r"\frac{38}{25 + t^2} = 1.282008 \Rightarrow t = 2.154298, so t = 2.154",
                    r"t = 1.282 or solving C'(t) = 0"),
            ]),
        part(q1a, "(c)",
            r"Assume that the invasive species continues to spread according to the given model for all times \( t > 0 \). Write a limit expression that describes the end behavior of the rate of change in the number of acres affected by the species. Evaluate this limit expression.",
            [
                pt(q1a, "c", 1,
                    r"Writes a limit expression for the end behavior of the rate of change: \( \lim_{t \to \infty} C'(t) = \lim_{t \to \infty}\frac{38}{25 + t^2} \) (or \( \lim_{t \to \infty} C(t) \)).",
                    "notation",
                    [
                        r"usesthe limit as t approaches 0 instead of t approaching infinity",
                        r"writes no limit notation and just gives the rational expression",
                        r"writes \( \lim_{x \to \infty} \) with the wrong variable"
                    ],
                    r"\lim_{t \to \infty} C'(t) = \lim_{t \to \infty}\frac{38}{25 + t^2}",
                    r"\frac{38}{25 + t^2} with no limit"),
                pt(q1a, "c", 2,
                    r"Evaluates the limit to 0. (A response whose limit expression is \( \lim_{t\to\infty} C(t) \), not \( \lim_{t\to\infty} C'(t) \), is not eligible; arithmetic with infinity such as substituting \( \infty \) is treated as scratch work.)",
                    "evaluation",
                    [
                        r"writes \( \frac{38}{25 + \infty^2} = 0 \), i.e. arithmetic with infinity",
                        r"evaluates \( \lim_{t \to \infty} C(t) = \frac{76}{5}\cdot\frac{\pi}{2} \) and reports that as the rate's limiting value",
                        r"reports a nonzero value"
                    ],
                    r"Since \( 25 + t^2 \to \infty \) as \( t \to \infty \), \( C'(t) \to 0 \)",
                    r"\frac{38}{25 + \infty^2} = 0"),
            ]),
        part(q1a, "(d)",
            r"At time \( t = 4 \) weeks after the invasive species appears in the fruit grove, measures are taken to counter the spread of the species. The function A, defined by \( A(t) = C(t) - 0.1\int_4^t \ln(x)\,dx \), models the number of acres affected by the species over the time interval \( 4 \le t \le 36 \). At what time \( t \), for \( 4 \le t \le 36 \), does A attain its maximum value? Justify your answer.",
            [
                pt(q1a, "d", 1,
                    r"Considers \( A'(t) = 0 \), \( C'(t) - 0.1\ln t = 0 \), or \( C'(t) = 0.1\ln t \) (or discusses the sign of \( A'(t) \) changing or the critical points of A).",
                    "justification",
                    [
                        r"just presents t = 11.441700 with no equation",
                        r"differentiates A incorrectly (forgets the fundamental theorem term \( 0.1\ln t \) )",
                        r"solves \( C'(t) = 0 \) alone"
                    ],
                    r"A'(t) = C'(t) - 0.1\ln t = 0, i.e. C'(t) = 0.1\ln t",
                    r"t = 11.441700 presented with nothing else"),
                pt(q1a, "d", 2,
                    r"Makes a global argument: evaluates and compares \( A(4) = 5.128 \), \( A(11.441700) = 7.317 \), and \( A(36) = 1.743 \) (candidates test), or shows \( A'(t) > 0 \) for \( 4 < t < 11.442 \) and \( A'(t) < 0 \) for \( 11.442 < t < 36 \).",
                    "justification",
                    [
                        r"gives only a local argument (First or Second Derivative Test) with no global comparison",
                        r"omits one of the three candidate evaluations (4, 11.441700, 36)",
                        r"evaluates A incorrectly at one of the candidates"
                    ],
                    r"A(4) = 5.128031, A(11.441700) = 7.316978, A(36) = 1.743056, so the maximum is the largest",
                    r"sign change of A' alone with no global comparison"),
                pt(q1a, "d", 3,
                    r"Reports the time \( t = 11.442 \) (or 11.441), with supporting work.",
                    "evaluation",
                    [
                        r"reports the maximum value 7.317 instead of the time",
                        r"reports t = 36 or t = 4",
                        r"gives 11.442 with no work"
                    ],
                    r"Therefore the number of acres is maximum at t = 11.442 weeks",
                    r"A(11.442) = 7.317"),
            ]),
    ],
    r"(a) The average number of acres is \( \frac{1}{4}\int_0^4 C(t)\,dt = \frac{1}{4}(11.112896) = 2.778224 \), so 2.778 acres. (b) The average rate of change over \( 0 \le t \le 4 \) is \( \frac{C(4)-C(0)}{4-0} = 1.282008 \). Setting \( C'(t) = 1.282008 \) gives \( t = 2.154298 \), so the time is 2.154. (c) \( \lim_{t \to \infty} C'(t) = \lim_{t \to \infty}\frac{38}{25 + t^2} = 0 \). (d) \( A'(t) = C'(t) - 0.1\ln t \), so \( A'(t) = 0 \) gives \( \frac{38}{25 + t^2} = 0.1\ln t \) and \( t = 11.441700 \). Comparing \( A(4) = 5.128031 \), \( A(11.441700) = 7.316978 \), and \( A(36) = 1.743056 \), the maximum occurs at \( t = 11.442 \)."
)

# ---------- 2025 Q2: Region R between f and g, washers ----------

q2 = frq(
    2, "Area, Volume, and Washers",
    "Applications of Integration",
    True,
    r"The figure shows the graphs of f and g on [0, 3], with f below g, bounding the shaded region R. (The figure image is shown to the student.)",
    r"The shaded region R is bounded by the graphs of the functions f and g, where \( f(x) = x^2 - 2x \) and \( g(x) = x + \sin(\pi x) \), as shown in the figure. (Note: Your calculator should be in radian mode.) (The graph of f and g in the figure is not embedded in this data file.)",
    [
        part(q2a := "q2", "(a)",
            r"Find the area of R. Show the setup for your calculations.",
            [
                pt(q2a, "a", 1,
                    r"Presents an integrand of \( g(x) - f(x) \) (or \( f(x) - g(x) \)) in a definite integral with the limits 0 to 3, with or without the differential dx.",
                    "integral-setup",
                    [
                        r"uses the integrand \( g(x) \) or \( f(x) \) alone (missing the difference)",
                        r"writes \( 2x - x^2 \) (a sign error in the difference) in the integral",
                        r"omits the limits of integration"
                    ],
                    r"\int_0^3 (g(x) - f(x))\,dx = \int_0^3 (x + \sin(\pi x) - x^2 + 2x)\,dx",
                    r"\int_0^3 g(x)\,dx alone or a difference of the wrong sign with no resolution"),
                pt(q2a, "a", 2,
                    r"Evaluates to 5.136620 and reports the area as 5.137 (or 5.136), accurate to three places after the decimal point.",
                    "evaluation",
                    [
                        r"reports -5.137 while claiming the area is positive (using f - g without resolving the sign)",
                        r"reports 4.5 (forgetting the \( \sin \) integral term)",
                        r"reports the answer with too few decimal places"
                    ],
                    r"\int_0^3 (x + \sin(\pi x) - x^2 + 2x)\,dx = [\frac{3}{2}x^2 - \frac{x^3}{3} - \frac{\cos(\pi x)}{\pi}]_0^3",
                    r"5.136620 mislabeled as negative"),
            ]),
        part(q2a, "(b)",
            r"Region R is the base of a solid. For this solid, at each x the cross section perpendicular to the x-axis is a rectangle with height x and base in region R. Find the volume of the solid. Show the setup for your calculations.",
            [
                pt(q2a, "b", 1,
                    r"Presents a definite integral with an integrand that is a product of two nonconstant factors, one of which is \( x \) and the other \( g(x) - f(x) \) (or \( f(x) - g(x) \)), e.g. \( x(g(x) - f(x)) \).",
                    "integral-setup",
                    [
                        r"writes \( x^2(g(x) - f(x)) \) (squares the height)",
                        r"writes \( (g(x) - f(x)) \) alone with no height factor x",
                        r"uses limits other than 0 to 3"
                    ],
                    r"\int_0^3 x(g(x) - f(x))\,dx",
                    r"\int_0^3 x^2(g(x) - f(x))\,dx or \int_0^3 (g(x) - f(x))\,dx"),
                pt(q2a, "b", 2,
                    r"Evaluates to 7.704930 and reports the volume as 7.705 (or 7.704), accurate to three places after the decimal point.",
                    "evaluation",
                    [
                        r"reports the area 5.137 instead of the volume",
                        r"reports -7.705 with no sign resolution",
                        r"computes the antiderivative incorrectly (missing the \( x \) factor in integration by parts)"
                    ],
                    r"\int_0^3 x(g(x) - f(x))\,dx = 7.704930",
                    r"5.137 reported as the volume"),
            ]),
        part(q2a, "(c)",
            r"Write, but do not evaluate, an integral expression for the volume of the solid generated when the region R is rotated about the horizontal line \( y = -2 \).",
            [
                pt(q2a, "c", 1,
                    r"Presents a definite integral with an integrand of the form \( R^2 - r^2 \), where one of \( R \) or \( r \) is a correct difference \( g(x) + 2 \) (or \( f(x) + 2 \)) and the other is correct or a difference of f or g from a nonzero constant. (A response without the constant \( \pi \) remains eligible for this point and the next.)",
                    "notation",
                    [
                        r"writes a single square \( (g(x) + 2)^2 \) with no subtraction",
                        r"writes \( R^2 + r^2 \) (sum instead of difference)",
                        r"uses the shell method radius form instead of an annulus"
                    ],
                    r"\pi\int_0^3 ((g(x) + 2)^2 - (f(x) + 2)^2)\,dx",
                    r"\int_0^3 ((g(x) + 2)^2 + (f(x) + 2)^2)\,dx"),
                pt(q2a, "c", 2,
                    r"Writes the correct integrand \( (g(x) + 2)^2 - (f(x) + 2)^2 \) (or \( (f(x) + 2)^2 - (g(x) + 2)^2 \) when the reversal is resolved by the sign, limits, or both), with the factor \( \pi \), or a mathematically equivalent expression.",
                    "integral-setup",
                    [
                        r"writes \( (g(x) - 2)^2 \) with the wrong constant sign",
                        r"omits the constant 2 shift entirely, using \( f(x)^2 - g(x)^2 \)",
                        r"reverses the difference of squares with no resolution"
                    ],
                    r"\pi\int_0^3 ((g(x) + 2)^2 - (f(x) + 2)^2)\,dx where R = g + 2 and r = f + 2",
                    r"\pi\int_0^3 (g(x)^2 - f(x)^2)\,dx or \pi\int_0^3 ((g(x) - 2)^2 - (f(x) - 2)^2)\,dx"),
                pt(q2a, "c", 3,
                    r"Includes all three of the limits \( x = 0 \) to \( x = 3 \), the constant \( \pi \), and the differential dx in the final integral. (A response with a reversed difference of squares must resolve it with the constant or limits AND include dx to earn this point.)",
                    "notation",
                    [
                        r"omits the factor \( \pi \)",
                        r"omits the differential dx",
                        r"uses limits 0 to 2 (or another wrong interval)"
                    ],
                    r"\pi\int_0^3 ((g(x) + 2)^2 - (f(x) + 2)^2)\,dx with all of \pi, 0 to 3, and dx",
                    r"\int_0^3 ((g(x) + 2)^2 - (f(x) + 2)^2)\,dx with no \pi"),
            ]),
        part(q2a, "(d)",
            r"It can be shown that \( g'(x) = 1 + \pi\cos(\pi x) \). Find the value of \( x \), for \( 0 < x < 1 \), at which the line tangent to the graph of f is parallel to the line tangent to the graph of g.",
            [
                pt(q2a, "d", 1,
                    r"Sets \( f'(x) = g'(x) \), giving \( 2x - 2 = 1 + \pi\cos(\pi x) \), or a general statement such as \( f'(x) = g'(x) \) with correct substitution of either derivative.",
                    "computation",
                    [
                        r"uses \( f(x) = g(x) \) instead of the derivatives",
                        r"computes \( f'(x) = 2x^2 - 2x \) or another incorrect derivative",
                        r"writes \( 2x - 2 = 1 + \sin(\pi x) \) (drops the factor \( \pi \) on the cosine)"
                    ],
                    r"f'(x) = 2x - 2 and g'(x) = 1 + \pi\cos(\pi x), so 2x - 2 = 1 + \pi\cos(\pi x)",
                    r"f(x) = g(x) solved instead of f'(x) = g'(x)"),
                pt(q2a, "d", 2,
                    r"Reports \( x = 0.675819 \), so \( x = 0.676 \) (or 0.675), accurate to three places after the decimal point.",
                    "evaluation",
                    [
                        r"reports the value 0.675819 with no solution work",
                        r"reports where the curves intersect (around 0.4) instead of where the tangents are parallel",
                        r"reports the value to only two places"
                    ],
                    r"Solving 2x - 2 = 1 + \pi\cos(\pi x) numerically gives x = 0.675819, so x = 0.676",
                    r"x = 0.676 unsupported or x = 0.4 (an intersection of the graphs)"),
            ]),
    ],
    r"(a) Area = \( \int_0^3 (g(x) - f(x))\,dx = \int_0^3 (x + \sin(\pi x) - x^2 + 2x)\,dx = 5.136620 \), so the area of R is 5.137. (b) Volume = \( \int_0^3 x(g(x) - f(x))\,dx = 7.704930 \), so the volume is 7.705. (c) Rotating about \( y = -2 \), Volume = \( \pi\int_0^3 \left((g(x) + 2)^2 - (f(x) + 2)^2\right)\,dx \). (d) \( f'(x) = 2x - 2 \) and \( g'(x) = 1 + \pi\cos(\pi x) \); the tangents are parallel when \( 2x - 2 = 1 + \pi\cos(\pi x) \), giving \( x = 0.675819 \), so \( x = 0.676 \)."
)

# ---------- 2025 Q3: Reading rates with a table ----------

q3 = frq(
    3, "Reading Rates",
    "Trapezoidal Approximation, IVT, and Polynomial Integration",
    False,
    r"t (minutes): 0, 2, 8, 10\nR(t) (words per minute): 90, 100, 150, 162",
    r"A student starts reading a book at time \( t = 0 \) minutes and continues reading for the next 10 minutes. The rate at which the student reads is modeled by the differentiable function R, where \( R(t) \) is measured in words per minute. Selected values of \( R(t) \) are given in the table shown.\n\nt (minutes): 0, 2, 8, 10\nR(t) (words per minute): 90, 100, 150, 162",
    [
        part(q3a := "q3", "(a)",
            r"Approximate \( R'(1) \) using the average rate of change of R over the interval \( 0 \le t \le 2 \). Show the work that leads to your answer. Indicate units of measure.",
            [
                pt(q3a, "a", 1,
                    r"Presents the answer 5 together with the supporting work of a difference and a quotient: \( \frac{R(2) - R(0)}{2 - 0} = \frac{100 - 90}{2} = 5 \), or an equivalent expression.",
                    "computation",
                    [
                        r"presents \( \frac{R(2) - R(0)}{2 - 0} \) without evaluating or without the value 5",
                        r"computes \( \frac{90 - 100}{2} = -5 \) with the wrong sign",
                        r"uses a different interval such as \( 0 \) to \( 8 \)"
                    ],
                    r"R'(1) \approx \frac{R(2) - R(0)}{2 - 0} = \frac{100 - 90}{2} = 5",
                    r"5 with no difference and quotient"),
                pt(q3a, "a", 2,
                    r"Indicates the units words per minute per minute (equivalently words per min^2), whether or not they are attached to the value.",
                    "units",
                    [
                        r"gives units of 'words per minute' (missing the second per-minute)",
                        r"gives units of 'words'",
                        r"no units at all"
                    ],
                    r"5 words per minute per minute",
                    r"5 words per minute"),
            ]),
        part(q3a, "(b)",
            r"Must there be a value \( c \), for \( 0 < c < 10 \), such that \( R(c) = 155 \)? Justify your answer.",
            [
                pt(q3a, "b", 1,
                    r"States that R is continuous because R is differentiable (or equivalent). A bare statement 'R is continuous' with no justification does not earn the point.",
                    "justification",
                    [
                        r"states only 'R is continuous' with no reason",
                        r"says 'R is differentiable' but never links it to continuity",
                        r"invokes continuity with no justification of why R is continuous"
                    ],
                    r"R is differentiable, so R is continuous on [0, 10]",
                    r"'R is continuous' with no justification"),
                pt(q3a, "b", 2,
                    r"Indicates that \( R(0) < 155 \) (or \( R(2) < 155 \) or \( R(8) < 155 \)) and \( R(10) > 155 \), states that R is continuous, and answers yes, so by the Intermediate Value Theorem there is a value c in (0, 10) with \( R(c) = 155 \).",
                    "justification",
                    [
                        r"gives the endpoint values but no conclusion",
                        r"answers yes relying only on the intermediate values without a continuity statement",
                        r"names an incorrect theorem (e.g. the Mean Value Theorem)"
                    ],
                    r"R(0) = 90 < 155 < 162 = R(10), and R is continuous, so by the IVT such a c exists",
                    r"'yes' with R(0) < 155 and R(10) > 155 but no continuity statement"),
            ]),
        part(q3a, "(c)",
            r"Use a trapezoidal sum with the three subintervals indicated by the data in the table to approximate the value of \( \int_0^{10} R(t)\,dt \). Show the work that leads to your answer.",
            [
                pt(q3a, "c", 1,
                    r"Presents the form of a trapezoidal sum with three terms, each a product of a midpoint height and a width, e.g. \( \frac{R(0)+R(2)}{2}(2-0) + \frac{R(2)+R(8)}{2}(8-2) + \frac{R(8)+R(10)}{2}(10-8) \), with at least five of the six factors correct.",
                    "integral-setup",
                    [
                        r"uses 0, 2, 8, 10 with an incorrect width (e.g. 5 for the middle subinterval)",
                        r"uses a Riemann sum (left or right) instead of trapezoids",
                        r"has more than one incorrect factor"
                    ],
                    r"(2)\frac{90 + 100}{2} + (6)\frac{100 + 150}{2} + (2)\frac{150 + 162}{2}",
                    r"90(2) + 100(6) + 150(2) (a left Riemann sum)"),
                pt(q3a, "c", 2,
                    r"Computes \( \frac{190}{2}(2) + \frac{250}{2}(6) + \frac{312}{2}(2) = 190 + 750 + 312 = 1252 \), with the answer supported by the work.",
                    "evaluation",
                    [
                        r"arithmetic error in 190 + 750 + 312",
                        r"reports 1252 with no trapezoidal-sum work shown",
                        r"forgets the factor of \( \frac{1}{2} \) and doubles the sum"
                    ],
                    r"190 + 750 + 312 = 1252",
                    r"2504 (no division by 2) reported as the trapezoidal sum"),
            ]),
        part(q3a, "(d)",
            r"A teacher also starts reading at time \( t = 0 \) minutes and continues reading for the next 10 minutes. The rate at which the teacher reads is modeled by the function W defined by \( W(t) = -\frac{3}{10}t^2 + 8t + 100 \), where \( W(t) \) is measured in words per minute. Based on the model, how many words has the teacher read by the end of the 10 minutes? Show the work that leads to your answer.",
            [
                pt(q3a, "d", 1,
                    r"Presents the definite (or indefinite) integral \( \int_0^{10} W(t)\,dt = \int_0^{10}\left(-\frac{3}{10}t^2 + 8t + 100\right)\,dt \), with or without the differential dt.",
                    "integral-setup",
                    [
                        r"uses limits 0 to 10 but integrates a different function (e.g. R(t) values)",
                        r"writes only W(10) - W(0)",
                        r"omits the integral entirely"
                    ],
                    r"\int_0^{10}\left(-\frac{3}{10}t^2 + 8t + 100\right)\,dt",
                    r"W(10) = 150 evaluated as if it were the total words"),
                pt(q3a, "d", 2,
                    r"Computes the correct antiderivative \( -\frac{1}{10}t^3 + 4t^2 + 100t \), with or without the constant of integration.",
                    "notation",
                    [
                        r"computes \( -\frac{3}{10}\frac{t^3}{3} = -\frac{3}{30}t^3 \) incorrectly",
                        r"forgets to multiply \( 8t \) by \( \frac{1}{2} \) (writes \( 8t^2 \))",
                        r"writes \( -\frac{1}{10}t^3 + 4t^2 \) but drops the 100t term"
                    ],
                    r"[-\frac{1}{10}t^3 + 4t^2 + 100t]_0^{10}",
                    r"[-\frac{3}{10}t^3 + 8t^2 + 100]_0^{10}"),
                pt(q3a, "d", 3,
                    r"Evaluates to \( -\frac{1}{10}(10)^3 + 4(10)^2 + 100(10) = -100 + 400 + 1000 = 1300 \), reporting 1300 words.",
                    "evaluation",
                    [
                        r"evaluates the antiderivative at the wrong endpoint",
                        r"computes -100 + 400 + 1000 with an arithmetic error",
                        r"reports 1300 as the rate, not the total"
                    ],
                    r"-100 + 400 + 1000 = 1300 words",
                    r"1300 with no work or a wrong antiderivative evaluation"),
            ]),
    ],
    r"(a) \( R'(1) \approx \frac{R(2)-R(0)}{2-0} = \frac{100-90}{2} = 5 \) words per minute per minute. (b) \( R(0) = 90 < 155 \) and \( R(10) = 162 > 155 \); R is differentiable, hence continuous, so by the Intermediate Value Theorem there is a c in (0,10) with \( R(c) = 155 \). (c) \( \int_0^{10} R(t)\,dt \approx (2)\frac{90+100}{2} + (6)\frac{100+150}{2} + (2)\frac{150+162}{2} = 190 + 750 + 312 = 1252 \). (d) \( \int_0^{10} W(t)\,dt = \left[-\frac{1}{10}t^3 + 4t^2 + 100t\right]_0^{10} = -100 + 400 + 1000 = 1300 \) words."
)

# ---------- 2025 Q4: Graph of f, g(x) = integral of f ----------

q4 = frq(
    4, "Accumulation Function from a Graph",
    "Fundamental Theorem of Calculus and Graph Analysis",
    False,
    r"The figure shows the graph of f on [-6, 12]: a lower semicircle of radius 3 on [-6, 0], an upper semicircle of radius 3 on [0, 6], and the line segment from (6, 0) to (12, 3). (The figure is not embedded in this data file.)",
    r"The continuous function f is defined on the closed interval \( -6 \le x \le 12 \). The graph of f, consisting of two semicircles and one line segment, is shown in the figure. Let g be the function defined by \( g(x) = \int_{-6}^{x} f(t)\,dt \).",
    [
        part(q4a := "q4", "(a)",
            r"Find \( g'(8) \). Give a reason for your answer.",
            [
                pt(q4a, "a", 1,
                    r"States \( g'(x) = f(x) \), \( g'(8) = f(8) \), or otherwise applies the Fundamental Theorem of Calculus in part (a).",
                    "justification",
                    [
                        r"states \( g'(8) = f(8) - f(6) \) (misapplies the FTC)",
                        r"gives only f(8) with no statement tying it to g'",
                        r"computes g(8) - g(6) instead of the derivative"
                    ],
                    r"By the Fundamental Theorem of Calculus, g'(x) = f(x)",
                    r"g'(8) = f(8) - f(6)"),
                pt(q4a, "a", 2,
                    r"Reports \( g'(8) = f(8) = 1 \), read from the line segment of the graph (the segment from (6, 0) to (12, 3) has f(8) = 1).",
                    "evaluation",
                    [
                        r"reads f(8) = 0 or f(8) = 2",
                        r"reports the area \( \int_0^8 f \) instead of the value of f",
                        r"computes the slope of the segment at the wrong point"
                    ],
                    r"g'(8) = f(8) = 1",
                    r"f(8) = 0"),
            ]),
        part(q4a, "(b)",
            r"Find all values of x in the open interval \( -6 < x < 12 \) at which the graph of g has a point of inflection. Give a reason for your answer.",
            [
                pt(q4a, "b", 1,
                    r"States the points of inflection: \( x = -3 \), \( x = 3 \), and \( x = 6 \), with no other/additional values in the open interval declared to be points of inflection.",
                    "evaluation",
                    [
                        r"includes x = 0 as a point of inflection",
                        r"declares additional x-values beyond -3, 3, and 6",
                        r"gives only two of the three values"
                    ],
                    r"x = -3, x = 3, and x = 6",
                    r"x = 0, x = -3, x = 3, and x = 6"),
                pt(q4a, "b", 2,
                    r"Gives a reason tied to the graph of f: g has a point of inflection where f changes from increasing to decreasing or from decreasing to increasing (where f attains a relative extremum).",
                    "justification",
                    [
                        r"says 'g changes concavity there' without reference to f",
                        r"says g'' = f' changes sign there without reference to the given graph of f",
                        r"uses an ambiguous term such as 'the function' or 'the graph'"
                    ],
                    r"because f changes from decreasing to increasing at x = -3 and x = 6, and from increasing to decreasing at x = 3",
                    r"'g changes concavity there' with no tie to f"),
            ]),
        part(q4a, "(c)",
            r"Find \( g(12) \) and \( g(0) \). Label your answers.",
            [
                pt(q4a, "c", 1,
                    r"Reports \( g(12) = 9 \), with or without supporting work, and labels the answer as g(12). Unlabeled values do not earn the point.",
                    "evaluation",
                    [
                        r"gives 9 without the label g(12)",
                        r"computes \( \int_{-6}^{12} f \) as 0 (forgetting the triangle)",
                        r"reports g(12) = -9"
                    ],
                    r"g(12) = \int_{-6}^{12} f(t)\,dt = \frac{1}{2}(6)(3) = 9",
                    r"9 unlabeled"),
                pt(q4a, "c", 2,
                    r"Reports \( g(0) = -\frac{9\pi}{2} \), with or without supporting work, and labels the answer as g(0). Unlabeled values do not earn the point.",
                    "evaluation",
                    [
                        r"gives \( \frac{9\pi}{2} \) (wrong sign, treats the semicircle area as positive)",
                        r"gives 0 for g(0)",
                        r"reports \( \frac{9\pi}{2} \) without the label g(0)"
                    ],
                    r"g(0) = \int_{-6}^{0} f(t)\,dt = -\frac{1}{2}\pi(3)^2 = -\frac{9\pi}{2}",
                    r"-9\pi/2 unlabeled or +9\pi/2"),
            ]),
        part(q4a, "(d)",
            r"Find the value of x at which g attains an absolute minimum on the closed interval \( -6 \le x \le 12 \). Justify your answer.",
            [
                pt(q4a, "d", 1,
                    r"Considers \( g'(x) = f(x) = 0 \) (candidates x = 0 and x = 6) or \( g'(x) = 0 \), or discusses the sign of \( g'(x) \) / critical points of g.",
                    "justification",
                    [
                        r"just presents x = 0 and x = 6 with no equation",
                        r"considers \( g(x) = 0 \) instead of \( g'(x) = 0 \)",
                        r"omits the endpoints from the candidate list"
                    ],
                    r"g'(x) = f(x) = 0, so x = 0 and x = 6 are candidates",
                    r"x = 0 and x = 6 presented unsupported"),
                pt(q4a, "d", 2,
                    r"Makes a global argument: compares \( g(-6) = 0 \), \( g(0) = -\frac{9\pi}{2} \), \( g(6) = 0 \), and \( g(12) = 9 \) (and no other x-values), or shows \( f(x) \le 0 \) for \( -6 \le x < 0 \) and \( f(x) \ge 0 \) for \( 0 < x \le 12 \).",
                    "justification",
                    [
                        r"uses a First or Second Derivative Test only (a local argument)",
                        r"omits one of the candidate evaluations",
                        r"compares values outside the interval"
                    ],
                    r"The smallest of g(-6) = 0, g(0) = -9\pi/2, g(6) = 0, and g(12) = 9 is g(0)",
                    r"sign-change of g' alone with no global comparison"),
                pt(q4a, "d", 3,
                    r"Reports \( x = 0 \).",
                    "evaluation",
                    [
                        r"reports x = 6",
                        r"reports the minimum value \( -\frac{9\pi}{2} \) instead of the x-value",
                        r"reports x = 12"
                    ],
                    r"Therefore g attains its absolute minimum at x = 0",
                    r"x = 6"),
            ]),
    ],
    r"(a) By the Fundamental Theorem of Calculus, \( g'(x) = f(x) \), so \( g'(8) = f(8) = 1 \). (b) The graph of g has a point of inflection where f changes from increasing to decreasing or from decreasing to increasing, i.e. at \( x = -3 \), \( x = 3 \), and \( x = 6 \). (c) \( g(12) = \int_{-6}^{12} f(t)\,dt = \frac{1}{2}(6)(3) = 9 \), and \( g(0) = \int_{-6}^{0} f(t)\,dt = -\frac{1}{2}\pi(3)^2 = -\frac{9\pi}{2} \). (d) \( g'(x) = f(x) = 0 \) at \( x = 0 \) and \( x = 6 \). Comparing \( g(-6) = 0 \), \( g(0) = -9\pi/2 \), \( g(6) = 0 \), and \( g(12) = 9 \), the absolute minimum occurs at \( x = 0 \)."
)

# ---------- 2025 Q5: Two particles on the x-axis ----------

q5 = frq(
    5, "Two Particles on the x-axis",
    "Particle Motion",
    False,
    r"The question presents no figure.",
    r"Two particles, H and J, are moving along the x-axis. For \( 0 \le t \le 5 \), the position of particle H at time t is given by \( x_H(t) = e^{t^2 - 4t} \), and the velocity of particle J at time t is given by \( v_J(t) = 2t(t^2 - 1)^3 \).",
    [
        part(q5a := "q5", "(a)",
            r"Find the velocity of particle H at time \( t = 1 \). Show the work that leads to your answer.",
            [
                pt(q5a, "a", 1,
                    r"Differentiates: \( x_H'(t) = v_H(t) = (2t - 4)e^{t^2 - 4t} \), or an equivalent form such as \( (2\cdot 1 - 4)e^{1 - 4} \).",
                    "computation",
                    [
                        r"uses \( v_H(t) = e^{t^2-4t} \) without differentiating",
                        r"applies the chain rule incorrectly (writes \( e^{t^2-4t} \) with only a factor of 2t)",
                        r"confuses particle H's value with particle J's velocity"
                    ],
                    r"v_H(t) = x_H'(t) = (2t - 4)e^{t^2 - 4t}",
                    r"e^{t^2-4t} reported as the velocity with no derivative"),
                pt(q5a, "a", 2,
                    r"Reports \( v_H(1) = -2e^{-3} \), with supporting work.",
                    "evaluation",
                    [
                        r"reports \( 2e^{-3} \) (wrong sign)",
                        r"reports \( -2e \) (evaluates the exponent as 1 instead of -3)",
                        r"reports \( -2 \) (drops the exponential factor)"
                    ],
                    r"v_H(1) = (2(1) - 4)e^{1 - 4} = -2e^{-3}",
                    r"2e^{-3}"),
            ]),
        part(q5a, "(b)",
            r"During what open intervals of time t, for \( 0 < t < 5 \), are particles H and J moving in opposite directions? Give a reason for your answer.",
            [
                pt(q5a, "b", 1,
                    r"Considers the sign of a velocity: sets \( x_H'(t) = 0 \), \( v_H(t) = 0 \), or \( v_J(t) = 0 \) (or identifies \( t = 2 \) for H and \( t = 1 \) for J with no other zeros in \( 0 < t < 5 \), or identifies the interval \( 1 < t < 2 \)).",
                    "justification",
                    [
                        r"never sets any velocity to zero to find the sign-change times",
                        r"finds only one of the two sign-change times",
                        r"uses t = 0 and t = 5 as the sign-change times"
                    ],
                    r"(2t - 4)e^{t^2-4t} = 0 gives t = 2, and 2t(t^2-1)^3 = 0 gives t = 1",
                    r"never considers where either velocity is zero"),
                pt(q5a, "b", 2,
                    r"Provides a correct analysis of the sign of velocity or direction of motion on \( 0 < t < 5 \) for particle H or for particle J.",
                    "justification",
                    [
                        r"states signs on the wrong intervals",
                        r"gives only the roots with no sign analysis",
                        r"analyzes only values outside the interval"
                    ],
                    r"v_H(t) < 0 for 0 < t < 2 and v_H(t) > 0 for 2 < t < 5 (H moves left then right)",
                    r"says H 'changes direction' without sign analysis"),
                pt(q5a, "b", 3,
                    r"Provides correct sign/direction analyses for both particles and concludes that they move in opposite directions on \( 1 < t < 2 \).",
                    "justification",
                    [
                        r"has a sign error in one particle's analysis",
                        r"concludes the wrong interval (e.g. 0 < t < 1 or 2 < t < 5)",
                        r"gives both analyses but never states the interval"
                    ],
                    r"J moves left for 0 < t < 1 and right for 1 < t < 5; H moves left for 0 < t < 2 and right for 2 < t < 5, so only for 1 < t < 2 do they move in opposite directions",
                    r"opposite directions on 0 < t < 1"),
            ]),
        part(q5a, "(c)",
            r"It can be shown that \( v_J'(2) > 0 \). Is the speed of particle J increasing, decreasing, or neither at time \( t = 2 \)? Give a reason for your answer.",
            [
                pt(q5a, "c", 1,
                    r"States that \( v_J(2) > 0 \) (imported from part (b) or restarted) and \( v_J'(2) > 0 \) have the same sign, so the speed of particle J is increasing at \( t = 2 \).",
                    "justification",
                    [
                        r"concludes the speed is decreasing (signs have opposite effects for speed)",
                        r"compares the magnitudes of v(2) and v'(2) instead of their signs",
                        r"gives no reason for the verdict"
                    ],
                    r"Because v_J(2) > 0 and v_J'(2) > 0 have the same sign, the speed is increasing",
                    r"'decreasing' because v_J' is positive"),
            ]),
        part(q5a, "(d)",
            r"Particle J is at position \( x = 7 \) at time \( t = 0 \). Find the position of particle J at time \( t = 2 \). Show the work that leads to your answer.",
            [
                pt(q5a, "d", 1,
                    r"Writes the definite integral \( x_J(2) = 7 + \int_0^2 v_J(t)\,dt = 7 + \int_0^2 2t(t^2 - 1)^3\,dt \) (or an indefinite integral with integrand \( v_J(t) \)).",
                    "integral-setup",
                    [
                        r"writes \( \int_0^2 v_J(t)\,dt \) but forgets the initial position 7",
                        r"uses the wrong integrand (e.g. \( 2t(t^2 - 1)^2 \))",
                        r"integrates from 0 to 5 instead of 0 to 2"
                    ],
                    r"x_J(2) = x_J(0) + \int_0^2 v_J(t)\,dt = 7 + \int_0^2 2t(t^2-1)^3\,dt",
                    r"\int_0^2 2t(t^2-1)^3\,dt alone with no +7"),
                pt(q5a, "d", 2,
                    r"Computes the antiderivative \( \frac{1}{4}(t^2 - 1)^4 \) (the form \( k(t^2 - 1)^4 \) with \( k > 0 \)), with or without the constant of integration.",
                    "notation",
                    [
                        r"writes \( (t^2 - 1)^4 \) with no \( \frac{1}{4} \) factor",
                        r"writes \( \frac{1}{8}(t^2 - 1)^4 \) (wrong constant from u-substitution)",
                        r"writes \( \frac{1}{4}(t^2 - 1)^3 \) (wrong exponent)"
                    ],
                    r"\int 2t(t^2-1)^3\,dt = \frac{1}{4}(t^2 - 1)^4 + C",
                    r"(t^2 - 1)^4 as the antiderivative"),
                pt(q5a, "d", 3,
                    r"Evaluates to \( 7 + \frac{1}{4}(3^4 - (-1)^4) = 7 + \frac{1}{4}(80) = 27 \), reporting the position 27.",
                    "evaluation",
                    [
                        r"evaluates \( (2^2 - 1)^4 = 81 \) but uses the wrong lower limit",
                        r"computes \( 7 + 20 = 27 \) but loses the +7 somewhere",
                        r"reports the displacement 20 instead of the position 27"
                    ],
                    r"7 + \frac{1}{4}((3)^4 - (-1)^4) = 7 + 20 = 27",
                    r"20 (the displacement) reported as the position"),
            ]),
    ],
    r"(a) \( v_H(t) = x_H'(t) = (2t - 4)e^{t^2 - 4t} \), so \( v_H(1) = -2e^{-3} \). (b) \( v_H(t) = 0 \) at \( t = 2 \): \( v_H < 0 \) for \( 0 < t < 2 \) and \( v_H > 0 \) for \( 2 < t < 5 \). \( v_J(t) = 0 \) at \( t = 1 \): \( v_J < 0 \) for \( 0 < t < 1 \) and \( v_J > 0 \) for \( 1 < t < 5 \). So the particles move in opposite directions on \( 1 < t < 2 \). (c) \( v_J(2) = 108 > 0 \) and \( v_J'(2) = 486 > 0 \) have the same sign, so the speed of particle J is increasing at \( t = 2 \). (d) \( x_J(2) = 7 + \int_0^2 2t(t^2 - 1)^3\,dt = 7 + \left[\frac{1}{4}(t^2 - 1)^4\right]_0^2 = 7 + \frac{1}{4}(3^4 - (-1)^4) = 7 + 20 = 27 \)."
)

# ---------- 2025 Q6: Implicit curve G and a particle on H ----------

q6 = frq(
    6, "Implicit Curve and a Moving Particle",
    "Implicit Differentiation",
    False,
    r"The question presents no figure.",
    r"Consider the curve G defined by the equation \( y^3 - y^2 - y + \frac{1}{4}x^2 = 0 \).",
    [
        part(q6a := "q6", "(a)",
            r"Show that \( \frac{dy}{dx} = -\frac{x}{2(3y^2 - 2y - 1)} \).",
            [
                pt(q6a, "a", 1,
                    r"Performs the correct implicit differentiation of \( y^3 - y^2 - y + \frac{1}{4}x^2 = 0 \), e.g. \( (3y^2 - 2y - 1)\frac{dy}{dx} = -\frac{x}{2} \).",
                    "computation",
                    [
                        r"differentiates \( \frac{1}{4}x^2 \) as \( \frac{1}{4} \) instead of \( \frac{x}{2} \)",
                        r"writes \( 3y^2\frac{dy}{dx} - 2y - 1 \) (forgets to tag the other y-terms with \( \frac{dy}{dx} \))",
                        r"differentiates the constant 0 side incorrectly"
                    ],
                    r"3y^2\frac{dy}{dx} - 2y\frac{dy}{dx} - \frac{dy}{dx} + \frac{x}{2} = 0, so (3y^2-2y-1)\frac{dy}{dx} = -\frac{x}{2}",
                    r"3y^2 - 2y - 1 + \frac{x}{2} = 0 (no \frac{dy}{dx} on the y-terms)"),
                pt(q6a, "a", 2,
                    r"Solves the differentiated equation to exactly the given form \( \frac{dy}{dx} = -\frac{x}{2(3y^2 - 2y - 1)} \), with no subsequent errors.",
                    "evaluation",
                    [
                        r"obtains \( \frac{dy}{dx} = -\frac{x}{3y^2 - 2y - 1} \) (missing the factor 2)",
                        r"writes \( \frac{dy}{dx} = \frac{x}{2(3y^2 - 2y - 1)} \) (sign error)",
                        r"makes an algebraic error while solving"
                    ],
                    r"\frac{dy}{dx} = -\frac{x}{2(3y^2 - 2y - 1)}",
                    r"\frac{dy}{dx} = -\frac{x}{3y^2 - 2y - 1}"),
            ]),
        part(q6a, "(b)",
            r"There is a point P on the curve G near \( (2, -1) \) with x-coordinate 1.6. Use the line tangent to the curve at \( (2, -1) \) to approximate the y-coordinate of point P.",
            [
                pt(q6a, "b", 1,
                    r"Evaluates the slope of the tangent line: \( \frac{dy}{dx}\bigg|_{(2,-1)} = -\frac{2}{2(3 + 2 - 1)} = -\frac{1}{4} \), or presents the linear approximation using a slope of \( -\frac{1}{4} \).",
                    "evaluation",
                    [
                        r"computes the slope as \( -\frac{1}{3} \) or another value not equal to \( -\frac{1}{4} \)",
                        r"evaluates the denominator as \( 3 - 2 + 1 = 2 \) (sign errors in \(-1\))",
                        r"never evaluates the slope numerically"
                    ],
                    r"\frac{dy}{dx}\bigg|_{(2,-1)} = -\frac{2}{2(3\cdot 1 + 2 - 1)} = -\frac{1}{4}",
                    r"slope -\frac{1}{3} or -\frac{1}{2}"),
                pt(q6a, "b", 2,
                    r"Approximates \( y \approx -1 + \left(-\frac{1}{4}\right)(1.6 - 2) = -1 + 0.1 = -0.9 \), clearly using the tangent line at \( x = 1.6 \).",
                    "evaluation",
                    [
                        r"uses the slope \( -\frac{1}{4} \) but computes \( -1 - \frac{1}{4}(1.6 - 2) \) incorrectly",
                        r"uses a slope other than \( -\frac{1}{4} \) that was not declared as the value of the derivative",
                        r"reports the value of y at x = 1.6 without showing the tangent line use"
                    ],
                    r"y \approx -1 - \frac{1}{4}(1.6 - 2) = -0.9",
                    r"y \approx -1 + \frac{1}{4}(1.6 - 2) = -1.1 or an unsupported -0.9"),
            ]),
        part(q6a, "(c)",
            r"For \( x > 0 \) and \( y > 0 \), there is a point S on the curve G at which the line tangent to the curve at that point is vertical. Find the y-coordinate of point S. Show the work that leads to your answer.",
            [
                pt(q6a, "c", 1,
                    r"Sets the denominator of \( \frac{dy}{dx} \) equal to 0: \( 2(3y^2 - 2y - 1) = 0 \), \( 3y^2 - 2y - 1 = 0 \), or the factored form \( (3y + 1)(y - 1) = 0 \).",
                    "justification",
                    [
                        r"sets the numerator of \( \frac{dy}{dx} \) equal to 0 instead",
                        r"sets \( \frac{dy}{dx} \) equal to 0 rather than undefined",
                        r"never sets anything equal to 0 and jumps to the answer"
                    ],
                    r"3y^2 - 2y - 1 = 0 \Rightarrow (3y + 1)(y - 1) = 0",
                    r"-x = 0 solved instead of the denominator"),
                pt(q6a, "c", 2,
                    r"Identifies \( y = 1 \) as the y-coordinate (the solution with \( y > 0 \); \( y = -\frac{1}{3} \) is rejected).",
                    "evaluation",
                    [
                        r"reports both \( y = 1 \) and \( y = -\frac{1}{3} \) without rejecting the negative one",
                        r"reports \( y = -\frac{1}{3} \)",
                        r"reports the x-coordinate of S instead"
                    ],
                    r"Because y > 0, the only solution is y = 1",
                    r"y = -1/3 also included as an answer"),
            ]),
        part(q6a, "(d)",
            r"A particle moves along the curve H defined by the equation \( 2xy + \ln y = 8 \). At the instant when the particle is at the point \( (4, 1) \), \( \frac{dx}{dt} = 3 \). Find \( \frac{dy}{dt} \) at that instant. Show the work that leads to your answer.",
            [
                pt(q6a, "d", 1,
                    r"Implicitly differentiates \( 2xy + \ln y = 8 \) with respect to t (product rule on \( 2xy \), derivative of \( \ln y \) carrying \( \frac{dy}{dt} \), right side 0), with at most one error.",
                    "justification",
                    [
                        r"differentiates \( 2xy \) as \( 2\frac{dy}{dt} \) (misses the product rule) or as \( 2y\frac{dx}{dt} \) alone",
                        r"writes \( \frac{d}{dt}\ln y = \frac{1}{y} \) without the \( \frac{dy}{dt} \) factor",
                        r"differentiates with respect to x instead of t"
                    ],
                    r"2y\frac{dx}{dt} + 2x\frac{dy}{dt} + \frac{1}{y}\frac{dy}{dt} = 0",
                    r"2x\frac{dy}{dt} + \frac{1}{y} = 0 (missing terms)"),
                pt(q6a, "d", 2,
                    r"Obtains the correct differentiated equation \( 2y\frac{dx}{dt} + \left(2x + \frac{1}{y}\right)\frac{dy}{dt} = 0 \), or equivalently each of the terms \( 2y\frac{dx}{dt} \), \( 2x\frac{dy}{dt} \), and \( \frac{1}{y}\frac{dy}{dt} \).",
                    "computation",
                    [
                        r"has a sign error in one of the terms",
                        r"writes \( 2xy \) differentiated as \( 2y\frac{dx}{dt} + 2x \) with no \( \frac{dy}{dt} \)",
                        r"drops the \( \frac{1}{y}\frac{dy}{dt} \) term"
                    ],
                    r"2y\frac{dx}{dt} + 2x\frac{dy}{dt} + \frac{1}{y}\frac{dy}{dt} = 0",
                    r"2y\frac{dx}{dt} + 2x\frac{dy}{dt} = 0 (missing \frac{1}{y}\frac{dy}{dt})"),
                pt(q6a, "d", 3,
                    r"Substitutes \( (x, y) = (4, 1) \) and \( \frac{dx}{dt} = 3 \): \( 2(1)(3) + \left(2(4) + 1\right)\frac{dy}{dt} = 0 \), so \( 6 + 9\frac{dy}{dt} = 0 \) and \( \frac{dy}{dt} = -\frac{2}{3} \).",
                    "evaluation",
                    [
                        r"substitutes \( x = 4 \) and \( y = 1 \) in the wrong spots",
                        r"computes \( 2(4) + \frac{1}{1} = 9 \) but then solves \( 6 + 9\frac{dy}{dt} = 0 \) incorrectly",
                        r"reports \( \frac{dy}{dt} = \frac{2}{3} \) (sign error)"
                    ],
                    r"2(1)(3) + \left(2(4) + \frac{1}{1}\right)\frac{dy}{dt} = 0 \Rightarrow \frac{dy}{dt} = -\frac{2}{3}",
                    r"\frac{dy}{dt} = -\frac{3}{2} or +\frac{2}{3}"),
            ]),
    ],
    r"(a) Differentiating \( y^3 - y^2 - y + \frac{1}{4}x^2 = 0 \): \( (3y^2 - 2y - 1)\frac{dy}{dx} = -\frac{x}{2} \), so \( \frac{dy}{dx} = -\frac{x}{2(3y^2 - 2y - 1)} \). (b) At \( (2, -1) \), \( \frac{dy}{dx} = -\frac{2}{2(3 + 2 - 1)} = -\frac{1}{4} \), so \( y \approx -1 - \frac{1}{4}(1.6 - 2) = -0.9 \). (c) The tangent is vertical when \( 3y^2 - 2y - 1 = 0 \), i.e. \( (3y + 1)(y - 1) = 0 \). With \( y > 0 \), the y-coordinate is \( y = 1 \). (d) Differentiating \( 2xy + \ln y = 8 \) with respect to t: \( 2y\frac{dx}{dt} + 2x\frac{dy}{dt} + \frac{1}{y}\frac{dy}{dt} = 0 \). At \( (4, 1) \) with \( \frac{dx}{dt} = 3 \): \( 6 + 9\frac{dy}{dt} = 0 \), so \( \frac{dy}{dt} = -\frac{2}{3} \)."
)

NEW = [q1, q2, q3, q4, q5, q6]

# ---------- validation ----------

def unroll(frq):
    fields = [frq['prompt'], frq['sampleResponse']]
    for p in frq['parts']:
        fields.append(p['text'])
        for rp in p['rubricPoints']:
            fields.append(rp['criterion'])
    return fields

def check_balanced(frq):
    import re
    issues = []
    for f in unroll(frq):
        opens = f.count(r'\(')
        closes = f.count(r'\)')
        if opens != closes:
            issues.append('unbalanced delimiters (%d open, %d close) in: %r' % (opens, closes, f[:80]))
        # no bare backslash-LaTeX outside \( \) in display fields
        outside = re.sub(r'\\\(.*?\\\)', '', f, flags=re.S)
        outside = re.sub(r'\\n', '', outside)
        if '\\' in outside:
            issues.append('bare LaTeX outside delimiters in: %r' % outside[:100])
    return issues

all_issues = []
for frq in NEW:
    if len(frq['parts']) not in (4,):
        all_issues.append('%s: expected 4 parts' % frq['id'])
    n = sum(len(p['rubricPoints']) for p in frq['parts'])
    if n != 9:
        all_issues.append('%s: expected 9 rubric points, got %d' % (frq['id'], n))
    for p in frq['parts']:
        ids = [rp['id'] for rp in p['rubricPoints']]
        if len(set(ids)) != len(ids):
            all_issues.append('%s: duplicate rubric ids in %s' % (frq['id'], p['label']))
    all_issues += check_balanced(frq)

for i in all_issues:
    print('ISSUE:', i)
if all_issues:
    sys.exit(1)

print('validated', len(NEW), 'FRQs, 9 points each, delimiters balanced, no bare math')

# ---------- splice ----------

text = io.open(FRQS_JSON, encoding='utf-8').read()
assert text.rstrip().endswith(']'), 'frqs.json does not end with the array close'
json_texts = []
for frq in NEW:
    s = json.dumps(frq, indent=2, ensure_ascii=False)
    json_texts.append(s)
block = ',\n'.join(json_texts)
block = '\n'.join(('  ' + line) if line else '' for line in block.split('\n'))
prefix = text[:text.rfind(']')].rstrip()
assert prefix.rstrip().endswith('}'), 'last array element does not close with }'
new_text = prefix + ',\n' + block + '\n]'

parsed = json.loads(new_text)
years = sorted(set(d['year'] for d in parsed))
print('spliced:', len(parsed), 'FRQs, years', years)
io.open(FRQS_JSON, 'w', encoding='utf-8', newline='').write(new_text)
print('wrote', FRQS_JSON)