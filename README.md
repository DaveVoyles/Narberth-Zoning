# Narberth zoning survey explorer

## Project goal

This project turns raw survey responses about proposed Narberth zoning changes into a neutral, easy-to-understand public data story for residents, Borough Council, planners, and other stakeholders.

The goal is not to advocate for or against any zoning proposal. The goal is to make the survey data easier to inspect, summarize, and discuss so local decision-makers can understand resident sentiment alongside any borough, county, affordability, density, infrastructure, or planning goals.

## Current source data

The project currently uses `Raw Survey Results.pdf`, a raw survey export titled **Survey on Housing Affordability in Narberth**.

Initial work focused on two sections:

| Section | Pages | Topic |
|---|---:|---|
| Zone 5B | 77-89 | Proposed zoning changes in Zone 5B / Montgomery Avenue |
| Zone 4A | 90-105 | Proposed zoning changes in Zone 4A |

The current classified outputs are:

- `Zone 4A Response Classifications.csv`
- `Zone 5B Response Classifications.csv`
- `Zoning Sentiment Analysis.md`
- `High-Level Survey Overview.md`

## Current headline findings

Each written response in the two zoning sections was classified into one of three categories:

1. **Against proposed Zoning Changes**
2. **Neutral**
3. **In Favor of proposed Zoning Changes**

| Section | Classified responses | Against proposed Zoning Changes | Neutral | In Favor of proposed Zoning Changes |
|---|---:|---:|---:|---:|
| Zone 4A | 303 | 223 (73.6%) | 18 (5.9%) | 62 (20.5%) |
| Zone 5B | 303 | 204 (67.3%) | 16 (5.3%) | 83 (27.4%) |

These results should be presented as a preliminary readout of written-response sentiment, not as a final statistical model or policy conclusion.

## Neutral analysis principles

This project should follow these rules:

- Present resident sentiment clearly without editorializing.
- Separate **what respondents said** from **what planners or officials should do**.
- Avoid implying that survey responses are a scientific referendum unless the survey design supports that.
- Show uncertainty, classification rules, and limitations.
- Preserve the ability to inspect row-level data behind every chart.
- Distinguish borough-resident sentiment from broader planning or county-level objectives when possible.

## Questions this project can answer

### Sentiment and stance

- What share of responses oppose, support, or appear neutral toward each zoning proposal?
- Does Zone 4A sentiment differ from Zone 5B sentiment?
- Which section has a stronger opposition or support signal?
- How many responses are clear versus ambiguous?
- How often do respondents support some parts of a proposal but oppose it as written?

### Topic and concern patterns

Future analysis can categorize responses by recurring topics, such as:

- Parking requirements
- Traffic and congestion
- Building height
- Density
- Affordable housing
- SEPTA and transit assumptions
- Walkability
- Downtown vitality
- Developer incentives
- Neighborhood character
- Historic preservation
- Green space and impervious surface
- Schools and infrastructure
- Property values
- Trust in process or Planning Commission

Potential questions:

- Which concerns appear most often among opposition responses?
- Which benefits appear most often among supportive responses?
- Are parking concerns more common in Zone 4A, Zone 5B, or both?
- Are respondents more open to density on Montgomery Avenue than in Zone 4A?
- Which topics are shared across both zones?
- Which topics are unique to one zone?

### Geography and zoning comparison

If zoning boundary data or a simple map is added, the project can answer:

- Where are Zone 4A and Zone 5B located relative to downtown, Montgomery Avenue, Narberth Station, and residential blocks?
- How does respondent concern differ by zone?
- Which topics seem tied to specific places, such as Montgomery Avenue, Haverford Avenue, Elmwood, Windsor, Sabine Park, or the train station?

### Confidence and reviewability

The current CSVs include a confidence field. Future review can answer:

- Which classifications are high confidence?
- Which responses need human review?
- How sensitive are the totals if low-confidence responses are reclassified?
- Which responses are mixed or conditional?

### Process and public understanding

The data can also help answer:

- What do residents appear to understand clearly?
- Where do respondents say they need more information?
- Which proposal details generated confusion?
- What questions should Borough Council or planners answer publicly before making decisions?

## Recommended deeper data points

The next useful data layers are:

| Data layer | Purpose |
|---|---|
| Stance classification | Show support, opposition, and neutrality by zone |
| Topic tagging | Show what issues drive each stance |
| Confidence scoring | Identify which classifications need review |
| Quote highlights | Provide representative quotes without cherry-picking |
| Mixed-response flags | Show responses that support some ideas but oppose the proposal as written |
| Zone comparison | Compare Zone 4A and Zone 5B side by side |
| Methodology notes | Explain exactly how responses were parsed and categorized |
| Limitations | Explain survey, extraction, classification, and representativeness limits |

## Proposed public website

The project should become a GitHub Pages site with an interactive dashboard and narrative summary.

### Primary audience

- Borough residents who want a quick understanding of the survey
- Borough Council members who need a neutral resident-sentiment readout
- Planning Commission members and planners who need issue-level detail
- Journalists or civic groups who need a transparent public reference

### Suggested site structure

```text
/
├── index.html                  # Landing page and executive summary
├── public/
│   ├── data/
│   │   ├── zone-4a-classified.csv
│   │   ├── zone-5b-classified.csv
│   │   ├── combined-classified.csv
│   │   ├── summary.json
│   │   └── topic-tags.csv      # Future
│   └── documents/
│       ├── raw-survey-results.pdf
│       ├── zone-4a-classified.xlsx
│       ├── zone-5b-classified.xlsx
│       └── zoning-sentiment-analysis.pdf
├── src/
│   ├── app.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Charts.tsx
│   │   ├── DataTables.tsx
│   │   ├── Findings.tsx
│   │   └── Downloads.tsx
│   ├── charts/
│   ├── components/
│   ├── data/
│   └── visuals/
├── README.md
└── docs/                       # Optional GitHub Pages output if using docs publishing
```

### Required pages and features

The public website should have multiple pages so residents can choose between quick summaries, visual exploration, raw tables, and downloads.

1. **Executive summary**
   - What the survey is
   - What pages were analyzed
   - Key stance percentages
   - Plain-language caveats
   - Prominent link back to the GitHub repository

2. **Charts and graphics**
   - Side-by-side Zone 4A and Zone 5B stance charts
   - Difference in opposition, neutral, and support shares
   - Visual breakdowns by zone, page, category, confidence, and future topic tags
   - WebGL visualizations such as response particles or topic constellations
   - Reduced-motion and non-WebGL fallback views

3. **Tables and data**
   - No charts or decorative graphics on this page
   - Searchable table of classified responses
   - Filter by page, zone, stance, confidence, and rationale
   - Sortable columns
   - Clear row counts and active-filter counts
   - Optional column visibility controls

4. **Detailed findings**
   - Text summary of the current findings
   - Zone 4A readout
   - Zone 5B readout
   - Comparison between zones
   - Key limitations and interpretation notes
   - Future topic-analysis findings once topic tagging exists

5. **Methodology and limitations**
   - Parsing steps
   - Classification categories
   - Rules for mixed responses
   - Known limitations
   - Disclosure that the survey data is public-comment style feedback, not necessarily a statistically representative referendum

6. **Downloads**
   - Original raw survey PDF
   - Classified CSV files
   - Classified XLSX files
   - Combined CSV/XLSX export
   - Summary JSON
   - Methodology document
   - Markdown or PDF summary report
   - GitHub repository link

7. **About / source**
   - Link back to the GitHub repository
   - Explanation of the neutral civic-data purpose
   - Data update history
   - Contact or contribution instructions if the project becomes collaborative

### Download requirements

The site should make it easy to download the source and outputs without digging through GitHub.

| Download | Format | Purpose |
|---|---|---|
| Raw survey results | PDF | Lets users inspect the original 90+ page source document |
| Zone 4A classifications | CSV and XLSX | Lets users inspect or reuse the Zone 4A row-level classifications |
| Zone 5B classifications | CSV and XLSX | Lets users inspect or reuse the Zone 5B row-level classifications |
| Combined classifications | CSV and XLSX | Lets users compare both zones in one file |
| Summary data | JSON | Powers the charts and supports reuse by developers |
| Findings summary | Markdown and PDF | Provides a shareable text report |

Every download link should include a short description, file size when available, and last-updated date.

## Visual and interactive ideas

### Clear civic visuals

These should be prioritized first:

- Stacked bar chart comparing stance by zone
- Donut or radial chart for each zone
- Topic frequency bars
- Confidence distribution
- Small multiples showing stance by page
- Filterable response table
- Quote cards grouped by topic

### WebGL and motion ideas

Use WebGL and motion to make the site engaging, but do not let visuals obscure the civic data.

Potential visuals:

- **Particle sentiment field:** each response is a particle; color and position represent stance and zone.
- **Zone constellation:** responses cluster by topic, allowing users to see where parking, density, height, and transit concerns concentrate.
- **Animated transition:** switch between Zone 4A and Zone 5B to show how stance and topics shift.
- **Interactive map layer:** if zone geometry is added, animate responses around the relevant zone.
- **Time/page flow:** animate responses across PDF pages to show how topics appear through the document.

Accessibility note: every WebGL visual should have a non-WebGL chart or table equivalent.

## Technology plan

### Deployment

Use GitHub Pages.

Recommended path:

1. Push this repository to GitHub.
2. Build a static site with Vite.
3. Publish from either:
   - the `docs/` folder, or
   - a GitHub Actions deployment to Pages.

### Front-end stack

Recommended:

- Vite
- React
- TypeScript
- GitHub Pages
- D3 or Observable Plot for standard charts
- Three.js or regl for WebGL visuals
- Papa Parse or a small CSV loader for local data files

### Visual design

Use a restrained civic dashboard style:

- Prioritize readability over spectacle.
- Keep charts simple and labeled.
- Use motion only to clarify transitions.
- Include dark and light theme support.
- Use the Clawpilot theme variables for any HTML artifact generated by Copilot.

### Data pipeline

Recommended scripts:

```text
scripts/
├── extract-pdf-text.ts or .py
├── parse-responses.ts or .py
├── classify-responses.ts or .py
├── summarize-results.ts or .py
└── validate-data.ts or .py
```

The site should not depend on manual copy/paste once the pipeline is established.

## Implementation phases

### Phase 1: Repo and static project setup

- Create GitHub repository.
- Add README and current analysis files.
- Add a Vite + React + TypeScript app.
- Configure GitHub Pages.
- Add data files under `public/data/` or `src/data/`.
- Add downloadable documents under `public/documents/`.
- Generate or add XLSX versions of the classified outputs.

### Phase 2: Baseline dashboard

- Build the multi-page routing shell.
- Build a landing page with executive summary and GitHub repo link.
- Add stance summary cards.
- Add Zone 4A and Zone 5B comparison charts.
- Add a charts and graphics page.
- Add a no-chart data table page.
- Add a detailed findings page.
- Add a downloads page with PDF, CSV, XLSX, JSON, and report downloads.
- Add methodology and limitations sections.

### Phase 3: Topic tagging

- Define topic taxonomy.
- Tag each response with one or more topics.
- Add topic frequency visuals.
- Add stance-by-topic charts.
- Add quote cards with representative examples.

### Phase 4: Interactive WebGL layer

- Add a response-particle visual.
- Add filters for zone, stance, topic, and confidence.
- Add reduced-motion fallback.
- Add table/chart fallback for users who cannot use WebGL.

### Phase 5: Review and publication

- Review classification rules.
- Review low-confidence classifications.
- Verify totals against source PDF.
- Publish to GitHub Pages.
- Add a clear disclaimer that the project is a neutral survey-data presentation.

## Suggested first dashboard metrics

Start with these:

| Metric | Why it matters |
|---|---|
| Total classified responses by zone | Establishes denominator |
| Against / Neutral / In Favor percentages | Main stance readout |
| Difference between Zone 4A and Zone 5B | Shows whether sentiment differs by proposal area |
| Low-confidence classifications | Shows where human review is needed |
| Most frequent topics | Shows what residents are actually talking about |
| Topic by stance | Shows what concerns or benefits drive each side |
| Representative quotes | Makes the data understandable without reducing it to numbers |

## Data limitations to disclose

The public site should clearly state:

- The survey may not represent all Narberth residents.
- Responses are written comments, not necessarily votes.
- Some respondents may appear multiple times across questions.
- Classification involves judgment, especially for mixed responses.
- The current analysis uses extracted PDF text, which can contain formatting artifacts.
- Percentages are based on classified written responses in the selected sections only.

## Definition of done for the public site

The first public version should be considered ready when:

- The site is deployed through GitHub Pages.
- The homepage explains the purpose in plain language.
- Zone 4A and Zone 5B stance breakdowns are visible without scrolling far.
- Users can inspect row-level classified responses.
- The methodology is clear and transparent.
- Visuals include accessible text or table alternatives.
- The site states limitations and avoids advocacy language.
