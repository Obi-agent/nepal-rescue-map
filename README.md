# Nepal Rescue Routes Map

Interactive static web map for major trekking routes in Nepal and helicopter rescue points relevant to medical assistance, rescue coordination, and insurer-facing operational planning.

## What is included

This package contains:

- `index.html` – the interactive map application
- `assets/` – styling, application logic, and embedded data
- `data/routes.geojson` – route lines as waypoint-based GeoJSON
- `data/rescue_points.geojson` – rescue points as GeoJSON
- `data/rescue_points.csv` – rescue points in CSV format for easy import
- `data/nepal_routes_and_rescue_points.kml` – KML for Google My Maps or ArcGIS import

## Key features

- 9 mapped trekking routes
- 35 unique helicopter rescue points
- Clickable route filters
- Clickable rescue point popups
- Route-specific rescue-point lists
- Search by point name, route name, or note
- Ready-to-use static hosting on GitHub Pages
- Import-ready exports for Google My Maps, ArcGIS Online, QGIS, or other GIS tools

## Important operational note

This map is a planning visualisation, not a flight operations chart.

The supplied workbook contained route names, waypoint names, and rescue-point descriptions, but it did not contain surveyed trail geometry, GPS tracks, or official helipad coordinates. For that reason:

- route lines are waypoint-based approximations
- several coordinates are public-reference geocodes rather than official landing-point survey data
- any point flagged as approximate should be revalidated before operational use

This is suitable for desk-based situational planning, client communication, and triage support, but not as a sole source for aviation or field deployment decisions.

## How to use locally

Because the data are embedded in `assets/data.js`, you can open `index.html` directly in a browser, or serve it locally with any static server.

## How to publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload the contents of this folder to the repository root.
3. In GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and the `/root` folder.
6. Save.

GitHub Pages will publish the map as a static site.

## ArcGIS / Google My Maps compatibility

If you prefer to work in GIS tools rather than the bundled web map:

- import `data/routes.geojson` and `data/rescue_points.geojson` into ArcGIS Online, ArcGIS Pro, or QGIS
- import `data/nepal_routes_and_rescue_points.kml` into Google My Maps
- import `data/rescue_points.csv` into spreadsheet-driven mapping workflows

## Source workbook

The map structure was built from the uploaded file:

- `Main Routes - Nepal.xlsx`

## Public-reference coordinate notes

A small number of waypoints are approximate because the workbook did not provide latitude/longitude. These are marked inside the map interface and in the exported data.
