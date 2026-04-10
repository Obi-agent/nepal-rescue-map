# Quick GitHub upload guide

## Via the GitHub web interface

1. Create a new repository on GitHub, for example `nepal-rescue-routes-map`.
2. Upload all files from this package into the repository root.
3. Commit the upload.
4. Go to **Settings → Pages**.
5. Set source to **Deploy from a branch**.
6. Choose branch `main` and folder `/root`.
7. Save.

## Via Git on the command line

```bash
git init
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPO.git
git add .
git commit -m "Initial Nepal rescue routes map"
git push -u origin main
```

Then enable GitHub Pages from the repository settings.
