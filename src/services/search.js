/**
 * Servicio de búsqueda en la web.
 * Soporta Tavily (default) y Brave Search.
 * Si no hay API key configurada, hace fallback a un comportamiento mock.
 */

export async function performWebSearch(query) {
  const apiKey = process.env.SEARCH_API_KEY;
  const provider = (process.env.SEARCH_PROVIDER || 'tavily').toLowerCase();

  console.log(`[Search Service] Buscando en la web usando "${provider}": "${query}"`);

  if (!apiKey) {
    console.warn('[Search Service] Advertencia: No se encontró la variable SEARCH_API_KEY. Usando resultados simulados (mock).');
    return getMockResults(query);
  }

  try {
    if (provider === 'brave') {
      return await searchWithBrave(query, apiKey);
    } else {
      // Por defecto, usar Tavily
      return await searchWithTavily(query, apiKey);
    }
  } catch (error) {
    console.error(`[Search Service] Error al realizar la búsqueda con ${provider}:`, error.message);
    console.log('[Search Service] Fallback a resultados simulados debido al error.');
    return getMockResults(query);
  }
}

async function searchWithTavily(query, apiKey) {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: apiKey,
      query: query,
      search_depth: 'basic',
      max_results: 5,
    }),
  });

  if (!response.ok) {
    throw new Error(`API de Tavily respondió con estado ${response.status}`);
  }

  const data = await response.json();
  if (!data.results || !Array.isArray(data.results)) {
    throw new Error('La respuesta de Tavily no contiene resultados válidos');
  }

  return data.results.map(r => ({
    title: r.title || 'Sin título',
    content: r.content || '',
    url: r.url || '#'
  }));
}

async function searchWithBrave(query, apiKey) {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'X-Subscription-Token': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`API de Brave respondió con estado ${response.status}`);
  }

  const data = await response.json();
  const results = data.web?.results || [];

  return results.slice(0, 5).map(r => ({
    title: r.title || 'Sin título',
    content: r.description || '',
    url: r.url || '#'
  }));
}

function getMockResults(query) {
  return [
    {
      title: `Resultado simulado para: ${query}`,
      content: `Este es un resumen simulado de información encontrada en internet sobre "${query}". Para obtener resultados reales, configura SEARCH_API_KEY en tu archivo .env.`,
      url: "https://example.com/search-result-1"
    },
    {
      title: "Información adicional simulada",
      content: "Aquí habría más detalles relevantes obtenidos de fuentes reales si el servicio de búsqueda estuviera configurado con una clave de API válida.",
      url: "https://example.com/search-result-2"
    }
  ];
}
