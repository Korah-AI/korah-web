# AP Question Bank Specification

Status: MVP implementation in progress  
Owner: Daniel  
Last updated: 2026-10-08

## Decision summary

Build the AP question bank inside the existing `korah-bot/ap/` area. The first
release will use original Korah-written multiple-choice questions aligned to the
public AP course frameworks. Every question must carry source, license, and
review metadata before it can be marked ready.

Do not scrape AP Classroom, recalled exam questions, locked teacher resources,
or commercial textbooks. Public access is not the same as permission to copy.
College Board materials may guide course scope, unit names, skills, timing, and
format, but their questions should not be imported without written permission.

## Goals

- Give students a filterable bank by course, unit, difficulty, and calculator
  policy.
- Show immediate answer feedback and a useful explanation.
- Reuse the current AP visual system, course catalog, math rendering, and future
  progress storage.
- Make question provenance visible and machine-checkable.
- Let contributors add questions without editing application code.
- Support source-specific importers later without creating a general-purpose
  textbook scraper.

## Non-goals for the first release

- Copying official AP multiple-choice questions.
- Recreating the secure AP Classroom question bank.
- AI-generating and publishing questions without human review.
- Full adaptive practice, teacher assignments, or production analytics.
- Supporting every AP course during the MVP.

## Source policy

### Preferred sources

1. **Original Korah questions.** Write new questions using the AP course
   framework for alignment. This is the default and lowest-risk source.
2. **CC BY 4.0 material.** Adapt only when the exact page or asset is clearly
   licensed. Store the author, original URL, license URL, and a note describing
   the changes. CC BY permits reuse and adaptation with attribution.
3. **Verified public-domain material.** Government data, maps, speeches, and
   other primary sources can be used as stimuli only after checking the exact
   item. Content merely hosted on a government site is not automatically public
   domain.
4. **Contributor submissions.** Accept only with an explicit statement that the
   contributor created the question and licenses Korah to publish and modify it.

### Sources that need caution

- OpenStax books are useful starting points, but licensing can vary by book and
  component. Check the license on the exact book and asset before adapting it.
- MIT OpenCourseWare is generally CC BY-NC-SA. Its noncommercial and share-alike
  terms can restrict future product use, so it is not approved for the MVP.
- OER catalogs and GitHub repositories are discovery tools, not blanket
  licenses. Review the license and provenance for the exact item.

### Prohibited sources

- AP Classroom questions, progress checks, secure practice exams, or screenshots.
- Recalled, leaked, or reconstructed live AP exam questions.
- Commercial textbooks, test-prep books, or answer keys without written permission.
- Questions with missing, conflicting, or unverifiable license information.
- AI output that closely reproduces a source question or has not been checked by
  a human reviewer.

### Required disclaimer

The student page must state that the questions are original practice aligned to
AP course topics and that Korah is not affiliated with or endorsed by College
Board.

## MVP scope

The first version supports:

- AP Calculus AB
- AP United States History
- Original sample MCQs stored as JSON
- Course, unit, and difficulty filters
- Answer selection, checking, explanations, and session accuracy
- KaTeX rendering for math
- A validator that blocks incomplete provenance and review metadata

The MVP sample questions remain visibly labeled as drafts until a subject-matter
reviewer approves them. Drafts are useful for validating the interface but
should not be counted as a production question inventory.

## Student flow

1. Open `ap/questions.html` from AP Prep.
2. Select a course.
3. Narrow by unit or difficulty if desired.
4. Choose an answer and check it.
5. Read the explanation and source note.
6. Move to the next matching question or randomize the order.

The page is intentionally usable without authentication. A later release can
save attempts when `korahReady` supplies an authenticated user.

## Data layout

Each course stores one file at:

```text
ap/data/{course-slug}/questions.json
```

Top-level shape:

```json
{
  "schemaVersion": 1,
  "course": "ap-calculus-ab",
  "title": "AP Calculus AB Question Bank",
  "alignmentSources": [
    {
      "name": "College Board AP Calculus AB Course",
      "url": "https://apcentral.collegeboard.org/courses/ap-calculus-ab",
      "use": "Unit names, skills, and exam weighting only"
    }
  ],
  "questions": []
}
```

Question shape:

```json
{
  "id": "calc-ab-bank-u1-001",
  "status": "draft",
  "unit": "unit-1",
  "unitLabel": "Limits and Continuity",
  "topic": "Evaluating limits",
  "skills": ["procedural"],
  "difficulty": "easy",
  "calculator": "prohibited",
  "stem": "What is ...?",
  "choices": [
    { "key": "A", "text": "..." },
    { "key": "B", "text": "..." },
    { "key": "C", "text": "..." },
    { "key": "D", "text": "..." }
  ],
  "answer": "C",
  "explanation": "...",
  "source": {
    "origin": "original",
    "name": "Korah original practice",
    "url": "",
    "license": "Korah original content",
    "licenseUrl": "",
    "attribution": "Written for Korah; not an official AP question.",
    "adaptationNotes": ""
  },
  "review": {
    "status": "draft",
    "reviewedBy": "",
    "reviewedAt": ""
  }
}
```

Optional `stimulus` and `assets` fields can be added in phase two. Every asset
must include meaningful alternative text and the same provenance fields as the
question.

## Validation rules

`scripts/validate-ap-question-bank.js` enforces the following:

- Stable, unique question IDs.
- Exactly four choices with unique A through D keys.
- The answer matches one declared choice.
- Required course, unit, difficulty, calculator, explanation, source, and review
  fields.
- Balanced inline math delimiters.
- Non-original items include an absolute source URL, license, license URL, and
  attribution.
- Ready items have a named reviewer and review date.

Validation should run in CI once the MVP branch is integrated.

Run it locally with:

```text
node scripts/validate-ap-question-bank.js
node --test scripts/validate-ap-question-bank.test.js
```

## Editorial workflow

1. Add a source to the allowlist or choose `original`.
2. Draft the question in the course JSON file.
3. Run the validator.
4. Have a subject-matter reviewer check correctness, ambiguity, AP alignment,
   explanation quality, and difficulty.
5. Have a second reviewer confirm source and license metadata for adapted items.
6. Set `review.status` and `status` to `ready` only after both checks pass.
7. Preview the question in light and dark themes before merging.

AI may help draft original questions, distractors, and explanations, but a human
must verify every answer. Do not prompt an AI to imitate or transform a specific
copyrighted question.

## Importer plan

Do not build one crawler that accepts arbitrary URLs. Build a small importer per
approved source with these safeguards:

- Domain allowlist and fixed URL patterns.
- Stored retrieval date and content hash.
- License assertion at import time.
- Raw source kept out of the public bundle when its license does not permit
  redistribution.
- Output always enters as `draft`.
- Duplicate detection using normalized stem text and source URL.

The first useful importer should target a clearly licensed OpenStax book after
the exact edition and component license are approved. It should create draft
records for editors, not publish directly.

## Later phases

### Phase 2

- Add stimulus passages, tables, graphs, and accessible images.
- Save attempts to Firestore and feed AP progress analytics.
- Add bookmarks, missed-question review, and unit-level accuracy.
- Add an editor-only preview mode for draft questions.

### Phase 3

- Add teacher collections and assignments.
- Add more AP courses through per-course catalogs.
- Add reviewed source-specific importers.
- Add duplicate and near-duplicate detection.

## Acceptance criteria

- The question bank is reachable from the AP landing page.
- Both MVP courses load without authentication.
- Filters update the visible count and question order.
- Checking an answer shows correctness and an explanation.
- Math renders correctly and the page works on mobile.
- Every checked-in question passes the validator.
- The UI clearly labels draft content and includes the affiliation disclaimer.
- No AP Classroom or unlicensed textbook content is stored in the repository.

## Research references

- College Board AP Services Terms and Conditions:
  https://apcentral.collegeboard.org/media/pdf/ap-services-terms-conditions.pdf
- College Board AP Classroom overview:
  https://apcentral.collegeboard.org/instructional-resources/ap-classroom
- College Board AP permission request instructions:
  https://privacy.collegeboard.org/copyright-trademark/request-instructions
- College Board AP Calculus AB course framework page:
  https://apcentral.collegeboard.org/courses/ap-calculus-ab
- OpenStax College Algebra licensing statement:
  https://openstax.org/books/college-algebra/pages/preface
- Creative Commons Attribution 4.0 summary:
  https://creativecommons.org/licenses/by/4.0/
- MIT OpenCourseWare terms:
  https://ocw.mit.edu/pages/privacy-and-terms-of-use/
- USAGov guidance on federal materials and copyright:
  https://www.usa.gov/government-copyright

This document is a product and engineering policy, not legal advice. If Korah
plans to commercialize a bank containing adapted content, get a formal license
review first.
