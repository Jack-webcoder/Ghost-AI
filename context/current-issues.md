Review the editor workspace implementation and fix the following components/editor` first. Do not break existing
issues. Check features.
## Issues
I
### 1. Save Button in Workspace Navbar
Read the navbar component and the autosave hook before implementing.
The workspace navbar is missing a Save button. The autosave hook already exists and tracks saving/saved/error states - wire the button to it.
Add the Save button to the workspace navbar only. The navbar is shared with editor home so conditionally render the button based on workspace context - it must not appear on the editor home navbar.
Button behavior:
- default state: shows "Save"
- while saving: shows "Saving..."
after successful save: shows "Saved" briefly then returns to "Save"
- on error: shows "Error" briefly then returns to "Save"
-clicking it triggers a manual save through the same save function the autosave hook uses
Also fix the canvas save API route. Open the route file at `app/api/projects/[projectId]/canvas/routelts` and make
these two changes:
- in the PUT handler change `access: "public"` to `access: "private"` in the Vercel Blob put call
in the GET handler replace any raw fetch call with the Vercel Blob SDK to retrieve the blob content using the stored URL
Do not change anything else.
### 2. Delete Nodes and Edges
Read Liveblocks agent skills before implementing this. Then read the canvas wrapper component and the existing node and edge mutation helpers.
Selected nodes and edges cannot be deleted from the canvas.