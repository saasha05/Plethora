// watchmode-integration.js
const axios = require('axios');
const mongoose = require('mongoose');
const Media = require('../models/media'); // Assuming you've moved models to separate files

// Replace with your actual Watchmode API key
const WATCHMODE_API_KEY = process.env.WATCHMODE_API_KEY
const BASE_URL = 'https://api.watchmode.com/v1';

// Map Watchmode source IDs to platform names in our system
const PLATFORM_MAPPING = {
  203: 'Netflix',
  157: 'Hulu',
  26: 'Amazon Prime',
  387: 'HBO Max',
  371: 'Apple TV+',
  372: 'Disney+',
  444: 'Paramount+',
  389: 'Peacock',
  // Add more as needed
};

// Get platform names from source IDs
function mapSourcesToPlatforms(sources) {
  if (!sources) return [];
  return sources
    .map(sourceId => PLATFORM_MAPPING[sourceId])
    .filter(platform => platform !== undefined);
}

// Map Watchmode genres to our format
function mapGenres(genres) {
  if (!genres) return [];
  // Remove any numbers or IDs that might be in the genre strings
  return genres.map(genre => genre.replace(/^\d+\s*/, '').trim());
}

// Fetch title details from Watchmode
async function fetchTitleDetails(titleId, type) {
  try {
    const response = await axios.get(`${BASE_URL}/title/${titleId}/details/`, {
      params: {
        apiKey: WATCHMODE_API_KEY,
        append_to_response: 'sources'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching details for ${titleId}:`, error.message);
    return null;
  }
}

// Search for titles on Watchmode
async function searchTitles(query, types = ['movie', 'tv']) {
  try {
    const response = await axios.get(`${BASE_URL}/search/`, {
      params: {
        apiKey: WATCHMODE_API_KEY,
        search_field: 'name',
        search_value: query,
        types: types.join(',')
      }
    });
    
    return response.data.titles || [];
  } catch (error) {
    console.error(`Error searching for "${query}":`, error.message);
    return [];
  }
}

// Get all titles from a specific source/platform
async function getTitlesBySource(sourceId, type, page = 1) {
  try {
    const response = await axios.get(`${BASE_URL}/list-titles/`, {
      params: {
        apiKey: WATCHMODE_API_KEY,
        source_ids: sourceId,
        types: type,
        page,
        limit: 250 // Maximum allowed by API
      }
    });
    
    return {
      titles: response.data.titles || [],
      totalPages: response.data.total_pages || 1
    };
  } catch (error) {
    console.error(`Error fetching titles for source ${sourceId}:`, error.message);
    return { titles: [], totalPages: 0 };
  }
}

// Convert Watchmode title to our Media format
function convertToMediaFormat(watchmodeTitle, details) {
  // Basic mapping from search results
  const media = {
    title: watchmodeTitle.title,
    type: watchmodeTitle.type === 'movie' ? 'movie' : 'tv',
    watchmodeId: watchmodeTitle.id,
    releaseYear: watchmodeTitle.year,
    imdbId: watchmodeTitle.imdb_id,
    tmdbId: watchmodeTitle.tmdb_id
  };
  
  // Add details if available
  if (details) {
    media.genres = mapGenres(details.genres);
    media.platforms = mapSourcesToPlatforms(details.sources?.map(s => s.source_id));
    media.imdbRating = details.user_rating;
    media.languages = details.original_language ? [details.original_language] : [];
    media.poster = details.poster;
    media.backdrop = details.backdrop;
    
    if (media.type === 'movie') {
      media.length = details.runtime_minutes || 0;
    } else {
      // For TV shows, set length to number of episodes if available
      media.length = details.episode_count || 0;
    }
  }
  
  return media;
}

// Update or create a media item in database
async function upsertMedia(mediaData) {
  try {
    const filter = { 
      $or: [
        { watchmodeId: mediaData.watchmodeId },
        { 
          title: mediaData.title,
          type: mediaData.type,
          releaseYear: mediaData.releaseYear
        }
      ]
    };
    
    const options = { 
      upsert: true, 
      new: true,
      setDefaultsOnInsert: true
    };
    
    const result = await Media.findOneAndUpdate(filter, mediaData, options);
    return result;
  } catch (error) {
    console.error(`Error upserting media ${mediaData.title}:`, error.message);
    return null;
  }
}

// Sync all titles from a specific platform
async function syncPlatformTitles(platformName, limit = null) {
  // Find the source ID for the platform
  const sourceId = Object.keys(PLATFORM_MAPPING).find(
    key => PLATFORM_MAPPING[key] === platformName
  );
  
  if (!sourceId) {
    console.error(`Unknown platform: ${platformName}`);
    return { added: 0, updated: 0, error: 'Unknown platform' };
  }
  
  let stats = { added: 0, updated: 0 };
  let processed = 0;
  
  // Process movies
  let page = 1;
  let hasMorePages = true;
  
  while (hasMorePages && (!limit || processed < limit)) {
    const { titles, totalPages } = await getTitlesBySource(sourceId, 'movie', page);
    
    for (const title of titles) {
      if (limit && processed >= limit) break;
      
      const details = await fetchTitleDetails(title.id, 'movie');
      
      if (details) {
        const mediaData = convertToMediaFormat(title, details);
        const result = await upsertMedia(mediaData);
        
        if (result.isNew) {
          stats.added++;
        } else {
          stats.updated++;
        }
      }
      
      processed++;
    }
    
    page++;
    hasMorePages = page <= totalPages;
  }
  
  // Reset for TV shows
  page = 1;
  hasMorePages = true;
  
  while (hasMorePages && (!limit || processed < limit)) {
    const { titles, totalPages } = await getTitlesBySource(sourceId, 'tv', page);
    
    for (const title of titles) {
      if (limit && processed >= limit) break;
      
      const details = await fetchTitleDetails(title.id, 'tv');
      
      if (details) {
        const mediaData = convertToMediaFormat(title, details);
        const result = await upsertMedia(mediaData);
        
        if (result.isNew) {
          stats.added++;
        } else {
          stats.updated++;
        }
      }
      
      processed++;
    }
    
    page++;
    hasMorePages = page <= totalPages;
  }
  
  return stats;
}

// Search and add a single title
async function searchAndAddTitle(query, type = null) {
  const types = type ? [type] : ['movie', 'tv'];
  const searchResults = await searchTitles(query, types);
  
  if (searchResults.length === 0) {
    return { error: 'No results found' };
  }
  
  // Get details for the first result
  const firstResult = searchResults[0];
  const details = await fetchTitleDetails(firstResult.id, firstResult.type);
  
  if (!details) {
    return { error: 'Could not fetch details' };
  }
  
  const mediaData = convertToMediaFormat(firstResult, details);
  const result = await upsertMedia(mediaData);
  
  return { 
    success: true, 
    media: result, 
    isNew: result.isNew 
  };
}

// Update platforms for all existing media
async function updateAllMediaPlatforms() {
  const allMedia = await Media.find();
  let updated = 0;
  
  for (const media of allMedia) {
    // Skip if no external IDs
    if (!media.watchmodeId && !media.imdbId && !media.tmdbId) {
      continue;
    }
    
    let searchParam = {};
    let searchValue = '';
    
    if (media.watchmodeId) {
      searchParam = { id: media.watchmodeId };
    } else if (media.imdbId) {
      searchParam = { imdb_id: media.imdbId };
    } else if (media.tmdbId) {
      searchParam = { tmdb_id: media.tmdbId };
    }
    
    try {
      // If we have a Watchmode ID, fetch directly
      if (media.watchmodeId) {
        const details = await fetchTitleDetails(media.watchmodeId, media.type);
        if (details && details.sources) {
          media.platforms = mapSourcesToPlatforms(details.sources.map(s => s.source_id));
          await media.save();
          updated++;
        }
      } 
      // Otherwise search by other IDs
      else {
        const searchField = Object.keys(searchParam)[0];
        const searchValue = searchParam[searchField];
        
        const response = await axios.get(`${BASE_URL}/search/`, {
          params: {
            apiKey: WATCHMODE_API_KEY,
            search_field: searchField,
            search_value: searchValue
          }
        });
        
        if (response.data.titles && response.data.titles.length > 0) {
          const watchmodeId = response.data.titles[0].id;
          const details = await fetchTitleDetails(watchmodeId, media.type);
          
          if (details && details.sources) {
            media.watchmodeId = watchmodeId;
            media.platforms = mapSourcesToPlatforms(details.sources.map(s => s.source_id));
            await media.save();
            updated++;
          }
        }
      }
    } catch (error) {
      console.error(`Error updating platforms for ${media.title}:`, error.message);
    }
  }
  
  return { updated };
}

// Sync new releases (from last N days)
async function syncNewReleases(days = 30) {
  const platforms = Object.values(PLATFORM_MAPPING);
  let stats = { added: 0, updated: 0 };
  
  for (const platform of platforms) {
    try {
      const platformStats = await syncPlatformTitles(platform, 100);
      stats.added += platformStats.added;
      stats.updated += platformStats.updated;
    } catch (error) {
      console.error(`Error syncing new releases for ${platform}:`, error);
    }
  }
  
  return stats;
}

// Export functions for use in API routes
module.exports = {
  searchAndAddTitle,
  syncPlatformTitles,
  updateAllMediaPlatforms,
  syncNewReleases,
  PLATFORM_MAPPING
};
