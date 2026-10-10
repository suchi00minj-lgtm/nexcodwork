# 15-day ad campaign for Nexcod POS. Each video is a list of scenes.
# vo = Hindi voiceover (Devanagari, read by TTS); on-screen text is Hinglish.
import json

CTA_VO = "सात दिन का फ्री ट्रायल, कोई कार्ड नहीं चाहिए। आज ही शुरू करें, नेक्सकॉड पीओएस डॉट इन पर।"
CTA_VO_SHORT = "सात दिन फ्री ट्राय कीजिए। नेक्सकॉड पीओएस डॉट इन।"

R = {  # focus rectangles on 1366x768 screenshots
  "dash_qa": [205, 50, 700, 230], "dash_alert": [205, 385, 660, 95], "dash_cards": [205, 470, 700, 200],
  "bill_lines": [205, 230, 700, 200], "bill_lines_r": [690, 230, 670, 200], "bill_total": [205, 690, 620, 78], "bill_print": [880, 690, 486, 78],
  "search_list": [60, 110, 720, 160], "search_list_r": [620, 110, 680, 160],
  "rate_full": [240, 85, 885, 590], "rate_quote": [240, 380, 620, 210],
  "pay": [350, 52, 660, 312],
  "pe_top": [200, 50, 700, 290], "pe_scheme": [200, 185, 600, 110],
  "po_sugg": [205, 150, 700, 300], "po_sugg_r": [700, 150, 660, 300], "lowstock": [250, 180, 620, 400],
  "rules_top": [460, 90, 700, 230],
  "sched": [200, 80, 800, 300], "registers": [200, 50, 700, 240],
  "gst_grid": [200, 130, 700, 260], "gst_grid_r": [690, 130, 670, 260], "gst_check": [200, 220, 700, 250], "gst_check_r": [660, 220, 700, 250],
  "near": [200, 160, 700, 200], "near_r": [690, 160, 670, 200], "pl": [200, 230, 700, 260],
  "roles": [200, 330, 700, 430], "wa": [470, 110, 700, 190],
  "keys": [240, 190, 600, 390], "keys_r": [640, 190, 500, 390], "fmb": [330, 120, 710, 560],
  "inv_list": [200, 130, 650, 90], "inv_list_r": [716, 130, 650, 90],
  "cust": [200, 80, 700, 200], "cust_r": [600, 80, 700, 200], "cust_add": [1100, 420, 266, 340], "outst": [200, 50, 700, 400],
  "sales_rep": [200, 120, 700, 230], "zrep": [200, 360, 700, 230], "daybook": [600, 60, 766, 250], "pe_import": [500, 40, 866, 220],
}

def hook(lines, vo): return {"type": "hook", "lines": lines, "vo": vo}
def shot(img, head, sub, vo, zoom, hl=None, url="", notes=()):
    return {"type": "shot", "img": img, "head": head, "sub": sub, "vo": vo, "zoom": [R[z] for z in zoom], "hl": R[hl] if hl else None, "url": url,
            "notes": [dict(zip(("x", "y", "text", "step", "dx", "dy"), n)) for n in notes]}
def bullets(title, items, vo): return {"type": "bullets", "title": title, "items": items, "vo": vo}
def stat(big, label, vo, small=""): return {"type": "stat", "big": big, "label": label, "small": small, "vo": vo}
def cta(vo=CTA_VO_SHORT): return {"type": "cta", "vo": vo}

V = []
V.append({"id": "01", "slug": "poori-dukaan-ek-screen", "title": "Poori dukaan, ek screen par", "scenes": [
  hook(["Medical store chalate ho?", "Billing, stock, expiry, GST…", "Sab alag jhanjhat?"], "क्या आप मेडिकल स्टोर चलाते हैं? बिलिंग, स्टॉक, एक्सपायरी, जीएसटी, सब अलग-अलग झंझट?"),
  shot("dashboard", "Nexcod POS", "Poori dukaan, ek screen par", "पेश है नेक्सकॉड पीओएस। आपकी पूरी दुकान, एक ही स्क्रीन पर।", ["dash_qa", "dash_alert"], url="nexcodpos.in/dashboard", notes=[(304,80,"Naya bill, ek click"),(288,430,"Expiry alert",1),(780,430,"Out of stock",1)]),
  shot("billing-items", "Seconds mein GST bill", "Batch, expiry aur MRP ke saath", "सेकंडों में जीएसटी बिल, बैच, एक्सपायरी और एमआरपी के साथ।", ["bill_lines", "bill_total"], url="nexcodpos.in/billing", notes=[(615,286,"Batch aur expiry"),(720,740,"GST ke saath total",1)]),
  bullets("Aur bhi bahut kuch", ["Expiry aur low-stock alert", "Schedule H / H1 register", "Bill seedha WhatsApp par", "Android app"], "एक्सपायरी अलर्ट, शेड्यूल एच रजिस्टर, व्हाट्सऐप पर बिल, और मोबाइल ऐप भी।"),
  cta(CTA_VO)]})
V.append({"id": "02", "slug": "sahi-batch-counter-par", "title": "Sahi batch, counter par hi", "scenes": [
  hook(["Ek dawa, teen batch,", "teen alag MRP.", "Bill mein galti?"], "एक ही दवा के तीन बैच, तीनों की अलग एमआरपी। बिल में गलती हो जाती है?"),
  shot("billing-search", "Dawa dhoondo", "Naam, salt ya barcode se", "नेक्सकॉड पीओएस में दवा का नाम, सॉल्ट या बारकोड डालिए।", ["search_list", "search_list_r"], url="nexcodpos.in/billing", notes=[(300,148,"Naam ya salt likho"),(730,226,"Batch",1),(940,226,"Stock kitna hai",1)]),
  shot("billing-items", "Haath wala batch chuno", "Har batch ki apni expiry aur MRP", "जो बैच आपके हाथ में है, वही चुनिए। हर बैच की अपनी एक्सपायरी और अपनी एमआरपी।", ["bill_lines", "bill_lines_r"], url="nexcodpos.in/billing", notes=[(615,286,"Haath wala batch"),(1060,348,"MRP se upar? Red",1)]),
  shot("rules", "Expired dawa ka bill?", "Banega hi nahi. Ek setting.", "और एक्सपायर्ड दवा का बिल बनेगा ही नहीं। बस एक सेटिंग चालू कीजिए।", ["rules_top"], url="nexcodpos.in/settings", notes=[(510,120,"Ye switch on karo")]),
  cta()]})
V.append({"id": "03", "slug": "khuli-goliyan-sahi-hisaab", "title": "Khuli goliyan, sahi hisaab", "scenes": [
  hook(["Strip todi,", "5 goliyan bechi…", "Ab hisaab kaise?"], "स्ट्रिप तोड़ी, पाँच गोलियाँ बेचीं। अब हिसाब कैसे रखें?"),
  stat("1 strip + 5 goli", "Bill par pack aur loose alag likho", "नेक्सकॉड पीओएस में बस पैक और लूज़ गोलियाँ अलग-अलग लिखिए।", small="QTY: PACK / LOOSE"),
  shot("billing-items", "Goli ka rate apne aap", "Strip ki MRP se nikalta hai", "हर गोली का रेट, स्ट्रिप की एमआरपी से अपने आप निकलता है।", ["bill_lines_r"], url="nexcodpos.in/billing", notes=[(880,300,"Pack / loose alag"),(1060,286,"Rate apne aap")]),
  bullets("Stock bilkul exact", ["Price hamesha full pack ka", "Stock strip mein, fraction tak", "Pack size check: galti pakde"], "और स्टॉक भी बिलकुल सही, आधी स्ट्रिप तक का हिसाब।"),
  cta()]})
V.append({"id": "04", "slug": "expiry-ka-nuksaan-band", "title": "Expiry ka nuksaan band", "scenes": [
  hook(["Shelf par padi dawa", "expire ho gayi…", "Paisa doob gaya?"], "शेल्फ़ पर पड़ी दवा एक्सपायर हो गई, और पैसा डूब गया?"),
  shot("dashboard", "Pehle se alert", "Near expiry, expired, low stock", "नेक्सकॉड पीओएस डैशबोर्ड पर पहले से बताता है, कौन सी दवा नब्बे दिन में एक्सपायर होगी।", ["dash_alert"], hl="dash_alert", url="nexcodpos.in/dashboard", notes=[(288,430,"90 din mein expiry"),(617,430,"Kam stock")]),
  shot("near-expiry", "90 din ki list", "Batch, din baaki, value at risk", "बैच, कितने दिन बाकी, और कितना पैसा दांव पर है, सब एक लिस्ट में।", ["near", "near_r"], url="nexcodpos.in/reports", notes=[(400,288,"Batch"),(600,288,"52 din baaki"),(880,288,"Value at risk",1)]),
  shot("rules", "Expired bikegi hi nahi", "Billing par auto block", "समय पर डिस्ट्रीब्यूटर को लौटाइए, और एक्सपायर्ड दवा बिलिंग पर अपने आप ब्लॉक।", ["rules_top"], url="nexcodpos.in/settings", notes=[(510,120,"Expired = block")]),
  cta()]})
V.append({"id": "05", "slug": "schedule-h-register-apne-aap", "title": "Schedule H register, apne aap", "scenes": [
  hook(["Drug inspector aaya,", "register adhoora?"], "ड्रग इंस्पेक्टर आया, और शेड्यूल एच वन का रजिस्टर अधूरा?"),
  bullets("Bill ke saath register ready", ["Patient ka naam aur mobile", "Doctor aur registration no.", "Batch, expiry, quantity"], "नेक्सकॉड पीओएस में शेड्यूल दवा का बिल तभी बनता है, जब मरीज़, मोबाइल और डॉक्टर भरा हो।"),
  shot("reports-registers", "H, H1, X registers", "Print karo, inspector ko dikhao", "और शेड्यूल एच, एच वन और एक्स रजिस्टर अपने आप तैयार, प्रिंट के लिए।", ["registers"], url="nexcodpos.in/reports"),
  shot("schedule-check", "Schedule Check", "Bina tag wali dawa khud dhoonde", "शेड्यूल चेक उन दवाओं को भी ढूँढता है जिन पर टैग लगाना रह गया।", ["sched"], url="nexcodpos.in/schedule-check", notes=[(570,194,"Bina tag wali dawa mili"),(300,388,"Ek click mein tag")]),
  cta()]})
V.append({"id": "06", "slug": "gst-ki-tension-khatam", "title": "GST ki tension khatam", "scenes": [
  hook(["Mahine ke end mein", "GST ka hisaab?"], "महीने के आख़िर में जीएसटी का हिसाब, सिरदर्द बन जाता है?"),
  shot("reports-gst", "GSTR-1 tables ready", "B2B, B2C, HSN, credit notes", "नेक्सकॉड पीओएस में जीएसटीआर वन की सारी टेबल तैयार: बी टू बी, बी टू सी, एचएसएन समरी।", ["gst_grid", "gst_grid_r"], url="nexcodpos.in/reports", notes=[(320,194,"GSTR-1 tables"),(640,258,"Filing se pehle check"),(920,268,"GSTR-3B summary",1)]),
  shot("gst-filecheck", "File karne se pehle check", "Portal kya reject karega, pehle bataye", "फाइल करने से पहले चेक, पोर्टल क्या रिजेक्ट करेगा, पहले ही बता देता है।", ["gst_check", "gst_check_r"], url="nexcodpos.in/reports", notes=[(530,288,"Galti pakdi gayi"),(1120,288,"Kya karna hai",1)]),
  bullets("Aur bhi", ["GSTR-3B summary", "Composition: Bill of Supply", "CA ke liye CSV download"], "जीएसटीआर थ्री बी समरी, कम्पोज़िशन डीलर के लिए बिल ऑफ़ सप्लाई, और सीए के लिए सीएसवी।"),
  cta()]})
V.append({"id": "07", "slug": "purchase-bill-photo-se", "title": "Purchase bill, photo se", "scenes": [
  hook(["Distributor ka lamba bill,", "ek-ek line type?"], "डिस्ट्रीब्यूटर का लंबा बिल, एक-एक लाइन टाइप करना पड़ता है?"),
  shot("purchase-entry", "Photo ya Excel se import", "Lines khud bhar jaati hain", "नेक्सकॉड पीओएस में बिल की फोटो या एक्सेल से इम्पोर्ट कीजिए, लाइनें अपने आप भर जाती हैं।", ["pe_import"], url="nexcodpos.in/purchase", notes=[(1010,74,"Photo / Excel import")]),
  shot("purchase-entry", "Scheme aur free maal", "Asli cost har strip par", "स्कीम और फ्री माल का हिसाब अपने आप, ताकि हर स्ट्रिप की असली कॉस्ट सही रहे।", ["pe_scheme"], url="nexcodpos.in/purchase", notes=[(250,240,"GST alag ya andar?"),(550,240,"Scheme ka tareeka")]),
  stat("Total match?", "Galat line turant pakdi jaati hai", "बिल का टोटल डालिए, कोई लाइन गलत हो तो तुरंत पता चल जाता है।", small="TOTAL PRINTED ON THE BILL"),
  cta()]})
V.append({"id": "08", "slug": "asli-munafa-jaano", "title": "Asli munafa jaano", "scenes": [
  hook(["Dawa ki asli cost", "kitni padi?"], "किसी दवा की असली लागत कितनी पड़ी, पता है?"),
  shot("rate-desk", "Bas F1 dabao", "Har distributor ka flat rate", "बिलिंग पर एफ़ वन दबाइए। हर डिस्ट्रीब्यूटर का रेट, स्कीम, डिस्काउंट और असली फ्लैट रेट।", ["rate_full"], url="nexcodpos.in/billing", notes=[(940,214,"Asli flat rate")]),
  shot("rate-desk", "Break-even turant", "Kitne mein bechein, kitna kamayein", "ब्रेक ईवन प्राइस और आपका मुनाफ़ा तुरंत, ताकि थोक ग्राहक को सही रेट बता सकें।", ["rate_quote"], hl="rate_quote", url="nexcodpos.in/billing", notes=[(1074,458,"Aapka munafa",0,-330,-230),(1098,486,"Break-even rate",0,-330,230)]),
  shot("books-pl", "Profit & Loss", "Bina alag accounting ke", "और प्रॉफिट एंड लॉस, बिना अलग से अकाउंटिंग किए।", ["pl"], url="nexcodpos.in/accounts", notes=[(264,384,"Net profit")]),
  cta()]})
V.append({"id": "09", "slug": "bill-seedha-whatsapp-par", "title": "Bill seedha WhatsApp par", "scenes": [
  hook(["Bill kho gaya?", "Paper khatam?"], "ग्राहक का बिल खो गया? या प्रिंटर का पेपर ख़त्म?"),
  bullets("Bill seedha WhatsApp par", ["Aapke apne number se", "PDF: dekho, download, print", "Bill bante hi, apne aap"], "नेक्सकॉड पीओएस बिल सीधे ग्राहक के व्हाट्सऐप पर भेजता है, आपके अपने नंबर से, पीडीएफ़ लिंक के साथ।"),
  shot("invoices", "Har bill par WhatsApp", "Ek click mein dobara bhejo", "इनवॉइस लिस्ट में हर बिल के आगे व्हाट्सऐप बटन।", ["inv_list", "inv_list_r"], url="nexcodpos.in/invoices", notes=[(324,298,"Har bill ki list"),(1160,298,"WhatsApp button",1),(1264,328,"Bhej diya",1)]),
  shot("find-my-bills", "Find My Bills", "Grahak khud apne bill dekhe", "और ग्राहक फाइंड माय बिल्स पर अपने सारे बिल ख़ुद देख सकते हैं।", ["fmb"], url="nexcodpos.in/find-my-bills", notes=[(678,598,"Email se OTP code")]),
  cta()]})
V.append({"id": "10", "slug": "order-karna-mat-bhoolo", "title": "Order karna mat bhoolo", "scenes": [
  hook(["Grahak aaya,", "dawa khatam!"], "ग्राहक आया, और दवा ख़त्म!"),
  shot("po-new", "Smart Purchase Order", "Aapki sale dekh kar suggestion", "नेक्सकॉड पीओएस आपकी बिक्री देखकर बताता है क्या मंगाना है, क्या ख़त्म हुआ, क्या ख़त्म होने वाला है।", ["po_sugg", "po_sugg_r"], url="nexcodpos.in/purchase-orders", notes=[(314,170,"Sale se suggestion"),(854,238,"Kyun? Stock khatam",1),(1244,238,"Kitna mangana",1)]),
  shot("low-stock", "Supplier-wise list", "Print ya PDF, turant", "सप्लायर के हिसाब से लो स्टॉक लिस्ट, प्रिंट या पीडीएफ़।", ["lowstock"], url="nexcodpos.in/low-stock"),
  bullets("Demand Register", ["Jo dawa nahi thi, note karo", "Grahak ko callback", "Agle order mein shamil"], "और जो दवा नहीं थी, डिमांड रजिस्टर में लिखिए, ताकि अगले ऑर्डर में आ जाए।"),
  cta()]})
V.append({"id": "11", "slug": "staff-par-poora-control", "title": "Staff par poora control", "scenes": [
  hook(["Staff ne discount de diya?", "Bill delete kar diya?"], "स्टाफ़ ने बिना पूछे डिस्काउंट दे दिया? या बिल डिलीट कर दिया?"),
  shot("staff-roles", "55 permissions", "Har staff ko utna hi, jitna chahiye", "नेक्सकॉड पीओएस में हर स्टाफ़ का अलग लॉगिन, और पचपन परमिशन, जो चाहें वही खोलें।", ["roles"], url="nexcodpos.in/staff-management", notes=[(280,400,"Bill bana sakta hai"),(380,728,"Cost chhupa do")]),
  bullets("Attendance aur salary", ["Photo ke saath attendance", "Owner ki approval", "Salary ka hisaab apne aap"], "फ़ोटो के साथ अटेंडेंस, आपकी मंज़ूरी, और सैलरी का हिसाब अपने आप।"),
  stat("Activity Log", "Kisne, kya, kab kiya", "एक्टिविटी लॉग में दिखता है, किसने क्या और कब किया।", small="USERS & ACCESS"),
  cta()]})
V.append({"id": "12", "slug": "udhaar-ka-hisaab", "title": "Udhaar ka hisaab, ek click mein", "scenes": [
  hook(["Udhaar diya,", "yaad hi nahi?"], "उधार दिया, और याद ही नहीं किसको कितना?"),
  shot("customer-add", "Credit limit set karo", "Limit paar? Counter par warning", "हर ग्राहक की क्रेडिट लिमिट तय कीजिए। लिमिट पार हो तो काउंटर पर चेतावनी।", ["cust_add"], url="nexcodpos.in/customers", notes=[(1164,688,"Credit limit",0,-330,-200)]),
  shot("customers", "Baaki paisa, ek click", "Cash, UPI, card, bank", "बकाया एक क्लिक में वसूलिए, कैश, यूपीआई या कार्ड से।", ["cust", "cust_r"], url="nexcodpos.in/customers", notes=[(700,170,"Baaki: ₹275"),(940,170,"Collect, ek click",1)]),
  shot("outstanding", "Kab se baaki?", "0-30, 31-60, 90+ din", "और देखिए कौन कितने दिन से बाकी है, सप्लायर का भी।", ["outst"], url="nexcodpos.in/accounts", notes=[(354,200,"Kab se baaki"),(564,364,"Supplier ka bhi")]),
  cta()]})
V.append({"id": "13", "slug": "55-reports-ek-jagah", "title": "55 reports, ek jagah", "scenes": [
  hook(["CA ko report chahiye,", "aap register dhoond rahe?"], "सीए को रिपोर्ट चाहिए, और आप रजिस्टर ढूँढ रहे हैं?"),
  shot("reports-sales", "55 report views", "Sales, stock, GST, accounts", "नेक्सकॉड पीओएस में पचपन रिपोर्ट, सेल्स, परचेज़, स्टॉक, जीएसटी और अकाउंट्स।", ["sales_rep"], url="nexcodpos.in/reports", notes=[(304,188,"Report chuno, date do")]),
  shot("reports-sales", "Din ka hisaab", "Day-End Z-Report", "दिन के आख़िर में ज़ेड रिपोर्ट, कैश, यूपीआई, उधार, ख़र्च, सब एक नज़र में।", ["zrep"], hl="zrep", url="nexcodpos.in/reports", notes=[(854,448,"Cash aaj"),(274,518,"Udhaar aaj")]),
  shot("daybook", "Tally export bhi", "Balance sheet, day book, trial balance", "बैलेंस शीट, डे बुक, और टैली में एक्सपोर्ट भी।", ["daybook"], url="nexcodpos.in/accounts", notes=[(1176,148,"Tally export")]),
  cta()]})
V.append({"id": "14", "slug": "counter-ki-speed", "title": "Counter ki speed", "scenes": [
  hook(["Line lambi,", "billing slow?"], "काउंटर पर लंबी लाइन, और बिलिंग धीमी?"),
  shot("keys", "Keyboard se billing", "F2 search · F9 print", "नेक्सकॉड पीओएस में पूरा बिल कीबोर्ड से। एफ़ टू सर्च, एफ़ नाइन प्रिंट।", ["keys", "keys_r"], url="nexcodpos.in/billing", notes=[(330,328,"F2: dawa search"),(290,492,"F9: print"),(640,428,"F1: asli cost",1)]),
  bullets("Aur speed", ["Ek saath 5 bill tabs", "Phone camera = barcode scanner", "Apne barcode labels print"], "एक साथ पाँच बिल खुले, फ़ोन का कैमरा बारकोड स्कैनर, और अपने बारकोड लेबल भी।"),
  shot("billing-items", "Bill tayyar", "Print karo ya WhatsApp", "और बिल तैयार, प्रिंट कीजिए या व्हाट्सऐप।", ["bill_total", "bill_print"], url="nexcodpos.in/billing", notes=[(720,740,"Total tayyar"),(1210,732,"Go & Print (F9)",1)]),
  cta()]})
V.append({"id": "15", "slug": "sirf-1299-saal", "title": "Sirf Rs 1,299 saal", "scenes": [
  hook(["Itna sab kuch,", "kitne ka?"], "इतना सब कुछ, कितने का?"),
  {"type": "price", "vo": "सिर्फ़ बारह सौ निन्यानवे रुपये साल का। यानी लगभग एक सौ आठ रुपये महीना।"},
  bullets("Har plan mein", ["Unlimited bills", "WhatsApp par bill", "Android app + staff login", "Saari reports"], "अनलिमिटेड बिल, व्हाट्सऐप बिल, मोबाइल ऐप, स्टाफ़ लॉगिन और सारी रिपोर्ट।"),
  stat("Auto-renew nahi", "7 din free trial · card nahi chahiye", "कोई ऑटो रिन्यू नहीं, और सात दिन का फ्री ट्रायल, बिना कार्ड।", small="NO HIDDEN CHARGES"),
  cta("भारत के चौबीस राज्यों के मेडिकल स्टोर नेक्सकॉड पीओएस पर बिलिंग कर रहे हैं। आज ही शुरू करें, नेक्सकॉड पीओएस डॉट इन।")]})

json.dump(V, open("campaign.json", "w"), ensure_ascii=False, indent=1)
print(len(V), "videos,", sum(len(v["scenes"]) for v in V), "scenes")
