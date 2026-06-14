async function findProductionSupabaseUrl() {
  const rootUrl = 'https://www.livraisonrapide.app';
  console.log(`Fetching root page: ${rootUrl}...`);
  try {
    const res = await fetch(rootUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!res.ok) {
      console.error(`Failed to fetch root: ${res.status} ${res.statusText}`);
      return;
    }
    
    const html = await res.text();
    console.log("Root page fetched. Finding script tags...");
    
    // Match any script src like /_next/static/chunks/...
    const scriptRegex = /src="(\/_next\/static\/chunks\/[^"]+\.js)"/g;
    let match;
    const scripts = [];
    while ((match = scriptRegex.exec(html)) !== null) {
      scripts.push(match[1]);
    }
    
    console.log(`Found ${scripts.length} Next.js scripts:`, scripts);
    
    for (const scriptSrc of scripts) {
      const scriptUrl = `${rootUrl}${scriptSrc}`;
      console.log(`Fetching script: ${scriptUrl}...`);
      const scriptRes = await fetch(scriptUrl);
      if (scriptRes.ok) {
        const js = await scriptRes.text();
        const supabaseUrlMatches = js.match(/https:\/\/[a-z0-9\-]+\.supabase\.co/gi);
        if (supabaseUrlMatches) {
          console.log(`\n🎉 Found Supabase URL in ${scriptSrc}:`);
          console.log(supabaseUrlMatches);
          
          // Also search for the publishable key starting with eyJ...
          const keyMatches = js.match(/eyJ[a-zA-Z0-9_\-\.]+/g);
          if (keyMatches) {
            console.log("Found JWT/Key candidates:");
            keyMatches.forEach(k => {
              if (k.length > 50) console.log(`  ${k.substring(0, 30)}...`);
            });
          }
          break; // found it!
        }
      }
    }
  } catch (err) {
    console.error("Error searching production bundles:", err.message);
  }
}

findProductionSupabaseUrl();
