<?php
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');
date_default_timezone_set('America/Monterrey');

$allowed = array('PRESACP', 'LINPB001', 'LINPB002', 'LINPB02A', 'LINPB003', 'ROMPE001', 'LINPB004', 'PPLLN001', 'PBSRQ005', 'TACPSR01', 'TACPSR02', 'TGRP0001');
$code = isset($_GET['codigo']) ? strtoupper(trim((string)$_GET['codigo'])) : '';
$hours = isset($_GET['horas']) ? (int)$_GET['horas'] : 6;
if (!in_array($code, $allowed, true) || !in_array($hours, array(6, 24), true)) {
    http_response_code(400);
    echo json_encode(array('ok' => false, 'error' => 'Parámetros no válidos'));
    exit;
}
function lhNumber($value) {
    if ($value === null || is_array($value)) return null;
    $s = trim((string)$value);
    if ($s === '' || strcasecmp($s, 'N/D') === 0) return null;
    if (strpos($s, ',') !== false && strpos($s, '.') !== false) $s = str_replace(',', '', $s);
    elseif (strpos($s, ',') !== false) $s = str_replace(',', '.', $s);
    if (!is_numeric($s)) return null;
    $v = (float)$s;
    return is_finite($v) && abs($v) < 10000000 ? $v : null;
}
function lhTimestamp($row, $keys, $zone) {
    $date = isset($keys['DATE'], $row[$keys['DATE']]) ? trim($row[$keys['DATE']]) : (isset($row[0]) ? trim($row[0]) : '');
    if (isset($keys['TIME'], $row[$keys['TIME']])) $time = trim($row[$keys['TIME']]);
    elseif (isset($row[2], $row[3]) && is_numeric($row[2]) && is_numeric($row[3])) $time = sprintf('%02d:%02d:00', (int)$row[2], (int)$row[3]);
    elseif (isset($row[1])) $time = trim($row[1]);
    else return null;
    if (preg_match('/^\d{1,2}:\d{2}$/', $time)) $time .= ':00';
    foreach (array('d/m/Y', 'Y/m/d', 'Y-m-d', 'd-m-Y', 'd/m/y', 'y-m-d') as $format) {
        $dt = DateTimeImmutable::createFromFormat('!' . $format . ' H:i:s', $date . ' ' . $time, $zone);
        if ($dt) return $dt->getTimestamp();
    }
    return null;
}
$zone = new DateTimeZone('America/Monterrey');
$now = time();
$start = $now - $hours * 3600;
$root = '';
foreach (array(dirname(dirname(__DIR__)) . '/lecturas', dirname(dirname(__DIR__)) . '/Lecturas', dirname(__DIR__) . '/lecturas') as $dir) {
    if (is_dir($dir) && is_readable($dir)) { $root = $dir; break; }
}
$levels = array();
$flows = array();
$files = 0;
if ($root !== '') {
    for ($days = 1; $days >= 0; $days--) {
        $day = (new DateTimeImmutable('today', $zone))->modify('-' . $days . ' day');
        $filename = null;
        foreach (array('.CSV', '.csv') as $extension) {
            $candidate = $root . '/' . $day->format('ymd') . '00_' . ($code === 'PRESACP' ? 'OBTO0002' : $code) . $extension;
            if (is_readable($candidate)) { $filename = $candidate; break; }
        }
        if ($filename === null) continue;
        $file = @fopen($filename, 'r');
        if (!$file) continue;
        $header = fgetcsv($file, 8192, ',');
        if (!$header) { fclose($file); continue; }
        $keys = array();
        foreach ($header as $i => $h) {
            $key = strtoupper(trim((string)preg_replace('/^\xEF\xBB\xBF/', '', $h)));
            if ($key !== '') $keys[$key] = $i;
        }
        if ($code === 'PRESACP') $keys['NI0000001'] = isset($keys['ELEV0001']) ? $keys['ELEV0001'] : 4;
        if (!isset($keys['NI0000001']) && !isset($keys['FL0000001'])) { fclose($file); continue; }
        while (($row = fgetcsv($file, 8192, ',')) !== false) {
            $timestamp = lhTimestamp($row, $keys, $zone);
            if ($timestamp === null || $timestamp < $start || $timestamp > $now + 60) continue;
            $ms = $timestamp * 1000;
            $k = (string)$ms;
            if (isset($keys['NI0000001'], $row[$keys['NI0000001']])) {
                $value = lhNumber($row[$keys['NI0000001']]);
                if ($value !== null && $value > 0 && $value < 9000) $levels[$k] = array($ms, $code === 'PRESACP' ? round($value, 2) : round($value / 100, 3));
            }
            if (isset($keys['FL0000001'], $row[$keys['FL0000001']])) {
                $value = lhNumber($row[$keys['FL0000001']]);
                if ($value !== null) $flows[$k] = array($ms, $value);
            }
        }
        fclose($file);
        $files++;
    }
}
ksort($levels, SORT_NUMERIC);
ksort($flows, SORT_NUMERIC);
echo json_encode(array('ok' => true, 'codigo' => $code, 'level' => array_values($levels),
    'flow' => array_values($flows), 'files' => $files), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
