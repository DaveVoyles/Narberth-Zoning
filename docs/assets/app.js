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

const downloads = [
  {
    title: "Raw survey results",
    href: "documents/raw-survey-results.pdf",
    format: "PDF",
    description: "Original 90+ page survey export used as the source document.",
  },
  {
    title: "Zone 4A classifications",
    href: "data/zone-4a-classified.csv",
    format: "CSV",
    description: "Row-level classification output for Zone 4A responses.",
  },
  {
    title: "Zone 5B classifications",
    href: "data/zone-5b-classified.csv",
    format: "CSV",
    description: "Row-level classification output for Zone 5B responses.",
  },
  {
    title: "Combined classifications",
    href: "data/combined-classified.csv",
    format: "CSV",
    description: "Both analyzed zones in one reusable file.",
  },
  {
    title: "Summary data",
    href: "data/summary.json",
    format: "JSON",
    description: "Counts and percentages powering the dashboard.",
  },
  {
    title: "All classifications workbook",
    href: "documents/narberth-zoning-classifications.xlsx",
    format: "XLSX",
    description: "Excel workbook with overview, Zone 4A, Zone 5B, and combined tabs.",
  },
  {
    title: "Zone 4A workbook",
    href: "documents/zone-4a-classified.xlsx",
    format: "XLSX",
    description: "Excel workbook for Zone 4A row-level classifications.",
  },
  {
    title: "Zone 5B workbook",
    href: "documents/zone-5b-classified.xlsx",
    format: "XLSX",
    description: "Excel workbook for Zone 5B row-level classifications.",
  },
  {
    title: "Findings summary",
    href: "documents/zoning-sentiment-analysis.md",
    format: "Markdown",
    description: "Narrative summary of methodology, totals, and high-level readout.",
  },
  {
    title: "Project repository",
    href: "https://github.com/DaveVoyles/Narberth-Zoning",
    format: "GitHub",
    description: "Source files, history, and contribution context.",
  },
];

const state = {
  summary: null,
  rows: [],
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
  const navLinks = [...document.querySelectorAll(".nav-links a[href^='#']")];

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  function updateActive() {
    const hash = window.location.hash || "#home";
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === hash);
    });
  }

  window.addEventListener("hashchange", updateActive);
  updateActive();
}

function renderSummaryCards() {
  const target = document.querySelector("#summary-cards");
  target.innerHTML = state.summary.zones
    .map((zone) => {
      const against = zone.categories.find((entry) => entry.category === categoryOrder[0]);
      const favor = zone.categories.find((entry) => entry.category === categoryOrder[2]);
      return `
        <div class="stat">
          <span class="stat-value">${against.percent}%</span>
          <span class="stat-label">${escapeHtml(zone.zone)} against as written</span>
          <p class="muted">${against.count} against / ${favor.count} in favor / ${zone.totalResponses} total</p>
        </div>
      `;
    })
    .join("");
}

function renderBarChart() {
  const chart = document.querySelector("#bar-chart");
  const legend = `
    <div class="legend" aria-hidden="true">
      <span><i class="swatch"></i>Against</span>
      <span><i class="swatch neutral"></i>Neutral</span>
      <span><i class="swatch favor"></i>In favor</span>
    </div>
  `;
  chart.innerHTML = state.summary.zones
    .map((zone) => {
      const segments = categoryOrder
        .map((category) => {
          const item = zone.categories.find((entry) => entry.category === category);
          return `<span class="segment ${classByCategory.get(category)}" style="width:${item.percent}%">${item.percent}%</span>`;
        })
        .join("");
      return `
        <div class="bar-group">
          <strong>${escapeHtml(zone.zone)}</strong>
          <div>
            <div class="stack">${segments}</div>
          </div>
        </div>
      `;
    })
    .join("") + legend;
}

function renderChartTextSummary() {
  const target = document.querySelector("#chart-text-summary");
  target.innerHTML = state.summary.zones
    .map((zone) => {
      const parts = zone.categories
        .map((entry) => `${entry.count} ${shortCategory.get(entry.category).toLowerCase()} (${entry.percent}%)`)
        .join(", ");
      return `<p><strong>${escapeHtml(zone.zone)}:</strong> ${parts}.</p>`;
    })
    .join("");
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
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gl = canvas.getContext("webgl", { antialias: true, alpha: false });
  const ctx = gl ? null : canvas.getContext("2d");
  const colors = {
    against: colorToRgb(cssVar("--cp-accent")),
    neutral: colorToRgb(cssVar("--cp-text-muted")),
    favor: colorToRgb(cssVar("--cp-success")),
    bg: colorToRgb(cssVar("--cp-bg-elevated")),
  };
  const points = state.rows.map((row, index) => {
    const zoneOffset = row.zone === "Zone 4A" ? 0.25 : 0.75;
    const categoryOffset = categoryOrder.indexOf(row.category) / 2;
    return {
      x: zoneOffset + (Math.sin(index * 12.9898) * 0.5 + 0.5 - 0.5) * 0.22,
      y: 0.15 + categoryOffset * 0.7 + (Math.cos(index * 78.233) * 0.5 + 0.5 - 0.5) * 0.16,
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
      ctx.fillStyle = cssVar(point.category === "against" ? "--cp-accent" : point.category === "favor" ? "--cp-success" : "--cp-text-muted");
      ctx.fill();
    });
  }

  if (!gl) {
    status.textContent = "WebGL was not available, so a canvas fallback is shown.";
    drawCanvas();
    return;
  }

  status.textContent = reduceMotion
    ? "WebGL is available. Motion is reduced because your system requests reduced motion."
    : "WebGL is available. Points gently settle into stance and zone clusters.";

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
    return compiled;
  }

  const program = gl.createProgram();
  gl.attachShader(program, shader(gl.VERTEX_SHADER, vertexShaderSource));
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragmentShaderSource));
  gl.linkProgram(program);
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
  const zone = document.querySelector("#zone-filter").value;
  const category = document.querySelector("#category-filter").value;
  const confidence = document.querySelector("#confidence-filter").value;
  const search = document.querySelector("#search-filter").value.trim().toLowerCase();
  return (
    (!zone || row.zone === zone) &&
    (!category || row.category === category) &&
    (!confidence || row.confidence === confidence) &&
    (!search || row.rationale.toLowerCase().includes(search))
  );
}

function renderTable() {
  const rows = state.rows.filter(rowMatches);
  const tbody = document.querySelector("#data-table tbody");
  const count = document.querySelector("#table-count");
  count.textContent = `${rows.length} of ${state.rows.length} rows shown.`;
  tbody.innerHTML = rows.length
    ? rows
        .map(
          (row) => `
            <tr>
              <td>${escapeHtml(row.zone)}</td>
              <td>${row.index}</td>
              <td>${row.page}</td>
              <td>${escapeHtml(row.category)}</td>
              <td>${escapeHtml(row.confidence)}</td>
              <td>${escapeHtml(row.rationale)}</td>
            </tr>
          `,
        )
        .join("")
    : '<tr><td colspan="6">No rows match the current filters.</td></tr>';
}

async function renderDownloads() {
  const grid = document.querySelector("#download-grid");
  const cards = await Promise.all(
    downloads.map(async (item) => {
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
    }),
  );
  grid.innerHTML = cards.join("");
}

async function init() {
  setupNavigation();
  const [summary, rows] = await Promise.all([
    fetch("data/summary.json").then((response) => response.json()),
    fetch("data/combined-classified.json").then((response) => response.json()),
  ]);
  state.summary = summary;
  state.rows = rows;
  renderSummaryCards();
  renderBarChart();
  renderChartTextSummary();
  renderParticles();
  renderTable();
  renderDownloads();
  ["#zone-filter", "#category-filter", "#confidence-filter", "#search-filter"].forEach((selector) => {
    document.querySelector(selector).addEventListener("input", renderTable);
  });
}

init().catch((error) => {
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<div class="noscript">The dashboard data could not be loaded: ${escapeHtml(error.message)}</div>`,
  );
});
