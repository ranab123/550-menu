import React, { useState, useEffect } from 'react';
import './MenuItems.css';
import { fetchMenuData } from './services/menuService';

function MenuItems({ selectedDay, selectedMeal }) {
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedDay && selectedMeal) {
      loadMenuData(selectedDay, selectedMeal);
    }
  }, [selectedDay, selectedMeal]);

  const loadMenuData = async (day, meal) => {
    console.log('🔍 Loading menu data for:', { day, meal });
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchMenuData(day, meal);
      console.log('✅ Menu data received:', data);
      setMenuData(data);
    } catch (err) {
      console.error('💥 Error fetching menu:', err);
      setError(`Failed to load menu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="menu-items">
        <div className="loading">
          <img src={require('./gifs/banana.gif')} alt="Loading" className="loading-banana" />
          <p>Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="menu-items">
        <div className="error">
          <p>{error}</p>
          <button 
            onClick={() => loadMenuData(selectedDay, selectedMeal)}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!menuData || !menuData.categorizedItems || 
      (Object.values(menuData.categorizedItems).every(items => items.length === 0))) {
    // Extract day name from the format "DayName|Date|WeekOffset"
    const displayDay = selectedDay.includes('|') ? selectedDay.split('|')[0] : selectedDay;
    const displayDate = selectedDay.includes('|') ? selectedDay.split('|')[1] : menuData?.date;
    
    return (
      <div className="menu-items">
        <div className="no-menu">
          <p>{menuData?.message || `No menu available for ${displayDay} ${selectedMeal}`}</p>
          <p className="no-menu-date">{displayDate ? `Date: ${displayDate}` : ''}</p>
        </div>
      </div>
    );
  }

  const { categorizedItems } = menuData;

  return (
    <div className="menu-items">
      <div className="menu-content">
        {/* Mains Section */}
        {categorizedItems.mains.length > 0 && (
          <>
            <div className="menu-category-title">
              <span className="title-with-hyphens">mains</span>
            </div>
            <ul className="menu-list">
              {categorizedItems.mains.map((item, index) => (
                <li key={`main-${index}`} className="menu-item">
                  {item.charAt(0).toUpperCase() + item.slice(1).toLowerCase()}
                </li>
              ))}
            </ul>
          </>
        )}
        
        {/* Sides Section */}
        {categorizedItems.sides.length > 0 && (
          <>
            <div className="menu-category-title">
              <span className="title-with-hyphens">sides</span>
            </div>
            <ul className="menu-list">
              {categorizedItems.sides.map((item, index) => (
                <li key={`side-${index}`} className="menu-item">
                  {item.charAt(0).toUpperCase() + item.slice(1).toLowerCase()}
                </li>
              ))}
            </ul>
          </>
        )}
        
        {/* Dessert Section */}
        {categorizedItems.dessert.length > 0 && (
          <>
            <div className="menu-category-title">
              <span className="title-with-hyphens">dessert</span>
            </div>
            <ul className="menu-list">
              {categorizedItems.dessert.map((item, index) => (
                <li key={`dessert-${index}`} className="menu-item">
                  {item.charAt(0).toUpperCase() + item.slice(1).toLowerCase()}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

export default MenuItems;
