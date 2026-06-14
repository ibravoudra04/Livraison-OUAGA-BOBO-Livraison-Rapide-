// Use native fetch

async function fetchEnv() {
  const url = 'https://www.livraisonrapide.app/';
  console.log(`Fetching ${url}...`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!res.ok) {
      console.error(`Failed to fetch: ${res.status} ${res.statusText}`);
      return;
    }
    
    const html = await res.text();
    console.log("HTML length:", html.length);
    console.log("HTML snippet:");
    console.log(html.substring(0, 1000));
    console.log("Searching for Supabase URLs...");
    
    // Find any supabase.co urls
    const supabaseUrlMatches = html.match(/https:\/\/[a-z0-9\-]+\.supabase\.co/gi);
    console.log("Supabase URLs found in HTML:", supabaseUrlMatches);
    
    // Let's search for NEXT_PUBLIC or keys
    const envMatches = html.match(/NEXT_PUBLIC_[A-Z_]+/g);
    console.log("NEXT_PUBLIC keys matched:", envMatches);

    // Let's search inside __NEXT_DATA__
    const nextDataIndex = html.indexOf('id="__NEXT_DATA__"');
    if (nextDataIndex !== -1) {
      console.log("Found __NEXT_DATA__! Extracting...");
      const endTag = html.indexOf('</script>', nextDataIndex);
      const jsonText = html.substring(html.indexOf('>', nextDataIndex) + 1, endTag);
      try {
        const nextData = JSON.parse(jsonText);
        console.log("Props & runtime variables in __NEXT_DATA__:");
        console.log(JSON.stringify(nextData.props, null, 2).substring(0, 1000));
        console.log("Runtime Env in __NEXT_DATA__:");
        console.log(nextData.runtimeEnv);
      } catch (e) {
        console.error("Failed to parse __NEXT_DATA__ JSON:", e.message);
      }
    } else {
      console.log("__NEXT_DATA__ script not found.");
    }
    
  } catch (err) {
    console.error("Error fetching page:", err.message);
  }
}

fetchEnv();
