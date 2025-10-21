# Keyboard Shortcuts Guide

Complete keyboard navigation for lightning-fast Sudoku solving!

## 🎯 Quick Navigation

### Direct Cell Selection (Two-Key Sequence)
**Jump to any cell instantly without clicking:**

1. Press a **column letter** (A-I)
2. Press a **row number** (1-9)

**Example:**
- Press `D` → Shows "Go to: D_" indicator
- Press `4` → Cell D4 is selected
- Now type `7` to fill it, or use arrow keys to move

**Features:**
- ✅ Works when no cell is selected
- ✅ Visual feedback shows your progress
- ✅ 3-second timeout auto-resets buffer
- ✅ Press `ESC` to cancel anytime

---

### "G" Command (Vim-style)
**Enter goto mode from anywhere:**

- Press `G` → Clears selection and activates goto mode
- Then use two-key sequence (Letter + Number)

**Example:**
1. Press `G` → Deselects current cell
2. Press `A` → Shows "Go to: A_"
3. Press `1` → Jumps to A1

Perfect when you have a cell selected and want to jump elsewhere!

---

## 🎮 Movement

| Action | Keys |
|--------|------|
| **Navigate cells** | `↑` `↓` `←` `→` |
| **Deselect cell** | `ESC` |
| **Jump to cell** | `Letter + Number` (e.g., `D4`) |
| **Goto mode** | `G` |

---

## ✏️ Input

| Action | Keys |
|--------|------|
| **Fill cell** | `1-9` |
| **Clear cell** | `Delete` or `Backspace` |

---

## 💡 Help

| Action | Keys |
|--------|------|
| **Show keyboard shortcuts** | `?` |
| **Close help** | `ESC` or `?` again |

---

## 🚀 Pro Tips

### Speed Solving Workflow
```
1. Press G → Enter goto mode
2. Press D → Column D
3. Press 4 → Cell D4 selected
4. Type 7 → Fill with 7
5. Repeat for next cell
```

### Scanning Pattern (Left-to-Right)
```
A1 → Press A then 1
A2 → Press A then 2
...scan vertically...
B1 → Press B then 1
```

### Error Correction
```
1. Press ESC → Deselect
2. Press letter + number → Jump to error
3. Press Delete → Clear
4. Type correct number → Fix it
```

---

## 📱 Mobile Note

Keyboard shortcuts work best on desktop/laptop with physical keyboard. Mobile users should use touch controls.

---

## 🎨 Visual Feedback

### Navigation Buffer Indicator
When you press a column letter, a floating indicator appears in the bottom-right:
```
┌─────────────────────┐
│ Go to: D_           │
│ Press row (1-9) or ESC │
└─────────────────────┘
```

### Help Overlay
Press `?` to see all shortcuts in a beautiful overlay.

---

## 🔧 Technical Details

- **Auto-reset**: Buffer clears after 3 seconds of inactivity
- **Smart detection**: Letter keys only trigger navigation when no cell is selected or after pressing `G`
- **No conflicts**: All shortcuts avoid interfering with browser defaults
- **Accessible**: Works with screen readers via semantic HTML

---

## 🎯 Quick Reference Card

```
┌─────────────────────────────────────────┐
│  SUDOKU KEYBOARD SHORTCUTS              │
├─────────────────────────────────────────┤
│  Navigation:                            │
│    Letter + Number → Jump to cell       │
│    G → Goto mode                        │
│    ↑↓←→ → Move selection                │
│    ESC → Deselect                       │
├─────────────────────────────────────────┤
│  Input:                                 │
│    1-9 → Fill cell                      │
│    Delete/Backspace → Clear             │
├─────────────────────────────────────────┤
│  Help:                                  │
│    ? → Show/hide shortcuts              │
└─────────────────────────────────────────┘
```

---

## 🌟 Why This System?

### Design Philosophy
1. **Two-Key Sequence**: Matches natural Sudoku notation (D4, A1, etc.)
2. **No Modifier Keys**: Faster than Ctrl/Cmd combinations
3. **Visual Feedback**: Always know what mode you're in
4. **Forgiving**: 3-second timeout means no permanent state
5. **Discoverable**: Help button + `?` key make it easy to learn

### Alternatives Considered
- ❌ Cmd+Letter+Number: Too many keys, awkward
- ❌ Slash command (/): Slower, more UI complexity
- ✅ Two-key + G command: Best balance of speed and simplicity

---

Enjoy blazing-fast Sudoku solving! 🚀
