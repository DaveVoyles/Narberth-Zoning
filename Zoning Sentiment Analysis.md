# Zoning sentiment analysis

## Purpose

This is a preliminary resident-sentiment analysis of the raw survey responses in `Raw Survey Results.pdf`. It classifies each written response in the requested zoning sections into one of three categories: **Against proposed Zoning Changes**, **Neutral**, or **In Favor of proposed Zoning Changes**.

The goal is to summarize expressed respondent sentiment so Borough Council can weigh borough-resident feedback alongside any separate density goals or Montgomery County Planning Commission goals. This is not a policy recommendation and does not evaluate whether the proposed zoning changes are legally, economically, or planning-wise correct.

## Brief Narberth context

A brief web search indicates that Narberth is a small borough in Montgomery County, Pennsylvania, surrounded by Lower Merion Township and located roughly 10 miles northwest of Philadelphia. It is about one-half square mile, has a walkable downtown, SEPTA regional rail access, and a reputation for a close-knit small-town character. That context matters because many survey responses refer to walkability, transit, limited land area, parking pressure, neighborhood scale, and preserving Narberth's character.

## Method

- Parsed the PDF text for the two requested sections: pages 90-105 for Zone 4A and pages 77-89 for Zone 5B.
- Split each section into individual respondent rows based on respondent ID/date patterns.
- Corrected two Zone 5B rows where the PDF extraction split respondent IDs from their response dates.
- Classified each response by its stance toward the proposal **as written**.
- Treated mixed responses as **Against proposed Zoning Changes** when they rejected core proposal elements such as height increases, density, apartments, reduced parking, ADUs, setbacks/lot coverage, mixed-use changes, or affordability bonuses.
- Used **Neutral** only for unclear, non-substantive, undecided, or genuinely balanced responses.

## Statistical breakdown

| Section | Classified responses | Against proposed Zoning Changes | Neutral | In Favor of proposed Zoning Changes |
|---|---:|---:|---:|---:|
| Zone 4A | 303 | 223 (73.6%) | 18 (5.9%) | 62 (20.5%) |
| Zone 5B | 303 | 204 (67.3%) | 16 (5.3%) | 83 (27.4%) |

## Notes on completeness

- Zone 4A: classified all 303 responses shown as answered in the PDF section.
- Zone 5B: classified all 303 responses shown as answered in the PDF section after correcting two split ID/date rows from the text extraction.
- Row-level classification files are saved as `Zone 4A Response Classifications.csv` and `Zone 5B Response Classifications.csv`.

## High-level readout

For both zoning sections, the largest category is **Against proposed Zoning Changes**. Zone 4A shows a stronger against share than in-favor share, with relatively few neutral responses. Zone 5B also shows more against than in-favor responses, though the in-favor share is somewhat higher than in Zone 4A.

The most common reasons mentioned by respondents, without judging their validity, include parking requirements, building height, density, traffic, effects on nearby residential streets, SEPTA assumptions, development scale, green space or impervious surface, and preserving Narberth's small-town character.
