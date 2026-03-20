# Korah Web Update 1.1: Study Creation Flow Redesign

## Overview
Replace modal-based creation flow with dedicated HTML pages for each study type. Keep the creation-modal as a pop-up wizard that redirects to appropriate pages. Remove all other modals and reimplement their functionality inline.

## 1. New Page Architecture

### 1.1 Create Three Creation-Only Pages
- `/study/flashcards.html` - Creation form for flashcard sets
- `/study/guide.html` - Creation form for study guides  
- `/study/test-create.html` - Creation form for practice tests (separate from existing `test.html` which is the player)

### 1.2 Page Structure (Common Layout)
Each page will include:
- **Header**: Title, back button to feed
- **Method Tabs**: Manual, AI from Prompt, AI from Documents (switchable)
- **Common Metadata Fields**: Title, Subject, Description, Tags
- **Method-Specific Content**: Dynamic form based on selected method
- **Action Buttons**: Create/Generate, Cancel

### 1.3 Method Auto-Selection via Query Parameter
- Creation-modal will redirect to `/study/{type}.html?method={method}`
- Page loads with corresponding tab active and form open

## 2. Creation-Modal Modifications

### 2.1 Keep as Pop-Up Wizard
- Modal remains for selecting study type and creation method
- After selection, redirect to appropriate page instead of showing form within modal
- Update modal footer buttons to trigger redirect instead of showing step 2

### 2.2 Redirect Logic
```javascript
// After type and method selection
const pageMap = {
  flashcards: 'flashcards.html',
  studyGuide: 'guide.html', 
  practiceTest: 'test-create.html'
};
window.location.href = `${pageMap[type]}?method=${method}`;
```

## 3. Form Components per Creation Method

### 3.1 Manual Creation Form
**Flashcards:**
- Card editor with front/back textareas
- Add/remove card buttons
- Minimum 2 cards validation

**Study Guide:**
- Markdown editor (textarea with preview optional)
- No special validation beyond required content

**Practice Test:**
- Question editor with type selection (MCQ/Open-ended)
- For MCQ: option fields + correct answer selection
- For Open-ended: answer field
- Add/remove question buttons

### 3.2 AI from Prompt Form
**All Types:**
- Prompt textarea (required)
- Title, Subject, Tags fields
- Generate button that calls `KorahStudyAPI.generateStudyContent()`
- Loading indicator during generation

**Practice Test Specific:**
- Additional configuration: total questions, MCQ count, Open-ended count
- These fields visible only for practice test page

### 3.3 AI from Documents Form
**All Types:**
- Document upload zone (drag & drop or click)
- Support for PDF, TXT, Images (max 5 files)
- File list with preview and remove buttons
- Generate button
- Title, Subject, Tags fields

**Practice Test Specific:**
- Same configuration as AI from Prompt

## 4. Removal of Modals

### 4.1 Modals to Remove
1. **Rename Modal** - Replace with inline rename button + `prompt()` or custom dialog
2. **Delete Modal** - Replace with inline delete button + `confirm()` dialog
3. **Settings Modal** - Move to separate settings page or remove entirely
4. **Test Setup Modal** - Move configuration fields directly to test-create.html
5. **Guide Reader Modal** - Replace with side panel or embedded viewer
6. **Item Edit Modal** - Replace with inline editing on dedicated pages

### 4.2 Inline Implementation Strategy
- On feed.html cards: Add rename/delete buttons with simple confirm dialogs
- On item detail pages: Add edit buttons that expand inline forms
- Use browser `prompt()` and `confirm()` for simplicity, or create lightweight custom dialogs

## 5. Feed.html Updates

### 5.1 Replace Modal Triggers
- Remove modal references in sidebar.js
- Add inline event handlers for rename/delete
- Update card rendering to include action buttons

### 5.2 New Card Actions
```html
<div class="feed-card-actions">
  <button class="rename-btn" data-id="${id}">Rename</button>
  <button class="delete-btn" data-id="${id}">Delete</button>
  <button class="duplicate-btn" data-id="${id}">Duplicate</button>
</div>
```

### 5.3 Event Handlers
```javascript
// Rename
function handleRename(itemId, currentName) {
  const newName = prompt('Enter new name:', currentName);
  if (newName && newName.trim()) {
    // Update in Firestore
  }
}

// Delete  
function handleDelete(itemId, itemName) {
  if (confirm(`Delete "${itemName}"? This cannot be undone.`)) {
    // Delete from Firestore
  }
}
```

## 6. Navigation Updates

### 6.1 Sidebar Links
- Add links to three new creation pages
- Keep existing feed.html link
- Ensure proper active state styling

### 6.2 Breadcrumb Navigation
- Each creation page should have breadcrumb: Study > Create [Type]
- Back button returns to feed.html

## 7. Data Flow

### 7.1 Creation Flow
1. User clicks "Create Study Item" on feed.html
2. Creation-modal opens (type + method selection)
3. On selection, redirect to `/study/{type}.html?method={method}`
4. Page loads with method form open
5. User fills form, clicks Create/Generate
6. Item saved to Firestore, redirect to feed.html or item detail

### 7.2 API Integration
- Reuse existing `KorahStudyAPI.generateStudyContent()` for AI generation
- Use existing `KorahDB` functions for CRUD operations
- Maintain consistent data model across all pages

## 8. Implementation Steps

### Phase 1: Create New Pages
1. Create `flashcards.html` with method tabs and manual form
2. Create `guide.html` with method tabs and manual form  
3. Creation `test-create.html` with method tabs and manual form + test config
4. Add AI generation forms to each page
5. Add document upload forms to each page

### Phase 2: Modify Creation-Modal
1. Update modal to redirect instead of showing step 2
2. Remove step 2 content from modal
3. Update modal footer buttons

### Phase 3: Remove Modals
1. Remove modal HTML from feed.html, test.html, etc.
2. Implement inline rename/delete on feed.html cards
3. Update sidebar.js to remove modal functions
4. Move test configuration to test-create.html

### Phase 4: Update Navigation
1. Add new links to sidebar
2. Update breadcrumb navigation
3. Test all navigation flows

### Phase 5: Testing & Refinement
1. Test each creation flow end-to-end
2. Verify AI generation works
3. Ensure mobile responsiveness
4. Fix any layout issues

## 9. Technical Considerations

### 9.1 Code Reuse
- Extract common form components into shared JS/CSS
- Create utility functions for validation, API calls
- Reuse existing styling classes from current modals

### 9.2 Performance
- Lazy load AI generation scripts
- Optimize file upload handling
- Cache frequently used elements

### 9.3 Accessibility
- Ensure proper ARIA labels
- Keyboard navigation support
- Screen reader compatibility

## 10. Risks & Mitigations

### 10.1 Risk: Breaking Existing Functionality
- **Mitigation**: Keep test.html unchanged, create new file
- Test thoroughly before removing modals

### 10.2 Risk: Data Loss During Migration
- **Mitigation**: No data migration needed, existing data structure unchanged
- New pages use same Firestore collections

### 10.3 Risk: User Confusion
- **Mitigation**: Clear navigation, breadcrumbs, back buttons
- Gradual rollout with feature flags if possible