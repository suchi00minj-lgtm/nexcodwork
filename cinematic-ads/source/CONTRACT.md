# Nexcod POS cinematic ads — engine contract

Fifteen animated ad films (2D, flat-vector, cinematic) for Nexcod POS, pharmacy billing
software for Indian medical stores. Rendered by an HTML/SVG engine at 1920x1080 (16:9,
Google/YouTube) and 1080x1920 (9:16, Meta Reels/Stories). Everything below is the
shared vocabulary between set artists, script writers and the engine.

## 1. World and camera

* Every scene is an SVG "world" of **2400 x 1350** units. The camera frames a rectangle of
  that world. Floor line (where standing feet touch) is **y = 1250** unless a set says
  otherwise.
* A standing adult character is about **760 units tall** (head top at y ≈ 490 when feet are at
  1250). Head is about 150 units tall. Children about 470 units.
* Characters are drawn in a 3/4 view facing left or right.

## 2. Art style (sets and props)

* Modern flat vector, soft cel shading: every object has a base colour plus ONE darker shade
  for shadow and optionally ONE lighter tint for highlight. No black outlines. Rounded corners.
* Indian small-town / city context, realistic proportions, clean and premium (think a
  professionally produced explainer film, not clip-art).
* Palette (use these and tints/shades of them; avoid pure saturated primaries):
  * walls warm cream `#F3EBDD`, `#E9DCC6`; wood `#B9875A`, `#9A6B43`, `#7A5233`
  * cool greys `#DCE1E8`, `#AEB6C2`, `#6B7686`; deep navy `#1F2A44`
  * brand red `#C8161E` (sparingly: signboards, accents); pharmacy green `#1E9E62`
  * medicine box colours (muted): `#E7B04A`, `#5AA0D8`, `#E36F5C`, `#7BC18E`, `#B48ED6`, `#F2D16B`, `#FFFFFF`
* Text inside sets uses font-family `Poppins` (weights 400/500/600 only). Store name text is a
  parameter.
* Day vs night: draw both via the `time` option. Night = darker, bluer walls/sky, warm practical
  lights (tube light glow, sign glow), windows dark blue. The engine also applies a global
  colour grade, so keep night readable.

## 3. Set module API (files in `sets/<id>.js`, plain browser JavaScript, no imports)

```js
window.SETS = window.SETS || {};
window.SETS['store_interior'] = {
  floorY: 1250,
  // named x positions (world units) where characters can stand, and their zone
  spots: {
    counter_left: {x: 980,  zone: 'behind'},   // behind the counter (lower body hidden by 'front' layer)
    counter_mid:  {x: 1250, zone: 'behind'},
    counter_right:{x: 1520, zone: 'behind'},
    cust_left:    {x: 430,  zone: 'front'},    // customer side, full body visible
    cust_right:   {x: 2050, zone: 'front'}
  },
  // optional rectangle (world units) of a computer/phone screen inside the set that can show UI
  screenRect: [1560, 760, 260, 160],
  draw(opts) {               // opts = {time:'day'|'night', name:'Sharma Medical Store', rain:false}
    return {
      back:  '<g>…far background: walls, shelves, windows…</g>',
      mid:   '<g>…objects behind characters…</g>',
      front: '<g>…objects in front of "behind" zone characters (e.g. the counter)…</g>',
      fore:  '<g>…very near foreground, optional, will be blurred and parallaxed…</g>'
    };
  }
};
```

* Each returned string is SVG markup in world units (0..2400 x 0..1350), no `<svg>` wrapper.
  `back` must fill the whole 2400x1350 area (no transparent holes).
* Layer order: back → mid → characters with zone 'behind' → front → characters with zone
  'front' → fore.
* Gradients/filters: allowed, but give every `id` a unique prefix of the set id
  (e.g. `store_interior_g1`) so sets never clash.
* Keep each set under ~250 KB of markup. No external images.
* Preview: `node preview_set.js <setId> <day|night> <out.png>` renders the set with grey
  placeholder silhouettes at every spot (so scale can be checked).

## 4. Set catalogue (ids writers may use)

| id | what it is | spots |
|---|---|---|
| `store_interior` | Inside a medical store, front view: long glass-front counter across the middle, shelves of medicine boxes behind, a computer monitor on the counter (screenRect), tube lights, store name board on the back wall, a small calendar and a deity/wall clock decoration. | counter_left/mid/right (behind), cust_left, cust_right (front) |
| `store_front` | Street view of the shop: shutter open, signboard with name and green cross, steps, a scooter parked, footpath. Night: neon cross glow. `rain:true` adds rain streaks and wet reflections. | walk_left (x 350), door (x 1200), walk_right (x 2000) — all front |
| `counter_closeup` | Tight view of the counter top: medicine strips, a bill book, calculator, a smartphone, pen, a stack of distributor bills. Mostly a prop/insert set. | hands (x 1200, front) |
| `godown` | Distributor's warehouse/office: stacked cartons, racks, a desk with a computer and bill printouts. | desk (x 1300, behind a desk), left (x 500), right (x 1900) |
| `home` | Middle-class living room: sofa, lamp, window, family photo frame, tea table. Night variant with lamp light. | sofa_left (x 900), sofa_right (x 1300), stand (x 1900) |
| `ca_office` | Chartered accountant's office: desk with files and laptop, bookshelf, certificates on wall. | ca_desk (x 1500, behind desk), visitor (x 800, front) |
| `street` | Busy Indian market street: shopfronts, auto-rickshaw, bikes, overhead wires, sky. | left (x 500), mid (x 1200), right (x 1900) |
| `clinic` | Doctor's cabin: desk, chair, BP machine, chart on wall, window. | doctor (x 1500, behind desk), patient (x 750, front) |
| `news_studio` | TV news studio: big screen wall, anchor desk with logo area, studio lights. | anchor (x 1200, behind desk) |
| `abstract_white` | Clean white studio backdrop with soft brand-red and grey abstract shapes, floor shadow. For talking-to-camera and testimonials. | center (x 1200), left (x 800), right (x 1600) |

## 5. Characters (ids writers may cast)

| id | who | look | voice |
|---|---|---|---|
| `rakesh` | Store owner/pharmacist, 45 | brown skin, short black hair greying at temples, thick moustache, white shirt, navy sleeveless vest | `madhur` |
| `aman` | Owner's son, 26, tech-savvy | medium skin, modern short hair, light stubble, sky-blue shirt | `brian` |
| `papa` | Owner's father, 68, old-school | grey receding hair, white moustache, round glasses, cream kurta, brown shawl | `madhur_old` |
| `sunita` | Co-owner (wife), 40 | medium skin, low bun, bindi, maroon kurta with dupatta | `swara` |
| `raju` | Counter staff boy, 21 | darker skin, messy hair, green store polo | `giuseppe` |
| `pooja` | Pharmacist assistant, 23 | ponytail, teal kurta, white coat optional | `ava` |
| `aunty` | Elderly customer, 62 | grey bun, glasses, purple saree, cloth bag | `swara_old` |
| `uncle` | Middle-aged customer, 58 | kurta, Nehru cap, moustache | `florian` |
| `inspector` | Drug inspector, 48 | formal light-blue shirt, glasses, file folder, stern | `andrew` |
| `ca` | Chartered accountant, 34, woman | blazer, glasses, shoulder-length hair | `emma` |
| `mr` | Distributor's salesman, 30 | formal shirt and tie, laptop bag | `giuseppe` |
| `doctor` | Doctor, 50 | white coat, stethoscope, short beard | `madhur_deep` |
| `young_mom` | Young mother, 30 | kurta, dupatta, holding child's hand | `vivienne` |
| `kid` | Child, 8 | school uniform | `ava_kid` |
| `anchor` | TV news anchor, 30, woman | blazer, open hair | `emma` |
| `narrator` | Voice only (no body) | — | `narrator` |

Rule: inside one video, never cast two on-screen characters who share the same voice
(e.g. `raju` and `mr` both use `giuseppe`).

Gestures: `idle`, `point`, `wave`, `hands_on_head`, `thumbs_up`, `hold_phone`, `show_phone`,
`shrug`, `arms_crossed`, `nod`, `shake_head`, `give`, `type` (behind a counter/desk only),
`facepalm`, `clap`, `think`, `namaste`, `count_cash`.
Emotions: `neutral`, `happy`, `worried`, `angry`, `surprised`, `sad`, `relieved`, `thinking`,
`confident`.
Movement: `enter_left`, `enter_right`, `exit_left`, `exit_right`, `walk_to:<spot>`.

## 6. Script format (one JSON file per video in `scripts/day-XX.json`)

```json
{
  "id": "01", "slug": "line-lambi-billing-slow", "style": "cinematic drama",
  "title": "Hinglish title shown in the calendar",
  "problem": "one sentence: the real problem this ad solves",
  "audience": "who should see it (for ad targeting)",
  "store": "Sharma Medical Store",
  "music": [{"at_shot": 0, "mood": "tension"}, {"at_shot": 6, "mood": "upbeat"}],
  "cast": ["rakesh", "aunty", "raju"],
  "dramatization": true,
  "shots": [ ...see below... ],
  "ads": {
    "google_headlines": ["≤30 chars", "... 5 to 8 of them"],
    "google_descriptions": ["≤90 chars", "... 2 to 4"],
    "meta_primary_text": "≤ 280 chars, Hinglish",
    "meta_headline": "≤ 40 chars",
    "cta": "Sign Up | Learn More | Start Free Trial"
  }
}
```

Shot types:

```json
{"type":"scene", "set":"store_interior", "time":"day", "rain":false,
 "place":[{"who":"rakesh","spot":"counter_mid","face":"left"}, {"who":"aunty","spot":"cust_left","face":"right"}],
 "camera":{"frame":"wide|two:rakesh,aunty|medium:rakesh|close:rakesh|insert", "move":"static|push_in|pull_out|pan_left|pan_right|handheld|shake"},
 "lines":[{"who":"aunty","hi":"देवनागरी में संवाद (TTS पढ़ेगा)","sub":"Hinglish subtitle in Latin script","emotion":"worried","gesture":"point"}],
 "actions":[{"who":"raju","do":"enter_right","at":0.5}],
 "sfx":[{"name":"door_bell","at":0.2}],
 "hold":0.8, "transition":"cut|fade|whip|dip_black|flash",
 "title":"optional on-screen text, e.g. 'Somvaar, subah 10 baje'"}

{"type":"screen", "img":"billing-items", "zoom":["bill_lines","bill_total"],
 "notes":[{"target":"batch","text":"Sahi batch"}],
 "lines":[{"who":"narrator","hi":"…","sub":"…"}], "head":"optional big caption", "hold":0.5}

{"type":"card", "card":"title|kinetic|stat|split|news|chat|quiz|checklist|countdown|price",
 "data":{...card specific, see section 8...}, "lines":[...optional voice...], "hold":1.0}

{"type":"endcard", "lines":[{"who":"narrator","hi":"…","sub":"…"}]}
```

* Shot duration = its spoken lines + 0.35 s gaps + `hold`. A shot with no lines needs
  `hold` ≥ 1.5.
* `hi` is Hindi in Devanagari (natural spoken Hindi, English words like बिल, स्टॉक, जीएसटी
  written in Devanagari). `sub` is the same line in simple Hinglish, Latin script, ≤ 70
  characters. Keep each line short (one breath, ≤ 16 words); split long speech into lines.
* The engine adds the letterbox, grade, subtitles, lip-sync, ambience and end card.

## 7. Real software screens available for `screen` shots

Real screenshots of Nexcod POS v3.0.0 (1366x768). `zoom` uses region names; `notes` use
target names.

| img | shows | zoom regions | note targets |
|---|---|---|---|
| `dashboard` | home dashboard | dash_qa, dash_alert, dash_cards | new_bill, expiry_tile, lowstock_tile, outofstock_tile, dues_tile |
| `billing-search` | Find the medicine window | search_list, search_list_r | search_box, salt, batch_col, stock_col |
| `billing-items` | a bill with 4 lines | bill_lines, bill_lines_r, bill_total, bill_print | batch, qty_pack, qty_loose, above_mrp, total, print_btn |
| `rate-desk` | F1 rate desk | rate_full, rate_quote | flat_rate, you_make, break_even |
| `payment` | payment window | pay | cash, upi, credit, amount |
| `keys` | keyboard shortcuts | keys, keys_r | f2, f9, f1 |
| `inventory` | product list | inv_tabs, inv_table | search, tabs, import, add_product, stock |
| `near-expiry` | near-expiry report | near, near_r | batch, days_left, value_at_risk |
| `purchase-entry` | new purchase | pe_import, pe_scheme | import, rate_on_bill, scheme, free_qty, bill_total |
| `po-new` | purchase order suggestions | po_sugg, po_sugg_r | suggest, why, order_qty |
| `low-stock` | low stock sheet by supplier | lowstock | — |
| `schedule-check` | schedule check | sched | untagged, apply |
| `reports-registers` | drug registers | registers | — |
| `reports-gst` | GST reports | gst_grid, gst_grid_r | gstr1, before_file, gstr3b |
| `gst-filecheck` | before-you-file check | gst_check, gst_check_r | fix_this, what_to_do |
| `reports-sales` | sales reports + Z report | sales_rep, zrep | pick_report, z_cash, z_credit |
| `books-pl` | profit & loss | pl | net_profit |
| `daybook` | day book | daybook | tally_export |
| `invoices` | invoice list | inv_list, inv_list_r | invoice_list, whatsapp_btn, sent |
| `customers` | customers + dues | cust, cust_r | due_amount, collect |
| `customer-add` | add customer form | cust_add | credit_limit |
| `outstanding` | dues by age | outst | since_when, supplier_dues |
| `staff-roles` | role permissions | roles | make_bill, hide_cost |
| `rules` | counter rules | rules_top | block_expired |
| `find-my-bills` | customer bill lookup | fmb | email_code |
| `whatsapp` | WhatsApp settings | wa | own_number |

## 8. Cards

* `title`: `{"lines":["Line 1","Line 2"], "sub":"small caption"}` — cinematic title card.
* `kinetic`: `{"lines":["Words","that","hit"]}` — big animated typography, one line at a time.
* `stat`: `{"big":"₹18,000","label":"saal ka nuksaan expiry se","small":"KYA AAP JAANTE HAIN"}`.
* `split`: `{"left_title":"Pehle","left":["…","…"],"right_title":"Nexcod POS ke saath","right":["…","…"]}`.
* `news`: `{"headline":"…","ticker":"…"}` (shown over `news_studio`; use with an `anchor` scene).
* `chat`: `{"contact":"Sharma Medical Store","messages":[{"from":"shop|me","text":"…","attach":"pdf_bill|none"}]}`.
* `quiz`: `{"q":"…","options":["A","B","C"],"answer":1}`.
* `checklist`: `{"title":"…","items":["…","…"]}`.
* `countdown`: `{"from":10,"label":"Inspector aa raha hai"}`.
* `price`: `{}` (fixed: Platinum ₹1,299/saal, ₹108/mahina, 7 din free trial).

## 9. Facts (only claim these)

* Nexcod POS: pharmacy billing and stock software for Indian medical stores; browser + Android
  app. 7-day free trial, no card. Plans: ₹399/3 months, ₹699/6 months, ₹1,299/year (≈₹108 a
  month), 2 and 3 year plans. No auto-renew. Pay by UPI.
* Features: GST & composition billing; batch chosen at the counter with its own expiry and
  MRP; loose tablets billed from strip MRP; expired batches can be blocked; near-expiry, low
  stock, out-of-stock alerts; Schedule H/H1/X registers filled from bills; purchase entry typed,
  imported from Excel or read from a bill photo; scheme/free goods; rate desk (F1) with flat rate
  and break-even; WhatsApp/e-mail bills from the shop's own number; customer credit limits and
  dues collection; party ledger; GSTR-1 tables, GSTR-3B summary, "Before you file" check;
  55 report views, Day-End Z-report, P&L, balance sheet, Tally export; staff logins with 55
  permission switches, photo attendance, salary; up to 5 bills open; phone camera as barcode
  scanner; barcode labels; customers can see bills at nexcodpos.in/find-my-bills; Made in India;
  used in 24 states and UTs.
* GST on most medicines is 5% since 22 Sep 2025.
* Contact: nexcodpos.in · Call 73198 33790 · WhatsApp 72819 21783.
* Never claim: number of customers, "No. 1", "best", savings figures as facts about real shops,
  medical outcomes, or anything about competitors by name.

## 10. Sound vocabulary

* Music moods (`music` cues, change at a shot index): `tension`, `suspense`, `emotional`,
  `calm`, `comedy`, `upbeat`, `inspiring`, `news`, `festival`.
* Sound effects (`sfx` in scene shots, `at` = seconds from shot start): `door_bell`,
  `cash_register`, `phone_ding`, `notification`, `clock_tick`, `rain`, `thunder`, `crowd`,
  `whoosh`, `keyboard`, `paper`, `heartbeat`, `camera_click`, `car_door`, `bike_horn`,
  `scooter`, `applause`, `printer`, `swoosh_up`, `gasp_hit`.
* The engine adds room ambience per set automatically.

## 11. Validation

`python3 validate_script.py scripts/day-XX.json` checks every id against this contract and
estimates the duration (≈ 11 Devanagari characters per second + gaps). Every script must pass
with 0 errors.
