# Custom Fonts Directory

This directory is where you can add your custom font files for the 550 menu website.

## How to Add Custom Fonts

### 1. Add Font Files
Place your font files in the `src/fonts/` directory for proper webpack processing. Supported formats:
- `.woff2` (recommended - best compression and performance)
- `.woff` (good fallback)
- `.ttf` (fallback)
- `.otf` (fallback)

**Note**: Fonts in `src/fonts/` are processed by webpack and can be referenced with relative paths in CSS.

### 2. Update Font Definitions
Edit `src/fonts.css` to include your font files:

```css
@font-face {
  font-family: 'YourFontName';
  src: url('/fonts/your-font-file.woff2') format('woff2'),
       url('/fonts/your-font-file.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

### 3. Import Fonts
Add this line to your `src/App.js` or `src/index.js`:

```javascript
import './fonts.css';
```

### 4. Use Fonts in CSS
Update your CSS to use the custom fonts:

```css
.App-title {
  font-family: 'YourFontName', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

## Font Optimization Tips

1. **Use WOFF2 format** - Best compression and performance
2. **Include multiple formats** - For better browser compatibility
3. **Use font-display: swap** - Improves loading performance
4. **Preload important fonts** - Add to your HTML head if needed

## Example File Structure

```
public/fonts/
├── README.md
├── custom-title.woff2
├── custom-title.woff
├── custom-body.woff2
└── custom-body.woff
```

## Current Font Usage

- **Title**: Currently using system fonts, ready for custom font
- **Body Text**: Currently using system fonts, ready for custom font
- **Dropdowns**: Currently using system fonts, ready for custom font

Replace the system fonts with your custom fonts by updating the `font-family` properties in the CSS files.
