# Simple Static Site

This is a minimal HTML/CSS/JS starter site.

Files created:

- `index.html` - main page
- `css/styles.css` - styles
- `js/script.js` - small interactive helpers (theme toggle, form demo)

How to use

Open the site in a browser directly by double-clicking `index.html`, or run a local static server.

Using Python (if installed):

```powershell
# from the project folder
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

Using Node (npx serve):

```powershell
npx serve -s . -l 5000
# then open http://localhost:5000
```

Using VS Code: install the Live Server extension and click "Go Live".

Next steps

- Customize the content, styles, or add pages.
- Add a build step or deploy to Netlify / GitHub Pages.

Publish to GitHub Pages (automatic via GitHub Actions)

This project includes a GitHub Actions workflow at `.github/workflows/pages.yml` that will automatically publish the site to GitHub Pages whenever you push to the `main` branch.

Quick steps to publish:

1. Create a repository on GitHub (or use the GitHub CLI):

```powershell
# Using GitHub CLI (optional):
gh repo create <USERNAME>/<REPO> --public --source=. --remote=origin --push
```

2. Or create locally and push manually (replace `<USERNAME>` and `<REPO>`):

```powershell
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin https://github.com/<USERNAME>/<REPO>.git
git push -u origin main
```

3. After you push to `main`, the GitHub Actions workflow will run and deploy your site to GitHub Pages. You can check the Actions tab in the repository for progress and logs.

Notes & troubleshooting

- If you use branch protection or organization policies, ensure Actions are allowed to run and to publish Pages.
- By default the site will be published at `https://<USERNAME>.github.io/<REPO>/` (or at your custom domain if you add a `CNAME`).
- If you prefer manual publishing, you can also enable Pages from the repository settings and set the source to the `gh-pages` branch or the `docs/` folder.

If you want, I can also:

- Add a `CNAME` file for a custom domain.
- Add a small GitHub Action to automatically create a release or tag when publishing.
- Or set up a `gh-pages` deploy script using `gh-pages` npm package instead of the Pages action.
