# UX Research Findings: StockFlow
> **Participants:** 63 initial survey respondents + 64 app feedback respondents
> **Location:** Ahmedabad, Surat, Vadodara — Gujarat, India
> **Business types:** Hardware, Grocery, Clothing/Textiles, Pharmacy, Stationery, Electronics

---

## Executive Summary

Small and medium retail businesses in Gujarat primarily manage stock through a combination of physical notebooks (*khata*), spreadsheets, and billing software — often running all three in parallel with no synchronisation between them. The result is chronic data drift, delayed discovery of stockouts, and significant manual reconciliation effort every day.

A prototype of StockFlow was tested with 64 participants from these businesses. **100% rated the app Easy or Very Easy to use.** **93.8% said it helped them notice low stock significantly sooner than their current method.** **93.8% said they would definitely continue using an app like this.**

---

## Finding 1 — Late Low-Stock Discovery is the #1 Problem

**What we found:**
In the initial survey, the most frequently reported problem combination was *"Late low-stock discovery + Slow stock updates"* (9 of 63 responses). When analysed across all response combinations, late discovery of stockouts appeared in 36 of 63 responses — over 57% of participants.

**What it means:**
Shop owners and staff discover stockouts reactively — when a customer asks for an item that isn't there. By that point, revenue is already lost and the customer may not return. No existing tool sends a proactive alert calibrated to the shop's reorder threshold.

**How StockFlow addresses it:**
- Real-time low-stock alert banner on the dashboard — visible at a glance before the shop opens
- Configurable minimum stock threshold per product
- Alert list showing every item below safety level, ordered by urgency

**Gujarati business context:**
During Navratri, Diwali, and wedding seasons, demand spikes are dramatic and unpredictable. A stockout discovered on Day 1 of Navratri cannot be resolved for 2–3 days if the supplier lead time is not managed in advance. Early warning is critical.

---

## Finding 2 — Fragmented Record-Keeping Creates Daily Reconciliation Burden

**What we found:**
63 participants reported their current stock management methods. Only 15 relied on a single tool. The majority used combinations: notebook + spreadsheet (19%), billing software + spreadsheet (8%), notebook + billing software + other combinations (27%). 12 participants used a notebook exclusively. Only 1 relied on memory/verbal communication alone.

**What it means:**
Most shops run two or three parallel record systems that are never fully in sync. Counter staff spend 20–45 minutes every morning reconciling last night's entries across systems. When systems disagree, the notebook is usually trusted over the computer — signalling low confidence in digital tools.

**How StockFlow addresses it:**
- Single source of truth for all stock movements (INBOUND, OUTBOUND, ADJUSTMENT, TRANSFER)
- Every entry is logged with actor name, timestamp, and reference number — eliminating the need for a parallel notebook
- Mobile access means the shop owner can verify stock from his phone without being physically present

---

## Finding 3 — Current System Satisfaction is Low

**What we found:**
Initial survey satisfaction with current stock management methods averaged **2.49 out of 4** (median 2, mode 2). 33 of 63 respondents rated satisfaction below 3. A one-sided sign test on non-neutral responses returned p = 5.42e−07, confirming that dissatisfaction is not random.

**What it means:**
Small business owners know their current system is not working but have not found a viable alternative. ERP systems like Tally are perceived as too complex for counter staff. Spreadsheets require a laptop and manual updating. WhatsApp-based coordination loses information quickly.

**How StockFlow addresses it:**
- Designed for counter staff with no prior software training (100% ease-of-use rating in prototype testing)
- Works on Android Chrome without installation — no Tally license, no desktop required
- Gujarati and Hindi-friendly UI labels for core actions (aavak / javak / transfer)

---

## Finding 4 — Search Speed is the Make-or-Break Usability Metric

**What we found:**
In interviews, the most common scenario described was: a customer calls or stands at the counter and asks whether a specific item is available. The shop owner or staff must respond within seconds. If finding the answer takes more than 20–30 seconds, the customer's confidence drops.

In the feedback survey, **57.8% rated product search Very Easy** and 42.2% rated it Easy — 100% positive rating. This was the highest single-feature satisfaction score.

**How StockFlow addresses it:**
- Instant search by SKU, product name, or category with results appearing as the user types
- No page reload required — results update in real time from in-memory product cache
- Mobile-optimised search bar prominent on every screen

---

## Finding 5 — Supplier Reliability Tracking is an Unmet Need

**What we found:**
In interviews, multiple business owners mentioned that they cannot tell which supplier is reliable and which is not based on any recorded data. Decisions are made on memory and personal relationship, not documented lead time or on-time delivery history.

**How StockFlow addresses it:**
- Supplier directory with Tier A/B/C classification and lead time tracking
- Supplier performance visible alongside product records for informed reorder decisions
- Purchase order lifecycle tracking to record whether deliveries arrive on time

---

## Finding 6 — Dark Mode Preference is Practical, not Aesthetic

**What we found:**
Dark mode / better readability in shop lighting was the second most requested feature from open-ended responses (18 of 64). In interviews, participants described using the system on screens positioned near windows, in bright sunlight, or in dimly lit godowns (storage rooms) depending on the time of day.

**How StockFlow addresses it:**
- Full dark/light theme toggle — high-contrast arsenic-green accent on dark mode optimised for warehouse and godown environments
- Theme preference persisted per user session

---

## Finding 7 — Multi-User Access with Role Separation is Needed

**What we found:**
Multi-user access with separate roles was the third most common feature request (14 of 64). In practice, most shops have one owner and one or more counter staff, with different levels of trust and different tasks. Owners want staff to be able to record movements but not change prices, delete products, or view supplier financials.

**How StockFlow addresses it:**
- Four roles: Admin (owner), Manager, Shopkeeper, Staff
- Role-based API protection: each endpoint validates the caller's role before executing
- Audit log records which user performed every stock mutation

---

## Data and Limitations

- **Initial survey:** 63 responses; 2 duplicate name entries retained under the same participant ID. Satisfaction ratings are self-reported on a 1–4 scale without anchors — treat the mean (2.49) as directional, not precise.
- **App feedback survey:** 64 responses; timestamps are clustered within a few minutes, suggesting group testing. Response authenticity should be confirmed before treating results as independent.
- **No controlled comparison:** There are no paired pre/post task-time measurements or error-rate comparisons between StockFlow and current methods. Survey responses reflect perceived improvement, not measured performance improvement.
- **Sampling:** Participants were recruited from local businesses in three Gujarati cities. Results may not generalise to other regions or business types.
- **Language:** All interviews were conducted in Gujarati and Hindi. Translations are the researcher's own and have not been independently verified.
