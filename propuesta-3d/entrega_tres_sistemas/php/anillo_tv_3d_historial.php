<?php
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
date_default_timezone_set('America/Monterrey');

$catalog = array(
  'LA CRUZ' => array('file' => 'TSF00001', 'level' => 'NI0000001', 'flows' => array()),
  'FRAILE 5' => array('file' => 'TFR00005', 'level' => 'NI0000001', 'flows' => array()),
  'GARCÍA 2' => array('file' => 'TBGA0002', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'LPS 167')),
  'GARCÍA 1' => array('file' => 'TBGC0001', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'LPS 0A')),
  'FRAILE 2' => array('file' => 'TBEF0002', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'LPS 0D')),
  'FRAILE 4' => array('file' => 'TFR00004', 'level' => 'NI0000001', 'flows' => array()),
  'FRAILE 3' => array('file' => 'TBFR0003', 'level' => 'NI0000001', 'flows' => array()),
  'FRAILE 1' => array('file' => 'TBEF0001', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'LPS SALIDA FRAILE1')),
  'REAL DE MINA' => array('file' => 'TBMNAS01', 'level' => 'NI0000001', 'flows' => array()),
  'ALIANZA REAL' => array('file' => 'TBALR001', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'LPS 542')),
  'NUEVA CASTILLA AMP' => array('file' => 'TNVAC001', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'LPS 908')),
  'NUEVA CASTILLA 3 RECTANGULAR' => array('file' => 'TNVAC003', 'level' => 'NI0000001', 'flows' => array('FL0000003' => 'Red Zuazua','FL0000001' => 'A Nueva Castilla I Amp.')),
  'NUEVA CASTILLA 3 CIRCULAR' => array('file' => 'TNVAC003', 'level' => 'NI0000002', 'flows' => array('FL0000002' => 'A Ciénega de Flores')),
  'SANTA ROSA 2' => array('file' => 'TBSR0002', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'LPS 8766','FL0000002' => 'LPS SANTA ROSA2 SALIDA','FL0000003' => 'LPS 211')),
  'ESCOBEDO' => array('file' => 'TBESCO01', 'level' => 'NI0000001', 'flows' => array('FL0000002' => 'LPS 304B')),
  'APODACA' => array('file' => 'TBAPO001', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'LPS 304A')),
  'MIGUEL ALEMÁN' => array('file' => 'TBMAL001', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'LPS MIGUEL ALEMAN 0')),
  'LA PAZ 2' => array('file' => 'TLAP0002', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'LPS LA PAZ2 DOWN ZERO')),
  'LA PAZ 1' => array('file' => 'TLAP0001', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'LPS LA PAZ1 DOWN ZERO')),
  'SAN ROQUE OTE' => array('file' => 'TBSRO003', 'level' => 'NI0000001', 'flows' => array()),
  'CAÑADA' => array('file' => 'TBCND001', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'LPS 304C','FL0000002' => 'LPS 304D')),
  'SAN NICOLÁS' => array('file' => 'TBSNC001', 'level' => 'NI0000001', 'flows' => array()),
  'PENAL' => array('file' => 'TBPENA01', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'LPS LL A PENAL','FL0000003' => 'LPS PENAL BOTTOM MANUAL')),
  'TOPO CHICO' => array('file' => 'TBTOP001', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'LPS 0C')),
  'SAN MARTÍN 1' => array('file' => 'TBSMA001', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'LPS RED SANMARTIN','FL0000002' => 'LPS PENAL-SANMARTIN')),
  'SAN BERNABÉ RECTANGULAR' => array('file' => 'TBSBR01', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'LPS SAN BERN RECT ZERO')),
  'SAN BERNABÉ CIRCULAR' => array('file' => 'TBSBC01', 'level' => 'NI0000001', 'flows' => array()),
  'OBISPADO' => array('file' => 'TOBISP01', 'level' => 'NI0000001', 'flows' => array()),
  'VALLE 2' => array('file' => 'TVALLE02', 'level' => 'NI0000001', 'flows' => array()),
  'VALLE 4' => array('file' => 'TBVAL004', 'level' => 'NI0000001', 'flows' => array()),
  'LOMA LARGA' => array('file' => 'TBLL0001', 'level' => 'NI0000001', 'flows' => array('FL0000002' => 'LPS LOMALARGAOBISPADO','FL0000003' => 'LPS LOMALARGAVALLE','FL0000001' => 'LPS LOMALARGARED')),
  'SUR' => array('file' => 'TBSU0001', 'level' => 'NI0000001', 'flows' => array()),
  'ALTAMIRA 2' => array('file' => 'TBALTA02', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'LPS A ALLTAMIRA3')),
  'LA SILLA 1' => array('file' => 'TBSILLA1', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'LPS LA SILLA1 DOWN MANUAL')),
  'JUÁREZ' => array('file' => 'TJUA0001', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'LPS LLEGADAJUAREZ','FL0000002' => 'LPS SALIDAJUAREZ')),
  'ARBOLEDAS 2' => array('file' => 'TARB0002', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'ARB2-SALIDO-ARB3'))
);

$tank = isset($_GET['tanque']) ? trim((string) $_GET['tanque']) : '';
$hours = isset($_GET['horas']) ? (int) $_GET['horas'] : 24;
if (!isset($catalog[$tank]) || !in_array($hours, array(6, 24), true)) {
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(array('ok' => false, 'error' => 'Tanque o período no válido'));
    exit;
}

$cacheKey = 'anillotv3d_historial_v1_' . md5($tank . '|' . $hours);
if (function_exists('apcu_fetch')) {
    $fromCache = apcu_fetch($cacheKey, $cacheHit);
    if ($cacheHit && is_array($fromCache)) {
        echo json_encode($fromCache);
        exit;
    }
}

$spec = $catalog[$tank];
$now = time();
$from = $now - $hours * 3600;
$tz = new DateTimeZone('America/Monterrey');
$files = array();
$possibleBases = array(
    dirname(dirname(__DIR__)) . '/lecturas',
    dirname(dirname(__DIR__)) . '/Lecturas',
    dirname(__DIR__) . '/lecturas',
    dirname(__DIR__) . '/Lecturas'
);
$validBase = '';
foreach ($possibleBases as $base) {
    if (is_dir($base) && is_readable($base)) {
        $validBase = $base;
        break;
    }
}

$levelPoints = array();
$flowPoints = array();
foreach ($spec['flows'] as $tag => $label) $flowPoints[$tag] = array();
$filesFound = 0;

if ($validBase !== '') {
    $startDay = strtotime(date('Y-m-d', $from) . ' 00:00:00');
    $endDay = strtotime(date('Y-m-d', $now) . ' 00:00:00');
    for ($day = $startDay; $day <= $endDay; $day = strtotime('+1 day', $day)) {
        $prefix = date('ymd', $day) . '00_' . $spec['file'];
        $path = '';
        foreach (array('.CSV', '.csv') as $extension) {
            $candidate = $validBase . DIRECTORY_SEPARATOR . $prefix . $extension;
            if (is_file($candidate) && is_readable($candidate)) {
                $path = $candidate;
                break;
            }
        }
        if ($path === '') continue;
        $fp = @fopen($path, 'r');
        if (!$fp) continue;
        $header = fgetcsv($fp, 16000, ',');
        if (!is_array($header)) {
            fclose($fp);
            continue;
        }
        $filesFound++;
        $indexes = array();
        foreach ($header as $idx => $value) {
            $tag = strtoupper(trim(preg_replace('/^\xEF\xBB\xBF/', '', (string) $value)));
            if ($tag !== '') $indexes[$tag] = $idx;
        }
        $dateColumn = isset($indexes['DATE']) ? $indexes['DATE'] : (isset($indexes['FECHA']) ? $indexes['FECHA'] : 0);
        $timeColumn = isset($indexes['TIME']) ? $indexes['TIME'] : (isset($indexes['HORA']) ? $indexes['HORA'] : 1);
        $levelIndex = isset($indexes[$spec['level']]) ? $indexes[$spec['level']] : null;
        $flowIndexes = array();
        foreach ($spec['flows'] as $tag => $label) {
            if (isset($indexes[$tag])) $flowIndexes[$tag] = $indexes[$tag];
        }
        if ($levelIndex === null && empty($flowIndexes)) {
            fclose($fp);
            continue;
        }
        while (($row = fgetcsv($fp, 16000, ',')) !== false) {
            if (!isset($row[$dateColumn]) || !isset($row[$timeColumn])) continue;
            $dateRaw = trim($row[$dateColumn]);
            $timeRaw = trim($row[$timeColumn]);
            if ($dateRaw === '' || $timeRaw === '') continue;
            $timestamp = false;
            foreach (array('Y/m/d H:i:s', 'Y-m-d H:i:s', 'd/m/Y H:i:s', 'Y/m/d H:i', 'Y-m-d H:i', 'd/m/Y H:i') as $format) {
                $dt = DateTime::createFromFormat('!' . $format, $dateRaw . ' ' . $timeRaw, $tz);
                if (!$dt) continue;
                $errors = DateTime::getLastErrors();
                if ($errors === false || ((int) $errors['warning_count'] === 0 && (int) $errors['error_count'] === 0)) {
                    $timestamp = $dt->getTimestamp();
                    break;
                }
            }
            if ($timestamp === false || $timestamp < $from || $timestamp > $now + 60) continue;
            $ms = $timestamp * 1000;
            if ($levelIndex !== null && isset($row[$levelIndex])) {
                $raw = trim($row[$levelIndex]);
                if ($raw !== '' && is_numeric($raw)) {
                    $number = (float) $raw;
                    if (is_finite($number) && $number >= 0) $levelPoints[$ms] = array($ms, round($number / 100, 4));
                }
            }
            foreach ($flowIndexes as $tag => $index) {
                if (!isset($row[$index])) continue;
                $raw = trim($row[$index]);
                if ($raw !== '' && is_numeric($raw)) {
                    $number = (float) $raw;
                    if (is_finite($number)) $flowPoints[$tag][$ms] = array($ms, $number);
                }
            }
        }
        fclose($fp);
    }
}

ksort($levelPoints, SORT_NUMERIC);
$levelPoints = array_values($levelPoints);
$flows = array();
foreach ($spec['flows'] as $tag => $label) {
    ksort($flowPoints[$tag], SORT_NUMERIC);
    $values = array_values($flowPoints[$tag]);
    $flows[] = array('id' => $tag, 'nombre' => $label, 'unidad' => 'LPS', 'puntos' => $values, 'cantidad' => count($values));
}

$result = array(
    'ok' => true,
    'tanque' => $tank,
    'codigo' => $spec['file'],
    'horas' => $hours,
    'desde' => $from * 1000,
    'hasta' => $now * 1000,
    'archivos_leidos' => $filesFound,
    'nivel' => array('unidad' => 'm', 'puntos' => $levelPoints, 'cantidad' => count($levelPoints)),
    'flujos' => $flows
);
if (function_exists('apcu_store')) @apcu_store($cacheKey, $result, 60);
echo json_encode($result);
