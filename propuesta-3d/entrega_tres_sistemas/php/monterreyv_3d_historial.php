<?php
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
date_default_timezone_set('America/Monterrey');

$catalog = array(
    'FRAILE 5' => array('file' => 'TFR00005', 'level' => 'NI0000001', 'flows' => array()),
    'FRAILE 4' => array('file' => 'TFR00004', 'level' => 'NI0000001', 'flows' => array()),
    'FRAILE 3' => array('file' => 'TBFR0003', 'level' => 'NI0000001', 'flows' => array()),
    'FRAILE 1' => array('file' => 'TBEF0001', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'Salida')),
    'FRAILE 2' => array('file' => 'TBEF0002', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'Llegada')),
    'GARCÍA 1' => array('file' => 'TBGC0001', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'A red')),
    'LA CRUZ' => array('file' => 'TSF00001', 'level' => 'NI0000001', 'flows' => array()),
    'GARCÍA 2' => array('file' => 'TBGA0002', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'A red')),
    'ALIANZA REAL' => array('file' => 'TBALR001', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'Flujo')),
    'NUEVA CASTILLA / AMP' => array('file' => 'TNVAC001', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'Flujo')),
    'NUEVA CASTILLA 1' => array('file' => 'TNVACV01', 'level' => 'NI0000001', 'flows' => array()),
    'RECTANGULAR' => array('file' => 'TNVAC003', 'level' => 'NI0000001', 'flows' => array('FL0000003' => 'A Zuazua', 'FL0000001' => 'A Nueva Castilla I Amp.')),
    'CIRCULAR' => array('file' => 'TNVAC003', 'level' => 'NI0000002', 'flows' => array('FL0000002' => 'A Ciénega de Flores')),
    'SANTA ROSA 2' => array('file' => 'TBSR0002', 'level' => 'NI0000001', 'flows' => array('FL0000001' => 'Llegada', 'FL0000002' => 'Salida', 'FL0000003' => 'A Pesquería'))
);

$tank = isset($_GET['tanque']) ? trim((string) $_GET['tanque']) : '';
$hours = isset($_GET['horas']) ? (int) $_GET['horas'] : 24;
if (!isset($catalog[$tank]) || !in_array($hours, array(6, 24), true)) {
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(array('ok' => false, 'error' => 'Tanque o período no válido'));
    exit;
}

$cacheKey = 'mtyv3d_historial_v1_' . md5($tank . '|' . $hours);
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
foreach ($spec['flows'] as $tag => $label)
    $flowPoints[$tag] = array();
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
        if ($path === '')
            continue;
        $fp = @fopen($path, 'r');
        if (!$fp)
            continue;
        $header = fgetcsv($fp, 16000, ',');
        if (!is_array($header)) {
            fclose($fp);
            continue;
        }
        $filesFound++;
        $indexes = array();
        foreach ($header as $idx => $value) {
            $tag = strtoupper(trim(preg_replace('/^\xEF\xBB\xBF/', '', (string) $value)));
            if ($tag !== '')
                $indexes[$tag] = $idx;
        }
        $dateColumn = isset($indexes['DATE']) ? $indexes['DATE'] : (isset($indexes['FECHA']) ? $indexes['FECHA'] : 0);
        $timeColumn = isset($indexes['TIME']) ? $indexes['TIME'] : (isset($indexes['HORA']) ? $indexes['HORA'] : 1);
        $levelIndex = isset($indexes[$spec['level']]) ? $indexes[$spec['level']] : null;
        $flowIndexes = array();
        foreach ($spec['flows'] as $tag => $label) {
            if (isset($indexes[$tag]))
                $flowIndexes[$tag] = $indexes[$tag];
        }
        if ($levelIndex === null && empty($flowIndexes)) {
            fclose($fp);
            continue;
        }
        while (($row = fgetcsv($fp, 16000, ',')) !== false) {
            if (!isset($row[$dateColumn]) || !isset($row[$timeColumn]))
                continue;
            $dateRaw = trim($row[$dateColumn]);
            $timeRaw = trim($row[$timeColumn]);
            if ($dateRaw === '' || $timeRaw === '')
                continue;
            $timestamp = false;
            foreach (array('Y/m/d H:i:s', 'Y-m-d H:i:s', 'd/m/Y H:i:s', 'Y/m/d H:i', 'Y-m-d H:i', 'd/m/Y H:i') as $format) {
                $dt = DateTime::createFromFormat('!' . $format, $dateRaw . ' ' . $timeRaw, $tz);
                if (!$dt)
                    continue;
                $errors = DateTime::getLastErrors();
                if ($errors === false || ((int) $errors['warning_count'] === 0 && (int) $errors['error_count'] === 0)) {
                    $timestamp = $dt->getTimestamp();
                    break;
                }
            }
            if ($timestamp === false || $timestamp < $from || $timestamp > $now + 60)
                continue;
            $ms = $timestamp * 1000;
            if ($levelIndex !== null && isset($row[$levelIndex])) {
                $raw = trim($row[$levelIndex]);
                if ($raw !== '' && is_numeric($raw)) {
                    $number = (float) $raw;
                    if (is_finite($number) && $number >= 0)
                        $levelPoints[$ms] = array($ms, round($number / 100, 4));
                }
            }
            foreach ($flowIndexes as $tag => $index) {
                if (!isset($row[$index]))
                    continue;
                $raw = trim($row[$index]);
                if ($raw !== '' && is_numeric($raw)) {
                    $number = (float) $raw;
                    if (is_finite($number))
                        $flowPoints[$tag][$ms] = array($ms, $number);
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
if (function_exists('apcu_store'))
    @apcu_store($cacheKey, $result, 60);
echo json_encode($result);
