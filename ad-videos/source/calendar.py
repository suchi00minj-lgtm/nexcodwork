# Builds the campaign page (index.html) and captions.md from the timeline.
import json, html, os
V = json.load(open('build/timeline.json'))
BASE = "#NexcodPOS #PharmacyBilling #MedicalStore #ChemistShop #PharmacySoftware #MadeInIndia"
CAP = {
 "01": ("Billing, stock, expiry, GST… ab sab ek hi screen par. Nexcod POS, medical stores ke liye bana billing software. 7 din FREE trial, koi card nahi chahiye. 👉 nexcodpos.in", "#GSTBilling #MedicalShop"),
 "02": ("Ek dawa, teen batch, teen MRP. Nexcod POS mein counter par hi sahi batch chuno, aur expired dawa ka bill banega hi nahi. Free trial: nexcodpos.in", "#BatchTracking #ExpiryManagement"),
 "03": ("Strip todi, 5 goli bechi? Pack aur loose alag likho, goli ka rate apne aap aur stock bilkul exact. Try karo free: nexcodpos.in", "#LooseTablets #PharmacyStock"),
 "04": ("Expiry ka nuksaan band! 90 din pehle alert, value at risk ki list, aur expired dawa billing par block. nexcodpos.in", "#NearExpiry #PharmacyInventory"),
 "05": ("Drug inspector aaye to tension nahi. Schedule H, H1, X register bill ke saath apne aap taiyaar. nexcodpos.in", "#ScheduleH #DrugRegister"),
 "06": ("GSTR-1 tables, GSTR-3B summary aur filing se pehle error check. GST ki tension khatam. nexcodpos.in", "#GSTR1 #GSTReturn"),
 "07": ("Distributor ka lamba bill? Photo ya Excel se import karo, scheme aur free maal ka hisaab apne aap. nexcodpos.in", "#PurchaseEntry #Distributor"),
 "08": ("Har dawa ki asli cost aur break-even price, bas F1 dabao. Sahi rate, sahi munafa. nexcodpos.in", "#ProfitMargin #PharmacyBusiness"),
 "09": ("Bill seedha grahak ke WhatsApp par, aapke apne number se, PDF link ke saath. nexcodpos.in", "#WhatsAppBilling #DigitalBill"),
 "10": ("Grahak aaya aur dawa khatam? Nexcod POS aapki sale dekh kar batata hai kya order karna hai. nexcodpos.in", "#PurchaseOrder #LowStock"),
 "11": ("Har staff ka alag login, 55 permissions, photo attendance aur salary ka hisaab. Dukaan aapke control mein. nexcodpos.in", "#StaffManagement #ShopOwner"),
 "12": ("Udhaar ka hisaab ek click mein: credit limit, dues collection aur kab se baaki, sab saaf. nexcodpos.in", "#Udhaar #CustomerDues"),
 "13": ("Sales, stock, GST, accounts: 55 report views, Day-End Z-Report aur Tally export. CA bhi khush. nexcodpos.in", "#BusinessReports #Tally"),
 "14": ("Lambi line? Keyboard se billing, 5 bill ek saath, phone camera bana barcode scanner. nexcodpos.in", "#FastBilling #POS"),
 "15": ("Itna sab kuch sirf ₹1,299 saal mein (lagbhag ₹108 mahina). Auto-renew nahi, 7 din FREE trial. Aaj hi shuru karo: nexcodpos.in", "#Offer #PharmacySoftware"),
}
THEME = {"01":"Brand intro","02":"Batch at the counter","03":"Loose tablets","04":"Expiry alerts","05":"Schedule H registers","06":"GST reports","07":"Purchase import","08":"Rate desk and profit","09":"WhatsApp bills","10":"Smart purchase orders","11":"Staff control","12":"Credit and dues","13":"Reports and books","14":"Billing speed","15":"Price and offer"}
os.makedirs('site/videos', exist_ok=True)
rows=[]; md=["# Nexcod POS · 15-day ad campaign\n\n","Vertical 1080×1920 videos (Reels, Shorts, WhatsApp Status, Facebook). Hindi voiceover, Hinglish on-screen text.\n\n","Suggested posting: Reels/Shorts around 1–2 PM (quiet hours at the counter) and WhatsApp Status around 9 PM. Adjust to what your page analytics show.\n"]
for v in V:
    fn=f"day-{v['id']}-{v['slug']}.mp4"; cap,tags=CAP[v['id']]
    full=f"{cap}\n\n{BASE} {tags}"
    script="".join(f"<li><b>{html.escape(s['type'])}</b> · {html.escape(s.get('head') or s.get('title') or s.get('big') or ' / '.join(s.get('lines',[])) or ('CTA' if s['type']=='cta' else 'Price card'))}<br><span class='vo'>{html.escape(s['vo'])}</span></li>" for s in v['scenes'])
    rows.append(f"""<article class="day" id="day-{v['id']}">
  <div class="vid"><video src="videos/{fn}" poster="videos/{fn[:-4]}.jpg" controls preload="none" playsinline></video></div>
  <div class="info">
    <div class="kick">Day {int(v['id'])} · {THEME[v['id']]} · {v['total']:.0f} sec</div>
    <h2>{html.escape(v['title'])}</h2>
    <label class="lab" for="cap{v['id']}">Caption</label>
    <textarea id="cap{v['id']}" readonly rows="5">{html.escape(full)}</textarea>
    <button type="button" class="copy" data-for="cap{v['id']}">Copy caption</button>
    <details><summary>Script (voiceover)</summary><ol class="script">{script}</ol></details>
    <p class="file">File: <code>ad-videos/videos/{fn}</code></p>
  </div>
</article>""")
    md.append(f"\n## Day {int(v['id'])} · {v['title']}\n\n- Theme: {THEME[v['id']]}\n- File: `videos/{fn}` ({v['total']:.0f} s)\n\n**Caption**\n\n```\n{full}\n```\n\n**Voiceover script**\n")
    for i,s in enumerate(v['scenes'],1): md.append(f"{i}. {s['vo']}\n")
open('site/captions.md','w').write("".join(md))
nav=''.join(f'<a href="#day-{v["id"]}"><span>{int(v["id"])}</span>{THEME[v["id"]].split()[0]}</a>' for v in V)
page=open('page_template.html').read().replace('<!--ROWS-->','\n'.join(rows)).replace('<!--NAV-->',nav)
open('site/index.html','w').write(page)
print('ok',len(rows))
