# Implementation Plan: Guest Resume Builder (Revised)

## Overview
Clean up the guest experience:
- **No autosave** for guests — show "Not saved" indicator
- **Navigation warning** — custom modal "You will lose changes" with Save/Discard
- **Save/PDF flow** — single click → Google login card → after login → auto-save to DB / show download modal

---

## Changes Summary

### 1. Remove Guest Autosave (`ResumeBuilder.tsx`)

**Current:** Autosave saves to localStorage every 2s for guests  
**New:** No autosave for guests. Only autosave for logged-in users.

```typescript
// In the autosave useEffect (line ~313), add user check:
useEffect(() => {
  if (booting || !isDirty || !resume || !user) return; // <-- add !user
  // ... existing autosave logic
}, [resume, isDirty, booting, save, user]);
```

Also update `save()` to NOT save to localStorage — instead just set `isDirty = true` and show toast "Sign in to save your resume".

### 2. Update `SaveStatus` for Guests

**Current:** Shows "Unsaved changes" (amber)  
**New:** For guests, show a more prominent "Not saved — Sign in to save" indicator

```tsx
const SaveStatus = () => {
  if (!user && isDirty) {
    return <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
      <Clock size={12}/> Not saved — <button onClick={() => setShowSavePrompt(true)} className="underline">Sign in</button>
    </span>;
  }
  // ... existing logic for logged-in users
};
```

### 3. Remove localStorage Guest Code

Remove `saveGuestResume()`, `loadGuestResume()`, `clearGuestResume()` from ResumeBuilder — no longer needed since we're not persisting guest data.

Keep the guest load effect that creates a fresh starter template in memory (no localStorage).

### 4. Update `save()` Function for Guests

When guest clicks Save button → show SavePromptModal (login card) instead of saving.

```typescript
const save = useCallback(async (draft = resume, isAuto = false) => {
  if (!draft) return;
  
  // Guest: show login prompt instead of saving
  if (!user) {
    if (!isAuto) setShowSavePrompt(true);
    return;
  }
  
  // Logged-in: save to server (existing logic)
  setSaving(true);
  try {
    await resumeApi.update(draft._id, toDraft(draft));
    setIsDirty(false);
    setSavedAt(new Date());
    if (!isAuto) toast.success('Resume saved');
    if (isAuto && !firstAutosaveToastShown.current) {
      firstAutosaveToastShown.current = true;
      toast.success('Resume autosaved');
    }
  } catch {
    toast.error('Could not save the resume');
  } finally {
    setSaving(false);
  }
}, [resume, user]);
```

### 5. Update PDF Button for Guests

When guest clicks PDF → show SavePromptModal instead of DownloadModal.

```tsx
<button className="resume-tool" onClick={() => {
  if (!user) {
    setShowSavePrompt(true); // Show login card
  } else {
    setShowDownloadModal(true); // Show existing download modal
  }
}}>
  <Printer size={16}/> PDF
</button>
```

### 6. Update `SavePromptModal` Component

Refactor to be a **single-purpose Google login card**:
- Title: "Sign in to save your resume"
- Subtitle: "Your work will be lost if you leave without saving."
- Single "Sign in with Google" button
- "Continue without saving" link (for discard)

### 7. Update Navigation Guard ("My resumes" link)

Keep existing behavior — when guest with unsaved changes clicks "My resumes":
- Show SavePromptModal
- On "Sign in with Google" → save resume to DB after login
- On "Continue without saving" → clear and navigate

### 8. Update `beforeunload` for Guests

Keep browser warning for guests with unsaved changes (existing behavior is fine).

---

## File Changes

| File | Change |
|------|--------|
| `client/components/resume-builder/ResumeBuilder.tsx` | Remove localStorage autosave, update save(), update PDF button, update SaveStatus |
| `client/components/resume-builder/SavePromptModal.tsx` | Simplify to single Google login card |
| `client/app/login/page.tsx` | Keep existing returnUrl + migration logic |
| `client/contexts/AuthContext.tsx` | Keep existing migrateGuestResume |

---

## User Flow

### Guest clicks "Save":
1. SavePromptModal appears → "Sign in to save your resume"
2. Click "Sign in with Google" → Google OAuth
3. After login → `migrateGuestResume()` saves to DB
4. Redirect back to builder → resume saved, `isDirty = false`

### Guest clicks "PDF":
1. SavePromptModal appears → "Sign in to save your resume"
2. Click "Sign in with Google" → Google OAuth
3. After login → `migrateGuestResume()` saves to DB
4. Redirect back → DownloadModal opens automatically

### Guest clicks "My resumes" / navigates away:
1. SavePromptModal appears → "You will lose changes"
2. "Sign in with Google" → saves & navigates
3. "Continue without saving" → clears & navigates

### Guest closes browser:
1. Browser `beforeunload` warning (existing)
