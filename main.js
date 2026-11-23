(() => {
  'use strict';

  const PHONE = '77015489004';
  const WA_TEXT = 'Сәлеметсіз бе! Тегін сынақ сабағына жазылғым келеді.';
  const WA_URL = `https://wa.me/${PHONE}?text=${encodeURIComponent(WA_TEXT)}`;

  // Сабақ кестесі: JS күн нөмірі (0 = жексенбі) → уақыт
  const LESSONS = [
    { day: 1, name: 'Дүйсенбі', time: '16:00' },
    { day: 3, name: 'Сәрсенбі', time: '18:30' },
    { day: 4, name: 'Бейсенбі', time: '11:00' },
    { day: 0, name: 'Жексенбі', time: '11:00' },
  ];

  const setWhatsAppLinks = () => {
    document.querySelectorAll('[data-wa]').forEach((a) => {
      a.href = WA_URL;
      a.target = '_blank';
      a.rel = 'noopener';
    });
  };

  const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };

  // Ең жақын сабақты табу (бүгінгі өтіп кеткен сабақты есептемейміз)
  const findNextLesson = (now) => {
    const today = now.getDay();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const candidates = LESSONS.map((l) => {
      let diff = (l.day - today + 7) % 7;
      if (diff === 0 && toMinutes(l.time) <= nowMin) diff = 7;
      return { ...l, diff };
    });
    return candidates.reduce((best, c) =>
      c.diff < best.diff || (c.diff === best.diff && toMinutes(c.time) < toMinutes(best.time)) ? c : best
    );
  };

  const highlightSchedule = () => {
    const now = new Date();
    const next = findNextLesson(now);
    const today = now.getDay();

    document.querySelectorAll('.schedule li').forEach((li) => {
      const day = Number(li.dataset.day);
      const tag = li.querySelector('.tag');
      if (day === next.day) {
        li.classList.add('is-next');
        tag.textContent = next.diff === 0 ? 'Бүгін' : next.diff === 1 ? 'Ертең' : 'Келесі';
      } else if (day === today) {
        tag.textContent = 'Бүгін';
      }
    });

    const el = document.getElementById('next-lesson');
    if (el) {
      const when = next.diff === 0 ? 'бүгін' : next.diff === 1 ? 'ертең' : next.name.toLowerCase();
      el.textContent = `Келесі сабақ — ${when}, сағат ${next.time}.`;
      el.hidden = false;
    }
  };

  const setupReveal = () => {
    const items = document.querySelectorAll('.reveal');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach((el) => io.observe(el));
  };

  const setupNavShadow = () => {
    const nav = document.querySelector('.nav');
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  };

  setWhatsAppLinks();
  highlightSchedule();
  setupReveal();
  setupNavShadow();
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
