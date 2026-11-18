/* ============================================================
   GMA MARKETING SOLUTIONS — interactions
   Zero dependencies. Progressive enhancement only.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------------------------------------------------------
     1. Custom cursor
     --------------------------------------------------------- */
  (function cursor() {
    var el = $(".cursor");
    if (!el || !finePointer || reduceMotion) return;

    var ring = $(".cursor__ring", el);
    var dot = $(".cursor__dot", el);
    var x = window.innerWidth / 2;
    var y = window.innerHeight / 2;
    var rx = x;
    var ry = y;

    window.addEventListener("mousemove", function (e) {
      x = e.clientX;
      y = e.clientY;
      el.classList.add("is-on");
      dot.style.transform = "translate3d(" + x + "px," + y + "px,0)";
    }, { passive: true });

    document.addEventListener("mouseleave", function () { el.classList.remove("is-on"); });
    document.addEventListener("mouseenter", function () { el.classList.add("is-on"); });
    document.addEventListener("mousedown", function () { el.classList.add("is-down"); });
    document.addEventListener("mouseup", function () { el.classList.remove("is-down"); });

    var hoverables = "a, button, summary, input, select, textarea, .magnetic, .svc__row, .case, .slot";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest && e.target.closest(hoverables)) el.classList.add("is-hover");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest && e.target.closest(hoverables)) el.classList.remove("is-hover");
    });

    (function loop() {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
      requestAnimationFrame(loop);
    })();
  })();

  /* ---------------------------------------------------------
     2. Split text
     --------------------------------------------------------- */
  function splitWords(root) {
    if (!root || root.dataset.splitDone === "true") return;

    function walk(node) {
      var children = Array.prototype.slice.call(node.childNodes);
      children.forEach(function (child) {
        if (child.nodeType === 3) {
          var text = child.nodeValue;
          if (!text.trim()) return;
          var frag = document.createDocumentFragment();
          text.split(/(\s+)/).forEach(function (chunk) {
            if (!chunk) return;
            if (/^\s+$/.test(chunk)) {
              frag.appendChild(document.createTextNode(" "));
              return;
            }
            var word = document.createElement("span");
            word.className = "split-word";
            var inner = document.createElement("span");
            inner.textContent = chunk;
            word.appendChild(inner);
            frag.appendChild(word);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          if (child.classList && child.classList.contains("split-word")) return;
          walk(child);
        }
      });
    }

    walk(root);
    root.dataset.splitDone = "true";
  }

  var splitTargets = $$("[data-split]");
  if (!reduceMotion) {
    splitTargets.forEach(splitWords);

    var splitObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var words = $$(".split-word > span", el);
        words.forEach(function (word, i) {
          word.style.transitionDelay = Math.min(i * 42, 520) + "ms";
        });
        el.classList.add("is-split-in");
        splitObserver.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

    splitTargets.forEach(function (el) { splitObserver.observe(el); });
  }

  /* ---------------------------------------------------------
     3. Scroll reveals
     --------------------------------------------------------- */
  var revealEls = $$(".reveal, [data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    revealEls.forEach(function (el, i) {
      if (!el.style.transitionDelay) {
        var stagger = Number(el.dataset.delay || 0);
        if (stagger) el.style.transitionDelay = stagger + "ms";
      }
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------------------------------------------------------
     4. Nav, progress, mobile menu
     --------------------------------------------------------- */
  (function nav() {
    var nav = $("#nav");
    var bar = $(".progress__bar");
    var menuBtn = $("#menuBtn");
    var menu = $("#mobileMenu");
    var ticking = false;

    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      if (nav) nav.classList.toggle("is-scrolled", y > 24);
      if (bar) {
        var doc = document.documentElement;
        var max = doc.scrollHeight - window.innerHeight;
        var pct = max > 0 ? Math.min(y / max, 1) : 0;
        bar.style.width = (pct * 100).toFixed(2) + "%";
      }
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(onScroll);
    }, { passive: true });

    onScroll();

    var menuTimer = 0;

    function closeMenu() {
      if (!menu || !menuBtn) return;
      window.clearTimeout(menuTimer);
      menu.classList.remove("is-open");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "Open menu");
      document.body.classList.remove("is-locked");
      menuTimer = window.setTimeout(function () {
        if (!menu.classList.contains("is-open")) {
          menu.setAttribute("hidden", "");
          menu.setAttribute("aria-hidden", "true");
        }
      }, reduceMotion ? 40 : 650);
    }

    function openMenu() {
      if (!menu || !menuBtn) return;
      window.clearTimeout(menuTimer);
      menu.removeAttribute("hidden");
      menu.setAttribute("aria-hidden", "false");
      void menu.offsetWidth;
      menu.classList.add("is-open");
      menuBtn.setAttribute("aria-expanded", "true");
      menuBtn.setAttribute("aria-label", "Close menu");
      document.body.classList.add("is-locked");
    }

    if (menuBtn && menu) {
      menuBtn.addEventListener("click", function () {
        if (menu.classList.contains("is-open")) closeMenu();
        else openMenu();
      });

      $$("a", menu).forEach(function (link) {
        link.addEventListener("click", closeMenu);
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && menu.classList.contains("is-open")) {
          closeMenu();
          menuBtn.focus();
        }
      });

      window.matchMedia("(min-width: 1101px)").addEventListener("change", function (e) {
        if (e.matches) closeMenu();
      });
    }
  })();

  /* ---------------------------------------------------------
     5. Counters
     --------------------------------------------------------- */
  (function counters() {
    var nums = $$("[data-count]");
    if (!nums.length) return;

    function animate(el) {
      var target = parseFloat(el.dataset.count);
      var decimals = parseInt(el.dataset.decimals || "0", 10);
      var duration = reduceMotion ? 0 : 1600;
      var start = performance.now();

      if (!duration) {
        el.textContent = target.toFixed(decimals);
        return;
      }

      function frame(now) {
        var t = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = (target * eased).toFixed(decimals);
        if (t < 1) requestAnimationFrame(frame);
        else el.textContent = target.toFixed(decimals);
      }
      requestAnimationFrame(frame);
    }

    if (!("IntersectionObserver" in window)) {
      nums.forEach(animate);
      return;
    }

    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animate(entry.target);
        counterObserver.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    nums.forEach(function (el) { counterObserver.observe(el); });
  })();

  /* ---------------------------------------------------------
     6. Process scroll sync
     --------------------------------------------------------- */
  (function process() {
    var steps = $$(".step[data-step]");
    var big = $("[data-process-num]");
    var word = $("[data-process-word]");
    var minis = $$("[data-mini]");
    if (!steps.length) return;

    var current = -1;

    function setStep(index) {
      if (index === current) return;
      current = index;
      var step = steps[index];

      steps.forEach(function (s, i) { s.classList.toggle("is-active", i === index); });

      if (big) {
        big.textContent = step.dataset.num || String(index + 1).padStart(2, "0");
      }
      if (word) {
        word.textContent = step.dataset.word || "";
      }
      minis.forEach(function (m, i) { m.classList.toggle("is-active", i === index); });
    }

    function evaluate() {
      var viewport = window.innerHeight;
      var best = 0;
      var bestDist = Infinity;
      steps.forEach(function (step, i) {
        var rect = step.getBoundingClientRect();
        var center = rect.top + rect.height / 2;
        var dist = Math.abs(center - viewport * 0.5);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setStep(best);
    }

    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        evaluate();
        ticking = false;
      });
    }, { passive: true });

    evaluate();
  })();

  /* ---------------------------------------------------------
     7. Quote carousel
     --------------------------------------------------------- */
  (function carousel() {
    var root = $("[data-carousel]");
    if (!root) return;

    var quotes = $$(".quote", root);
    var dots = $$("[data-dot]", root);
    var prev = $("[data-prev]", root);
    var next = $("[data-next]", root);
    if (quotes.length < 2) return;

    var index = 0;
    var timer = null;
    var paused = false;

    function show(i) {
      index = (i + quotes.length) % quotes.length;
      quotes.forEach(function (q, n) { q.classList.toggle("is-active", n === index); });
      dots.forEach(function (d, n) {
        d.classList.toggle("is-active", n === index);
        d.setAttribute("aria-selected", n === index ? "true" : "false");
        d.setAttribute("tabindex", n === index ? "0" : "-1");
      });
    }

    function start() {
      if (reduceMotion || timer) return;
      timer = window.setInterval(function () {
        if (!paused) show(index + 1);
      }, 6800);
    }

    function stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    if (prev) prev.addEventListener("click", function () { show(index - 1); start(); });
    if (next) next.addEventListener("click", function () { show(index + 1); start(); });

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () { show(i); start(); });
    });

    root.addEventListener("mouseenter", function () { paused = true; });
    root.addEventListener("mouseleave", function () { paused = false; });
    root.addEventListener("focusin", function () { paused = true; });
    root.addEventListener("focusout", function () { paused = false; });

    var region = root.matches(".quotes") ? root : $(".quotes", root);
    if (region) {
      region.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") { show(index - 1); start(); }
        if (e.key === "ArrowRight") { show(index + 1); start(); }
      });
    }

    show(0);
    start();
  })();

  /* ---------------------------------------------------------
     8. Magnetic buttons
     --------------------------------------------------------- */
  (function magnetic() {
    if (!finePointer || reduceMotion) return;
    var els = $$(".magnetic");

    els.forEach(function (el) {
      var strength = 18;
      el.addEventListener("mousemove", function (e) {
        var rect = el.getBoundingClientRect();
        var mx = e.clientX - rect.left - rect.width / 2;
        var my = e.clientY - rect.top - rect.height / 2;
        el.style.transform = "translate(" + (mx / rect.width) * strength + "px," + (my / rect.height) * strength + "px)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transform = "";
      });
    });
  })();

  /* ---------------------------------------------------------
     9. Clock
     --------------------------------------------------------- */
  (function clock() {
    var el = $("[data-clock]");
    if (!el) return;
    var formatter;
    try {
      formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/London",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    } catch (err) {
      return;
    }

    function tick() {
      var time = formatter.format(new Date());
      el.textContent = "LONDON " + time;
    }
    tick();
    window.setInterval(tick, 15000);
  })();

  /* ---------------------------------------------------------
     10. Year
     --------------------------------------------------------- */
  (function year() {
    $$("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  })();

  /* ---------------------------------------------------------
     11. Booking form
     --------------------------------------------------------- */
  (function booking() {
    var form = $("#bookingForm");
    if (!form) return;

    var success = $("#formSuccess");
    var detail = $("[data-success-detail]");
    var reset = $("[data-reset]");
    var card = $(".contact__card");
    var emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

    function fieldOf(input) {
      return input.closest(".field") || input.closest(".slot");
    }

    function setError(input, message) {
      var field = fieldOf(input);
      if (!field) return;
      field.classList.add("is-invalid");
      var msg = field.querySelector("[data-error]");
      if (msg && message) msg.textContent = message;
      input.setAttribute("aria-invalid", "true");
    }

    function clearError(input) {
      var field = fieldOf(input);
      if (!field) return;
      field.classList.remove("is-invalid");
      input.removeAttribute("aria-invalid");
    }

    function validate() {
      var ok = true;
      var firstInvalid = null;

      var checks = [
        { el: $("#name"), test: function (v) { return v.trim().length > 1; }, msg: "Please tell us your name." },
        { el: $("#company"), test: function (v) { return v.trim().length > 1; }, msg: "Which company are you with?" },
        { el: $("#email"), test: function (v) { return emailRe.test(v.trim()); }, msg: "That email doesn't look right." },
        { el: $("#budget"), test: function (v) { return !!v; }, msg: "Pick a range — 'not sure' is fine." },
        { el: $("#goal"), test: function (v) { return v.trim().length > 8; }, msg: "A sentence or two helps us prepare." }
      ];

      checks.forEach(function (check) {
        var input = check.el;
        if (!input) return;
        if (!check.test(input.value)) {
          setError(input, check.msg);
          ok = false;
          if (!firstInvalid) firstInvalid = input;
        } else {
          clearError(input);
        }
      });

      var slot = $('input[name="slot"]:checked');
      var slotGroup = $(".slots");
      if (!slot && slotGroup) {
        slotGroup.classList.add("is-invalid");
        ok = false;
      } else if (slotGroup) {
        slotGroup.classList.remove("is-invalid");
      }

      if (!ok && firstInvalid) {
        firstInvalid.focus({ preventScroll: false });
      }
      return ok;
    }

    $$("input, select, textarea", form).forEach(function (input) {
      var evt = input.tagName === "SELECT" ? "change" : "input";
      input.addEventListener(evt, function () { clearError(input); });
      input.addEventListener("blur", function () {
        if (input.value.trim() && input.id !== "website_url") clearError(input);
      });
    });

    $$('input[name="slot"]', form).forEach(function (radio) {
      radio.addEventListener("change", function () {
        var group = $(".slots");
        if (group) group.classList.remove("is-invalid");
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var honeypot = $("#website_url");
      if (honeypot && honeypot.value) {
        showSuccess("Thanks — we'll be in touch.", "We've received your note.");
        return;
      }

      if (!validate()) return;

      var submit = $('button[type="submit"]', form);
      var submitLabel = submit ? $("span", submit) : null;
      form.classList.add("is-sending");
      if (submit) submit.setAttribute("aria-busy", "true");
      if (submitLabel) {
        submitLabel.dataset.label = submitLabel.textContent;
        submitLabel.textContent = "Sending…";
      }

      var name = ($("#name") && $("#name").value.trim().split(/\s+/)[0]) || "there";
      var slot = $('input[name="slot"]:checked');
      var slotLabel = "";
      if (slot) {
        slotLabel = (slot.value || "").trim();
        if (!slotLabel) {
          var label = slot.closest(".slot");
          var span = label ? label.querySelector("span") : null;
          slotLabel = span ? span.textContent.replace(/\s+/g, " ").trim() : "";
        }
      }

      window.setTimeout(function () {
        var message = "Thanks " + name + " — your request is in.";
        if (slotLabel) message += " We'll confirm your " + slotLabel + " slot by email within one working day.";
        else message += " We'll be in touch within one working day.";
        showSuccess(message, "A calendar invite and a short prep note are on their way.");
      }, 900);
    });

    function showSuccess(title, copy) {
      form.classList.remove("is-sending");
      var submit = $('button[type="submit"]', form);
      var submitLabel = submit ? $("span", submit) : null;
      if (submit) submit.removeAttribute("aria-busy");
      if (submitLabel) submitLabel.textContent = (submitLabel.dataset && submitLabel.dataset.label) || "Request my strategy call";
      form.setAttribute("hidden", "");
      if (success) {
        success.removeAttribute("hidden");
        var h3 = success.querySelector("h3");
        var p = success.querySelector("p");
        if (h3) h3.textContent = title;
        if (p && copy) p.textContent = copy;
        if (detail) detail.textContent = copy;
        success.focus && success.focus();
      }
      if (card) card.classList.add("is-done");
    }

    if (reset) {
      reset.addEventListener("click", function () {
        form.reset();
        form.classList.remove("is-sending");
        var submit = $('button[type="submit"]', form);
        var submitLabel = submit ? $("span", submit) : null;
        if (submit) submit.removeAttribute("aria-busy");
        if (submitLabel && submitLabel.dataset.label) submitLabel.textContent = submitLabel.dataset.label;
        $$(".is-invalid", form).forEach(function (el) { el.classList.remove("is-invalid"); });
        $$("[aria-invalid]", form).forEach(function (el) { el.removeAttribute("aria-invalid"); });
        if (success) success.setAttribute("hidden", "");
        form.removeAttribute("hidden");
        if (card) card.classList.remove("is-done");
        var first = $("#name");
        if (first) first.focus();
      });
    }
  })();

  /* ---------------------------------------------------------
     12. FAQ — one open at a time
     --------------------------------------------------------- */
  (function faq() {
    var items = $$(".faq__item");
    if (items.length < 2) return;
    items.forEach(function (item) {
      item.addEventListener("toggle", function () {
        if (!item.open) return;
        items.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      });
    });
  })();

  /* ---------------------------------------------------------
     13. Anchor offset glow (active nav link)
     --------------------------------------------------------- */
  (function activeSection() {
    var links = $$('.nav__links a[href^="#"]');
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (link) {
      var id = link.getAttribute("href");
      var section = id.length > 1 ? $(id) : null;
      if (section) map[section.id] = link;
    });

    var sections = Object.keys(map).map(function (id) { return document.getElementById(id); });
    if (!sections.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = map[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.classList.remove("is-current"); });
          link.classList.add("is-current");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    sections.forEach(function (s) { observer.observe(s); });
  })();

  /* ---------------------------------------------------------
     14. Expose current year to CSS-safe attribute (debug)
     --------------------------------------------------------- */
  document.documentElement.setAttribute("data-js", "on");
})();
