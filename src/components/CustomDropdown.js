import React, { useState, useRef, useEffect } from 'react';
import '../styles/CustomDropdown.css';

function CustomDropdown({ options, value, onChange, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuHeight, setMenuHeight] = useState(0);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  // Find the label to display for the current value
  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : 'Select an option';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Calculate menu height when dropdown opens
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const height = menuRef.current.scrollHeight;
      setMenuHeight(height);
    } else {
      setMenuHeight(0);
    }
  }, [isOpen, options]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleOptionClick = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div 
      className={`custom-dropdown-container ${isOpen ? 'open' : ''}`}
      style={{ marginBottom: isOpen ? `${menuHeight + 20}px` : '0' }}
    >
      {label && <label className="custom-dropdown-label">{label}</label>}
      
      <div className="custom-dropdown" ref={dropdownRef}>
        <button
          className="custom-dropdown-button"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="custom-dropdown-text">{displayLabel}</span>
        </button>

        {isOpen && (
          <ul className="custom-dropdown-menu" ref={menuRef}>
            {options
              .filter(option => {
                // Show all options unless the first option is the same as currently selected
                const firstOption = options[0];
                if (firstOption && firstOption.value === value) {
                  return option.value !== value; // Hide selected if it's the first option
                }
                return true; // Show all options if first option is different from selected
              })
              .map((option) => (
                <li key={option.value}>
                  <button
                    className={`custom-dropdown-option ${option.value === value ? 'selected' : ''}`}
                    onClick={() => handleOptionClick(option.value)}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default CustomDropdown;
