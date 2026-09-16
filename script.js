/* ================================================================
   INCANTARE CENTRO ESTÉTICO — Preenchimento Labial
   Campanha exclusiva Meta Ads (sem Google Ads).
   script.js — tracking (dataLayer + Meta Pixel), quiz, carrossel
   autoplay, modais, banner de cookies (LGPD / Consent Mode) e
   WhatsApp.

   ------------------------------------------------------------
   MAPEAMENTO DE EVENTOS
   (dataLayer + fbq disparados diretamente; GTM/GA4 são opcionais
   e podem ser conectados depois sem duplicar os eventos do Pixel)

     lp_view          → dataLayer                | META Pixel: PageView (base code)
     offer_view       → dataLayer                | -
     quiz_start       → dataLayer 'quiz_start'    | META: fbq('trackCustom', 'QuizStart')  — 1x/sessão
     quiz_answer      → dataLayer (auxiliar, por etapa)
     lead             → dataLayer 'lead'          | META: fbq('track', 'Lead')             — 1x, só ao completar o quiz
     whatsapp_contact → dataLayer 'whatsapp_contact' | META: fbq('track', 'Contact')        — 1x, clique final no WhatsApp
     agency_footer_click → dataLayer (isolado, fora do funil da Incantare)

   Ver tabela completa em README.md.
   ------------------------------------------------------------
   NUNCA enviar ao dataLayer: nome, telefone, e-mail, CPF ou
   qualquer outro dado pessoal identificável.
   ================================================================ */

(function () {
  'use strict';

  /* ============================================================
     CONFIGURAÇÃO
     ============================================================ */

  var WHATSAPP_NUMBER = '5541996650381';

  var PROCEDURE = 'preenchimento_labial';
  var FUNNEL = 'incantare_labios';

  /* ============================================================
     DATALAYER — helper reutilizável
     ============================================================ */

  window.dataLayer = window.dataLayer || [];

  function generateEventId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    // Fallback para navegadores/contextos sem crypto.randomUUID (ex.: file://)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function trackEvent(eventName, parameters) {
    parameters = parameters || {};
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(
      Object.assign(
        {
          event: eventName,
          procedure: PROCEDURE,
          clinic: 'incantare',
          funnel: FUNNEL,
          page_variant: 'v1',
          event_id: generateEventId()
        },
        getUtmParams(),
        parameters
      )
    );
  }

  // Dispara o Meta Pixel com segurança — não quebra se o Pixel
  // ainda não estiver configurado (fbq indefinido).
  function fbqSafe() {
    if (typeof window.fbq === 'function') {
      window.fbq.apply(window, arguments);
    }
  }

  /* ============================================================
     UTM — captura e persistência durante a sessão
     (armazenados apenas como parâmetros NÃO pessoais de campanha)
     ============================================================ */

  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];
  var UTM_STORAGE_KEY = 'incantare_utm_v1';

  function captureUtms() {
    try {
      var params = new URLSearchParams(window.location.search);
      var hasAny = UTM_KEYS.some(function (key) {
        return params.has(key);
      });
      if (hasAny) {
        var data = {};
        UTM_KEYS.forEach(function (key) {
          if (params.has(key)) data[key] = params.get(key);
        });
        sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(data));
      }
    } catch (e) {
      /* sessionStorage indisponível — segue sem UTM persistido */
    }
  }

  function getUtmParams() {
    var stored = {};
    try {
      stored = JSON.parse(sessionStorage.getItem(UTM_STORAGE_KEY) || '{}');
    } catch (e) {
      stored = {};
    }
    var out = {};
    if (stored.utm_source) out.traffic_source = stored.utm_source;
    if (stored.utm_medium) out.medium = stored.utm_medium;
    if (stored.utm_campaign) out.campaign_name = stored.utm_campaign;
    if (stored.utm_content) out.creative_name = stored.utm_content;
    if (stored.utm_term) out.term = stored.utm_term;
    if (stored.fbclid) out.click_id = stored.fbclid;
    return out;
  }

  captureUtms();

  /* ============================================================
     ESTADO DO QUIZ
     Guardado apenas em memória — nunca enviado ao dataLayer.
     ============================================================ */

  var quizState = {
    firstName: '',
    resultAnswerCode: null,
    resultAnswerLabel: null,
    timeframeCode: null,
    timeframeLabel: null
  };

  /* ============================================================
     MENSAGEM E LINK DO WHATSAPP
     O botão de WhatsApp só fica acessível DEPOIS do quiz completo
     (não existe CTA de WhatsApp antes disso na página), então
     firstName/resultAnswerLabel/timeframeLabel sempre já existem
     quando esta mensagem é montada.
     ============================================================ */

  function buildWhatsappMessage() {
    return [
      'Olá! Meu nome é ' + quizState.firstName + '.',
      '',
      'Vi a promoção de Preenchimento Labial da Incantare e gostaria de saber qual é a condição especial.',
      '',
      'Meu objetivo é:',
      quizState.resultAnswerLabel,
      '',
      'Pretendo realizar:',
      quizState.timeframeLabel,
      '',
      'Gostaria de receber mais informações.'
    ].join('\n');
  }

  function openWhatsapp() {
    var message = buildWhatsappMessage();
    var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
    var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    trackEvent('whatsapp_contact');
    fbqSafe('track', 'Contact');

    // Pequeno delay para aumentar a chance de a tag ser enviada
    // antes da navegação para o WhatsApp.
    window.setTimeout(function () {
      if (isMobile) {
        window.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener');
      }
    }, 150);
  }

  function initWhatsappButtons() {
    document.querySelectorAll('[data-whatsapp-cta]').forEach(function (btn) {
      btn.addEventListener('click', openWhatsapp);
    });
  }

  /* ============================================================
     CTAs "descobrir a condição" (hero + abaixo do carrossel)
     Ambos levam ao quiz e disparam quiz_start — só 1x por sessão,
     não importa qual dos dois botões foi clicado primeiro.
     Não existe nenhum botão de WhatsApp antes do quiz completo.
     ============================================================ */

  var quizStartFired = false;

  function fireQuizStartOnce() {
    if (quizStartFired) return;
    try {
      if (sessionStorage.getItem('incantare_quiz_start_fired') === '1') {
        quizStartFired = true;
        return;
      }
      sessionStorage.setItem('incantare_quiz_start_fired', '1');
    } catch (e) {
      /* segue mesmo sem sessionStorage, usando apenas a flag em memória */
    }
    quizStartFired = true;
    trackEvent('quiz_start');
    fbqSafe('trackCustom', 'QuizStart');
  }

  function initQuizCtas() {
    var quizSection = document.getElementById('quiz');
    function goToQuiz() {
      fireQuizStartOnce();
      quizSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    document.getElementById('ctaHeroQuiz').addEventListener('click', goToQuiz);
    document.getElementById('ctaGalleryQuiz').addEventListener('click', goToQuiz);
  }

  function initOfferView() {
    var hero = document.getElementById('hero');
    if (!('IntersectionObserver' in window)) {
      trackEvent('offer_view');
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            trackEvent('offer_view');
            observer.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(hero);
  }

  /* ============================================================
     QUIZ — 3 etapas, sem recarregar a página
     ============================================================ */

  function goToStep(stepNumber) {
    document.querySelectorAll('.quiz-step[data-step]').forEach(function (el) {
      el.hidden = true;
    });
    var target = document.querySelector('.quiz-step[data-step="' + stepNumber + '"]');
    if (target) target.hidden = false;

    document.querySelectorAll('.progress-dot').forEach(function (dot) {
      var dotStep = Number(dot.getAttribute('data-progress-dot'));
      dot.classList.toggle('is-filled', dotStep <= stepNumber);
    });
    document.getElementById('quizProgressLabel').textContent = 'Etapa ' + stepNumber + ' de 3';
  }

  function selectOption(selectedBtn, scopeSelector) {
    document.querySelectorAll(scopeSelector + ' .quiz-option').forEach(function (btn) {
      btn.classList.remove('is-selected');
    });
    selectedBtn.classList.add('is-selected');
  }

  function showQuizResult() {
    document.querySelectorAll('.quiz-step[data-step]').forEach(function (el) {
      el.hidden = true;
    });
    document.getElementById('quizProgress').hidden = true;
    document.getElementById('quizResultName').textContent = quizState.firstName || 'você';
    document.getElementById('quizResult').hidden = false;
  }

  function initQuiz() {
    var nameInput = document.getElementById('quizFirstName');
    var step1Continue = document.getElementById('quizStep1Continue');

    step1Continue.addEventListener('click', function () {
      var value = nameInput.value.trim();
      if (!value) {
        nameInput.focus();
        nameInput.style.borderColor = '#C0392B';
        return;
      }
      quizState.firstName = value;
      goToStep(2);
    });

    nameInput.addEventListener('input', function () {
      nameInput.style.borderColor = '';
    });

    nameInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        step1Continue.click();
      }
    });

    document.querySelectorAll('#quizStep2 .quiz-option').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectOption(btn, '#quizStep2');
        quizState.resultAnswerCode = btn.getAttribute('data-answer-code');
        quizState.resultAnswerLabel = btn.getAttribute('data-answer-label');

        trackEvent('quiz_answer', {
          quiz_step: 2,
          answer_code: quizState.resultAnswerCode
        });

        window.setTimeout(function () {
          goToStep(3);
        }, 280);
      });
    });

    document.querySelectorAll('#quizStep3 .quiz-option').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectOption(btn, '#quizStep3');
        quizState.timeframeCode = btn.getAttribute('data-answer-code');
        quizState.timeframeLabel = btn.getAttribute('data-answer-label');

        trackEvent('quiz_answer', {
          quiz_step: 3,
          answer_code: quizState.timeframeCode
        });

        // Quiz completo: dispara Lead (1x) — só agora, nunca antes.
        trackEvent('lead');
        fbqSafe('track', 'Lead');

        window.setTimeout(showQuizResult, 320);
      });
    });
  }

  /* ============================================================
     CARROSSEL — Antes e Depois (autoplay + swipe/setas/pontos)
     ============================================================ */

  function initCarousel() {
    var AUTOPLAY_MS = 2800;
    var RESUME_DELAY_MS = 5000;

    var track = document.getElementById('carouselTrack');
    var slides = Array.prototype.slice.call(track.children);
    var dotsContainer = document.getElementById('carouselDots');
    var prevBtn = document.getElementById('carouselPrev');
    var nextBtn = document.getElementById('carouselNext');
    var currentIndex = 0;
    var autoplayTimer = null;
    var resumeTimer = null;

    slides.forEach(function (_, index) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', 'Ir para imagem ' + (index + 1));
      dot.addEventListener('click', function () {
        scrollToSlide(index);
        pauseAndScheduleResume();
      });
      dotsContainer.appendChild(dot);
    });
    var dots = Array.prototype.slice.call(dotsContainer.children);

    function setActiveDot(index) {
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function scrollToSlide(index) {
      var slide = slides[index];
      track.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
    }

    function startAutoplay() {
      stopAutoplay();
      autoplayTimer = window.setInterval(function () {
        scrollToSlide((currentIndex + 1) % slides.length);
      }, AUTOPLAY_MS);
    }

    function stopAutoplay() {
      if (autoplayTimer) window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    }

    function pauseAndScheduleResume() {
      stopAutoplay();
      if (resumeTimer) window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(startAutoplay, RESUME_DELAY_MS);
    }

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var index = slides.indexOf(entry.target);
              if (index !== -1) {
                currentIndex = index;
                setActiveDot(index);
              }
            }
          });
        },
        { root: track, threshold: 0.6 }
      );
      slides.forEach(function (slide) {
        observer.observe(slide);
      });
    }

    prevBtn.addEventListener('click', function () {
      scrollToSlide(Math.max(0, currentIndex - 1));
      pauseAndScheduleResume();
    });
    nextBtn.addEventListener('click', function () {
      scrollToSlide(Math.min(slides.length - 1, currentIndex + 1));
      pauseAndScheduleResume();
    });

    // Toque/arraste no carrossel pausa o autoplay e retoma depois.
    track.addEventListener('pointerdown', pauseAndScheduleResume);
    track.addEventListener('touchstart', pauseAndScheduleResume, { passive: true });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
    });

    setActiveDot(0);
    startAutoplay();
  }

  /* ============================================================
     MODAIS — Política de Privacidade / Termos de Uso
     ============================================================ */

  function openModal(modal) {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  function initModals() {
    var privacyModal = document.getElementById('privacyModal');
    var termsModal = document.getElementById('termsModal');

    document.getElementById('openPrivacyPolicy').addEventListener('click', function () {
      openModal(privacyModal);
    });
    document.getElementById('openTerms').addEventListener('click', function () {
      openModal(termsModal);
    });

    document.querySelectorAll('[data-close-modal]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        closeModal(btn.closest('.modal-overlay'));
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal(overlay);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay:not([hidden])').forEach(closeModal);
      }
    });
  }

  /* ============================================================
     BANNER DE COOKIES — LGPD / estrutura de Consent Mode
     A liberação real das tags de marketing/analytics acontece
     nas configurações de consentimento do próprio GTM; aqui
     apenas refletimos a escolha do visitante no dataLayer.
     ============================================================ */

  var CONSENT_STORAGE_KEY = 'incantare_consent_v1';

  function pushConsentUpdate(analyticsGranted, marketingGranted) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'consent_update',
      analytics_storage: analyticsGranted ? 'granted' : 'denied',
      ad_storage: marketingGranted ? 'granted' : 'denied'
    });
  }

  function initCookieConsent() {
    var banner = document.getElementById('cookieBanner');
    var settingsPanel = document.getElementById('cookieSettings');
    var configureBtn = document.getElementById('cookieConfigure');
    var acceptBtn = document.getElementById('cookieAccept');
    var saveBtn = document.getElementById('cookieSavePrefs');
    var analyticsCheckbox = document.getElementById('cookieAnalytics');
    var marketingCheckbox = document.getElementById('cookieMarketing');

    var stored = null;
    try {
      stored = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY));
    } catch (e) {
      stored = null;
    }

    if (stored) {
      pushConsentUpdate(!!stored.analytics, !!stored.marketing);
      return; // preferência já registrada, banner não é exibido de novo
    }

    function saveConsent(analytics, marketing) {
      var data = { analytics: analytics, marketing: marketing, timestamp: Date.now() };
      try {
        localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        /* localStorage indisponível — consentimento vale só para esta sessão */
      }
      pushConsentUpdate(analytics, marketing);
      banner.hidden = true;
    }

    configureBtn.addEventListener('click', function () {
      settingsPanel.hidden = !settingsPanel.hidden;
    });

    acceptBtn.addEventListener('click', function () {
      saveConsent(true, true);
    });

    saveBtn.addEventListener('click', function () {
      saveConsent(!!analyticsCheckbox.checked, !!marketingCheckbox.checked);
    });

    window.setTimeout(function () {
      banner.hidden = false;
    }, 600);
  }

  /* ============================================================
     ASSINATURA — Adriano Marketing (bloco discreto no rodapé)
     Fora do funil da Incantare: evento próprio no dataLayer,
     sem os campos de campanha (procedure/funnel/clinic) e sem
     passar pela trackEvent() principal — não deve ser usado para
     otimizar/qualificar a campanha de preenchimento labial.
     ============================================================ */

  var AGENCY_WHATSAPP_NUMBER = '5541998362692';
  var AGENCY_WHATSAPP_MESSAGE =
    'Olá! Vim pela página de Preenchimento Labial da Incantare e gostaria de entender como funciona essa estrutura de marketing para clínicas de estética.';

  function initAgencyFooterCta() {
    var link = document.getElementById('agencyFooterCta');
    if (!link) return;

    link.href = 'https://wa.me/' + AGENCY_WHATSAPP_NUMBER + '?text=' + encodeURIComponent(AGENCY_WHATSAPP_MESSAGE);
    link.target = '_blank';
    link.rel = 'noopener';

    link.addEventListener('click', function () {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'agency_footer_click',
        agency: 'adriano_marketing',
        source_page: 'incantare_preenchimento_labial',
        cta_position: 'agency_footer'
      });
    });
  }

  /* ============================================================
     INICIALIZAÇÃO
     ============================================================ */

  document.getElementById('footerYear').textContent = new Date().getFullYear();

  trackEvent('lp_view');

  initQuizCtas();
  initOfferView();
  initQuiz();
  initCarousel();
  initModals();
  initCookieConsent();
  initWhatsappButtons();
  initAgencyFooterCta();
})();
