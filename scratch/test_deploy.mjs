import https from 'https';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function checkDeployment() {
  console.log('Fetching main page...');
  const html = await fetchUrl('https://livraisonrapide.app');
  
  // Find script tags
  const scriptRegex = /<script src="(\/_next\/static\/chunks\/app\/page-[^"]+\.js)"/g;
  let match;
  let found = false;
  
  while ((match = scriptRegex.exec(html)) !== null) {
    const scriptUrl = `https://livraisonrapide.app${match[1]}`;
    console.log('Fetching chunk:', scriptUrl);
    const scriptContent = await fetchUrl(scriptUrl);
    
    if (scriptContent.includes('plateforme_visites')) {
      console.log('✅ NEW CODE IS DEPLOYED! (Found plateforme_visites)');
      found = true;
    }
  }
  
  if (!found) {
    console.log('❌ NEW CODE IS NOT DEPLOYED! (Could not find plateforme_visites in chunks)');
  }
}

checkDeployment();
