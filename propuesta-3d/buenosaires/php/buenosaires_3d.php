<?php
header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
$v = '20261118-ba-1';
?><!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>Sistema Buenos Aires 3D Telemetría</title>
  <link rel="stylesheet" href="/Telemetria/css/buenosaires_3d.css?v=<?php echo $v; ?>">
  <style>
    html,body{margin:0;height:100%;overflow:hidden}
    #scene{position:fixed;inset:0;width:100vw;height:100vh;display:block;touch-action:none}
  </style>
</head>
<body>
  <canvas id="scene" aria-label="Visualización 3D del Sistema Buenos Aires"></canvas>
  <div id="labels"></div>
  <div id="notice" hidden></div>

  <div id="alertBar" hidden>
    <div class="mv-alerts-strip"><span id="alertCount" hidden>0</span><span id="alertSummary"></span>
      <button id="alertsAll" type="button">VER TODOS</button><div id="alertsList" hidden></div></div>
  </div>

  <div class="controls-dock" id="controlsDock">
    <div class="ui controls" id="controlsPanel" role="toolbar" aria-label="Controles de cámara" hidden>
      <button id="reset" type="button" title="Restaurar vista general"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>Vista general</button>
      <button id="top" type="button" title="Vista superior"><svg viewBox="0 0 24 24"><path d="M12 3v18M5 10l7-7 7 7"/></svg>Superior</button>
      <button id="zoomIn" type="button" title="Acercar cámara">+ Acercar</button>
      <button id="zoomOut" type="button" title="Alejar cámara">− Alejar</button>
      <button id="full" type="button" title="Pantalla completa"><svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>Pantalla completa</button>
      <button id="spin" type="button" title="Recorrido 3D"><svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/></svg>Giro 3D</button>
      <button id="spinSpeed" type="button">Giro: Normal</button>
      <button id="around" type="button" title="Giro alrededor"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v5h5"/></svg>Giro alrededor</button>
      <button id="free" type="button" title="Manos libres"><svg viewBox="0 0 24 24"><path d="M8 13V5a1.5 1.5 0 0 1 3 0v6M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V5.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L3 14a1.5 1.5 0 0 1 2.4-1.8L8 15"/></svg>Manos libres</button>
      <button id="presentationToggle" type="button">Presentación</button>
      <button id="hideInfo" type="button">Ocultar información</button>
      <button id="water" type="button" class="active"><svg viewBox="0 0 24 24"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/></svg>Agua animada</button>
      <button id="flowSpeed" type="button">Velocidad visual ×1</button>
      <button id="flowLabelsToggle" type="button" class="active">Placas LPS</button>
      <button id="levelsToggle" type="button" class="active">Nivel / tendencia</button>
      <button id="labelsToggle" type="button" class="active">Nombres</button>
      <button id="alertsToggle" type="button" class="active"><svg viewBox="0 0 24 24"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9z"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>Alertas: activadas</button>
      <button id="dateToggle" type="button" class="active"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>Fecha y hora: activadas</button>
      <button id="modeToggle" type="button">Modo día</button>
      <button id="mvRegresarAnillo" type="button" onclick="window.location.assign('/ANILLOTV3D')"><svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>Regresar Anillo TV</button>
    </div>
  </div>

  <div id="mvPanoramaHeading" class="mv-panorama-visible" role="button" tabindex="0" aria-controls="controlsPanel" aria-expanded="false" title="Mostrar controles">
    <img class="mv-panorama-logo" src="/Telemetria/imagenes/logo_ayd_telemetria.png" alt="Servicios de Agua y Drenaje de Monterrey">
    <span class="mv-panorama-divider" aria-hidden="true"></span>
    <div class="mv-panorama-info">
      <strong class="mv-panorama-title">SISTEMA BUENOS AIRES</strong>
      <span class="mv-panorama-subtitle">SIERRA MADRE ORIENTAL · 19 POZOS · 26 INSTALACIONES</span>
      <div class="mv-panorama-date-line"><span class="mv-panorama-live">TIEMPO REAL</span><span class="mv-panorama-clock" id="clockText">--:--:--</span></div>
    </div>
    <span class="mv-panel-indicator" aria-hidden="true">^</span>
    <button type="button" id="controlsToggle" aria-controls="controlsPanel" aria-expanded="false" aria-label="Mostrar controles">Controles</button>
  </div>

  <section id="presentationPanel" hidden role="region" aria-label="Información de presentación">
    <header class="presentation-head">
      <div class="presentation-head-top"><span class="presentation-kicker" id="presentationStep">INSTALACIÓN 1 DE 26</span></div>
      <h2 class="presentation-tank-title" id="presentationName">—</h2>
    </header>
    <div class="presentation-progress-track"><div id="presentationProgress" class="presentation-progress-fill"></div></div>
    <div class="presentation-content">
      <div class="presentation-readings">
        <div class="presentation-reading"><div class="presentation-reading-label" id="primaryLabel">Nivel actual</div><div class="presentation-primary-value" id="primaryValue">N/D</div></div>
        <div class="presentation-reading"><div class="presentation-reading-label">Estado</div><div class="presentation-primary-value" id="stateValue">Sin datos</div></div>
      </div>
      <section class="presentation-flow" id="flowSection" hidden><div class="presentation-flow-heading">Flujo</div><strong id="flowValue">N/D</strong></section>
      <div id="secondaryReadings" hidden></div>
      <section class="presentation-chart" id="graphSection" hidden>
        <div class="presentation-chart-head"><span id="graphTitle">NIVEL</span><strong id="graphValue"></strong></div>
        <canvas id="graph"></canvas><small id="graphLatest"></small>
      </section>
      <section class="presentation-pumps" id="pumpSection" hidden><div class="presentation-pumps-title">Equipos</div><div id="pumpList"></div></section>
      <div id="lastReading"></div>
    </div>
    <div class="presentation-actions">
      <button type="button" id="presentationOptions" aria-label="Más opciones">…</button>
      <div class="presentation-more" id="presentationMore" hidden>
        <button type="button" id="presentationPrev">Anterior</button>
        <button type="button" id="presentationPause">Pausar</button>
        <button type="button" id="presentationNext">Siguiente</button>
      </div>
      <button type="button" id="presentationClose">Salir</button>
    </div>
  </section>

  <script src="/Telemetria/js/buenosaires_3d.js?v=<?php echo $v; ?>" defer></script>
</body>
</html>
