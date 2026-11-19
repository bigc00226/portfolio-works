'use client';
/*
 * The page's motion, in one place (renders nothing):
 *   - [data-reveal] elements get .in when they scroll into view (home.css fades / slides them in; --d staggers them).
 *     Elements added later (a tab or filter switch) are picked up by a MutationObserver.
 *   - [data-count] numbers count up from 0 the first time they are seen
 *   - html gets .scrolled after the first 24 px and --scroll (0 → 1, the reading progress bar under the header)
 *   - .spot cards get --mx / --my (the pointer, for the soft spotlight on hover)
 *   - the header link of the section on screen ([data-nav="<id>"]) gets .on
 * With prefers-reduced-motion (html without .motion) everything is shown as is.
 */
import { useEffect } from 'react';

export function Motion() {
  useEffect(() => {
    const root = document.documentElement;
    const motion = root.classList.contains('motion');

    // count-up
    const counted = new WeakSet<Element>();
    const countUp = (el: HTMLElement) => {
      if (counted.has(el)) return;
      counted.add(el);
      const to = Number(el.dataset.count || el.textContent || 0);
      if (!motion || !to) { el.textContent = String(to); return; }
      const t0 = performance.now(), dur = 1400 + Math.min(to, 300) * 2;
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / dur);
        el.textContent = String(Math.round(to * (1 - Math.pow(1 - t, 4))));
        if (t < 1) requestAnimationFrame(step);
      };
      el.textContent = '0';
      requestAnimationFrame(step);
    };

    // reveal on scroll
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in');
        e.target.querySelectorAll<HTMLElement>('[data-count]').forEach(countUp);
        if ((e.target as HTMLElement).dataset.count != null) countUp(e.target as HTMLElement);
        io.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    const watch = (scope: ParentNode) => scope.querySelectorAll('[data-reveal]:not(.in), [data-count]').forEach((el) => io.observe(el));
    watch(document);
    const mo = new MutationObserver((list) => {
      for (const m of list) m.addedNodes.forEach((n) => { if (n instanceof HTMLElement) { if (n.matches('[data-reveal], [data-count]')) io.observe(n); watch(n); } });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // header state + reading progress
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = root.scrollHeight - innerHeight;
        root.style.setProperty('--scroll', String(max > 0 ? Math.min(1, scrollY / max) : 0));
        root.classList.toggle('scrolled', scrollY > 24);
      });
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });

    // spotlight on cards
    const onMove = (e: PointerEvent) => {
      const card = (e.target as Element | null)?.closest?.<HTMLElement>('.spot');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    document.addEventListener('pointermove', onMove, { passive: true });

    // the header link of the section on screen
    const links = [...document.querySelectorAll<HTMLElement>('[data-nav]')];
    const sio = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        links.forEach((a) => a.classList.toggle('on', a.dataset.nav === e.target.id));
      }
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['top', 'why', 'flow', 'library'].forEach((id) => { const s = document.getElementById(id); if (s) sio.observe(s); });

    return () => {
      io.disconnect(); mo.disconnect(); sio.disconnect();
      removeEventListener('scroll', onScroll);
      document.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
