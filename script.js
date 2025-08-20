// ===== Helpers =====
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from((ctx || document).querySelectorAll(sel));

// ===== Mobile nav toggle =====
const navToggle = $('#navToggle');
const navList = $('#navList');
navToggle?.addEventListener('click', () => navList.classList.toggle('is-open'));

// ===== Active nav on scroll + smooth nav =====
const sections = $$('section[id], main[id]');
const navLinks = $$('.nav-link');
const setActive = () => {
  const y = window.scrollY + 140;
  let activeId = null;
  for (const sec of sections){
    const top = sec.offsetTop;
    if (y >= top && y < top + sec.offsetHeight) { activeId = sec.id; break; }
  }
  navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${activeId}`));
};
window.addEventListener('scroll', setActive);
setActive();
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e)=> {
    const hash = a.getAttribute('href');
    if (hash.length>1) {
      const tgt = document.querySelector(hash);
      if (tgt) {
        e.preventDefault();
        tgt.scrollIntoView({behavior:'smooth', block:'start'});
        navList.classList.remove('is-open');
      }
    }
  });
});

// ===== Progress bar =====
const progress = $('#progressBar');
const setProgress = () => {
  const h = document.documentElement;
  if(!progress) return;
  const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight);
  progress.style.width = (scrolled * 100).toFixed(2) + '%';
};
window.addEventListener('scroll', setProgress);
setProgress();

// ===== Theme toggle (persist) =====
const themeToggle = $('#themeToggle');
const root = document.documentElement;
const savedTheme = localStorage.getItem('theme');
if(savedTheme === 'light') root.classList.add('light');
themeToggle?.addEventListener('click', () => {
  root.classList.toggle('light');
  localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark');
});

// ===== Year in footer =====
$('#year') && ($('#year').textContent = new Date().getFullYear());

// ===== Reveal on scroll (IntersectionObserver) =====
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-visible'); });
}, { threshold: 0.12 });
$$('.reveal').forEach(el => io.observe(el));

// ===== Counters (about stats) =====
const counters = $$('.stat-num');
if (counters.length){
  const counterIo = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const to = parseInt(el.dataset.count || '0',10);
      let n = 0;
      const step = () => {
        n += Math.ceil(to/50);
        if (n >= to) { el.textContent = to; counterIo.unobserve(el); }
        else { el.textContent = n; requestAnimationFrame(step); }
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 1.0 });
  counters.forEach(c => counterIo.observe(c));
}

// ===== Hero slides (unchanged behavior) =====
const slides = $$('#slides .slide');
const dots = $$('.slider-controls .dot');
let idx = 0;
const showSlide = (i) => {
  if(!slides.length) return;
  slides.forEach((s, n) => s.classList.toggle('is-active', n === i));
  dots.forEach((d, n) => d.classList.toggle('is-active', n === i));
  idx = i;
};
dots.forEach((d, i) => d.addEventListener('click', () => showSlide(i)));
if (slides.length) setInterval(() => showSlide((idx + 1) % slides.length), 6000);

// ===== Carousel class (qualification & cert galleries) =====
class Carousel {
  constructor(root){
    this.root = root;
    this.track = $('.carousel-track', root);
    this.items = $$('.carousel-item', root);
    this.prevBtn = $('.carousel-btn.prev', root);
    this.nextBtn = $('.carousel-btn.next', root);
    this.dotsWrap = $('.carousel-dots', root);
    this.index = 0;
    this.x0 = null; this.locked = false;

    // create dots
    this.dots = this.items.map((_, i) => {
      const b = document.createElement('button');
      if(i===0) b.classList.add('is-active');
      this.dotsWrap.appendChild(b);
      b.addEventListener('click', () => this.go(i));
      return b;
    });

    // buttons
    this.prevBtn?.addEventListener('click', () => this.go(this.index - 1));
    this.nextBtn?.addEventListener('click', () => this.go(this.index + 1));

    // autoplay
    this.timer = setInterval(() => this.go(this.index + 1), 5000);
    this.root.addEventListener('mouseenter', () => clearInterval(this.timer));
    this.root.addEventListener('mouseleave', () => this.timer = setInterval(() => this.go(this.index + 1), 5000));

    // swipe handlers
    this.track.addEventListener('pointerdown', e => this.lock(e));
    this.track.addEventListener('pointermove', e => this.drag(e));
    this.track.addEventListener('pointerup', e => this.move(e));
    this.track.addEventListener('pointerleave', e => this.move(e));
    window.addEventListener('resize', () => this.update());
    this.update();
  }
  update(){
    this.width = this.root.clientWidth;
    this.track.style.transform = `translateX(${-this.index * this.width}px)`;
  }
  lock(e){ this.x0 = e.clientX; this.locked = true; this.track.style.transition = 'none'; }
  drag(e){
    if(!this.locked) return;
    const dx = e.clientX - this.x0;
    this.track.style.transform = `translateX(${(-this.index * this.width) + dx}px)`;
  }
  move(e){
    if(!this.locked) return;
    const dx = (e.clientX || 0) - this.x0;
    this.locked = false; this.track.style.transition = '';
    if(Math.abs(dx) > this.width/6) this.index += (dx<0?1:-1);
    this.go(this.index);
  }
  go(i){
    if(this.items.length === 0) return;
    if(i < 0) i = this.items.length - 1;
    if(i >= this.items.length) i = 0;
    this.index = i;
    this.track.style.transform = `translateX(${-i * this.width}px)`;
    this.items.forEach((it,n)=>it.classList.toggle('is-active', n===i));
    this.dots.forEach((d,n)=>d.classList.toggle('is-active', n===i));
  }
}
$$('.carousel').forEach(c => new Carousel(c));

// ===== Contact form (Formspree integration) =====
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#contactForm");
  const msgEl = document.querySelector("#formMsg");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.querySelector("#name").value.trim();
    const email = document.querySelector("#email").value.trim();
    const message = document.querySelector("#message").value.trim();

    if (!name || !email || !message) {
      msgEl.textContent = "⚠️ Please fill all fields.";
      msgEl.style.color = "red";
      return;
    }

    // Build the payload
    const formData = {
      name: name,
      email: email,
      message: message,
    };

    try {
      const response = await fetch("https://formspree.io/f/xyzpqddj", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        msgEl.textContent = "✅ Thank you! Your message has been sent.";
        msgEl.style.color = "green";
        form.reset();
      } else {
        msgEl.textContent = "❌ Oops! Something went wrong. Try again.";
        msgEl.style.color = "red";
      }
    } catch (error) {
      msgEl.textContent = "⚠️ Error: Unable to send message.";
      msgEl.style.color = "red";
      console.error(error);
    }
  });
});


// ===== Typing animation for hero name =====
(function heroTyping(){
  const el = document.getElementById('heroTyping');
  if(!el) return;
  const text = "Mohit Sahija";
  let i = 0;
  function step(){
    if(i <= text.length){
      el.textContent = text.slice(0,i);
      i++;
      setTimeout(step, parseInt(getComputedStyle(document.documentElement).getPropertyValue('--typing-speed')) || 60);
    } else {
      // keep typed text (no loop)
      el.textContent = text;
    }
  }
  setTimeout(step, parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hero-type-delay')) || 600);
})();

// ===== Clock (footer) =====
(function clock(){
  const clockEl = document.getElementById('siteClock');
  if(!clockEl) return;
  function pad(n){ return n.toString().padStart(2,'0'); }
  function update(){
    const d = new Date();
    const hh = pad(d.getHours()); const mm = pad(d.getMinutes()); const ss = pad(d.getSeconds());
    clockEl.textContent = `${hh}:${mm}:${ss}`;
  }
  update();
  setInterval(update, 1000);
})();

// ===== Ripple effect (delegated) =====
document.addEventListener('click', function(e){
  const btn = e.target.closest('.ripple, .btn');
  if(!btn) return;
  const ink = document.createElement('span');
  ink.className = 'ripple-ink';
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 0.9;
  ink.style.width = ink.style.height = size + 'px';
  const x = e.clientX - rect.left - size/2;
  const y = e.clientY - rect.top - size/2;
  ink.style.left = x + 'px'; ink.style.top = y + 'px';
  btn.appendChild(ink);
  setTimeout(()=> ink.remove(), 800);
});

// ===== Custom cursor =====
(function customCursor(){
  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  document.body.appendChild(dot);
  window.addEventListener('pointermove', (e)=> { dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px'; });
  const interactors = 'a, button, .btn, .carousel-btn, .nav-toggle, .social, input, textarea';
  document.addEventListener('pointerover', (e) => { if (e.target.closest(interactors)) dot.classList.add('cursor-hover'); });
  document.addEventListener('pointerout', (e) => { if (e.target.closest(interactors)) dot.classList.remove('cursor-hover'); });
})();

/* ===== Chatbot (conversational engine + KB) ===== */
(() => {
  const els = {
    open: document.getElementById('chatOpen'),
    close: document.getElementById('chatClose'),
    win: document.getElementById('chatWindow'),
    msgs: document.getElementById('chatMessages'),
    input: document.getElementById('chatText'),
    send: document.getElementById('chatSend'),
    kbExport: document.getElementById('kbExport'),
    kbImportOpen: document.getElementById('kbImportOpen'),
  };

  /* --- Your profile & contact (EDIT THESE) --- */
  const PROFILE = {
    name: 'Mohit Sahija',
    role: 'IT & Cybersecurity + Web',
    city: 'Ahmedabad, IN',
    email: 'mohit.sahija.sw@gmail.com',    // TODO: replace
    linkedin: 'https://www.linkedin.com/in/mohit-sahija-893bba284/',
    instagram: 'https://www.instagram.com/?deoia=1',
    meeting: 'I usually schedule intro calls (20–30 mins) over Google Meet. Share 2–3 time slots and I’ll confirm!',
    personality: 'focused, disciplined, calm, and helpful',
    tagline: 'Focus Today, Mastery Tomorrow',
  };

  /* --- Seed a tiny knowledge base if none exists yet --- */
  const seedKB = () => ([
    { q: 'what services do you offer', a: 'I help with IT infrastructure (QNAP, cabling, TTBS), cybersecurity (DLP, phishing simulations, awareness), and web basics (HTML/CSS/JS, simple Node/IoT prototypes).' },
    { q: 'how to contact mohit', a: `Email: ${PROFILE.email}\nLinkedIn: ${PROFILE.linkedin}\nInstagram: ${PROFILE.instagram}` },
    { q: 'where are you based', a: `${PROFILE.city}. Happy to work remote/hybrid.` },
    { q: 'what is your tagline', a: PROFILE.tagline },
    { q: 'how to book a meeting', a: PROFILE.meeting },
    { q: 'skills', a: 'Cybersecurity (DLP, firewall, phishing sim), IT Infra (QNAP, NComputing, structured cabling), Web (HTML/CSS/JS), and IoT.' },
    { q: 'experience', a: 'IT & Security Associate (2024–present). Former IT Intern where I optimized network latency, automated backups, and built internal tools.' },
    { q: 'resume', a: 'You can find my resume in the Resume section on this page.' }
  ]);

  const getKB = () => {
    try {
      const raw = localStorage.getItem('kb');
      if (!raw) {
        const seeded = seedKB();
        localStorage.setItem('kb', JSON.stringify(seeded));
        return seeded;
      }
      return JSON.parse(raw);
    } catch {
      const seeded = seedKB();
      localStorage.setItem('kb', JSON.stringify(seeded));
      return seeded;
    }
  };
  const setKB = (kb) => localStorage.setItem('kb', JSON.stringify(kb));
  let KB = getKB();

  /* --- Helpers --- */
  const addMsg = (who, text) => {
    const wrap = document.createElement('div');
    wrap.className = `chat-msg ${who}`;
    wrap.innerHTML = `<div class="bubble">${text.replace(/\n/g, '<br>')}</div>`;
    els.msgs.appendChild(wrap);
    els.msgs.scrollTop = els.msgs.scrollHeight;
  };

  const norm = s => (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokenize = s => norm(s).split(' ').filter(w => !STOP.has(w) && w.length > 1);
  const STOP = new Set('a an the and or but if then else of in on at to for with from is are am was were be been being i you he she it we they me my our your his her their who what where when why how do does did will would can could should'.split(' '));

  // Jaccard similarity over tokens (fast enough here)
  const jaccard = (a, b) => {
    const A = new Set(tokenize(a)), B = new Set(tokenize(b));
    if (!A.size || !B.size) return 0;
    let inter = 0;
    for (const t of A) if (B.has(t)) inter++;
    return inter / (A.size + B.size - inter);
  };

  const searchKB = (q) => {
    let best = { s: 0, a: null };
    for (const item of KB) {
      const s = jaccard(q, item.q);
      if (s > best.s) best = { s, a: item.a };
    }
    return best.s >= 0.28 ? best.a : null;
  };

  const nowTime = () => {
    const d = new Date();
    return d.toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  /* --- Intent rules --- */
  const intents = [
    {
      name: 'greet',
      tests: [/^(hi|hello|hey|yo|hola|namaste)\b/, /good (morning|afternoon|evening)/],
      reply: () => `Hey! I’m ${PROFILE.name}. How can I help?`
    },
    {
      name: 'how_are_you',
      tests: [/how('?| )?s it going|how are you|how r u|how are u/],
      reply: () => `Doing great — staying ${PROFILE.personality.split(',')[0]} and focused. What can I do for you?`
    },
    {
      name: 'who_is_mohit',
      tests: [/who( is|'s) mohit/, /who( is|'s) mohit sahija/, /tell me about (mohit|you)/, /about you/],
      reply: () => `${PROFILE.name} — ${PROFILE.role}. I’m ${PROFILE.personality}, based in ${PROFILE.city}. I work on cybersecurity, IT infra, and clean web UIs.`
    },
    {
      name: 'how_is_mohit',
      tests: [/how is mohit/, /how('s|s) mohit/],
      reply: () => `Focused and consistent — “${PROFILE.tagline}”.`
    },
    {
      name: 'nature_personality',
      tests: [/(nature|personality|character|behaviou?r) (of|about) (mohit|you)|what are you like/],
      reply: () => `I’d describe myself as ${PROFILE.personality}. I value clarity, reliability and steady improvement.`
    },
    {
      name: 'contact',
      tests: [/contact|reach you|get in touch|email|mail/i],
      reply: () => `Best way: **${PROFILE.email}**.\nLinkedIn: ${PROFILE.linkedin}\nInstagram: ${PROFILE.instagram}`
    },
    {
      name: 'meet',
      tests: [/meet|meeting|coffee|call|schedule|appointment/i],
      reply: () => PROFILE.meeting
    },
    {
      name: 'where_based',
      tests: [/where (are you|do you) live|location|city|based/i],
      reply: () => `I’m in ${PROFILE.city}.`
    },
    {
      name: 'time',
      tests: [/what('s| is) the time|current time|time now/i],
      reply: () => `It’s ${nowTime()} for me.`
    },
    {
      name: 'skills',
      tests: [/skills?|tech( stack)?|what can you do|your expertise/i],
      reply: () => `Cybersecurity (DLP, phishing sims, awareness, firewall), IT infra (QNAP, NComputing, structured cabling), and web (HTML/CSS/JS, small Node/IoT).`
    },
    {
      name: 'experience',
      tests: [/experience|background|work history|career/i],
      reply: () => `IT & Security Associate (2024–present). Previously an IT Intern — improved latency, automated backups with Acronis, built internal web tools.`
    },
    {
      name: 'resume',
      tests: [/resume|cv/i],
      reply: () => `Open the **Resume** section on this page — it has the latest download link.`
    },
    {
      name: 'thanks',
      tests: [/thanks?|thank you|ty/i],
      reply: () => `Anytime! If you want to talk specifics, send me a short brief and I’ll get back quickly.`
    },
    {
      name: 'goodbye',
      tests: [/bye|see you|ttyl|talk later/i],
      reply: () => `See you!`
    }
  ];

  const route = (q) => {
    const s = norm(q);
    for (const intent of intents) {
      if (intent.tests.some(rx => rx.test(s))) return intent.reply(q);
    }
    const kbAns = searchKB(q);
    if (kbAns) return kbAns;

    return `Good question! I might not have that in my quick answers.\n` +
           `You can ask about **skills, experience, resume, how to contact, meeting, location, time** — or import a KB JSON with more Q/A.`;
  };

  /* --- Wire up UI --- */
  const send = () => {
    const text = els.input.value.trim();
    if (!text) return;
    addMsg('user', text);
    els.input.value = '';
    setTimeout(() => addMsg('bot', route(text)), 200);
  };

  els.send?.addEventListener('click', send);
  els.input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });

  els.open?.addEventListener('click', () => {
    els.win.classList.remove('hidden');
    els.input.focus();
    if (!els.msgs.dataset.welcomed) {
      addMsg('bot', `Hi! I’m ${PROFILE.name}. Ask me about skills, experience, resume, or how to contact/meet.`);
      els.msgs.dataset.welcomed = '1';
    }
  });
  els.close?.addEventListener('click', () => els.win.classList.add('hidden'));

  /* --- Export / Import KB --- */
  els.kbExport?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(KB, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mohit-kb.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  els.kbImportOpen?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!Array.isArray(data)) throw new Error('Invalid KB format');
          KB = data;
          setKB(KB);
          addMsg('bot', 'Knowledge base imported ✅');
        } catch (e) {
          addMsg('bot', 'Import failed. Provide a JSON array like: [{"q":"question","a":"answer"}]');
        }
      };
      reader.readAsText(file);
    });
    input.click();
  });

  /* --- Basic styles for message bubbles if not present (safe-guard) --- */
  const style = document.createElement('style');
  style.textContent = `
    #chatWidget .chat-msg { display:flex; margin:10px 0; }
    #chatWidget .chat-msg.user { justify-content:flex-end; }
    #chatWidget .chat-msg .bubble {
      max-width: 85%; padding:10px 14px; border-radius:14px;
      background: var(--panel); border: 1px solid var(--border); color: var(--text);
    }
    #chatWidget .chat-msg.user .bubble{
      background: linear-gradient(135deg, var(--accent), var(--accent-2)); color:#fff; border-color:transparent;
    }
  `;
  document.head.appendChild(style);
})();
