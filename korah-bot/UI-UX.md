# UI/UX Design Guidelines for Korah Projects
## Core Concepts (Most Important)
These are the fundamental principles to always keep in mind:
1. **Test Colors in Both Themes** - Never assume, always verify
2. **Use Rem Units** - Accessibility and consistency
3. **Keep Essential Controls Visible** - Don't hide, scale instead
4. **Single Scroll Container** - Prevent multiple scrollbars
5. **Smooth Animations** - Match the flow, not too much
6. **Clean Organized Code** - CSS variables, grouping, comments
---
## Design Philosophy
### Core Values
- **30 Years Experience**: Design with expert-level attention to flow, spacing, and visual hierarchy
- **User-Centric**: Prioritize clarity, readability, and ease of use
- **Consistency**: Maintain visual and behavioral consistency across all components
- **Responsiveness**: Ensure seamless experience across all screen sizes
- **As the Head of UI/UX**: Make decisions that would make great designers proud

## Collaboration Guidelines
- Don't just execute - also think strategially and discuss tradeoffs
- If there's a better way to do something, recommend it
- If something could be improved, point it out and discuss
- Ask questions when unclear, don't assume
- Share thoughts on design decisions, not just implement them

### Color Palette
- **Primary Purple Theme**: `#8b5cf6` (p4), `#7c3aed` (p5), `#a78bfa` (highlight)
- **Dark Mode Background**: `#06040f`, `#0d0920`, `#120c28`
- **Light Mode Background**: `#faf8ff`, `#f3efff`, `#ebe5ff`
- **Text (Dark)**: `#f0eaff` (primary), `#a89dc0` (secondary), `#6b5f88` (tertiary)
- **Text (Light)**: `#1a0a3c` (primary), `#5a4a7a` (secondary)
---

## CSS Architecture

### Units
- **Always use rem units** - Never use px for sizing (except maybe 1px borders)
- Example: `padding: 1rem`, `gap: 0.5rem`, `margin: 3.5rem`

### CSS Variables
Define theme-related variables at the top:
```css
:root {
  --bg: #06040f;
  --sf: rgba(18, 12, 40, 0.7);
  --sf2: rgba(30, 18, 60, 0.6);
  --bd: rgba(139, 92, 246, 0.2);
  --tx: #f0eaff;
  --tx2: #a89dc0;
  --tx3: #6b5f88;
  --p4: #8b5cf6;
  --p5: #a78bfa;
}

Dark/Light Mode
html[data-theme="dark"] { /* dark mode variables */ }
html[data-theme="light"] { /* light mode variables */ }
---

Layout Structure
IMPORTANT - Layout Varies Per Project: These are examples of what we did for the SAT player. Layouts will DIFFER based on what you specifically want for each project. Always ask for the exact layout requirements.
Fixed Navbar (Topbar)
.sat-player-topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

Fixed Footer
.sat-player-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

Content Area (Between Navbar/Footer)
.sat-shell .main-content {
  max-height: calc(100vh - 3.5rem - 4rem);
  overflow-y: auto;
}

---
Responsive Breakpoints
IMPORTANT - Breakpoints May Vary: These are EXAMPLE breakpoints we used. Breakpoints will DIFFER based on what you want for each project.
Breakpoint	Purpose
768px	Collapse navbar icons, show more menu
480px	Further compact timer/buttons
360px	Ultra-compact for smallest screens
---
Dropdown Menu Patterns
Structure
<div class="more-dropdown-menu">
  <ul class="more-dropdown-list">
    <li><a class="more-dropdown-item">Option</a></li>
  </ul>
</div>
Key Properties
.more-dropdown-menu {
  position: absolute;
  top: calc(100% + 0.375rem);
  right: 0;
  z-index: 1200;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.more-dropdown-menu.more-dropdown-open {
  opacity: 1;
  visibility: visible;
}

Mobile Dropdown
@media (max-width: 768px) {
  .more-dropdown-menu {
    position: fixed;
    bottom: 3rem;
    left: 0.5rem;
    right: 0.5rem;
    background: var(--sf);
  }
}
---
Animations & Interactions
IMPORTANT - Match the Page Flow: These are EXAMPLE animations. Animations should ALWAYS match the flow and feel of the SPECIFIC page. Keep them smooth, natural, and not too much.

Hover Effects
.more-dropdown-item:hover {
  background: var(--sf2);
  transform: translateX(0.125rem);
}

.more-dropdown-item:hover::before {
  transform: scaleY(1);
}

Transitions
- Use cubic-bezier(0.4, 0, 0.2, 1) for smooth UI transitions
- Duration: 0.15s - 0.25s for micro-interactions
- Duration: 0.3s - 0.5s for larger animations
---
Color Visibility Rules
Text Contrast
- Always ensure text is visible in both dark and light modes
- Use fallback colors: color: var(--tx, #f0eaff);
- Test in both themes before committing
Component Colors
Component	Dark Mode
Primary text	#f0eaff
Secondary text	#a89dc0
Muted text	#6b5f88
Accent	#a78bfa
Background	#06040f
---

## Code Organization
### Guidelines
- Group related styles together logically
- Use CSS variables for theming values
- Order properties consistently (display → sizing → colors → typography → animations)
- Keep code clean and efficient
- Comment when there's a non-obvious reason for a decision (explain WHY, not WHAT)

### Best Practices
- Use proper indentation and formatting
- Avoid unnecessary `!important` flags
- Remove duplicate/redundant code
- Test styles in multiple browsers
---

VERY IMPORTANT: Read AGENT.md First
Before making changes to any project, read AGENT.md for commit message formats, code style requirements, and workflow standards.
---

Summary Checklist
- [ ] Colors tested in both themes
- [ ] Rem units used (not px)
- [ ] Essential controls visible at all sizes
- [ ] Only one scroll container (optional)
- [ ] Smooth animations matching the flow
- [ ] Organized, clean CSS
- [ ] No unnecessary !important flags
- [ ] Commented where needed
---

Reflection Questions
Use these questions to guide design decisions:
Colors
- Did I test this color in both dark and light modes?
- Is the text readable against each background?
Layout
- Will this work at all screen sizes?
- Are all essential controls visible?
Code
- Am I using rem units?
- Is there a simpler way to achieve this?
User Experience
- Does this animation enhance or distract?
- Is the flow natural and intuitive?
- Would this feel polished and professional?
Questions
- Can I make this even more amazing? Not just decent but amazing? 
- Can I suggest anything to try to improve anything or make it way better?
- Is there anything that needs to be addressed to the one using me?
### Collaborative Reflection Questions
Use these to think critically and collaborate with the user:
- Is this the best approach, or is there a simpler way?
- What did we learn from this that we should apply going forward?
- Are there any improvements you'd like to discuss?
- Does this match the overall design philosophy?
- What tradeoffs did we make, and are they worth it?
- Is there anything that feels off or could be better?
- Did we test this in all use cases (dark/light, mobile, etc.)?
- What would make this excellent vs just adequate?