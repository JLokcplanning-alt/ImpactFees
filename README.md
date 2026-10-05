# Modeled Impact Fee Revenue

The dashboard uses Aptos when installed, with Segoe UI, Calibri and Arial as fallbacks.

Open `index.html` in a browser. The standalone app includes its data and needs no installation, external scripts or backend.

## Dashboard

- **Revenue charts:** A black current-fee revenue bar sits beside a proposed bar stacked by land use, with Current and Proposed labels underneath and a single summary table below the charts. Citywide revenue appears on the left, with Core, Infill, New Growth and Rural comparisons on the right. The four benefit charts share one dollar scale; Citywide has its own labeled scale. Residential dwelling-size categories are grouped as Residential; all eight nonresidential fee uses retain separate colors. Hover, focus or tap a colored segment for an immediate tooltip showing its land use, revenue and percentage share. Tooltip positions stay inside the viewport; Escape dismisses them. The summary table gives Citywide and each benefit class separate rows with current revenue, proposed revenue, dollar difference. It scrolls horizontally on narrow screens so dollar amounts remain separated. The legend shows category names and colors; percentage shares appear in bar tooltips. The period selector switches annual averages and five-year totals. Charts update with discounts and development quantities; citywide and benefit-class dollar differences update in the summary table. Citywide is highlighted with a dark gray background and bold text; its dollar difference is green for positive, red for negative and black for zero, on a light inset background; area rows are italicized. Chart and legend colors use yellow for residential, red shades for customer-oriented uses, purple shades for industrial and warehouse uses, blue for office and institutional uses, and orange for lodging. Current revenue remains black.
- **Discounts tab:** Sector and benefit-class percentage inputs share a tab beside **Fee schedules**. Land-use discount inputs remain in both fee tables between the use label and benefit-class fees. Switching tabs preserves every setting. Revenue remains visible above all five tabs. Discounts apply to maximum supportable fees and compound across categories. Defaults are 70% for each use and zero for geographic and citywide discounts.
- **Fee schedules tab:** Each table heading includes a discount slider and percentage input to set all eight uses in that table together. Nonresidential and residential controls operate independently and apply across locations. Individual row discounts remain editable; a mixed table shows “Mixed” until a bulk control sets one discount again. Full-width, separate nonresidential ($/sq ft) and residential ($/dwelling) tables. Every benefit-class column shows **current | proposed**. Green proposals increase, red proposals decrease and black proposals match current fees to the displayed cent.
- **Display checkboxes:** Both start **unchecked**. “Show maximum supportable” adds the undiscounted maximum before each pair: **maximum supportable | current | proposed**. “Show change” adds a separated change value after the proposal: **current | proposed | (+130.5%)**. The adjacent **% / $** buttons switch between percentage changes and dollar changes, including dollars per dwelling in the residential table. The checkboxes appear in that order before the Sector dropdown and operate independently. They change only the tables’ presentation.
- **Past Development tab:** Five-year modeled development by sector, benefit class and land use: nonresidential square footage and residential dwelling counts. Each five-year input has an adjacent **Annualized** output box calculated as total ÷ 5. Annualized values are read-only and update immediately after valid edits. Residential inputs show five-year dwellings and annualized dwellings per year. **Unlock editing** starts unchecked, with every field locked. Unlock to edit quantities and update both current-structure and proposed-structure revenues. Relock to prevent further edits. **Restore model activity** resets quantities while retaining discounts. Residential dwelling inputs directly control per-dwelling revenue calculations.
- **Revenue tab:** Separate nonresidential and residential breakdowns by land use, with **current | proposed** revenue shown side by side for both **5-year total** and **Annualized**. Each table has a subtotal. Defaults to Citywide and all benefit classes, with independent sector and benefit-class filters. Revenue updates with discount and development edits. The period selector above the dashboard does not change these two fixed table periods.
- **Phase-in tab:** Separate nonresidential ($/sq ft) and residential ($/dwelling) timelines from 2027 through 2037. Each row shows the proposed target, number of 15% increase steps and full-fee year. The 2027 column starts at current fees. Increases compound by 15% from 2028, capped at the proposal; decreases apply fully in 2028 and unchanged fees have zero steps. No annual inflation is added. Sector and benefit-class filters choose the location, and discount edits update the path immediately. Full-fee years beyond 2037 remain visible even when the timeline has not yet reached the target.

Location filters affect the tables. Discounts affect citywide revenue. Inputs allow 0–100%.

The sidebar has been removed. Compact 12px tabs sit along the top edge of the panel, with a thin underline identifying the active view. They support clicks, arrow keys, Home and End. Fee schedule, activity sector selections, edit lock and display settings persist when swapping tabs.

Residential rows run from **Under 1,000** through **4,000+**. Example-size annotations and explanatory paragraphs have been removed from the fee schedules panel.

## Sources

Maximum supportable fees come from **Handout Tables_7.xlsx → Fees**. The discounted Handout tab is not used as the maximum schedule.

| Benefit class | Fee rows | Nonresidential maximums | Residential maximums |
| --- | --- | --- | --- |
| New Growth | 6–21 | D | N: Northeast, O: Northwest, P: Southeast, Q: Southwest |
| Core | 27–42 | D | D |
| Infill | 48–63 | D | N: Northeast, O: Northwest, P: Southeast, Q: Southwest |
| Rural | 69–84 | D | N: Northeast, O: Northwest, P: Southeast, Q: Southwest |

The schedule has 208 complete location/use combinations: 16 for Core and 48 for each of the four other sectors. Outside Core, nonresidential maxima in column D are **averages across the four sectors**, as described by the workbook. They are applied uniformly across those sectors, not presented as independently supplied sector-specific rates. Residential maxima outside Core are sector-specific. Nonresidential source values are already dollars per square foot; internal `phase2Rate` stores them multiplied by 1,000 for compatibility with the calculation engine.

Current revenue and current table rates retain the previously selected dashboard baseline from **ImpactFeeDiscountCalculator_5Year2024 (1).xlsx**:

- Calculator rows 2–206, column J: historical modeled current revenue.
- Updated Current Fees rows 4–9: complete pre-CPI nominal current schedule. Residential maps to Residential; Warehouse/Industrial to Industrial; Office/Institutional/Lodging to Office; customer uses to their respective categories.

The newer current fees in the handout have not replaced this baseline. They are retained in `handoutCurrentNative` for traceability. The dashboard uses the original pre-CPI baseline without an optional adjustment control.

Residential conversions retain the handout’s reference areas internally: 750, 1,250, 1,750, 2,250, 2,750, 3,250, 3,750 and 4,250 square feet. Current residential examples multiply the baseline floor-area rate by that example size; proposed and maximum fees are directly per dwelling. These sizes are not observed mean dwelling areas.

## Revenue calculation

The 205 original historical revenue combinations are preserved. For each combination with a fee rate:

`Calibrated historical exposure = original Phase 2 supportable revenue / original Phase 2 nominal fee`

`Updated supportable revenue = calibrated historical exposure × handout maximum fee`

`Proposed revenue = updated supportable revenue × (1 − sector discount/100) × (1 − benefit discount/100) × (1 − use discount/100) × (1 − citywide discount/100)`

Use native per-dwelling fees for residential and dollars per square foot for nonresidential. Calibrated exposure is an estimate inferred from the original model, not an independently verified permit count or floor area. Newly filled fee combinations without recorded historical activity add no revenue. Three unmatched administrative use categories have zero supportable revenue and are retained in the history but excluded from the fee schedules.

| Metric | Five-year total | Annual average |
| --- | ---: | ---: |
| Preserved current-fee baseline | $32,984,844.235 | $6,596,968.847 |
| Updated maximum supportable | $118,640,696.2695347 | $23,728,139.25390694 |
| Default discounted proposal | $35,592,208.88086041 | $7,118,441.77617208 |

The Past Development tab starts from the same calibrated exposures as the original model. Nonresidential exposure is square footage; residential inputs and annualized outputs are dwelling counts. Residential quantities retain their reference-size conversion internally to preserve existing scenario files and default revenue totals. No residential square-foot input or secondary equivalent labels appear in the development table. These are model-derived estimates, not verified floor-area measurements. Historical exposure is held constant unless the user edits it. For an existing combination with positive base activity, current and supportable revenues scale by `edited square footage / original modeled square footage`. For a combination with zero base activity, revenue uses the nominal current and maximum fees; residential maximums apply per dwelling equivalent. This includes the 39 complete-schedule combinations absent from the 205 historical source rows. The model now calculates 244 rows, while keeping the original 205 records intact. All original baseline totals still reconcile when assumptions are unchanged.

Activity inputs always represent five-year quantities. Switching revenue to an annual average divides the resulting revenue by five and does not change the activity entries.

Revenue is modeled, not a verified cash receipts report or forecast. The denominator of five is preserved from the original calculator. Original supportable revenue, nominal rates, saved scenario outputs and reconciliation controls remain in the data for auditing. Full precision is retained until display. Percentage and dollar changes use unrounded fees, except equal displayed cent amounts show 0.0% or $0.00.

The edit lock is a display control and starts locked on each page load.

## GitHub Pages

Upload the contents of this folder to a repository root and enable GitHub Pages under **Settings → Pages → Deploy from a branch**, choosing **main** and **/(root)**. For the simplest static deployment, only `index.html` and `.nojekyll` are required. The original workbooks are not included. No permit addresses or personal identifiers are included.

## Editing and verification

- `data.json`: Historical revenues, complete fee schedules, source cells and initial settings.
- `model.js`: Revenue and fee calculations.
- `app.js`: Inputs, fee tables and tab navigation.
- `body.html` / `style.css`: Page structure and styles.
- `build.py`: Bundles the source files into `index.html`, including the initial visible tables and revenue totals.
- `test.cjs`: Checks reconciliations, repricing, complete schedules, discounts, boundary values, CPI and residential conversions.
- `ui-smoke.cjs`: Exercises generated table outputs, both unchecked defaults, independent display toggles, percent/dollar mode switching, fee colors, all locations, discount inputs, five-tab navigation, activity edit locking, quantity scenarios, restoration and periods in a minimal DOM harness.

```bash
node test.cjs
python3 build.py
```

Rebuild `index.html` after editing. The build runs the behavior harness. Browser visual rendering has not been verified in this environment.

## Phase-in calculation

For an increasing fee with a positive current rate:

`Increase steps = ceil(log(proposed fee / current fee) / log(1.15))`

`Full fee year = 2027 + increase steps`

`Fee in year Y = min(proposed fee, current fee × 1.15^(Y − 2027))`

The final step is capped at the proposal rather than overshooting it. The target does not grow with inflation. Decreases take effect directly in 2028 after the 2027 current-fee starting point. Equal unrounded fees use zero increase steps. Step counts use full-precision rates, even when a small increase rounds to the same displayed cents. Phase-in values use standard text with no directional colors or target highlights. Rates retain full precision until display. The phase-in tab uses the dashboard’s current baseline and pre-CPI baseline; it does not apply an additional annual CPI adjustment. Quantity edits change revenue but do not change the fee-rate phase-in path.

The handout’s **Fees!M** step-count formula uses **Handout!B4 = 15%**. Its illustrative yearly columns **U:AE** multiply by **Fees!G2 = 1.165**. This dashboard follows the requested 15% rule throughout and omits the additional growth in those example columns. The original pre-CPI dashboard baseline is preserved rather than replacing it with the handout’s newer current schedule.

The displayed full-fee year may exceed 2037; the schedule remains limited to the requested 2027–2037 window.
