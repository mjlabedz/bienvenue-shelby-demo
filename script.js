const TODAY = "Oct 6";

const DRAFT = [
  "Holly,",
  "Thank you for writing. I would be glad to stock the fridge and pantry before you arrive in Charleston — shopped, put away, and ready when you walk in.",
  "",
  "To prepare a proposal, I still need your arrival and departure dates, the property or Airbnb address, and how many guests will be staying. Grocery preferences, dietary restrictions or allergies, your arrival time, and a special occasion, if there is one, would help too.",
  "",
  "Best,",
  "Shelby"
].join("\n");

const HOLLY_REPLY = [
  "Hi Shelby,",
  "",
  "Thank you! We arrive October 18 around 3:00 PM and leave October 21. We are staying at 123 King Street and there will be six of us.",
  "",
  "No food allergies. We would like breakfast items, snacks, wine, sparkling water, coffee, and some basics for the weekend. We are celebrating a birthday.",
  "",
  "Thanks,",
  "Holly"
].join("\n");

const ORIGINAL_INQUIRY = "Hi Shelby, I wanted to inquire about what the process and cost is like for you to stock the fridge and pantry for our Airbnb before we arrive in Charleston in a couple weeks. Any helpful information is great. Thank you, Holly Ann Johnson.";

const HOLLY_ACCEPT = [
  "Hi Shelby,",
  "",
  "This looks great. Please go ahead.",
  "",
  "Thank you,",
  "Holly"
].join("\n");

const HOLLY_LIST = [
  "Hi Shelby,",
  "",
  "The grocery list looks good. Please proceed.",
  "",
  "Thanks,",
  "Holly"
].join("\n");

const TASKS = [
  ["list", "Confirm final grocery list"],
  ["purchase", "Purchase groceries"],
  ["access", "Confirm property access"],
  ["stock", "Stock refrigerator and pantry"],
  ["receipt", "Record receipt / expenses"],
  ["notify", "Notify guest that setup is complete"]
];

const SAMPLES = [
  {
    id: "camille",
    customer: "Camille Laurent",
    service: "Welcome basket",
    place: "King Street",
    dates: "Sep 18–21",
    value: 325,
    completed: "Sep 21",
    checklist: [
      ["Confirm the welcome basket", "Complete"],
      ["Purchase flowers and breakfast items", "Complete"],
      ["Confirm property access", "Complete"],
      ["Set the welcome", "Complete"],
      ["Record receipt / expenses", "Complete"],
      ["Notify guest that setup is complete", "Complete"]
    ],
    notes: [
      ["Arrival", "Sep 18, afternoon"],
      ["Property access", "Lockbox"],
      ["Dietary preferences", "No nuts"],
      ["Special requests", "Champagne on arrival"]
    ],
    activity: [
      ["Sep 2", "Inquiry received"],
      ["Sep 4", "Proposal sent"],
      ["Sep 5", "Proposal accepted"],
      ["Sep 21", "Guest notified that setup was complete"],
      ["Sep 21", "Job marked complete"]
    ],
    proposal: "Welcome basket for the King Street stay, including flowers and breakfast items.\n\nSample total: $325.\n\nBest,\nShelby"
  },
  {
    id: "thomas",
    customer: "Thomas Adler",
    service: "Airport greeting",
    place: "Vendue Range",
    dates: "Sep 4",
    value: 180,
    completed: "Sep 4",
    checklist: [
      ["Confirm the flight", "Complete"],
      ["Confirm the driver", "Complete"],
      ["Meet the guest", "Complete"],
      ["Record receipt / expenses", "Complete"],
      ["Notify guest that the greeting is complete", "Complete"]
    ],
    notes: [
      ["Arrival", "Sep 4, evening flight"],
      ["Property access", "Not needed for this greeting"],
      ["Dietary preferences", "None for this job"],
      ["Special requests", "Sign with the guest’s name"]
    ],
    activity: [
      ["Aug 20", "Inquiry received"],
      ["Aug 22", "Proposal sent"],
      ["Aug 22", "Proposal accepted"],
      ["Sep 4", "Guest met at the airport"],
      ["Sep 4", "Job marked complete"]
    ],
    proposal: "Airport greeting and transfer to Vendue Range.\n\nSample total: $180.\n\nBest,\nShelby"
  }
];

function freshState() {
  return {
    phase: "none",
    followUpSent: false,
    replyReceived: false,
    acceptanceNoted: false,
    groceryConfirmed: false,
    scopeSaved: false,
    draftEditing: false,
    draft: DRAFT,
    proposalLogged: false,
    sentLogged: false,
    acceptedLogged: false,
    completedLogged: false,
    completedOn: "",
    jobsTab: "active",
    selectedJob: "holly",
    proposalEditing: false,
    proposalCustom: false,
    proposalSaved: false,
    proposalText: "",
    proposalPhase: "draft",
    scope: {
      grocery: true,
      loadIn: true,
      concierge: false,
      notes: "",
      prices: { grocery: 275, loadIn: 125, concierge: 75 }
    },
    tasks: TASKS.map(([id, name]) => ({ id, name, status: "Not Started" })),
    activity: []
  };
}

const state = freshState();
const shownCounts = {};
const historyOpen = {};
let toastTimer = 0;
let foldContext = "";

const $ = (id) => document.getElementById(id);

function showView(name) {
  document.querySelectorAll(".view").forEach((view) => {
    view.hidden = view.dataset.view !== name;
  });
  document.querySelectorAll(".nav-button").forEach((button) => {
    const active = button.dataset.view === name
      || (name === "job" && button.dataset.view === "jobs")
      || (name === "proposal" && button.dataset.view === "proposals")
      || (name === "inquiry" && button.dataset.view === "inquiries");
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  refresh();
  const main = document.querySelector(".main");
  if (main) main.scrollTop = 0;
}

function readScope() {
  state.scope.grocery = $("scope-grocery").checked;
  state.scope.loadIn = $("scope-loadin").checked;
  state.scope.concierge = $("scope-concierge").checked;
  state.scope.notes = $("scope-notes").value.trim();
  state.draft = $("draft-input").value;
}

function services() {
  const items = [];
  if (state.scope.grocery) {
    items.push({ name: "Grocery stocking", note: "Bienvenue service fee", amount: state.scope.prices.grocery });
  }
  if (state.scope.loadIn) {
    items.push({ name: "Load-in / stocking fee", note: "Bienvenue service fee", amount: state.scope.prices.loadIn });
  }
  if (state.scope.concierge) {
    items.push({ name: "Concierge services", note: "Optional, included here", amount: state.scope.prices.concierge });
  }
  return items;
}

function total() {
  return services().reduce((sum, item) => sum + item.amount, 0);
}

function money(amount) {
  return "$" + amount;
}

function shortService() {
  if (state.scope.grocery) return "Grocery stocking";
  if (state.scope.concierge) return "Concierge services";
  if (state.scope.loadIn) return "Load-in";
  return "Services to confirm";
}

function timingLabel() {
  return state.replyReceived ? "October 18–21" : "In a couple of weeks";
}

function placeLabel() {
  return state.replyReceived ? "123 King Street" : "Charleston";
}

function nextTask() {
  return state.tasks.find((task) => task.status !== "Complete") || null;
}

function nextAction() {
  const task = nextTask();
  return task ? task.name : "All work complete";
}

function log(text) {
  state.activity.push({ when: TODAY, text });
}

function stageIndex() {
  if (state.phase === "proposal") return 1;
  if (state.phase === "job") return 2;
  if (state.phase === "complete") return 3;
  return 0;
}

function sampleById(id) {
  return SAMPLES.find((sample) => sample.id === id) || null;
}

function hollyActive() {
  return state.selectedJob === "holly" && state.phase === "job";
}

function proposalStatusWord() {
  if (state.phase === "complete") return "Completed";
  if (state.phase === "job" || state.proposalPhase === "accepted") return "Accepted";
  if (state.proposalPhase === "sent") return "Sent";
  return "Draft";
}

function proposalLocked() {
  return state.phase === "job" || state.phase === "complete";
}

function missingStayDetails() {
  if (state.replyReceived) return [];
  return ["dates", "property", "guest count"];
}

function setButtonTone(button, primary) {
  button.classList.toggle("button-primary", primary);
  button.classList.toggle("button-quiet", !primary);
}

function hideToast() {
  clearTimeout(toastTimer);
  $("mail-toast").hidden = true;
}

function showToast(from, snippet, view) {
  const toast = $("mail-toast");
  $("mail-from").textContent = from;
  $("mail-snippet").textContent = snippet;
  toast.dataset.mailView = view;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 9000);
}

function paintRails() {
  const labels = ["Inquiry", "Proposal", "Active Job", "Completed"];
  document.querySelectorAll(".stage-rail").forEach((rail) => {
    const current = rail.closest(".view-proposal") && state.phase === "proposal"
      ? 1
      : stageIndex();
    rail.replaceChildren();
    labels.forEach((label, index) => {
      const step = document.createElement("span");
      if (index < current) step.className = "is-done";
      if (index === current) step.className = "is-current";
      step.textContent = label;
      rail.appendChild(step);
    });
  });
}

function paintDraft() {
  $("draft-text").textContent = state.draft;
  $("draft-input").value = state.draft;
  $("draft-text").hidden = state.draftEditing;
  $("draft-input").hidden = !state.draftEditing;
  $("edit-draft").textContent = state.draftEditing ? "Done" : "Edit Draft";
  $("edit-draft").setAttribute("aria-pressed", state.draftEditing ? "true" : "false");
  $("draft-heading").textContent = state.followUpSent ? "Follow-up sent" : "Draft reply";
}

function fillKnown(pairs) {
  const list = $("known-list");
  list.replaceChildren();
  pairs.forEach(([label, value]) => {
    const wrap = document.createElement("div");
    const term = document.createElement("dt");
    term.textContent = label;
    const detail = document.createElement("dd");
    detail.textContent = value;
    wrap.append(term, detail);
    list.appendChild(wrap);
  });
}

function fillNeeds(items, clear) {
  const list = $("still-need");
  list.replaceChildren();
  items.forEach((text) => {
    const item = document.createElement("li");
    if (clear) item.className = "is-clear";
    item.textContent = text;
    list.appendChild(item);
  });
}

function hollyMessages() {
  if (state.phase === "none") return [];
  const messages = [{
    who: "Holly Ann Johnson",
    source: "Gmail",
    when: "Received today",
    label: "Initial inquiry received",
    body: ORIGINAL_INQUIRY,
    direction: "in"
  }];
  if (state.followUpSent) {
    messages.push({
      who: "Shelby",
      source: "Gmail",
      when: "Sent today",
      label: "Follow-up sent",
      body: state.draft,
      direction: "out"
    });
  }
  if (state.replyReceived) {
    messages.push({
      who: "Holly Ann Johnson",
      source: "Gmail",
      when: "Received today",
      label: "Holly reply received",
      body: HOLLY_REPLY,
      direction: "in"
    });
  }
  if (state.sentLogged) {
    messages.push({
      who: "Shelby",
      source: "Gmail",
      when: "Sent today",
      label: "Proposal sent",
      body: proposalBody(),
      direction: "out"
    });
  }
  if (state.acceptanceNoted) {
    messages.push({
      who: "Holly Ann Johnson",
      source: "Gmail",
      when: "Received today",
      label: "Proposal approved",
      body: HOLLY_ACCEPT,
      direction: "in"
    });
  }
  if (state.groceryConfirmed) {
    messages.push({
      who: "Holly Ann Johnson",
      source: "Gmail",
      when: "Received today",
      label: "Grocery list confirmed",
      body: HOLLY_LIST,
      direction: "in"
    });
  }
  return messages;
}

function sampleMessages(sample) {
  return sample.activity.map(([when, text]) => {
    const incoming = /received|accepted/i.test(text);
    return {
      who: incoming ? sample.customer : "Shelby",
      source: "Record",
      when: when,
      label: text,
      body: text,
      direction: incoming ? "in" : "out"
    };
  });
}

function isHistoryOpen(key) {
  if (Object.prototype.hasOwnProperty.call(historyOpen, key)) return historyOpen[key];
  return (key === "job" && state.phase === "complete") || key.indexOf("job-") === 0;
}

function messageCard(message, latest) {
  const card = document.createElement("article");
  card.className = "comm " + (message.direction === "in" ? "is-in" : "is-out");
  const meta = document.createElement("p");
  meta.className = "comm-meta";
  const way = document.createElement("span");
  way.className = "comm-way";
  way.textContent = message.direction === "in" ? "Incoming" : "Outgoing";
  const who = document.createElement("strong");
  who.textContent = message.who;
  const detail = document.createElement("span");
  detail.textContent = latest
    ? "· " + [message.source, message.when].filter(Boolean).join(" · ")
    : "· " + message.label;
  meta.append(way, who, detail);
  card.appendChild(meta);
  if (latest || message.body !== message.label) {
    const body = document.createElement("p");
    body.className = "comm-body";
    body.textContent = message.body;
    card.appendChild(body);
  }
  return card;
}

function paintThread(container, messages, key) {
  container.replaceChildren();
  if (!messages.length) {
    container.hidden = true;
    return;
  }
  container.hidden = false;
  const newest = messages[messages.length - 1];
  const older = messages.slice(0, -1).reverse();
  const heading = document.createElement("h2");
  heading.textContent = "Latest Communication";
  container.append(heading, messageCard(newest, true));
  if (!older.length) return;
  const open = isHistoryOpen(key);
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "history-toggle";
  toggle.dataset.history = key;
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
  toggle.textContent = "Conversation History";
  const panel = document.createElement("div");
  panel.className = "thread-history";
  panel.hidden = !open;
  older.forEach((message) => panel.appendChild(messageCard(message, false)));
  container.append(toggle, panel);
}

function paintInquiryDetails() {
  const known = [
    ["Customer", "Holly Ann Johnson"],
    ["Destination", "Charleston"],
    ["Timing", timingLabel()],
    ["Requested service", "Grocery / fridge / pantry stocking"]
  ];
  if (state.replyReceived) {
    known.push(
      ["Property", "123 King Street"],
      ["Party size", "6"],
      ["Arrival", "Approximately 3:00 PM"],
      ["Preferences", "Breakfast items, snacks, wine, sparkling water, coffee, weekend basics"],
      ["Dietary restrictions", "None"],
      ["Occasion", "Birthday"]
    );
  }
  fillKnown(known);
  if (state.replyReceived) fillNeeds(["Nothing required before proposal"], true);
  else {
    fillNeeds([
      "Exact arrival / departure dates",
      "Property / Airbnb location",
      "Party size",
      "Grocery preferences",
      "Dietary restrictions / allergies",
      "Arrival time",
      "Special occasion, if any"
    ], false);
  }
  $("inquiry-lede").textContent = [shortService(), placeLabel(), timingLabel()].join(" · ");
  paintThread($("inquiry-thread"), hollyMessages(), "inquiry");
  const onInquiry = state.phase === "inquiry";
  $("send-followup").hidden = !onInquiry || state.followUpSent;
  $("followup-sent").hidden = !state.followUpSent;
  setButtonTone($("create-proposal"), onInquiry && state.replyReceived);
  if (document.activeElement !== $("scope-notes")) $("scope-notes").value = state.scope.notes;
}

function attentionItems() {
  if (state.phase === "inquiry" && !state.followUpSent) {
    return [{
      customer: "Holly Ann Johnson",
      stage: "Inquiry",
      reason: "New Gmail inquiry",
      next: "Review inquiry",
      view: "inquiry"
    }];
  }
  if (state.phase === "inquiry" && !state.replyReceived) {
    return [{
      customer: "Holly Ann Johnson",
      stage: "Inquiry",
      reason: "Follow-up sent",
      next: "Awaiting Holly reply",
      view: "inquiry"
    }];
  }
  if (state.phase === "inquiry") {
    return [{
      customer: "Holly Ann Johnson",
      stage: "Inquiry",
      reason: "Holly replied",
      next: "Ready to create proposal",
      view: "inquiry"
    }];
  }
  if (state.phase === "proposal" && state.proposalPhase === "draft") {
    return [{
      customer: "Holly Ann Johnson",
      stage: "Proposal",
      reason: "Draft ready to send",
      next: "Send Proposal",
      view: "proposal"
    }];
  }
  if (state.phase === "proposal" && !state.acceptanceNoted) {
    return [{
      customer: "Holly Ann Johnson",
      stage: "Proposal",
      reason: "Proposal sent",
      next: "Awaiting customer response",
      view: "proposal"
    }];
  }
  if (state.phase === "proposal") {
    return [{
      customer: "Holly Ann Johnson",
      stage: "Proposal",
      reason: "Customer approved proposal",
      next: "Mark accepted",
      view: "proposal"
    }];
  }
  if (state.phase === "job") {
    const task = nextTask();
    return [{
      customer: "Holly Ann Johnson",
      stage: "Active Job",
      reason: task ? "Work in progress" : "All work complete",
      next: task ? task.name : "Mark Job Complete",
      view: "job",
      jobId: "holly"
    }];
  }
  return [];
}

function scanRow(cells, options) {
  const row = document.createElement(options.view ? "button" : "div");
  row.className = "job-row";
  if (options.sample) row.classList.add("is-sample");
  if (options.view) {
    row.type = "button";
    row.dataset.view = options.view;
    if (options.jobId) row.dataset.jobId = options.jobId;
  }
  cells.forEach((text, index) => {
    const cell = document.createElement("span");
    if (index === 0) {
      const name = document.createElement("strong");
      name.textContent = text;
      cell.appendChild(name);
    } else {
      cell.textContent = text;
    }
    if (index === options.nextIndex) cell.className = "job-next";
    if (index === options.statusIndex) cell.className = "job-status";
    row.appendChild(cell);
  });
  return row;
}

function setCount(id, value) {
  const node = $(id);
  const text = String(value);
  if (shownCounts[id] !== undefined && shownCounts[id] !== text) {
    node.classList.remove("is-changed");
    void node.offsetWidth;
    node.classList.add("is-changed");
    window.setTimeout(() => node.classList.remove("is-changed"), 700);
  }
  shownCounts[id] = text;
  node.textContent = text;
}

function paintDashboard() {
  setCount("count-inquiries", state.phase === "inquiry" ? 1 : 0);
  setCount("count-proposals", state.phase === "proposal" ? 1 : 0);
  setCount("count-jobs", state.phase === "job" ? 1 : 0);
  const items = attentionItems();
  setCount("count-attention", items.length);
  const attention = $("attention-list");
  attention.replaceChildren(jobHead(["Customer", "Stage", "Reason", "Next"]));
  if (!items.length) attention.appendChild(emptyLine("Nothing needs attention right now."));
  items.forEach((item) => {
    attention.appendChild(scanRow(
      [item.customer, item.stage, item.reason, item.next],
      { view: item.view, jobId: item.jobId, nextIndex: 3 }
    ));
  });
  paintDemoCue();
  const upcoming = $("upcoming-list");
  upcoming.replaceChildren(jobHead(["Customer", "Service", "Timing", "Next", "Status"]));
  if (state.phase === "job") {
    upcoming.appendChild(scanRow(
      ["Holly Ann Johnson", shortService(), timingLabel(), nextAction(), "Active"],
      { view: "job", jobId: "holly", nextIndex: 3, statusIndex: 4 }
    ));
  }
  upcoming.appendChild(scanRow(
    ["Example stay", "Pantry stocking", "Oct 18", "Confirm the list", "Example"],
    { sample: true, nextIndex: 3, statusIndex: 4 }
  ));
  upcoming.appendChild(scanRow(
    ["Example stay", "Airport greeting", "Oct 24", "Confirm the flight", "Example"],
    { sample: true, nextIndex: 3, statusIndex: 4 }
  ));
}

function paintDemoCue() {
  const cue = $("demo-next");
  const buttons = {
    incoming: $("simulate-incoming"),
    reply: $("simulate-reply"),
    response: $("simulate-accept"),
    grocery: $("simulate-grocery")
  };
  let text = "";
  let active = "";
  const next = state.phase === "job" ? nextTask() : null;
  const view = document.querySelector("main .view:not([hidden])");
  const viewName = view ? view.dataset.view : "dashboard";
  if (state.phase === "none") {
    active = "incoming";
    text = "· Next: Simulate incoming email";
  } else if (state.phase === "inquiry" && !state.followUpSent) {
    text = viewName === "inquiry" ? "· Next: Send follow-up" : "· Next: Review inquiry";
  } else if (state.phase === "inquiry" && !state.replyReceived) {
    active = "reply";
    text = "· Next: Simulate Holly reply";
  } else if (state.phase === "inquiry") {
    text = "· Next: Create proposal";
  } else if (state.phase === "proposal" && state.proposalPhase === "draft") {
    text = "· Next: Send proposal";
  } else if (state.phase === "proposal" && !state.acceptanceNoted) {
    active = "response";
    text = "· Next: Simulate Holly response";
  } else if (state.phase === "proposal") {
    text = "· Next: Mark accepted";
  } else if (state.phase === "job" && next && next.id === "list" && !state.groceryConfirmed) {
    active = "grocery";
    text = "· Next: Simulate grocery list confirmation";
  } else if (state.phase === "job" && next) {
    text = "· Next: " + next.name;
  } else if (state.phase === "job") {
    text = "· Next: Mark job complete";
  }
  Object.keys(buttons).forEach((key) => {
    buttons[key].hidden = key !== active;
  });
  cue.hidden = !text;
  cue.textContent = text;
}

function receiveHollyReply() {
  if (state.phase !== "inquiry" || !state.followUpSent || state.replyReceived) return;
  state.replyReceived = true;
  if (!state.scope.notes) {
    state.scope.notes = "Birthday weekend. Breakfast items, snacks, wine, sparkling water, coffee, and weekend basics. No food allergies.";
  }
  log("Holly reply received");
  showToast(
    "Holly Ann Johnson",
    "We arrive October 18 around 3:00 PM and leave October 21. We are staying at 123 King Street and there will be six of us.",
    "inquiry"
  );
  refresh();
}

function receiveHollyResponse() {
  if (state.phase !== "proposal" || state.proposalPhase !== "sent" || state.acceptanceNoted) return;
  state.acceptanceNoted = true;
  log("Holly accepted by email");
  showToast(
    "Holly Ann Johnson",
    "This looks great. Please go ahead.",
    "proposal"
  );
  refresh();
}

function confirmGroceryList() {
  if (state.phase !== "job" || state.groceryConfirmed) return;
  const task = state.tasks.find((entry) => entry.id === "list");
  if (!task || task.status === "Complete") return;
  task.status = "Complete";
  state.groceryConfirmed = true;
  log("Confirm final grocery list completed");
  showToast(
    "Holly Ann Johnson",
    "The grocery list looks good. Please proceed.",
    "job"
  );
  refresh();
}

function proposalBody() {
  return state.proposalCustom ? state.proposalText : proposalLetter();
}

function proposalLetter() {
  const chosen = services();
  const lines = [
    "Holly,",
    state.scope.grocery
      ? "I would be glad to stock the fridge and pantry before you arrive in Charleston."
      : "Here is a proposal for your Charleston stay."
  ];
  if (state.replyReceived) {
    lines.push("");
    lines.push("October 18–21 at 123 King Street. Six guests, arriving around 3:00 PM.");
  }
  lines.push("");
  lines.push("Service fees");
  chosen.forEach((item) => {
    lines.push(item.name + " — " + money(item.amount));
  });
  if (!state.scope.concierge) lines.push("Optional concierge services — not included");
  lines.push("Service fees: " + money(total()));
  lines.push("");
  lines.push("Groceries are purchased for you and billed separately at actual cost.");
  if (!state.replyReceived) lines.push("Dates, the property, and the guest count are still open.");
  if (state.scope.notes) lines.push(state.scope.notes);
  lines.push("");
  lines.push("Best,");
  lines.push("Shelby");
  return lines.join("\n");
}

function assumptionLines() {
  const lines = [
    "Grocery stocking and the load-in fee are Bienvenue service fees.",
    "Groceries are billed separately at actual cost."
  ];
  if (state.replyReceived) {
    lines.push("Stay is October 18–21 at 123 King Street, party of 6, arriving around 3:00 PM.");
    lines.push("No food allergies. The stay is a birthday weekend.");
  } else {
    lines.push("Dates, property, guest count, preferences, and arrival time are still unknown.");
  }
  lines.push(state.scope.concierge
    ? "Concierge services are included in this draft."
    : "Concierge services are not included.");
  return lines;
}

function fillPrices(list, totalNode, chosen, amount, showOptional, totalLabelText) {
  list.replaceChildren();
  if (!chosen.length) {
    const empty = document.createElement("li");
    empty.textContent = "No services selected yet.";
    list.appendChild(empty);
  }
  chosen.forEach((item) => {
    const row = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = item.name;
    if (item.note) {
      const detail = document.createElement("small");
      detail.textContent = item.note;
      label.appendChild(detail);
    }
    const price = document.createElement("span");
    price.textContent = money(item.amount);
    row.append(label, price);
    list.appendChild(row);
  });
  if (showOptional) {
    const optional = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = "Optional concierge services";
    const detail = document.createElement("small");
    detail.textContent = "Not included";
    label.appendChild(detail);
    const price = document.createElement("span");
    price.textContent = "—";
    optional.append(label, price);
    list.appendChild(optional);
  }
  totalNode.replaceChildren();
  const totalLabel = document.createElement("span");
  totalLabel.textContent = totalLabelText || "Sample total";
  const totalAmount = document.createElement("span");
  totalAmount.textContent = money(amount);
  totalNode.append(totalLabel, totalAmount);
}

function fillFacts(list, pairs) {
  list.replaceChildren();
  pairs.forEach(([label, value, unknown]) => {
    const term = document.createElement("dt");
    term.textContent = label;
    const detail = document.createElement("dd");
    if (unknown) detail.className = "unknown";
    detail.textContent = value;
    list.append(term, detail);
  });
}

function fillPlain(list, lines) {
  list.replaceChildren();
  lines.forEach((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    list.appendChild(item);
  });
}

function parsePrice(value) {
  const digits = String(value).replace(/[^0-9]/g, "");
  return digits ? Number(digits) : 0;
}

function paintPriceLine(key, checkId, amountId, fieldId, offId) {
  const included = state.scope[key];
  const locked = proposalLocked();
  $(checkId).checked = included;
  $(checkId).disabled = locked;
  const amount = $(amountId);
  amount.disabled = locked;
  if (document.activeElement !== amount) amount.value = String(state.scope.prices[key]);
  $(fieldId).hidden = !included;
  $(offId).hidden = included;
  $(checkId).closest(".price-line").classList.toggle("is-off", !included);
}

function paintProposal() {
  $("proposal-meta").textContent = [
    shortService(),
    placeLabel(),
    timingLabel(),
    money(total()),
    proposalStatusWord()
  ].join("  |  ");
  paintPriceLine("grocery", "price-grocery", "price-grocery-amount", "price-grocery-field", "price-grocery-off");
  paintPriceLine("loadIn", "price-loadin", "price-loadin-amount", "price-loadin-field", "price-loadin-off");
  paintPriceLine("concierge", "price-concierge", "price-concierge-amount", "price-concierge-field", "price-concierge-off");
  $("price-total-amount").textContent = money(total());
  const notes = $("proposal-notes");
  notes.hidden = !state.scope.notes;
  notes.textContent = state.scope.notes || "";
  const text = proposalBody();
  $("proposal-letter").textContent = text;
  if (document.activeElement !== $("proposal-input")) $("proposal-input").value = text;
  const locked = proposalLocked();
  const word = proposalStatusWord();
  const readyToAccept = state.phase === "proposal" && word === "Sent" && state.acceptanceNoted;
  if (locked) state.proposalEditing = false;
  $("proposal-letter").hidden = state.proposalEditing;
  $("proposal-input").hidden = !state.proposalEditing;
  $("proposal-saved").hidden = locked || !state.proposalSaved;
  $("edit-proposal").hidden = locked;
  $("save-proposal").hidden = locked;
  $("send-proposal").hidden = locked || readyToAccept;
  $("send-proposal").textContent = word === "Draft" ? "Send Proposal" : "Resend Proposal";
  setButtonTone($("send-proposal"), word === "Draft");
  $("mark-accepted").hidden = !readyToAccept;
  $("view-active-job").hidden = state.phase !== "job" && state.phase !== "complete";
  $("view-active-job").textContent = state.phase === "complete" ? "View Completed Job" : "View Active Job";
  if (locked || word !== "Draft") $("send-warning").hidden = true;
  $("inquiry-price-grocery").textContent = money(state.scope.prices.grocery);
  $("inquiry-price-loadin").textContent = money(state.scope.prices.loadIn);
  $("inquiry-price-concierge").textContent = money(state.scope.prices.concierge);
  $("scope-grocery").checked = state.scope.grocery;
  $("scope-loadin").checked = state.scope.loadIn;
  $("scope-concierge").checked = state.scope.concierge;
  paintThread($("proposal-thread"), hollyMessages(), "proposal");
  paintProposalList();
  paintInquiryList();
}

function proposalHead(labels) {
  const row = document.createElement("div");
  row.className = "proposal-head";
  labels.forEach((text) => {
    const cell = document.createElement("span");
    cell.textContent = text;
    row.appendChild(cell);
  });
  return row;
}

function proposalCells(values) {
  return values.map((text, index) => {
    const cell = document.createElement("span");
    if (index === 0) {
      const name = document.createElement("strong");
      name.textContent = text;
      cell.appendChild(name);
    } else {
      cell.textContent = text;
    }
    if (index === 4) cell.className = "job-status";
    return cell;
  });
}

function paintProposalList() {
  const list = $("proposal-list");
  list.replaceChildren(proposalHead(["Customer", "Service", "Timing", "Total", "Status"]));
  if (state.phase !== "proposal") {
    list.appendChild(emptyLine("No open proposals."));
    return;
  }
  const holly = document.createElement("button");
  holly.type = "button";
  holly.className = "proposal-row";
  holly.dataset.view = "proposal";
  proposalCells([
    "Holly Ann Johnson",
    shortService(),
    timingLabel(),
    money(total()),
    proposalStatusWord()
  ]).forEach((cell) => holly.appendChild(cell));
  list.appendChild(holly);
}

function inquiryStatusWord() {
  if (!state.followUpSent) return "New";
  if (!state.replyReceived) return "Awaiting reply";
  return "Ready";
}

function paintInquiryList() {
  const list = $("inquiry-list");
  list.replaceChildren(proposalHead(["Customer", "Service", "Timing", "Status"]));
  if (state.phase !== "inquiry") {
    list.appendChild(emptyLine("No new inquiries."));
    return;
  }
  const holly = document.createElement("button");
  holly.type = "button";
  holly.className = "proposal-row inquiry-row";
  holly.dataset.view = "inquiry";
  ["Holly Ann Johnson", shortService(), timingLabel(), inquiryStatusWord()].forEach((text, index) => {
    const cell = document.createElement("span");
    if (index === 0) {
      const name = document.createElement("strong");
      name.textContent = text;
      cell.appendChild(name);
    } else {
      cell.textContent = text;
    }
    if (index === 3) cell.className = "job-status";
    holly.appendChild(cell);
  });
  list.appendChild(holly);
}

function jobHead(labels) {
  const row = document.createElement("div");
  row.className = "job-head";
  labels.forEach((text) => {
    const cell = document.createElement("span");
    cell.textContent = text;
    row.appendChild(cell);
  });
  return row;
}

function jobButton(data) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "job-row";
  button.dataset.view = "job";
  button.dataset.jobId = data.id;
  [data.customer, data.service, data.date, data.value, data.extra, data.status].forEach((text, index) => {
    const cell = document.createElement("span");
    if (index === 0) {
      const name = document.createElement("strong");
      name.textContent = text;
      cell.appendChild(name);
    } else {
      cell.textContent = text;
    }
    if (index === 4 && data.next) cell.className = "job-next";
    if (index === 5) cell.className = "job-status";
    button.appendChild(cell);
  });
  return button;
}

function emptyLine(text) {
  const line = document.createElement("p");
  line.className = "job-empty";
  line.textContent = text;
  return line;
}

function paintJobs() {
  const activeTab = state.jobsTab !== "completed";
  $("tab-active").setAttribute("aria-selected", activeTab ? "true" : "false");
  $("tab-completed").setAttribute("aria-selected", activeTab ? "false" : "true");
  $("job-active-panel").hidden = !activeTab;
  $("job-completed-panel").hidden = activeTab;

  const activeList = $("job-active-list");
  activeList.replaceChildren();
  activeList.appendChild(jobHead(["Customer", "Service", "Date", "Value", "Next", "Status"]));
  if (state.phase === "job") {
    activeList.appendChild(jobButton({
      id: "holly",
      customer: "Holly Ann Johnson",
      service: shortService(),
      date: timingLabel(),
      value: money(total()),
      extra: nextAction(),
      next: true,
      status: "Active"
    }));
  } else {
    activeList.appendChild(emptyLine("No active jobs."));
  }

  const completedList = $("job-completed-list");
  completedList.replaceChildren();
  completedList.appendChild(jobHead(["Customer", "Service", "Date", "Value", "Completed", "Status"]));
  if (state.phase === "complete") {
    completedList.appendChild(jobButton({
      id: "holly",
      customer: "Holly Ann Johnson",
      service: shortService(),
      date: timingLabel(),
      value: money(total()),
      extra: state.completedOn,
      status: "Completed"
    }));
  }
  SAMPLES.forEach((sample) => {
    completedList.appendChild(jobButton({
      id: sample.id,
      customer: sample.customer,
      service: sample.service,
      date: sample.dates,
      value: money(sample.value),
      extra: sample.completed,
      status: "Completed"
    }));
  });
}

function paintChecklist(items, editable) {
  const list = $("task-list");
  list.replaceChildren();
  const nextId = (items.find((task) => task.status !== "Complete") || {}).id || "";
  items.forEach((task) => {
    const item = document.createElement("li");
    item.className = "task";
    const done = task.status === "Complete";
    if (done) item.classList.add("is-complete");
    if (task.id === nextId) item.classList.add("is-next");
    const label = document.createElement("label");
    label.className = "check-line";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.task = task.id;
    input.checked = done;
    input.disabled = !editable;
    const name = document.createElement("span");
    name.className = "task-name";
    name.textContent = task.name;
    label.append(input, name);
    item.appendChild(label);
    list.appendChild(item);
  });
}

function setFolds(open) {
  document.querySelectorAll(".fold-toggle").forEach((button) => {
    const body = document.getElementById(button.getAttribute("aria-controls"));
    body.hidden = !open;
    button.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

function syncFolds(open) {
  const context = state.selectedJob + ":" + state.phase;
  if (context === foldContext) return;
  foldContext = context;
  setFolds(open);
}

function paintHollyJob() {
  const done = state.phase === "complete";
  const editable = hollyActive();
  $("job-customer").textContent = "Holly Ann Johnson";
  $("job-service").textContent = shortService();
  $("job-lede").textContent = [
    placeLabel(),
    timingLabel(),
    money(total()) + " service fees",
    done ? "Completed " + state.completedOn : "Active"
  ].join("  |  ");
  $("job-rail").hidden = false;
  $("work-heading").textContent = done ? "What was done" : "What Needs to Be Done";
  $("next-action").textContent = done
    ? ""
    : (nextTask() ? "Next: " + nextAction() : "All work complete");
  paintChecklist(state.tasks, editable);
  $("complete-actions").hidden = !editable;
  const notePairs = state.replyReceived
    ? [
      ["Arrival", "October 18, approximately 3:00 PM"],
      ["Departure", "October 21"],
      ["Property", "123 King Street"],
      ["Party size", "6"],
      ["Dietary preferences", "None"],
      ["Occasion", "Birthday"],
      ["Preferences", "Breakfast items, snacks, wine, sparkling water, coffee, weekend basics"]
    ]
    : [
      ["Arrival", "Not yet known · in a couple of weeks", true],
      ["Property", "Not yet confirmed", true],
      ["Party size", "Not yet known", true],
      ["Dietary preferences", "Not yet known", true]
    ];
  const shelbyNote = $("job-notes").value.trim();
  if (!editable && shelbyNote) notePairs.push(["Shelby’s note", shelbyNote]);
  fillFacts($("job-notes-list"), notePairs);
  const scopeNotes = $("job-scope-notes");
  scopeNotes.hidden = !state.scope.notes;
  scopeNotes.textContent = state.scope.notes ? "From the scope: " + state.scope.notes : "";
  $("job-notes").hidden = !editable;
  paintThread($("job-thread"), hollyMessages(), "job");
  fillPrices($("job-price-list"), $("job-price-total"), services(), total(), !state.scope.concierge, "Service fees");
  fillPlain($("job-assumptions"), assumptionLines());
  $("job-proposal-letter").textContent = proposalBody();
  syncFolds(done);
}

function paintSampleJob(sample) {
  $("job-customer").textContent = sample.customer;
  $("job-service").textContent = sample.service;
  $("job-lede").textContent = [sample.place, sample.dates, money(sample.value), "Completed " + sample.completed].join("  |  ");
  $("job-rail").hidden = true;
  $("work-heading").textContent = "What was done";
  $("next-action").textContent = "";
  paintChecklist(sample.checklist.map(([name, status]) => ({ id: name, name, status })), false);
  $("complete-actions").hidden = true;
  fillFacts($("job-notes-list"), sample.notes.map(([label, value]) => [label, value]));
  $("job-scope-notes").hidden = true;
  $("job-notes").hidden = true;
  paintThread($("job-thread"), sampleMessages(sample), "job-" + sample.id);
  fillPrices(
    $("job-price-list"),
    $("job-price-total"),
    [{ name: sample.service, note: "Delivered", amount: sample.value }],
    sample.value,
    false
  );
  fillPlain($("job-assumptions"), ["Sample pricing for the prototype, not a Bienvenue rate."]);
  $("job-proposal-letter").textContent = sample.proposal;
  syncFolds(true);
}

function paintJob() {
  if (state.selectedJob !== "holly") {
    const sample = sampleById(state.selectedJob);
    if (sample) {
      paintSampleJob(sample);
      return;
    }
    state.selectedJob = "holly";
  }
  paintHollyJob();
}

function paintInquiryStatus() {
  $("scope-saved").hidden = !state.scopeSaved;
}

function refresh() {
  paintRails();
  paintDraft();
  paintInquiryDetails();
  paintDashboard();
  paintInquiryStatus();
  paintProposal();
  paintJobs();
  paintJob();
}

function resetDemo() {
  const next = freshState();
  Object.keys(state).forEach((key) => {
    delete state[key];
  });
  Object.assign(state, next);
  foldContext = "";
  Object.keys(historyOpen).forEach((key) => {
    delete historyOpen[key];
  });
  $("scope-notes").value = "";
  $("job-notes").value = "";
  $("draft-input").value = DRAFT;
  $("send-warning").hidden = true;
  hideToast();
  showView("dashboard");
}

document.body.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-view]");
  if (!button) return;
  if (button.dataset.jobsTab) state.jobsTab = button.dataset.jobsTab;
  if (button.dataset.jobId) state.selectedJob = button.dataset.jobId;
  showView(button.dataset.view);
});

$("attention-card").addEventListener("click", () => {
  showView("dashboard");
  $("attention-heading").scrollIntoView({ block: "start" });
});

$("mail-toast").addEventListener("click", () => {
  const view = $("mail-toast").dataset.mailView;
  hideToast();
  if (view) showView(view);
});

$("simulate-incoming").addEventListener("click", () => {
  if (state.phase !== "none") return;
  state.phase = "inquiry";
  log("Inquiry received by Gmail");
  showToast(
    "Holly Ann Johnson",
    "Hi Shelby, I wanted to inquire about what the process and cost is like for you to stock the fridge and pantry…",
    "inquiry"
  );
  refresh();
});

$("reset-demo").addEventListener("click", resetDemo);

$("tab-active").addEventListener("click", () => {
  state.jobsTab = "active";
  paintJobs();
});

$("tab-completed").addEventListener("click", () => {
  state.jobsTab = "completed";
  paintJobs();
});

$("back-to-jobs").addEventListener("click", () => {
  state.jobsTab = state.selectedJob === "holly" && state.phase === "job" ? "active" : "completed";
  showView("jobs");
});

$("edit-draft").addEventListener("click", () => {
  if (state.draftEditing) state.draft = $("draft-input").value;
  state.draftEditing = !state.draftEditing;
  paintDraft();
});

$("save-reply").addEventListener("click", () => {
  readScope();
  state.draftEditing = false;
  state.scopeSaved = true;
  refresh();
});

$("send-followup").addEventListener("click", () => {
  if (state.phase !== "inquiry" || state.followUpSent) return;
  if (state.draftEditing) state.draft = $("draft-input").value;
  state.draftEditing = false;
  state.followUpSent = true;
  log("Follow-up sent");
  showView("dashboard");
});

$("simulate-reply").addEventListener("click", receiveHollyReply);

$("create-proposal").addEventListener("click", () => {
  if (state.phase !== "inquiry") return;
  readScope();
  state.draftEditing = false;
  state.phase = "proposal";
  state.proposalPhase = "draft";
  if (!state.proposalLogged) {
    log("Proposal created");
    state.proposalLogged = true;
  }
  showView("proposal");
});

function readProposalPrices() {
  state.scope.grocery = $("price-grocery").checked;
  state.scope.loadIn = $("price-loadin").checked;
  state.scope.concierge = $("price-concierge").checked;
  state.scope.prices.grocery = parsePrice($("price-grocery-amount").value);
  state.scope.prices.loadIn = parsePrice($("price-loadin-amount").value);
  state.scope.prices.concierge = parsePrice($("price-concierge-amount").value);
}

["price-grocery", "price-loadin", "price-concierge"].forEach((id) => {
  $(id).addEventListener("change", () => {
    readProposalPrices();
    refresh();
  });
});

["price-grocery-amount", "price-loadin-amount", "price-concierge-amount"].forEach((id) => {
  $(id).addEventListener("input", () => {
    readProposalPrices();
    refresh();
  });
});

$("edit-proposal").addEventListener("click", () => {
  if (proposalLocked()) return;
  if (!state.proposalCustom) state.proposalText = proposalLetter();
  state.proposalEditing = true;
  state.proposalSaved = false;
  refresh();
});

$("save-proposal").addEventListener("click", () => {
  if (proposalLocked()) return;
  state.proposalText = $("proposal-input").value;
  state.proposalCustom = true;
  state.proposalEditing = false;
  state.proposalSaved = true;
  if (!state.activity.some((entry) => entry.text === "Proposal updated")) log("Proposal updated");
  refresh();
});

$("back-to-proposals").addEventListener("click", () => {
  showView("proposals");
});

$("back-to-inquiries").addEventListener("click", () => {
  showView("inquiries");
});

function markProposalSent() {
  const resend = state.proposalPhase === "sent";
  state.phase = "proposal";
  state.proposalPhase = "sent";
  if (!state.sentLogged) {
    log("Proposal sent");
    state.sentLogged = true;
  } else if (resend && !state.activity.some((entry) => entry.text === "Proposal resent")) {
    log("Proposal resent");
  }
  state.proposalLogged = true;
  $("send-warning").hidden = true;
  showView("dashboard");
}

$("send-proposal").addEventListener("click", () => {
  if (proposalLocked()) return;
  if (state.proposalPhase === "draft" && missingStayDetails().length) {
    $("send-warning").hidden = false;
    return;
  }
  markProposalSent();
});

$("send-cancel").addEventListener("click", () => {
  $("send-warning").hidden = true;
});

$("send-anyway").addEventListener("click", () => {
  markProposalSent();
});

$("simulate-accept").addEventListener("click", receiveHollyResponse);
$("simulate-grocery").addEventListener("click", confirmGroceryList);

$("mark-accepted").addEventListener("click", () => {
  if (state.phase !== "proposal" || !state.acceptanceNoted) return;
  readScope();
  state.selectedJob = "holly";
  state.jobsTab = "active";
  state.proposalPhase = "accepted";
  state.phase = "job";
  if (!state.acceptedLogged) {
    log("Proposal marked accepted");
    state.acceptedLogged = true;
  }
  showView("job");
});

$("view-active-job").addEventListener("click", () => {
  state.selectedJob = "holly";
  state.jobsTab = state.phase === "complete" ? "completed" : "active";
  showView("job");
});

$("mark-complete").addEventListener("click", () => {
  if (state.phase !== "job") return;
  state.phase = "complete";
  state.completedOn = TODAY;
  state.jobsTab = "active";
  state.selectedJob = "holly";
  if (!state.completedLogged) {
    log("Job marked complete");
    state.completedLogged = true;
  }
  showView("dashboard");
});

$("scope-grocery").addEventListener("change", readScope);
$("scope-loadin").addEventListener("change", readScope);
$("scope-concierge").addEventListener("change", readScope);
$("scope-notes").addEventListener("input", readScope);

$("task-list").addEventListener("change", (event) => {
  const input = event.target;
  if (!input.matches("input[type=checkbox]") || !hollyActive()) return;
  const task = state.tasks.find((entry) => entry.id === input.dataset.task);
  if (!task) return;
  const next = input.checked ? "Complete" : "Not Started";
  if (task.status === next) return;
  task.status = next;
  log(task.name + (input.checked ? " completed" : " reopened"));
  refresh();
});

document.body.addEventListener("click", (event) => {
  const toggle = event.target.closest(".history-toggle");
  if (!toggle) return;
  historyOpen[toggle.dataset.history] = toggle.getAttribute("aria-expanded") !== "true";
  refresh();
});

document.querySelectorAll(".fold-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const body = document.getElementById(button.getAttribute("aria-controls"));
    const open = body.hidden;
    body.hidden = !open;
    button.setAttribute("aria-expanded", open ? "true" : "false");
  });
});

refresh();
