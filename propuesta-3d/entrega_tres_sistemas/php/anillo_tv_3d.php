<?php
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
?>
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
    <title>Anillo TV 3D Telemetría</title>
    <link rel="stylesheet" href="/Telemetria/css/anillo_tv_3d.css?v=20261118-1">
  </head>
  <body>
    <canvas id="scene" aria-label="Simulación tridimensional interactiva de tanques, tuberías y estaciones de bombeo de Anillo TV"></canvas>
    <div class="vignette"></div>
    <div id="mvLiveStatus" data-state="loading" role="status" aria-live="polite">CONECTANDO CON TELEMETRÍA...</div>
    <div class="controls-dock" id="controlsDock">
      <div class="ui controls" id="controlsPanel" role="toolbar" aria-label="Controles de cámara de simulación" aria-hidden="true">
        <button id="reset" title="Restaurar vista general"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v6h6"/></svg>Vista general</button>
        <button id="top" title="Vista superior"><svg viewBox="0 0 24 24"><path d="M12 2v20M3 11l9-9 9 9M4 20h16"/></svg>Superior</button>
        <button id="zoomIn" type="button" title="Acercar cámara">+ Acercar</button>
        <button id="zoomOut" type="button" title="Alejar cámara">− Alejar</button>
        <button id="spin" title="Activar o desactivar giro automático"><svg viewBox="0 0 24 24"><path d="M5 11a7 7 0 0 1 13-3l2 3M20 4v7h-7M19 13a7 7 0 0 1-13 3l-2-3M4 20v-7h7"/></svg>Giro 3D</button>
        <button id="presentationToggle" type="button" title="Recorrer los tanques y consultar sus lecturas reales">Presentación</button>
        <button id="presentationInfoToggle" type="button" disabled aria-controls="presentationPanel" aria-pressed="true" title="Mostrar u ocultar la ficha durante la presentación">Ocultar información</button>
        <button id="water" class="active" title="Pausar o reanudar circulación visual"><svg viewBox="0 0 24 24"><path d="M12 2c-3.5 5-7 9-7 13a7 7 0 0 0 14 0c0-4-3.5-8-7-13zM8 16c.6 2 2 3 4 3"/></svg>Agua animada</button>
        <button id="flowSpeed" title="Cambiar velocidad del flujo visible">Velocidad visual ×1</button>
        <button id="flowLabelsToggle" class="active" title="Mostrar u ocultar los caudales junto a las tuberías">Placas LPS</button>
        <button id="levelsToggle" class="active" title="Mostrar niveles y tendencias sobre tanques">Nivel / tendencia</button>
        <button id="labelsToggle" class="active" title="Mostrar u ocultar los nombres">Nombres</button>
        <button id="alertsVisibilityToggle" type="button" class="active" aria-pressed="true" title="Mostrar u ocultar las alertas del circuito"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span class="mv-alerts-control-label">Alertas: activadas</span></button>
        <button id="dateTimeVisibilityToggle" type="button" class="active" aria-pressed="true" aria-controls="mvDateTime" title="Mostrar u ocultar la fecha y hora"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg><span id="mvDateTimeControlText">Fecha y hora: activadas</span></button>
        <button id="full" title="Pantalla completa"><svg viewBox="0 0 24 24"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg>Pantalla completa</button>
      </div>
      <button type="button" id="controlsToggle" class="controls-toggle mv-control-launcher" aria-controls="controlsPanel" aria-expanded="false" aria-label="Mostrar controles" title="Mostrar controles">
        <span class="mv-control-brand"><img src="/Telemetria/imagenes/logo_ayd_telemetria.png?v=2" width="54" height="54" alt="" draggable="false"></span>
        <span class="mv-control-separator" aria-hidden="true"></span>
        <span id="mvDateTime" class="mv-control-datetime">
          <span class="mv-date-time-date" id="mvDateTimeDate">MONTERREY, N.L.</span>
          <time class="mv-date-time-clock" id="mvDateTimeClock">--:--:--</time>
        </span>
        <span class="mv-control-action"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg></span>
      </button>
    </div>
    <section id="presentationPanel" hidden role="region" aria-label="Información de presentación" aria-live="off">
      <header class="presentation-head">
        <div class="presentation-head-top">
          <span class="presentation-kicker" id="presentationCount">TANQUE 1 DE 36</span>
          <button id="presentationMobileCollapse" class="presentation-mobile-collapse" type="button" aria-expanded="true" aria-controls="presentationContent" title="Reducir ficha de presentación">Reducir</button>
        </div>
        <h2 class="presentation-tank-title" id="presentationName">—</h2>
        <div class="presentation-time" id="presentationUpdated">Esperando lecturas del servidor</div>
      </header>
      <div class="presentation-progress-track"><div id="presentationProgress" class="presentation-progress-fill"></div></div>
      <div class="presentation-content" id="presentationContent">
        <div class="presentation-readings">
          <div class="presentation-reading"><div class="presentation-reading-label">Nivel actual</div><div class="presentation-primary-value" id="presentationLevel">N/D</div></div>
          <div class="presentation-reading"><div class="presentation-reading-label">Tendencia</div><div class="presentation-primary-value" id="presentationDelta">N/D</div></div>
        </div>
        <section class="presentation-flow" aria-label="Caudales asociados al tanque">
          <div class="presentation-flow-heading">Flujo</div>
          <div id="presentationFlowReadings" class="presentation-flow-list"><div class="presentation-flow-row"><span>Sin medición asociada</span><strong>N/D</strong></div></div>
        </section>
        <table class="presentation-secondary-table"><tbody>
            <tr><th scope="row">Comunicación</th><td id="presentationConnection">Sin datos</td></tr>
          </tbody></table>
        <section class="presentation-pumps" id="presentationPumps" hidden aria-label="Equipos de bombeo asociados al tanque">
          <div class="presentation-pumps-title">Equipos de bombeo</div>
          <div id="presentationPumpList"></div>
          <p class="presentation-pumps-note" id="presentationPumpsNote" hidden>Último estado recibido; conexión sin confirmar.</p>
        </section>
      </div>
      <div class="presentation-actions">
        <button type="button" id="presentationOptions" aria-controls="presentationExtraControls" aria-expanded="false" aria-label="Mostrar controles de presentación">Controles <span id="presentationOptionsArrow" aria-hidden="true">▾</span></button>
        <button type="button" id="presentationClose" aria-label="Cerrar presentación">Salir</button>
        <div class="presentation-more" id="presentationExtraControls" hidden>
          <button type="button" id="presentationPrev" aria-label="Tanque anterior">◀ Anterior</button>
          <button type="button" id="presentationPause" aria-label="Pausar presentación">Pausar</button>
          <button type="button" id="presentationNext" aria-label="Siguiente tanque">Siguiente ▶</button>
        </div>
      </div>
    </section>
    <div class="ui tips"><strong>Mouse izquierdo:</strong> girar la vista<br><strong>Rueda:</strong> acercar / alejar<br><strong>Mouse derecho o Shift + arrastrar:</strong> mover<br><strong>Celular:</strong> un dedo gira · dos dedos desplazan / zoom</div>

    <aside class="mv-alerts" id="mvAlerts" aria-label="Supervisión de alertas de Anillo TV">
      <section class="mv-alerts-strip" aria-label="Alertas del sistema">
        <div class="mv-alerts-marquee" id="mvAlertsMarquee">
          <div class="mv-alerts-chip">
            <svg class="mv-alerts-logo" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
              <path d="M16 5.2c-5.1 0-8.2 3.9-8.2 9v3.6c0 2.6-1.2 4.1-2.5 5.6-.4.5-.1 1.2.5 1.2h20.4c.6 0 .9-.7.5-1.2-1.3-1.5-2.5-3-2.5-5.6v-3.6c0-5.1-3.1-9-8.2-9z" fill="#f2b43b" stroke="#34454e" stroke-width="1.7" stroke-linejoin="round"/>
              <path d="M12.6 26.5a3.4 3.4 0 0 0 6.8 0" fill="none" stroke="#34454e" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            <span id="mvAlertsCount" class="mv-alerts-count" hidden>0</span>
          </div>
          <div class="mv-alerts-marquee-window">
            <div id="mvAlertsTicker" class="mv-alerts-ticker" aria-live="off"></div>
          </div>
        </div>
        <button id="mvAlertsToggle" class="mv-alerts-toggle" type="button" aria-expanded="false" aria-controls="mvAlertsPanel">VER TODOS</button>
        <div id="mvAlertsSummary" class="mv-alerts-summary" hidden>Esperando datos del servidor</div>
        <div id="mvAlertsFreshness" class="mv-alerts-status" hidden>Sin revisión todavía</div>
        <span id="mvAlertsPage" hidden></span>
      </section>
      <section id="mvAlertsPanel" class="mv-alerts-panel" hidden aria-label="Listado completo de alertas">
        <div class="mv-alerts-heading"><strong>Alertas activas</strong><button type="button" id="mvAlertsClose" aria-label="Cerrar lista de alertas">Cerrar</button></div>
        <div id="mvAlertsList" class="mv-alerts-list"></div>
      </section>
    </aside>
    <div id="mvAlertMarkers" class="mv-alert-markers" aria-label="Indicadores de fallas en el modelo 3D"></div>

    <div id="labels"></div>
    <div class="ui" id="notice"><div class="notice-title">WebGL no disponible</div><div class="notice-text">Este dispositivo o navegador no pudo iniciar la vista 3D. Prueba con Chrome o Safari actualizado y verifica que WebGL esté disponible.</div></div>

   <script src="/Telemetria/js/anillo_tv_3d.js?v=20261118-2" defer></script>
  </body>
</html>
