// Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiZG9kbzc5MSIsImEiOiJjbWZianUyejEwNDNsMmpxdzBjZmZnbndtIn0.t5a9KzottI8eUYz396kfbQ';

const { createApp } = Vue;

createApp({
    data() {
        return {
            // Map instance
            map: null,
            mapZoom: 12,
            mapCenter: { lat: 25.773357, lng: -80.1919 },

            // Style
            currentStyle: null,
            baseStyleUrl: 'https://cdn.shopify.com/s/files/1/0977/3672/0709/files/beachglass.json?v=1763071937',
            styleName: 'custom-style',
            lastModified: 'Not yet',

            // Location search
            searchQuery: '',
            searchResults: [],

            // Layer management
            selectedLayer: null,
            selectedLayerIndex: null,
            currentFilter: 'all',
            layerSearchQuery: '',

            // Quick color presets
            colorPresets: [
                { id: 'background', label: 'Background', color: '#ffffff' },
                { id: 'water', label: 'Water', color: '#a9c4c4' },
                { id: 'buildings', label: 'Buildings', color: '#dcdcdc' },
                { id: 'roads', label: 'Roads', color: '#000000' }
            ],

            // Layer filters
            layerFilters: [
                { label: 'All', value: 'all' },
                { label: 'Fill', value: 'fill' },
                { label: 'Line', value: 'line' },
                { label: 'Background', value: 'background' },
                { label: 'Symbol', value: 'symbol' }
            ],

            // Toast notification
            toast: {
                show: false,
                message: '',
                type: 'success'
            }
        };
    },

    computed: {
        filteredLayers() {
            if (!this.currentStyle || !this.currentStyle.layers) {
                return [];
            }

            let layers = this.currentStyle.layers;

            // Apply type filter
            if (this.currentFilter !== 'all') {
                layers = layers.filter(layer => layer.type === this.currentFilter);
            }

            // Apply search filter
            if (this.layerSearchQuery.trim()) {
                const query = this.layerSearchQuery.toLowerCase();
                layers = layers.filter(layer =>
                    layer.id.toLowerCase().includes(query) ||
                    (layer['source-layer'] && layer['source-layer'].toLowerCase().includes(query))
                );
            }

            return layers;
        }
    },

    methods: {
        async init() {
            try {
                await this.loadBaseStyle();
                this.initializeMap();
                this.showToast('Map loaded successfully!', 'success');
            } catch (error) {
                console.error('Failed to initialize:', error);
                this.showToast('Failed to load map style', 'error');
            }
        },

        async loadBaseStyle() {
            const response = await fetch(this.baseStyleUrl);
            this.currentStyle = await response.json();
        },

        initializeMap() {
            this.map = new mapboxgl.Map({
                container: 'map',
                style: this.currentStyle,
                center: [this.mapCenter.lng, this.mapCenter.lat],
                zoom: this.mapZoom
            });

            // Update map info on move
            this.map.on('move', () => {
                const center = this.map.getCenter();
                this.mapCenter = { lat: center.lat, lng: center.lng };
            });

            this.map.on('zoom', () => {
                this.mapZoom = this.map.getZoom();
            });

            this.map.on('load', () => {
                const center = this.map.getCenter();
                this.mapCenter = { lat: center.lat, lng: center.lng };
                this.mapZoom = this.map.getZoom();
            });
        },

        updateMapStyle() {
            if (this.map) {
                this.map.setStyle(this.currentStyle);
                this.updateLastModified();
            }
        },

        updateLastModified() {
            const now = new Date();
            this.lastModified = now.toLocaleTimeString();
        },

        // Layer management
        selectLayer(layer, index) {
            this.selectedLayer = layer;
            this.selectedLayerIndex = index;
        },

        isLayerVisible(layer) {
            return layer.layout?.visibility !== 'none';
        },

        toggleLayerVisibility(layer, index) {
            if (!layer.layout) {
                layer.layout = {};
            }

            const isVisible = this.isLayerVisible(layer);
            layer.layout.visibility = isVisible ? 'none' : 'visible';

            this.updateMapStyle();
            this.showToast(
                `${this.getLayerDisplayName(layer.id)} ${isVisible ? 'hidden' : 'shown'}`,
                'success'
            );
        },

        getLayerDisplayName(layerId) {
            // Convert kebab-case or snake_case to Title Case
            return layerId
                .split(/[-_]/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        },

        // Layer property detection
        isColorProperty(key) {
            return key.includes('color');
        },

        isOpacityProperty(key) {
            return key.includes('opacity');
        },

        isWidthProperty(key) {
            return key.includes('width');
        },

        isDasharrayProperty(key) {
            return key.includes('dasharray');
        },

        isStopsProperty(value) {
            return typeof value === 'object' && value !== null && 'stops' in value && Array.isArray(value.stops);
        },

        isMatchExpression(value) {
            return Array.isArray(value) && value.length > 0 && value[0] === 'match';
        },

        isInterpolateExpression(value) {
            return Array.isArray(value) && value.length > 0 && value[0] === 'interpolate';
        },

        isSimpleNumberProperty(key) {
            const simpleNumberProps = ['blur', 'offset', 'radius', 'translate', 'halo-width', 'halo-blur'];
            return simpleNumberProps.some(prop => key.includes(prop));
        },

        isSimpleColor(value) {
            return typeof value === 'string' && (value.startsWith('rgba') || value.startsWith('#'));
        },

        formatPropertyName(key) {
            return key
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        },

        getPropertyDescription(key) {
            const descriptions = {
                // Line properties
                'line-dasharray': 'Pattern of dashes and gaps for dashed lines. Example: [3, 0.5] = 3px dash, 0.5px gap. Used for railways, borders, etc.',
                'line-gap-width': 'Creates space between parallel lines (double-line effect). Commonly used for highways and major roads to show separate lanes.',
                'line-width': 'Thickness of the line in pixels. For roads, buildings, borders. Can vary by zoom level for better visibility at different map scales.',
                'line-blur': 'Softens line edges. 0 = sharp edge, higher values = softer/blurred edge. Useful for subtle water boundaries or atmospheric effects.',
                'line-color': 'Color of the line. Used for roads (black/white), water boundaries (blue), building outlines, borders, etc.',
                'line-opacity': 'Transparency of the line. 0 = completely invisible, 1 = fully opaque. Use lower values for subtle features.',
                'line-offset': 'Shifts the line perpendicular to its direction. Positive values move right, negative move left. Used for road casings.',

                // Fill properties
                'fill-color': 'Color that fills polygons like water bodies, parks, buildings, land areas. The main visible color of the feature.',
                'fill-opacity': 'Transparency of polygon fills. 0 = see-through, 1 = solid. Lower values let multiple layers show through.',
                'fill-outline-color': 'Color of the polygon outline/border. Creates definition between adjacent areas.',
                'fill-pattern': 'Uses a sprite image to fill the polygon with a pattern instead of solid color.',

                // Background
                'background-color': 'The base map background color. Shows when no other layers are visible (ocean, space outside map).',
                'background-opacity': 'Transparency of the background. Usually kept at 1 (fully opaque).',
                'background-pattern': 'Uses a sprite image pattern for the background instead of solid color.',

                // Circle properties
                'circle-radius': 'Size of circle markers in pixels. Used for points of interest, cities, markers. Can scale with zoom.',
                'circle-color': 'Fill color of circle markers.',
                'circle-blur': 'Blur amount for circles. Creates soft edges. 0 = sharp, 1 = very soft.',
                'circle-opacity': 'Transparency of circle fill. 0 = invisible, 1 = solid.',
                'circle-stroke-width': 'Width of the circle outline in pixels.',
                'circle-stroke-color': 'Color of the circle outline.',
                'circle-stroke-opacity': 'Transparency of the circle outline.',

                // Text properties
                'text-color': 'Color of text labels (street names, place names, etc.).',
                'text-halo-width': 'Width of text outline/halo in pixels. Makes text readable over busy backgrounds.',
                'text-halo-blur': 'Blur applied to text halo. Softens the outline.',
                'text-halo-color': 'Color of text halo/outline. Usually white or light color for dark text, dark for light text.',
                'text-opacity': 'Transparency of text. 0 = invisible, 1 = fully visible.',
                'text-size': 'Font size in pixels. Can vary by zoom level to keep labels readable.',

                // Icon properties
                'icon-size': 'Scale of icon symbols. 1 = original size, 0.5 = half size, 2 = double size.',
                'icon-opacity': 'Transparency of icons. 0 = invisible, 1 = fully visible.',
                'icon-color': 'Tint color applied to icons.',
                'icon-halo-width': 'Width of icon halo/outline in pixels.',
                'icon-halo-color': 'Color of icon halo/outline.',

                // Raster properties
                'raster-opacity': 'Transparency of raster layers (satellite imagery, hillshade). 0 = invisible, 1 = opaque.',
                'raster-brightness-min': 'Minimum brightness for raster layers. -1 = very dark, 0 = normal.',
                'raster-brightness-max': 'Maximum brightness for raster layers. 0 = normal, 1 = very bright.',
                'raster-contrast': 'Contrast adjustment for raster layers. -1 = low contrast, 1 = high contrast.',
                'raster-saturation': 'Color saturation for raster layers. -1 = grayscale, 0 = normal, 1 = oversaturated.'
            };
            return descriptions[key] || '';
        },

        getOpacityValue(value) {
            if (typeof value === 'number') {
                return Math.round(value * 100);
            }
            return 100;
        },

        // Parse interpolate expression to extract stops
        parseInterpolateStops(expression) {
            // Format: ["interpolate", ["linear"|"exponential", base], ["zoom"], zoom1, value1, zoom2, value2, ...]
            if (!this.isInterpolateExpression(expression)) return [];

            const interpolationType = expression[1][0]; // "linear" or "exponential"
            const base = expression[1][1]; // base for exponential
            const stops = [];

            // Start from index 3 (after ["interpolate", [...], ["zoom"]])
            for (let i = 3; i < expression.length; i += 2) {
                if (i + 1 < expression.length) {
                    stops.push([expression[i], expression[i + 1]]);
                }
            }

            return { type: interpolationType, base: base || 1, stops: stops };
        },

        // Parse match expression to extract cases
        parseMatchCases(expression) {
            // Format: ["match", ["get", "property"], [value1, value2], result1, [value3], result2, defaultResult]
            if (!this.isMatchExpression(expression)) return [];

            const property = expression[1][1]; // property name
            const cases = [];

            // Start from index 2, go through pairs of [values, result]
            for (let i = 2; i < expression.length - 1; i += 2) {
                const values = Array.isArray(expression[i]) ? expression[i] : [expression[i]];
                const result = expression[i + 1];

                cases.push({
                    values: values,
                    result: result
                });
            }

            // Last item is the default value
            const defaultValue = expression[expression.length - 1];

            return { property: property, cases: cases, default: defaultValue };
        },

        // Update layer properties
        updateLayerProperty(section, key, value) {
            if (!this.selectedLayer) return;

            const actualIndex = this.currentStyle.layers.findIndex(
                l => l.id === this.selectedLayer.id
            );

            if (actualIndex === -1) return;

            if (!this.currentStyle.layers[actualIndex][section]) {
                this.currentStyle.layers[actualIndex][section] = {};
            }

            this.currentStyle.layers[actualIndex][section][key] = value;

            // Update the selected layer reference
            this.selectedLayer = this.currentStyle.layers[actualIndex];

            this.updateMapStyle();
            this.showToast('Property updated', 'success');
        },

        // Dasharray management
        updateDasharrayValue(key, index, value) {
            if (!this.selectedLayer || !this.selectedLayer.paint) return;

            const actualIndex = this.currentStyle.layers.findIndex(
                l => l.id === this.selectedLayer.id
            );

            if (actualIndex === -1) return;

            const dasharray = [...this.currentStyle.layers[actualIndex].paint[key]];
            dasharray[index] = value;

            this.currentStyle.layers[actualIndex].paint[key] = dasharray;
            this.selectedLayer = this.currentStyle.layers[actualIndex];

            this.updateMapStyle();
        },

        addDasharrayValue(key) {
            if (!this.selectedLayer || !this.selectedLayer.paint) return;

            const actualIndex = this.currentStyle.layers.findIndex(
                l => l.id === this.selectedLayer.id
            );

            if (actualIndex === -1) return;

            const dasharray = [...this.currentStyle.layers[actualIndex].paint[key]];
            dasharray.push(1);

            this.currentStyle.layers[actualIndex].paint[key] = dasharray;
            this.selectedLayer = this.currentStyle.layers[actualIndex];

            this.updateMapStyle();
            this.showToast('Dasharray value added', 'success');
        },

        removeDasharrayValue(key, index) {
            if (!this.selectedLayer || !this.selectedLayer.paint) return;

            const actualIndex = this.currentStyle.layers.findIndex(
                l => l.id === this.selectedLayer.id
            );

            if (actualIndex === -1) return;

            const dasharray = [...this.currentStyle.layers[actualIndex].paint[key]];
            dasharray.splice(index, 1);

            this.currentStyle.layers[actualIndex].paint[key] = dasharray;
            this.selectedLayer = this.currentStyle.layers[actualIndex];

            this.updateMapStyle();
            this.showToast('Dasharray value removed', 'success');
        },

        // Stops management
        updateStopValue(key, stopIndex, valueIndex, value) {
            if (!this.selectedLayer || !this.selectedLayer.paint) return;

            const actualIndex = this.currentStyle.layers.findIndex(
                l => l.id === this.selectedLayer.id
            );

            if (actualIndex === -1) return;

            const property = { ...this.currentStyle.layers[actualIndex].paint[key] };
            property.stops[stopIndex][valueIndex] = value;

            this.currentStyle.layers[actualIndex].paint[key] = property;
            this.selectedLayer = this.currentStyle.layers[actualIndex];

            this.updateMapStyle();
        },

        addStop(key) {
            if (!this.selectedLayer || !this.selectedLayer.paint) return;

            const actualIndex = this.currentStyle.layers.findIndex(
                l => l.id === this.selectedLayer.id
            );

            if (actualIndex === -1) return;

            const property = { ...this.currentStyle.layers[actualIndex].paint[key] };
            const lastStop = property.stops[property.stops.length - 1];
            const newZoom = lastStop[0] + 1;
            const newValue = lastStop[1];

            property.stops.push([newZoom, newValue]);

            this.currentStyle.layers[actualIndex].paint[key] = property;
            this.selectedLayer = this.currentStyle.layers[actualIndex];

            this.updateMapStyle();
            this.showToast('Stop added', 'success');
        },

        removeStop(key, stopIndex) {
            if (!this.selectedLayer || !this.selectedLayer.paint) return;

            const actualIndex = this.currentStyle.layers.findIndex(
                l => l.id === this.selectedLayer.id
            );

            if (actualIndex === -1) return;

            const property = { ...this.currentStyle.layers[actualIndex].paint[key] };
            property.stops.splice(stopIndex, 1);

            this.currentStyle.layers[actualIndex].paint[key] = property;
            this.selectedLayer = this.currentStyle.layers[actualIndex];

            this.updateMapStyle();
            this.showToast('Stop removed', 'success');
        },

        // Interpolate expression management
        updateInterpolateStop(key, stopIndex, zoomOrValue, newValue) {
            if (!this.selectedLayer || !this.selectedLayer.paint) return;

            const actualIndex = this.currentStyle.layers.findIndex(
                l => l.id === this.selectedLayer.id
            );

            if (actualIndex === -1) return;

            // Deep clone the expression array to ensure reactivity
            const expression = JSON.parse(JSON.stringify(this.currentStyle.layers[actualIndex].paint[key]));
            const dataIndex = 3 + (stopIndex * 2) + zoomOrValue; // 0 for zoom, 1 for value
            expression[dataIndex] = newValue;

            // Update the style
            this.currentStyle.layers[actualIndex].paint[key] = expression;
            this.selectedLayer = this.currentStyle.layers[actualIndex];

            // Immediately update the map
            this.updateMapStyle();
        },

        addInterpolateStop(key) {
            if (!this.selectedLayer || !this.selectedLayer.paint) return;

            const actualIndex = this.currentStyle.layers.findIndex(
                l => l.id === this.selectedLayer.id
            );

            if (actualIndex === -1) return;

            // Deep clone to ensure reactivity
            const expression = JSON.parse(JSON.stringify(this.currentStyle.layers[actualIndex].paint[key]));

            // Get last zoom and value
            const lastZoom = expression[expression.length - 2];
            const lastValue = expression[expression.length - 1];

            // Add new stop (increment zoom by 1)
            expression.push(lastZoom + 1, lastValue);

            // Update the style
            this.currentStyle.layers[actualIndex].paint[key] = expression;
            this.selectedLayer = this.currentStyle.layers[actualIndex];

            // Immediately update the map
            this.updateMapStyle();
            this.showToast('Stop added', 'success');
        },

        removeInterpolateStop(key, stopIndex) {
            if (!this.selectedLayer || !this.selectedLayer.paint) return;

            const actualIndex = this.currentStyle.layers.findIndex(
                l => l.id === this.selectedLayer.id
            );

            if (actualIndex === -1) return;

            // Deep clone to ensure reactivity
            const expression = JSON.parse(JSON.stringify(this.currentStyle.layers[actualIndex].paint[key]));

            // Remove zoom and value pair
            const dataIndex = 3 + (stopIndex * 2);
            expression.splice(dataIndex, 2);

            // Update the style
            this.currentStyle.layers[actualIndex].paint[key] = expression;
            this.selectedLayer = this.currentStyle.layers[actualIndex];

            // Immediately update the map
            this.updateMapStyle();
            this.showToast('Stop removed', 'success');
        },

        // Match expression management
        updateMatchCase(key, caseIndex, valueOrResult, newValue) {
            if (!this.selectedLayer || !this.selectedLayer.paint) return;

            const actualIndex = this.currentStyle.layers.findIndex(
                l => l.id === this.selectedLayer.id
            );

            if (actualIndex === -1) return;

            // Deep clone the expression array to ensure reactivity
            const expression = JSON.parse(JSON.stringify(this.currentStyle.layers[actualIndex].paint[key]));

            // Cases start at index 2, each case is 2 elements (values array, result)
            const caseStartIndex = 2 + (caseIndex * 2);

            if (valueOrResult === 'result') {
                // Update the result (color)
                expression[caseStartIndex + 1] = newValue;
            }

            // Update the style
            this.currentStyle.layers[actualIndex].paint[key] = expression;
            this.selectedLayer = this.currentStyle.layers[actualIndex];

            // Immediately update the map
            this.updateMapStyle();
        },

        updateMatchDefault(key, newValue) {
            if (!this.selectedLayer || !this.selectedLayer.paint) return;

            const actualIndex = this.currentStyle.layers.findIndex(
                l => l.id === this.selectedLayer.id
            );

            if (actualIndex === -1) return;

            // Deep clone the expression array to ensure reactivity
            const expression = JSON.parse(JSON.stringify(this.currentStyle.layers[actualIndex].paint[key]));
            expression[expression.length - 1] = newValue;

            // Update the style
            this.currentStyle.layers[actualIndex].paint[key] = expression;
            this.selectedLayer = this.currentStyle.layers[actualIndex];

            // Immediately update the map
            this.updateMapStyle();
        },

        // Quick color updates
        updateQuickColor(category, hexColor) {
            const rgba = this.hexToRgba(hexColor);

            // Update preset display
            const preset = this.colorPresets.find(p => p.id === category);
            if (preset) {
                preset.color = hexColor;
            }

            // Apply to layers
            this.currentStyle.layers.forEach(layer => {
                const layerId = layer.id.toLowerCase();

                switch(category) {
                    case 'background':
                        if (layerId.includes('bg') || layerId === 'background') {
                            if (layer.paint && 'background-color' in layer.paint) {
                                layer.paint['background-color'] = rgba;
                            }
                        }
                        break;
                    case 'water':
                        if (layerId.includes('water')) {
                            if (layer.paint) {
                                if ('fill-color' in layer.paint) layer.paint['fill-color'] = rgba;
                                if ('line-color' in layer.paint) layer.paint['line-color'] = rgba;
                            }
                        }
                        break;
                    case 'buildings':
                        if (layerId.includes('building')) {
                            if (layer.paint && 'fill-color' in layer.paint) {
                                layer.paint['fill-color'] = rgba;
                            }
                        }
                        break;
                    case 'roads':
                        if (layerId.includes('road') || layerId.includes('street') ||
                            layerId.includes('motorway') || layerId.includes('trunk') ||
                            layerId.includes('primary') || layerId.includes('secondary')) {
                            if (layer.paint && 'line-color' in layer.paint) {
                                layer.paint['line-color'] = rgba;
                            }
                        }
                        break;
                }
            });

            this.updateMapStyle();
            this.showToast(`All ${category} colors updated`, 'success');
        },

        // Location search
        async searchLocation() {
            if (!this.searchQuery.trim()) {
                this.showToast('Please enter a location', 'error');
                return;
            }

            try {
                const response = await fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(this.searchQuery)}.json?access_token=${mapboxgl.accessToken}&limit=5`
                );
                const data = await response.json();
                this.searchResults = data.features || [];

                if (this.searchResults.length === 0) {
                    this.showToast('No results found', 'error');
                }
            } catch (error) {
                console.error('Search error:', error);
                this.showToast('Search failed', 'error');
            }
        },

        flyToLocation(result) {
            this.map.flyTo({
                center: result.center,
                zoom: 12,
                essential: true
            });
            this.searchResults = [];
            this.searchQuery = '';
            this.showToast(`Navigated to ${result.text}`, 'success');
        },

        // Map controls
        zoomIn() {
            this.map.zoomIn();
        },

        zoomOut() {
            this.map.zoomOut();
        },

        resetView() {
            this.map.flyTo({
                center: [-80.1919, 25.773357],
                zoom: 12
            });
        },

        // Export and reset
        async resetStyle() {
            if (confirm('Reset to base style? All changes will be lost.')) {
                await this.loadBaseStyle();
                this.updateMapStyle();
                this.selectedLayer = null;
                this.selectedLayerIndex = null;
                this.lastModified = 'Not yet';
                this.showToast('Style reset to default', 'success');
            }
        },

        exportStyle() {
            const name = this.styleName.trim() || 'custom-style';
            const fileName = name.endsWith('.json') ? name : `${name}.json`;

            this.currentStyle.name = name;

            const dataStr = JSON.stringify(this.currentStyle, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(dataBlob);
            downloadLink.download = fileName;
            downloadLink.click();

            this.showToast(`Style exported as ${fileName}`, 'success');
        },

        // Toast notifications
        showToast(message, type = 'success') {
            this.toast.message = message;
            this.toast.type = type;
            this.toast.show = true;

            setTimeout(() => {
                this.toast.show = false;
            }, 3000);
        },

        // Color conversion utilities
        rgbaToHex(rgba) {
            if (!rgba) return '#000000';
            if (rgba.startsWith('#')) return rgba;

            const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (!match) return '#000000';

            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);

            return '#' + [r, g, b].map(x => {
                const hex = x.toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }).join('');
        },

        hexToRgba(hex) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, 1)`;
        }
    },

    mounted() {
        // Attribution
        console.log('%c🗺️ Professional Map Style Editor', 'font-size: 16px; font-weight: bold; color: #3b82f6;');
        console.log('%cMade by Karan Goyal', 'font-size: 14px; color: #6b7280;');
        console.log('%c📧 karangoyal360@gmail.com', 'font-size: 12px; color: #6b7280;');
        console.log('%c🌐 karangoyal.cc', 'font-size: 12px; color: #6b7280;');
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #e5e7eb;');

        this.init();
    }
}).mount('#app');
