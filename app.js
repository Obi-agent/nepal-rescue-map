
const DEFAULT_VIEW = {
  center: [28.25, 84.35],
  zoom: 7
};

const map = L.map('map', {
  zoomControl: true,
  minZoom: 6
}).setView(DEFAULT_VIEW.center, DEFAULT_VIEW.zoom);

const osm = L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }
).addTo(map);

const topo = L.tileLayer(
  'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  {
    maxZoom: 17,
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap'
  }
);

L.control.layers(
  {
    'OpenStreetMap': osm,
    'OpenTopoMap': topo
  },
  {},
  { collapsed: true }
).addTo(map);

const routeButtonsEl = document.getElementById('routeButtons');
const routeDetailEl = document.getElementById('routeDetail');
const pointListEl = document.getElementById('pointList');
const searchInputEl = document.getElementById('searchInput');
const pointCountEl = document.getElementById('pointCount');
const mapModeLabelEl = document.getElementById('mapModeLabel');
const mapModeSubtextEl = document.getElementById('mapModeSubtext');
const summaryGridEl = document.getElementById('summaryGrid');
const showAllBtn = document.getElementById('showAllBtn');
const resetViewBtn = document.getElementById('resetViewBtn');

const routeLayers = new Map();
const pointLayers = new Map();
const routeButtons = new Map();
let selectedRouteId = null;

function formatNumber(value) {
  return new Intl.NumberFormat('en-GB').format(value);
}

function altitudeRangeSummary() {
  const values = RESCUE_POINTS.map(p => p.altitude_m);
  return {
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

function renderSummaryCards() {
  const range = altitudeRangeSummary();
  const routeCount = ROUTES.length;
  const pointCount = RESCUE_POINTS.length;
  const highRiskCount = RESCUE_POINTS.filter(p => p.altitude_m >= 4000).length;
  const approxCount = RESCUE_POINTS.filter(p => p.approximate_coordinate).length;

  const cards = [
    { label: 'Routes', value: routeCount, subvalue: 'Major trekking corridors' },
    { label: 'Rescue points', value: pointCount, subvalue: 'Unique map POIs' },
    { label: 'Altitude range', value: `${formatNumber(range.min)}–${formatNumber(range.max)}m`, subvalue: 'Across mapped rescue points' },
    { label: 'High altitude POIs', value: highRiskCount, subvalue: 'At or above 4,000m' },
    { label: 'Approximate geocodes', value: approxCount, subvalue: 'Require field validation' },
    { label: 'Ready exports', value: '3', subvalue: 'GeoJSON, CSV and KML included' }
  ];

  summaryGridEl.innerHTML = cards.map(card => `
    <div class="summary-card">
      <p class="label">${card.label}</p>
      <p class="value">${card.value}</p>
      <p class="subvalue">${card.subvalue}</p>
    </div>
  `).join('');
}

function createRouteButtons() {
  routeButtonsEl.innerHTML = '';
  ROUTES.forEach(route => {
    const button = document.createElement('button');
    button.className = 'route-btn';
    button.innerHTML = `<span class="route-dot" style="background:${route.colour}"></span><span>${route.name}</span>`;
    button.addEventListener('click', () => {
      const isSame = selectedRouteId === route.id;
      if (isSame) {
        showAll();
      } else {
        selectRoute(route.id);
      }
    });
    routeButtonsEl.appendChild(button);
    routeButtons.set(route.id, button);
  });
}

function buildRouteLayers() {
  ROUTES.forEach(route => {
    const latLngs = route.waypoints.map(wp => [wp.latitude, wp.longitude]);
    const layer = L.polyline(latLngs, {
      color: route.colour,
      weight: 4,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    layer.on('click', () => selectRoute(route.id));
    layer.bindPopup(routePopupHtml(route), { maxWidth: 320 });

    routeLayers.set(route.id, layer);
  });
}

function buildPointLayers() {
  RESCUE_POINTS.forEach(point => {
    const colour = firstRouteColour(point.route_names[0]);
    const marker = L.circleMarker([point.latitude, point.longitude], {
      radius: 8,
      color: point.approximate_coordinate ? '#8a5b00' : '#113a67',
      weight: 2,
      fillColor: point.approximate_coordinate ? '#ffd54f' : colour,
      fillOpacity: 0.92
    }).addTo(map);

    marker.bindPopup(pointPopupHtml(point), { maxWidth: 340 });

    marker.on('click', () => {
      if (selectedRouteId && !point.route_names.some(name => routeByName(name).id === selectedRouteId)) {
        selectRoute(routeByName(point.route_names[0]).id);
      }
    });

    pointLayers.set(point.id, marker);
  });
}

function routeById(routeId) {
  return ROUTES.find(route => route.id === routeId);
}

function routeByName(routeName) {
  return ROUTES.find(route => route.name === routeName);
}

function firstRouteColour(routeName) {
  const route = routeByName(routeName);
  return route ? route.colour : '#123e73';
}

function routePopupHtml(route) {
  return `
    <div class="popup-content">
      <h3>${route.name}</h3>
      <div class="popup-grid">
        <p>${route.route_text}</p>
        <div class="stat-chip-wrap">
          <span class="stat-chip"><span class="badge-dot" style="background:${route.colour}"></span>${route.rescue_point_count} rescue points</span>
          <span class="stat-chip">${formatNumber(route.min_rescue_altitude_m)}m to ${formatNumber(route.max_rescue_altitude_m)}m</span>
        </div>
      </div>
    </div>
  `;
}

function pointPopupHtml(point) {
  const routeBadges = point.route_names.map(name => {
    const colour = firstRouteColour(name);
    return `<span class="route-badge"><span class="badge-dot" style="background:${colour}"></span>${name}</span>`;
  }).join('');

  const notes = point.descriptions.map(note => `<li>${note}</li>`).join('');

  return `
    <div class="popup-content">
      <h3>${point.name}</h3>
      <div class="popup-grid">
        <div class="stat-chip-wrap">
          <span class="stat-chip">${formatNumber(point.altitude_m)}m</span>
          <span class="stat-chip">${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}</span>
        </div>
        <div class="badge-wrap">${routeBadges}</div>
        ${point.approximate_coordinate ? '<p class="coord-note">Approximate public-reference coordinate</p>' : ''}
        <div>
          <p><strong>Operational notes</strong></p>
          <ul>${notes}</ul>
        </div>
      </div>
    </div>
  `;
}

function renderRouteDetail(route) {
  if (!route) {
    routeDetailEl.className = 'route-detail empty-state';
    routeDetailEl.innerHTML = 'Select a route to isolate its line and rescue points.';
    return;
  }

  const approxCount = route.waypoints.filter(wp => wp.approximate_coordinate).length;
  const rescueBadges = route.rescue_point_names.map(name => {
    const point = RESCUE_POINTS.find(p => p.name === name);
    if (!point) return '';
    return `<span class="route-badge"><span class="badge-dot" style="background:${route.colour}"></span>${name} (${formatNumber(point.altitude_m)}m)</span>`;
  }).join('');

  routeDetailEl.className = 'route-detail';
  routeDetailEl.innerHTML = `
    <div class="route-detail-card">
      <h3>${route.name}</h3>
      <p>${route.route_text}</p>
      <div class="stat-chip-wrap" style="margin-bottom:10px;">
        <span class="stat-chip"><span class="badge-dot" style="background:${route.colour}"></span>${route.rescue_point_count} rescue points</span>
        <span class="stat-chip">Range ${formatNumber(route.min_rescue_altitude_m)}m to ${formatNumber(route.max_rescue_altitude_m)}m</span>
        <span class="stat-chip">${route.waypoints.length} route waypoints</span>
        ${approxCount ? `<span class="stat-chip">${approxCount} approximate waypoint${approxCount > 1 ? 's' : ''}</span>` : ''}
      </div>
      <div class="badge-wrap">${rescueBadges}</div>
    </div>
  `;
}

function pointMatchesFilter(point, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    point.name.toLowerCase().includes(q) ||
    point.route_names.some(name => name.toLowerCase().includes(q)) ||
    point.descriptions.some(note => note.toLowerCase().includes(q))
  );
}

function pointVisibleForSelection(point) {
  if (!selectedRouteId) return true;
  return point.route_names.some(name => routeByName(name).id === selectedRouteId);
}

function renderPointList() {
  const query = searchInputEl.value.trim();
  const visiblePoints = RESCUE_POINTS
    .filter(pointVisibleForSelection)
    .filter(point => pointMatchesFilter(point, query))
    .sort((a, b) => a.name.localeCompare(b.name));

  pointCountEl.textContent = `${visiblePoints.length} point${visiblePoints.length === 1 ? '' : 's'} shown`;

  pointListEl.innerHTML = visiblePoints.map(point => {
    const badges = point.route_names.map(name => {
      const colour = firstRouteColour(name);
      return `<span class="route-badge"><span class="badge-dot" style="background:${colour}"></span>${name}</span>`;
    }).join('');

    const note = point.descriptions[0] || '';
    return `
      <article class="point-card" data-point-id="${point.id}">
        <h3>${point.name}</h3>
        <div class="point-meta">
          <span class="meta-pill">${formatNumber(point.altitude_m)}m</span>
          <span class="meta-pill">${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}</span>
          ${point.approximate_coordinate ? '<span class="meta-pill">Approximate</span>' : ''}
        </div>
        <div class="badge-wrap" style="margin-bottom:8px;">${badges}</div>
        <p>${note}</p>
      </article>
    `;
  }).join('');

  pointListEl.querySelectorAll('.point-card').forEach(card => {
    card.addEventListener('click', () => {
      const pointId = card.dataset.pointId;
      const point = RESCUE_POINTS.find(p => p.id === pointId);
      const layer = pointLayers.get(pointId);
      if (!point || !layer) return;
      map.flyTo([point.latitude, point.longitude], Math.max(map.getZoom(), 11), { duration: 0.8 });
      layer.openPopup();
    });
  });

  updatePointLayerVisibility(visiblePoints.map(p => p.id));
}

function updatePointLayerVisibility(visibleIds) {
  const visibleSet = new Set(visibleIds);
  RESCUE_POINTS.forEach(point => {
    const layer = pointLayers.get(point.id);
    if (!layer) return;
    if (visibleSet.has(point.id)) {
      if (!map.hasLayer(layer)) layer.addTo(map);
    } else {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    }
  });
}

function updateRouteLayerVisibility() {
  ROUTES.forEach(route => {
    const layer = routeLayers.get(route.id);
    if (!layer) return;

    if (!selectedRouteId || selectedRouteId === route.id) {
      if (!map.hasLayer(layer)) layer.addTo(map);
      layer.setStyle({
        color: route.colour,
        weight: selectedRouteId === route.id ? 6 : 4,
        opacity: 0.96
      });
    } else {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    }
  });
}

function updateMapHeader() {
  if (!selectedRouteId) {
    mapModeLabelEl.textContent = 'Showing all routes';
    mapModeSubtextEl.textContent = `${ROUTES.length} routes, ${RESCUE_POINTS.length} unique rescue points`;
    return;
  }

  const route = routeById(selectedRouteId);
  mapModeLabelEl.textContent = `Showing ${route.name}`;
  mapModeSubtextEl.textContent = `${route.rescue_point_count} rescue points | ${formatNumber(route.min_rescue_altitude_m)}m to ${formatNumber(route.max_rescue_altitude_m)}m`;
}

function setActiveButton(routeId) {
  routeButtons.forEach((button, id) => {
    button.classList.toggle('active', id === routeId);
  });
}

function fitToCurrentSelection() {
  if (!selectedRouteId) {
    const group = L.featureGroup([
      ...Array.from(routeLayers.values()),
      ...Array.from(pointLayers.values())
    ]);
    if (group.getLayers().length) {
      map.fitBounds(group.getBounds().pad(0.12));
    }
    return;
  }

  const route = routeById(selectedRouteId);
  const routeLayer = routeLayers.get(selectedRouteId);
  const pointLayerGroup = L.featureGroup(
    RESCUE_POINTS.filter(pointVisibleForSelection).map(point => pointLayers.get(point.id)).filter(Boolean)
  );

  const combined = L.featureGroup([routeLayer, ...pointLayerGroup.getLayers()]);
  if (combined.getLayers().length) {
    map.fitBounds(combined.getBounds().pad(0.16));
  }
}

function selectRoute(routeId) {
  selectedRouteId = routeId;
  updateRouteLayerVisibility();
  setActiveButton(routeId);
  renderRouteDetail(routeById(routeId));
  renderPointList();
  updateMapHeader();
  fitToCurrentSelection();
}

function showAll() {
  selectedRouteId = null;
  updateRouteLayerVisibility();
  setActiveButton(null);
  renderRouteDetail(null);
  renderPointList();
  updateMapHeader();
  fitToCurrentSelection();
}

showAllBtn.addEventListener('click', showAll);

resetViewBtn.addEventListener('click', () => {
  map.setView(DEFAULT_VIEW.center, DEFAULT_VIEW.zoom);
});

searchInputEl.addEventListener('input', renderPointList);

renderSummaryCards();
createRouteButtons();
buildRouteLayers();
buildPointLayers();
showAll();

setTimeout(() => map.invalidateSize(), 150);
