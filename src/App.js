import React, { useState } from 'react';
import './App.css';
import './fonts.css';
import MealPicker from './MealPicker';
import MenuItems from './MenuItems';
import KudosInput from './KudosInput';
import { Analytics } from "@vercel/analytics/react"

function App() {
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMeal, setSelectedMeal] = useState('');

  const handleSelectionChange = (meal, day) => {
    console.log('🔄 Selection changed:', { meal, day });
    setSelectedMeal(meal);
    setSelectedDay(day);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="App-title-container">
          <div className="App-title">550 menu</div>
        </div>
        <div className="burger-gif-container">
          <img 
            src={require('./gifs/burger.gif')} 
            alt="Burger animation" 
            className="burger-gif"
          />
        </div>
        <MealPicker onSelectionChange={handleSelectionChange} />
        <MenuItems selectedDay={selectedDay} selectedMeal={selectedMeal} />
        <KudosInput />
      </header>
      <Analytics />
    </div>
  );
}

export default App;
