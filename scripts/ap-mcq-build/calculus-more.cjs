// Second batch of AP Calculus AB questions, in the same block format as calculus.cjs.
// build.cjs appends these after the first batch within each unit, so every unit has 25.
const { table } = require('./figures.cjs');
const m = v => String.raw`\(${v}\)`;

const figures = {
  signs: table([m('x'), ...[0, 2, 4, 6].map(m)], [[m('f(x)'), ...[5, -1, 3, -2].map(m)]], 'Table of f(x) at x = 0, 2, 4, 6: 5, −1, 3, −2'),
  concave: table([m('x'), ...[0, 1, 3, 6].map(m)], [[m('f(x)'), ...[2, 5, 9, 12].map(m)]], 'Table of f(x) at x = 0, 1, 3, 6: 2, 5, 9, 12'),
};

const source = String.raw`
@ 1 | n | Limits at infinity
What is \(\displaystyle\lim_{x\to\infty}\dfrac{5x^2-3x}{\sqrt{4x^4+7}}\)?
* \(\dfrac{5}{2}\)
- \(\dfrac{5}{4}\)
- \(0\)
- The limit is infinite.
= For large \(x\), \(\sqrt{4x^4+7}\) behaves like \(2x^2\). Dividing the leading terms gives \(\dfrac{5x^2}{2x^2}=\dfrac{5}{2}\).

@ 1 | n | Trigonometric limits
What is \(\displaystyle\lim_{x\to 0}\dfrac{1-\cos(3x)}{x^2}\)?
* \(\dfrac{9}{2}\)
- \(\dfrac{3}{2}\)
- \(9\)
- \(0\)
= Multiply by \(\dfrac{1+\cos(3x)}{1+\cos(3x)}\) to get \(\dfrac{\sin^2(3x)}{x^2}\cdot\dfrac{1}{1+\cos(3x)}\). The first factor approaches \(9\) and the second approaches \(\dfrac{1}{2}\).

@ 1 | n | Horizontal asymptotes
Which of the following are all of the horizontal asymptotes of the graph of \(f(x)=\dfrac{2e^x+3}{e^x-4}\)?
* \(y=2\) and \(y=-\dfrac{3}{4}\)
- \(y=2\) only
- \(y=-\dfrac{3}{4}\) only
- \(y=2\) and \(y=-3\)
= As \(x\to\infty\), dividing by \(e^x\) gives a limit of \(2\). As \(x\to-\infty\), \(e^x\to 0\), so \(f(x)\to\dfrac{3}{-4}\). The two ends of the graph approach different horizontal lines.

@ 1 | n | Intermediate value theorem | signs
The function \(f\) is continuous on the closed interval \([0,6]\) and has the values shown in the table. What is the fewest possible number of zeros of \(f\) in \([0,6]\)?
* Three
- One
- Two
- Four
= The values change sign between \(x=0\) and \(2\), between \(2\) and \(4\), and between \(4\) and \(6\). By the Intermediate Value Theorem there is at least one zero in each of these three intervals.

@ 1 | n | Reasoning with limits
If \(\displaystyle\lim_{x\to 2}\dfrac{f(x)-4}{x-2}=3\), which of the following must be true?
* \(\displaystyle\lim_{x\to 2}f(x)=4\)
- \(f(2)=4\)
- \(f\) is continuous at \(x=2\)
- \(f'(2)=3\)
= Because the denominator approaches \(0\) and the quotient has a finite limit, the numerator must approach \(0\), so \(\lim_{x\to 2}f(x)=4\). Nothing is given about the value \(f(2)\), so continuity and \(f'(2)\) cannot be concluded.

@ 1 | n | Limits at infinity
What is \(\displaystyle\lim_{x\to\infty}\left(\sqrt{x^2+6x}-x\right)\)?
* \(3\)
- \(0\)
- \(6\)
- The limit is infinite.
= Multiplying by the conjugate gives \(\dfrac{6x}{\sqrt{x^2+6x}+x}\). Dividing numerator and denominator by \(x\) gives \(\dfrac{6}{\sqrt{1+6/x}+1}\), which approaches \(3\).

@ 1 | c | Continuity
Let \(f(x)=\begin{cases}\ln(x+2), & x\le 1\\ k\cos x, & x>1\end{cases}\). For what value of \(k\) is \(f\) continuous at \(x=1\)?
* \(2.033\)
- \(0.594\)
- \(1.099\)
- \(0.540\)
= Continuity requires \(k\cos 1=\ln 3\), so \(k=\dfrac{\ln 3}{\cos 1}\approx 2.033\) in radian mode. Multiplying instead of dividing gives \(0.594\).

@ 2 | n | Product rule
If \(f(x)=x^2\ln x\), what is \(f'(e)\)?
* \(3e\)
- \(2e\)
- \(e\)
- \(2e+1\)
= \(f'(x)=2x\ln x+x^2\cdot\dfrac{1}{x}=2x\ln x+x\). At \(x=e\) this is \(2e+e=3e\).

@ 2 | n | Definition of the derivative
What is \(\displaystyle\lim_{h\to 0}\dfrac{\tan\!\left(\frac{\pi}{4}+h\right)-1}{h}\)?
* \(2\)
- \(1\)
- \(\sqrt{2}\)
- \(\dfrac{1}{2}\)
= The limit is the derivative of \(\tan x\) at \(x=\dfrac{\pi}{4}\), which is \(\sec^2\!\left(\dfrac{\pi}{4}\right)=2\).

@ 2 | n | Normal lines
Which of the following is an equation of the line normal to the graph of \(y=\sqrt{x}\) at \(x=4\)?
* \(y=-4x+18\)
- \(y=\dfrac{1}{4}x+1\)
- \(y=-4x+2\)
- \(y=4x-14\)
= The tangent slope is \(\dfrac{1}{2\sqrt{4}}=\dfrac{1}{4}\), so the normal slope is \(-4\). Through \((4,2)\): \(y-2=-4(x-4)\). The line \(y=\dfrac{1}{4}x+1\) is the tangent line.

@ 2 | n | Differentiability
At which values of \(x\) is \(f(x)=|x^2-4|\) not differentiable?
* \(x=-2\) and \(x=2\)
- \(x=0\) only
- \(x=2\) only
- \(f\) is differentiable for all \(x\)
= The graph of \(x^2-4\) crosses the \(x\)-axis with nonzero slope at \(x=\pm 2\), so taking the absolute value creates corners there. At \(x=0\) the graph is smooth.

@ 2 | n | Quotient rule
What is \(\dfrac{d}{dx}\left[\dfrac{\sin x}{1+\cos x}\right]\)?
* \(\dfrac{1}{1+\cos x}\)
- \(\dfrac{\cos x}{(1+\cos x)^2}\)
- \(-\dfrac{\cos x}{\sin x}\)
- \(\dfrac{\cos x}{1-\sin x}\)
= The quotient rule gives \(\dfrac{\cos x(1+\cos x)+\sin^2 x}{(1+\cos x)^2}=\dfrac{1+\cos x}{(1+\cos x)^2}=\dfrac{1}{1+\cos x}\).

@ 2 | n | Estimating derivatives from a table | concave
The function \(f\) is twice differentiable with \(f''(x)<0\) for all \(x\). Selected values of \(f\) are shown in the table. Which of the following could be the value of \(f'(3)\)?
* \(1.5\)
- \(0.8\)
- \(2.4\)
- \(3\)
= Because \(f''<0\), \(f'\) is decreasing. By the Mean Value Theorem \(f'\) equals \(\dfrac{9-5}{3-1}=2\) somewhere in \((1,3)\) and \(\dfrac{12-9}{6-3}=1\) somewhere in \((3,6)\), so \(1<f'(3)<2\).

@ 2 | c | Instantaneous and average rates
At what value of \(x\) in \((0,2)\) does the instantaneous rate of change of \(f(x)=x^3\) equal the average rate of change of \(g(x)=e^x\) on the interval \([0,2]\)?
* \(1.032\)
- \(3.195\)
- \(1.787\)
- \(1.065\)
= The average rate of change of \(g\) is \(\dfrac{e^2-1}{2}\approx 3.195\). Solving \(3x^2=3.195\) gives \(x\approx 1.032\).

@ 3 | n | Derivatives of inverse trigonometric functions
What is \(\dfrac{d}{dx}\left[\arcsin(x^2)\right]\)?
* \(\dfrac{2x}{\sqrt{1-x^4}}\)
- \(\dfrac{1}{\sqrt{1-x^4}}\)
- \(\dfrac{2x}{1+x^4}\)
- \(\dfrac{2x}{\sqrt{1-x^2}}\)
= With \(u=x^2\), \(\dfrac{d}{dx}\arcsin u=\dfrac{u'}{\sqrt{1-u^2}}=\dfrac{2x}{\sqrt{1-x^4}}\).

@ 3 | n | Implicit differentiation
The curve \(xy+e^y=e\) passes through the point \((0,1)\). What is \(\dfrac{dy}{dx}\) at that point?
* \(-\dfrac{1}{e}\)
- \(-e\)
- \(-1\)
- \(0\)
= Differentiating gives \(y+x\dfrac{dy}{dx}+e^y\dfrac{dy}{dx}=0\). At \((0,1)\): \(1+e\dfrac{dy}{dx}=0\), so \(\dfrac{dy}{dx}=-\dfrac{1}{e}\).

@ 3 | n | Chain rule from a table | fg
Selected values of the differentiable functions \(f\) and \(g\) and their derivatives are shown in the table. If \(k(x)=g(f(x))\), what is \(k'(3)\)?
* \(-5\)
- \(30\)
- \(-1\)
- \(-12\)
= \(k'(3)=g'(f(3))\,f'(3)=g'(2)\cdot 5=(-1)(5)=-5\). Multiplying \(g'(3)\) by \(f'(3)\) gives \(30\), which evaluates \(g'\) at the wrong input.

@ 3 | n | Second derivatives
If \(y=e^{x^2}\), what is \(\dfrac{d^2y}{dx^2}\)?
* \(\left(4x^2+2\right)e^{x^2}\)
- \(4x^2e^{x^2}\)
- \(2e^{x^2}\)
- \(\left(2x+2\right)e^{x^2}\)
= \(\dfrac{dy}{dx}=2xe^{x^2}\). Applying the product rule, \(\dfrac{d^2y}{dx^2}=2e^{x^2}+2x\cdot 2xe^{x^2}=\left(4x^2+2\right)e^{x^2}\).

@ 3 | n | Derivatives of inverse functions
Let \(f(x)=x^3+x+1\) and let \(g\) be the inverse of \(f\). What is \(g'(3)\)?
* \(\dfrac{1}{4}\)
- \(\dfrac{1}{28}\)
- \(4\)
- \(\dfrac{1}{3}\)
= Since \(f(1)=3\), \(g(3)=1\) and \(g'(3)=\dfrac{1}{f'(1)}=\dfrac{1}{3(1)^2+1}=\dfrac{1}{4}\). Using \(f'(3)=28\) evaluates the derivative at the wrong input.

@ 3 | n | Derivatives of logarithmic functions
What is \(\dfrac{d}{dx}\left[\log_3\!\left(x^2+1\right)\right]\)?
* \(\dfrac{2x}{\left(x^2+1\right)\ln 3}\)
- \(\dfrac{2x}{x^2+1}\)
- \(\dfrac{2x\ln 3}{x^2+1}\)
- \(\dfrac{1}{\left(x^2+1\right)\ln 3}\)
= \(\log_3 u=\dfrac{\ln u}{\ln 3}\), so the derivative is \(\dfrac{u'}{u\ln 3}\) with \(u=x^2+1\).

@ 3 | c | Second derivatives
If \(f(x)=\sin\!\left(e^x\right)\), what is \(f''(1)\)?
* \(-5.514\)
- \(-2.478\)
- \(-3.035\)
- \(2.478\)
= \(f'(x)=e^x\cos\!\left(e^x\right)\) and \(f''(x)=e^x\cos\!\left(e^x\right)-e^{2x}\sin\!\left(e^x\right)\). At \(x=1\) this is \(-2.478-3.035\approx -5.514\).

@ 4 | n | Related rates
The volume of a spherical balloon increases at a constant rate of \(72\pi\) cubic centimeters per second. At what rate is the surface area of the balloon increasing when the radius is 3 centimeters? (\(V=\frac{4}{3}\pi r^3\) and \(S=4\pi r^2\).)
* \(48\pi\text{ cm}^2\text{/s}\)
- \(24\pi\text{ cm}^2\text{/s}\)
- \(72\pi\text{ cm}^2\text{/s}\)
- \(16\pi\text{ cm}^2\text{/s}\)
= \(\dfrac{dV}{dt}=4\pi r^2\dfrac{dr}{dt}\), so \(72\pi=36\pi\dfrac{dr}{dt}\) and \(\dfrac{dr}{dt}=2\). Then \(\dfrac{dS}{dt}=8\pi r\dfrac{dr}{dt}=8\pi(3)(2)=48\pi\).

@ 4 | n | L’Hospital’s Rule
What is \(\displaystyle\lim_{x\to 0}\dfrac{x-\sin x}{x^3}\)?
* \(\dfrac{1}{6}\)
- \(0\)
- \(\dfrac{1}{3}\)
- \(1\)
= The form is \(\dfrac{0}{0}\). Applying L’Hospital’s Rule three times gives \(\dfrac{1-\cos x}{3x^2}\), then \(\dfrac{\sin x}{6x}\), then \(\dfrac{\cos x}{6}\), which approaches \(\dfrac{1}{6}\).

@ 4 | n | Rectilinear motion
A particle moves along the \(x\)-axis with position \(x(t)=t^3-6t^2+9t\) for \(0\le t\le 4\). What is the total distance traveled by the particle?
* \(12\)
- \(4\)
- \(8\)
- \(20\)
= \(v(t)=3(t-1)(t-3)\), so the particle reverses at \(t=1\) and \(t=3\). The positions \(x(0)=0\), \(x(1)=4\), \(x(3)=0\), \(x(4)=4\) give a total distance of \(4+4+4=12\). The displacement is only \(4\).

@ 4 | n | Linear approximation
The function \(f\) is differentiable with \(f(1)=4\) and \(f'(1)=-2\). Let \(g(x)=x^2f(x)\). Using the line tangent to the graph of \(g\) at \(x=1\), what is the approximation of \(g(1.1)\)?
* \(4.6\)
- \(3.8\)
- \(4.84\)
- \(4.4\)
= \(g(1)=4\) and \(g'(x)=2xf(x)+x^2f'(x)\), so \(g'(1)=8-2=6\). The tangent line gives \(4+6(0.1)=4.6\).

@ 4 | n | Related rates
A person 6 feet tall walks at 5 feet per second directly away from a lamppost that is 15 feet tall. At what rate is the length of the person’s shadow increasing?
* \(\dfrac{10}{3}\) ft/s
- \(2\) ft/s
- \(\dfrac{25}{3}\) ft/s
- \(5\) ft/s
= With \(x\) the distance from the post and \(s\) the shadow length, similar triangles give \(\dfrac{s}{x+s}=\dfrac{6}{15}\), so \(s=\dfrac{2}{3}x\) and \(\dfrac{ds}{dt}=\dfrac{2}{3}(5)=\dfrac{10}{3}\). The value \(\dfrac{25}{3}\) is the speed of the tip of the shadow.

@ 4 | c | Rectilinear motion
A particle moves along a line with velocity \(v(t)=t\cos\!\left(\dfrac{t^2}{3}\right)\). What is the acceleration of the particle at \(t=2\)?
* \(-2.357\)
- \(0.470\)
- \(-2.592\)
- \(0.235\)
= \(a(t)=\cos\!\left(\dfrac{t^2}{3}\right)-\dfrac{2t^2}{3}\sin\!\left(\dfrac{t^2}{3}\right)\). In radian mode, \(a(2)\approx 0.235-2.592=-2.357\). The value \(0.470\) is the velocity \(v(2)\).

@ 4 | c | Rates of change in context
A population is modeled by \(P(t)=\dfrac{500}{1+4e^{-0.3t}}\), where \(t\) is measured in years. At what rate is the population changing at \(t=5\)?
* \(37.379\)
- \(264.198\)
- \(133.878\)
- \(70.741\)
= \(P'(t)=\dfrac{600e^{-0.3t}}{\left(1+4e^{-0.3t}\right)^2}\), so \(P'(5)\approx\dfrac{133.878}{3.582}\approx 37.379\) per year. The value \(264.198\) is the population \(P(5)\), not its rate of change.

@ 5 | n | Intervals of decrease from the graph of \(f'\) | fprime
The graph of \(f'\), the derivative of the function \(f\), is shown. On which intervals is \(f\) decreasing?
* \(x<-2\) and \(1<x<4\)
- Approximately \(-0.7<x<2.7\)
- \(-2<x<1\) and \(x>4\)
- Approximately \(x<-0.7\) and \(x>2.7\)
= \(f\) is decreasing where \(f'\) is negative, which is where the graph of \(f'\) lies below the \(x\)-axis. The interval where the graph of \(f'\) falls describes the concavity of \(f\), not where \(f\) decreases.

@ 5 | n | Mean Value Theorem
For \(f(x)=x^3-3x\) on the interval \([0,3]\), what value of \(c\) satisfies the conclusion of the Mean Value Theorem?
* \(\sqrt{3}\)
- \(\dfrac{3}{2}\)
- \(1\)
- \(\sqrt{6}\)
= The average rate of change is \(\dfrac{18-0}{3-0}=6\). Solving \(f'(c)=3c^2-3=6\) gives \(c=\sqrt{3}\), which lies in \((0,3)\).

@ 5 | n | Absolute extrema
What is the absolute maximum value of \(f(x)=xe^{-x}\) on the interval \([0,3]\)?
* \(\dfrac{1}{e}\)
- \(0\)
- \(\dfrac{3}{e^3}\)
- \(1\)
= \(f'(x)=(1-x)e^{-x}\) is zero only at \(x=1\). Comparing \(f(0)=0\), \(f(1)=\dfrac{1}{e}\), and \(f(3)=\dfrac{3}{e^3}\approx 0.149\), the maximum value is \(\dfrac{1}{e}\).

@ 5 | n | Justifying extrema
The function \(f\) is twice differentiable for all \(x\), with \(f'(2)=0\) and \(f''(x)>0\) for all \(x\). Which statement must be true?
* \(f(2)\) is the absolute minimum value of \(f\)
- \(f(2)\) is a local maximum value of \(f\)
- The graph of \(f\) has a point of inflection at \(x=2\)
- \(f\) has a local minimum at \(x=2\), but it need not be the absolute minimum
= Because \(f''>0\) everywhere, \(f'\) is increasing, so \(f'<0\) for \(x<2\) and \(f'>0\) for \(x>2\). The function decreases to \(x=2\) and increases afterward, which makes \(f(2)\) the absolute minimum.

@ 5 | n | Optimization
A closed cylindrical can must have a volume of \(16\pi\) cubic inches. What radius minimizes the total surface area of the can?
* \(2\) inches
- \(4\) inches
- \(\sqrt[3]{4}\) inches
- \(2\sqrt{2}\) inches
= With \(h=\dfrac{16}{r^2}\), the surface area is \(S=2\pi r^2+\dfrac{32\pi}{r}\). Setting \(S'(r)=4\pi r-\dfrac{32\pi}{r^2}=0\) gives \(r^3=8\), so \(r=2\); \(S''(r)>0\) confirms a minimum.

@ 5 | c | Extrema from the derivative
The derivative of the function \(f\) is \(f'(x)=e^{-x}-0.2x\). At what value of \(x\) does \(f\) have a local maximum?
* \(1.327\)
- \(0.567\)
- \(1.609\)
- \(5.000\)
= Solving \(e^{-x}=0.2x\) gives \(x\approx 1.327\), where \(f'\) changes from positive to negative. The value \(0.567\) solves \(e^{-x}=x\) instead.

@ 5 | c | Mean Value Theorem
For \(f(x)=x\ln(x+1)\) on the interval \([0,3]\), what value of \(c\) satisfies the conclusion of the Mean Value Theorem?
* \(1.281\)
- \(1.386\)
- \(1.500\)
- \(4.159\)
= The average rate of change is \(\dfrac{3\ln 4}{3}=\ln 4\approx 1.386\). Solving \(f'(c)=\ln(c+1)+\dfrac{c}{c+1}=1.386\) numerically gives \(c\approx 1.281\).

@ 6 | n | Integration by substitution
What is the value of \(\displaystyle\int_0^{\pi/4}\tan x\,\sec^2 x\,dx\)?
* \(\dfrac{1}{2}\)
- \(1\)
- \(\dfrac{1}{4}\)
- \(2\)
= Let \(u=\tan x\), so \(du=\sec^2 x\,dx\) and the limits become \(0\) and \(1\). The integral is \(\left[\dfrac{u^2}{2}\right]_0^1=\dfrac{1}{2}\).

@ 6 | n | Integrating rational functions
What is the value of \(\displaystyle\int_0^1\dfrac{x}{x+1}\,dx\)?
* \(1-\ln 2\)
- \(\ln 2\)
- \(\dfrac{1}{2}\)
- \(1+\ln 2\)
= Rewrite \(\dfrac{x}{x+1}=1-\dfrac{1}{x+1}\). The integral is \(\left[x-\ln(x+1)\right]_0^1=1-\ln 2\).

@ 6 | n | Fundamental Theorem of Calculus
What is \(\dfrac{d}{dx}\displaystyle\int_x^{x^2}e^{t^2}\,dt\)?
* \(2xe^{x^4}-e^{x^2}\)
- \(e^{x^4}-e^{x^2}\)
- \(2xe^{x^4}\)
- \(2xe^{x^4}+e^{x^2}\)
= Differentiate the upper limit’s contribution, \(e^{(x^2)^2}\cdot 2x\), and subtract the lower limit’s contribution, \(e^{x^2}\cdot 1\).

@ 6 | n | Concavity of an accumulation function | accum
The graph of the function \(f\), consisting of four line segments, is shown. Let \(g(x)=\displaystyle\int_0^x f(t)\,dt\). On which interval is the graph of \(g\) concave down?
* \(4<x<8\)
- \(0<x<2\)
- \(6<x<8\) only
- \(2<x<4\)
= \(g''(x)=f'(x)\), so the graph of \(g\) is concave down where \(f\) is decreasing, which is \(4<x<8\). The interval \(6<x<8\) is only where \(g\) itself is decreasing.

@ 6 | n | Properties of definite integrals
The function \(f\) is continuous and even, with \(\displaystyle\int_0^3 f(x)\,dx=5\). What is \(\displaystyle\int_{-3}^{3}\left[f(x)+2x+1\right]dx\)?
* \(16\)
- \(10\)
- \(11\)
- \(22\)
= Because \(f\) is even, \(\displaystyle\int_{-3}^{3}f(x)\,dx=10\). The odd function \(2x\) integrates to \(0\) over a symmetric interval, and \(\displaystyle\int_{-3}^{3}1\,dx=6\), for a total of \(16\).

@ 6 | c | Solving for a limit of integration
If \(\displaystyle\int_0^k e^{-x^2}\,dx=0.5\) and \(k>0\), what is the value of \(k\)?
* \(0.551\)
- \(0.461\)
- \(0.833\)
- \(0.500\)
= Graphing or solving \(\displaystyle\int_0^k e^{-x^2}\,dx=0.5\) numerically gives \(k\approx 0.551\). The value \(0.461\) is the integral from \(0\) to \(0.5\).

@ 7 | n | Separation of variables
Which function is the solution to \(\dfrac{dy}{dx}=y^2\) with \(y(0)=1\)?
* \(y=\dfrac{1}{1-x}\)
- \(y=\dfrac{1}{1+x}\)
- \(y=e^x\)
- \(y=\sqrt{2x+1}\)
= Separating variables gives \(-\dfrac{1}{y}=x+C\). The condition \(y(0)=1\) gives \(C=-1\), so \(y=\dfrac{1}{1-x}\).

@ 7 | n | Separation of variables
Which function is the solution to \(\dfrac{dy}{dx}=xe^{-y}\) with \(y(0)=0\)?
* \(y=\ln\!\left(\dfrac{x^2}{2}+1\right)\)
- \(y=\ln\!\left(x^2+1\right)\)
- \(y=\dfrac{x^2}{2}\)
- \(y=-\ln\!\left(1-\dfrac{x^2}{2}\right)\)
= Separating gives \(e^y\,dy=x\,dx\), so \(e^y=\dfrac{x^2}{2}+C\). The condition \(y(0)=0\) gives \(C=1\).

@ 7 | n | Exponential models
A population \(P\) grows according to \(\dfrac{dP}{dt}=kP\), where \(t\) is measured in years, and the population doubles every 5 years. What is the value of \(k\)?
* \(\dfrac{\ln 2}{5}\)
- \(\dfrac{2}{5}\)
- \(5\ln 2\)
- \(\dfrac{\ln 5}{2}\)
= The solution is \(P=P_0e^{kt}\). Doubling in 5 years means \(e^{5k}=2\), so \(k=\dfrac{\ln 2}{5}\).

@ 7 | n | Tangent line approximations of solutions
Let \(y=f(x)\) be the solution to \(\dfrac{dy}{dx}=y-x\) with \(f(1)=3\). Using the line tangent to the graph of \(f\) at \(x=1\), what is the approximation of \(f(1.2)\)?
* \(3.4\)
- \(3.2\)
- \(2.6\)
- \(3.6\)
= At \((1,3)\) the slope is \(3-1=2\). The tangent line gives \(3+2(0.2)=3.4\).

@ 7 | n | Modeling with differential equations
The temperature \(T\) of an object changes at a rate proportional to the difference between \(T\) and the constant room temperature of 70 degrees. Which differential equation models this situation, where \(k\) is a constant?
* \(\dfrac{dT}{dt}=k(T-70)\)
- \(\dfrac{dT}{dt}=kT\)
- \(\dfrac{dT}{dt}=70kT\)
- \(\dfrac{dT}{dt}=\dfrac{k}{T-70}\)
= "Proportional to the difference between \(T\) and 70" means the rate equals a constant times \(T-70\). A rate proportional to \(T\) alone would ignore the room temperature.

@ 7 | n | Verifying solutions
For which values of the constant \(k\) is \(y=e^{kx}\) a solution to \(y''-y'-6y=0\)?
* \(k=3\) and \(k=-2\)
- \(k=2\) and \(k=-3\)
- \(k=6\) and \(k=-1\)
- \(k=3\) only
= Substituting \(y=e^{kx}\) gives \(\left(k^2-k-6\right)e^{kx}=0\). Because \(e^{kx}\ne 0\), \(k^2-k-6=(k-3)(k+2)=0\).

@ 7 | n | Solution curves in a slope field | fieldSum
The slope field for \(\dfrac{dy}{dx}=x+y\) is shown. Which of the following describes the solution curve that passes through the point \((0,-1)\)?
* A line with slope \(-1\)
- A curve that is concave up with a minimum at \((0,-1)\)
- A horizontal line
- A curve that increases for all \(x\)
= The line \(y=-x-1\) satisfies the equation, since \(\dfrac{dy}{dx}=-1\) and \(x+y=-1\) at every point on it. Along this line the slope segments all have slope \(-1\).

@ 7 | n | Separation of variables
Which function is the solution to \(\dfrac{dy}{dx}=y\cos x\) with \(y(0)=4\)?
* \(y=4e^{\sin x}\)
- \(y=4e^{\cos x}\)
- \(y=4+\sin x\)
- \(y=e^{\sin x}+3\)
= Separating gives \(\ln|y|=\sin x+C\), so \(y=Ce^{\sin x}\). The condition \(y(0)=4\) gives \(C=4\).

@ 7 | n | General solutions
Which of the following is the general solution to \(\dfrac{dy}{dx}=\dfrac{2x}{y}\), where \(C\) is a constant?
* \(y^2=2x^2+C\)
- \(y=x^2+C\)
- \(y^2=x^2+C\)
- \(y=Ce^{x^2}\)
= Separating gives \(y\,dy=2x\,dx\), so \(\dfrac{y^2}{2}=x^2+C_1\). Multiplying by \(2\) gives \(y^2=2x^2+C\).

@ 7 | c | Exponential decay
A radioactive substance decays according to \(\dfrac{dA}{dt}=kA\), where \(t\) is measured in hours. If 30 percent of the substance decays in the first 6 hours, what is its half-life, in hours?
* \(11.660\)
- \(3.454\)
- \(10.000\)
- \(8.571\)
= Seventy percent remains after 6 hours, so \(e^{6k}=0.7\) and \(k=\dfrac{\ln 0.7}{6}\). The half-life is \(\dfrac{\ln 0.5}{k}\approx 11.660\) hours. Using \(0.3\) as the fraction remaining gives \(3.454\).

@ 7 | c | Newton’s law of cooling
A cup of coffee at 90 degrees is placed in a room kept at 20 degrees, and its temperature \(T\) satisfies \(\dfrac{dT}{dt}=k(T-20)\). After 5 minutes the coffee is at 70 degrees. What is its temperature after 12 minutes?
* \(51.217\)
- \(42.000\)
- \(31.217\)
- \(48.000\)
= \(T=20+70e^{kt}\). From \(T(5)=70\), \(e^{5k}=\dfrac{5}{7}\), so \(k\approx -0.0673\) and \(T(12)=20+70e^{12k}\approx 51.217\). A constant rate of 4 degrees per minute would give \(42\).

@ 7 | c | Separation of variables
A positive function \(y\) satisfies \(\dfrac{dy}{dx}=\dfrac{x^2}{y}\) with \(y(1)=2\). What is \(y(2)\)?
* \(2.944\)
- \(2.309\)
- \(4.333\)
- \(8.667\)
= Separating gives \(\dfrac{y^2}{2}=\dfrac{x^3}{3}+C\), and \(y(1)=2\) gives \(C=\dfrac{5}{3}\). At \(x=2\), \(y^2=\dfrac{26}{3}\), so \(y\approx 2.944\).

@ 7 | c | Modeling with differential equations
An account balance \(A\), in dollars, satisfies \(\dfrac{dA}{dt}=0.05A+1000\) with \(A(0)=5000\), where \(t\) is measured in years. What is \(A(10)\)?
* \(21218.032\)
- \(8243.606\)
- \(18243.606\)
- \(15000.000\)
= Write \(\dfrac{dA}{dt}=0.05(A+20000)\). Then \(A+20000=25000e^{0.05t}\), so \(A(10)=25000e^{0.5}-20000\approx 21218.032\). Ignoring the deposits gives \(8243.606\).

@ 8 | n | Area between curves | region
The shaded region \(R\) is bounded by the graphs of \(y=\sqrt{x}\) and \(y=\dfrac{x}{2}\), as shown. What is the area of \(R\)?
* \(\dfrac{4}{3}\)
- \(\dfrac{2}{3}\)
- \(\dfrac{8}{3}\)
- \(\dfrac{16}{3}\)
= The area is \(\displaystyle\int_0^4\left(\sqrt{x}-\dfrac{x}{2}\right)dx=\left[\dfrac{2}{3}x^{3/2}-\dfrac{x^2}{4}\right]_0^4=\dfrac{16}{3}-4=\dfrac{4}{3}\).

@ 8 | n | Volumes with washers about the y-axis | region
The shaded region \(R\) is bounded by the graphs of \(y=\sqrt{x}\) and \(y=\dfrac{x}{2}\), as shown. Which integral gives the volume of the solid generated when \(R\) is revolved about the \(y\)-axis?
* \(\pi\displaystyle\int_0^2\left(4y^2-y^4\right)dy\)
- \(\pi\displaystyle\int_0^2\left(2y-y^2\right)^2dy\)
- \(\pi\displaystyle\int_0^4\left(x-\dfrac{x^2}{4}\right)dx\)
- \(\pi\displaystyle\int_0^2\left(y^4-4y^2\right)dy\)
= In terms of \(y\), the curves are \(x=y^2\) and \(x=2y\) for \(0\le y\le 2\). The outer radius is \(2y\) and the inner radius is \(y^2\), so each washer has area \(\pi\left(4y^2-y^4\right)\).

@ 8 | n | Average value of a function
What is the average value of \(f(x)=\sin x\) on the interval \([0,\pi]\)?
* \(\dfrac{2}{\pi}\)
- \(\dfrac{1}{2}\)
- \(\dfrac{1}{\pi}\)
- \(2\)
= The average value is \(\dfrac{1}{\pi}\displaystyle\int_0^{\pi}\sin x\,dx=\dfrac{1}{\pi}\left[-\cos x\right]_0^{\pi}=\dfrac{2}{\pi}\).

@ 8 | n | Volumes with known cross sections
The base of a solid is the region bounded by \(y=4-x^2\) and the \(x\)-axis. Cross sections perpendicular to the \(x\)-axis are semicircles whose diameters lie in the base. Which integral gives the volume of the solid?
* \(\dfrac{\pi}{8}\displaystyle\int_{-2}^{2}\left(4-x^2\right)^2dx\)
- \(\dfrac{\pi}{2}\displaystyle\int_{-2}^{2}\left(4-x^2\right)^2dx\)
- \(\pi\displaystyle\int_{-2}^{2}\left(4-x^2\right)^2dx\)
- \(\dfrac{\pi}{8}\displaystyle\int_{-2}^{2}\left(4-x^2\right)dx\)
= Each semicircle has diameter \(4-x^2\) and radius \(\dfrac{4-x^2}{2}\), so its area is \(\dfrac{1}{2}\pi\left(\dfrac{4-x^2}{2}\right)^2=\dfrac{\pi}{8}\left(4-x^2\right)^2\).

@ 8 | n | Accumulation in context
Water flows into a tank at a rate of \(6t\) gallons per minute and is pumped out at a constant rate of 12 gallons per minute for \(0\le t\le 4\). The tank holds 30 gallons at \(t=0\). What is the least amount of water in the tank during this time?
* \(18\) gallons
- \(30\) gallons
- \(6\) gallons
- \(24\) gallons
= The net rate \(6t-12\) is negative until \(t=2\) and positive afterward, so the minimum occurs at \(t=2\): \(30+\displaystyle\int_0^2(6t-12)\,dt=30+12-24=18\).

@ 8 | n | Revolving around other axes
The region bounded by \(y=x\) and \(y=x^2\) is revolved about the line \(y=2\). Which integral gives the volume of the solid?
* \(\pi\displaystyle\int_0^1\left[\left(2-x^2\right)^2-\left(2-x\right)^2\right]dx\)
- \(\pi\displaystyle\int_0^1\left[\left(2-x\right)^2-\left(2-x^2\right)^2\right]dx\)
- \(\pi\displaystyle\int_0^1\left[x^2-x^4\right]dx\)
- \(\pi\displaystyle\int_0^1\left(x-x^2\right)^2dx\)
= On \([0,1]\), \(y=x^2\) lies below \(y=x\), so it is farther from the line \(y=2\). The outer radius is \(2-x^2\) and the inner radius is \(2-x\).

@ 8 | n | Position from a velocity graph | velocity
A particle moves along the \(x\)-axis. The graph of its velocity \(v\), consisting of four line segments, is shown for \(0\le t\le 8\). If the position of the particle at \(t=0\) is \(x=3\), what is its position at \(t=8\)?
* \(1\)
- \(-2\)
- \(15\)
- \(5\)
= Position is the initial position plus displacement: \(3+\displaystyle\int_0^8 v(t)\,dt=3+(5-7)=1\). Adding the total distance of \(12\) instead gives \(15\).

@ 8 | c | Area between curves
What is the area of the region enclosed by the graphs of \(y=\sin x\) and \(y=x^2\)?
* \(0.136\)
- \(0.877\)
- \(0.360\)
- \(0.225\)
= The graphs intersect at \(x=0\) and \(x=a\approx 0.877\). The area is \(\displaystyle\int_0^a\left(\sin x-x^2\right)dx\approx 0.136\).

@ 8 | c | Volumes with disks
The region bounded by \(y=\ln x\), the \(x\)-axis, and the line \(x=3\) is revolved about the \(x\)-axis. What is the volume of the solid?
* \(3.233\)
- \(1.029\)
- \(4.071\)
- \(3.792\)
= Each disk has radius \(\ln x\) for \(1\le x\le 3\), so the volume is \(\pi\displaystyle\int_1^3(\ln x)^2dx\approx 3.233\). Omitting \(\pi\) gives \(1.029\).
`;

module.exports = { source, figures };
