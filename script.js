/* ========================================
   The Reichmann Co. — JavaScript
   ======================================== */

(function() {
    'use strict';

    // ---- Theme toggle (with View Transitions circle reveal) ----
    const themeToggle = document.getElementById('themeToggle');
    const root = document.documentElement;

    const setTheme = (theme) => {
        root.setAttribute('data-theme', theme);
        try { localStorage.setItem('theme', theme); } catch (e) {}
    };

    const toggleTheme = () => {
        const current = root.getAttribute('data-theme') || 'dark';
        const next = current === 'light' ? 'dark' : 'light';
        const goingDark = next === 'dark';

        // Fallback for browsers without View Transitions API, reduced motion,
        // or small viewports (the clip-path circle reveal renders inconsistently
        // on mobile and can flash a fully-white frame mid-transition).
        if (
            !document.startViewTransition ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
            window.matchMedia('(max-width: 768px)').matches
        ) {
            setTheme(next);
            return;
        }

        const rect = themeToggle.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );

        // Flip z-index when going dark so the OLD (light) layer sits on top and we can watch it shrink
        if (goingDark) {
            root.classList.add('to-dark');
        }

        const transition = document.startViewTransition(() => {
            setTheme(next);
        });

        transition.finished.finally(() => {
            root.classList.remove('to-dark');
        });

        transition.ready.then(() => {
            root.animate(
                {
                    clipPath: goingDark
                        ? [
                            `circle(${endRadius}px at ${x}px ${y}px)`,
                            `circle(0px at ${x}px ${y}px)`
                        ]
                        : [
                            `circle(0px at ${x}px ${y}px)`,
                            `circle(${endRadius}px at ${x}px ${y}px)`
                        ]
                },
                {
                    duration: 650,
                    easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
                    fill: 'forwards',
                    pseudoElement: goingDark ? '::view-transition-old(root)' : '::view-transition-new(root)'
                }
            );
        });
    };

    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // ---- Navigation: scroll effect ----
    const nav = document.getElementById('nav');
    const handleScroll = () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // ---- Mobile nav toggle ----
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close mobile nav when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // ---- Smooth scroll for anchor links (offset for fixed nav) ----
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            const navHeight = nav.offsetHeight;
            const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight + 1;
            window.scrollTo({
                top: targetPos,
                behavior: 'smooth'
            });
        });
    });

    // ---- Reveal animations on scroll ----
    const revealSelectors = [
        '.about-text',
        '.about-stats',
        '.stat-card',
        '.service-card',
        '.vision-quote',
        '.value',
        '.contact-info',
        '.contact-form',
        '.section-header'
    ];
    const revealElements = document.querySelectorAll(revealSelectors.join(','));
    revealElements.forEach((el, i) => {
        el.classList.add('reveal');
        // Stagger nearby siblings
        const delay = (i % 4) * 80;
        el.style.transitionDelay = `${delay}ms`;
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => observer.observe(el));

    // ---- Dynamic year in footer ----
    const yearEl = document.getElementById('year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // ---- Contact form handling ----
    const form = document.getElementById('contactForm');
    const formNote = document.getElementById('formNote');

    if (form) form.addEventListener('submit', async (e) => {
        // If Formspree endpoint is still placeholder, fall back to mailto
        const action = form.getAttribute('action') || '';
        const isPlaceholder = action.includes('YOUR_FORM_ID') || !action.startsWith('http');

        if (isPlaceholder) {
            e.preventDefault();
            const name = form.name.value.trim();
            const email = form.email.value.trim();
            const company = form.company.value.trim();
            const subject = form.subject.value;
            const message = form.message.value.trim();

            const body = `Name: ${name}%0D%0AEmail: ${email}%0D%0ACompany: ${company || 'N/A'}%0D%0A%0D%0A${message}`;
            const mailtoLink = `mailto:info@thereichmannco.co.za?subject=${encodeURIComponent('[' + subject + '] Website Inquiry')}&body=${body}`;

            formNote.className = 'form-note success';
            formNote.textContent = 'Opening your email client…';
            window.location.href = mailtoLink;
            return;
        }

        // Formspree submission
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Sending…</span>';
        formNote.className = 'form-note';
        formNote.textContent = '';

        try {
            const response = await fetch(action, {
                method: 'POST',
                body: new FormData(form),
                headers: { 'Accept': 'application/json' }
            });
            if (response.ok) {
                form.reset();
                formNote.className = 'form-note success';
                formNote.textContent = 'Thank you. Your message has been sent. We will be in touch.';
            } else {
                throw new Error('Submission failed');
            }
        } catch (err) {
            formNote.className = 'form-note error';
            formNote.textContent = 'Something went wrong. Please email us directly at info@thereichmannco.co.za';
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });

    // ---- Lumarix beta signup ----
    const betaForm = document.getElementById('lumarixBetaForm');
    if (betaForm) {
        const betaNote = document.getElementById('betaNote');
        const betaSubmit = document.getElementById('betaSubmit');
        const betaEmail = document.getElementById('betaEmail');

        betaForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = betaEmail.value.trim();
            if (!email) {
                betaNote.className = 'beta-note error';
                betaNote.textContent = 'Please enter your email address.';
                return;
            }

            const originalContent = betaSubmit.innerHTML;
            betaSubmit.disabled = true;
            betaSubmit.innerHTML = '<span>Sending…</span>';
            betaNote.className = 'beta-note';
            betaNote.textContent = '';

            try {
                const response = await fetch('/api/beta-signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const data = await response.json().catch(() => ({}));

                if (response.ok) {
                    betaForm.reset();
                    betaNote.className = 'beta-note success';
                    betaNote.textContent = 'You’re on the list. Check your inbox for confirmation.';
                } else {
                    betaNote.className = 'beta-note error';
                    betaNote.textContent = data.error || 'Something went wrong. Please try again.';
                }
            } catch (err) {
                betaNote.className = 'beta-note error';
                betaNote.textContent = 'Network error. Please try again.';
            } finally {
                betaSubmit.disabled = false;
                betaSubmit.innerHTML = originalContent;
            }
        });
    }

    // ---- Parallax effect on hero orbs (subtle) ----
    const orbs = document.querySelectorAll('.gradient-orb');
    if (orbs.length && window.matchMedia('(min-width: 768px)').matches) {
        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 30;
            const y = (e.clientY / window.innerHeight - 0.5) * 30;
            orbs.forEach((orb, i) => {
                const factor = i === 0 ? 1 : -1;
                orb.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
            });
        }, { passive: true });
    }

})();
