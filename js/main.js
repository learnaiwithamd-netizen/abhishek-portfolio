/* ============================================================
   main.js — boot, scroll, reveals, counters, accordions
   ============================================================ */
(function () {
  "use strict";

  gsap.registerPlugin(ScrollTrigger);

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- smooth scroll (Lenis) ---------- */
  if (!reduceMotion) {
    var lenis = new Lenis({ lerp: 0.11 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var target = document.querySelector(a.getAttribute("href"));
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -40 });
        }
      });
    });
  }

  /* ---------- IST clock ---------- */
  var clockEl = document.getElementById("clock");
  var fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  });
  function tick() { clockEl.textContent = fmt.format(new Date()); }
  tick();
  setInterval(tick, 1000);

  /* ---------- nav background on scroll ---------- */
  var nav = document.getElementById("nav");
  ScrollTrigger.create({
    start: 80,
    onUpdate: function (self) {
      nav.classList.toggle("is-scrolled", self.scroll() > 80);
    }
  });

  /* ---------- scrollspy: highlight the in-view section's nav link ---------- */
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link[href^="#"]'));
  var spy = spyLinks
    .map(function (link) {
      var sec = document.querySelector(link.getAttribute("href"));
      return sec ? { link: link, sec: sec } : null;
    })
    .filter(Boolean);

  var activeLink = undefined;
  function setActive(link) {
    if (link === activeLink) return;
    activeLink = link;
    spy.forEach(function (item) {
      item.link.classList.toggle("is-active", item.link === link);
    });
  }

  // A thin detection band sits ~40% down the viewport. Whichever section
  // straddles that band is "active"; the browser computes the viewport
  // internally, so this needs no innerHeight read and survives smooth scroll
  // and instant jumps alike. In the hero (no section in the band) nothing lights.
  if (spy.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          for (var i = 0; i < spy.length; i++) {
            if (spy[i].sec === e.target) { spy[i].inBand = e.isIntersecting; break; }
          }
        });
        var current = null;
        for (var j = 0; j < spy.length; j++) {
          if (spy[j].inBand) current = spy[j].link;
        }
        setActive(current);
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    spy.forEach(function (item) { io.observe(item.sec); });
  }

  /* ---------- boot sequence → hero reveal ---------- */
  var boot = document.getElementById("boot");
  var bootStatus = document.getElementById("bootStatus");
  var heroLines = document.querySelectorAll(".hero .line-inner");
  var statuses = ["CALIBRATING", "FIXING POSITION", "ALL SYSTEMS GO"];

  gsap.set(heroLines, { yPercent: 110 });
  gsap.set([".hero-kicker", ".hero-sub", ".ticker", ".hero-corner"], { autoAlpha: 0 });

  function heroIn() {
    var tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.to(boot, { autoAlpha: 0, duration: 0.5, ease: "power2.inOut", display: "none" })
      .to(heroLines, { yPercent: 0, duration: 1.1, stagger: 0.09 }, "-=0.15")
      .to(".hero-kicker", { autoAlpha: 1, duration: 0.7 }, "-=0.8")
      .to(".hero-sub", { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.6")
      .to("#ocean", { opacity: 1, duration: 1.6, ease: "power2.inOut" }, "-=0.7")
      .to([".ticker", ".hero-corner"], { autoAlpha: 1, duration: 0.7 }, "-=1.2");
  }

  if (reduceMotion) {
    boot.style.display = "none";
    gsap.set(heroLines, { yPercent: 0 });
    gsap.set([".hero-kicker", ".hero-sub", ".ticker", ".hero-corner"], { autoAlpha: 1 });
    gsap.set("#ocean", { opacity: 1 });
  } else {
    var bootTl = gsap.timeline({ onComplete: heroIn });
    bootTl.to("#bootFill", {
      scaleX: 1, duration: 1.0, ease: "power2.inOut",
      onUpdate: function () {
        var i = Math.min(statuses.length - 1, Math.floor(bootTl.progress() * statuses.length));
        bootStatus.textContent = statuses[i];
      }
    });
  }

  /* ---------- section heads ---------- */
  document.querySelectorAll(".section-head").forEach(function (head) {
    var rule = head.querySelector(".section-rule");
    gsap.set(rule, { scaleX: 0, transformOrigin: "left center" });
    gsap.set([head.querySelector(".section-no"), head.querySelector(".section-label")], { autoAlpha: 0, x: -12 });
    ScrollTrigger.create({
      trigger: head,
      start: "top 85%",
      once: true,
      onEnter: function () {
        gsap.to(rule, { scaleX: 1, duration: 1.1, ease: "power3.inOut" });
        gsap.to([head.querySelector(".section-no"), head.querySelector(".section-label")], {
          autoAlpha: 1, x: 0, duration: 0.7, stagger: 0.1, ease: "power3.out"
        });
      }
    });
  });

  /* ---------- statement word reveal ---------- */
  var statement = document.getElementById("statement");
  if (statement) {
    var words = statement.textContent.trim().split(/\s+/);
    statement.innerHTML = words.map(function (w) { return '<span class="w">' + w + "</span>"; }).join(" ");
    var wEls = statement.querySelectorAll(".w");
    gsap.to(wEls, {
      color: "#e9e4d6",
      stagger: 0.04,
      ease: "none",
      scrollTrigger: {
        trigger: statement,
        start: "top 78%",
        end: "bottom 45%",
        scrub: reduceMotion ? false : 0.6
      }
    });
  }

  /* ---------- bearings meta rows ---------- */
  gsap.utils.toArray(".meta-row").forEach(function (row, i) {
    gsap.from(row, {
      autoAlpha: 0, y: 18, duration: 0.7, delay: i * 0.08, ease: "power3.out",
      scrollTrigger: { trigger: row, start: "top 90%", once: true }
    });
  });

  /* ---------- log entries: reveal + accordion ---------- */
  var entries = document.querySelectorAll("[data-entry]");

  entries.forEach(function (entry, i) {
    gsap.from(entry, {
      autoAlpha: 0, y: 30, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: entry, start: "top 88%", once: true }
    });

    var head = entry.querySelector(".entry-head");
    var body = entry.querySelector(".entry-body");

    head.addEventListener("click", function () {
      var isOpen = entry.classList.contains("is-open");

      // close any other open entry
      entries.forEach(function (other) {
        if (other !== entry && other.classList.contains("is-open")) {
          closeEntry(other);
        }
      });

      if (isOpen) { closeEntry(entry); } else { openEntry(entry); }
    });

    function openEntry(el) {
      var b = el.querySelector(".entry-body");
      var h = el.querySelector(".entry-head");
      el.classList.add("is-open");
      h.setAttribute("aria-expanded", "true");
      gsap.to(b, {
        height: "auto", duration: 0.65, ease: "power3.inOut",
        onComplete: function () { ScrollTrigger.refresh(); }
      });
      gsap.fromTo(b.querySelectorAll(".entry-col, .stat"),
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.05, delay: 0.18, ease: "power3.out" });
      runCounters(b);
    }

    function closeEntry(el) {
      var b = el.querySelector(".entry-body");
      var h = el.querySelector(".entry-head");
      el.classList.remove("is-open");
      h.setAttribute("aria-expanded", "false");
      gsap.to(b, {
        height: 0, duration: 0.5, ease: "power3.inOut",
        onComplete: function () { ScrollTrigger.refresh(); }
      });
    }
  });

  // open the first entry by default so the section isn't a wall of closed rows
  ScrollTrigger.create({
    trigger: "#work",
    start: "top 70%",
    once: true,
    onEnter: function () {
      var first = entries[0];
      if (first && !first.classList.contains("is-open")) {
        first.querySelector(".entry-head").click();
      }
    }
  });

  /* ---------- animated counters ---------- */
  function runCounters(scope) {
    scope.querySelectorAll(".stat-num").forEach(function (el) {
      if (el.dataset.done) return;
      el.dataset.done = "1";
      var target = parseFloat(el.dataset.count);
      var decimals = parseInt(el.dataset.decimals || "0", 10);
      var prefix = el.dataset.prefix || "";
      var suffix = el.dataset.suffix || "";
      var obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: reduceMotion ? 0 : 1.4,
        ease: "power2.out",
        onUpdate: function () {
          var n = decimals ? obj.v.toFixed(decimals) : Math.round(obj.v).toLocaleString("en-US");
          el.textContent = prefix + n + suffix;
        }
      });
    });
  }

  /* ---------- principles ---------- */
  gsap.utils.toArray(".principle").forEach(function (card, i) {
    gsap.from(card, {
      autoAlpha: 0, y: 36, duration: 0.8, delay: (i % 2) * 0.12, ease: "power3.out",
      scrollTrigger: { trigger: card, start: "top 86%", once: true }
    });
  });

  /* ---------- route line draw + ports ---------- */
  var routeLine = document.querySelector(".route-line line");
  if (routeLine) {
    gsap.to(routeLine, {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: {
        trigger: ".route-wrap",
        start: "top 75%",
        end: "bottom 60%",
        scrub: reduceMotion ? false : 0.5
      }
    });
  }
  gsap.utils.toArray(".port").forEach(function (port) {
    gsap.from(port, {
      autoAlpha: 0, x: 30, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: port, start: "top 85%", once: true }
    });
  });

  /* ---------- contact reveal ---------- */
  var contactLines = document.querySelectorAll(".contact .line-inner");
  gsap.set(contactLines, { yPercent: 110 });
  ScrollTrigger.create({
    trigger: ".contact",
    start: "top 70%",
    once: true,
    onEnter: function () {
      gsap.to(contactLines, { yPercent: 0, duration: 1, stagger: 0.1, ease: "power4.out" });
      gsap.from([".contact-kicker", ".contact-mail", ".contact-links"], {
        autoAlpha: 0, y: 20, duration: 0.8, stagger: 0.12, delay: 0.3, ease: "power3.out"
      });
    }
  });

  /* ---------- magnetic email button ---------- */
  var mag = document.getElementById("magnetic");
  if (mag && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    var bounds;
    mag.addEventListener("mouseenter", function () { bounds = mag.getBoundingClientRect(); });
    mag.addEventListener("mousemove", function (e) {
      if (!bounds) bounds = mag.getBoundingClientRect();
      var dx = e.clientX - (bounds.left + bounds.width / 2);
      var dy = e.clientY - (bounds.top + bounds.height / 2);
      gsap.to(mag, { x: dx * 0.25, y: dy * 0.35, duration: 0.4, ease: "power3.out" });
    });
    mag.addEventListener("mouseleave", function () {
      gsap.to(mag, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
    });
  }
})();
