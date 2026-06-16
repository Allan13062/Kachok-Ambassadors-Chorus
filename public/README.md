# Public Assets Folder

This directory holds static assets that will be served at the root URL of your application.

## How to use:
1. Save your custom logos or pictures directly inside this folder. For example:
   - `public/logo.png`
   - `public/hero-choir.jpg`

2. Reference them in your React components using absolute root paths:
   ```jsx
   <img src="/logo.png" alt="Choir Logo" />
   <img src="/hero-choir.jpg" alt="Chorus Group" />
   ```

3. Any files you put in this directory will be bundled and served by Vite directly.
