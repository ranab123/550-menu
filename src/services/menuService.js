// Google Sheets service for fetching menu data directly from frontend
const SHEET_ID = '1WcYZOEI-L_eIoiwYj_YzJxwhKne8_shwp6JFQ_zYlsU';
const GIDS = [
  '2063656107',
  '765770968', 
  '1494668008',
  '5594696',
  '537613215',
  '1771180049'
];

// Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

// Calculate the actual date for a given day name
function calculateDateForDay(dayName) {
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDayIndex = dayNames.indexOf(dayName);
  
  if (targetDayIndex === -1) {
    console.log(`❌ Invalid day name: ${dayName}`);
    return null;
  }
  
  // If it's the current day, return today's date
  const currentDayIndex = today.getDay();
  if (targetDayIndex === currentDayIndex) {
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const year = today.getFullYear();
    console.log(`📅 Backend date calculation for ${dayName}: today=${today.toDateString()}, result=${month}/${day}/${year} (today)`);
    return `${month}/${day}/${year}`;
  }
  
  // For future days, find the next occurrence
  let daysToAdd = 0;
  let targetDate = new Date(today);
  
  // Keep adding days until we find the target day of the week
  while (targetDate.getDay() !== targetDayIndex) {
    daysToAdd++;
    targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
  }
  
  // Format date as it appears in Google Sheets (M/D/YYYY)
  const month = targetDate.getMonth() + 1;
  const day = targetDate.getDate();
  const year = targetDate.getFullYear();
  
  console.log(`📅 Backend date calculation for ${dayName}: today=${today.toDateString()}, daysToAdd=${daysToAdd}, result=${month}/${day}/${year}`);
  
  return `${month}/${day}/${year}`;
}

export async function fetchMenuData(dayValue, meal) {
  console.log(`🔍 Fetching menu data for ${dayValue} ${meal}`);
  
  // Parse the day value which is in format: "DayName|Date|WeekOffset"
  let day, targetDate, weekOffset;
  
  if (dayValue.includes('|')) {
    // New format: "DayName|Date|WeekOffset"
    const parts = dayValue.split('|');
    day = parts[0];
    targetDate = parts[1];
    weekOffset = parseInt(parts[2] || '0');
    console.log(`📅 Parsed day value: day=${day}, date=${targetDate}, weekOffset=${weekOffset}`);
  } else {
    // Old format: just the day name
    day = dayValue;
    targetDate = calculateDateForDay(day);
    console.log(`📅 Calculated date for ${day}: ${targetDate}`);
  }
  
  // Check cache first
  const cacheKey = `${targetDate}-${meal.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('✅ Cache hit!');
    return cached.data;
  }
  
  console.log('🔄 Cache miss, fetching fresh data...');
  
  // Fetch all sheets first
  const allSheetData = [];
  for (let i = 0; i < GIDS.length; i++) {
    const gid = GIDS[i];
    console.log(`📋 Fetching sheet ${i + 1}/${GIDS.length} (GID: ${gid})`);
    
    try {
      const csvData = await fetchCSV(gid);
      console.log(`✅ Successfully fetched CSV data for sheet ${gid}, length: ${csvData.length}`);
      allSheetData.push({ gid, csvData });
    } catch (error) {
      console.log(`❌ Error fetching sheet ${gid}:`, error.message);
    }
  }
  
  console.log(`📊 Fetched ${allSheetData.length} sheets, now searching for date: ${targetDate}`);
  
  // Search all sheets for the exact date match
  for (const { gid, csvData } of allSheetData) {
    console.log(`🔍 Searching sheet ${gid} for date: ${targetDate}`);
    
    // Find the date row (row 5, index 4)
    const lines = csvData.split('\n');
    const dateRow = lines[4];
    
    if (!dateRow) {
      console.log(`❌ No date row found in sheet ${gid}`);
      continue;
    }
    
    console.log(`📅 Date row content: ${dateRow}`);
    
    // Parse CSV properly to handle quoted dates with commas
    const dates = parseCSVRow(dateRow);
    
    // Find the column index for the target date
    let targetColumnIndex = -1;
    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      if (date && isValidDate(date)) {
        console.log(`📅 Checking date ${date} (looking for ${targetDate})`);
        
        // Try exact match first
        if (date === targetDate) {
          targetColumnIndex = i;
          console.log(`✅ Found exact matching date at column ${i} in sheet ${gid}`);
          break;
        }
        
        // Try normalized date match (handle different formats)
        const normalizedDate = normalizeDate(date);
        const normalizedTarget = normalizeDate(targetDate);
        if (normalizedDate && normalizedTarget && normalizedDate === normalizedTarget) {
          targetColumnIndex = i;
          console.log(`✅ Found normalized matching date at column ${i} in sheet ${gid}`);
          break;
        }
      }
    }
    
    if (targetColumnIndex === -1) {
      console.log(`❌ No matching date found in sheet ${gid}`);
      continue;
    }
    
    // Extract menu items based on meal type
    const startRow = meal.toLowerCase() === 'lunch' ? 7 : 20; // Rows 8-18 for lunch, 21-31 for dinner
    const endRow = meal.toLowerCase() === 'lunch' ? 17 : 30;
    
    console.log(`🍽️ Extracting ${meal} items from rows ${startRow + 1} to ${endRow + 1} (column ${targetColumnIndex})`);
    
    // Define category row mappings
    const categoryMappings = {
      lunch: {
        mains: [8, 9, 15, 16, 17], // 0-indexed rows: 9, 10, 16, 17, 18
        sides: [7, 10, 11, 12, 14], // 0-indexed rows: 8, 11, 12, 13, 15
        dessert: [14] // 0-indexed row: 15
      },
      dinner: {
        mains: [21, 22, 23, 28, 29, 30], // 0-indexed rows: 22, 23, 24, 29, 30, 31
        sides: [20, 24, 25, 26], // 0-indexed rows: 21, 25, 26, 27
        dessert: [27] // 0-indexed row: 28
      }
    };
    
    // Initialize categorized items
    const categorizedItems = {
      mains: [],
      sides: [],
      dessert: []
    };
    
    // Process each row and categorize items
    for (let row = startRow; row <= endRow && row < lines.length; row++) {
      const line = lines[row];
      if (!line) continue;
      
      // Parse the line properly using our CSV parser
      const columns = parseCSVRow(line);
      const item = columns[targetColumnIndex];
      
      if (item && item !== '' && item !== 'Menu') {
        // Determine category based on row number
        const mealType = meal.toLowerCase();
        if (categoryMappings[mealType].mains.includes(row)) {
          categorizedItems.mains.push(item);
        } else if (categoryMappings[mealType].sides.includes(row)) {
          categorizedItems.sides.push(item);
        } else if (categoryMappings[mealType].dessert.includes(row)) {
          categorizedItems.dessert.push(item);
        }
      }
    }
    
    // Filter out empty items in each category
    Object.keys(categorizedItems).forEach(category => {
      categorizedItems[category] = categorizedItems[category].filter(item => item.length > 0);
    });
    
    // Count total items
    const totalItems = Object.values(categorizedItems).reduce((sum, items) => sum + items.length, 0);
    console.log(`📋 Found ${totalItems} menu items:`, categorizedItems);
    
    if (totalItems > 0) {
      const menuData = {
        day,
        meal,
        date: targetDate,
        categorizedItems
      };
      
      // Cache the result
      cache.set(cacheKey, {
        data: menuData,
        timestamp: Date.now()
      });
      
      return menuData;
    }
  }
  
  console.log(`😞 No menu found for ${day} ${meal} (${targetDate}) in any sheet`);
  return { 
    day,
    meal,
    date: targetDate,
    categorizedItems: {
      mains: [],
      sides: [],
      dessert: []
    }, 
    message: `No menu found for ${day}, ${targetDate}` 
  };
}

async function fetchCSV(gid) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  console.log(`📡 Fetching: ${url}`);
  
  const response = await fetch(url, {
    redirect: 'follow'
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.text();
}

// This function was previously used but has been replaced by inline parsing in fetchMenuData
// Keeping this comment for reference

function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

// Normalize different date formats to a standard format for comparison
function normalizeDate(dateString) {
  if (!dateString) return null;
  
  // Remove quotes and extra whitespace
  let cleanDate = dateString.replace(/['"]/g, '').trim();
  
  // Handle different formats
  let date;
  
  // Try parsing as-is first
  date = new Date(cleanDate);
  if (date instanceof Date && !isNaN(date)) {
    return formatDateForComparison(date);
  }
  
  // Handle "October 29, 2025" format
  if (cleanDate.includes('October') || cleanDate.includes('November') || cleanDate.includes('December') || 
      cleanDate.includes('January') || cleanDate.includes('February') || cleanDate.includes('March') ||
      cleanDate.includes('April') || cleanDate.includes('May') || cleanDate.includes('June') ||
      cleanDate.includes('July') || cleanDate.includes('August') || cleanDate.includes('September')) {
    date = new Date(cleanDate);
    if (date instanceof Date && !isNaN(date)) {
      return formatDateForComparison(date);
    }
  }
  
  // Handle "10/29/2025" format
  if (cleanDate.includes('/')) {
    date = new Date(cleanDate);
    if (date instanceof Date && !isNaN(date)) {
      return formatDateForComparison(date);
    }
  }
  
  return null;
}

// Format date for comparison (M/D/YYYY)
function formatDateForComparison(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

// Parse CSV row properly handling quoted fields with commas
function parseCSVRow(row) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(cleanField(current.trim()));
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(cleanField(current.trim()));
  
  return result;
}

// Clean up malformed CSV fields
function cleanField(field) {
  if (!field) return '';
  
  // Remove leading and trailing quotes
  let cleaned = field.replace(/^["']+|["']+$/g, '');
  
  // Remove any internal quotes that might be malformed
  cleaned = cleaned.replace(/["']/g, '');
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}
