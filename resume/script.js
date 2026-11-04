/* ============================================================
   BATMAN'S RESUME  |  script
   ------------------------------------------------------------
   Plain JavaScript, no libraries. Same building blocks as the
   belt page (IntersectionObserver for "it scrolled into view",
   requestAnimationFrame for smooth number and scroll updates).

   1. Reveal on scroll
   2. Progress bar and timeline (one scroll listener)
   3. Cursor spotlight on the header
   4. Rotating job title
   5. Count up numbers
   6. Print button
   7. Footer year
   ============================================================ */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $$ = (selector) => Array.from(document.querySelectorAll(selector));


/* ---------- 1. REVEAL ON SCROLL ----------
   CATALOG: "Staggered blur rise"
   Adding .is-in also starts everything nested inside a block:
   skill bars, highlighter marks, training cards, and badge stamps
   all key off that one class in style.css. */
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

$$(".reveal").forEach((el) => {
    if (reduceMotion) el.classList.add("is-in");
    else revealObserver.observe(el);
});


/* ---------- 2. PROGRESS BAR AND TIMELINE ----------
   CATALOG: "Top progress bar" + "Timeline that draws itself" */
const progressBar = document.querySelector(".progress-bar");
const timeline = document.querySelector(".timeline");
let ticking = false;

function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? window.scrollY / max : 0;
    progressBar.style.setProperty("--p", progress.toFixed(4));

    if (timeline) {
        if (reduceMotion) {
            timeline.style.setProperty("--draw", "100%");
        } else {
            // the line reaches a job when that job crosses 65% of the screen height
            const box = timeline.getBoundingClientRect();
            const drawn = Math.max(0, Math.min(1, (window.innerHeight * 0.65 - box.top) / box.height));
            timeline.style.setProperty("--draw", (drawn * 100).toFixed(1) + "%");
        }
    }
    ticking = false;
}
window.addEventListener("scroll", () => {
    if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
    }
}, { passive: true });
window.addEventListener("resize", onScroll);


/* ---------- 3. CURSOR SPOTLIGHT ----------
   CATALOG: "Cursor spotlight" */
const header = document.querySelector(".resume-header");
if (header && !reduceMotion) {
    header.addEventListener("pointermove", (e) => {
        const box = header.getBoundingClientRect();
        header.style.setProperty("--mx", e.clientX - box.left + "px");
        header.style.setProperty("--my", e.clientY - box.top + "px");
    });
}


/* ---------- 4. ROTATING JOB TITLE ----------
   CATALOG: "Rotating word"
   Every 2.4 seconds: slide the current word up and out (.out),
   swap the text, jump the new word below the box (.in, no
   transition), then let it slide up into place. */
const roles = ["Detective", "Strategist", "Martial Artist", "Inventor", "Team Leader", "Night Owl"];
const word = document.querySelector(".rotator-word");
let roleIndex = 0;

if (word && !reduceMotion) {
    setInterval(() => {
        word.classList.add("out");
        setTimeout(() => {
            roleIndex = (roleIndex + 1) % roles.length;
            word.textContent = roles[roleIndex];
            word.classList.remove("out");
            word.classList.add("in");
            // reading offsetWidth forces the browser to apply .in before we remove it,
            // otherwise it would skip straight to the end and nothing would slide
            void word.offsetWidth;
            word.classList.remove("in");
        }, 450);
    }, 2400);
}


/* ---------- 5. COUNT UP ----------
   CATALOG: "Count up"
   The header is on screen at load, so these start right away.
   The "0 superpowers" one counts DOWN from 99 for a laugh. */
function countTo(el, from, to, suffix) {
    const duration = 1500;
    const start = performance.now();
    function frame(now) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(from + (to - from) * eased) + suffix;
        if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}
if (!reduceMotion) {
    $$(".kpi-num").forEach((el, i) => {
        const to = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || "";
        const from = to === 0 ? 99 : 0;
        el.textContent = from + suffix;
        setTimeout(() => countTo(el, from, to, suffix), 500 + i * 150);
    });
}


/* ---------- 6. PRINT BUTTON ----------
   Opens the browser's print window. Pick "Save as PDF" there to
   get a PDF. The @media print rules in style.css do the rest. */
document.getElementById("print-btn").addEventListener("click", () => window.print());

// If someone prints while the numbers are still counting, the paper would
// show a half finished number like "81". "beforeprint" fires right before
// printing, so we snap every number to its final value first.
window.addEventListener("beforeprint", () => {
    $$(".kpi-num").forEach((el) => {
        el.textContent = el.dataset.count + (el.dataset.suffix || "");
    });
});


/* ---------- 7. FOOTER YEAR ---------- */
document.getElementById("year").textContent = new Date().getFullYear();

onScroll();
