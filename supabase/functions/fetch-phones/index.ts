import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DISCONTINUED_KEYWORDS = [
  "galaxy s21","galaxy s20","galaxy s10","galaxy s9","galaxy s8","galaxy note",
  "iphone 12","iphone 11","iphone xr","iphone xs","iphone x ","iphone se 1",
  "iphone 8","iphone 7","iphone 6",
  "redmi note 12","redmi note 11","redmi note 10","redmi note 9","redmi note 8",
  "redmi 10","redmi 9","redmi 8",
  "oneplus 11","oneplus 10","oneplus 9","oneplus 8","oneplus 7","oneplus 6",
  "vivo v27","vivo v25","vivo v23","vivo t2","vivo y75","vivo y73",
  "realme 11","realme 10","realme 9","realme 8","realme 7","realme 6",
  "oppo reno 11","oppo reno 10","oppo reno 8","oppo a57 2022","oppo a77",
  "poco x5","poco x4","poco x3","poco m5","poco m4","poco m3",
  "pixel 8","pixel 7","pixel 6","pixel 5","pixel 4",
  "moto g82","moto g72","moto g62","moto g52","moto g42",
  "nokia g21","nokia g11","nokia c21","nokia c12",
];

function isDiscontinued(name: string): boolean {
  const lower = name.toLowerCase();
  return DISCONTINUED_KEYWORDS.some(kw => lower.includes(kw));
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function extractBrand(name: string): string {
  const known = ["Apple","Samsung","OnePlus","Vivo","Xiaomi","Redmi","POCO","OPPO","Realme",
    "Google","Motorola","Nothing","iQOO","Nokia","Infinix","Tecno","Lava","Micromax","Honor","Huawei","Sony","Asus"];
  for (const b of known) {
    if (name.toLowerCase().startsWith(b.toLowerCase())) return b;
  }
  return name.split(" ")[0];
}

interface ParsedPhone {
  id: string; brand: string; name: string;
  price: string; price_numeric: number;
  image_url: string | null; source_url: string;
  is_new_launch: boolean; is_active: boolean;
  launched_at: string; bestseller_rank: null;
  ram: null; storage: null; camera: null;
  display: null; battery: null; os: null;
  color: null; emi: boolean; last_fetched: string;
}

// Fetch one page from mysmartprice latest list
async function fetchPage(pageNum: number): Promise<{ phones: ParsedPhone[]; hasMore: boolean }> {
  const today = new Date().toISOString().split("T")[0];
  const phones: ParsedPhone[] = [];

  // MySmartPrice uses query params for pagination on the listing page
  const url = pageNum === 1
    ? "https://www.mysmartprice.com/mobile/pricelist/latest-mobile-phones.html"
    : `https://www.mysmartprice.com/mobile/pricelist/latest-mobile-phones.html?page=${pageNum}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-IN,en;q=0.9",
      "Referer": "https://www.mysmartprice.com/",
    }
  });

  if (!res.ok) return { phones: [], hasMore: false };
  const html = await res.text();

  // Try JSON-LD first
  const jsonLdBlocks = html.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi) || [];
  let foundViaJsonLd = false;
  for (const block of jsonLdBlocks) {
    try {
      const raw = block.replace(/<script[^>]*>/, "").replace("</script>", "").trim();
      const json = JSON.parse(raw);
      const items = json.itemListElement || [];
      for (const item of items) {
        const nameRaw: string = (item.name || item.item?.name || "").trim();
        if (!nameRaw || nameRaw.length < 3 || isDiscontinued(nameRaw)) continue;
        const brand = extractBrand(nameRaw);
        const priceRaw = item.offers?.price || item.item?.offers?.price || "";
        const priceNum = priceRaw ? parseInt(String(priceRaw).replace(/[^0-9]/g, ""), 10) : 0;
        const price = priceNum ? `\u20b9${priceNum.toLocaleString("en-IN")}` : "";
        phones.push({
          id: slugify(nameRaw), brand, name: nameRaw, price, price_numeric: priceNum,
          image_url: item.image || null,
          source_url: item.url || item.item?.url || "",
          is_new_launch: true, is_active: true, launched_at: today,
          bestseller_rank: null, ram: null, storage: null, camera: null,
          display: null, battery: null, os: null, color: null, emi: false,
          last_fetched: new Date().toISOString(),
        });
        foundViaJsonLd = true;
      }
    } catch (_) { /* skip */ }
  }

  // Regex fallback — extract from anchor tags
  if (!foundViaJsonLd || phones.length < 5) {
    const linkRe = /href="(https?:\/\/www\.mysmartprice\.com\/(?:mob|mobile)\/[^"]+)"[^>]*>\s*(?:<[^>]+>)*([A-Za-z][^<]{3,70})(?:<\/[^>]+>)*\s*<\/a>/gi;
    const priceRe = /\u20b9\s*([0-9,]+)/g;
    const priceMatches = [...html.matchAll(priceRe)];
    let pidx = 0; let m;
    while ((m = linkRe.exec(html)) !== null) {
      const name = m[2].trim();
      if (name.length < 4 || isDiscontinued(name) || /\b(view|buy|compare|review|specs?|price)\b/i.test(name)) continue;
      const brand = extractBrand(name);
      const priceStr = priceMatches[pidx] ? `\u20b9${priceMatches[pidx][1]}` : "";
      const priceNum = priceMatches[pidx] ? parseInt(priceMatches[pidx][1].replace(/,/g, ""), 10) : 0;
      phones.push({
        id: slugify(name), brand, name, price: priceStr, price_numeric: priceNum,
        image_url: null, source_url: m[1],
        is_new_launch: true, is_active: true, launched_at: today,
        bestseller_rank: null, ram: null, storage: null, camera: null,
        display: null, battery: null, os: null, color: null, emi: false,
        last_fetched: new Date().toISOString(),
      });
      pidx++;
    }
  }

  // Check if there's a next page link
  const hasMore = html.includes(`page=${pageNum + 1}`) || html.includes("Next") || html.includes("load-more");

  return { phones, hasMore };
}

async function fetchAllPages(maxPages = 8): Promise<ParsedPhone[]> {
  const all: ParsedPhone[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= maxPages; page++) {
    console.log(`[fetch-phones] Fetching page ${page}...`);
    const { phones, hasMore } = await fetchPage(page);

    let newCount = 0;
    for (const p of phones) {
      if (!seen.has(p.id)) { seen.add(p.id); all.push(p); newCount++; }
    }
    console.log(`[fetch-phones] Page ${page}: ${phones.length} parsed, ${newCount} new`);

    // Stop if no new phones found on this page (reached end)
    if (newCount === 0 || (!hasMore && page > 1)) break;

    // Polite delay between pages
    await new Promise(r => setTimeout(r, 800));
  }
  return all;
}

async function upsertPhones(phones: ParsedPhone[]) {
  const valid = phones.filter(p => !isDiscontinued(p.name));
  const skipped = phones.filter(p => isDiscontinued(p.name)).map(p => p.name);
  if (valid.length === 0) return { inserted: 0, skipped };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/phones`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Prefer": "resolution=merge-duplicates",
    },
    body: JSON.stringify(valid),
  });
  if (!res.ok) throw new Error(`Upsert failed: ${await res.text()}`);
  return { inserted: valid.length, skipped };
}

async function validateAndDeactivateOld(): Promise<string[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/phones?is_active=eq.true&select=id,name`, {
    headers: { "apikey": SUPABASE_SERVICE_KEY, "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}` }
  });
  const rows: { id: string; name: string }[] = await res.json();
  const oldOnes = rows.filter(r => isDiscontinued(r.name));
  if (oldOnes.length > 0) {
    const ids = oldOnes.map(r => `"${r.id}"`).join(",");
    await fetch(`${SUPABASE_URL}/rest/v1/phones?id=in.(${ids})`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ is_active: false }),
    });
  }
  return oldOnes.map(r => r.name);
}

Deno.serve(async (_req: Request) => {
  try {
    console.log("[fetch-phones] Starting multi-page fetch from mysmartprice...");
    const allPhones = await fetchAllPages(8);
    console.log(`[fetch-phones] Total parsed across all pages: ${allPhones.length}`);

    if (allPhones.length === 0) {
      return new Response(JSON.stringify({ error: "No phones parsed — site may have changed structure" }), {
        status: 422, headers: { "Content-Type": "application/json" }
      });
    }

    const { inserted, skipped } = await upsertPhones(allPhones);
    const deactivated = await validateAndDeactivateOld();

    return new Response(JSON.stringify({
      success: true,
      pages_fetched: Math.ceil(allPhones.length / 20),
      total_parsed: allPhones.length,
      inserted,
      skipped_old: skipped,
      deactivated_old: deactivated,
      fetched_at: new Date().toISOString(),
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
});
