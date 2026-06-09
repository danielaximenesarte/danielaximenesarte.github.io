# danielaximenes.arte — cozy art website

A warm, playful, fully static website for showing original artwork. No build step,
no frameworks — just open the files or upload the folder to any free host.

## What's inside
```
index.html     ← the main front page (hero video + featured gallery + about + footer)
gallery.html   ← full collection page
about.html     ← artist story
contact.html   ← ways to get in touch
css/styles.css ← all the styling (change colors/fonts here)
js/main.js     ← small niceties (mobile menu, fade-in, footer year)
assets/        ← put your video & images here (see assets/README.md)
```

## Preview it locally
Just double-click `index.html` to open it in your browser. That's it.

(Optional, if you have Python: run `python -m http.server` in this folder and open
http://localhost:8000 — needed only if you add a video, which browsers prefer to
load over http rather than from a file.)

## Make it yours
- **Add your hero video & artwork images** → see [`assets/README.md`](assets/README.md).
- **Write descriptions** → each gallery card has a title, a `art-meta` line
  (medium · size), and a description paragraph. Edit the text right in the HTML.
- **Add more artworks** → copy a whole `<article class="art-card">…</article>` block
  and paste it; change the placeholder to an `<img>` and edit the text.
- **Change the colors** → open `css/styles.css` and edit the variables at the top
  (`:root`). The main color is `--brand: #A6D0FD`.
- **Social links / email** → search for `href="#"` and `hello@danielaximenes.arte`
  and replace with your real links.

> Note: the header and footer are repeated in each `.html` file. If you change a nav
> link, update it in all four pages.

## Put it online for free
The whole folder is static, so any of these work — just drag & drop:

- **Netlify Drop** — go to https://app.netlify.com/drop and drag this folder onto the
  page. Instant live URL.
- **GitHub Pages** — create a repo, upload these files, then enable Pages in
  Settings → Pages (source: your main branch). 
- **Vercel** — https://vercel.com → import the folder/repo → deploy.
- **Cloudflare Pages** — https://pages.cloudflare.com → upload the folder.

All of them give you a free URL, and you can connect a custom domain later.
"# .github.io" 
