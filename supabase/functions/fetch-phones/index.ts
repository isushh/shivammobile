import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Known old/discontinued series to reject (series-level keyword blocks)
const DISCONTINUED_KEYWORDS = [
  "galaxy s21", "galaxy s20", "galaxy s10", "galaxy note",
  "iphone 12", "iphone 11", "iphone x", "iphone se 1", "iphone 8", "iphone 7",
  "redmi note 12", "redmi note 11", "redmi note 10", "redmi note 9",
  "redmi 10", "redmi 9",
  "oneplus 11", "oneplus 10", "oneplus 9", "oneplus 8",
  "vivo v27", "vivo v25", "vivo t2",
  "realme 11", "realme 10", "realme 9",
  "oppo reno 11", "oppo reno 10",
  "poco x5", "poco x4", "poco m5",
  "pixel 8", "pixel 7", "pixel 6",
];

function isDiscontinued(name: string): boolean {
  const lower = name.toLowerCase();
  return DISCONTINUED_KEYWORDS.some(kw => lower.includes(kw));
}

function slugify(brand: string, name: string): string {
  return `${brand}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parsePriceNumeric(price: string): number {
  const digits = price.replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

// Fetch the mysmartprice latest page
async function fetchLatestPhones() {
  const url = "https://www.mysmartprice.com/mobile/pricelist/latest-mobile-phones.html";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-IN,en;q=0.9",
    }
  });

  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const html = await res.text();
  return html;
}

interface ParsedPhone {
  id: string;
  brand: string;
  name: string;
  price: string;
  price_numeric: number;
  image_url: string | null;
  source_url: string;
  is_new_launch: boolean;
  is_active: boolean;
  launched_at: string;
}

function parsePhones(html: string): ParsedPhone[] {
  const phones: ParsedPhone[] = [];
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Match each product card from the listing
  // mysmartprice wraps each phone in a div with class "product-item" or similar
  // Pattern: extract name, brand, price, image, link from each card block
  const cardRegex = /<(?:div|li)[^>]*class="[^"]*(?:prd-item|product-item|msp-prd|mob-prd|list-item)[^"]*"[^>]*>([\s\S]*?)(?=<(?:div|li)[^>]*class="[^"]*(?:prd-item|product-item|msp-prd|mob-prd|list-item)[^"]*"|<\/(?:ul|div|section)>)/gi;

  // Fallback: extract from anchor tags with model info
  // The site uses structured markup: h3/h4 for name, span for price
  const phoneBlocks = html.match(/<div[^>]*class="[^"]*prd[^"]*"[\s\S]*?<\/div>/gi) || [];

  // Primary extraction: JSON-LD or window data
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
  for (const block of jsonLdMatch) {
    try {
      const json = JSON.parse(block.replace(/<script[^>]*>/, "").replace("</script>", "").trim());
      if (json["@type"] === "ItemList" && json.itemListElement) {
        for (const item of json.itemListElement) {
          const nameRaw: string = item.name || item.item?.name || "";
          if (!nameRaw) continue;

          // Split brand from name (first word is usually brand)
          const parts = nameRaw.trim().split(" ");
          const brand = parts[0];
          const name = nameRaw.trim();

          if (isDiscontinued(name)) continue;

          const price = item.offers?.price
            ? `₹${parseInt(item.offers.price).toLocaleString("en-IN")}`
            : "";
          const price_numeric = item.offers?.price ? parseInt(item.offers.price) : 0;
          const image_url = item.image || item.item?.image || null;
          const source_url = item.url || item.item?.url || "";

          phones.push({
            id: slugify(brand, name),
            brand,
            name,
            price,
            price_numeric,
            image_url,
            source_url,
            is_new_launch: true,
            is_active: true,
            launched_at: today,
          });
        }
      }
    } catch (_) { /* skip malformed JSON */ }
  }

  // Regex-based fallback extraction from HTML if JSON-LD didn't yield results
  if (phones.length === 0) {
    // Extract name + price pairs using common mysmartprice patterns
    // Phone names appear in <a> tags with href containing /mobile/
    const linkPattern = /href="(https?:\/\/www\.mysmartprice\.com\/mobile\/[^"]+)"[^>]*>\s*(?:<[^>]+>)*([^<]{5,80})(?:<\/[^>]+>)*\s*<\/a>/gi;
    const pricePattern = /₹\s*([0-9,]+)/g;

    let linkMatch;
    const nameLinks: { name: string; url: string }[] = [];
    while ((linkMatch = linkPattern.exec(html)) !== null) {
      const url = linkMatch[1];
      const name = linkMatch[2].trim();
      if (name.length > 3 && !name.includes("http") && !isDiscontinued(name)) {
        nameLinks.push({ name, url });
      }
    }

    // Pair names with prices (approximate — same order in page)
    const priceMatches = [...html.matchAll(/₹\s*([0-9,]+)/g)];
    nameLinks.slice(0, 60).forEach((item, idx) => {
      const priceStr = priceMatches[idx] ? `₹${priceMatches[idx][1]}` : "";
      const priceNum = priceMatches[idx] ? parseInt(priceMatches[idx][1].replace(/,/g, ""), 10) : 0;
      const parts = item.name.split(" ");
      const brand = parts[0];

      phones.push({
        id: slugify(brand, item.name),
        brand,
        name: item.name,
        price: priceStr,
        price_numeric: priceNum,
        image_url: null,
        source_url: item.url,
        is_new_launch: true,
        is_active: true,
        launched_at: today,
      });
    });
  }

  // Deduplicate by id
  const seen = new Set<string>();
  return phones.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

async function upsertToSupabase(phones: ParsedPhone[]): Promise<{ inserted: number; skipped: string[] }> {
  const skipped: string[] = [];
  const toUpsert = phones.filter(p => {
    if (isDiscontinued(p.name)) {
      skipped.push(p.name);
      return false;
    }
    return true;
  });

  const res = await fetch(`${SUPABASE_URL}/rest/v1/phones`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Prefer": "resolution=merge-duplicates",
    },
    body: JSON.stringify(toUpsert.map(p => ({
      ...p,
      bestseller_rank: null, // mysmartprice "latest" is not ranked by sales
      ram: null,
      storage: null,
      camera: null,
      display: null,
      battery: null,
      os: null,
      color: null,
      emi: false,
      last_fetched: new Date().toISOString(),
    }))),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase upsert failed: ${err}`);
  }

  return { inserted: toUpsert.length, skipped };
}

// Validation report — check for older series that snuck in
async function validateResult(): Promise<string[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/phones?is_active=eq.true&select=name`,
    {
      headers: {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      }
    }
  );
  const rows: { name: string }[] = await res.json();
  const oldSeriesFound: string[] = [];
  for (const row of rows) {
    if (isDiscontinued(row.name)) {
      oldSeriesFound.push(row.name);
    }
  }
  return oldSeriesFound;
}

Deno.serve(async (req: Request) => {
  // Allow manual trigger via GET as well as cron POST
  try {
    console.log("[fetch-phones] Starting fetch from mysmartprice...");
    const html = await fetchLatestPhones();
    const phones = parsePhones(html);
    console.log(`[fetch-phones] Parsed ${phones.length} phones from page`);

    if (phones.length === 0) {
      return new Response(JSON.stringify({ error: "No phones parsed — site structure may have changed" }), {
        status: 422,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { inserted, skipped } = await upsertToSupabase(phones);
    console.log(`[fetch-phones] Inserted/updated ${inserted}, skipped ${skipped.length} old models`);

    // Validation pass — find any old models that slipped through
    const oldModelsInDb = await validateResult();
    if (oldModelsInDb.length > 0) {
      console.warn("[fetch-phones] WARNING — old series detected in DB:", oldModelsInDb);
      // Auto-deactivate them
      await fetch(`${SUPABASE_URL}/rest/v1/rpc/deactivate_old_phones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_SERVICE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({ names: oldModelsInDb }),
      });
    }

    return new Response(JSON.stringify({
      success: true,
      parsed: phones.length,
      inserted,
      skipped_old_models: skipped,
      old_models_deactivated: oldModelsInDb,
      fetched_at: new Date().toISOString(),
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("[fetch-phones] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
