<?php
ini_set('display_errors', '0');
error_reporting(E_ERROR | E_PARSE);
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
require_once(dirname(__FILE__) . '/../../CambioHorario/horario.php');
require_once(dirname(__FILE__) . '/../../lol/includes/connection2.php');
if (!function_exists('mysql_query') || !function_exists('mysql_fetch_array')) {
  http_response_code(503);
  echo json_encode(array('ok' => false, 'error' => 'El backend usa mysql_*; no está disponible con esta configuración PHP. Se requiere adaptador mysqli/PDO.'));
  exit;
}
set_time_limit(20);
$hhh = ((date('H') * 60) + date('i')) - 30;
$hhs = ((date('H') * 60) + date('i')) + 60;
$S = date('ymd00');
$trendverde = 0;
$trendrojo = 0;
$Activo = 0;
$Inactivo = 0;
$data2 = array();
$F2 = array();
function cargarTablaPorCodigo($tabla, &$destino)
{
  $query = @mysql_query("select * from " . $tabla);
  if (!$query) {
    return;
  }

  while ($row = mysql_fetch_array($query)) {
    if (isset($row['Codigo'])) {
      $destino[$row['Codigo']] = $row;
    }
  }
}

function filaCodigo($rows, $codigo)
{
  if (isset($rows[$codigo]) && is_array($rows[$codigo])) {
    return $rows[$codigo];
  }

  return array();
}

function campoFila($row, $campo, $default = 0)
{
  if (is_array($row) && isset($row[$campo])) {
    return $row[$campo];
  }

  return $default;
}

function numeroDato($valor)
{
  if (is_null($valor)) {
    return null;
  }

  if (is_int($valor) || is_float($valor) || is_numeric($valor)) {
    return (float) $valor;
  }

  $valor = trim((string) $valor);
  if ($valor === '' || strtoupper($valor) === 'N/D') {
    return null;
  }

  if (strpos($valor, ',') !== false && strpos($valor, '.') !== false) {
    $valor = str_replace(',', '', $valor);
  } elseif (strpos($valor, ',') !== false) {
    $valor = str_replace(',', '.', $valor);
  }

  $valor = preg_replace('/[^0-9.\-]/', '', $valor);

  return is_numeric($valor) ? (float) $valor : null;
}

function lpsNumero($valor)
{
  $numero = numeroDato($valor);
  return $numero === null ? 0 : (float) $numero;
}

function formatoLps($valor)
{
  $valor = (float) $valor;

  if (abs($valor - round($valor)) < 0.01) {
    return number_format($valor, 0, '.', ',');
  }

  return number_format($valor, 2, '.', ',');
}

function minutosHoraDato($hora)
{
  $hora = trim((string) $hora);

  if (!preg_match('/^(\d{1,2}):(\d{2})$/', $hora, $m)) {
    return null;
  }

  return ((int) $m[1] * 60) + (int) $m[2];
}

function tieneComunicacionDato($hora, $hhh, $hhs)
{
  $minutos = minutosHoraDato($hora);

  if ($minutos === null) {
    return false;
  }

  return ($minutos >= $hhh && $minutos <= $hhs);
}

function claseComTanque($row, $hhh, $hhs)
{
  if (!is_array($row) || empty($row)) {
    return 'comm-hidden';
  }

  return tieneComunicacionDato(campoFila($row, 'Hora', ''), $hhh, $hhs) ? 'comm-hidden' : 'comm-visible';
}

function claseNivelTanque($row)
{
  if (!is_array($row) || empty($row)) {
    return 'level-normal';
  }

  $nivel = numeroDato(campoFila($row, 'Nivel', null));
  if ($nivel === null) {
    return 'level-normal';
  }

  $maximo = numeroDato(campoFila($row, 'Maximo', null));
  $minimo = numeroDato(campoFila($row, 'Minimo', null));
  $maxMax = numeroDato(campoFila($row, 'Max_max', null));
  $minMin = numeroDato(campoFila($row, 'Min_min', null));

  if ($maxMax !== null && $minMin !== null && $maxMax != 0 && $minMin != 0) {
    if ($nivel >= ($maxMax * 100) || $nivel <= ($minMin * 100)) {
      return 'level-critical';
    }
  }

  if ($maximo !== null && $minimo !== null) {
    if ($nivel > ($maximo * 100) || $nivel < ($minimo * 100)) {
      return 'level-warning';
    }
  }

  return 'level-normal';
}

function capacidadTanquePorCodigo($codigo)
{
  $capacidades = array(
    'TBSR0002' => 450,
    'TNVACR03' => 750,
    'TNVAC003' => 750,
    'TNVAC001' => 730,
    'TNVACV01' => 600,
    'TBALR001' => 750,
    'TBEF0001' => 750,
    'TBEF0002' => 750,
    'TBFR0003' => 750,
    'TFR00004' => 750,
    'TFR00005' => 750,
    'TBGC0001' => 850,
    'TBGA0002' => 750,
    'TSF00001' => 500
  );

  return isset($capacidades[$codigo]) ? $capacidades[$codigo] : 750;
}

function porcentajeAguaTanque($row, $codigo = '')
{
  if (!is_array($row) || empty($row)) {
    return null;
  }

  $nivelCm = numeroDato(campoFila($row, 'Nivel', null));
  if ($nivelCm === null) {
    return null;
  }

  $capacidadCm = capacidadTanquePorCodigo($codigo);
  if ($capacidadCm <= 0) {
    return null;
  }

  $porcentaje = ($nivelCm * 100) / $capacidadCm;

  if ($porcentaje < 0) {
    $porcentaje = 0;
  }

  if ($porcentaje > 100) {
    $porcentaje = 100;
  }

  return $porcentaje;
}

function imagenTanqueNivel($porcentaje)
{
  if ($porcentaje === null || $porcentaje <= 0) {
    return 'tqlab0.jpg';
  }

  if ($porcentaje > 90) {
    return 'tqlab1002.jpg';
  }

  if ($porcentaje > 80) {
    return 'tqlab902.jpg';
  }

  if ($porcentaje > 75) {
    return 'tqlab802.jpg';
  }

  if ($porcentaje > 60) {
    return 'tqlab752.jpg';
  }

  if ($porcentaje > 50) {
    return 'tqlab602.jpg';
  }

  if ($porcentaje > 40) {
    return 'tqlab502.jpg';
  }

  if ($porcentaje > 20) {
    return 'tqlab402.jpg';
  }

  return 'tqlab202.jpg';
}

function nombreImagenTanque($row, $codigo = '')
{
  return imagenTanqueNivel(porcentajeAguaTanque($row, $codigo));
}

function rutaAguaTanque($row, $codigo = '', $legacy = true)
{
  $nombre = nombreImagenTanque($row, $codigo);

  if ($legacy) {
    return '/imagenes/cosas/' . $nombre;
  }

  return '/Telemetria/imagenes/cosas/' . $nombre;
}

function pintarAguaTanque($id, $row, $codigo = '')
{
  $porcentaje = porcentajeAguaTanque($row, $codigo);

  if ($porcentaje === null) {
    $porcentaje = 0;
  }

  if ($porcentaje < 0) {
    $porcentaje = 0;
  }

  if ($porcentaje > 100) {
    $porcentaje = 100;
  }

  $fill = number_format($porcentaje, 2, '.', '');
  $emptyClass = ($porcentaje <= 0.5) ? ' tank-water-empty' : '';

  echo '<span class="tank-water' . escAttr($emptyClass) . '" id="' . escAttr($id) . '" style="--fill:' . escAttr($fill) . '%" data-fill="' . escAttr($fill) . '" aria-hidden="true">';
  echo '<span class="tank-water-fill"></span>';
  echo '</span>';
}

function escAttr($valor)
{
  return htmlspecialchars((string) $valor, ENT_QUOTES, 'UTF-8');
}

function assetUrl($url)
{
  $path = $_SERVER['DOCUMENT_ROOT'] . parse_url($url, PHP_URL_PATH);
  $version = is_file($path) ? filemtime($path) : time();

  return $url . (strpos($url, '?') === false ? '?' : '&') . 'v=' . $version;
}

function bombaUrl($estado)
{
  return assetUrl('/Telemetria/imagenes/bomba' . $estado . '.gif');
}

function urlVistaActualBackMtyv()
{
  if (isset($_SERVER['REQUEST_URI']) && trim((string) $_SERVER['REQUEST_URI']) !== '') {
    return (string) $_SERVER['REQUEST_URI'];
  }

  return '/Telemetria/php/monterreyv.php';
}

function urlGraficosHistoricos($codigo, $nombre, $tipo = 'nivel', $campo = '', $tabla = 'mtyv')
{
  $logHost = '192.168.10.100';
  $dia = date('ymd');
  $rand = time();
  $back = urlVistaActualBackMtyv();

  if ($tipo === 'flujo') {
    $params = array(
      'd' => '0,0',
      'a' => 'http://' . $logHost . '/logs/' . $codigo . '/',
      'b' => $nombre,
      'g' => 'f',
      'z' => $tabla,
      'dia' => $dia,
      '_r' => $rand,
      'fullview' => '1',
      'back' => $back
    );

    return '/Telemetria/php/Graficagralbd.php?' . http_build_query($params);
  }

  $params = array(
    'd' => '0,0',
    'a' => 'http://' . $logHost . '/logs/' . $codigo . '/',
    'b' => $nombre,
    'dia' => $dia,
    '_r' => $rand,
    'fullview' => '1',
    'back' => $back
  );

  return '/Telemetria/php/Admin_Historial.php?' . http_build_query($params);
}

function urlGraficaPersonalizada($codigo, $nombre, $g = 'f', $tabla = 'mtyv', $host = '192.168.10.100', $endpoint = '/Telemetria/php/Graficagralbd.php')
{
  $dia = date('ymd');
  $rand = time();
  $back = urlVistaActualBackMtyv();

  $params = array(
    'd' => '0,0',
    'a' => 'http://' . $host . '/logs/' . $codigo . '/',
    'b' => $nombre,
    'g' => $g,
    'z' => $tabla,
    'dia' => $dia,
    '_r' => $rand,
    'fullview' => '1',
    'back' => $back
  );

  return $endpoint . '?' . http_build_query($params);
}

function urlGraficaNivel($codigo, $nombre, $g = 'n', $tabla = 'mtyv', $host = '192.168.10.100', $endpoint = '/Telemetria/php/Graficagralbd.php')
{
  $dia = date('ymd');
  $rand = time();
  $back = urlVistaActualBackMtyv();

  $params = array(
    'd' => '0,0',
    'a' => 'http://' . $host . '/logs/' . $codigo . '/',
    'b' => $nombre,
    'g' => $g,
    'z' => $tabla,
    'dia' => $dia,
    '_r' => $rand,
    'fullview' => '1',
    'back' => $back
  );

  return $endpoint . '?' . http_build_query($params);
}

function leerValoresCsv($S, $codigo, $columna = 4)
{
  $ruta = "../../lecturas/" . $S . "_" . $codigo . ".CSV";
  $fp = @fopen($ruta, "r");

  if (!$fp) {
    return array();
  }

  $valores = array();

  while (($data = fgetcsv($fp, 1000, ",")) !== false) {
    if (isset($data[$columna])) {
      $valores[] = $data[$columna];
    }
  }

  fclose($fp);

  return $valores;
}

function tendenciaDesdeValores($valores, $divisor = 100)
{
  $fallback = array('0.00', '▼', 'down');

  $cuantos = count($valores);
  if ($cuantos <= 1) {
    return $fallback;
  }

  $ultimo = numeroDato($valores[$cuantos - 1]);
  if ($ultimo === null) {
    $ultimo = 0;
  }

  if (($cuantos - 12) > 1 && isset($valores[$cuantos - 12])) {
    $base = numeroDato($valores[$cuantos - 12]);
  } else {
    $base = isset($valores[1]) ? numeroDato($valores[1]) : null;
  }

  if ($base === null) {
    $base = 0;
  }

  $trend = number_format(($ultimo - $base) / $divisor, 2, '.', '');

  if ((float) $trend > 0) {
    return array($trend, '▲', 'up');
  }

  return array($trend, '▼', 'down');
}

function tendenciaDesdeCsv($S, $codigo, $columna, $divisor, &$trendverde, &$trendrojo, $usarConteo = true)
{
  $resultado = tendenciaDesdeValores(leerValoresCsv($S, $codigo, $columna), $divisor);

  if ($usarConteo) {
    if ($resultado[2] === 'up') {
      $trendverde++;
    } else {
      $trendrojo++;
    }
  }

  return $resultado;
}

function serieBase($nivel, $flujo, $trend, $trendFlecha, $color)
{
  return array($nivel, $flujo, $trend, $trendFlecha, $color);
}

function nivelDesdeFila($row, $campo = 'Nivel', $divisor = 100, $default = '0.00')
{
  $valor = numeroDato(campoFila($row, $campo, null));
  if ($valor === null) {
    return $default;
  }

  return number_format($valor / $divisor, 2, '.', '');
}

function serieDesdeDbCsv($rows, $S, $codigo, &$trendverde, &$trendrojo, $flujoCampo = null, $csvCodigo = '', $csvColumna = 4, $divisorTrend = 100)
{
  $row = filaCodigo($rows, $codigo);
  $nivel = nivelDesdeFila($row);
  $flujo = ($flujoCampo === null) ? 0 : campoFila($row, $flujoCampo, 0);
  $csvReal = $csvCodigo !== '' ? $csvCodigo : $codigo;

  $tendencia = tendenciaDesdeCsv($S, $csvReal, $csvColumna, $divisorTrend, $trendverde, $trendrojo, true);

  return serieBase($nivel, $flujo, $tendencia[0], $tendencia[1], $tendencia[2]);
}

function serieSoloCsv($S, $codigo, &$trendverde, &$trendrojo, $csvColumna = 4, $divisorNivel = 100, $divisorTrend = 100)
{
  $valores = leerValoresCsv($S, $codigo, $csvColumna);
  $ultimo = count($valores) ? numeroDato($valores[count($valores) - 1]) : null;
  $nivel = $ultimo === null ? '0.00' : number_format($ultimo / $divisorNivel, 2, '.', '');

  $tendencia = tendenciaDesdeValores($valores, $divisorTrend);
  if ($tendencia[2] === 'up') {
    $trendverde++;
  } else {
    $trendrojo++;
  }

  return serieBase($nivel, 0, $tendencia[0], $tendencia[1], $tendencia[2]);
}

function aplicarEstadosEquipo(&$serie, $flags, $bits, $indiceInicial, &$Activo, &$Inactivo)
{
  $i = 0;
  foreach ($bits as $bit) {
    $indice = $indiceInicial + $i;
    if (((int) $flags) & $bit) {
      $serie[$indice] = "prendida";
      $Activo++;
    } else {
      $serie[$indice] = "apagada";
      $Inactivo++;
    }
    $i++;
  }
}

cargarTablaPorCodigo('garcia', $data2);
cargarTablaPorCodigo('mtyv', $data2);
cargarTablaPorCodigo('sanroque', $F2);

$TFR00005 = serieDesdeDbCsv($data2, $S, 'TFR00005', $trendverde, $trendrojo);
$TSF00001 = serieDesdeDbCsv($data2, $S, 'TSF00001', $trendverde, $trendrojo);
$TNVACV01 = serieSoloCsv($S, 'TNVACV01', $trendverde, $trendrojo);
$TFR00004 = serieDesdeDbCsv($data2, $S, 'TFR00004', $trendverde, $trendrojo);
$TBFR0003 = serieDesdeDbCsv($data2, $S, 'TBFR0003', $trendverde, $trendrojo);
$TBGA0002 = serieDesdeDbCsv($data2, $S, 'TBGA0002', $trendverde, $trendrojo, 'Flujo');
$TBGC0001 = serieDesdeDbCsv($data2, $S, 'TBGC0001', $trendverde, $trendrojo, 'Flujo');
$TBEF0002 = serieDesdeDbCsv($data2, $S, 'TBEF0002', $trendverde, $trendrojo, 'Flujo');
$TBEF0001 = serieDesdeDbCsv($data2, $S, 'TBEF0001', $trendverde, $trendrojo, 'Flujo');
$TBALR001 = serieDesdeDbCsv($data2, $S, 'TBALR001', $trendverde, $trendrojo, 'Flujo');

aplicarEstadosEquipo($TBGC0001, campoFila(filaCodigo($data2, 'TBGC0001'), 'ED_SD', 0), array(1, 2, 4, 8), 5, $Activo, $Inactivo);
aplicarEstadosEquipo($TBEF0002, campoFila(filaCodigo($data2, 'TBEF0002'), 'ED_SD', 0), array(1, 2, 4, 8), 5, $Activo, $Inactivo);
aplicarEstadosEquipo($TBEF0001, campoFila(filaCodigo($data2, 'TBEF0001'), 'ED_SD', 0), array(1, 2, 4, 8, 16), 5, $Activo, $Inactivo);
aplicarEstadosEquipo($TBALR001, campoFila(filaCodigo($data2, 'TBALR001'), 'ED_SD', 0), array(1, 2, 4, 8, 16, 32, 64), 5, $Activo, $Inactivo);

$nc1aRow = filaCodigo($data2, 'TNVAC001');
$nc1aSinCom = !tieneComunicacionDato(campoFila($nc1aRow, 'Hora', ''), $hhh, $hhs);
$TNVAC001 = serieDesdeDbCsv($data2, $S, 'TNVAC001', $trendverde, $trendrojo, 'Flujo');
aplicarEstadosEquipo($TNVAC001, campoFila($nc1aRow, 'ED_SD', 0), array(1, 2, 4, 8, 16, 32), 5, $Activo, $Inactivo);

$nc3Row = filaCodigo($data2, 'TNVAC003');
$nc3RectRow = filaCodigo($data2, 'TNVACR03');

$nc3RectTrend = tendenciaDesdeCsv($S, 'TNVAC003', 4, 100, $trendverde, $trendrojo, true);
$TNVACR03 = array(
  nivelDesdeFila($nc3RectRow),
  campoFila($nc3RectRow, 'Disp_2', 0),
  $nc3RectTrend[0],
  $nc3RectTrend[1],
  $nc3RectTrend[2],
  campoFila($nc3RectRow, 'Flujo', 0)
);

$nc3CircTrend = tendenciaDesdeCsv($S, 'TNVAC003', 5, 100, $trendverde, $trendrojo, true);
$TNVAC003 = array(
  nivelDesdeFila($nc3Row),
  campoFila($nc3RectRow, 'Disp_1', 0),
  $nc3CircTrend[0],
  $nc3CircTrend[1],
  $nc3CircTrend[2]
);
aplicarEstadosEquipo($TNVAC003, campoFila($nc3RectRow, 'ED_SD', 0), array(1, 2, 4, 8, 16, 64), 5, $Activo, $Inactivo);

$sr2Row = filaCodigo($data2, 'TBSR0002');
$sr2Trend = tendenciaDesdeCsv($S, 'TBSR0002', 4, 100, $trendverde, $trendrojo, true);
$TBSR0002 = array(
  nivelDesdeFila($sr2Row),
  campoFila($sr2Row, 'Flujo', 0),
  $sr2Trend[0],
  $sr2Trend[1],
  $sr2Trend[2],
  campoFila($sr2Row, 'Disp_1', 0),
  campoFila($sr2Row, 'Disp_2', 0)
);
aplicarEstadosEquipo($TBSR0002, campoFila($sr2Row, 'ED_SD', 0), array(1, 2, 4, 8), 7, $Activo, $Inactivo);
aplicarEstadosEquipo($TBSR0002, campoFila($sr2Row, 'Disp_3', 0), array(1, 2), 11, $Activo, $Inactivo);

$Salida = campoFila(filaCodigo($F2, 'MMAFU176'), 'Flujo', 0);
$DERIVACIONES = lpsNumero($Salida) - lpsNumero($TBSR0002[1]);
$BombasTotales = $Activo + $Inactivo;

if (!isset($TFR00005) || !is_array($TFR00005)) {
  $TFR00005 = array('0.00', 0, '0.00', '▼', 'down');
}

$laCruzRow = filaCodigo($data2, 'TSF00001');
$TBLACRUZ = isset($TSF00001) && is_array($TSF00001) ? $TSF00001 : array('0.00', 0, '0.00', '▼', 'down');

$laCruzTieneLink = true;
$laCruzDataUrl = urlGraficosHistoricos('TSF00001', 'TANQUE LA CRUZ', 'nivel', 'Nivel');

$estadoNivel = array(
  'fraile1' => claseNivelTanque(filaCodigo($data2, 'TBEF0001')),
  'fraile2' => claseNivelTanque(filaCodigo($data2, 'TBEF0002')),
  'fraile3' => claseNivelTanque(filaCodigo($data2, 'TBFR0003')),
  'fraile4' => claseNivelTanque(filaCodigo($data2, 'TFR00004')),
  'fraile5' => claseNivelTanque(filaCodigo($data2, 'TFR00005')),
  'garcia1' => claseNivelTanque(filaCodigo($data2, 'TBGC0001')),
  'garcia2' => claseNivelTanque(filaCodigo($data2, 'TBGA0002')),
  'laCruz' => claseNivelTanque($laCruzRow),
  'alianza' => claseNivelTanque(filaCodigo($data2, 'TBALR001')),
  'nc1a' => claseNivelTanque(filaCodigo($data2, 'TNVAC001')),
  'nc3' => claseNivelTanque(filaCodigo($data2, 'TNVAC003')),
  'redCienega' => claseNivelTanque(filaCodigo($data2, 'TNVACR03')),
  'nc3Extra' => claseNivelTanque(filaCodigo($data2, 'TNVACR03')),
  'sr2' => claseNivelTanque(filaCodigo($data2, 'TBSR0002'))
);

$estadoCom = array(
  'fraile1' => claseComTanque(filaCodigo($data2, 'TBEF0001'), $hhh, $hhs),
  'fraile2' => claseComTanque(filaCodigo($data2, 'TBEF0002'), $hhh, $hhs),
  'fraile3' => claseComTanque(filaCodigo($data2, 'TBFR0003'), $hhh, $hhs),
  'fraile4' => (
    claseComTanque(filaCodigo($data2, 'TFR00004'), $hhh, $hhs) === 'comm-visible' ||
    claseComTanque(filaCodigo($data2, 'TBMNAS01'), $hhh, $hhs) === 'comm-visible'
  ) ? 'comm-visible' : 'comm-hidden',
  'fraile5' => claseComTanque(filaCodigo($data2, 'TFR00005'), $hhh, $hhs),
  'garcia1' => claseComTanque(filaCodigo($data2, 'TBGC0001'), $hhh, $hhs),
  'garcia2' => claseComTanque(filaCodigo($data2, 'TBGA0002'), $hhh, $hhs),
  'laCruz' => claseComTanque($laCruzRow, $hhh, $hhs),
  'alianza' => claseComTanque(filaCodigo($data2, 'TBALR001'), $hhh, $hhs),
  'nc1a' => claseComTanque(filaCodigo($data2, 'TNVAC001'), $hhh, $hhs),
  'nc3' => claseComTanque(filaCodigo($data2, 'TNVACR03'), $hhh, $hhs),
  'redCienega' => claseComTanque(filaCodigo($data2, 'TNVACR03'), $hhh, $hhs),
  'nc3Extra' => claseComTanque(filaCodigo($data2, 'TNVACR03'), $hhh, $hhs),
  'sr2' => claseComTanque(filaCodigo($data2, 'TBSR0002'), $hhh, $hhs)
);

function apiMtyvNumero($v)
{
  return numeroDato($v);
}
function apiMtyvTanque($nombre, $codigo, $serie, $fila, $capacidadCm, $tieneCsv = false)
{
  $presente = is_array($fila) && count($fila) > 0;
  if ($tieneCsv) {
    $presente = true;
  }
  $nivel = $presente && isset($serie[0]) ? apiMtyvNumero($serie[0]) : null;
  if (!$tieneCsv && !isset($fila['Nivel']))
    $nivel = null;
  $trend = $presente && isset($serie[2]) ? apiMtyvNumero($serie[2]) : null;
  $trendCode = ($codigo === 'TNVACR03' || $codigo === 'TNVAC003') ? 'TNVAC003' : $codigo;
  $trendColumn = ($codigo === 'TNVAC003') ? 5 : 4;
  $trendSamples = leerValoresCsv($GLOBALS['S'], $trendCode, $trendColumn);
  if (count($trendSamples) <= 1)
    $trend = null;
  $hora = $presente ? trim((string) campoFila($fila, 'Hora', '')) : '';
  $com = !$presente ? 'sin_datos' : ($tieneCsv && empty($fila) ? 'csv' : (tieneComunicacionDato($hora, $GLOBALS['hhh'], $GLOBALS['hhs']) ? 'actual' : 'sin_comunicacion'));
  $nivelAlerta = $com === 'actual' ? claseNivelTanque($fila) : 'level-normal';
  return array(
    'nombre' => $nombre,
    'codigo' => $codigo,
    'nivel_m' => $nivel,
    'tendencia_m' => $trend,
    'estado' => $com,
    'en_observacion' => ($nivelAlerta === 'level-warning' || $nivelAlerta === 'level-critical'),
    'hora' => $hora === '' ? null : $hora,
    'capacidad_cm' => (int) $capacidadCm,
    'porcentaje' => $nivel === null ? null : max(0, min(100, ($nivel * 10000) / $capacidadCm))
  );
}
function apiMtyvFlujo($dato, $fila, $key, $campo = null)
{
  $presente = is_array($fila) && count($fila) > 0;
  $campoValido = $campo === null || ($presente && array_key_exists($campo, $fila) && apiMtyvNumero($fila[$campo]) !== null);
  $v = $presente && $campoValido ? apiMtyvNumero($dato) : null;
  $estado = $v === null ? 'sin_datos' :
    (tieneComunicacionDato(campoFila($fila, 'Hora', ''), $GLOBALS['hhh'], $GLOBALS['hhs']) ? 'actual' : 'sin_comunicacion');
  return array('key' => $key, 'lps' => $v, 'estado' => $estado);
}
function apiMtyvBomba($fila, $bit)
{
  if (!is_array($fila) || count($fila) === 0 || !isset($fila['ED_SD']))
    return null;
  return ((((int) $fila['ED_SD']) & $bit) !== 0);
}
function apiMtyvBombaDisp($fila, $bit)
{
  if (!is_array($fila) || count($fila) === 0 || !isset($fila['Disp_3']))
    return null;
  return ((((int) $fila['Disp_3']) & $bit) !== 0);
}
$mapa = array(
  'FRAILE 5' => array('TFR00005', $TFR00005),
  'FRAILE 4' => array('TFR00004', $TFR00004),
  'FRAILE 3' => array('TBFR0003', $TBFR0003),
  'FRAILE 1' => array('TBEF0001', $TBEF0001),
  'FRAILE 2' => array('TBEF0002', $TBEF0002),
  'GARCÍA 1' => array('TBGC0001', $TBGC0001),
  'LA CRUZ' => array('TSF00001', $TBLACRUZ),
  'GARCÍA 2' => array('TBGA0002', $TBGA0002),
  'ALIANZA REAL' => array('TBALR001', $TBALR001),
  'NUEVA CASTILLA / AMP' => array('TNVAC001', $TNVAC001),
  'NUEVA CASTILLA 1' => array('TNVACV01', $TNVACV01),
  'RECTANGULAR' => array('TNVACR03', $TNVACR03),
  'CIRCULAR' => array('TNVAC003', $TNVAC003),
  'SANTA ROSA 2' => array('TBSR0002', $TBSR0002)
);
$niveles = array();
$valoresCsvNC1 = leerValoresCsv($S, 'TNVACV01', 4);
foreach ($mapa as $name => $ref) {
  $code = $ref[0];
  $serie = $ref[1];
  $fila = filaCodigo($data2, $code);
  $csv = ($code === 'TNVACV01' && count($valoresCsvNC1) > 0);
  $niveles[$name] = apiMtyvTanque($name, $code, $serie, $fila, capacidadTanquePorCodigo($code), $csv);
}
$rFraile1 = filaCodigo($data2, 'TBEF0001');
$rFraile2 = filaCodigo($data2, 'TBEF0002');
$rGarcia1 = filaCodigo($data2, 'TBGC0001');
$rGarcia2 = filaCodigo($data2, 'TBGA0002');
$rAlianza = filaCodigo($data2, 'TBALR001');
$rNC1 = filaCodigo($data2, 'TNVAC001');
$rNCR = filaCodigo($data2, 'TNVACR03');
$rNCC = filaCodigo($data2, 'TNVAC003');
$rSR2 = filaCodigo($data2, 'TBSR0002');
$rMMA = filaCodigo($F2, 'MMAFU176');
$flujoMap = array(
  'fraile1_salida' => apiMtyvFlujo(isset($TBEF0001[1]) ? $TBEF0001[1] : null, $rFraile1, 'fraile1_salida', 'Flujo'),
  'fraile2_llegada' => apiMtyvFlujo(isset($TBEF0002[1]) ? $TBEF0002[1] : null, $rFraile2, 'fraile2_llegada', 'Flujo'),
  'garcia1_red' => apiMtyvFlujo(isset($TBGC0001[1]) ? $TBGC0001[1] : null, $rGarcia1, 'garcia1_red', 'Flujo'),
  'garcia2_red' => apiMtyvFlujo(isset($TBGA0002[1]) ? $TBGA0002[1] : null, $rGarcia2, 'garcia2_red', 'Flujo'),
  'alianza_fraile1' => apiMtyvFlujo(isset($TBALR001[1]) ? $TBALR001[1] : null, $rAlianza, 'alianza_fraile1', 'Flujo'),
  'castilla_amp_alianza' => apiMtyvFlujo(isset($TNVAC001[1]) ? $TNVAC001[1] : null, $rNC1, 'castilla_amp_alianza', 'Flujo'),
  'castilla3_amp' => apiMtyvFlujo(isset($TNVACR03[5]) ? $TNVACR03[5] : null, $rNCR, 'castilla3_amp', 'Flujo'),
  'zuazua' => apiMtyvFlujo(isset($TNVACR03[1]) ? $TNVACR03[1] : null, $rNCR, 'zuazua', 'Disp_2'),
  'cienega' => apiMtyvFlujo(isset($TNVAC003[1]) ? $TNVAC003[1] : null, $rNCR, 'cienega', 'Disp_1'),
  'pesqueria' => apiMtyvFlujo(isset($TBSR0002[6]) ? $TBSR0002[6] : null, $rSR2, 'pesqueria', 'Disp_2'),
  'santarosa_castilla3' => apiMtyvFlujo(isset($TBSR0002[5]) ? $TBSR0002[5] : null, $rSR2, 'santarosa_castilla3', 'Disp_1'),
  'santarosa_llegada' => apiMtyvFlujo(isset($TBSR0002[1]) ? $TBSR0002[1] : null, $rSR2, 'santarosa_llegada', 'Flujo'),
  'monterreyv_salida' => apiMtyvFlujo($Salida, $rMMA, 'monterreyv_salida', 'Flujo'),
  'derivaciones' => apiMtyvFlujo($DERIVACIONES, $rMMA, 'derivaciones')
);

if (
  count($rSR2) === 0 || count($rMMA) === 0 ||
  !isset($rSR2['Flujo']) || !isset($rMMA['Flujo']) ||
  apiMtyvNumero($rSR2['Flujo']) === null || apiMtyvNumero($rMMA['Flujo']) === null
) {
  $flujoMap['derivaciones']['lps'] = null;
  $flujoMap['derivaciones']['estado'] = 'sin_datos';
}
$grupos = array();
function apiMtyvBanderas($fila, $bits)
{
  $r = array();
  foreach ($bits as $b)
    $r[] = apiMtyvBomba($fila, $b);
  return $r;
}
$grupos['FRAILE 1 → FRAILE 3'] = apiMtyvBanderas($rFraile1, array(1, 2, 4, 8));

$grupos['BOMB. REAL DE MINAS'] = array(apiMtyvBomba($rFraile1, 16));
$grupos['FRAILE 2 → GARCÍA 1'] = apiMtyvBanderas($rFraile2, array(1, 2, 4, 8));
$grupos['GARCÍA 1 → GARCÍA 2'] = apiMtyvBanderas($rGarcia1, array(1, 2, 4, 8));
$allAlianza = apiMtyvBanderas($rAlianza, array(1, 2, 4, 8, 16, 32, 64));
$grupos['ENTRADA ALIANZA REAL'] = array_slice($allAlianza, 0, 5);
$grupos['ALIANZA REAL → NUEVA CASTILLA AMP'] = apiMtyvBanderas($rNC1, array(1, 2, 4, 8, 16, 32));
$grupos['NUEVA CASTILLA AMP → RECTANGULAR'] = apiMtyvBanderas($rNCR, array(1, 2, 4, 8, 16, 64));
$grupos['RECTANGULAR → SANTA ROSA 2'] = array_merge(apiMtyvBanderas($rSR2, array(1, 2, 4, 8)), array(apiMtyvBombaDisp($rSR2, 1), apiMtyvBombaDisp($rSR2, 2)));
$grupos['BOMB. MITRAS PONIENTE'] = array_slice($allAlianza, 5, 2);
$validos = 0;
$sinCom = 0;
foreach ($niveles as $val) {
  if ($val['nivel_m'] !== null)
    $validos++;
  if ($val['estado'] === 'sin_comunicacion')
    $sinCom++;
}
if ($validos === 0) {
  http_response_code(503);
}
$respuesta = array(
  'ok' => $validos > 0,
  'fuente' => 'Backend Monterrey V (base de datos y CSV)',
  'actualizado' => date('Y-m-d H:i:s'),
  'fecha_fuente' => $S,
  'total_tanques_con_lectura' => $validos,
  'tanques_sin_comunicacion' => $sinCom,
  'tanques' => $niveles,
  'flujos' => $flujoMap,
  'bombas' => $grupos,
  'resumen' => array('tendencias_altas' => (int) $trendverde, 'tendencias_bajas' => (int) $trendrojo, 'bombas_activas' => (int) $Activo, 'bombas_inactivas' => (int) $Inactivo)
);
if (!$respuesta['ok'])
  $respuesta['error'] = 'No se pudieron leer niveles del sistema actual; revisar conexión de base de datos y CSV';
echo json_encode($respuesta);
