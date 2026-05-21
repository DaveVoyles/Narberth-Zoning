#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import shutil
import zipfile
from datetime import date
from pathlib import Path
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
DATA = DOCS / "data"
DOCUMENTS = DOCS / "documents"

CATEGORY_ORDER = [
    "Against proposed Zoning Changes",
    "Neutral",
    "In Favor of proposed Zoning Changes",
]

SOURCES = {
    "Zone 4A": {
        "path": ROOT / "Zone 4A Response Classifications.csv",
        "slug": "zone-4a",
        "pages": "90-105",
    },
    "Zone 5B": {
        "path": ROOT / "Zone 5B Response Classifications.csv",
        "slug": "zone-5b",
        "pages": "77-89",
    },
}

SOURCE_DOCUMENTS = [
    {
        "title": "Raw Survey Results.pdf",
        "role": "Original survey export",
        "scope": "Survey on Housing Affordability in Narberth; Zone 5B pages 77-89 and Zone 4A pages 90-105.",
        "href": "documents/raw-survey-results.pdf",
    },
    {
        "title": "Zone 5B Response Classifications.csv",
        "role": "Row-level classification source",
        "scope": "303 classified written responses from Zone 5B / Montgomery Avenue.",
        "href": "data/zone-5b-classified.csv",
    },
    {
        "title": "Zone 4A Response Classifications.csv",
        "role": "Row-level classification source",
        "scope": "303 classified written responses from Zone 4A.",
        "href": "data/zone-4a-classified.csv",
    },
    {
        "title": "High-Level Survey Overview.md",
        "role": "Context and orientation source",
        "scope": "Survey structure, page ranges, and section descriptions.",
        "href": "documents/high-level-survey-overview.md",
    },
    {
        "title": "Zoning Sentiment Analysis.md",
        "role": "Method and findings source",
        "scope": "Classification method, category rules, and headline findings.",
        "href": "documents/zoning-sentiment-analysis.md",
    },
]

TOPIC_RULES = [
    {
        "topic": "Parking",
        "description": "Mentions parking requirements, street parking, off-site parking, or car storage.",
        "keywords": ["parking", "car", "cars", "garage", "off-site", "off site", "driveway"],
    },
    {
        "topic": "Traffic and safety",
        "description": "Mentions traffic, congestion, pedestrian safety, or road impacts.",
        "keywords": ["traffic", "congestion", "safety", "pedestrian", "street", "road", "crossing"],
    },
    {
        "topic": "Building height",
        "description": "Mentions building height, taller buildings, stories, or scale related to height.",
        "keywords": ["height", "tall", "taller", "story", "stories", "four-story", "4-story"],
    },
    {
        "topic": "Density",
        "description": "Mentions density, apartments, units, multi-family buildings, or crowding.",
        "keywords": ["density", "dense", "apartment", "apartments", "units", "multi-family", "multifamily"],
    },
    {
        "topic": "Affordable housing",
        "description": "Mentions affordability, affordable units, housing cost, or affordability bonuses.",
        "keywords": ["affordable", "affordability", "housing cost", "bonus", "bonuses"],
    },
    {
        "topic": "Transit and walkability",
        "description": "Mentions SEPTA, train access, transit assumptions, buses, or walkability.",
        "keywords": ["septa", "train", "transit", "bus", "walk", "walkable", "station"],
    },
    {
        "topic": "Neighborhood character",
        "description": "Mentions small-town feel, neighborhood character, historic scale, or community identity.",
        "keywords": ["character", "small-town", "small town", "historic", "neighborhood", "scale"],
    },
    {
        "topic": "Green space and stormwater",
        "description": "Mentions green space, impervious coverage, trees, stormwater, or open space.",
        "keywords": ["green", "impervious", "trees", "stormwater", "open space", "coverage"],
    },
    {
        "topic": "Developer incentives",
        "description": "Mentions developers, incentives, profit, giveaways, or builder benefits.",
        "keywords": ["developer", "developers", "incentive", "profit", "builder"],
    },
    {
        "topic": "Process and trust",
        "description": "Mentions Planning Commission, Borough Council, process, transparency, or trust.",
        "keywords": ["commission", "council", "process", "transparent", "trust", "planning"],
    },
    {
        "topic": "Schools and infrastructure",
        "description": "Mentions schools, utilities, sewer, infrastructure, or borough capacity.",
        "keywords": ["school", "schools", "infrastructure", "sewer", "utility", "utilities", "capacity"],
    },
    {
        "topic": "Property values",
        "description": "Mentions property values, taxes, home values, or resale value.",
        "keywords": ["property value", "property values", "home value", "tax", "taxes", "resale"],
    },
    {
        "topic": "Conditional or mixed response",
        "description": "Mentions conditional support, mixed stance, or support for parts but not as written.",
        "keywords": ["mixed", "conditional", "but", "however", "some", "as written", "part"],
    },
]

REPRESENTATIVE_CARD_TOPICS = [
    {
        "topic": "Parking",
        "resident": "Narberth Resident A",
        "summary": "Parking requirements and spillover onto nearby streets were a recurring concern.",
    },
    {
        "topic": "Building height",
        "resident": "Narberth Resident B",
        "summary": "Building height and scale were often raised as concerns about how larger projects would fit the borough.",
    },
    {
        "topic": "Density",
        "resident": "Narberth Resident C",
        "summary": "Several responses focused on whether added density would be appropriate in the proposed locations.",
    },
    {
        "topic": "Affordable housing",
        "resident": "Narberth Resident D",
        "summary": "Some respondents connected the zoning discussion to housing affordability and whether the proposal would create affordable options.",
    },
    {
        "topic": "Traffic and safety",
        "resident": "Narberth Resident E",
        "summary": "Traffic, congestion, and pedestrian safety appeared as recurring practical concerns.",
    },
    {
        "topic": "Transit and walkability",
        "resident": "Narberth Resident F",
        "summary": "Some responses discussed whether transit access and walkability could support different parking or density assumptions.",
    },
]


def read_rows() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for zone, source in SOURCES.items():
        with source["path"].open(newline="", encoding="utf-8") as handle:
            for row in csv.DictReader(handle):
                enriched = {
                    "zone": zone,
                    "index": int(row["index"]),
                    "page": int(row["page"]),
                    "category": row["category"],
                    "confidence": row["confidence"],
                    "rationale": row["rationale"],
                }
                topics = infer_topics(enriched["rationale"], enriched["category"])
                enriched["topics"] = "; ".join(topics)
                enriched["topic_count"] = len(topics)
                enriched["needs_review"] = "yes" if row["confidence"] in {"low", "medium"} else "no"
                enriched["mixed_flag"] = "yes" if "Conditional or mixed response" in topics else "no"
                rows.append(enriched)
    return sorted(rows, key=lambda item: (item["zone"], item["index"]))


def infer_topics(rationale: str, category: str) -> list[str]:
    text = rationale.lower()
    topics = []
    for rule in TOPIC_RULES:
        if any(keyword in text for keyword in rule["keywords"]):
            topics.append(rule["topic"])
    if not topics:
        if "oppose" in text or "disagree" in text:
            topics.append("General opposition")
        elif "support" in text or "agree" in text:
            topics.append("General support")
        elif category == "Neutral":
            topics.append("Unclear or neutral")
        else:
            topics.append("General stance")
    return topics


def write_csv(path: Path, rows: list[dict[str, object]], fields: list[str]) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def summarize(rows: list[dict[str, object]]) -> dict[str, object]:
    zones = []
    for zone, source in SOURCES.items():
        zone_rows = [row for row in rows if row["zone"] == zone]
        zones.append(
            {
                "zone": zone,
                "sourcePages": source["pages"],
                "totalResponses": len(zone_rows),
                "categories": count_percent(zone_rows, "category", CATEGORY_ORDER),
                "confidence": count_percent(zone_rows, "confidence", ["high", "medium", "low"]),
                "needsReview": sum(1 for row in zone_rows if row["needs_review"] == "yes"),
            }
        )
    return {
        "generatedOn": date.today().isoformat(),
        "sourceDocument": "Raw Survey Results.pdf",
        "sourceDocuments": SOURCE_DOCUMENTS,
        "repository": "https://github.com/DaveVoyles/Narberth-Zoning",
        "methodologyNote": "Topic tags are provisional keyword-assisted tags inferred from classification rationale, not from full raw response text.",
        "zones": zones,
        "combined": {
            "totalResponses": len(rows),
            "categories": count_percent(rows, "category", CATEGORY_ORDER),
            "confidence": count_percent(rows, "confidence", ["high", "medium", "low"]),
            "needsReview": sum(1 for row in rows if row["needs_review"] == "yes"),
        },
    }


def count_percent(rows: list[dict[str, object]], field: str, order: list[str]) -> list[dict[str, object]]:
    total = len(rows) or 1
    return [
        {
            field: value,
            "count": sum(1 for row in rows if row[field] == value),
            "percent": round(sum(1 for row in rows if row[field] == value) / total * 100, 1),
        }
        for value in order
    ]


def topic_rows(rows: list[dict[str, object]]) -> list[dict[str, object]]:
    output = []
    for row in rows:
        for topic in str(row["topics"]).split("; "):
            output.append(
                {
                    "zone": row["zone"],
                    "index": row["index"],
                    "page": row["page"],
                    "category": row["category"],
                    "confidence": row["confidence"],
                    "topic": topic,
                }
            )
    return output


def topic_summary(rows: list[dict[str, object]]) -> dict[str, object]:
    tag_rows = topic_rows(rows)
    topics = sorted({row["topic"] for row in tag_rows})
    by_topic = []
    stance_by_topic = []
    for topic in topics:
        topic_items = [row for row in tag_rows if row["topic"] == topic]
        by_topic.append({"topic": topic, "count": len(topic_items)})
        stance_entry = {"topic": topic, "total": len(topic_items)}
        for category in CATEGORY_ORDER:
            stance_entry[category] = sum(1 for row in topic_items if row["category"] == category)
        stance_by_topic.append(stance_entry)
    return {
        "generatedOn": date.today().isoformat(),
        "taxonomy": TOPIC_RULES,
        "topicCounts": sorted(by_topic, key=lambda item: (-item["count"], item["topic"])),
        "stanceByTopic": sorted(stance_by_topic, key=lambda item: (-item["total"], item["topic"])),
    }


def topic_metric(topic: str, topic_items: list[dict[str, object]], total_responses: int) -> dict[str, object]:
    entry: dict[str, object] = {
        "topic": topic,
        "count": len(topic_items),
        "responseShare": round(len(topic_items) / (total_responses or 1) * 100, 1),
    }
    for category in CATEGORY_ORDER:
        entry[category] = sum(1 for row in topic_items if row["category"] == category)
    return entry


def concerns_by_zone(rows: list[dict[str, object]]) -> dict[str, object]:
    tag_rows = topic_rows(rows)
    overall_topics = sorted({row["topic"] for row in tag_rows})
    overall = [
        topic_metric(topic, [row for row in tag_rows if row["topic"] == topic], len(rows))
        for topic in overall_topics
    ]
    by_zone = []
    for zone in SOURCES:
        zone_rows = [row for row in rows if row["zone"] == zone]
        zone_tags = [row for row in tag_rows if row["zone"] == zone]
        zone_topics = sorted({row["topic"] for row in zone_tags})
        by_zone.append(
            {
                "zone": zone,
                "sourcePages": SOURCES[zone]["pages"],
                "totalResponses": len(zone_rows),
                "topics": sorted(
                    [
                        topic_metric(topic, [row for row in zone_tags if row["topic"] == topic], len(zone_rows))
                        for topic in zone_topics
                    ],
                    key=lambda item: (-int(item["count"]), str(item["topic"])),
                ),
            }
        )
    return {
        "generatedOn": date.today().isoformat(),
        "methodologyNote": "Topic counts are provisional keyword-assisted tags from classification rationale. A response can have more than one topic.",
        "overall": sorted(overall, key=lambda item: (-int(item["count"]), str(item["topic"]))),
        "byZone": by_zone,
    }


def zone_comparison(summary: dict[str, object]) -> list[dict[str, object]]:
    zones = {zone["zone"]: zone for zone in summary["zones"]}
    zone_4a = zones["Zone 4A"]
    zone_5b = zones["Zone 5B"]
    zone_4a_categories = {entry["category"]: entry for entry in zone_4a["categories"]}
    zone_5b_categories = {entry["category"]: entry for entry in zone_5b["categories"]}
    zone_pairs = [
        ("Zone 4A", zone_4a_categories),
        ("Zone 5B", zone_5b_categories),
    ]

    def stance_comparison(category: str, label: str) -> tuple[str, str]:
        first_zone, first_categories = zone_pairs[0]
        second_zone, second_categories = zone_pairs[1]
        first_percent = first_categories[category]["percent"]
        second_percent = second_categories[category]["percent"]
        gap = round(abs(first_percent - second_percent), 1)
        if first_percent == second_percent:
            return (
                f"Both zones have the same {label} share",
                f"Both {first_zone} and {second_zone} are {first_percent}% {label}.",
            )
        higher_zone = first_zone if first_percent > second_percent else second_zone
        lower_zone = second_zone if first_percent > second_percent else first_zone
        higher_percent = first_percent if first_percent > second_percent else second_percent
        lower_percent = second_percent if first_percent > second_percent else first_percent
        return (
            f"{higher_zone} has more {label} responses",
            f"The {label} share is {gap} percentage points higher in {higher_zone} "
            f"({higher_percent}%) than {lower_zone} ({lower_percent}%).",
        )

    both_majority_against = all(categories[CATEGORY_ORDER[0]]["percent"] > 50 for _, categories in zone_pairs)
    majority_title = "Both zones have majority opposition as written" if both_majority_against else "Against share by zone"
    against_title, against_summary = stance_comparison(CATEGORY_ORDER[0], "against")
    favor_title, favor_summary = stance_comparison(CATEGORY_ORDER[2], "in-favor")
    return [
        {
            "title": majority_title,
            "summary": (
                f"Zone 4A is {zone_4a_categories[CATEGORY_ORDER[0]]['percent']}% against and "
                f"Zone 5B is {zone_5b_categories[CATEGORY_ORDER[0]]['percent']}% against."
            ),
            "stance": CATEGORY_ORDER[0],
        },
        {
            "title": against_title,
            "summary": against_summary,
            "stance": CATEGORY_ORDER[0],
        },
        {
            "title": favor_title,
            "summary": favor_summary,
            "stance": CATEGORY_ORDER[2],
        },
    ]


def decision_faq(summary: dict[str, object], review: dict[str, object]) -> list[dict[str, object]]:
    combined = {entry["category"]: entry for entry in summary["combined"]["categories"]}
    zones = {zone["zone"]: {entry["category"]: entry for entry in zone["categories"]} for zone in summary["zones"]}
    return [
        {
            "question": "What is the main takeaway?",
            "answer": (
                f"Against-as-written responses are the largest category overall: "
                f"{combined[CATEGORY_ORDER[0]]['count']} of {summary['combined']['totalResponses']} "
                f"responses ({combined[CATEGORY_ORDER[0]]['percent']}%)."
            ),
        },
        {
            "question": "How different are Zone 4A and Zone 5B?",
            "answer": (
                f"Zone 4A has a higher against share ({zones['Zone 4A'][CATEGORY_ORDER[0]]['percent']}%) "
                f"than Zone 5B ({zones['Zone 5B'][CATEGORY_ORDER[0]]['percent']}%). Zone 5B has a higher "
                f"in-favor share ({zones['Zone 5B'][CATEGORY_ORDER[2]]['percent']}%) than Zone 4A "
                f"({zones['Zone 4A'][CATEGORY_ORDER[2]]['percent']}%)."
            ),
        },
        {
            "question": "What are people worried about?",
            "answer": (
                "The recurring provisional topics include parking, traffic and safety, building height, "
                "density, neighborhood character, affordability, transit assumptions, green space, "
                "infrastructure, and process or trust."
            ),
        },
        {
            "question": "Are supporters supporting everything?",
            "answer": (
                "Not necessarily. Use the conditional and mixed-response review set to find places where "
                "respondents may support housing goals while objecting to specific proposal details."
            ),
        },
        {
            "question": "How reliable is this classification?",
            "answer": (
                f"The readout is provisional. {summary['combined']['needsReview']} classifications are "
                f"medium or low confidence, and {review['totalRows']} rows are in the review queue because "
                "they need review or are mixed/conditional."
            ),
        },
        {
            "question": "Does this prove what all residents think?",
            "answer": (
                "No. It summarizes written responses from the analyzed survey sections. It is not a "
                "statistically weighted poll, a referendum, or a policy recommendation."
            ),
        },
    ]


def what_would_change_minds(rows: list[dict[str, object]]) -> dict[str, object]:
    conditional_rows = [
        row
        for row in rows
        if row["mixed_flag"] == "yes"
        or row["category"] == CATEGORY_ORDER[1]
        or "conditional" in str(row["rationale"]).lower()
    ]
    tag_rows = topic_rows(conditional_rows)
    topics = sorted({row["topic"] for row in tag_rows})
    top_topics = sorted(
        [
            topic_metric(topic, [row for row in tag_rows if row["topic"] == topic], len(conditional_rows))
            for topic in topics
        ],
        key=lambda item: (-int(item["count"]), str(item["topic"])),
    )[:6]
    return {
        "conditionalRows": len(conditional_rows),
        "summary": (
            "Rows flagged as mixed, neutral, or conditional are the best starting point for understanding "
            "which amendments, safeguards, or evidence could address concerns."
        ),
        "topTopics": top_topics,
        "discussionPrompts": [
            "Would clearer parking management, loading, or spillover protections reduce opposition?",
            "Would height, massing, setbacks, or transition standards address scale concerns?",
            "Would affordability requirements, duration, and enforcement details make benefits more credible?",
            "Would traffic, school, stormwater, and infrastructure evidence answer capacity concerns?",
            "Would a phased approach or additional public review points improve trust in the process?",
        ],
    }


def read_first(summary: dict[str, object], concerns: dict[str, object], review: dict[str, object]) -> list[dict[str, object]]:
    combined = {entry["category"]: entry for entry in summary["combined"]["categories"]}
    top_topic = concerns["overall"][0] if concerns["overall"] else {"topic": "No topic tags", "count": 0}
    return [
        {
            "title": "What was analyzed",
            "body": (
                f"{summary['combined']['totalResponses']} classified written responses from the Zone 5B "
                "and Zone 4A sections of the public survey export."
            ),
            "linkText": "See source documents",
            "href": "index.html#sources",
        },
        {
            "title": "Main takeaway",
            "body": (
                f"Against-as-written responses are the largest category overall: "
                f"{combined[CATEGORY_ORDER[0]]['count']} responses ({combined[CATEGORY_ORDER[0]]['percent']}%)."
            ),
            "linkText": "Compare stances",
            "href": "index.html#charts",
        },
        {
            "title": "Biggest topic signal",
            "body": (
                f"{top_topic['topic']} is the most frequent provisional tag "
                f"({top_topic['count']} tag assignments). Topic tags are not vote totals."
            ),
            "linkText": "Review topics",
            "href": "topics.html",
        },
        {
            "title": "Uncertainty to review",
            "body": (
                f"{summary['combined']['needsReview']} classifications are medium or low confidence; "
                f"{review['totalRows']} rows are in the broader review queue."
            ),
            "linkText": "Open review queue",
            "href": "review.html",
        },
        {
            "title": "Best next read",
            "body": "Use the concern-to-response matrix and glossary before interpreting the charts as decision evidence.",
            "linkText": "Open brief",
            "href": "brief.html",
        },
    ]


def confidence_explainer(summary: dict[str, object], review: dict[str, object]) -> dict[str, object]:
    return {
        "summary": (
            "Confidence describes how directly a classification follows from the available rationale. "
            "It is a review signal, not a judgment about whether a respondent is correct."
        ),
        "levels": [
            {
                "level": "high",
                "meaning": "The rationale points clearly to against, neutral, or in-favor as written.",
            },
            {
                "level": "medium",
                "meaning": "The rationale is mostly clear but may include mixed concerns or wording that should be checked.",
            },
            {
                "level": "low",
                "meaning": "The rationale is ambiguous enough that a human reviewer should inspect the source row before official use.",
            },
        ],
        "reviewCriteria": review["criteria"],
        "combinedNeedsReview": summary["combined"]["needsReview"],
        "reviewQueueRows": review["totalRows"],
    }


def concern_response_matrix(concerns: dict[str, object]) -> list[dict[str, object]]:
    response_paths = {
        "Parking": {
            "responsePath": "Clarify parking minimums, spillover management, loading, enforcement, and shared-parking assumptions.",
            "evidenceNeeded": "Street-parking occupancy, loading needs, household car ownership assumptions, and enforcement capacity.",
        },
        "Traffic and safety": {
            "responsePath": "Identify pedestrian-safety treatments, traffic-calming measures, and intersection impacts before adoption.",
            "evidenceNeeded": "Traffic counts, crash or near-miss history, pedestrian crossings, school-route impacts, and trip-generation assumptions.",
        },
        "Building height": {
            "responsePath": "Test height, stepback, setback, and transition standards that protect adjacent lower-scale blocks.",
            "evidenceNeeded": "Massing diagrams, shadow or streetscape examples, and comparisons with existing built form.",
        },
        "Density": {
            "responsePath": "Separate housing-count goals from bulk standards so residents can see what density would look like in practice.",
            "evidenceNeeded": "Unit-count scenarios, lot-fit examples, sewer and school capacity assumptions, and phased buildout estimates.",
        },
        "Affordable housing": {
            "responsePath": "Define affordability requirements, duration, eligibility, monitoring, and whether bonuses produce enforceable units.",
            "evidenceNeeded": "Affordable-unit yield estimates, AMI levels, deed-restriction duration, and compliance/enforcement plan.",
        },
        "Transit and walkability": {
            "responsePath": "Show where transit access can realistically substitute for parking and where it cannot.",
            "evidenceNeeded": "Station walksheds, SEPTA service frequency, accessibility constraints, and resident travel-pattern assumptions.",
        },
        "Neighborhood character": {
            "responsePath": "Translate character concerns into measurable design standards rather than general preference statements.",
            "evidenceNeeded": "Existing facade rhythm, height, setback, frontage, tree canopy, and small-town streetscape examples.",
        },
        "Green space and stormwater": {
            "responsePath": "Specify impervious coverage limits, tree retention, stormwater controls, and open-space expectations.",
            "evidenceNeeded": "Impervious-surface scenarios, runoff modeling, tree impacts, and maintenance responsibilities.",
        },
    }
    matrix = []
    for topic in concerns["overall"][:8]:
        defaults = {
            "responsePath": "Convert the concern into a specific question, standard, or evidence request for public review.",
            "evidenceNeeded": "Source-row review, topic-specific analysis, and examples showing how the proposal would work in practice.",
        }
        detail = response_paths.get(str(topic["topic"]), defaults)
        matrix.append(
            {
                "concern": topic["topic"],
                "tagCount": topic["count"],
                "responseShare": topic["responseShare"],
                "responsePath": detail["responsePath"],
                "evidenceNeeded": detail["evidenceNeeded"],
                "sourceReference": "See topic-tag rows and the raw survey PDF page references for matching classified responses.",
            }
        )
    return matrix


def glossary() -> list[dict[str, str]]:
    return [
        {
            "term": "As written",
            "definition": "The proposal details as classified from the survey section, not a general view for or against housing.",
        },
        {
            "term": "Classification",
            "definition": "A row-level label summarizing whether a written response is against, neutral, or in favor of the proposal as written.",
        },
        {
            "term": "Topic tag",
            "definition": "A provisional keyword-assisted concern label inferred from classification rationale. One response can have multiple topic tags.",
        },
        {
            "term": "Review queue",
            "definition": "Rows prioritized for human review because confidence is medium or low, or because the response appears mixed or conditional.",
        },
        {
            "term": "Conditional response",
            "definition": "A response that may support some goals while objecting to details such as parking, height, density, process, or safeguards.",
        },
        {
            "term": "Not a referendum",
            "definition": "The data summarizes written survey responses and is not a statistically weighted vote of all Narberth residents.",
        },
    ]


def review_queue(rows: list[dict[str, object]]) -> dict[str, object]:
    queue = [
        row
        for row in rows
        if row["needs_review"] == "yes" or row["mixed_flag"] == "yes"
    ]
    confidence_order = {"low": 0, "medium": 1, "high": 2}
    queue = sorted(queue, key=lambda row: (confidence_order[str(row["confidence"])], row["zone"], row["index"]))
    public_fields = ["zone", "index", "page", "category", "confidence", "topics", "needs_review", "mixed_flag", "rationale"]
    return {
        "generatedOn": date.today().isoformat(),
        "totalRows": len(queue),
        "criteria": [
            "medium or low confidence classification",
            "conditional or mixed response flag",
        ],
        "byConfidence": count_percent(queue, "confidence", ["high", "medium", "low"]),
        "byZone": [
            {
                "zone": zone,
                "totalRows": sum(1 for row in queue if row["zone"] == zone),
                "needsReview": sum(1 for row in queue if row["zone"] == zone and row["needs_review"] == "yes"),
                "mixed": sum(1 for row in queue if row["zone"] == zone and row["mixed_flag"] == "yes"),
            }
            for zone in SOURCES
        ],
        "rows": [{field: row[field] for field in public_fields} for row in queue],
    }


def representative_cards(rows: list[dict[str, object]]) -> dict[str, object]:
    cards = []
    for card in REPRESENTATIVE_CARD_TOPICS:
        matches = [
            row
            for row in rows
            if card["topic"] in str(row["topics"]).split("; ") and row["confidence"] == "high"
        ]
        if not matches:
            matches = [row for row in rows if card["topic"] in str(row["topics"]).split("; ")]
        if not matches:
            continue
        matches = sorted(matches, key=lambda row: (row["zone"], int(row["index"])))
        row = matches[0]
        cards.append(
            {
                "resident": card["resident"],
                "topic": card["topic"],
                "zone": row["zone"],
                "page": row["page"],
                "stance": row["category"],
                "summary": card["summary"],
                "rationale": row["rationale"],
                "note": "Name-free representative card based on public classification rationale; not a verbatim respondent quote.",
            }
        )
    return {
        "generatedOn": date.today().isoformat(),
        "privacyNote": "Cards use anonymized resident labels and do not display names or direct raw-response text.",
        "cards": cards,
    }


def decision_brief(rows: list[dict[str, object]]) -> dict[str, object]:
    summary = summarize(rows)
    concerns = concerns_by_zone(rows)
    review = review_queue(rows)
    top_topics = concerns["overall"][:6]
    return {
        "generatedOn": date.today().isoformat(),
        "title": "Narberth zoning survey decision brief",
        "summary": summary,
        "readFirst": read_first(summary, concerns, review),
        "topTopics": top_topics,
        "zoneComparison": zone_comparison(summary),
        "decisionFaq": decision_faq(summary, review),
        "whatWouldChangeMinds": what_would_change_minds(rows),
        "confidenceExplainer": confidence_explainer(summary, review),
        "concernResponseMatrix": concern_response_matrix(concerns),
        "glossary": glossary(),
        "reviewQueue": {
            "totalRows": review["totalRows"],
            "combinedNeedsReview": summary["combined"]["needsReview"],
        },
        "keyTakeaways": [
            "Across both analyzed sections, against-as-written classifications are the largest stance category.",
            "Zone 4A has a higher against-as-written share than Zone 5B.",
            "Zone 5B has a higher in-favor share than Zone 4A, though against-as-written responses remain larger.",
            "Topic tags are provisional and should be treated as exploration aids until human review.",
        ],
        "discussionQuestions": [
            "Which proposal elements drive opposition: parking, height, density, process, affordability, or neighborhood character?",
            "Which concerns are shared across both zones, and which are zone-specific?",
            "Do mixed or conditional responses suggest amendments that could address resident concerns?",
            "Which medium- or low-confidence classifications should be reviewed before official use?",
            "What additional planning, affordability, infrastructure, or traffic evidence should be considered alongside resident sentiment?",
        ],
        "limits": [
            "This is a classified readout of written survey responses, not a scientific referendum.",
            "Representative cards use anonymized labels and do not display names.",
            "Topic tags are keyword-assisted from classification rationale and may undercount or overcount themes.",
        ],
    }


def page_summary(rows: list[dict[str, object]]) -> list[dict[str, object]]:
    output = []
    for zone in SOURCES:
        pages = sorted({row["page"] for row in rows if row["zone"] == zone})
        for page in pages:
            page_rows = [row for row in rows if row["zone"] == zone and row["page"] == page]
            entry = {"zone": zone, "page": page, "total": len(page_rows)}
            for category in CATEGORY_ORDER:
                entry[category] = sum(1 for row in page_rows if row["category"] == category)
            output.append(entry)
    return output


def manifest(rows: list[dict[str, object]]) -> dict[str, object]:
    files = []
    for path in sorted([*DATA.glob("*"), *DOCUMENTS.glob("*")]):
        if path.is_file():
            files.append(
                {
                    "path": str(path.relative_to(DOCS)),
                    "bytes": path.stat().st_size,
                    "description": describe_file(path.name),
                }
            )
    return {
        "generatedOn": date.today().isoformat(),
        "totalClassifiedResponses": len(rows),
        "sourceFiles": [source["path"].name for source in SOURCES.values()],
        "sourceDocuments": SOURCE_DOCUMENTS,
        "files": files,
    }


def describe_file(name: str) -> str:
    descriptions = {
        "combined-classified.csv": "Combined enriched row-level classification data.",
        "combined-classified.json": "Combined enriched row-level classification data for the site.",
        "summary.json": "Zone and combined stance/confidence totals.",
        "decision-brief.json": "Decision-maker summary metrics and discussion questions.",
        "concerns-by-zone.json": "Provisional topic and concern counts by zone.",
        "review-queue.json": "Rows prioritized for human review by confidence or mixed flag.",
        "representative-cards.json": "Anonymized representative public comment theme cards.",
        "topic-tags.csv": "One row per response-topic assignment.",
        "topic-summary.json": "Topic counts, taxonomy, and stance-by-topic totals.",
        "page-summary.json": "Page-level stance totals by zone.",
        "manifest.json": "Generated file inventory and metadata.",
        "raw-survey-results.pdf": "Original source survey export.",
        "narberth-zoning-classifications.xlsx": "Excel workbook with overview and row-level sheets.",
    }
    return descriptions.get(name, "Public project asset.")


def col_name(index: int) -> str:
    value = ""
    while index:
        index, rem = divmod(index - 1, 26)
        value = chr(65 + rem) + value
    return value


def sheet_xml(rows: list[list[object]]) -> str:
    cols = []
    if rows:
        for column in range(1, len(rows[0]) + 1):
            width = min(60, max(len(str(row[column - 1])) if column - 1 < len(row) else 0 for row in rows) + 2)
            cols.append(f'<col min="{column}" max="{column}" width="{max(10, width)}" customWidth="1"/>')
    xml = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>']
    xml.append('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">')
    xml.append("<cols>" + "".join(cols) + "</cols><sheetData>")
    for row_index, row in enumerate(rows, 1):
        xml.append(f'<row r="{row_index}">')
        for col_index, value in enumerate(row, 1):
            style = ' s="1"' if row_index == 1 else ""
            xml.append(f'<c r="{col_name(col_index)}{row_index}" t="inlineStr"{style}><is><t>{escape(str(value))}</t></is></c>')
        xml.append("</row>")
    xml.append("</sheetData>")
    if rows:
        xml.append(f'<autoFilter ref="A1:{col_name(len(rows[0]))}{len(rows)}"/>')
    xml.append("</worksheet>")
    return "".join(xml)


def write_xlsx(path: Path, sheets: dict[str, list[list[object]]]) -> None:
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as archive:
        overrides = "".join(
            f'<Override PartName="/xl/worksheets/sheet{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            for i in range(1, len(sheets) + 1)
        )
        archive.writestr(
            "[Content_Types].xml",
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
            + overrides
            + '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>',
        )
        archive.writestr("_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
        archive.writestr("docProps/core.xml", f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Narberth zoning survey classifications</dc:title><dc:creator>GitHub Copilot</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">{date.today().isoformat()}T00:00:00Z</dcterms:created></cp:coreProperties>')
        archive.writestr("docProps/app.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Microsoft Excel</Application></Properties>')
        archive.writestr("xl/styles.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><name val="Arial"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>')
        sheet_nodes = "".join(f'<sheet name="{escape(name)}" sheetId="{i}" r:id="rId{i}"/>' for i, name in enumerate(sheets, 1))
        archive.writestr("xl/workbook.xml", f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>{sheet_nodes}</sheets></workbook>')
        rels = "".join(f'<Relationship Id="rId{i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i}.xml"/>' for i in range(1, len(sheets) + 1))
        rels += f'<Relationship Id="rId{len(sheets) + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
        archive.writestr("xl/_rels/workbook.xml.rels", f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">{rels}</Relationships>')
        for index, rows in enumerate(sheets.values(), 1):
            archive.writestr(f"xl/worksheets/sheet{index}.xml", sheet_xml(rows))


def workbook_rows(rows: list[dict[str, object]]) -> list[list[object]]:
    fields = ["zone", "index", "page", "category", "confidence", "rationale", "topics", "topic_count", "needs_review", "mixed_flag"]
    return [fields] + [[row[field] for field in fields] for row in rows]


def main() -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    DOCUMENTS.mkdir(parents=True, exist_ok=True)
    rows = read_rows()
    fields = ["zone", "index", "page", "category", "confidence", "rationale", "topics", "topic_count", "needs_review", "mixed_flag"]

    for zone, source in SOURCES.items():
        zone_rows = [row for row in rows if row["zone"] == zone]
        write_csv(DATA / f'{source["slug"]}-classified.csv', zone_rows, fields)
        (DATA / f'{source["slug"]}-classified.json').write_text(json.dumps(zone_rows, indent=2), encoding="utf-8")

    write_csv(DATA / "combined-classified.csv", rows, fields)
    (DATA / "combined-classified.json").write_text(json.dumps(rows, indent=2), encoding="utf-8")
    (DATA / "summary.json").write_text(json.dumps(summarize(rows), indent=2), encoding="utf-8")
    write_csv(DATA / "topic-tags.csv", topic_rows(rows), ["zone", "index", "page", "category", "confidence", "topic"])
    (DATA / "topic-summary.json").write_text(json.dumps(topic_summary(rows), indent=2), encoding="utf-8")
    (DATA / "concerns-by-zone.json").write_text(json.dumps(concerns_by_zone(rows), indent=2), encoding="utf-8")
    (DATA / "decision-brief.json").write_text(json.dumps(decision_brief(rows), indent=2), encoding="utf-8")
    (DATA / "review-queue.json").write_text(json.dumps(review_queue(rows), indent=2), encoding="utf-8")
    (DATA / "representative-cards.json").write_text(json.dumps(representative_cards(rows), indent=2), encoding="utf-8")
    (DATA / "page-summary.json").write_text(json.dumps(page_summary(rows), indent=2), encoding="utf-8")

    for src, dst in [
        ("Raw Survey Results.pdf", "raw-survey-results.pdf"),
        ("Zoning Sentiment Analysis.md", "zoning-sentiment-analysis.md"),
        ("High-Level Survey Overview.md", "high-level-survey-overview.md"),
        ("README.md", "project-readme.md"),
    ]:
        shutil.copyfile(ROOT / src, DOCUMENTS / dst)

    overview = [["Zone", "Total responses", "Needs review", "Against", "Neutral", "In favor", "Source pages"]]
    summary = summarize(rows)
    for zone in summary["zones"]:
        cats = {entry["category"]: entry for entry in zone["categories"]}
        overview.append([
            zone["zone"],
            zone["totalResponses"],
            zone["needsReview"],
            cats[CATEGORY_ORDER[0]]["count"],
            cats[CATEGORY_ORDER[1]]["count"],
            cats[CATEGORY_ORDER[2]]["count"],
            zone["sourcePages"],
        ])
    write_xlsx(
        DOCUMENTS / "narberth-zoning-classifications.xlsx",
        {
            "Overview": overview,
            "Combined": workbook_rows(rows),
            "Zone 4A": workbook_rows([row for row in rows if row["zone"] == "Zone 4A"]),
            "Zone 5B": workbook_rows([row for row in rows if row["zone"] == "Zone 5B"]),
            "Topic tags": [["zone", "index", "page", "category", "confidence", "topic"]]
            + [[row[field] for field in ["zone", "index", "page", "category", "confidence", "topic"]] for row in topic_rows(rows)],
        },
    )
    write_xlsx(DOCUMENTS / "zone-4a-classified.xlsx", {"Zone 4A": workbook_rows([row for row in rows if row["zone"] == "Zone 4A"])})
    write_xlsx(DOCUMENTS / "zone-5b-classified.xlsx", {"Zone 5B": workbook_rows([row for row in rows if row["zone"] == "Zone 5B"])})
    (DATA / "manifest.json").write_text(json.dumps(manifest(rows), indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
