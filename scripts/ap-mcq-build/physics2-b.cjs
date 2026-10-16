// AP Physics 2, units 13–15 (stored as units 5–7): geometric optics; waves, sound, and
// physical optics; and modern physics. Same block format as physics2-a.cjs.
const { graph } = require('./figures.cjs');
const { draw } = require('./diagram.cjs');

const PINK = '#ec4899', BLUE = '#3b82f6';
const r2 = n => Math.round(n * 100) / 100;
const text = (x, y, s, o = {}) => ['text', x, y, s, { italic: false, ...o }];
const tan = deg => Math.tan(deg * Math.PI / 180);

// A converging lens at x = lx on an axis at y = ay, with an object outside the focal length.
// Distances are in centimeters and drawn at s pixels per centimeter.
function lensFig({ f, d0, h0, s, lx, ay, w, h, alt }) {
  const di = 1 / (1 / f - 1 / d0), hi = -h0 * di / d0, ox = lx - d0 * s, ix = lx + di * s, oy = ay - h0 * s, iy = ay - hi * s;
  return draw(w, h, alt, [
    ['line', 10, ay, w - 10, ay, { width: 1.2 }], ['path', `M${lx} ${ay - 72} Q${lx + 16} ${ay} ${lx} ${ay + 72} Q${lx - 16} ${ay} ${lx} ${ay - 72}`, { fill: true }],
    ...[-1, 1].flatMap(k => [['circle', lx + k * f * s, ay, 3, { fill: 'currentColor' }], text(lx + k * f * s, ay + 18, 'F', { italic: true })]),
    ['arrow', ox, ay, ox, oy, { color: 'currentColor', width: 2.4 }], text(ox, oy - 8, 'object', { size: 11 }),
    ['arrow', r2(ix), ay, r2(ix), r2(iy), { color: PINK, width: 2.4 }], text(r2(ix), r2(iy) + 18, 'image', { size: 11 }),
    ['path', `M${ox} ${oy} H${lx} L${r2(ix)} ${r2(iy)}`, { color: BLUE, width: 1.4 }], ['path', `M${ox} ${oy} L${r2(ix)} ${r2(iy)}`, { color: BLUE, width: 1.4 }],
  ]);
}

const figures = {
  refraction: draw(340, 220, 'A ray of light in air strikes a flat glass surface at an angle of incidence of 30 degrees, measured from the normal. Part of the light reflects, and part refracts into the glass, bending toward the normal. The glass has an index of refraction of 1.50', [
    ['rect', 20, 110, 300, 100, { fill: true, width: 0 }], ['line', 20, 110, 320, 110], ['line', 170, 20, 170, 210, { dash: true }],
    ['arrow', r2(170 - 90 * tan(30)), 20, 170, 110, { color: BLUE }], ['line', 170, 110, r2(170 + 90 * tan(30)), 20, { color: BLUE, width: 1.2, dash: true }], ['arrow', 170, 110, r2(170 + 96 * tan(19.5)), 206, { color: BLUE }],
    text(40, 40, 'air', { size: 12 }), text(60, 190, 'glass, n = 1.50', { size: 12, anchor: 'start' }), text(150, 70, '30°', { size: 11 }),
  ]),
  tir: draw(340, 210, 'A ray of light travels inside glass of index 1.50 and strikes the flat boundary with air above it at an angle of incidence of 50 degrees, measured from the normal', [
    ['rect', 20, 80, 300, 120, { fill: true, width: 0 }], ['line', 20, 80, 320, 80], ['line', 170, 20, 170, 200, { dash: true }],
    ['arrow', r2(170 - 110 * tan(50)), 190, 170, 80, { color: BLUE }], text(40, 45, 'air', { size: 12 }), text(200, 185, 'glass, n = 1.50', { size: 12, anchor: 'start' }), text(148, 130, '50°', { size: 11 }),
  ]),
  lens: lensFig({ f: 10, d0: 30, h0: 4, s: 7, lx: 240, ay: 100, w: 380, h: 170, alt: 'Ray diagram for a converging lens with focal points F marked 10 cm on each side. A 4.0 cm tall object stands 30 cm to the left of the lens. Two rays from the top of the object, one parallel to the axis and one through the center of the lens, meet on the right side to form an image' }),
  mirror: draw(360, 220, 'Ray diagram for a concave mirror with focal point F 10 cm from the mirror and center of curvature C 20 cm from it. An object stands 15 cm in front of the mirror. Two rays from the top of the object reflect from the mirror and meet farther from the mirror than C, forming an inverted image', [
    ['line', 20, 110, 340, 110, { width: 1.2 }], ['path', 'M318 30 Q342 110 318 190', { width: 2.6 }], ['circle', 250, 110, 3, { fill: 'currentColor' }], text(250, 128, 'F', { italic: true }), ['circle', 170, 110, 3, { fill: 'currentColor' }], text(170, 128, 'C', { italic: true }),
    ['arrow', 210, 110, 210, 86, { color: 'currentColor', width: 2.4 }], text(210, 78, 'object', { size: 11 }), ['arrow', 90, 110, 90, 158, { color: PINK, width: 2.4 }], text(90, 176, 'image', { size: 11 }),
    ['path', 'M210 86 H330 L90 158', { color: BLUE, width: 1.4 }], ['path', 'M210 86 L330 158 H90', { color: BLUE, width: 1.4 }],
  ]),
  waveSnap: graph({ x: [0, 0.8], y: [-7.5, 7.5], xstep: 0.1, ystep: 5, xlabel: 'x (m)', ylabel: 'y (cm)', w: 380, curves: [{ fn: x => 5 * Math.sin(2 * Math.PI * x / 0.4), from: 0, to: 0.8 }],
    dots: [{ x: 0.1, y: 5, color: PINK }, { x: 0.2, y: 0, color: PINK }], notes: [{ x: 0.105, y: 6, text: 'P' }, { x: 0.205, y: 1.2, text: 'Q' }],
    alt: 'Snapshot of a sinusoidal wave on a string traveling to the right. The displacement y is plotted against position x from 0 to 0.80 m. The amplitude is 5 cm and the wave repeats every 0.40 m. Point P is at a crest at x = 0.10 m, and point Q is at zero displacement at x = 0.20 m' }),
  standing: draw(360, 140, 'A standing wave on a string 1.2 m long fixed at both ends. The pattern has three loops, with nodes at both ends and two nodes between them', [
    ['line', 30, 30, 30, 110, { width: 3 }], ['line', 330, 30, 330, 110, { width: 3 }],
    ['path', 'M30 70 ' + Array.from({ length: 61 }, (_, i) => `L${30 + i * 5} ${r2(70 - 30 * Math.sin(Math.PI * i / 20))}`).join(' '), { color: BLUE, width: 2.2 }],
    ['path', 'M30 70 ' + Array.from({ length: 61 }, (_, i) => `L${30 + i * 5} ${r2(70 + 30 * Math.sin(Math.PI * i / 20))}`).join(' '), { color: BLUE, width: 1.4, dash: true }],
    ['line', 30, 126, 330, 126], text(180, 122, '1.2 m', { size: 11 }),
  ]),
  pipe: draw(360, 140, 'A tube 0.85 m long that is closed at its left end and open at its right end. The air displacement pattern of its lowest resonance is drawn inside: zero at the closed end and largest at the open end', [
    ['line', 40, 40, 330, 40, { width: 2.4 }], ['line', 40, 100, 330, 100, { width: 2.4 }], ['line', 40, 40, 40, 100, { width: 5 }],
    ['path', 'M40 70 ' + Array.from({ length: 30 }, (_, i) => `L${40 + (i + 1) * 10} ${r2(70 - 26 * Math.sin(Math.PI / 2 * (i + 1) / 29))}`).join(' '), { color: BLUE, width: 2 }],
    ['path', 'M40 70 ' + Array.from({ length: 30 }, (_, i) => `L${40 + (i + 1) * 10} ${r2(70 + 26 * Math.sin(Math.PI / 2 * (i + 1) / 29))}`).join(' '), { color: BLUE, width: 2 }],
    ['line', 40, 120, 330, 120], text(185, 116, '0.85 m', { size: 11 }), text(40, 28, 'closed', { size: 11 }), text(330, 28, 'open', { size: 11 }),
  ]),
  doubleSlit: draw(380, 220, 'Monochromatic light passes through two narrow slits a distance d apart and forms a pattern of bright and dark fringes on a screen a distance L away. Point P on the screen is the first bright fringe above the central maximum', [
    ['arrow', 10, 110, 44, 110], ['line', 80, 20, 80, 98, { width: 3 }], ['line', 80, 106, 80, 114, { width: 3 }], ['line', 80, 122, 80, 200, { width: 3 }],
    ['line', 320, 20, 320, 200, { width: 2.4 }], ...[-2, -1, 0, 1, 2].map(k => ['rect', 324, 104 + k * 30, 10, 12, { fill: BLUE, color: BLUE, width: 1 }]),
    ['line', 80, 102, 320, 80, { dash: true }], ['line', 80, 118, 320, 80, { dash: true }], ['line', 80, 110, 320, 110, { width: 1, dash: true }], text(346, 85, 'P', { italic: true, anchor: 'start' }),
    text(66, 113, 'd', { italic: true, anchor: 'end' }), ['line', 80, 212, 320, 212], text(200, 208, 'L', { italic: true }),
  ]),
  thinFilm: draw(360, 180, 'Light in air strikes a thin soap film of index 1.33 that has air on both sides. Part of the light reflects from the top surface of the film, and part reflects from the bottom surface; the two reflected rays then overlap', [
    ['rect', 20, 80, 320, 40, { fill: true }], text(300, 105, 'n = 1.33', { size: 11, anchor: 'end' }), text(40, 40, 'air', { size: 12 }), text(40, 150, 'air', { size: 12 }),
    ['arrow', 100, 20, 140, 80, { color: BLUE }], ['arrow', 140, 80, 180, 20, { color: BLUE }], ['line', 140, 80, 160, 120, { color: BLUE, width: 1.6 }], ['arrow', 160, 120, 200, 22, { color: PINK }],
    text(186, 30, '1', { size: 11, anchor: 'start' }), text(206, 30, '2', { size: 11, anchor: 'start' }), text(330, 98, 't', { italic: true }),
  ]),
  doppler: draw(380, 290, 'Wave crests emitted by a sound source moving to the right at constant speed. The circles are crowded together on the right side, where observer A stands, and spread apart on the left side, where observer B stands', [
    ...[0, 1, 2, 3].map(i => ['circle', 160 + 18 * i, 145, 34 * (4 - i)]), ['circle', 232, 145, 6, { fill: PINK, color: PINK }], ['arrow', 240, 145, 270, 145, { color: PINK }],
    text(352, 150, 'A', { bold: true }), text(10, 150, 'B', { bold: true, anchor: 'start' }),
  ]),
  polarizers: draw(380, 150, 'Unpolarized light of intensity I₀ passes through two ideal polarizing filters. The first filter has a vertical transmission axis, and the second filter has its axis at 60 degrees to the first', [
    ['arrow', 14, 75, 80, 75], text(40, 64, 'I₀', { size: 12 }), ['rect', 100, 25, 40, 100, { fill: true }], ['line', 120, 35, 120, 115, { width: 2.4 }],
    ['arrow', 150, 75, 210, 75], ['rect', 230, 25, 40, 100, { fill: true }], ['line', r2(250 - 40 * Math.sin(Math.PI / 3)), r2(75 + 40 * Math.cos(Math.PI / 3)), r2(250 + 40 * Math.sin(Math.PI / 3)), r2(75 - 40 * Math.cos(Math.PI / 3)), { width: 2.4 }],
    ['arrow', 280, 75, 350, 75], text(250, 142, '60° from vertical', { size: 11 }), text(120, 142, 'vertical', { size: 11 }),
  ]),
  levels: draw(340, 230, 'Energy-level diagram for hydrogen. The ground state, n = 1, is at −13.6 eV; n = 2 is at −3.40 eV; n = 3 is at −1.51 eV; n = 4 is at −0.85 eV; and the ionization level, n = ∞, is at 0 eV', [
    // Level heights are spread out for legibility rather than drawn to scale.
    ...[[0, 'n = ∞', '0 eV', 30], [-0.85, 'n = 4', '−0.85 eV', 66], [-1.51, 'n = 3', '−1.51 eV', 90], [-3.4, 'n = 2', '−3.40 eV', 128], [-13.6, 'n = 1', '−13.6 eV', 210]].flatMap(([e, n, lab, y]) => {
      return [['line', 90, y, 250, y, { width: e ? 2.2 : 1.4, dash: !e }], text(80, y + 4, n, { anchor: 'end', size: 11 }), text(260, y + 4, lab, { anchor: 'start', size: 11 })];
    }),
  ]),
  photo: graph({ x: [0, 12], y: [0, 3], xstep: 2, ystep: 1, xlabel: '', ylabel: '', xtitle: 'Frequency of light (×10¹⁴ Hz)', ytitle: 'Maximum kinetic energy (eV)', w: 370,
    curves: [{ pts: [[5, 0], [12, 2.9]] }, { pts: [[7, 0], [12, 2.07]], color: PINK }], notes: [{ x: 10.2, y: 2.6, text: 'metal A' }, { x: 11, y: 1.4, text: 'metal B' }],
    alt: 'Graph of the maximum kinetic energy of photoelectrons versus the frequency of light for two metals. Both graphs are straight lines with the same slope. The line for metal A meets the frequency axis at 5.0 × 10¹⁴ Hz, and the line for metal B meets it at 7.0 × 10¹⁴ Hz' }),
  decay: graph({ x: [0, 20], y: [0, 800], xstep: 5, ystep: 200, xlabel: '', ylabel: '', xtitle: 'Time (days)', ytitle: 'Undecayed nuclei', w: 370,
    curves: [{ fn: t => 800 * Math.pow(0.5, t / 5), from: 0, to: 20 }], dots: [{ x: 0, y: 800 }, { x: 5, y: 400 }, { x: 10, y: 200 }],
    alt: 'Graph of the number of undecayed nuclei in a radioactive sample versus time. The number starts at 800, falls to 400 at 5 days and to 200 at 10 days, and continues to decrease exponentially toward zero' }),
};

const source = String.raw`
@ 5 | q | Refraction | refraction
Light in air strikes the glass surface shown at an angle of incidence of \(30^\circ\). What is the angle of refraction in the glass?
* About \(19.5^\circ\)
- About \(48.6^\circ\)
- \(20^\circ\)
- \(45^\circ\)
= Snell's law gives \(\sin\theta_2=\dfrac{n_1\sin\theta_1}{n_2}=\dfrac{(1.00)(0.50)}{1.50}=0.333\), so \(\theta_2\approx 19.5^\circ\). Light bends toward the normal on entering the denser medium; inverting the ratio gives \(48.6^\circ\).

@ 5 | c | Refraction | refraction
As the light shown passes from air into the glass, how do its frequency, speed, and wavelength change?
* The frequency stays the same, while the speed and the wavelength both decrease.
- All three decrease.
- The frequency decreases, the speed decreases, and the wavelength stays the same.
- The speed decreases, and the frequency and the wavelength increase.
= The frequency is set by the source and cannot change at a boundary, or crests would pile up there. The speed drops by a factor of \(n\), and since \(v=f\lambda\), the wavelength drops by the same factor.

@ 5 | q | Speed of light in a medium
What is the speed of light in glass with an index of refraction of \(1.50\)? Use \(c=3.00\times 10^8\text{ m/s}\).
* \(2.00\times 10^8\text{ m/s}\)
- \(4.50\times 10^8\text{ m/s}\)
- \(3.00\times 10^8\text{ m/s}\)
- \(1.50\times 10^8\text{ m/s}\)
= \(v=\dfrac{c}{n}=\dfrac{3.00\times 10^8}{1.50}=2.00\times 10^8\text{ m/s}\). Light always travels more slowly in a material than in vacuum.

@ 5 | q | Total internal reflection | tir
What is the critical angle for light traveling from the glass shown into air?
* About \(41.8^\circ\)
- About \(48.2^\circ\)
- About \(33.7^\circ\)
- \(90^\circ\)
= At the critical angle the refracted ray grazes the surface, so \(n_1\sin\theta_c=n_2\sin 90^\circ\) and \(\sin\theta_c=\dfrac{1.00}{1.50}\), giving \(\theta_c\approx 41.8^\circ\).

@ 5 | c | Total internal reflection | tir
The ray shown strikes the glass–air boundary at an angle of incidence of \(50^\circ\). What happens to it?
* All of it is reflected back into the glass, because the angle of incidence exceeds the critical angle.
- It refracts into the air, bending away from the normal.
- It refracts into the air, bending toward the normal.
- It travels along the boundary between the glass and the air.
= The critical angle for glass of index 1.50 is about \(41.8^\circ\). At any larger angle of incidence, Snell's law would require \(\sin\theta_2>1\), which is impossible, so no light is transmitted.

@ 5 | c | Total internal reflection
An optical fiber has a glass core surrounded by a cladding layer. Which condition is necessary for light to be trapped in the core by total internal reflection?
* The core must have a greater index of refraction than the cladding.
- The cladding must have a greater index of refraction than the core.
- The core and the cladding must have the same index of refraction.
- The light must enter the fiber along the normal to its surface.
= Total internal reflection occurs only when light travels toward a medium with a smaller index of refraction, at an angle of incidence greater than the critical angle.

@ 5 | q | Thin lenses | lens
The object shown is \(30\text{ cm}\) from a converging lens with a focal length of \(10\text{ cm}\). Where is the image?
* \(15\text{ cm}\) from the lens, on the side opposite the object
- \(15\text{ cm}\) from the lens, on the same side as the object
- \(20\text{ cm}\) from the lens, on the side opposite the object
- \(7.5\text{ cm}\) from the lens, on the side opposite the object
= The thin-lens equation gives \(\dfrac{1}{d_i}=\dfrac{1}{10}-\dfrac{1}{30}=\dfrac{2}{30}\), so \(d_i=15\text{ cm}\). The positive value means a real image on the far side of the lens.

@ 5 | q | Magnification | lens
The object shown is \(4.0\text{ cm}\) tall, and its image forms \(15\text{ cm}\) from the lens. What is the height of the image?
* \(2.0\text{ cm}\), inverted
- \(2.0\text{ cm}\), upright
- \(8.0\text{ cm}\), inverted
- \(4.0\text{ cm}\), inverted
= The magnification is \(M=-\dfrac{d_i}{d_o}=-\dfrac{15}{30}=-0.50\), so the image is \(0.50(4.0)=2.0\text{ cm}\) tall. The negative sign indicates that it is inverted.

@ 5 | c | Image characteristics | lens
Which describes the image formed in the ray diagram shown?
* Real, inverted, and smaller than the object
- Virtual, upright, and larger than the object
- Real, upright, and smaller than the object
- Virtual, inverted, and the same size as the object
= The rays actually meet on the far side of the lens, so the image is real and could be projected on a screen. It lies below the axis, so it is inverted, and it is half the object's height.

@ 5 | c | Thin lenses | lens
The object shown is moved to a point \(5\text{ cm}\) from the lens, inside its focal length. Which describes the new image?
* Virtual, upright, enlarged, and on the same side of the lens as the object
- Real, inverted, enlarged, and on the opposite side of the lens
- Real, upright, and reduced, on the opposite side of the lens
- No image forms, because the object is inside the focal length
= Inside the focal length, refracted rays diverge, and they appear to come from a point behind the object. The lens equation gives \(d_i=-10\text{ cm}\) and \(M=+2\): a magnifying glass.

@ 5 | c | Image formation by lenses | lens
The lower half of the lens shown is covered with black paper. What happens to the image?
* The whole image still forms, but it is dimmer.
- Only the upper half of the image forms.
- Only the lower half of the image forms.
- No image forms.
= Every part of the lens receives light from every point of the object. Blocking half of the lens blocks half of the light from each point, so the complete image forms with less brightness.

@ 5 | q | Spherical mirrors | mirror
The object shown is \(15\text{ cm}\) in front of a concave mirror with a focal length of \(10\text{ cm}\). Where is the image, and what is the magnification?
* \(30\text{ cm}\) in front of the mirror, with a magnification of \(-2\)
- \(30\text{ cm}\) behind the mirror, with a magnification of \(+2\)
- \(6.0\text{ cm}\) in front of the mirror, with a magnification of \(-0.4\)
- \(25\text{ cm}\) in front of the mirror, with a magnification of \(-1.7\)
= \(\dfrac{1}{d_i}=\dfrac{1}{10}-\dfrac{1}{15}=\dfrac{1}{30}\), so \(d_i=30\text{ cm}\), a real image in front of the mirror, and \(M=-\dfrac{30}{15}=-2\).

@ 5 | q | Spherical mirrors
An object is placed \(10\text{ cm}\) in front of a concave mirror whose radius of curvature is \(40\text{ cm}\). What are the image distance and the magnification?
* \(-20\text{ cm}\), with a magnification of \(+2\)
- \(+20\text{ cm}\), with a magnification of \(-2\)
- \(+13\text{ cm}\), with a magnification of \(-1.3\)
- \(-10\text{ cm}\), with a magnification of \(+1\)
= The focal length is half the radius, \(20\text{ cm}\). Then \(\dfrac{1}{d_i}=\dfrac{1}{20}-\dfrac{1}{10}=-\dfrac{1}{20}\), so \(d_i=-20\text{ cm}\): a virtual, upright image twice as tall, as in a makeup mirror.

@ 5 | q | Plane mirrors
A person walks toward a plane mirror at \(1.0\text{ m/s}\). At what rate does the person approach their own image?
* \(2.0\text{ m/s}\)
- \(1.0\text{ m/s}\)
- \(0.50\text{ m/s}\)
- \(0\)
= The image is always as far behind the mirror as the person is in front of it. Both distances shrink at \(1.0\text{ m/s}\), so the distance between them shrinks at \(2.0\text{ m/s}\).

@ 5 | c | Convex mirrors
Why are convex mirrors used as security mirrors in stores?
* They always form upright, reduced, virtual images, which show a wide field of view.
- They always form enlarged images, so that small details are visible.
- They form real images, which can be projected on screens.
- They form inverted images, which are easier to interpret.
= A diverging mirror spreads reflected rays, so for any object position the image is virtual, upright, and smaller. Shrinking the image lets a wide area fit in the mirror.

@ 5 | q | Diverging lenses
An object is \(30\text{ cm}\) from a diverging lens with a focal length of \(-15\text{ cm}\). What are the image distance and the magnification?
* \(-10\text{ cm}\), with a magnification of \(+\tfrac{1}{3}\)
- \(+30\text{ cm}\), with a magnification of \(-1\)
- \(-30\text{ cm}\), with a magnification of \(+1\)
- \(+10\text{ cm}\), with a magnification of \(-\tfrac{1}{3}\)
= \(\dfrac{1}{d_i}=-\dfrac{1}{15}-\dfrac{1}{30}=-\dfrac{3}{30}\), so \(d_i=-10\text{ cm}\), and \(M=-\dfrac{-10}{30}=+\tfrac{1}{3}\). A diverging lens alone always gives a virtual, upright, reduced image.

@ 5 | c | Lenses in different media
A glass lens with an index of refraction of \(1.50\) is moved from air into water, which has an index of \(1.33\). How does its focal length change?
* It increases, because light bends less at the surfaces when the indices are closer together.
- It decreases, because water slows light.
- It stays the same, because the focal length depends only on the lens's shape.
- The lens becomes diverging.
= Refraction at each surface depends on the difference between the indices of the lens and its surroundings. In water that difference is smaller, so the lens bends light less and focuses farther away; it would diverge only if the surroundings had the greater index.

@ 5 | q | Refraction
Light in water, with an index of refraction of \(1.33\), strikes a flat glass surface, with an index of \(1.50\), at an angle of incidence of \(40^\circ\). What is the angle of refraction?
* About \(35^\circ\)
- About \(47^\circ\)
- \(40^\circ\)
- About \(25^\circ\)
= \(\sin\theta_2=\dfrac{1.33\sin 40^\circ}{1.50}=\dfrac{1.33(0.643)}{1.50}\approx 0.570\), so \(\theta_2\approx 35^\circ\). The light bends toward the normal because it enters a medium with a greater index.

@ 5 | c | Dispersion
White light passing through a glass prism separates into colors, with violet light bending more than red light. What causes this?
* The index of refraction of glass is slightly greater for violet light than for red light.
- The prism adds color to the white light.
- Violet light travels faster in glass than red light.
- Red light reflects inside the prism, but violet light does not.
= Dispersion occurs because the index of refraction depends on wavelength. Shorter wavelengths, such as violet, travel more slowly in glass and refract through larger angles.

@ 5 | q | Law of reflection
A ray of light strikes a plane mirror, making an angle of \(35^\circ\) with the mirror's surface. What is the angle of reflection?
* \(55^\circ\)
- \(35^\circ\)
- \(70^\circ\)
- \(110^\circ\)
= Angles in optics are measured from the normal. The angle of incidence is \(90^\circ-35^\circ=55^\circ\), and the angle of reflection equals it.

@ 5 | c | Law of reflection
Two plane mirrors meet at a right angle. A ray reflects off one mirror and then off the other. Which describes the final ray?
* It travels parallel to the incoming ray, in the opposite direction.
- It travels in the same direction as the incoming ray.
- It is perpendicular to the incoming ray.
- Its direction depends on where it strikes the first mirror.
= Two reflections from perpendicular mirrors reverse the ray's component along each mirror's normal, sending it back antiparallel. Corner reflectors on bicycles and on the Moon use this property.

@ 5 | q | Thin lenses
An object is \(24\text{ cm}\) from a converging lens with a focal length of \(12\text{ cm}\). Which describes the image?
* It is \(24\text{ cm}\) from the lens, inverted, and the same size as the object.
- It is \(12\text{ cm}\) from the lens, inverted, and half the size of the object.
- It is \(24\text{ cm}\) from the lens, upright, and the same size as the object.
- It forms at infinity.
= With the object at \(2f\), the lens equation gives \(d_i=24\text{ cm}\) and \(M=-1\). An object at the focal point would form an image at infinity.

@ 5 | c | Thin lenses
An object starts far from a converging lens and moves toward the lens, stopping just outside the focal point. How does its real image change?
* It moves farther from the lens and becomes larger.
- It moves closer to the lens and becomes smaller.
- It moves closer to the lens and becomes larger.
- It stays at the focal point and becomes larger.
= A very distant object forms a small image near the focal point. As the object nears \(f\), \(d_i\) grows without bound, and the magnification \(\dfrac{d_i}{d_o}\) grows with it.

@ 5 | q | Thin lenses
An object is \(20\text{ cm}\) from a converging lens, and a real image forms \(60\text{ cm}\) beyond the lens. What is the focal length of the lens?
* \(15\text{ cm}\)
- \(40\text{ cm}\)
- \(80\text{ cm}\)
- \(30\text{ cm}\)
= \(\dfrac{1}{f}=\dfrac{1}{20}+\dfrac{1}{60}=\dfrac{4}{60}\), so \(f=15\text{ cm}\). The magnification is \(-3\).

@ 5 | c | Refraction
A straw in a glass of water appears bent at the water's surface. Which statement best explains this?
* Light from the submerged part bends away from the normal as it leaves the water, so it appears to come from a point higher than the straw's actual position.
- Light from the submerged part bends toward the normal as it leaves the water.
- Water magnifies objects by reflecting light.
- The straw actually bends because of water pressure.
= Rays traveling from water into air refract away from the normal. The eye traces them back in straight lines, so the submerged part of the straw appears raised and the straw seems bent.

@ 5 | q | Total internal reflection
What is the critical angle for light going from diamond, with an index of refraction of \(2.42\), into air?
* About \(24^\circ\)
- About \(66^\circ\)
- About \(42^\circ\)
- About \(12^\circ\)
= \(\sin\theta_c=\dfrac{1}{2.42}\approx 0.413\), so \(\theta_c\approx 24^\circ\). The small critical angle traps light inside a cut diamond through many internal reflections, which makes it sparkle.

@ 5 | c | Refraction | refraction
The glass shown is replaced by a material with a greater index of refraction, and the angle of incidence is unchanged. How does the refracted ray change?
* It bends closer to the normal.
- It bends farther from the normal.
- It does not change, because the angle of incidence is the same.
- It is totally reflected.
= Snell's law gives \(\sin\theta_2=\dfrac{\sin\theta_1}{n_2}\), so a larger \(n_2\) makes \(\theta_2\) smaller. Total internal reflection cannot happen for light entering a medium with a greater index.

@ 5 | q | Wavelength in a medium
Light with a wavelength of \(600\text{ nm}\) in air enters glass with an index of refraction of \(1.50\). What is its wavelength in the glass?
* \(400\text{ nm}\)
- \(900\text{ nm}\)
- \(600\text{ nm}\)
- \(300\text{ nm}\)
= The frequency stays the same while the speed is divided by \(n\), so \(\lambda=\dfrac{600}{1.50}=400\text{ nm}\).

@ 6 | q | Wave properties | waveSnap
The wave shown has a frequency of \(5.0\text{ Hz}\). What is its speed?
* \(2.0\text{ m/s}\)
- \(4.0\text{ m/s}\)
- \(0.25\text{ m/s}\)
- \(0.080\text{ m/s}\)
= The pattern repeats every \(0.40\text{ m}\), so \(\lambda=0.40\text{ m}\) and \(v=f\lambda=(5.0)(0.40)=2.0\text{ m/s}\). Reading the length of the whole graph as the wavelength gives \(4.0\text{ m/s}\).

@ 6 | c | Motion of a medium | waveSnap
The wave shown travels to the right. At the instant shown, in which direction is the string at point Q moving?
* Upward
- Downward
- To the right
- It is momentarily at rest.
= As the wave moves right, the crest at P will soon arrive at Q's position, so Q must be rising. Points on a transverse wave move perpendicular to the wave's direction, and Q, at zero displacement, has its greatest speed.

@ 6 | c | Wave speed
The frequency of a wave generator attached to a stretched string is doubled, and the tension is unchanged. How do the speed and wavelength of the waves change?
* The speed stays the same, and the wavelength is halved.
- The speed doubles, and the wavelength stays the same.
- The speed and the wavelength both double.
- The speed is halved, and the wavelength stays the same.
= The speed of a wave on a string depends only on the tension and the mass per unit length. With \(v\) fixed, \(\lambda=\dfrac{v}{f}\) is halved.

@ 6 | q | Wave speed
The tension in a string is quadrupled. By what factor does the speed of waves on the string change?
* It doubles.
- It quadruples.
- It is halved.
- It increases by a factor of 16.
= The wave speed is \(v=\sqrt{\dfrac{F_T}{\mu}}\), so multiplying the tension by 4 multiplies the speed by \(\sqrt{4}=2\).

@ 6 | q | Standing waves | standing
What is the wavelength of the standing wave shown?
* \(0.80\text{ m}\)
- \(0.40\text{ m}\)
- \(1.2\text{ m}\)
- \(3.6\text{ m}\)
= Each loop is half a wavelength. Three loops span \(1.2\text{ m}\), so \(\tfrac{3}{2}\lambda=1.2\text{ m}\) and \(\lambda=0.80\text{ m}\). The length of one loop, \(0.40\text{ m}\), is half the wavelength.

@ 6 | q | Standing waves | standing
Waves travel at \(120\text{ m/s}\) on the string shown. What is the fundamental frequency of the string?
* \(50\text{ Hz}\)
- \(150\text{ Hz}\)
- \(100\text{ Hz}\)
- \(300\text{ Hz}\)
= The fundamental has one loop, so \(\lambda_1=2L=2.4\text{ m}\) and \(f_1=\dfrac{120}{2.4}=50\text{ Hz}\). The pattern shown is the third harmonic, at \(150\text{ Hz}\).

@ 6 | c | Standing waves | standing
How many nodes and antinodes does the standing wave shown have, counting the fixed ends?
* 4 nodes and 3 antinodes
- 3 nodes and 4 antinodes
- 2 nodes and 3 antinodes
- 3 nodes and 3 antinodes
= Nodes lie at both fixed ends and at the two points where the loops meet. Each of the three loops has one antinode at its center, where the string oscillates with the largest amplitude.

@ 6 | q | Standing waves in pipes | pipe
The tube shown is closed at one end and open at the other. The speed of sound is \(340\text{ m/s}\). What is the frequency of its lowest resonance?
* \(100\text{ Hz}\)
- \(200\text{ Hz}\)
- \(400\text{ Hz}\)
- \(50\text{ Hz}\)
= The closed end is a displacement node and the open end an antinode, so the tube holds a quarter wavelength: \(\lambda=4L=3.4\text{ m}\) and \(f=\dfrac{340}{3.4}=100\text{ Hz}\).

@ 6 | c | Standing waves in pipes | pipe
Which frequencies can resonate in the tube shown, if its lowest resonant frequency is \(f_1\)?
* Only odd multiples of \(f_1\), such as \(3f_1\) and \(5f_1\)
- All whole-number multiples of \(f_1\)
- Only even multiples of \(f_1\)
- Only \(f_1\)
= Each resonance must have a node at the closed end and an antinode at the open end. That requires an odd number of quarter wavelengths in the tube, so only odd harmonics occur.

@ 6 | q | Standing waves in pipes
A pipe \(0.85\text{ m}\) long is open at both ends, and the speed of sound is \(340\text{ m/s}\). What is its fundamental frequency?
* \(200\text{ Hz}\)
- \(100\text{ Hz}\)
- \(400\text{ Hz}\)
- \(290\text{ Hz}\)
= Both ends are antinodes, so the fundamental is half a wavelength: \(\lambda=2L=1.7\text{ m}\) and \(f=\dfrac{340}{1.7}=200\text{ Hz}\), twice the fundamental of a pipe of the same length closed at one end.

@ 6 | q | Double-slit interference | doubleSlit
In the setup shown, \(d=0.10\text{ mm}\), \(L=2.0\text{ m}\), and the light has a wavelength of \(600\text{ nm}\). What is the distance on the screen between adjacent bright fringes?
* \(12\text{ mm}\)
- \(1.2\text{ mm}\)
- \(3.0\text{ mm}\)
- \(120\text{ mm}\)
= For small angles, the spacing is \(\Delta y=\dfrac{\lambda L}{d}=\dfrac{(600\times 10^{-9})(2.0)}{1.0\times 10^{-4}}=0.012\text{ m}\).

@ 6 | c | Double-slit interference | doubleSlit
In the setup shown, the slits are moved closer together and everything else is unchanged. How does the fringe pattern change?
* The fringes spread farther apart.
- The fringes move closer together.
- The fringes stay the same.
- The bright fringes disappear.
= The fringe spacing is \(\dfrac{\lambda L}{d}\), so a smaller slit separation means a larger spacing. Closer slits need a larger angle to produce the same path difference.

@ 6 | c | Path difference | doubleSlit
Point P in the diagram is at the first bright fringe above the central maximum. How does the distance from P to the lower slit compare with the distance from P to the upper slit?
* It is greater by one wavelength.
- It is greater by half a wavelength.
- The distances are equal.
- It is greater by two wavelengths.
= Bright fringes occur where the path difference is a whole number of wavelengths, so the waves arrive in phase. The central maximum has zero path difference, and a half-wavelength difference gives a dark fringe.

@ 6 | q | Diffraction gratings
Light with a wavelength of \(500\text{ nm}\) strikes a diffraction grating with \(500\) lines per millimeter. At what angle is the first-order maximum?
* About \(14.5^\circ\)
- About \(30^\circ\)
- About \(1.4^\circ\)
- About \(75.5^\circ\)
= The line spacing is \(d=\dfrac{1}{500}\text{ mm}=2.0\times 10^{-6}\text{ m}\). Then \(\sin\theta=\dfrac{\lambda}{d}=0.25\), and \(\theta\approx 14.5^\circ\).

@ 6 | c | Diffraction gratings
How does the pattern from a diffraction grating with thousands of slits compare with the pattern from two slits with the same spacing?
* The bright maxima are at the same angles but are much narrower and brighter.
- The maxima are at larger angles and are broader.
- The pattern is the same.
- The grating produces only one bright spot.
= The positions of the maxima depend only on the spacing, \(d\sin\theta=m\lambda\). With many slits, waves cancel almost completely except very near those angles, giving sharp, bright lines useful for measuring wavelengths.

@ 6 | q | Thin-film interference | thinFilm
A soap film like the one shown has an index of refraction of \(1.33\). What is the smallest nonzero thickness \(t\) for which light with a wavelength of \(532\text{ nm}\) in air strongly reflects?
* \(100\text{ nm}\)
- \(200\text{ nm}\)
- \(133\text{ nm}\)
- \(400\text{ nm}\)
= Ray 1 is inverted on reflection from the denser film, while ray 2 is not. Constructive interference therefore requires an extra path of half a wavelength in the film: \(2t=\dfrac{\lambda}{2n}\), so \(t=\dfrac{532}{4(1.33)}=100\text{ nm}\).

@ 6 | c | Thin-film interference | thinFilm
Just before a soap bubble pops, its film becomes much thinner than the wavelength of visible light, and the film appears black in reflected light. Why?
* Only one of the two reflected rays is inverted, so with almost no extra path they cancel for every color.
- A very thin film absorbs all of the light.
- Both reflected rays are inverted, so they cancel.
- The thin film transmits no light.
= With negligible path difference, the only difference between rays 1 and 2 is the half-cycle shift of ray 1 at the denser film. The rays are out of phase for all wavelengths, so little light is reflected.

@ 6 | c | Doppler effect | doppler
The diagram shows sound waves from a moving source. How do the frequencies heard by observers A and B compare with the frequency emitted by the source?
* A hears a higher frequency and B hears a lower frequency.
- A hears a lower frequency and B hears a higher frequency.
- Both hear the emitted frequency, because the speed of sound is constant.
- Both hear a higher frequency, because the source is moving.
= The source moves toward A, so the crests reaching A are closer together and arrive more often. Behind the source, at B, the crests are spread apart and arrive less often.

@ 6 | c | Doppler effect | doppler
For the moving source shown, how does the speed of the sound waves reaching observer A compare with the speed of the waves reaching observer B?
* The speeds are equal.
- The waves reaching A are faster.
- The waves reaching B are faster.
- The waves reaching A are faster by exactly the speed of the source.
= Once emitted, sound travels at a speed set by the air, not by the source. The source's motion changes the spacing of the crests and so the wavelength and frequency, but not the wave speed.

@ 6 | q | Sound intensity
A small speaker radiates sound equally in all directions. A listener moves from \(2.0\text{ m}\) to \(4.0\text{ m}\) from the speaker. By what factor does the sound intensity change?
* It is reduced to one quarter.
- It is halved.
- It is reduced to one eighth.
- It does not change.
= The power spreads over a sphere of area \(4\pi r^2\), so intensity is proportional to \(\dfrac{1}{r^2}\). Doubling the distance divides it by 4.

@ 6 | c | Waves at boundaries
A sound wave travels from air into water, in which sound travels about four times as fast. How do its frequency and wavelength change?
* The frequency stays the same, and the wavelength increases.
- The frequency increases, and the wavelength stays the same.
- Both increase.
- The frequency stays the same, and the wavelength decreases.
= The frequency is fixed by the source and does not change at a boundary. Since \(\lambda=\dfrac{v}{f}\), the wavelength increases in proportion to the speed.

@ 6 | q | Beats
Two tuning forks with frequencies of \(440\text{ Hz}\) and \(444\text{ Hz}\) sound together. What beat frequency is heard?
* \(4\text{ Hz}\)
- \(442\text{ Hz}\)
- \(884\text{ Hz}\)
- \(2\text{ Hz}\)
= The loudness rises and falls at the difference of the two frequencies, \(444-440=4\text{ Hz}\). The tone heard is at the average, \(442\text{ Hz}\).

@ 6 | c | Polarization
Which statement explains why sound waves in air cannot be polarized but light waves can?
* Sound in air is a longitudinal wave, and only transverse waves have an oscillation direction that can be restricted.
- Sound waves are too slow to be polarized.
- Sound waves have wavelengths that are too long.
- Light waves travel through a medium, and sound waves do not.
= Polarization selects one direction of oscillation perpendicular to the direction of travel. A longitudinal wave oscillates only along its direction of travel, so there is nothing to select.

@ 6 | q | Polarization | polarizers
Unpolarized light of intensity \(I_0\) passes through the two polarizers shown. What is the intensity of the light that emerges?
* \(\dfrac{I_0}{8}\)
- \(\dfrac{I_0}{4}\)
- \(\dfrac{I_0}{2}\)
- \(\dfrac{3I_0}{8}\)
= The first polarizer passes half of unpolarized light. The second passes the fraction \(\cos^2 60^\circ=\tfrac{1}{4}\) of that, by Malus's law, leaving \(\dfrac{I_0}{8}\).

@ 6 | c | Superposition
Two pulses of equal shape and size but opposite displacement travel toward each other on a string. At the instant they exactly overlap, the string is straight. Which statement is correct at that instant?
* The energy of the pulses is still present, as kinetic energy of the moving string.
- The pulses have destroyed each other, and their energy has been lost.
- The pulses have reflected from each other.
- The string is at rest everywhere.
= Displacements add, so the string is flat, but its velocities do not cancel: the segments are moving fastest. The pulses then pass through each other and continue unchanged.

@ 6 | c | Diffraction
Light passes through a single narrow slit and forms a pattern on a distant screen. The slit is made narrower. How does the central bright band change?
* It becomes wider.
- It becomes narrower.
- It stays the same width.
- It splits into two bands.
= The first dark fringes lie at \(\sin\theta=\dfrac{\lambda}{a}\), where \(a\) is the slit width. A narrower slit diffracts light into a wider angle.

@ 6 | q | Electromagnetic waves
What is the wavelength of a radio wave with a frequency of \(100\text{ MHz}\)? Use \(c=3.0\times 10^8\text{ m/s}\).
* \(3.0\text{ m}\)
- \(0.33\text{ m}\)
- \(3.0\times 10^{6}\text{ m}\)
- \(30\text{ m}\)
= \(\lambda=\dfrac{c}{f}=\dfrac{3.0\times 10^8}{1.0\times 10^8}=3.0\text{ m}\). All electromagnetic waves travel at \(c\) in vacuum.

@ 6 | c | Reflection of pulses
A pulse traveling along a string reaches an end that is tied firmly to a wall. Which describes the reflected pulse?
* It is inverted and travels back along the string.
- It is upright and travels back along the string.
- It passes into the wall, and nothing is reflected.
- It is inverted and stays at the wall.
= At a fixed end, the string pulls up on the wall, and the wall pulls down on the string. That reaction produces an inverted pulse. A free end reflects the pulse upright.

@ 7 | q | Atomic energy levels | levels
What is the wavelength of the photon emitted when a hydrogen atom moves from \(n=3\) to \(n=2\)? Use \(hc=1240\text{ eV}\cdot\text{nm}\).
* About \(656\text{ nm}\)
- About \(365\text{ nm}\)
- About \(122\text{ nm}\)
- About \(821\text{ nm}\)
= The photon energy is \(-1.51-(-3.40)=1.89\text{ eV}\), and \(\lambda=\dfrac{1240}{1.89}\approx 656\text{ nm}\), the red line in the visible hydrogen spectrum.

@ 7 | q | Ionization energy | levels
What is the least energy needed to ionize a hydrogen atom in its ground state?
* \(13.6\text{ eV}\)
- \(10.2\text{ eV}\)
- \(3.40\text{ eV}\)
- \(0\text{ eV}\)
= Ionization lifts the electron from \(-13.6\text{ eV}\) to \(0\text{ eV}\), where it is no longer bound. The energy \(10.2\text{ eV}\) only raises it to \(n=2\).

@ 7 | c | Emission spectra | levels
A sample of hydrogen atoms is excited to the \(n=4\) level. As the electrons return to the ground state, how many different photon energies can be emitted?
* 6
- 3
- 4
- 10
= Any two of the four levels can be connected by a transition: 4 to 3, 2, or 1; 3 to 2 or 1; and 2 to 1. That gives \(\binom{4}{2}=6\) distinct energies.

@ 7 | c | Absorption spectra | levels
Hydrogen atoms in the ground state are illuminated by photons of \(10.2\text{ eV}\) and photons of \(11.0\text{ eV}\). Which photons are absorbed?
* Only the \(10.2\text{ eV}\) photons, because only they match the energy difference between two levels
- Both kinds, because each has enough energy to reach \(n=2\)
- Only the \(11.0\text{ eV}\) photons, because they have more energy
- Neither kind, because both have less than \(13.6\text{ eV}\)
= A photon is absorbed only if its whole energy equals the difference between two levels. No level lies \(11.0\text{ eV}\) above the ground state, so those photons pass through. A colliding electron, by contrast, can give up part of its energy.

@ 7 | q | Emission spectra | levels
What is the longest wavelength of light emitted by hydrogen atoms in transitions that end in the ground state? Use \(hc=1240\text{ eV}\cdot\text{nm}\).
* About \(122\text{ nm}\)
- About \(91\text{ nm}\)
- About \(656\text{ nm}\)
- About \(103\text{ nm}\)
= The longest wavelength corresponds to the smallest energy, the \(10.2\text{ eV}\) transition from \(n=2\) to \(n=1\): \(\dfrac{1240}{10.2}\approx 122\text{ nm}\), in the ultraviolet. The value \(91\text{ nm}\) is the shortest wavelength, from ionization.

@ 7 | q | Photoelectric effect | photo
Based on the graph, what is the work function of metal A? Use \(h=4.14\times 10^{-15}\text{ eV}\cdot\text{s}\).
* About \(2.1\text{ eV}\)
- About \(2.9\text{ eV}\)
- About \(5.0\text{ eV}\)
- About \(0.83\text{ eV}\)
= The work function is the photon energy at the threshold frequency: \(hf_0=(4.14\times 10^{-15})(5.0\times 10^{14})\approx 2.1\text{ eV}\). On the graph it is the magnitude of the line's vertical intercept if extended to zero frequency.

@ 7 | c | Photoelectric effect | photo
Why are the two lines on the graph parallel?
* The slope of each line is Planck's constant, which is the same for every metal.
- Both metals have the same work function.
- Both metals were illuminated with the same intensity.
- The slope is the electron's charge, which is the same for both metals.
= Einstein's equation, \(K_{\max}=hf-\phi\), is a line with slope \(h\) and an intercept set by the work function. Different metals shift the line without changing its slope.

@ 7 | q | Photoelectric effect | photo
Light with a frequency of \(1.0\times 10^{15}\text{ Hz}\) shines on metal B. What is the maximum kinetic energy of the emitted electrons? Use \(h=4.14\times 10^{-15}\text{ eV}\cdot\text{s}\).
* About \(1.2\text{ eV}\)
- About \(4.1\text{ eV}\)
- About \(2.1\text{ eV}\)
- No electrons are emitted.
= The threshold of metal B is \(7.0\times 10^{14}\text{ Hz}\), so \(K_{\max}=h(f-f_0)=(4.14\times 10^{-15})(3.0\times 10^{14})\approx 1.2\text{ eV}\).

@ 7 | c | Photoelectric effect | photo
Light with a frequency of \(6.0\times 10^{14}\text{ Hz}\) shines on metal B, and no electrons are emitted. The intensity of the light is then greatly increased. What happens?
* Still no electrons are emitted, because each photon has less energy than the work function.
- Electrons are emitted, because more energy reaches the metal.
- Electrons are emitted after a delay, once enough energy builds up.
- Electrons are emitted with greater kinetic energy.
= Each electron absorbs a single photon, whose energy \(hf\) depends only on frequency. Below the threshold, no single photon can free an electron, however many photons arrive. This result contradicted the classical wave model of light.

@ 7 | c | Photoelectric effect | photo
Light above the threshold frequency shines on metal A, and its intensity is doubled while its frequency is unchanged. What happens to the photoelectrons?
* Twice as many are emitted per second, with the same maximum kinetic energy.
- The same number are emitted, with twice the maximum kinetic energy.
- Twice as many are emitted, each with twice the maximum kinetic energy.
- No change occurs.
= Doubling intensity at fixed frequency doubles the number of photons, and so the number of electrons freed. Each photon still carries \(hf\), so the maximum kinetic energy is unchanged.

@ 7 | q | Photon energy
What is the energy of a photon of light with a wavelength of \(500\text{ nm}\)? Use \(hc=1240\text{ eV}\cdot\text{nm}\).
* About \(2.5\text{ eV}\)
- About \(0.40\text{ eV}\)
- About \(6.2\times 10^{5}\text{ eV}\)
- About \(5.0\text{ eV}\)
= \(E=\dfrac{hc}{\lambda}=\dfrac{1240}{500}\approx 2.5\text{ eV}\). Shorter wavelengths carry more energy per photon.

@ 7 | q | Matter waves
What is the de Broglie wavelength of an electron moving at \(1.0\times 10^6\text{ m/s}\)? Use \(h=6.63\times 10^{-34}\text{ J}\cdot\text{s}\) and \(m_e=9.11\times 10^{-31}\text{ kg}\).
* About \(7.3\times 10^{-10}\text{ m}\)
- About \(7.3\times 10^{-4}\text{ m}\)
- About \(1.4\times 10^{9}\text{ m}\)
- About \(6.0\times 10^{-28}\text{ m}\)
= \(\lambda=\dfrac{h}{mv}=\dfrac{6.63\times 10^{-34}}{(9.11\times 10^{-31})(1.0\times 10^6)}\approx 7.3\times 10^{-10}\text{ m}\), comparable to the spacing of atoms in a crystal.

@ 7 | c | Wave–particle duality
A beam of electrons passing through a thin crystal produces a pattern of bright and dark rings on a screen. What does this demonstrate?
* Electrons have wave properties, because the pattern results from interference.
- Electrons are particles, because they hit the screen at points.
- The crystal emits light when struck by electrons.
- Electrons have no mass.
= Rings of constructive and destructive interference are a signature of waves. The Davisson–Germer experiment confirmed de Broglie's prediction that matter has a wavelength \(\dfrac{h}{p}\).

@ 7 | c | Compton scattering
When an X-ray photon scatters off a nearly free electron, the scattered photon has a longer wavelength than the incident photon. What does this show?
* Photons carry momentum and energy, and they transfer some of each to the electron in a collision.
- X-rays slow down when they scatter.
- The electron emits a second photon of longer wavelength.
- Light is purely a wave.
= Compton treated the scattering as a particle collision. The electron recoils and gains energy, so the photon's energy \(\dfrac{hc}{\lambda}\) decreases and its wavelength increases.

@ 7 | q | Photon momentum
What is the momentum of a photon with a wavelength of \(663\text{ nm}\)? Use \(h=6.63\times 10^{-34}\text{ J}\cdot\text{s}\).
* \(1.0\times 10^{-27}\text{ kg}\cdot\text{m/s}\)
- \(1.0\times 10^{-36}\text{ kg}\cdot\text{m/s}\)
- \(4.4\times 10^{-40}\text{ kg}\cdot\text{m/s}\)
- \(3.0\times 10^{-19}\text{ kg}\cdot\text{m/s}\)
= \(p=\dfrac{h}{\lambda}=\dfrac{6.63\times 10^{-34}}{6.63\times 10^{-7}}=1.0\times 10^{-27}\text{ kg}\cdot\text{m/s}\). Leaving the wavelength in nanometers gives the second value.

@ 7 | q | Half-life | decay
According to the graph, how many undecayed nuclei remain after \(15\) days?
* \(100\)
- \(200\)
- \(267\)
- \(50\)
= The number falls by half every \(5\) days: \(800\) to \(400\) to \(200\) to \(100\) after three half-lives. Dividing \(800\) by the three half-lives gives \(267\), which treats decay as linear.

@ 7 | q | Half-life | decay
For the sample graphed, what fraction of the original nuclei remains after \(20\) days?
* \(\dfrac{1}{16}\)
- \(\dfrac{1}{4}\)
- \(\dfrac{1}{8}\)
- \(0\)
= Twenty days is four half-lives, so the fraction is \(\left(\tfrac{1}{2}\right)^4=\dfrac{1}{16}\), or \(50\) nuclei. The amount approaches zero but never reaches it.

@ 7 | c | Nuclear decay | decay
Which statement about the decay of the sample graphed is correct?
* The probability that any given nucleus decays in the next day is constant, but which nuclei decay cannot be predicted.
- The nuclei decay one after another in a fixed order.
- The half-life shortens as fewer nuclei remain.
- All of the nuclei will have decayed after \(10\) days.
= Radioactive decay is random for individual nuclei. Because each nucleus has the same constant chance of decaying per unit time, a large sample decays exponentially with a fixed half-life.

@ 7 | q | Alpha decay
Uranium-238, \(^{238}_{92}\text{U}\), undergoes alpha decay. What is the resulting nucleus?
* \(^{234}_{90}\text{Th}\)
- \(^{234}_{92}\text{U}\)
- \(^{238}_{90}\text{Th}\)
- \(^{236}_{91}\text{Pa}\)
= An alpha particle, \(^{4}_{2}\text{He}\), carries away 4 nucleons and 2 protons. The mass number falls to 234 and the atomic number to 90, which is thorium.

@ 7 | q | Beta decay
Carbon-14, \(^{14}_{6}\text{C}\), undergoes beta-minus decay. What is the resulting nucleus?
* \(^{14}_{7}\text{N}\)
- \(^{14}_{5}\text{B}\)
- \(^{13}_{6}\text{C}\)
- \(^{10}_{4}\text{Be}\)
= In beta-minus decay, a neutron becomes a proton and an electron is emitted. The mass number stays 14, and the atomic number rises from 6 to 7, which is nitrogen.

@ 7 | c | Beta decay
Which process occurs inside a nucleus during beta-minus decay?
* A neutron changes into a proton, emitting an electron and an antineutrino.
- A proton changes into a neutron, emitting an electron.
- An electron orbiting the atom falls into the nucleus.
- The nucleus emits a helium nucleus.
= The emitted electron is created in the decay; it was not in the nucleus beforehand. The antineutrino carries away part of the energy, which is why beta electrons have a range of energies.

@ 7 | q | Mass–energy equivalence
How much energy is released if \(1.0\text{ g}\) of mass is converted entirely into energy? Use \(c=3.0\times 10^8\text{ m/s}\).
* \(9.0\times 10^{13}\text{ J}\)
- \(9.0\times 10^{16}\text{ J}\)
- \(3.0\times 10^{5}\text{ J}\)
- \(3.0\times 10^{8}\text{ J}\)
= \(E=mc^2=(1.0\times 10^{-3}\text{ kg})(3.0\times 10^8)^2=9.0\times 10^{13}\text{ J}\). Using \(1.0\text{ kg}\) instead of grams gives \(9.0\times 10^{16}\text{ J}\).

@ 7 | q | Binding energy
The mass of a helium-4 nucleus is less than the total mass of its separate protons and neutrons by \(0.0304\text{ u}\). What is its binding energy? \((1\text{ u}\) corresponds to \(931.5\text{ MeV})\)
* About \(28.3\text{ MeV}\)
- About \(7.1\text{ MeV}\)
- About \(931.5\text{ MeV}\)
- About \(0.0304\text{ MeV}\)
= The mass defect times \(931.5\text{ MeV/u}\) gives \(0.0304(931.5)\approx 28.3\text{ MeV}\). Dividing by the four nucleons gives about \(7.1\text{ MeV}\) per nucleon.

@ 7 | c | Fission and fusion
Both the fission of uranium and the fusion of hydrogen release energy. Which statement explains why?
* In both, the products have a greater binding energy per nucleon than the reactants, so their total mass is less.
- In both, the total number of nucleons decreases.
- Fission releases energy, and fusion only absorbs it.
- In both, mass is created from energy.
= Binding energy per nucleon peaks near iron. Splitting heavy nuclei or joining light nuclei moves toward that peak, and the decrease in mass appears as released energy, \(\Delta E=\Delta mc^2\).

@ 7 | c | Gamma decay
How does gamma decay change a nucleus?
* It lowers the nucleus's energy without changing its atomic number or mass number.
- It lowers the atomic number by 2 and the mass number by 4.
- It raises the atomic number by 1.
- It changes a proton into a neutron.
= A gamma ray is a high-energy photon emitted as an excited nucleus moves to a lower energy state, much as an atom emits light. Photons carry no charge or nucleons.

@ 7 | c | Conservation in nuclear reactions
Which quantities must be the same before and after every nuclear reaction?
* Total charge and total number of nucleons
- Total number of protons and total number of neutrons separately
- Total rest mass
- Total number of particles
= Charge and nucleon number are always conserved, which is how missing products are identified. Protons and neutrons can convert into each other in beta decay, and rest mass changes as energy is released.

@ 7 | q | Blackbody radiation
The spectrum of a star peaks at a wavelength of \(500\text{ nm}\). Using Wien's law with \(b=2.9\times 10^{-3}\text{ m}\cdot\text{K}\), what is the star's surface temperature?
* About \(5800\text{ K}\)
- About \(1.5\times 10^{-9}\text{ K}\)
- About \(580\text{ K}\)
- About \(1.7\times 10^{5}\text{ K}\)
= Wien's law gives \(T=\dfrac{b}{\lambda_{\max}}=\dfrac{2.9\times 10^{-3}}{5.0\times 10^{-7}}\approx 5800\text{ K}\), close to the Sun's surface temperature.

@ 7 | c | Blackbody radiation
The temperature of a glowing object is increased. How does its emitted spectrum change?
* The peak shifts to shorter wavelengths, and more radiation is emitted at every wavelength.
- The peak shifts to longer wavelengths, and less radiation is emitted.
- The peak stays fixed, and only the total intensity increases.
- The object emits only one wavelength at higher temperatures.
= Hotter objects glow from red toward white and blue. Explaining the shape of this spectrum led Planck to propose that energy is emitted in quanta.
`;

module.exports = { source, figures };
