import json
import re
import sys

PATH = r"C:\devbushi\korah-internship\korah-bot\ap\data\ap-calculus-ab\frqs.json"

# old parsed value -> new parsed value, single-backslash LaTeX (escaped by json.dumps on write).
# Applies only to display-scoped keys (prompt / text / criterion / sampleResponse) in the 2026 block.
MAPPING = {
    # ── Q1 ────────────────────────────────────────────────────────────────────
    r"Approximate M'(7.5) using the average rate of change of M over the interval 5 \le t \le 10. Show the work that leads to your answer, and indicate units of measure.":
        r"Approximate \( M'(7.5) \) using the average rate of change of M over the interval \( 5 \le t \le 10 \). Show the work that leads to your answer, and indicate units of measure.",

    r"Computes the average rate of change M'(7.5) \approx (M(10) - M(5))/(10 - 5) = (16 - 7)/5 = 9/5 = 1.8, with supporting work showing both a difference and a quotient.":
        r"Computes the average rate of change \( M'(7.5) \approx (M(10) - M(5))/(10 - 5) = (16 - 7)/5 = 9/5 = 1.8 \), with supporting work showing both a difference and a quotient.",

    r"""Reports correct units: "birds per day per day" (equivalently birds/day^2).""":
        r"""Reports correct units: "birds per day per day" (equivalently \( birds/day^2 \)).""",

    r"Use a midpoint Riemann sum with the three subintervals [0, 10], [10, 20], and [20, 30] to approximate \int_0^{30} M(t)\,dt. Show the work that leads to your answer.":
        r"Use a midpoint Riemann sum with the three subintervals [0, 10], [10, 20], and [20, 30] to approximate \( \int_0^{30} M(t)\,dt \). Show the work that leads to your answer.",

    r"Presents the form of a midpoint Riemann sum: 7(10) + 6(10) + 2(10), i.e. M(5).(10-0) + M(15).(20-10) + M(25).(30-20), with at least five of the six factors correct.":
        r"Presents the form of a midpoint Riemann sum: \( 7(10) + 6(10) + 2(10) \), i.e. \( M(5)(10-0) + M(15)(20-10) + M(25)(30-20) \), with at least five of the six factors correct.",

    r"Evaluates the sum to 150 with supporting work (70 + 60 + 20).":
        r"Evaluates the sum to 150 with supporting work \( (70 + 60 + 20) \).",

    r"Interpret the meaning of \int_0^{30} M(t)\,dt in the context of the problem.":
        r"Interpret the meaning of \( \int_0^{30} M(t)\,dt \) in the context of the problem.",

    r"States that the integral represents the number of male birds of this species that arrive at the nesting area from t = 0 days to t = 30 days.":
        r"States that the integral represents the number of male birds of this species that arrive at the nesting area from \( t = 0 \) days to \( t = 30 \) days.",

    r"The rate at which female birds of the same species arrive at the same nesting area, in birds per day, is modeled by the function F defined as follows: F(t) = 0 for 0 \le t < 15; F(t) = 18 + 16\sin\left(\frac{\pi}{20}(t+15)\right) for 15 \le t \le 45. How many female birds of this species arrive at the nesting area from t = 15 to t = 45? Show the setup for your calculations, and round your answer to the nearest integer.":
        r"The rate at which female birds of the same species arrive at the same nesting area, in birds per day, is modeled by the function F defined as follows: \( F(t) = 0 \) for \( 0 \le t < 15 \); \( F(t) = 18 + 16\sin\left(\frac{\pi}{20}(t+15)\right) \) for \( 15 \le t \le 45 \). How many female birds of this species arrive at the nesting area from \( t = 15 \) to \( t = 45 \)? Show the setup for your calculations, and round your answer to the nearest integer.",

    r"Sets up the definite integral \int_{15}^{45} F(t)\,dt (with or without the differential dt).":
        r"Sets up the definite integral \( \int_{15}^{45} F(t)\,dt \) (with or without the differential dt).",

    r"On the interval 15 < t < 30, the difference in the rates at which male and female birds of this species arrive at the nesting area can be modeled by the differentiable function D(t) = M(t) - F(t), where F is the function defined in part (c). Is there a time t in the interval 15 < t < 20 when D(t) = 0? Justify your answer.":
        r"On the interval \( 15 < t < 30 \), the difference in the rates at which male and female birds of this species arrive at the nesting area can be modeled by the differentiable function \( D(t) = M(t) - F(t) \), where F is the function defined in part (c). Is there a time \( t \) in the interval \( 15 < t < 20 \) when \( D(t) = 0 \)? Justify your answer.",

    r"Applies the Intermediate Value Theorem: D(15) = 4 > 0 and D(20) = -1.686292 < 0, so there is a t in (15, 20) with D(t) = 0.":
        r"Applies the Intermediate Value Theorem: \( D(15) = 4 > 0 \) and \( D(20) = -1.686292 < 0 \), so there is a \( t \) in \( (15, 20) \) with \( D(t) = 0 \).",

    r"(a) M'(7.5) \approx \frac{M(10)-M(5)}{10-5} = \frac{16-7}{5} = \frac{9}{5} = 1.8 birds per day per day. (b) i. \int_0^{30} M(t)\,dt \approx M(5)(10-0) + M(15)(20-10) + M(25)(30-20) = 7(10) + 6(10) + 2(10) = 150. ii. The integral gives the total number of male birds that arrive at the nesting area from t = 0 to t = 30 days. (c) \int_{15}^{45} F(t)\,dt = \int_{15}^{45}\left(18 + 16\sin\left(\frac{\pi}{20}(t+15)\right)\right)\,dt = 641.859164, so to the nearest integer the number of female birds is 642. (d) Since D is differentiable, D is continuous; D(15) = M(15) - F(15) = 6 - 2 = 4 > 0 and D(20) = M(20) - F(20) = 5 - 6.686292 = -1.686292 < 0, so by the Intermediate Value Theorem there is a time t with 15 < t < 20 and D(t) = 0.":
        r"(a) \( M'(7.5) \approx \frac{M(10)-M(5)}{10-5} = \frac{16-7}{5} = \frac{9}{5} = 1.8 \) birds per day per day. (b) i. \( \int_0^{30} M(t)\,dt \approx M(5)(10-0) + M(15)(20-10) + M(25)(30-20) = 7(10) + 6(10) + 2(10) = 150 \). ii. The integral gives the total number of male birds that arrive at the nesting area from \( t = 0 \) to \( t = 30 \) days. (c) \( \int_{15}^{45} F(t)\,dt = \int_{15}^{45}\left(18 + 16\sin\left(\frac{\pi}{20}(t+15)\right)\right)\,dt = 641.859164 \), so to the nearest integer the number of female birds is 642. (d) Since D is differentiable, D is continuous; \( D(15) = M(15) - F(15) = 6 - 2 = 4 > 0 \) and \( D(20) = M(20) - F(20) = 5 - 6.686292 = -1.686292 < 0 \), so by the Intermediate Value Theorem there is a time \( t \) with \( 15 < t < 20 \) and \( D(t) = 0 \).",

    # ── Q2 ────────────────────────────────────────────────────────────────────
    r"The function f is defined by f(x) = 1.43^x + 0.57, and the function g is defined by g(x) = \frac{14x+12}{x+12}. The graphs of f and g intersect at the points (1, 2) and (a, b), as shown in Figure 1. For x \ge 0, the equation y = g(x) can be rewritten as x = \frac{12y-12}{14-y} = h(y), where h is a function of y. The graph of x = h(y) and the horizontal line y = 3.5 are shown in Figure 2.":
        r"The function f is defined by \( f(x) = 1.43^x + 0.57 \), and the function g is defined by \( g(x) = \frac{14x+12}{x+12} \). The graphs of f and g intersect at the points (1, 2) and (a, b), as shown in Figure 1. For \( x \ge 0 \), the equation \( y = g(x) \) can be rewritten as \( x = \frac{12y-12}{14-y} = h(y) \), where h is a function of y. The graph of \( x = h(y) \) and the horizontal line \( y = 3.5 \) are shown in Figure 2.",

    r"Let R be the region bounded by the graph of g, the x-axis, the y-axis, and the vertical line x = 1, as shown in Figure 1. Find the area of region R. Show the setup for your calculations.":
        r"Let R be the region bounded by the graph of g, the x-axis, the y-axis, and the vertical line \( x = 1 \), as shown in Figure 1. Find the area of region R. Show the setup for your calculations.",

    r"Sets up the area of R as \int_0^1 g(x)\,dx (or \int_0^1 \frac{14x+12}{x+12}\,dx), with or without the differential dx.":
        r"Sets up the area of R as \( \int_0^1 g(x)\,dx \) (or \( \int_0^1 \frac{14x+12}{x+12}\,dx \)), with or without the differential dx.",

    r"Region R, described in part (a), is the base of a solid. For this solid, each cross section perpendicular to the x-axis is a rectangle whose height is \frac{1}{3} times the length of its base in region R. Write, but do not evaluate, an integral expression that gives the volume of the solid.":
        r"Region R, described in part (a), is the base of a solid. For this solid, each cross section perpendicular to the x-axis is a rectangle whose height is \( \frac{1}{3} \) times the length of its base in region R. Write, but do not evaluate, an integral expression that gives the volume of the solid.",

    r"Presents an integrand of the form k(g(x))^2 in a definite or indefinite integral, where k is any nonzero constant (e.g. \frac{1}{3}(g(x))^2).":
        r"Presents an integrand of the form \( k(g(x))^2 \) in a definite or indefinite integral, where k is any nonzero constant (e.g. \( \frac{1}{3}(g(x))^2 \)).",

    r"Writes the correct definite integral \frac{1}{3}\int_0^1 (g(x))^2\,dx (with or without the differential dx).":
        r"Writes the correct definite integral \( \frac{1}{3}\int_0^1 (g(x))^2\,dx \) (with or without the differential dx).",

    r"The shaded region in Figure 1 is bounded by the graphs of f and g on the interval from x = 0 to x = a. Find the area of the shaded region. Show the setup for your calculations.":
        r"The shaded region in Figure 1 is bounded by the graphs of f and g on the interval from \( x = 0 \) to \( x = a \). Find the area of the shaded region. Show the setup for your calculations.",

    r"Presents an integrand of f(x) - g(x) (or g(x) - f(x)) in a definite integral, with or without the differential dx.":
        r"Presents an integrand of \( f(x) - g(x) \) (or \( g(x) - f(x) \)) in a definite integral, with or without the differential dx.",

    r"Writes the correct definite integral with limits x = 0 to x = a (a reported value must be 3, 3.2, 3.3, 3.25, 3.26, 3.255, or 3.256 to be eligible), or an equivalent sum such as \int_0^1 (f(x)-g(x))\,dx + \int_1^a (g(x)-f(x))\,dx.":
        r"Writes the correct definite integral with limits \( x = 0 \) to \( x = a \) (a reported value must be 3, 3.2, 3.3, 3.25, 3.26, 3.255, or 3.256 to be eligible), or an equivalent sum such as \( \int_0^1 (f(x)-g(x))\,dx + \int_1^a (g(x)-f(x))\,dx \).",

    r"Let T be the region bounded by the graph of x = h(y), the y-axis, and the horizontal line y = 3.5, as shown in Figure 2. Write, but do not evaluate, an integral expression that gives the volume of the solid generated when region T is revolved about the y-axis.":
        r"Let T be the region bounded by the graph of \( x = h(y) \), the y-axis, and the horizontal line \( y = 3.5 \), as shown in Figure 2. Write, but do not evaluate, an integral expression that gives the volume of the solid generated when region T is revolved about the y-axis.",

    r"Presents an integrand of the form k(h(y))^2 in a definite or indefinite integral, where k is any nonzero constant (e.g. \pi(h(y))^2 or \pi\left(\frac{12y-12}{14-y}\right)^2).":
        r"Presents an integrand of the form \( k(h(y))^2 \) in a definite or indefinite integral, where k is any nonzero constant (e.g. \( \pi(h(y))^2 \) or \( \pi\left(\frac{12y-12}{14-y}\right)^2 \)).",

    r"Writes the correct definite integral \pi\int_1^{3.5} (h(y))^2\,dy, including the constant \pi, limits y = 1 to y = 3.5, and the differential dy.":
        r"Writes the correct definite integral \( \pi\int_1^{3.5} (h(y))^2\,dy \), including the constant \( \pi \), limits \( y = 1 \) to \( y = 3.5 \), and the differential dy.",

    r"(a) Area = \int_0^1 g(x)\,dx = \int_0^1 \frac{14x+12}{x+12}\,dx = [14x - 156\ln(x+12)]_0^1 = 1.513338, so the area of R is 1.513. (b) Volume = \frac{1}{3}\int_0^1 (g(x))^2\,dx. (c) At the intersections f(x) = g(x) gives x = 1 and x = 3.255817 = a. The area is \int_0^1 (f(x)-g(x))\,dx + \int_1^a (g(x)-f(x))\,dx = 0.631784, so the area of the shaded region is 0.632. (d) Volume = \pi\int_1^{3.5} (h(y))^2\,dy.":
        r"(a) Area = \( \int_0^1 g(x)\,dx = \int_0^1 \frac{14x+12}{x+12}\,dx = [14x - 156\ln(x+12)]_0^1 = 1.513338 \), so the area of R is 1.513. (b) Volume = \( \frac{1}{3}\int_0^1 (g(x))^2\,dx \). (c) At the intersections \( f(x) = g(x) \) gives \( x = 1 \) and \( x = 3.255817 = a \). The area is \( \int_0^1 (f(x)-g(x))\,dx + \int_1^a (g(x)-f(x))\,dx = 0.631784 \), so the area of the shaded region is 0.632. (d) Volume = \( \pi\int_1^{3.5} (h(y))^2\,dy \).",

    # ── Q3 ────────────────────────────────────────────────────────────────────
    r"A pie is taken from a hot oven and put on a table. The internal temperature of the pie at time t minutes can be modeled by the function H that satisfies the differential equation \frac{dH}{dt} = -\frac{1}{15}(H - 20), where H(t) is measured in degrees Celsius and H(0) = 75. For t > 0, it is known that 20 < H(t) < 75.":
        r"A pie is taken from a hot oven and put on a table. The internal temperature of the pie at time \( t \) minutes can be modeled by the function H that satisfies the differential equation \( \frac{dH}{dt} = -\frac{1}{15}(H - 20) \), where \( H(t) \) is measured in degrees Celsius and \( H(0) = 75 \). For \( t > 0 \), it is known that \( 20 < H(t) < 75 \).",

    r"Explain why the slope field shown could not be a slope field for the differential equation \frac{dH}{dt} = -\frac{1}{15}(H - 20).":
        r"Explain why the slope field shown could not be a slope field for the differential equation \( \frac{dH}{dt} = -\frac{1}{15}(H - 20) \).",

    r"Explains that every segment in the shown slope field has a positive slope, while the differential equation gives \frac{dH}{dt} < 0 on 20 < H < 75 (so all true slopes are negative).":
        r"Explains that every segment in the shown slope field has a positive slope, while the differential equation gives \( \frac{dH}{dt} < 0 \) on \( 20 < H < 75 \) (so all true slopes are negative).",

    r"Find the slope of the line tangent to the graph of H at time t = 0. Show the work that leads to your answer.":
        r"Find the slope of the line tangent to the graph of H at time \( t = 0 \). Show the work that leads to your answer.",

    r"Computes \frac{dH}{dt}\bigg|_{(0,75)} = -\frac{1}{15}(75-20) = -\frac{11}{3}.":
        r"Computes \( \frac{dH}{dt}\bigg|_{(0,75)} = -\frac{1}{15}(75-20) = -\frac{11}{3} \).",

    r"It can be shown that \frac{d^2H}{dt^2} = \frac{1}{225}(H - 20). The line tangent to the graph of H at time t = 0 is used to approximate H(5), the internal temperature of the pie at time t = 5. Is this approximation an overestimate or an underestimate for the actual value of H(5)? Give a reason for your answer.":
        r"It can be shown that \( \frac{d^2H}{dt^2} = \frac{1}{225}(H - 20) \). The line tangent to the graph of H at time \( t = 0 \) is used to approximate \( H(5) \), the internal temperature of the pie at time \( t = 5 \). Is this approximation an overestimate or an underestimate for the actual value of \( H(5) \)? Give a reason for your answer.",

    r"Considers the sign of \frac{d^2H}{dt^2} (symbolically or in words): since 20 < H < 75 for t > 0, \frac{d^2H}{dt^2} > 0.":
        r"Considers the sign of \( \frac{d^2H}{dt^2} \) (symbolically or in words): since \( 20 < H < 75 \) for \( t > 0 \), \( \frac{d^2H}{dt^2} > 0 \).",

    r"Concludes the approximation is an underestimate because the graph of H is concave up so the tangent line lies below the graph.":
        r"Concludes the approximation is an underestimate because the graph of H is concave up so the tangent line lies below the graph.",

    r"Use separation of variables to find an expression for H(t), the particular solution to the given differential equation with initial condition H(0) = 75.":
        r"Use separation of variables to find an expression for \( H(t) \), the particular solution to the given differential equation with initial condition \( H(0) = 75 \).",

    r"Separates the variables into an equation of the form \frac{dH}{H-20} = -\frac{1}{15}\,dt (constants nonzero).":
        r"Separates the variables into an equation of the form \( \frac{dH}{H-20} = -\frac{1}{15}\,dt \) (constants nonzero).",

    r"Finds one consistent antiderivative of the form \ln|H - 20| or -\frac{t}{15} (with or without absolute value).":
        r"Finds one consistent antiderivative of the form \( \ln|H - 20| \) or \( -\frac{t}{15} \) (with or without absolute value).",

    r"Finds two consistent antiderivatives (\ln|H-20| and the t-side antiderivative).":
        r"Finds two consistent antiderivatives ( \( \ln|H-20| \) and the t-side antiderivative).",

    r"Includes the constant of integration and uses the initial condition: \ln(75-20) = 0 + C, so C = \ln 55.":
        r"Includes the constant of integration and uses the initial condition: \( \ln(75-20) = 0 + C \), so \( C = \ln 55 \).",

    r"Solves for H(t) correctly: H(t) = 20 + 55e^{-t/15} (or equivalent).":
        r"Solves for \( H(t) \) correctly: \( H(t) = 20 + 55e^{-t/15} \) (or equivalent).",

    r"(a) For the slope field shown all segment slopes are positive, but \frac{dH}{dt} = -\frac{1}{15}(H-20) < 0 for 20 < H < 75, so the shown field cannot be a slope field for this equation. (b) \frac{dH}{dt}\bigg|_{(0,75)} = -\frac{1}{15}(75-20) = -\frac{55}{15} = -\frac{11}{3}. (c) Since 20 < H < 75, \frac{d^2H}{dt^2} = \frac{H-20}{225} > 0, so H is concave up and the tangent line lies below the graph; therefore the approximation is an underestimate for H(5). (d) Separating variables: \frac{dH}{H-20} = -\frac{1}{15}\,dt, so \ln|H-20| = -\frac{t}{15} + C. Using H(0) = 75 gives C = \ln 55, hence H(t) = 20 + 55e^{-t/15}.":
        r"(a) For the slope field shown all segment slopes are positive, but \( \frac{dH}{dt} = -\frac{1}{15}(H-20) < 0 \) for \( 20 < H < 75 \), so the shown field cannot be a slope field for this equation. (b) \( \frac{dH}{dt}\bigg|_{(0,75)} = -\frac{1}{15}(75-20) = -\frac{55}{15} = -\frac{11}{3} \). (c) Since \( 20 < H < 75 \), \( \frac{d^2H}{dt^2} = \frac{H-20}{225} > 0 \), so H is concave up and the tangent line lies below the graph; therefore the approximation is an underestimate for \( H(5) \). (d) Separating variables: \( \frac{dH}{H-20} = -\frac{1}{15}\,dt \), so \( \ln|H-20| = -\frac{t}{15} + C \). Using \( H(0) = 75 \) gives \( C = \ln 55 \), hence \( H(t) = 20 + 55e^{-t/15} \).",

    # ── Q4 ────────────────────────────────────────────────────────────────────
    r"Let f be a twice-differentiable function on the closed interval [-4, 4] with f(2) = 3. The graph of f', the derivative of f, is shown.":
        r"Let f be a twice-differentiable function on the closed interval \( [-4, 4] \) with \( f(2) = 3 \). The graph of \( f' \), the derivative of f, is shown.",

    r"For x > 0, the function g is defined by g(x) = f(x) - \ln x. Find g'(2). Show the work that leads to your answer.":
        r"For \( x > 0 \), the function g is defined by \( g(x) = f(x) - \ln x \). Find \( g'(2) \). Show the work that leads to your answer.",

    r"Sets up the derivative g'(x) = f'(x) - \frac{1}{x} (or evaluates g'(2) = f'(2) - \frac{1}{2}).":
        r"Sets up the derivative \( g'(x) = f'(x) - \frac{1}{x} \) (or evaluates \( g'(2) = f'(2) - \frac{1}{2} \)).",

    r"Evaluates g'(2) = 1.5 - \frac{1}{2} = 1.":
        r"Evaluates \( g'(2) = 1.5 - \frac{1}{2} = 1 \).",

    r"Find all values of x on the open interval 0 < x < 3 at which the graph of f has a point of inflection. Give a reason for your answer.":
        r"Find all values of x on the open interval \( 0 < x < 3 \) at which the graph of f has a point of inflection. Give a reason for your answer.",

    r"Answers x = 1 (with no other values declared in 0 < x < 3).":
        r"Answers \( x = 1 \) (with no other values declared in \( 0 < x < 3 \)).",

    r"Gives a reason tied to the graph of f': f' changes from increasing to decreasing (or f' attains a relative maximum / the slope of f' changes sign) at x = 1.":
        r"Gives a reason tied to the graph of \( f' \): \( f' \) changes from increasing to decreasing (or \( f' \) attains a relative maximum / the slope of \( f' \) changes sign) at \( x = 1 \).",

    r"For -4 \le x \le 4, on what open intervals, if any, is the graph of f both increasing and concave down? Give a reason for your answer.":
        r"For \( -4 \le x \le 4 \), on what open intervals, if any, is the graph of f both increasing and concave down? Give a reason for your answer.",

    r"Answers 1 < x < 3 (this interval, with or without endpoints included).":
        r"Answers \( 1 < x < 3 \) (this interval, with or without endpoints included).",

    r"Gives a reason that refers to f' and cites both f'(x) > 0 and f' decreasing on the interval.":
        r"Gives a reason that refers to \( f' \) and cites both \( f'(x) > 0 \) and \( f' \) decreasing on the interval.",

    r"For -4 \le x \le 4, find the value of x at which f has an absolute minimum and the value of x at which f has an absolute maximum. Give reasons for your answers.":
        r"For \( -4 \le x \le 4 \), find the value of x at which f has an absolute minimum and the value of x at which f has an absolute maximum. Give reasons for your answers.",

    r"""Considers f'(x) = 0 (e.g. by examining the graph or saying "critical points"), regardless of whether both roots are found.""":
        r"""Considers \( f'(x) = 0 \) (e.g. by examining the graph or saying "critical points"), regardless of whether both roots are found.""",

    r"Declares the absolute minimum at x = -2 with a correct justification (f' changes from negative to positive, or a sign analysis of f').":
        r"Declares the absolute minimum at \( x = -2 \) with a correct justification (\( f' \) changes from negative to positive, or a sign analysis of \( f' \)).",

    r"Declares the absolute maximum at x = 4 with a correct justification (f(4) > f(-4), since the net area under f' above the x-axis from -4 to 4 is positive).":
        r"Declares the absolute maximum at \( x = 4 \) with a correct justification (\( f(4) > f(-4) \), since the net area under \( f' \) above the x-axis from \( -4 \) to \( 4 \) is positive).",

    r"(a) g'(x) = f'(x) - \frac{1}{x}, so g'(2) = f'(2) - \frac{1}{2} = \frac{3}{2} - \frac{1}{2} = 1. (b) The graph of f has a point of inflection at x = 1 because f' changes from increasing to decreasing there. (c) f is increasing and concave down on 1 < x < 3 because f'(x) > 0 and f' is decreasing on that interval. (d) f'(x) = 0 at x = -2 and x = 3. Since f' < 0 to the left of -2 and f' > 0 to the right, f has an absolute minimum at x = -2. On [-4, 4], f increases after x = -2, and f(4) - f(-4) = \int_{-4}^4 f'(x)\,dx > 0 (area above the axis exceeds area below), so f has an absolute maximum at x = 4.":
        r"(a) \( g'(x) = f'(x) - \frac{1}{x} \), so \( g'(2) = f'(2) - \frac{1}{2} = \frac{3}{2} - \frac{1}{2} = 1 \). (b) The graph of f has a point of inflection at \( x = 1 \) because \( f' \) changes from increasing to decreasing there. (c) f is increasing and concave down on \( 1 < x < 3 \) because \( f'(x) > 0 \) and \( f' \) is decreasing on that interval. (d) \( f'(x) = 0 \) at \( x = -2 \) and \( x = 3 \). Since \( f' < 0 \) to the left of \( -2 \) and \( f' > 0 \) to the right, f has an absolute minimum at \( x = -2 \). On \( [-4, 4] \), f increases after \( x = -2 \), and \( f(4) - f(-4) = \int_{-4}^4 f'(x)\,dx > 0 \) (area above the axis exceeds area below), so f has an absolute maximum at \( x = 4 \).",

    # ── Q5 ────────────────────────────────────────────────────────────────────
    r"A remote-controlled toy car moves back and forth along a straight path so that its velocity at time t is given by the function v, where v(t) is measured in feet per second and t is measured in seconds. v(t) = t^4 - 8t^3 + 16t^2 for 0 \le t \le 4; v(t) = 0 for 4 < t < 6; v(t) = 10\cos\left(\frac{\pi t}{3}\right) - 10 for 6 \le t \le 12. The graph of v(t) is shown.":
        r"A remote-controlled toy car moves back and forth along a straight path so that its velocity at time t is given by the function v, where \( v(t) \) is measured in feet per second and \( t \) is measured in seconds. \( v(t) = t^4 - 8t^3 + 16t^2 \) for \( 0 \le t \le 4 \); \( v(t) = 0 \) for \( 4 < t < 6 \); \( v(t) = 10\cos\left(\frac{\pi t}{3}\right) - 10 \) for \( 6 \le t \le 12 \). The graph of \( v(t) \) is shown.",

    r"Find the acceleration of the car at time t = 1 second. Show the work that leads to your answer.":
        r"Find the acceleration of the car at time \( t = 1 \) second. Show the work that leads to your answer.",

    r"Considers v'(t): a(t) = v'(t) = 4t^3 - 24t^2 + 32t (or considers v'(1) directly).":
        r"Considers \( v'(t) \): \( a(t) = v'(t) = 4t^3 - 24t^2 + 32t \) (or considers \( v'(1) \) directly).",

    r"Evaluates v'(1) = 4 - 24 + 32 = 12 (ft/s^2).":
        r"Evaluates \( v'(1) = 4 - 24 + 32 = 12 \) (\( ft/s^2 \)).",

    r"Is the car speeding up or slowing down at time t = 1 second? Give a reason for your answer.":
        r"Is the car speeding up or slowing down at time \( t = 1 \) second? Give a reason for your answer.",

    r"Concludes the car is speeding up because v(1) > 0 and v'(1) > 0 (same sign), or because the velocity graph is positive and increasing at t = 1.":
        r"Concludes the car is speeding up because \( v(1) > 0 \) and \( v'(1) > 0 \) (same sign), or because the velocity graph is positive and increasing at \( t = 1 \).",

    r"Find the distance, in feet, that the car traveled over the time interval 0 \le t \le 4 seconds. Show the work that leads to your answer.":
        r"Find the distance, in feet, that the car traveled over the time interval \( 0 \le t \le 4 \) seconds. Show the work that leads to your answer.",

    r"Sets up the definite integral \int_0^4 v(t)\,dt (or \int_0^4 (t^4 - 8t^3 + 16t^2)\,dt), with or without dt.":
        r"Sets up the definite integral \( \int_0^4 v(t)\,dt \) (or \( \int_0^4 (t^4 - 8t^3 + 16t^2)\,dt \)), with or without dt.",

    r"Finds the correct antiderivative \frac{t^5}{5} - 2t^4 + \frac{16t^3}{3}.":
        r"Finds the correct antiderivative \( \frac{t^5}{5} - 2t^4 + \frac{16t^3}{3} \).",

    r"Evaluates the definite integral to \frac{512}{15} feet.":
        r"Evaluates the definite integral to \( \frac{512}{15} \) feet.",

    r"Find the average velocity of the car over the time interval 6 \le t \le 12 seconds. Show the work that leads to your answer.":
        r"Find the average velocity of the car over the time interval \( 6 \le t \le 12 \) seconds. Show the work that leads to your answer.",

    r"Sets up the average value formula \frac{1}{12-6}\int_6^{12} v(t)\,dt (or \frac{1}{6}\int_6^{12} (10\cos(\pi t/3) - 10)\,dt), with evidence of division by 6.":
        r"Sets up the average value formula \( \frac{1}{12-6}\int_6^{12} v(t)\,dt \) (or \( \frac{1}{6}\int_6^{12} (10\cos(\pi t/3) - 10)\,dt \)), with evidence of division by 6.",

    r"Finds an antiderivative of the form 10\cdot\frac{3}{\pi}\sin\left(\frac{\pi t}{3}\right) - 10t (including the 1/6 factor where combined).":
        r"Finds an antiderivative of the form \( 10\cdot\frac{3}{\pi}\sin\left(\frac{\pi t}{3}\right) - 10t \) (including the \( 1/6 \) factor where combined).",

    r"Evaluates the average velocity as -10 feet per second.":
        r"Evaluates the average velocity as -10 feet per second.",

    r"(a) a(t) = v'(t) = 4t^3 - 24t^2 + 32t, so a(1) = 4 - 24 + 32 = 12 ft/s^2. (b) v(1) = 1 - 8 + 16 = 9 > 0 and v'(1) = 12 > 0; since velocity and acceleration have the same sign, the car is speeding up at t = 1. (c) Distance = \int_0^4 (t^4 - 8t^3 + 16t^2)\,dt = \left[\frac{t^5}{5} - 2t^4 + \frac{16t^3}{3}\right]_0^4 = \frac{512}{15} feet. (d) Average velocity = \frac{1}{6}\int_6^{12} (10\cos(\pi t/3) - 10)\,dt = \frac{1}{6}\left[\frac{30}{\pi}\sin(\pi t/3) - 10t\right]_6^{12} = \frac{1}{6}(-60) = -10 ft/s.":
        r"(a) \( a(t) = v'(t) = 4t^3 - 24t^2 + 32t \), so \( a(1) = 4 - 24 + 32 = 12 \) \( ft/s^2 \). (b) \( v(1) = 1 - 8 + 16 = 9 > 0 \) and \( v'(1) = 12 > 0 \); since velocity and acceleration have the same sign, the car is speeding up at \( t = 1 \). (c) Distance = \( \int_0^4 (t^4 - 8t^3 + 16t^2)\,dt = \left[\frac{t^5}{5} - 2t^4 + \frac{16t^3}{3}\right]_0^4 = \frac{512}{15} \) feet. (d) Average velocity = \( \frac{1}{6}\int_6^{12} (10\cos(\pi t/3) - 10)\,dt = \frac{1}{6}\left[\frac{30}{\pi}\sin(\pi t/3) - 10t\right]_6^{12} = \frac{1}{6}(-60) = -10 \) \( ft/s \).",

    # ── Q6 ────────────────────────────────────────────────────────────────────
    r"The function f is twice differentiable. The table gives values of f and its derivative f' at selected values of x.":
        r"The function f is twice differentiable. The table gives values of f and its derivative \( f' \) at selected values of x.",

    r"Find \lim_{x \to 2} f(x), or state that the limit does not exist.":
        r"Find \( \lim_{x \to 2} f(x) \), or state that the limit does not exist.",

    r"Resolves the limit and answers 3 (lim_{x \to 2} f(x) = f(2) = 3, since f is continuous).":
        r"Resolves the limit and answers 3 ( \( \lim_{x \to 2} f(x) = f(2) = 3 \), since f is continuous).",

    r"Let g(x) = f(f(x)). Find g'(2). Show the work that leads to your answer.":
        r"Let \( g(x) = f(f(x)) \). Find \( g'(2) \). Show the work that leads to your answer.",

    r"Applies the chain rule: g'(x) = f'(f(x)) \cdot f'(x) (or g'(2) = f'(f(2)) \cdot f'(2) = f'(3) \cdot f'(2)).":
        r"Applies the chain rule: \( g'(x) = f'(f(x)) \cdot f'(x) \) (or \( g'(2) = f'(f(2)) \cdot f'(2) = f'(3) \cdot f'(2) \)).",

    r"Evaluates g'(2) = f'(3) \cdot f'(2) = 9 \cdot 4 = 36.":
        r"Evaluates \( g'(2) = f'(3) \cdot f'(2) = 9 \cdot 4 = 36 \).",

    r"Let h be a differentiable function such that h(0) = 10 and h'(x) = f'(3x). Find h(2). Show the work that leads to your answer.":
        r"Let h be a differentiable function such that \( h(0) = 10 \) and \( h'(x) = f'(3x) \). Find \( h(2) \). Show the work that leads to your answer.",

    r"Sets up h(2) = h(0) + \int_0^2 h'(x)\,dx = 10 + \int_0^2 f'(3x)\,dx (definite or indefinite integral with integrand h'(x) or f'(3x)).":
        r"Sets up \( h(2) = h(0) + \int_0^2 h'(x)\,dx = 10 + \int_0^2 f'(3x)\,dx \) (definite or indefinite integral with integrand \( h'(x) \) or \( f'(3x) \)).",

    r"Finds the antiderivative in the form k\cdot f(3x) with k = \frac{1}{3} (i.e. \frac{1}{3}f(3x)).":
        r"Finds the antiderivative in the form \( k\cdot f(3x) \) with \( k = \frac{1}{3} \) (i.e. \( \frac{1}{3}f(3x) \)).",

    r"Evaluates h(2) = 10 + \frac{1}{3}(f(6) - f(0)) = 10 + \frac{1}{3}(5 - (-1)) = 10 + 2 = 12.":
        r"Evaluates \( h(2) = 10 + \frac{1}{3}(f(6) - f(0)) = 10 + \frac{1}{3}(5 - (-1)) = 10 + 2 = 12 \).",

    r"Let k be the function defined by k(x) = \int_0^x t^2 f(t)\,dt. Find k'(x).":
        r"Let k be the function defined by \( k(x) = \int_0^x t^2 f(t)\,dt \). Find \( k'(x) \).",

    r"Applies the Fundamental Theorem of Calculus: k'(x) = x^2 f(x).":
        r"Applies the Fundamental Theorem of Calculus: \( k'(x) = x^2 f(x) \).",

    r"Find k''(3). Show the work that leads to your answer.":
        r"Find \( k''(3) \). Show the work that leads to your answer.",

    r"Applies the product rule: k''(x) = 2x f(x) + x^2 f'(x) (or evaluates k''(3) = 2(3)f(3) + 9 f'(3)).":
        r"Applies the product rule: \( k''(x) = 2x f(x) + x^2 f'(x) \) (or evaluates \( k''(3) = 2(3)f(3) + 9 f'(3) \)).",

    r"Evaluates k''(3) = 6 \cdot f(3) + 9 \cdot f'(3) = 6(8) + 9(9) = 48 + 81 = 129.":
        r"Evaluates \( k''(3) = 6 \cdot f(3) + 9 \cdot f'(3) = 6(8) + 9(9) = 48 + 81 = 129 \).",

    r"(a) \lim_{x \to 2} f(x) = f(2) = 3 (f is continuous). (b) g'(x) = f'(f(x))f'(x), so g'(2) = f'(f(2))f'(2) = f'(3)f'(2) = 9 \cdot 4 = 36. (c) h(2) = h(0) + \int_0^2 h'(x)\,dx = 10 + \int_0^2 f'(3x)\,dx = 10 + \left[\frac{1}{3}f(3x)\right]_0^2 = 10 + \frac{1}{3}(f(6) - f(0)) = 10 + \frac{1}{3}(5 - (-1)) = 12. (d) i. k'(x) = x^2 f(x). ii. k''(x) = 2x f(x) + x^2 f'(x), so k''(3) = 6 \cdot f(3) + 9 \cdot f'(3) = 6(8) + 9(9) = 129.":
        r"(a) \( \lim_{x \to 2} f(x) = f(2) = 3 \) (f is continuous). (b) \( g'(x) = f'(f(x))f'(x) \), so \( g'(2) = f'(f(2))f'(2) = f'(3)f'(2) = 9 \cdot 4 = 36 \). (c) \( h(2) = h(0) + \int_0^2 h'(x)\,dx = 10 + \int_0^2 f'(3x)\,dx = 10 + \left[\frac{1}{3}f(3x)\right]_0^2 = 10 + \frac{1}{3}(f(6) - f(0)) = 10 + \frac{1}{3}(5 - (-1)) = 12 \). (d) i. \( k'(x) = x^2 f(x) \). ii. \( k''(x) = 2x f(x) + x^2 f'(x) \), so \( k''(3) = 6 \cdot f(3) + 9 \cdot f'(3) = 6(8) + 9(9) = 129 \).",
}

KEYS = ("prompt", "text", "criterion", "sampleResponse")
LINE_RE = re.compile(r'^(?P<indent>\s*)"(?P<key>prompt|text|criterion|sampleResponse)": (?P<value>".*"),?$')


def main():
    with open(PATH, "r", encoding="utf-8") as f:
        lines = f.readlines()

    tail_start = None
    for i, line in enumerate(lines):
        if '"id": "calc-ab-2026-q1"' in line:
            tail_start = i
            break
    if tail_start is None:
        sys.exit("calc-ab-2026-q1 not found")

    used = set()
    changed = 0
    for i in range(tail_start, len(lines)):
        m = LINE_RE.match(lines[i].rstrip("\n"))
        if not m:
            continue
        raw_val = m.group("value")
        try:
            parsed = json.loads(raw_val)
        except ValueError:
            continue
        if not isinstance(parsed, str) or parsed not in MAPPING:
            continue
        new_parsed = MAPPING[parsed]
        trailing = "," if lines[i].rstrip("\n").endswith(",") else ""
        lines[i] = (
            m.group("indent")
            + '"' + m.group("key") + '": '
            + json.dumps(new_parsed, ensure_ascii=False)
            + trailing + "\n"
        )
        used.add(parsed)
        changed += 1

    missing = set(MAPPING) - used
    if missing:
        sys.exit("transform applied %d changes but %d mapping keys were never matched; first missing:\n%s"
                 % (changed, len(missing), next(iter(missing))[:120] + "..."))

    with open(PATH, "w", encoding="utf-8") as f:
        f.writelines(lines)

    print("applied %d string replacements in the 2026 block" % changed)


if __name__ == "__main__":
    main()