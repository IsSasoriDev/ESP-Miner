# AxeOS Themes

This directory contains theme definitions for AxeOS. Currently, two themes are available:

## Available Themes

### 1. Bitaxe Theme (Default)
- **File**: `vela/bitaxe/theme.scss`
- **Color Scheme**: Red (#f80421) - Bold and energetic
- **Use Case**: Default theme, classic Bitaxe branding
- **Features**:
  - Red primary color with warm tones
  - Optimized for high contrast visibility
  - Traditional mining device interface styling

### 2. Modern Theme (New)
- **File**: `modern/theme.scss`
- **Color Scheme**: Indigo/Purple-Blue (#6366f1) - Contemporary and professional
- **Use Case**: Modern, sleek interface
- **Features**:
  - Vibrant indigo primary color (#6366f1)
  - Gradient backgrounds for visual depth
  - Smooth transitions and animations
  - Enhanced shadows and modern UI patterns
  - Better hover states with smooth transforms
  - Professional focus rings and input styling
  - Modern button designs with gradient overlays
  - Contemporary dialog and sidebar styling

## How to Switch Themes

### Method 1: Edit styles.scss (Recommended)
1. Open `src/styles.scss`
2. Find the theme import section
3. Comment out the current theme
4. Uncomment the desired theme

**Example:**
```scss
// Current theme (Bitaxe - Default)
@import "app/layout/styles/theme/themes/vela/bitaxe/theme.scss";

// To use Modern theme, change to:
// @import "app/layout/styles/theme/themes/vela/bitaxe/theme.scss";
@import "app/layout/styles/theme/themes/modern/theme.scss";
```

5. Rebuild the application: `npm run build:no-api-gen`

## Theme Structure

Each theme consists of:

- **theme.scss**: Main theme entry point that imports all theme files
- **_variables.scss**: Color and design variable definitions
- **_fonts.scss**: Font-specific styling
- **_extensions.scss**: Custom component styling and animations

## Creating Custom Themes

To create a new theme:

1. Create a new directory under `themes/` (e.g., `themes/custom/`)
2. Copy the structure from an existing theme:
   - `theme.scss`
   - `_variables.scss`
   - `_fonts.scss`
   - `_extensions.scss`
3. Customize the variables in `_variables.scss`:
   - Primary color
   - Shade colors (background variants)
   - Text colors
   - Spacing values
4. Add custom styling in `_extensions.scss` as needed
5. Import your theme in `src/styles.scss`

## Color Variables Reference

### Shade Palette
- `$shade000`: Main text color (bright white)
- `$shade100`: Secondary text color (dimmer white)
- `$shade500`: Subdued element color
- `$shade600`: Input/border color
- `$shade800`: Elevated surface (cards)
- `$shade900`: Ground surface (background)

### Primary Colors
- `$primaryColor`: Main theme color
- `$primaryLightColor`: Lighter variant (hover states)
- `$primaryDarkColor`: Darker variant (active states)
- `$primaryDarkerColor`: Darkest variant

## Theme Customization Tips

1. **Color Scheme**: Modify primary color and related variables in `_variables.scss`
2. **Spacing**: Adjust `$inlineSpacing`, `$inputPadding`, and border-radius values
3. **Animations**: Edit transition durations in `_extensions.scss` (default: 0.2s - 0.3s)
4. **Shadows**: Modern theme uses multi-layer shadows for depth; adjust `box-shadow` values
5. **Gradients**: Update gradient directions and color stops in component styling

## Notes

- The modern theme uses CSS gradients, smooth transitions, and modern CSS features
- All themes inherit from the base Vela component styles (`theme-base/_components`)
- Transitions use `cubic-bezier(0.4, 0, 0.2, 1)` for smooth, natural animations
- Focus states use 3px outer shadow with 1px solid border for accessibility
