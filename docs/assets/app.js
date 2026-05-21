const categoryOrder = [
  "Against proposed Zoning Changes",
  "Neutral",
  "In Favor of proposed Zoning Changes",
];

const shortCategory = new Map([
  ["Against proposed Zoning Changes", "Against"],
  ["Neutral", "Neutral"],
  ["In Favor of proposed Zoning Changes", "In favor"],
]);

const classByCategory = new Map([
  ["Against proposed Zoning Changes", "against"],
  ["Neutral", "neutral"],
  ["In Favor of proposed Zoning Changes", "favor"],
]);

const toneByCategory = new Map([
  ["Against proposed Zoning Changes", "tone-negative"],
  ["Neutral", "tone-neutral"],
  ["In Favor of proposed Zoning Changes", "tone-positive"],
]);

const genericTopicLabels = new Set([
  "General stance",
  "General opposition",
  "General support",
  "Unclear or neutral",
  "Uncategorized response",
]);

const downloads = [
  { title: "Raw survey results", href: "documents/raw-survey-results.pdf", format: "PDF", description: "Original 90+ page survey export used as the source document." },
  { title: "Zone 4A classifications", href: "data/zone-4a-classified.csv", format: "CSV", description: "Enriched row-level classification output for Zone 4A responses." },
  { title: "Zone 5B classifications", href: "data/zone-5b-classified.csv", format: "CSV", description: "Enriched row-level classification output for Zone 5B responses." },
  { title: "Combined classifications", href: "data/combined-classified.csv", format: "CSV", description: "Both analyzed zones in one reusable file." },
  { title: "Topic tags", href: "data/topic-tags.csv", format: "CSV", description: "One row per response-topic assignment using provisional keyword-assisted tags." },
  { title: "Summary data", href: "data/summary.json", format: "JSON", description: "Counts and percentages powering the dashboard." },
  { title: "Topic summary", href: "data/topic-summary.json", format: "JSON", description: "Topic counts, taxonomy notes, and stance-by-topic totals." },
  { title: "Decision brief data", href: "data/decision-brief.json", format: "JSON", description: "Meeting-ready summary metrics, takeaways, and discussion questions." },
  { title: "Concerns by zone", href: "data/concerns-by-zone.json", format: "JSON", description: "Provisional topic and concern counts by zone." },
  { title: "Review queue", href: "data/review-queue.json", format: "JSON", description: "Rows prioritized for human review by confidence or mixed-response flag." },
  { title: "Representative cards", href: "data/representative-cards.json", format: "JSON", description: "Name-free representative public comment theme cards." },
  { title: "Generated file manifest", href: "data/manifest.json", format: "JSON", description: "File inventory with byte sizes, generated date, and source relationships." },
  { title: "All classifications workbook", href: "documents/narberth-zoning-classifications.xlsx", format: "XLSX", description: "Excel workbook with overview, row-level data, and topic tags." },
  { title: "Zone 4A workbook", href: "documents/zone-4a-classified.xlsx", format: "XLSX", description: "Excel workbook for Zone 4A row-level classifications." },
  { title: "Zone 5B workbook", href: "documents/zone-5b-classified.xlsx", format: "XLSX", description: "Excel workbook for Zone 5B row-level classifications." },
  { title: "Findings summary", href: "documents/zoning-sentiment-analysis.md", format: "Markdown", description: "Narrative summary of methodology, totals, and high-level readout." },
  { title: "Project repository", href: "https://github.com/DaveVoyles/Narberth-Zoning", format: "GitHub", description: "Source files, history, and contribution context." },
];

const state = {
  summary: null,
  manifest: null,
  topicSummary: null,
  decisionBrief: null,
  concernsByZone: null,
  reviewQueue: null,
  representativeCards: null,
  pageSummary: [],
  rows: [],
  sort: { field: "zone", direction: "asc" },
};

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function fetchJson(href) {
  const response = await fetch(href);
  if (!response.ok) {
    throw new Error(`${href} returned ${response.status}`);
  }
  return response.json();
}

function formatBytes(bytes) {
  if (!bytes) return "Static file";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

async function getFileSize(href) {
  if (href.startsWith("http")) return null;
  try {
    const response = await fetch(href, { method: "HEAD" });
    const length = response.headers.get("content-length");
    return length ? Number(length) : null;
  } catch {
    return null;
  }
}

function setupNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector("#nav-links");
  const navLinks = [...document.querySelectorAll(".nav-links a")];
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }
  function updateActive() {
    const hash = window.location.hash || "#home";
    navLinks.forEach((link) => {
      if (link.href.startsWith("http") && new URL(link.href).origin !== window.location.origin) {
        link.classList.remove("active");
        return;
      }
      const href = new URL(link.href, window.location.href);
      const currentPage = window.location.pathname.split("/").pop() || "index.html";
      const linkPage = href.pathname.split("/").pop() || "index.html";
      const samePage = currentPage === linkPage;
      const isCurrentHash = currentPage === "index.html" && samePage && href.hash === hash;
      const isCurrentPage = currentPage !== "index.html" && samePage;
      link.classList.toggle("active", isCurrentHash || isCurrentPage);
      if (isCurrentHash || isCurrentPage) {
        link.setAttribute("aria-current", currentPage === "index.html" ? "location" : "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }
  window.addEventListener("hashchange", updateActive);
  updateActive();
}

function renderSummaryCards() {
  const target = document.querySelector("#summary-cards");
  if (!target) return;
  target.innerHTML = state.summary.zones.map((zone) => {
    const against = categoryItem(zone, categoryOrder[0]);
    const neutral = categoryItem(zone, categoryOrder[1]);
    const favor = categoryItem(zone, categoryOrder[2]);
    const segments = [
      { item: against, label: "against", className: "against" },
      { item: neutral, label: "neutral", className: "neutral" },
      { item: favor, label: "in favor", className: "favor" },
    ].map(({ item, label, className }) => `
      <span class="segment ${className}" style="width:${item.percent}%">
        <span class="visually-hidden">${item.percent}% ${label}</span>
      </span>
    `).join("");
    return `
      <div class="stat summary-stat">
        <span class="stat-value tone-negative">${against.percent}%</span>
        <span class="stat-label">${escapeHtml(zone.zone)} against as written</span>
        <ul class="summary-breakdown" aria-label="${escapeHtml(zone.zone)} response counts">
          <li class="tone-negative">${against.count} against</li>
          <li class="tone-positive">${favor.count} in favor</li>
          <li>${zone.totalResponses} total</li>
        </ul>
        <div class="summary-rounded-bar" aria-hidden="true">${segments}</div>
      </div>
    `;
  }).join("");
}

function renderBarChart() {
  const chart = document.querySelector("#bar-chart");
  if (!chart) return;
  chart.innerHTML = state.summary.zones.map((zone) => {
    const segments = categoryOrder.map((category) => {
      const item = categoryItem(zone, category);
      return `<span class="segment ${classByCategory.get(category)}" style="width:${item.percent}%">${item.percent}%</span>`;
    }).join("");
    return `<div class="bar-group"><strong>${escapeHtml(zone.zone)}</strong><div><div class="stack">${segments}</div></div></div>`;
  }).join("") + legendHtml();
}

function legendHtml() {
  return `
    <div class="legend" aria-hidden="true">
      <span><i class="swatch"></i>Against</span>
      <span><i class="swatch neutral"></i>Neutral</span>
      <span><i class="swatch favor"></i>In favor</span>
    </div>
  `;
}

function renderChartTextSummary() {
  const target = document.querySelector("#chart-text-summary");
  if (!target) return;
  target.innerHTML = state.summary.zones.map((zone) => {
    const parts = zone.categories
      .map((entry) => {
        const label = shortCategory.get(entry.category).toLowerCase();
        const tone = toneByCategory.get(entry.category) || "tone-neutral";
        return `<span class="${tone}">${entry.count} ${label} (${entry.percent}%)</span>`;
      })
      .join(", ");
    return `<p><strong>${escapeHtml(zone.zone)}:</strong> ${parts}.</p>`;
  }).join("");
}

function renderSourceDocuments() {
  const target = document.querySelector("#source-documents");
  if (!target) return;
  target.innerHTML = (state.summary.sourceDocuments || []).map((source) => `
    <article class="source-card compact-source-card">
      <div>
        <h3>${escapeHtml(source.title)}</h3>
        <p><strong>${escapeHtml(source.role)}</strong> · ${escapeHtml(source.scope)}</p>
      </div>
      <a class="button small-button" href="${escapeHtml(source.href)}" download>Open</a>
    </article>
  `).join("");
}

function sourceReferenceHtml(pages) {
  return `
    <p class="source-reference">
      Source reference: <a href="documents/raw-survey-results.pdf">Raw survey PDF</a>, pages ${escapeHtml(pages)}.
    </p>
  `;
}

function renderDifferenceChart() {
  const target = document.querySelector("#difference-chart");
  if (!target) return;
  const zone4a = state.summary.zones.find((zone) => zone.zone === "Zone 4A");
  const zone5b = state.summary.zones.find((zone) => zone.zone === "Zone 5B");
  if (!zone4a || !zone5b) return;
  target.innerHTML = categoryOrder.map((category) => {
    const left = categoryItem(zone4a, category);
    const right = categoryItem(zone5b, category);
    const diff = Number((left.percent - right.percent).toFixed(1));
    const width = Math.min(Math.abs(diff) * 8, 100);
    const label = diff === 0
      ? "No difference"
      : `${Math.abs(diff).toFixed(1)} points ${diff > 0 ? "higher in Zone 4A" : "higher in Zone 5B"}`;
    return `
      <div class="difference-row">
        <strong>${escapeHtml(shortCategory.get(category))}</strong>
        <span class="difference-track">
          <span class="difference-fill ${classByCategory.get(category)}" style="width:${width}%"></span>
        </span>
        <span>${label}</span>
      </div>
    `;
  }).join("");
}

function renderConfidenceChart() {
  const target = document.querySelector("#confidence-chart");
  if (!target) return;
  target.innerHTML = state.summary.zones.map((zone) => {
    const confidence = Object.fromEntries(zone.confidence.map((entry) => [entry.confidence, entry]));
    const high = confidence.high || { percent: 0, count: 0 };
    const medium = confidence.medium || { percent: 0, count: 0 };
    const low = confidence.low || { percent: 0, count: 0 };
    return `
      <div class="bar-group">
        <strong>${escapeHtml(zone.zone)}</strong>
        <div>
          <div class="stack">
            <span class="segment favor" style="width:${high.percent}%">${high.percent}%</span>
            <span class="segment neutral" style="width:${medium.percent}%">${medium.percent}%</span>
            <span class="segment against" style="width:${low.percent}%">${low.percent}%</span>
          </div>
          <p class="muted">${high.count} high, ${medium.count} medium, ${low.count} low. ${zone.needsReview} rows should receive human review.</p>
        </div>
      </div>
    `;
  }).join("");
}

function dominantTopicCategory(topic) {
  const stance = state.topicSummary.stanceByTopic.find((entry) => entry.topic === topic.topic);
  if (!stance) return "neutral";
  const category = categoryOrder.reduce((current, next) => {
    return (stance[next] || 0) > (stance[current] || 0) ? next : current;
  }, categoryOrder[0]);
  return classByCategory.get(category) || "neutral";
}

function renderTopicCloud(selector, limit = 18) {
  const target = document.querySelector(selector);
  if (!target) return;
  const topics = state.topicSummary.topicCounts
    .filter((item) => !genericTopicLabels.has(item.topic))
    .slice(0, limit);
  const counts = topics.map((topic) => topic.count);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  target.innerHTML = `
    <ul class="topic-cloud-list">
      ${topics.map((topic) => {
        const scale = max === min ? 1.15 : 0.9 + ((topic.count - min) / (max - min)) * 1.25;
        return `
          <li>
            <span class="topic-cloud-term ${dominantTopicCategory(topic)}" style="--topic-scale:${scale.toFixed(2)}">
              ${escapeHtml(topic.topic)}
              <span class="topic-cloud-count">${topic.count}</span>
            </span>
          </li>
        `;
      }).join("")}
    </ul>
  `;
}

function renderPageChart() {
  const target = document.querySelector("#page-chart");
  if (!target) return;
  target.innerHTML = state.pageSummary.map((entry, index) => {
    const total = entry.total || 1;
    const segments = categoryOrder.map((category) => {
      const percent = (entry[category] / total) * 100;
      return `<span class="segment ${classByCategory.get(category)}" style="width:${percent}%"></span>`;
    }).join("");
    return `<div class="page-row" style="--page-order:${index}"><strong>${escapeHtml(entry.zone)} p.${entry.page}</strong><span class="page-track">${segments}</span><span>${entry.total}</span></div>`;
  }).join("");
}

function renderZoneContext() {
  const target = document.querySelector("#zone-context");
  if (!target) return;
  const contexts = [
    {
      zone: "Zone 5B / Montgomery Avenue",
      pages: "77-89",
      places: ["Montgomery Avenue", "nearby residential streets", "transit access"],
    },
    {
      zone: "Zone 4A",
      pages: "90-105",
      places: ["downtown Narberth", "train station area", "nearby residential blocks"],
    },
  ];
  target.innerHTML = contexts.map((item) => `
    <article class="zone-context-card">
      <div>
        <h4>${escapeHtml(item.zone)}</h4>
        <p class="muted">PDF pages ${escapeHtml(item.pages)} · not parcel geometry</p>
      </div>
      <div class="context-tags">${item.places.map((place) => `<span>${escapeHtml(place)}</span>`).join("")}</div>
    </article>
  `).join("");
}

function renderRepresentativeCards() {
  const target = document.querySelector("#quote-card-grid");
  if (!target) return;
  target.innerHTML = state.representativeCards.cards.map((card) => `
    <article class="card quote-card">
      <p class="eyebrow">${escapeHtml(card.topic)}</p>
      <blockquote>
        <p>${escapeHtml(card.summary)}</p>
      </blockquote>
      <p class="muted">${escapeHtml(card.zone)} p.${card.page}; ${escapeHtml(shortCategory.get(card.stance) || card.stance)}. Based on classification rationale: ${escapeHtml(card.rationale)}.</p>
      ${sourceReferenceHtml(card.page)}
    </article>
  `).join("");
}

function categoryItem(summaryLike, category) {
  return summaryLike.categories.find((entry) => entry.category === category) || { count: 0, percent: 0 };
}

function categoryCount(item, category) {
  return Number(item[category] || 0);
}

function renderDecisionFaq(selector = "#decision-faq", limit = 6) {
  const target = document.querySelector(selector);
  if (!target) return;
  target.innerHTML = state.decisionBrief.decisionFaq.slice(0, limit).map((item) => `
    <details class="faq-item" open>
      <summary>${escapeHtml(item.question)}</summary>
      <p>${escapeHtml(item.answer)}</p>
    </details>
  `).join("");
}

function renderReadFirst(selector = "#read-first-panel") {
  const target = document.querySelector(selector);
  if (!target) return;
  target.innerHTML = state.decisionBrief.readFirst.map((item, index) => `
    <article class="card read-first-card">
      <span class="step-number">${index + 1}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.body)}</p>
      <a href="${escapeHtml(item.href)}">${escapeHtml(item.linkText)}</a>
    </article>
  `).join("");
}

function colorStanceText(value) {
  return escapeHtml(value)
    .replace(/\b(against(?: as written)?|opposition)\b/gi, '<span class="tone-negative">$1</span>')
    .replace(/\b(in-favor|in favor)\b/gi, '<span class="tone-positive">$1</span>');
}

function renderZoneComparisonCards(selector = "#zone-comparison-cards") {
  const target = document.querySelector(selector);
  if (!target) return;
  target.innerHTML = state.decisionBrief.zoneComparison.map((item) => `
    <article class="card compare-card ${classByCategory.get(item.stance) || "neutral"}">
      <p class="eyebrow ${toneByCategory.get(item.stance) || "tone-neutral"}">${escapeHtml(shortCategory.get(item.stance) || "Comparison")}</p>
      <h3>${colorStanceText(item.title)}</h3>
      <p>${colorStanceText(item.summary)}</p>
    </article>
  `).join("");
}

function renderConfidenceExplainer(selector = "#confidence-explainer") {
  const target = document.querySelector(selector);
  if (!target) return;
  const data = state.decisionBrief.confidenceExplainer;
  target.innerHTML = `
    <p>${escapeHtml(data.summary)}</p>
    <div class="confidence-levels">
      ${data.levels.map((item) => `
        <article class="confidence-level ${escapeHtml(item.level)}">
          <h3>${escapeHtml(item.level)}</h3>
          <p>${escapeHtml(item.meaning)}</p>
        </article>
      `).join("")}
    </div>
    <p class="muted">
      ${data.combinedNeedsReview} rows are medium or low confidence. The broader review queue has
      ${data.reviewQueueRows} rows because it also includes mixed or conditional responses.
    </p>
    <ul class="clean-list">
      ${data.reviewCriteria.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
}

function renderConfidenceCallout() {
  const target = document.querySelector("#confidence-callout");
  if (!target) return;
  const combined = state.summary.combined;
  const confidence = Object.fromEntries(combined.confidence.map((entry) => [entry.confidence, entry]));
  const high = confidence.high || { count: 0, percent: 0 };
  const medium = confidence.medium || { count: 0, percent: 0 };
  const low = confidence.low || { count: 0, percent: 0 };
  target.innerHTML = `
    <div class="stat decision-callout">
      <span class="stat-value">${combined.needsReview}</span>
      <span class="stat-label">medium or low-confidence classifications need human review</span>
    </div>
    <p>
      <strong>${high.count}</strong> rows are high confidence (${high.percent}%),
      <strong>${medium.count}</strong> are medium (${medium.percent}%), and
      <strong>${low.count}</strong> are low (${low.percent}%).
    </p>
    <p class="muted">
      The review queue contains ${state.reviewQueue.totalRows} rows because it also includes
      mixed or conditional responses. Use this as an audit list before official use.
    </p>
    <a class="button" href="review.html">Open review queue</a>
  `;
}

function renderConcernResponseMatrix(selector = "#concern-response-matrix") {
  const target = document.querySelector(selector);
  if (!target) return;
  target.innerHTML = state.decisionBrief.concernResponseMatrix.map((item) => `
    <article class="card matrix-card compact-matrix-card">
      <p class="eyebrow">${escapeHtml(item.tagCount)} tags · ${escapeHtml(item.responseShare)}%</p>
      <h3>${escapeHtml(item.concern)}</h3>
      <p><strong>Response:</strong> ${escapeHtml(item.responsePath)}</p>
      <p><strong>Evidence:</strong> ${escapeHtml(item.evidenceNeeded)}</p>
      <a href="index.html#topic-insights">Review topic insights</a>
    </article>
  `).join("");
}

function renderGlossary(selector = "#glossary-list") {
  const target = document.querySelector(selector);
  if (!target) return;
  target.innerHTML = state.decisionBrief.glossary.map((item) => `
    <article class="glossary-card compact-glossary-card">
      <h3>${escapeHtml(item.term)}</h3>
      <p>${escapeHtml(item.definition)}</p>
    </article>
  `).join("");
}

function renderWhatWouldChangeMinds(selector = "#change-minds-panel") {
  const target = document.querySelector(selector);
  if (!target) return;
  const data = state.decisionBrief.whatWouldChangeMinds;
  target.innerHTML = `
    <p>${escapeHtml(data.summary)}</p>
    <div class="card-grid two compact-grid">
      <div>
        <h3>Top topics in mixed or conditional rows</h3>
        <ol class="ranked-list">
          ${data.topTopics.map((topic) => `
            <li>
              <strong>${escapeHtml(topic.topic)}</strong>:
              ${topic.count} tags across ${data.conditionalRows} rows
            </li>
          `).join("")}
        </ol>
      </div>
      <div>
        <h3>Questions to answer before acting</h3>
        <ul class="clean-list">
          ${data.discussionPrompts.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>
    </div>
  `;
}

function renderBriefPage() {
  const target = document.querySelector("#brief-content");
  if (!target) return;
  const combined = state.decisionBrief.summary.combined;
  const against = categoryItem(combined, categoryOrder[0]);
  const neutral = categoryItem(combined, categoryOrder[1]);
  const favor = categoryItem(combined, categoryOrder[2]);
  target.innerHTML = `
    <div class="card-grid three">
      <article class="stat">
        <span class="stat-value tone-negative">${against.percent}%</span>
        <span class="stat-label">against as written (${against.count} responses)</span>
      </article>
      <article class="stat">
        <span class="stat-value tone-neutral">${neutral.percent}%</span>
        <span class="stat-label">neutral or unclear (${neutral.count} responses)</span>
      </article>
      <article class="stat">
        <span class="stat-value tone-positive">${favor.percent}%</span>
        <span class="stat-label">in favor (${favor.count} responses)</span>
      </article>
    </div>
    <div class="card-grid two">
      <article class="card">
        <h2>Key takeaways</h2>
        <ul class="clean-list">${state.decisionBrief.keyTakeaways.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </article>
      <article class="card">
        <h2>Questions for public discussion</h2>
        <ul class="clean-list">${state.decisionBrief.discussionQuestions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </article>
    </div>
  `;
  const zoneTarget = document.querySelector("#brief-zones");
  if (zoneTarget) {
    zoneTarget.innerHTML = state.decisionBrief.summary.zones.map((zone) => {
      const zoneAgainst = categoryItem(zone, categoryOrder[0]);
      const zoneFavor = categoryItem(zone, categoryOrder[2]);
      return `
        <article class="card">
          <h2>${escapeHtml(zone.zone)}</h2>
          <p><strong>${zone.totalResponses}</strong> classified responses from source pages ${escapeHtml(zone.sourcePages)}.</p>
          <p><span class="tone-negative">${zoneAgainst.count} against (${zoneAgainst.percent}%)</span> / <span class="tone-positive">${zoneFavor.count} in favor (${zoneFavor.percent}%)</span>.</p>
          <p class="muted">${zone.needsReview} classifications are medium or low confidence and should receive human review before official use.</p>
          ${sourceReferenceHtml(zone.sourcePages)}
        </article>
      `;
    }).join("");
  }
  const limits = document.querySelector("#brief-limits");
  if (limits) {
    limits.innerHTML = state.decisionBrief.limits.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  }
}

function topicStanceSummary(item) {
  return `
    <span class="tone-negative">${item[categoryOrder[0]] || 0} against</span>,
    <span class="tone-neutral">${item[categoryOrder[1]] || 0} neutral</span>,
    <span class="tone-positive">${item[categoryOrder[2]] || 0} in favor</span>
  `;
}

function renderTopicsPage() {
  const overall = document.querySelector("#topics-overall");
  if (!overall) return;
  const topics = state.concernsByZone.overall.slice(0, 12);
  const max = Math.max(...topics.map((item) => item.count), 1);
  overall.innerHTML = topics.map((item) => `
    <article class="card topic-card">
      <div class="metric-row wide">
        <strong>${escapeHtml(item.topic)}</strong>
        <span class="metric-track"><span class="metric-fill" style="width:${(item.count / max) * 100}%"></span></span>
        <span>${item.count}</span>
      </div>
      <p class="muted">${item.responseShare}% of classified responses received this provisional tag. ${topicStanceSummary(item)}.</p>
    </article>
  `).join("");
  const byZone = document.querySelector("#topics-by-zone");
  if (byZone) {
    byZone.innerHTML = state.concernsByZone.byZone.map((zone) => `
      <article class="card">
        <h2>${escapeHtml(zone.zone)}</h2>
        <p class="muted">${zone.totalResponses} responses; source pages ${escapeHtml(zone.sourcePages)}.</p>
        ${sourceReferenceHtml(zone.sourcePages)}
        <ol class="ranked-list">
          ${zone.topics.slice(0, 8).map((topic) => `<li><strong>${escapeHtml(topic.topic)}</strong>: ${topic.count} tags (${topic.responseShare}%)</li>`).join("")}
        </ol>
      </article>
    `).join("");
  }
  renderTopicStanceHeatmap();
  renderTopConcernsByStance();
}

function renderTopicStanceHeatmap() {
  const target = document.querySelector("#topic-stance-heatmap");
  if (!target) return;
  const topics = state.topicSummary.stanceByTopic.slice(0, 12);
  const max = Math.max(...topics.flatMap((topic) => categoryOrder.map((category) => categoryCount(topic, category))), 1);
  target.innerHTML = `
    <div class="heatmap-grid" role="table" aria-label="Topic by stance heatmap">
      <div class="heatmap-header" role="row">
        <span role="columnheader">Topic</span>
        ${categoryOrder.map((category) => `<span role="columnheader">${escapeHtml(shortCategory.get(category))}</span>`).join("")}
      </div>
      ${topics.map((topic) => `
        <div class="heatmap-row" role="row">
          <strong role="rowheader">${escapeHtml(topic.topic)}</strong>
          ${categoryOrder.map((category) => {
            const count = categoryCount(topic, category);
            const intensity = count / max;
            return `
              <span
                role="cell"
                class="heatmap-cell ${classByCategory.get(category)}"
                style="--heatmap-weight:${Math.round(18 + intensity * 62)}%"
              >
                ${count}
              </span>
            `;
          }).join("")}
        </div>
      `).join("")}
    </div>
    <p class="muted">Counts are topic tags by stance; one response can appear in more than one topic row.</p>
  `;
}

function renderTopConcernsByStance() {
  const target = document.querySelector("#top-concerns-by-stance");
  if (!target) return;
  target.innerHTML = state.concernsByZone.byZone.map((zone) => `
    <article class="card">
      <h3>${escapeHtml(zone.zone)}</h3>
      <div class="stance-topic-grid">
        ${categoryOrder.map((category) => {
          const topics = zone.topics
            .filter((topic) => categoryCount(topic, category) > 0)
            .sort((a, b) => categoryCount(b, category) - categoryCount(a, category) || a.topic.localeCompare(b.topic))
            .slice(0, 4);
          return `
            <section>
              <h4 class="${toneByCategory.get(category) || "tone-neutral"}">${escapeHtml(shortCategory.get(category))}</h4>
              <ol class="ranked-list">
                ${topics.map((topic) => `<li>${escapeHtml(topic.topic)}: ${categoryCount(topic, category)}</li>`).join("")}
              </ol>
            </section>
          `;
        }).join("")}
      </div>
    </article>
  `).join("");
}

function renderReviewPage() {
  const summary = document.querySelector("#review-summary");
  if (!summary) return;
  summary.innerHTML = `
    <div class="card-grid three">
      <article class="stat">
        <span class="stat-value">${state.reviewQueue.totalRows}</span>
        <span class="stat-label">rows in the review queue</span>
      </article>
      ${state.reviewQueue.byZone.map((zone) => `
        <article class="stat">
          <span class="stat-value">${zone.totalRows}</span>
          <span class="stat-label">${escapeHtml(zone.zone)} review rows</span>
        </article>
      `).join("")}
    </div>
  `;
  const criteria = document.querySelector("#review-criteria");
  if (criteria) {
    criteria.innerHTML = state.reviewQueue.criteria.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  }
  const rows = document.querySelector("#review-queue-rows");
  if (rows) {
    rows.innerHTML = state.reviewQueue.rows.slice(0, 30).map((row) => `
      <tr>
        <td>${escapeHtml(row.zone)}</td>
        <td>${row.index}</td>
        <td>${row.page}</td>
        <td class="${toneByCategory.get(row.category) || ""}">${escapeHtml(row.category)}</td>
        <td>${escapeHtml(row.confidence)}</td>
        <td>${escapeHtml(row.mixed_flag)}</td>
        <td>${escapeHtml(row.topics)}</td>
        <td>${escapeHtml(row.rationale)}</td>
      </tr>
    `).join("");
  }
}

function colorToRgb(value) {
  const probe = document.createElement("span");
  probe.style.color = value;
  document.body.appendChild(probe);
  const rgb = getComputedStyle(probe).color.match(/\d+/g).map(Number);
  probe.remove();
  return rgb.slice(0, 3);
}

function renderParticles() {
  const canvas = document.querySelector("#particle-canvas");
  const status = document.querySelector("#webgl-status");
  if (!canvas || !status) return;
  const values = document.querySelector("#particle-values");
  if (values) {
    values.innerHTML = state.summary.zones.map((zone) => {
      const against = categoryItem(zone, categoryOrder[0]);
      const neutral = categoryItem(zone, categoryOrder[1]);
      const favor = categoryItem(zone, categoryOrder[2]);
      return `
        <article class="particle-value-card">
          <h4>${escapeHtml(zone.zone)}</h4>
          <p>
            <span class="tone-negative">${against.count} against (${against.percent}%)</span>,
            <span class="tone-neutral">${neutral.count} neutral (${neutral.percent}%)</span>,
            <span class="tone-positive">${favor.count} in favor (${favor.percent}%)</span>
          </p>
        </article>
      `;
    }).join("");
  }
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gl = canvas.getContext("webgl", { antialias: true, alpha: false });
  const ctx = gl ? null : canvas.getContext("2d");
  const colors = {
    against: colorToRgb(cssVar("--cp-danger")),
    neutral: colorToRgb(cssVar("--cp-text-muted")),
    favor: colorToRgb(cssVar("--cp-success")),
    bg: colorToRgb(cssVar("--cp-bg-elevated")),
  };
  const points = state.rows.map((row, index) => {
    const zoneOffset = row.zone === "Zone 4A" ? 0.25 : 0.75;
    const categoryOffset = categoryOrder.indexOf(row.category) / 2;
    return {
      x: zoneOffset + (Math.sin(index * 12.9898) * 0.5) * 0.22,
      y: 0.15 + categoryOffset * 0.7 + (Math.cos(index * 78.233) * 0.5) * 0.16,
      category: classByCategory.get(row.category),
    };
  });

  function drawCanvas() {
    const width = canvas.width;
    const height = canvas.height;
    ctx.fillStyle = cssVar("--cp-bg-elevated");
    ctx.fillRect(0, 0, width, height);
    ctx.font = "16px Segoe UI";
    ctx.fillStyle = cssVar("--cp-text-muted");
    ctx.fillText("Zone 4A", width * 0.2, 28);
    ctx.fillText("Zone 5B", width * 0.7, 28);
    points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, 3, 0, Math.PI * 2);
      ctx.fillStyle = cssVar(point.category === "against" ? "--cp-danger" : point.category === "favor" ? "--cp-success" : "--cp-text-muted");
      ctx.fill();
    });
  }

  if (!gl) {
    status.textContent = "WebGL was not available, so a canvas fallback is shown.";
    drawCanvas();
    return;
  }

  status.textContent = reduceMotion
    ? "Motion is reduced because your system requests reduced motion."
    : "";

  const vertexShaderSource = `
    attribute vec2 position;
    attribute vec3 color;
    varying vec3 vColor;
    void main() {
      gl_PointSize = 5.0;
      gl_Position = vec4(position, 0.0, 1.0);
      vColor = color;
    }
  `;
  const fragmentShaderSource = `
    precision mediump float;
    varying vec3 vColor;
    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      if (length(coord) > 0.5) discard;
      gl_FragColor = vec4(vColor, 1.0);
    }
  `;

  function shader(type, source) {
    const compiled = gl.createShader(type);
    gl.shaderSource(compiled, source);
    gl.compileShader(compiled);
    if (!gl.getShaderParameter(compiled, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(compiled) || "WebGL shader compile failed");
    }
    return compiled;
  }

  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, vertexShaderSource));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragmentShaderSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || "WebGL program link failed");
    }
  } catch (error) {
    status.textContent = `WebGL failed (${error.message}); canvas fallback is shown.`;
    drawCanvas();
    return;
  }

  gl.useProgram(program);
  const data = [];
  for (const point of points) {
    const rgb = colors[point.category];
    data.push(point.x * 2 - 1, 1 - point.y * 2, rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);
  }
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  const stride = 5 * Float32Array.BYTES_PER_ELEMENT;
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, stride, 0);
  const color = gl.getAttribLocation(program, "color");
  gl.enableVertexAttribArray(color);
  gl.vertexAttribPointer(color, 3, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
  gl.clearColor(colors.bg[0] / 255, colors.bg[1] / 255, colors.bg[2] / 255, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.POINTS, 0, points.length);
}

function rowMatches(row) {
  const zone = document.querySelector("#zone-filter")?.value || "";
  const category = document.querySelector("#category-filter")?.value || "";
  const confidence = document.querySelector("#confidence-filter")?.value || "";
  const topic = document.querySelector("#topic-filter")?.value || "";
  const search = (document.querySelector("#search-filter")?.value || "").trim().toLowerCase();
  return (
    (!zone || row.zone === zone) &&
    (!category || row.category === category) &&
    (!confidence || row.confidence === confidence) &&
    (!topic || row.topics.split("; ").includes(topic)) &&
    (!search || row.rationale.toLowerCase().includes(search) || row.topics.toLowerCase().includes(search))
  );
}

function compareRows(a, b) {
  const { field, direction } = state.sort;
  const av = a[field];
  const bv = b[field];
  const result = typeof av === "number" && typeof bv === "number"
    ? av - bv
    : String(av).localeCompare(String(bv), undefined, { numeric: true });
  return direction === "asc" ? result : -result;
}

function renderTable() {
  const table = document.querySelector("#data-table");
  if (!table) return;
  const rows = state.rows.filter(rowMatches).sort(compareRows);
  const tbody = table.querySelector("tbody");
  const count = document.querySelector("#table-count");
  if (count) count.textContent = `${rows.length} of ${state.rows.length} rows shown.`;
  tbody.innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td>${escapeHtml(row.zone)}</td>
        <td>${row.index}</td>
        <td>${row.page}</td>
        <td class="${toneByCategory.get(row.category) || ""}">${escapeHtml(row.category)}</td>
        <td>${escapeHtml(row.confidence)}</td>
        <td>${escapeHtml(row.topics)}</td>
        <td>${escapeHtml(row.needs_review)}</td>
        <td>${escapeHtml(row.rationale)}</td>
      </tr>
    `).join("")
    : '<tr><td colspan="8">No rows match the current filters.</td></tr>';
}

function setupTableControls() {
  if (!document.querySelector("#data-table")) return;
  const sortMap = {
    Zone: "zone",
    Index: "index",
    Page: "page",
    Stance: "category",
    Confidence: "confidence",
    Topics: "topics",
    "Needs review": "needs_review",
    Rationale: "rationale",
  };
  document.querySelectorAll("#data-table th").forEach((header) => {
    const field = sortMap[header.textContent.trim()];
    if (!field) return;
    header.dataset.sort = field;
    header.tabIndex = 0;
    header.addEventListener("click", () => sortBy(field));
    header.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        sortBy(field);
      }
    });
  });
  document.querySelector("#reset-filters").addEventListener("click", () => {
    ["#zone-filter", "#category-filter", "#confidence-filter", "#topic-filter", "#search-filter"].forEach((selector) => {
      document.querySelector(selector).value = "";
    });
    renderTable();
  });
  document.querySelector("#download-filtered").addEventListener("click", downloadFilteredCsv);
}

function sortBy(field) {
  state.sort = {
    field,
    direction: state.sort.field === field && state.sort.direction === "asc" ? "desc" : "asc",
  };
  renderTable();
}

function downloadFilteredCsv() {
  const fields = ["zone", "index", "page", "category", "confidence", "topics", "needs_review", "mixed_flag", "rationale"];
  const rows = state.rows.filter(rowMatches).sort(compareRows);
  const csv = [
    fields.join(","),
    ...rows.map((row) => fields.map((field) => `"${String(row[field]).replaceAll('"', '""')}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "narberth-filtered-classifications.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

function renderTopicFilter() {
  const select = document.querySelector("#topic-filter");
  if (!select) return;
  const topics = state.topicSummary.topicCounts
    .map((entry) => entry.topic)
    .filter((topic) => !genericTopicLabels.has(topic))
    .sort();
  select.innerHTML += topics.map((topic) => `<option value="${escapeHtml(topic)}">${escapeHtml(topic)}</option>`).join("");
}

function renderAuditSummary() {
  const review = document.querySelector("#review-queue-summary");
  const manifest = document.querySelector("#manifest-summary");
  if (!review || !manifest) return;
  const needsReview = state.summary.combined.needsReview;
  review.textContent = `${needsReview} of ${state.summary.combined.totalResponses} classifications are medium or low confidence and should be prioritized for human review.`;
  manifest.textContent = `${state.manifest.files.length} public files are described in the generated manifest.`;
}

async function renderDownloads() {
  const grid = document.querySelector("#download-grid");
  if (!grid) return;
  const cards = await Promise.all(downloads.map(async (item) => {
    const size = await getFileSize(item.href);
    const external = item.href.startsWith("http");
    return `
      <article class="card">
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description)}</p>
        <div class="download-meta">
          <span class="pill">${escapeHtml(item.format)}</span>
          <span class="pill">${external ? "External link" : formatBytes(size)}</span>
          <span class="pill">Updated ${escapeHtml(state.summary.generatedOn)}</span>
        </div>
        <a class="button" href="${escapeHtml(item.href)}"${external ? ' rel="noreferrer"' : " download"}>Open or download</a>
      </article>
    `;
  }));
  grid.innerHTML = cards.join("");
}

async function init() {
  setupNavigation();
  const [summary, rows, manifest, topicSummary, pageSummary, decisionBrief, concernsByZone, reviewQueue, representativeCards] = await Promise.all([
    fetchJson("data/summary.json"),
    fetchJson("data/combined-classified.json"),
    fetchJson("data/manifest.json"),
    fetchJson("data/topic-summary.json"),
    fetchJson("data/page-summary.json"),
    fetchJson("data/decision-brief.json"),
    fetchJson("data/concerns-by-zone.json"),
    fetchJson("data/review-queue.json"),
    fetchJson("data/representative-cards.json"),
  ]);
  state.summary = summary;
  state.rows = rows;
  state.manifest = manifest;
  state.topicSummary = topicSummary;
  state.pageSummary = pageSummary;
  state.decisionBrief = decisionBrief;
  state.concernsByZone = concernsByZone;
  state.reviewQueue = reviewQueue;
  state.representativeCards = representativeCards;
  renderTopicFilter();
  renderSummaryCards();
  renderReadFirst();
  renderReadFirst("#brief-read-first");
  renderBarChart();
  renderChartTextSummary();
  renderSourceDocuments();
  renderDifferenceChart();
  renderConfidenceChart();
  renderTopicCloud("#topic-cloud-page", 22);
  renderPageChart();
  renderZoneContext();
  renderRepresentativeCards();
  renderDecisionFaq();
  renderDecisionFaq("#brief-faq");
  renderZoneComparisonCards();
  renderZoneComparisonCards("#brief-zone-comparison");
  renderConfidenceExplainer();
  renderConfidenceExplainer("#brief-confidence-explainer");
  renderConfidenceCallout();
  renderConcernResponseMatrix();
  renderConcernResponseMatrix("#brief-concern-response-matrix");
  renderGlossary();
  renderGlossary("#brief-glossary-list");
  renderWhatWouldChangeMinds();
  renderWhatWouldChangeMinds("#brief-change-minds");
  renderParticles();
  renderTable();
  renderDownloads();
  renderAuditSummary();
  renderBriefPage();
  renderTopicsPage();
  renderReviewPage();
  setupTableControls();
  ["#zone-filter", "#category-filter", "#confidence-filter", "#topic-filter", "#search-filter"].forEach((selector) => {
    document.querySelector(selector)?.addEventListener("input", renderTable);
  });
}

init().catch((error) => {
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<div class="noscript">The dashboard data could not be loaded: ${escapeHtml(error.message)}</div>`,
  );
});
