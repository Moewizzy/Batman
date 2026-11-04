/* ============================================================
   BATMAN'S UTILITY BELT  |  Enhanced script
   ------------------------------------------------------------
   ORIGINAL: one commented out line, alert("Hello, Batman!").
   NOW: everything that makes the page move. No libraries, just
   plain JavaScript, so you can read every line.

   Each block below is one feature. Effects borrowed from the
   EVOGENCY Motion Catalog are marked  CATALOG: "Card name".

   BIG IDEA used all over this file: IntersectionObserver.
   It is the browser telling us "this element just scrolled into
   view", which is much cheaper than checking on every scroll.
   ============================================================ */

// Does the visitor's device ask for less motion? If yes, we skip
// the fancy stuff and just show the finished result.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Small helper. $$("selector") returns a real array of elements.
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));


/* ---------- 1. REVEAL ON SCROLL ----------
   CATALOG: "Scroll cascade" + "Staggered blur rise"
   CSS hides every .reveal element. When one scrolls into view we
   add .is-in and CSS animates it in. unobserve() means it only
   happens once, so things do not flicker when you scroll back. */
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

$$(".reveal").forEach((el) => {
    if (reduceMotion) el.classList.add("is-in");
    else revealObserver.observe(el);
});


/* ---------- 2. SCROLL DRIVEN PIECES ----------
   CATALOG: "Top progress bar", "Back to top ring", "Shrinking menu bar"
   One scroll listener updates all three. requestAnimationFrame
   makes sure we only do the work once per screen refresh, even if
   the scroll event fires many more times than that. */
const root = document.documentElement;
const navbar = document.querySelector(".navbar");
const progressBar = document.querySelector(".progress-bar");
const toTop = document.querySelector(".to-top");
let ticking = false;

function onScroll() {
    const scrollTop = window.scrollY;
    const maxScroll = root.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;   // 0 at the top, 1 at the bottom

    progressBar.style.setProperty("--p", progress.toFixed(4));
    toTop.style.setProperty("--p", progress.toFixed(4));
    toTop.classList.toggle("show", scrollTop > 500);
    navbar.classList.toggle("shrunk", scrollTop > 40);

    updateTimeline();
    updateReadLight();
    ticking = false;
}
window.addEventListener("scroll", () => {
    if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
    }
}, { passive: true });   // passive = we promise not to block scrolling, so it stays smooth


/* ---------- 3. NAV PILL ----------
   CATALOG: "Morphing menu highlight" + "You are here highlight"
   The gold pill slides behind the link you hover. When you are not
   hovering, it rests behind the link for the section on screen. */
const pill = document.querySelector(".nav-pill");
const navLinks = $$(".nav-links a");
let activeLink = null;

function movePillTo(link) {
    if (!link) {
        pill.style.opacity = "0";
        return;
    }
    const navBox = navbar.getBoundingClientRect();
    const box = link.getBoundingClientRect();
    pill.style.width = box.width + "px";
    pill.style.height = box.height + "px";
    pill.style.transform = `translate(${box.left - navBox.left}px, ${box.top - navBox.top}px)`;
    pill.style.opacity = "1";
}

navLinks.forEach((link) => {
    link.addEventListener("mouseenter", () => movePillTo(link));
    link.addEventListener("focus", () => movePillTo(link));
});
document.querySelector(".nav-links").addEventListener("mouseleave", () => movePillTo(activeLink));

// Which section is on screen right now? Watch every section a link points to.
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const link = navLinks.find((a) => a.getAttribute("href") === "#" + entry.target.id);
        if (!link) return;
        navLinks.forEach((a) => a.classList.remove("active"));
        link.classList.add("active");
        link.setAttribute("aria-current", "true");
        activeLink = link;
        movePillTo(link);
    });
}, { rootMargin: "-45% 0px -50% 0px" });   // a thin band across the middle of the screen

navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    // only "#section" links point at this page. The Resume link goes to
    // another page, and querySelector would throw an error on it.
    if (!href.startsWith("#")) return;
    const target = document.querySelector(href);
    if (target) sectionObserver.observe(target);
});
// The pill uses pixel positions, so redo them whenever the links move:
// when the window changes size, when the web fonts finish loading
// (the links get wider), and when the menu bar finishes shrinking.
window.addEventListener("resize", () => movePillTo(activeLink));
if (document.fonts) document.fonts.ready.then(() => movePillTo(activeLink));
navbar.addEventListener("transitionend", (e) => {
    if (e.target === navbar && e.propertyName.startsWith("padding")) movePillTo(activeLink);
});


/* ---------- 4. HERO CURSOR SPOTLIGHT ----------
   CATALOG: "Cursor spotlight"
   We hand CSS the mouse position as --mx and --my. */
const hero = document.querySelector(".hero");
if (!reduceMotion) {
    hero.addEventListener("pointermove", (e) => {
        const box = hero.getBoundingClientRect();
        hero.style.setProperty("--mx", e.clientX - box.left + "px");
        hero.style.setProperty("--my", e.clientY - box.top + "px");
    });
}


/* ---------- 5. DECODE SCRAMBLE ----------
   CATALOG: "Decode scramble"
   Each letter cycles through random characters, then the real
   letters lock in one by one from left to right. */
function scramble(el) {
    const finalText = el.dataset.text;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&";
    const duration = 1400;   // milliseconds
    const start = performance.now();

    function frame(now) {
        const t = Math.min((now - start) / duration, 1);
        const locked = Math.floor(t * finalText.length);   // how many letters are final so far
        let out = "";
        for (let i = 0; i < finalText.length; i++) {
            const real = finalText[i];
            if (i < locked || real === " " || real === "-") out += real;
            else out += chars[Math.floor(Math.random() * chars.length)];
        }
        el.textContent = out;
        if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}
if (!reduceMotion) {
    // wait for the headline to rise first, then decode
    setTimeout(() => $$(".scramble").forEach(scramble), 700);
}


/* ---------- 6. COUNT UP ----------
   CATALOG: "Count up"
   Rolls each number from 0 to its data-count value with an ease
   out curve, so it slows down as it lands. */
function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    const duration = 1600;
    const start = performance.now();

    function frame(now) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);   // ease out cubic
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}
const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            countUp(entry.target);
            countObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.6 });
if (!reduceMotion) {
    $$(".stat-num").forEach((el) => {
        el.textContent = "0" + (el.dataset.suffix || "");   // start from zero (the HTML holds the final number as a fallback)
        countObserver.observe(el);
    });
}


/* ---------- 7. WORDS LIGHT UP AS YOU READ ----------
   CATALOG: "Words light up as you read"
   Split the paragraph into one span per word. As the paragraph
   moves up the screen, more words get the .lit class.
   A few key words also get .gold to make them pop. */
const readPara = document.querySelector(".read-light");
const goldWords = ["preparation", "preparation,", "belt", "waist."];
let readWords = [];

if (readPara) {
    const words = readPara.textContent.trim().split(/\s+/);
    readPara.innerHTML = words
        .map((w) => {
            const isGold = goldWords.includes(w.toLowerCase());
            return `<span class="w${isGold ? " gold" : ""}">${w}</span>`;
        })
        .join(" ");
    readWords = $$(".w", readPara);
    if (reduceMotion) readWords.forEach((w) => w.classList.add("lit"));
}

function updateReadLight() {
    if (!readPara || reduceMotion) return;
    const box = readPara.getBoundingClientRect();
    const vh = window.innerHeight;
    // 0 when the paragraph's top is at 85% of the screen, 1 when its bottom reaches 45%
    const startY = vh * 0.85;
    const endY = vh * 0.45;
    const progress = (startY - box.top) / (startY - endY + box.height);
    const litCount = Math.round(Math.max(0, Math.min(1, progress)) * readWords.length);
    readWords.forEach((w, i) => w.classList.toggle("lit", i < litCount));
}


/* ---------- 8. 3D TILT + GLASS GLARE ----------
   CATALOG: "3D tilt" + "Glass glare"
   Mouse position over the schematic becomes a small rotation
   (max 8 degrees) and the glare follows the cursor. Only runs on
   devices with a real mouse, since tilt feels odd on touch. */
const tilt = document.querySelector(".tilt");
const tiltInner = document.querySelector(".tilt-inner");
const hasMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (tilt && hasMouse && !reduceMotion) {
    tilt.addEventListener("pointermove", (e) => {
        const box = tiltInner.getBoundingClientRect();
        const x = (e.clientX - box.left) / box.width;    // 0 on the left edge, 1 on the right
        const y = (e.clientY - box.top) / box.height;    // 0 at the top, 1 at the bottom
        tiltInner.style.setProperty("--ry", ((x - 0.5) * 16).toFixed(2) + "deg");
        tiltInner.style.setProperty("--rx", ((0.5 - y) * 12).toFixed(2) + "deg");
        tiltInner.style.setProperty("--gx", (x * 100).toFixed(1) + "%");
        tiltInner.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
    });
    tilt.addEventListener("pointerleave", () => {
        tiltInner.style.setProperty("--rx", "0deg");
        tiltInner.style.setProperty("--ry", "0deg");
    });
}


/* ---------- 9. CARD FLIP ----------
   CATALOG: "Card flip"
   Mouse users flip by hovering (pure CSS). Touch and keyboard
   users tap or press Enter, and this toggles .is-flipped.
   aria-pressed tells screen readers whether the card is flipped. */
$$(".flip").forEach((card) => {
    card.addEventListener("click", () => {
        const flipped = card.classList.toggle("is-flipped");
        card.setAttribute("aria-pressed", String(flipped));
    });
});


/* ---------- 10. CHECKLIST THAT TICKS ITSELF ----------
   CATALOG: "Checklist that ticks itself"
   When the list scrolls into view, tick each box 350ms apart. */
const checklist = document.querySelector(".checklist");
if (checklist) {
    const items = $$("li", checklist);
    if (reduceMotion) {
        items.forEach((li) => li.classList.add("ticked"));
    } else {
        const checkObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                items.forEach((li, i) => setTimeout(() => li.classList.add("ticked"), 300 + i * 350));
                checkObserver.disconnect();
            }
        }, { threshold: 0.35 });
        checkObserver.observe(checklist);
    }
}


/* ---------- 11. TIMELINE THAT DRAWS ITSELF ----------
   CATALOG: "Timeline that draws itself"
   The gold line's height (--draw) follows how far the timeline
   has scrolled past the middle of the screen. */
const timeline = document.querySelector(".timeline");

function updateTimeline() {
    if (!timeline) return;
    if (reduceMotion) {
        timeline.style.setProperty("--draw", "100%");
        return;
    }
    const box = timeline.getBoundingClientRect();
    const middle = window.innerHeight * 0.6;
    const progress = Math.max(0, Math.min(1, (middle - box.top) / box.height));
    timeline.style.setProperty("--draw", (progress * 100).toFixed(1) + "%");
}


/* ---------- 12. SMOOTH FAQ DRAWERS ----------
   CATALOG: "Smooth FAQ drawers"
   <details> normally snaps open. We stop the snap, then animate
   the height ourselves with the Web Animations API. */
$$(".faq-list details").forEach((details) => {
    const summary = details.querySelector("summary");
    const body = details.querySelector(".faq-body");
    let animation = null;

    summary.addEventListener("click", (e) => {
        if (reduceMotion) return;   // let it snap, no animation
        e.preventDefault();
        if (animation) animation.cancel();

        const closedHeight = summary.offsetHeight + "px";

        if (!details.open) {
            // OPEN: show it, measure the full height, animate from closed to full
            details.open = true;
            const openHeight = details.offsetHeight + "px";
            animation = details.animate({ height: [closedHeight, openHeight] }, { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" });
            body.animate({ opacity: [0, 1], transform: ["translateY(-6px)", "none"] }, { duration: 320 });
        } else {
            // CLOSE: animate down to the summary's height, then actually close it
            const openHeight = details.offsetHeight + "px";
            animation = details.animate({ height: [openHeight, closedHeight] }, { duration: 260, easing: "ease-in" });
            animation.onfinish = () => { details.open = false; };
        }
        animation.addEventListener("finish", () => { animation = null; });
    });
});


/* ---------- 13. FOOTER YEAR ----------
   The original said 2023 forever. Now it always shows the current year. */
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();


/* ---------- 14. FIRST RUN ----------
   Run the scroll work once on load, so everything is correct
   even before the visitor scrolls. */
onScroll();


/* ---------- 15. CONSOLE EASTER EGG ----------
   The original alert, reborn. Open the browser console (F12) to see it.
   (Alerts block the whole page, so the console is the polite version.) */
console.log("%cHello, Batman!", "color:#f5c518;font:bold 20px sans-serif");
