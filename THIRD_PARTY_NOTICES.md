# Third-Party Notices

This project is licensed under the GNU General Public License version 2.0 only. See `LICENSE`.

## Saudi Arabia Regions, Cities and Districts

- Source project: `homaily/Saudi-Arabia-Regions-Cities-and-Districts`
- Source URL: https://github.com/homaily/Saudi-Arabia-Regions-Cities-and-Districts
- Upstream license: GNU General Public License v2.0
- Upstream data source noted by the project: Saudi National Address map data
- Used in this project:
  - `assets/data/saudi-map.svg`
  - region metadata in `js/saudi-map-data.js`

Changes made for Biography CMS:

- Converted `geojson/regions.geojson` region boundaries into SVG paths.
- Retained the 13 Saudi regions and associated island rings as heat-map paths.
- Omitted city and district layers from the public map.
- Added CMS-specific SVG attributes, region IDs, Arabic/English labels, and heat-map interaction hooks.
- Added CMS styling and hover/tooltip behavior in project CSS and JavaScript.

The derived map data is distributed as part of Biography CMS under GPL-2.0-only.

## NDS Vanilla National Design System

- Source project: `mazin-musleh/NDS-vanilla`
- Source URL: https://github.com/mazin-musleh/NDS-vanilla
- Upstream license: MIT
- Upstream copyright: Copyright (c) 2025-2026 Mazin Musleh
- Used in this project:
  - `assets/vendor/nds/`
  - NDS-derived local styles and interaction patterns used by the public pages and admin UI

Changes made for Biography CMS:

- Copied selected compiled frontend assets and component references into `assets/vendor/nds/`.
- Added Biography CMS-specific composition, layout, and theme overrides in `css/custom.css`.
- Integrated NDS-style components with local PHP/MySQL content management flows.

Upstream disclaimer summary:

NDS Vanilla is an independent community implementation based on public Saudi Digital Government Authority design specifications. It is not affiliated with, endorsed by, or maintained by the Digital Government Authority or the Government of Saudi Arabia. The upstream project also notes that default government visual identity assets and marks must be replaced for non-government deployments.

MIT License notice for NDS Vanilla:

```text
MIT License

Copyright (c) 2025-2026 Mazin Musleh

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
