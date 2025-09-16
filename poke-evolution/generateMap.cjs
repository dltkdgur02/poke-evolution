const axios = require('axios');
const fs = require('fs');

async function generateKoreanNameMap() {
    try {
        console.log('Fetching all Pokémon species list...');
        const listResponse = await axios.get('https://pokeapi.co/api/v2/pokemon-species?limit=1100');
        const allSpecies = listResponse.data.results;

        const koreanNameMap = {};
        console.log(`Found ${allSpecies.length} species. Fetching details... This may take a moment.`);

        const detailPromises = allSpecies.map(species => axios.get(species.url));
        const detailResponses = await Promise.all(detailPromises);

        for (const response of detailResponses) {
            const speciesData = response.data;
            const koreanNameEntry = speciesData.names.find(n => n.language.name === 'ko');

            if (koreanNameEntry) {
                const koreanName = koreanNameEntry.name.toLowerCase();
                const englishName = speciesData.name.toLowerCase();
                koreanNameMap[koreanName] = englishName;
            }
        }

        fs.writeFileSync('src/koreanNameMap.json', JSON.stringify(koreanNameMap, null, 2));
        console.log('✅ Success! "src/koreanNameMap.json" has been created with all Pokémon names.');

    } catch (error) {
        console.error('❌ An error occurred:', error.message);
        console.error('Failed to generate the map. Please check your internet connection and try again.');
    }
}

generateKoreanNameMap();