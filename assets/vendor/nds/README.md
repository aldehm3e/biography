# Local NDS Vendor Toolkit

This directory contains reusable NDS frontend assets copied from the local NDS reference folder for project use.

Do not modify the original NDS reference folder. If the project needs more NDS functionality later, copy only the specific required frontend files into this vendor directory.

Structure:

- `css/`: NDS stylesheet entry files available from the reference assets.
- `js/`: NDS bundled runtime scripts from the reference assets.
- `fonts/`: NDS fonts.
- `icons/`: NDS icon assets.
- `images/`: NDS image/SVG assets used by components or branding.
- `components/`: component-level Sass and JavaScript source for future local implementation reference.
- `utilities/`: layout and utility Sass source for future local implementation reference.

This website currently keeps its active page styling in `css/custom.css`; the vendored NDS toolkit is available for future component updates.
