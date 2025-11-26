# Q&A ERP Exposure Tool

An interactive decision-making tool that presents binary-choice questions with timed responses. Designed for ERP (Event-Related Potential) exposure exercises where users must make quick decisions between two options.

## Features

- **Timed Questions**: Each question has a 5-second countdown timer
- **Auto-advance**: Questions automatically advance when answered or when time expires
- **Session Timer**: Set a custom session duration (in minutes) that resets all progress when expired
- **No Repeats**: Questions are never repeated within a session using localStorage-based tracking
- **Multiple Question Sets**: Load different JSON files containing question pairs
- **Progress Tracking**: Real-time display of total questions remaining
- **Clean BEM CSS**: Properly structured, maintainable styles using BEM methodology

## Project Structure

```
Q&A/
├── index.html              # Main application page
├── css/
│   └── styles.css         # BEM-structured styles
├── js/
│   ├── script.js          # Main UI logic and timers
│   └── question-generator.js  # Question loading and state management
├── json/
│   ├── pairs-1.json       # Question pair sets
│   ├── pairs-2.json
│   └── ...
├── netlify/
│   └── functions/
│       └── delete-pair.js # Serverless function for pair deletion
├── server.ps1             # Local PowerShell HTTP server
└── server.js              # Local Node.js/Express server (alternative)
```

## Usage

### Running Locally

**Option 1: PowerShell Server (Recommended for Windows)**

```powershell
cd 'C:\Users\mrwob\Desktop\Sites\Q&A'
powershell -ExecutionPolicy Bypass -File server.ps1 -Port 3000
```

Then open http://localhost:3000

**Option 2: Node.js Server** (requires Node.js installed)

```powershell
npm install express
node server.js
```

Then open http://localhost:3000

**Option 3: Python Server**

```powershell
python -m http.server 8000
```

Then open http://localhost:8000

### How to Use the Tool

1. **Select a Question File**: Choose a JSON file from the dropdown (e.g., `pairs-1.json`)
2. **Load the File**: Click "Load file" to load the question pairs
3. **Set Session Timer** (Optional): Enter minutes in the timer input
4. **Start Questions**: Click "Start Questions" - this also starts the session timer if configured
5. **Answer Questions**: Click on either option (left or right) to answer
6. **Auto-advance**: Questions automatically move to the next after answering or timeout
7. **Session End**: When the session timer expires, all progress resets

## Technical Details

### Question Format

Questions are stored in JSON files with the following structure:

```json
{
  "pairs": [
    ["Red", "Blue"],
    ["Hot", "Cold"],
    ["Up", "Down"]
  ]
}
```

Or as a simple array:

```json
[
  ["Real", "Fake"],
  ["Truth", "Lie"]
]
```

### State Management

- **Per-file localStorage**: Each question file maintains its own state using namespaced keys:
  - `qa_seed_v1:{filename}` - Seeded random number for deterministic shuffle
  - `qa_remain_v1:{filename}` - Array of remaining question indices
- **Deterministic Shuffling**: Uses Mulberry32 PRNG with Fisher-Yates shuffle for reproducible question order
- **Browser-specific**: Each browser/user maintains independent progress

### Timers

1. **Per-Question Timer**: 5-second countdown for each question
   - Auto-skips unanswered questions when time expires
   - Clears when answer is selected
   
2. **Session Timer**: User-configurable duration (minutes)
   - Starts when questions begin (if configured)
   - Displays as `mm:ss` countdown
   - Resets all progress when expired

### BEM CSS Architecture

The project uses BEM (Block Element Modifier) methodology:

- **Block**: `.qa` - Main question-answer component
- **Elements**: `.qa__filepicker`, `.qa__toolbar`, `.qa__controls`, `.qa__form`, `.qa__options`, `.qa__countdown`, `.qa__session`
- **Modifiers**: `.qa__option--left`, `.qa__option--right`

## Deployment

### GitHub Pages (Static Only)

⚠️ **Note**: The delete functionality won't work on GitHub Pages as it's static-only hosting.

1. **Initialize and push to GitHub**:

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

2. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: `main` branch, `/ (root)` folder
   - Save

Your site will be available at: `https://YOUR-USERNAME.github.io/YOUR-REPO/`

### Netlify (Recommended for Full Functionality)

Supports both static files AND serverless functions (delete API):

1. Connect your GitHub repository to Netlify
2. Build settings:
   - Build command: (leave empty)
   - Publish directory: `.`
3. Deploy

The delete API at `netlify/functions/delete-pair.js` will automatically work.

## Development

### Adding Question Sets

1. Create a new JSON file in `/json/` folder (e.g., `pairs-6.json`)
2. Follow the format: `{"pairs": [["Option1", "Option2"], ...]}`
3. Update `js/script.js` in `populateFileSelect()` to include the new file

### Modifying Timer Durations

- **Per-question timer**: Edit `TIME_LIMIT` constant in `js/script.js` (default: 5 seconds)
- **Session timer**: User-configurable via UI input (in minutes)

### Styling Customization

All styles are in `css/styles.css` using BEM classes. Key elements:

- `.qa__controls` - Main 250px question container with border
- `.qa__option--left` / `.qa__option--right` - Split background colors (#f2f2f2 / #dedede)
- `.qa__countdown` - Positioned at bottom center
- CSS variables for theming: `--bg`, `--text`, `--accent`, `--muted`

## Known Limitations

- **Delete API**: Only works with local Node.js server or Netlify Functions deployment; GitHub Pages doesn't support server-side operations
- **Browser-specific state**: Progress tracking is per-browser using localStorage; clearing browser data resets progress
- **No authentication**: All users can access and use the tool; no user accounts or tracking

## License

Built with love for Becky! 💙
