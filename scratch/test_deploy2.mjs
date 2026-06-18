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
  const html = await fetchUrl('https://livraisonrapide.app');
  const scriptRegex = /<script src="(\/_next\/static\/chunks\/app\/page-[^"]+\.js)"/g;
  let match;
  let found = false;
  
  while ((match = scriptRegex.exec(html)) !== null) {
    const scriptUrl = `https://livraisonrapide.app${match[1]}`;
    const scriptContent = await fetchUrl(scriptUrl);
    
    if (scriptContent.includes('livreurs_changes_')) {
      console.log('✅ livreurs_changes_ IS DEPLOYED!');
      found = true;
    }
  }
  
  if (!found) {
    console.log('❌ livreurs_changes_ IS NOT DEPLOYED!');
  }
}

checkDeployment();
