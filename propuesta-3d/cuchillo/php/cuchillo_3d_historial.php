<?php

ini_set('display_errors', '0');
error_reporting(E_ERROR | E_PARSE);
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$lhBase = dirname(dirname(dirname(__FILE__)));
if (is_file($lhBase . '/CambioHorario/horario.php')) { ob_start(); @include_once($lhBase . '/CambioHorario/horario.php'); ob_end_clean(); }

$allowed = array('PRESACU', 'CHIPB000', 'CHIPB001', 'CHIPB002', 'CHIPB003', 'CHIPB004', 'CHIPB200', 'CHIPB201', 'CHIPB202', 'CHIPB203', 'CHIPB204', 'PBSRQ005', 'TSACII01', 'TSACII02', 'TSACII03', 'TSACII04');
$code = isset($_GET['codigo']) ? strtoupper(trim((string)$_GET['codigo'])) : '';
$hours = isset($_GET['horas']) ? (int)$_GET['horas'] : 6;
if (!in_array($code, $allowed, true) || ($hours != 6 && $hours != 24)) {
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(array('ok' => false, 'error' => 'Parámetros no válidos'));
    exit;
}
$fileCode = $code === 'PRESACU' ? 'OBTO003' : $code;

function lhNumber($value) {
    if ($value === null || is_array($value)) return null;
    $s = trim((string)$value);
    if ($s === '' || strcasecmp($s, 'N/D') === 0) return null;
    if (strpos($s, ',') !== false && strpos($s, '.') !== false) $s = str_replace(',', '', $s);
    elseif (strpos($s, ',') !== false) $s = str_replace(',', '.', $s);
    if (!is_numeric($s)) return null;
    $v = (float)$s;
    if (is_nan($v) || is_infinite($v) || abs($v) >= 10000000) return null;
    return $v;
}

function lhTimestamp($row, $fileDay) {
    if (!isset($row[2], $row[3]) || !is_numeric($row[2]) || !is_numeric($row[3])) return null;
    $p = preg_split('/[\/\-]/', trim(isset($row[0]) ? (string)$row[0] : ''));
    if (count($p) == 3 && is_numeric($p[0]) && is_numeric($p[1]) && is_numeric($p[2])) {
        if (strlen($p[2]) == 4) { $d = (int)$p[0]; $m = (int)$p[1]; $y = (int)$p[2]; }
        else { $y = (int)$p[0]; if ($y < 100) $y += 2000; $m = (int)$p[1]; $d = (int)$p[2]; }
    } else {
        $y = (int)('20' . substr($fileDay, 0, 2)); $m = (int)substr($fileDay, 2, 2); $d = (int)substr($fileDay, 4, 2);
    }
    if ($m < 1 || $m > 12 || $d < 1 || $d > 31) {
        $y = (int)('20' . substr($fileDay, 0, 2)); $m = (int)substr($fileDay, 2, 2); $d = (int)substr($fileDay, 4, 2);
    }
    return mktime((int)$row[2], (int)$row[3], 0, $m, $d, $y);
}

function lhDirs() {
    global $lhBase;
    $out = array();
    foreach (array($lhBase, realpath('../..')) as $b) {
        if (!$b) continue;
        foreach (array('lecturas', 'Lecturas', 'LECTURAS') as $s) { $d = rtrim($b, '/\\') . '/' . $s; if (is_dir($d) && !in_array($d, $out)) $out[] = $d; }
    }
    if (is_dir('../../lecturas') && !in_array('../../lecturas', $out)) $out[] = '../../lecturas';
    return $out;
}

$now = time();
$start = $now - $hours * 3600;
$levels = array();
$flows = array();
$files = 0;
foreach (array(date('ymd', $now - 86400), date('ymd', $now)) as $day) {
    $file = null;
    foreach (lhDirs() as $dir) {
        foreach (array('.CSV', '.csv') as $ext) {
            if (is_readable($dir . '/' . $day . '00_' . $fileCode . $ext)) { $file = $dir . '/' . $day . '00_' . $fileCode . $ext; break 2; }
        }
    }
    if ($file === null) continue;
    $fp = @fopen($file, 'r');
    if (!$fp) continue;
    $header = fgetcsv($fp, 8192, ',');
    $keys = array();
    if (is_array($header)) foreach ($header as $i => $h) {
        $k = strtoupper(trim(preg_replace('/^\xEF\xBB\xBF/', '', (string)$h)));
        if ($k !== '') $keys[$k] = $i;
    }
    $lvCol = $code === 'PRESACU' ? (isset($keys['ELEV0001']) ? $keys['ELEV0001'] : 4) : (isset($keys['NI0000001']) ? $keys['NI0000001'] : null);
    $flCol = isset($keys['FL0000001']) ? $keys['FL0000001'] : null;
    while (($row = fgetcsv($fp, 8192, ',')) !== false) {
        $ts = lhTimestamp($row, $day);
        if ($ts === null || $ts === false || $ts < $start || $ts > $now + 60) continue;
        $ms = $ts * 1000.0;
        $k = sprintf('%.0f', $ms);
        if ($lvCol !== null && isset($row[$lvCol])) {
            $v = lhNumber($row[$lvCol]);
            if ($v !== null && $v > 0) {
                if ($code === 'PRESACU') $levels[$k] = array($ms, round($v / 100, 2));
                elseif ($v < 9000) $levels[$k] = array($ms, round($v / 100, 3));
            }
        }
        if ($flCol !== null && isset($row[$flCol])) {
            $v = lhNumber($row[$flCol]);
            if ($v !== null) $flows[$k] = array($ms, $v);
        }
    }
    fclose($fp);
    $files++;
}
ksort($levels);
ksort($flows);
$out = array('ok' => true, 'codigo' => $code, 'level' => array_values($levels), 'flow' => array_values($flows), 'files' => $files);
echo defined('JSON_UNESCAPED_UNICODE') ? json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : json_encode($out);
