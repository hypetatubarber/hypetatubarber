import React, { useEffect } from 'react';
import './landing.css';
import landingHtml from './landing.html?raw';

export const LandingPage: React.FC = () => {
  useEffect(() => {
    // 0. Força tema escuro total e absoluto na landing page do cliente
    document.documentElement.classList.add('hype-landing-page');
    document.body.classList.add('hype-landing-page');
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    const prevBodyBg = document.body.style.backgroundColor;
    document.documentElement.style.backgroundColor = '#0B0E11';
    document.body.style.backgroundColor = '#0B0E11';

    // 1. Header scroll effect
    const header = document.getElementById('header');
    const handleScroll = () => {
      if (window.scrollY > 40) {
        header?.classList.add('scrolled');
      } else {
        header?.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // 2. Menu mobile toggle
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    const toggleMenu = () => {
      menuToggle?.classList.toggle('active');
      navMenu?.classList.toggle('active');
      document.body.classList.toggle('no-scroll');
    };

    menuToggle?.addEventListener('click', toggleMenu);

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        menuToggle?.classList.remove('active');
        navMenu?.classList.remove('active');
        document.body.classList.remove('no-scroll');
      });
    });

    // 3. Scroll Reveal Animations
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.1 }
    );
    reveals.forEach((el) => observer.observe(el));

    // 4. Floating WhatsApp popup
    const waTrigger = document.querySelector('.whatsapp-trigger-btn');
    const waPopup = document.getElementById('whatsappPopup');
    const popupClose = document.querySelector('.popup-close');

    const togglePopup = () => {
      waPopup?.classList.toggle('active');
    };
    waTrigger?.addEventListener('click', togglePopup);
    popupClose?.addEventListener('click', () => waPopup?.classList.remove('active'));

    // 5. FAQ Accordion
    const faqQuestions = document.querySelectorAll('.faq-question');
    const handleFaqClick = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      const parent = target?.parentElement;
      parent?.classList.toggle('active');
    };
    faqQuestions.forEach((q) => q.addEventListener('click', handleFaqClick));

    // 6. Portfolio Filter
    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioCards = document.querySelectorAll('.portfolio-card');

    const handleFilterClick = (e: Event) => {
      const btn = e.currentTarget as HTMLElement;
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter') || 'all';
      portfolioCards.forEach((card) => {
        const cardEl = card as HTMLElement;
        const category = cardEl.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          cardEl.style.display = 'block';
        } else {
          cardEl.style.display = 'none';
        }
      });
    };
    filterBtns.forEach((b) => b.addEventListener('click', handleFilterClick));

    return () => {
      document.documentElement.classList.remove('hype-landing-page');
      document.body.classList.remove('hype-landing-page');
      document.documentElement.style.backgroundColor = prevHtmlBg;
      document.body.style.backgroundColor = prevBodyBg;
      window.removeEventListener('scroll', handleScroll);
      menuToggle?.removeEventListener('click', toggleMenu);
      waTrigger?.removeEventListener('click', togglePopup);
      document.body.classList.remove('no-scroll');
      observer.disconnect();
      faqQuestions.forEach((q) => q.removeEventListener('click', handleFaqClick));
      filterBtns.forEach((b) => b.removeEventListener('click', handleFilterClick));
    };
  }, []);

  return (
    <div
      className="hype-landing-container"
      dangerouslySetInnerHTML={{ __html: landingHtml }}
    />
  );
};

export default LandingPage;
