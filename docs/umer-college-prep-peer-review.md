# Peer Review: Umer's College Prep Essay Annotator


Umer has built a genuinely solid piece of UI , and the AI prompts are well thought out. The annotator is easy to follow and thoughtfully styled.


### 1. Essays aren't saved ?

The store module defines a save function, but nothing in the app ever calls it. There is no save button, no autosave, and no write to the essays collection anywhere in the repository. The practical result is that the library page reads from a location that nothing ever writes to, so the essay list will always show the empty state. The load-by-id path in the editor is equally unused, and the entire store module is effectively dead code.

### 2. Reopening an analyzed essay shows a blank review panel

When the editor loads an existing essay, it only fills in the text. It never re-renders the scores or the recommendation cards, so even if an essay were successfully saved along with its analysis, a student coming back to it later would see the text but an empty review panel. I guess you could re-render it but this is just a small critique.

# more critiques -  from agent 

**The focus note pass will probably return nothing.** The focus and selection functions expect a plain JSON array back from the model, but every request is sent with JSON object mode enabled. The model tends to wrap its answer in an object in that mode, so the check for an array fails and the function quietly returns an empty list. The fix is to accept both a bare array and an object that wraps an array. The same risk applies to the scoring response.


## Minor

On the library page, the card title shows the raw school key rather than the school's proper name, so a school like MIT displays as "Mit". The primary action buttons use a small upward nudge on hover, whereas the house convention calls for scale instead. The Firebase configuration block is copy-pasted across both main pages. And the scoring prompt includes a line telling the model to use a temperature of zero, which is a parameter, not an instruction the model can act on; harmless, but slightly odd.

## Strengths

This is a really nice tool and I think is very well built, main fixes I would say are really minor and just little bugs. Fire. 