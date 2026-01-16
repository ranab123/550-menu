import React, { useState, useEffect } from 'react';
import './MealPicker.css';
import CustomDropdown from './components/CustomDropdown';

function MealPicker({ onSelectionChange }) {
  const getDefaultMeal = () => {
    const currentHour = new Date().getHours();
    return currentHour < 14 ? 'Lunch' : 'Dinner'; // 2:00 PM = 14:00
  };

  // Generate dynamic day options starting with current day, excluding weekends, up to 7 days
  const getDayOptions = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayIndex = new Date().getDay();
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']; // Exclude weekends
    
    // If current day is weekend, start with next Monday and show 5 weekdays
    if (currentDayIndex === 0 || currentDayIndex === 6) { // Sunday or Saturday
      return weekdays.map(day => {
        const dateStr = calculateDateForDay(day);
        // Calculate week offset (0 = current week, 1 = next week, etc.)
        // For weekends, next Monday is either this week or next week
        const weekOffset = day === 'Monday' && currentDayIndex === 6 ? 0 : 1;
        return {
          value: `${day}|${dateStr}|${weekOffset}`, // Format: DayName|Date|WeekOffset
          label: `${day} ${dateStr}`
        };
      });
    }
    
    // Start with current day and add upcoming weekdays (up to 7 total days)
    const options = [];
    let daysAdded = 0;
    const maxDays = 7;
    const today = new Date();
    
    // Add current day first
    const currentDay = days[currentDayIndex];
    const todayFormatted = formatDate(today);
    options.push({
      value: `${currentDay}|${todayFormatted}|0`, // Format: DayName|Date|WeekOffset
      label: `${currentDay} ${todayFormatted}`
    });
    daysAdded++;
    
    // Add upcoming weekdays (Monday-Friday only) until we have 7 days total
    let daysAhead = 1; // Start with tomorrow
    
    while (daysAdded < maxDays) {
      // Calculate the date for the day ahead
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + daysAhead);
      const nextDayIndex = nextDate.getDay();
      
      // Skip weekends
      if (nextDayIndex !== 0 && nextDayIndex !== 6) {
        const nextDay = days[nextDayIndex];
        const nextDateFormatted = formatDate(nextDate);
        
        // Calculate week offset (0 = current week, 1 = next week, etc.)
        const weekOffset = Math.floor(daysAhead / 7);
        
        options.push({
          value: `${nextDay}|${nextDateFormatted}|${weekOffset}`, // Format: DayName|Date|WeekOffset
          label: `${nextDay} ${nextDateFormatted}`
        });
        daysAdded++;
      }
      
      daysAhead++; // Move to the next day
    }
    
    return options;
  };
  
  // Format a date as M/D/YYYY
  const formatDate = (date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Calculate the actual date for a given day name (same logic as backend)
  const calculateDateForDay = (dayName) => {
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayIndex = dayNames.indexOf(dayName);
    
    if (targetDayIndex === -1) {
      return '';
    }
    
    const currentDayIndex = today.getDay();
    let daysToAdd = targetDayIndex - currentDayIndex;
    
    // If the target day is in the past this week, add 7 days to get next week
    // BUT if it's the same day (daysToAdd = 0), don't add 7 days
    if (daysToAdd < 0) {
      daysToAdd += 7;
    }
    
    // Calculate target date using timestamp to avoid date manipulation issues
    const todayTimestamp = today.getTime();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const targetTimestamp = todayTimestamp + (daysToAdd * oneDayInMs);
    const targetDate = new Date(targetTimestamp);
    
    // Format date as M/D/YYYY
    const month = targetDate.getMonth() + 1;
    const day = targetDate.getDate();
    const year = targetDate.getFullYear();
    
    console.log(`📅 Date calculation for ${dayName}: today=${today.toDateString()}, daysToAdd=${daysToAdd}, result=${month}/${day}/${year}`);
    
    return `${month}/${day}/${year}`;
  };

  // Initialize with empty values, will be set in useEffect
  const [selectedMeal, setSelectedMeal] = useState('');
  const [selectedDay, setSelectedDay] = useState('');

  // Set default values on component mount
  useEffect(() => {
    const defaultMeal = getDefaultMeal();
    const dayOptions = getDayOptions();
    
    // Get the first option from the dropdown as default day
    const defaultDayOption = dayOptions.length > 0 ? dayOptions[0] : null;
    const defaultDayValue = defaultDayOption ? defaultDayOption.value : '';
    
    console.log('🎯 Default values set:', { meal: defaultMeal, day: defaultDayValue });
    console.log('📅 Available day options:', dayOptions.map(opt => `${opt.value} (${opt.label})`));
    
    // Update state and notify parent
    setSelectedMeal(defaultMeal);
    setSelectedDay(defaultDayValue);
    onSelectionChange(defaultMeal, defaultDayValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mealOptions = ['Lunch', 'Dinner'];
  const dayOptions = getDayOptions();

  const handleMealChange = (value) => {
    setSelectedMeal(value);
    onSelectionChange(value, selectedDay);
  };

  const handleDayChange = (value) => {
    setSelectedDay(value);
    onSelectionChange(selectedMeal, value);
  };

  return (
    <div className="meal-picker">
      <CustomDropdown 
        options={dayOptions}
        value={selectedDay}
        onChange={handleDayChange}
      />
      <div className="meal-selector">
        {mealOptions.map((meal) => (
          <button
            key={meal}
            className={`meal-option ${selectedMeal === meal ? 'selected' : ''}`}
            onClick={() => handleMealChange(meal)}
          >
            {meal.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

export default MealPicker;
