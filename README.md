# SSH Web Terminal

This is a simplistic proof of concept SSH terminal running in a web browser. I say simple because I wanted the minimal amount of code and make it work and I didn't care about the programming language.

I built this because if you have Virtualmin, you can use Webmin on port 10000, click on the Virtualmin tab, and then open an SSH terminal. In my day to day I open many SSH terminals!

I also wanted to see how quickly and easily I can build a similar solution by prompting AI and Cursor.

On the Virtualmin side, I am inspired by their look and feel, and used the HTML below and the term `xterm` to kick off the AI building process:

```html
<textarea class="xterm-helper-textarea" aria-label="Terminal input" aria-multiline="false" autocorrect="off" autocapitalize="off" spellcheck="false" tabindex="0" style="left: 339px; top: 265px; width: 20px; height: 20px; line-height: 20px; z-index: 1000;"></textarea>
```

> Please show me how I can create a standalone application, that streams SSH terminal sessions to a browser.
Initial code heavily enhanced afterwards:
https://claude.ai/public/artifacts/5f7ae9ea-5aab-473e-9da0-be58a1d8c0dd

The end result is pretty neat and uses Socket.io, Xterm, and SSH Javascript libraries to get the job done.

For this project my testing rig is a Mac M2 Mini. To get SSH testing going on a Mac, I had to go to `System Settings` and turn on `Remote Login`.

I also use Laravel Herd for local hosting. I don't think bootstrapping generic Javascript applications using Herd is ideal so the one place I really got stuck was building and getting assets to work from scratch using `vite`. I attempted but only got so far before giving up. The application still works, and so does asset compilation, but the moment I remove the CDN files it breaks, so I know it's not serving via `vite`.

# Installation

- Download the application to a new location.
- Install the assets and start the Node Express server:

```bash
npm install
npm start
```

- Create a new site in Herd and add SSL to it: https://ssh-web-terminal.test/
- I used localhost, username, and password to test.

# What works

- SSH terminal in a browser :-)
- Colors
- Selecting text via the mouse and copying text using COMMAND-C and pasting using COMMAND-V

# To do

I don't like addding todos to any project but since the proof of concept is working and the rest might be more complex rabbit holes, I am adding them just in case I (or anyone else) decides to take this further.

- Right click mouse menu copy didn't work so I only left a partial implementation. It detects the clicks but copy/paste from there doesn't work.
- Function buttons in the browser in Midnight Commander doesn't work (Works in the Virtualmin version).
- I couldn't get the addon `fit` working. The next steps here since it's a small module was to simply copy the code into `app.js` or just try again.
- I never got around to get the same CSS / layout as Virtualmin, but so far I'm actually pretty happy with the layout AI gave me.

Ultimately, running SSH in browser on remote hosts is going to prove challenging from a security point of view. If you use root often there is a huge concern running Node Express just to expose remote servers easilty.

But boy will my life be easier if SSH to 10,20, 30 locations daily wasn't so hard to keep track of!