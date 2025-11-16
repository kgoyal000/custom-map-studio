# Professional Map Style Editor

A modern, professional map style editor built with Vue 3 and Tailwind CSS for creating custom Mapbox-compatible map styles based on the beachglass.json template.

## Features

### Core Functionality
- **Live Map Preview** - Real-time visualization of all style changes
- **All Layers Visible** - Access and edit every layer in your map style
- **Layer Search & Filter** - Find layers by name, type (Fill, Line, Background, Symbol)
- **Visual Property Editors** - Color pickers, sliders, and inputs for easy editing
- **Location Search** - Navigate to any location using Mapbox Geocoding
- **Quick Color Presets** - Bulk update colors for Background, Water, Buildings, and Roads
- **Export Custom Styles** - Download your edited style as a JSON file
- **Reset Functionality** - Revert to base style anytime

### Professional UI
- Clean, modern interface with Tailwind CSS
- Three-column layout: Controls | Live Preview | Layer Details
- Responsive design with smooth transitions
- Professional color scheme and typography
- Real-time map statistics (zoom level, coordinates)
- Toast notifications for user feedback

## Getting Started

### 1. Open the Editor

The editor can be opened directly in any modern browser. For best results, use a local web server:

**Using Python:**
```bash
cd /home/karan/Videos/city-map-mapbox-1/custom-studio
python3 -m http.server 8080
```

Then open: http://localhost:8080

**Using Node.js:**
```bash
npx serve .
```

### 2. Understanding the Interface

#### Left Sidebar - Controls
1. **Location Search** - Search for any location and fly to it on the map
2. **Quick Color Presets** - Bulk update common layer categories:
   - Background color
   - Water bodies color
   - Building fill color
   - Roads/streets color
3. **Layer Management**
   - Filter by type (All, Fill, Line, Background, Symbol)
   - Search layers by name or source-layer
   - Toggle layer visibility on/off
   - View layer metadata (type, min/max zoom)

#### Center - Live Map Preview
- Interactive map showing real-time changes
- Zoom level and center coordinates displayed
- Zoom controls (+/- buttons)
- Reset view button (returns to default view)

#### Right Sidebar - Layer Details
When you select a layer, you'll see:
- **Layer Information** - ID, type, source, source-layer
- **Paint Properties** - Visual properties that can be edited:
  - **Color Properties** - Color picker + text input for RGBA/hex values
  - **Opacity Properties** - Slider for adjusting transparency (0-100%)
  - **Width Properties** - Number input for line widths
  - **Complex Properties** - JSON display for advanced properties
- **Layout Properties** - Structural properties (read-only display)
- **Style Information** - Overall style metadata

### 3. Editing Layers

#### Quick Edits (Global Colors)
1. Use the **Quick Color Presets** in the left sidebar
2. Click any color swatch to pick a new color
3. Changes apply to ALL matching layers instantly

#### Individual Layer Edits
1. **Find the Layer**:
   - Scroll through the layers list
   - Use the filter tabs (All/Fill/Line/etc.)
   - Use the search box to find specific layers
2. **Select the Layer**: Click on it in the list
3. **Edit Properties** in the right sidebar:
   - Colors: Use color picker or type RGBA/hex values
   - Opacity: Drag the slider
   - Width: Type numeric values
4. **Toggle Visibility**: Use the green/gray toggle switch

#### Layer Types Explained
- **Fill** - Polygon fills (water, parks, buildings, landuse)
- **Line** - Roads, borders, building outlines, contours
- **Background** - Map background color
- **Symbol** - Text labels and icons

### 4. Search for Locations

1. Type a location name in the **Location Search** box
2. Click the search button or press Enter
3. Select from the results list
4. Map flies to that location automatically

### 5. Export Your Custom Style

1. Enter a name in the **Style Name** field at the top
2. Click **Export Style** button
3. Your custom style downloads as a JSON file
4. Use this file in any Mapbox GL JS application

### 6. Reset to Default

Click the **Reset** button in the header to restore the original beachglass.json style (confirms before resetting).

## Technical Details

### Technology Stack
- **Frontend Framework**: Vue 3 (Composition API)
- **CSS Framework**: Tailwind CSS (via CDN)
- **Map Library**: Mapbox GL JS v2.15.0
- **Base Style**: Beachglass (from Shopify CDN)
- **Tile Source**: OpenMapTiles

### Base Style URL
```
https://cdn.shopify.com/s/files/1/0977/3672/0709/files/beachglass.json?v=1763071937
```

### Mapbox Access Token
The editor uses a pre-configured Mapbox access token for:
- Map rendering
- Geocoding API (location search)

### Browser Compatibility
- Modern browsers with ES6 support
- Chrome/Edge: Recommended
- Firefox: Fully supported
- Safari: Fully supported

## How It Works

### Layer Property Detection
The editor automatically detects property types:
- **Color Properties**: Any property with "color" in the name
- **Opacity Properties**: Any property with "opacity" in the name
- **Width Properties**: Any property with "width" in the name

### Simple vs Complex Properties
- **Simple Properties**: Direct values (colors, numbers) - Editable with UI controls
- **Complex Properties**: Expressions, interpolations, arrays - Displayed as JSON

### Real-time Updates
When you change any property:
1. The layer object is updated
2. The map style is refreshed
3. The last modified timestamp updates
4. A success notification appears

## Common Tasks

### Change Water Color
1. **Quick Method**: Use "Water" preset in Quick Color Presets
2. **Precise Method**:
   - Search for "water" in layer search
   - Select "Water" layer
   - Edit fill-color in right sidebar

### Change Building Colors
1. **Quick Method**: Use "Buildings" preset
2. **Individual Buildings**:
   - Search for "building"
   - Select "Buildings Fill" for fill color
   - Select "Buildings" (line) for outline color

### Change Road Colors
1. **Quick Method**: Use "Roads" preset (updates all roads)
2. **Specific Road Types**:
   - Search for road type (e.g., "motorway", "street")
   - Select the specific layer
   - Edit line-color property

### Hide/Show Specific Features
1. Find the layer (e.g., "rails" for railways)
2. Click the toggle switch to hide/show
3. Layer visibility updates instantly

### Adjust Transparency
1. Select any layer with fill or line
2. Find the opacity property in Paint Properties
3. Drag the slider (0% = invisible, 100% = opaque)

### Export for Production
1. Name your style (e.g., "ocean-theme")
2. Click Export Style
3. Use the downloaded JSON in your application:
```javascript
const map = new mapboxgl.Map({
    container: 'map',
    style: './ocean-theme.json', // Your exported style
    center: [lng, lat],
    zoom: 10
});
```

## Advanced Tips

### Complex Property Expressions
Some properties use Mapbox expressions for zoom-based interpolation:
```json
{
  "line-width": [
    "interpolate",
    ["exponential", 1.4],
    ["zoom"],
    13, 0.5,
    14, 0.8,
    16, 1.5
  ]
}
```
These are displayed as JSON. To edit, you can:
1. Export the style
2. Edit the JSON manually
3. Re-import by modifying the baseStyleUrl in script.js

### Filter Expressions
Layer filters control which features are displayed. These are shown as JSON in the layer details.

### Layer Ordering
Layers render in order (first = bottom, last = top). The editor preserves layer order. To change order, edit the exported JSON manually.

## Troubleshooting

### Map Doesn't Load
- Check browser console (F12) for errors
- Ensure internet connection (loads from CDN)
- Try hard refresh (Ctrl+Shift+R)

### Changes Don't Appear
- Verify layer is visible (toggle is green)
- Check zoom level (some layers only show at certain zooms)
- Ensure you're editing the right property type

### Location Search Fails
- Check internet connection
- Verify Mapbox access token is valid
- Try different search terms

### Export Doesn't Work
- Check if popups are blocked
- Try a different browser
- Check browser console for errors

### Colors Look Different
- Some properties use expressions, not simple colors
- Complex color expressions show as JSON
- Use simple RGBA format for best results

## Performance Notes

- The editor loads all layers (no filtering for performance)
- Map refreshes on every style change (real-time preview)
- Large styles may take a moment to export
- Location search limited to 5 results

## Browser Developer Tools

For advanced debugging, open browser console (F12):
- Check for errors in Console tab
- Inspect Vue component state
- View network requests
- Debug Mapbox GL JS warnings

## File Structure

```
custom-studio/
├── index.html          # Vue 3 + Tailwind UI
├── script.js           # Vue app logic
└── README.md           # This file
```

## Support

For issues or questions:
1. Check browser console (F12) for error messages
2. Verify all CDN resources are loading
3. Test with different browsers
4. Review Mapbox GL JS documentation

## Credits

- **Mapbox GL JS** - Map rendering
- **Vue 3** - Reactive UI framework
- **Tailwind CSS** - Utility-first CSS
- **OpenMapTiles** - Vector tile schema
- **Beachglass Style** - Base map style

---

**Version**: 2.0 (Professional Edition)
**Last Updated**: 2025
