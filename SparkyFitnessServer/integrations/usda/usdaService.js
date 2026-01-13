const { log } = require('../../config/logging');
let fetch;
import('node-fetch').then(module => {
  fetch = module.default;
});

const USDA_API_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

async function searchUsdaFoods(query, apiKey) {
  try {
    const searchUrl = `${USDA_API_BASE_URL}/foods/search?query=${encodeURIComponent(query)}&api_key=${apiKey}`;
    const response = await fetch(searchUrl, { method: 'GET' });
    log('debug', 'USDA API Search Response Status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      log('error', "USDA Food Search API error:", errorText);
      throw new Error(`USDA API error: ${errorText}`);
    }
    const data = await response.json();
    log('debug', 'USDA API Search Response Data:', data);
    return data;
  } catch (error) {
    log('error', `Error searching USDA foods with query "${query}" in usdaService:`, error);
    throw error;
  }
}

async function getUsdaFoodDetails(fdcId, apiKey) {
  try {
    const detailsUrl = `${USDA_API_BASE_URL}/food/${fdcId}?api_key=${apiKey}`;
    const response = await fetch(detailsUrl, { method: 'GET' });
    log('debug', 'USDA API Details Response Status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      log('error', "USDA Food Details API error:", errorText);
      throw new Error(`USDA API error: ${errorText}`);
    }
    const data = await response.json();
    log('debug', 'USDA API Details Response Data:', data);
    
    if (data.dataType === 'Foundation') {
      log('debug', `Foundation food detected (FDC ID: ${fdcId}), fetching full details with foodPortions`);
      const fullDetailsUrl = `${USDA_API_BASE_URL}/foods?fdcIds=${fdcId}&format=full&api_key=${apiKey}`;
      const fullResponse = await fetch(fullDetailsUrl, { method: 'GET' });
      
      if (!fullResponse.ok) {
        const errorText = await fullResponse.text();
        log('error', "USDA Full Food Details API error:", errorText);
        // Fall back to basic data if full details fail
        return data;
      }
      
      const fullData = await fullResponse.json();
      log('debug', 'USDA API Full Details Response:', fullData);
      
      if (fullData && fullData.length > 0 && fullData[0].foodPortions && fullData[0].foodPortions.length > 0) {
        // Find the best portion
        const portions = fullData[0].foodPortions
          .filter(p => p.measureUnit?.name !== 'RACC')
          .sort((a, b) => (b.dataPoints || 0) - (a.dataPoints || 0));
        
        if (portions.length > 0) {
          const bestPortion = portions[0];
          const gramWeight = bestPortion.gramWeight;
          const servingSize = bestPortion.amount || 1;
          const servingUnit = bestPortion.measureUnit?.name || bestPortion.modifier || 'serving';
          
          log('debug', `Foundation food portion found: ${servingSize} ${servingUnit} = ${gramWeight}g`);
          
          // Scale nutrients from 100g to actual serving size
          const scaleFactor = gramWeight / 100;
          
          const scaledNutrients = data.foodNutrients?.map(nutrient => ({
            ...nutrient,
            amount: nutrient.amount ? nutrient.amount * scaleFactor : nutrient.amount
          }));
          
          // Return scaled nutrients and serving info
          return {
            ...data,
            foodNutrients: scaledNutrients,
            servingSize: servingSize,
            servingSizeUnit: servingUnit,
            gramWeight: gramWeight,
            isScaled: true,
            scaleFactor: scaleFactor
          };
        }
      }
      
      log('debug', 'No suitable foodPortions found, using default 100g serving');
      // If no portions found, default to 100g
      return {
        ...data,
        servingSize: 100,
        servingSizeUnit: 'g',
        isScaled: false
      };
    }
    
    return data;
  } catch (error) {
    log('error', `Error fetching USDA food details for FDC ID "${fdcId}" in usdaService:`, error);
    throw error;
  }
}

module.exports = {
  searchUsdaFoods,
  getUsdaFoodDetails,
};