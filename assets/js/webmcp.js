// Joyfully Present — WebMCP tools.
// Exposes the site's key actions to in-browser AI agents via navigator.modelContext.
// Every tool is read-only or simple navigation. Nothing here can book, pay, cancel or change data;
// booking is completed by the person on book.html (where the security check lives).
(function () {
  "use strict";

  var mc = navigator.modelContext;
  if (!mc || typeof mc.registerTool !== "function") return; // browser doesn't support WebMCP

  var API_BASE = "https://api.joyfullypresent.life";
  var SITE = location.origin;

  var PAGES = {
    home:        { path: "index.html",     about: "Home — overview of Joyfully Present Life Coaching" },
    about:       { path: "about.html",     about: "About the coach and her approach" },
    services:    { path: "services.html",  about: "Coaching sessions, free discovery call and session bundles with prices" },
    book:        { path: "book.html",      about: "Book a session (choose a service, date and time)" },
    resources:   { path: "resources.html", about: "Free downloadable resources and social posts" },
    forms:       { path: "forms.html",     about: "Intake forms and documents clients complete before a session" },
    faq:         { path: "faq.html",       about: "Frequently asked questions, including scheduling and cancellations" },
    appointments:{ path: "my-appointments.html", about: "Signed-in clients: view and manage their appointments" },
    privacy:     { path: "privacy.html",   about: "Privacy policy" },
    terms:       { path: "terms.html",     about: "Terms of service" }
  };

  function text(value) {
    return { content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }] };
  }
  function fail(message) {
    return { isError: true, content: [{ type: "text", text: message }] };
  }
  function pageUrl(path) { return new URL(path, location.href).toString(); }
  function money(cents) { return "$" + (cents / 100).toFixed(2); }

  async function getJson(path) {
    var res = await fetch(API_BASE + path, { method: "GET" });
    if (!res.ok) throw new Error("The booking service returned an error (" + res.status + ").");
    return res.json();
  }

  var tools = [
    {
      name: "get_business_info",
      description: "Basic facts about Joyfully Present Life Coaching: what it is, how sessions are delivered, how to get in touch.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: async function () {
        return text({
          name: "Joyfully Present Life Coaching LLC",
          website: SITE,
          delivery: "All sessions are held online over Zoom.",
          contact_email: "hello@joyfullypresent.life",
          mailing_address: "440 N Barranca Ave #9885, Covina, CA 91723",
          timezone: "America/Los_Angeles (Pacific Time)",
          how_to_book: "Use get_services to see offerings, get_available_times to see open slots, then start_booking to open the booking page."
        });
      }
    },
    {
      name: "list_pages",
      description: "List the main pages of the website with a short description of each.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: async function () {
        return text(Object.keys(PAGES).map(function (key) {
          return { page: key, url: pageUrl(PAGES[key].path), description: PAGES[key].about };
        }));
      }
    },
    {
      name: "navigate_to_page",
      description: "Open a page of the website in the current tab.",
      inputSchema: {
        type: "object",
        properties: { page: { type: "string", enum: Object.keys(PAGES), description: "Which page to open." } },
        required: ["page"],
        additionalProperties: false
      },
      execute: async function (args) {
        var page = PAGES[args && args.page];
        if (!page) return fail("Unknown page. Use list_pages to see the options.");
        var url = pageUrl(page.path);
        setTimeout(function () { location.href = url; }, 50);
        return text("Opening " + url);
      }
    },
    {
      name: "get_services",
      description: "Get every bookable service and session bundle with id, description, duration and price. Use the id with get_available_times and start_booking.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: async function () {
        try {
          var data = await getJson("/api/services");
          return text((data.services || []).map(function (s) {
            var item = {
              id: s.id,
              name: s.name,
              description: s.description || "",
              price: s.price_cents === 0 ? "Free" : money(s.price_cents),
              type: s.is_package ? "session bundle" : "single session"
            };
            if (s.is_package) {
              item.sessions_included = s.package_size;
              item.note = "Credits expire exactly 12 months from purchase and are not transferable. Bundle sessions are booked later as a Single Coaching Session using prepaid session credits.";
            } else {
              item.duration_minutes = s.duration_minutes;
              if (s.one_time_only) item.note = "One-time offer per client.";
            }
            return item;
          }));
        } catch (err) { return fail(err.message || "Could not load services."); }
      }
    },
    {
      name: "get_available_times",
      description: "List open appointment times for one service on one date (Pacific Time). Returns nothing for bundles, which have no time slot.",
      inputSchema: {
        type: "object",
        properties: {
          service_id: { type: "string", description: "A service id from get_services." },
          date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", description: "Date as YYYY-MM-DD." }
        },
        required: ["service_id", "date"],
        additionalProperties: false
      },
      annotations: { readOnlyHint: true },
      execute: async function (args) {
        if (!args || !args.service_id || !/^\d{4}-\d{2}-\d{2}$/.test(args.date || "")) {
          return fail("Provide service_id and a date formatted YYYY-MM-DD.");
        }
        try {
          var data = await getJson("/api/availability?date=" + encodeURIComponent(args.date) + "&service_id=" + encodeURIComponent(args.service_id));
          var slots = data.slots || [];
          if (!slots.length) return text("No open times on " + args.date + ". Try another date.");
          return text({ date: args.date, open_times: slots.map(function (s) { return { start_time: s.start_time, label: s.label }; }) });
        } catch (err) { return fail(err.message || "Could not load availability."); }
      }
    },
    {
      name: "start_booking",
      description: "Open the booking page for a service so the person can finish booking themselves. This does NOT book anything: they still enter their details and complete a security check.",
      inputSchema: {
        type: "object",
        properties: { service_id: { type: "string", description: "A service id from get_services." } },
        required: ["service_id"],
        additionalProperties: false
      },
      execute: async function (args) {
        if (!args || !args.service_id) return fail("Provide a service_id from get_services.");
        var url = pageUrl("book.html?service=" + encodeURIComponent(args.service_id));
        setTimeout(function () { location.href = url; }, 50);
        return text("Opening the booking page: " + url + ". The person must pick a time, enter their details and complete the security check to confirm.");
      }
    },
    {
      name: "get_faq",
      description: "Get the website's frequently asked questions and answers (scheduling, session bundles, payment, cancellations).",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: async function () {
        try {
          var res = await fetch(pageUrl("faq.html"));
          if (!res.ok) throw new Error("Could not load the FAQ page.");
          var doc = new DOMParser().parseFromString(await res.text(), "text/html");
          var items = Array.prototype.map.call(doc.querySelectorAll("details"), function (d) {
            var q = d.querySelector("summary");
            var a = Array.prototype.map.call(d.querySelectorAll("p, li"), function (el) { return el.textContent.trim(); }).join(" ");
            return { question: q ? q.textContent.trim() : "", answer: a };
          }).filter(function (i) { return i.question; });
          return text(items);
        } catch (err) { return fail(err.message || "Could not load the FAQ."); }
      }
    },
    {
      name: "get_booking_policies",
      description: "Cancellation, refund and session-bundle rules.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: async function () {
        return text({
          cancellation_and_refunds: "Cancel at least 24 hours before the session for a full refund (to the card, or the session credit is returned to the bundle). Cancelling less than 24 hours before is not refundable and credits are not returned.",
          session_bundles: "Credits expire exactly 12 months from purchase and sessions are not transferable.",
          using_bundle_credits: "Book a Single Coaching Session while signed in, then choose 'Use prepaid session credits'.",
          full_terms: pageUrl("terms.html")
        });
      }
    },
    {
      name: "get_free_resources",
      description: "List the free downloadable resources offered on the website, with links.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: async function () {
        try {
          var data = await getJson("/api/resources");
          var list = (data.resources || []).map(function (r) { return { title: r.title, description: r.description || "", url: r.file_url }; });
          return text(list.length ? list : "There are no free resources listed right now.");
        } catch (err) { return fail(err.message || "Could not load resources."); }
      }
    }
  ];

  // One AbortController owns every registration, so aborting it unregisters all the tools at once.
  var controller = null;

  function registerAll() {
    if (controller) return;
    controller = new AbortController();
    tools.forEach(function (tool) {
      try {
        mc.registerTool(tool, { signal: controller.signal });
      } catch (err) {
        console.warn("WebMCP: could not register " + tool.name, err);
      }
    });
  }

  function unregisterAll() {
    if (!controller) return;
    controller.abort();
    controller = null;
    // Older WebMCP builds ignore the signal and use unregisterTool instead.
    if (typeof mc.unregisterTool === "function") {
      tools.forEach(function (tool) { try { mc.unregisterTool(tool.name); } catch (err) { /* already gone */ } });
    }
  }

  registerAll();
  window.addEventListener("pagehide", unregisterAll);
  window.addEventListener("pageshow", function (e) { if (e.persisted) registerAll(); });
})();
