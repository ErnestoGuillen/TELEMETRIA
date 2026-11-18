<?php

ini_set('display_errors', '0');
error_reporting(E_ERROR | E_PARSE);
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');

$lnBase = dirname(dirname(dirname(__FILE__)));
if (is_file($lnBase . '/CambioHorario/horario.php')) { ob_start(); @include_once($lnBase . '/CambioHorario/horario.php'); ob_end_clean(); }
if (is_file($lnBase . '/lol/includes/connection2.php')) { ob_start(); @include_once($lnBase . '/lol/includes/connection2.php'); ob_end_clean(); }
set_time_limit(20);

$hhh = ((date('H') * 60) + date('i')) - 30;
$hhs = ((date('H') * 60) + date('i')) + 60;
$S = date('ymd00');

function lnNumber($value) {
    if ($value === null || is_array($value)) return null;
    $s = trim((string)$value);
    if ($s === '' || $s === '-' || strcasecmp($s, 'N/D') === 0) return null;
    $s = str_replace('%', '', $s);
    if (strpos($s, ',') !== false && strpos($s, '.') !== false) $s = str_replace(',', '', $s);
    elseif (strpos($s, ',') !== false) $s = str_replace(',', '.', $s);
    if (!is_numeric($s)) return null;
    $f = (float)$s;
    if (is_nan($f) || is_infinite($f) || abs($f) >= 10000000) return null;
    return $f;
}

function lnMinutes($hora) {
    $p = explode(':', trim((string)$hora));
    if (count($p) < 2 || !is_numeric($p[0]) || !is_numeric($p[1])) return null;
    return ((int)$p[0]) * 60 + (int)$p[1];
}

function lnStatus($minutes) {
    global $hhh, $hhs;
    if ($minutes === null) return 'sin_datos';
    return ($hhs < $minutes || $minutes < $hhh) ? 'sin_comunicacion' : 'operando';
}

function lnEmpty($code) {
    return array('code' => $code, 'level' => null, 'flow' => null, 'updated' => null,
        'status' => 'sin_datos', 'minimum' => null, 'maximum' => null,
        'observation' => false, 'pumps' => null, 'extra' => array());
}

function lnExtra(&$item, $label, $value, $unit) {
    $v = lnNumber($value);
    if ($v !== null) $item['extra'][] = array('label' => $label, 'value' => $v, 'unit' => $unit);
}

function lnLevel($raw, $unit) {
    $v = lnNumber($raw);
    if ($v === null || $v <= 0 || $v >= 9000 || $unit === 'none') return null;
    return $unit === 'cm' ? round($v / 100, 3) : round($v, 3);
}

function lnTable($table) {
    $rows = array();
    if (function_exists('mysql_query')) {
        $q = @mysql_query('select * from ' . $table);
        if ($q) while ($r = @mysql_fetch_array($q)) $rows[strtoupper(trim((string)$r['Codigo']))] = $r;
        return $rows;
    }
    foreach (array('mysqli', 'conn', 'conexion', 'connection', 'con', 'link') as $var) {
        if (!isset($GLOBALS[$var]) || !is_object($GLOBALS[$var]) || !($GLOBALS[$var] instanceof mysqli)) continue;
        $q = @$GLOBALS[$var]->query('select * from ' . $table);
        if ($q) while ($r = $q->fetch_assoc()) $rows[strtoupper(trim((string)$r['Codigo']))] = $r;
        break;
    }
    return $rows;
}

function lnDirs($sub) {
    global $lnBase;
    $out = array();
    foreach (array($lnBase, dirname(dirname(getcwd() . '/x')) , realpath('../..')) as $b) {
        if (!$b) continue;
        foreach (array($sub, ucfirst($sub), strtoupper($sub)) as $s) {
            $d = rtrim($b, '/\\') . '/' . $s;
            if (is_dir($d) && !in_array($d, $out)) $out[] = $d;
        }
    }
    $rel = '../../' . $sub;
    if (is_dir($rel) && !in_array($rel, $out)) $out[] = $rel;
    return $out;
}

function lnReadCsv($code) {
    global $S;
    $days = array($S, date('ymd00', time() - 86400));
    foreach ($days as $day) {
        foreach (lnDirs('lecturas') as $dir) {
            foreach (array('.CSV', '.csv') as $ext) {
                $file = $dir . '/' . $day . '_' . $code . $ext;
                if (!is_file($file) || !is_readable($file)) continue;
                $fp = @fopen($file, 'r');
                if (!$fp) continue;
                $keys = array(); $last = null; $i = 0;
                while (($data = fgetcsv($fp, 8192, ',')) !== false) {
                    if ($i == 0) {
                        foreach ($data as $k => $h) {
                            $h = strtoupper(trim(preg_replace('/^\xEF\xBB\xBF/', '', (string)$h)));
                            if ($h !== '') $keys[$h] = $k;
                        }
                    } else {
                        $has = false;
                        foreach ($data as $c) { if (trim((string)$c) !== '') { $has = true; break; } }
                        if ($has) $last = $data;
                    }
                    $i++;
                }
                fclose($fp);
                if ($last !== null) return array('keys' => $keys, 'row' => $last, 'file' => $file);
            }
        }
    }
    return null;
}

function lnCsvValue($csv, $column, $fallbackIndex) {
    if ($csv === null) return null;
    $idx = isset($csv['keys'][$column]) ? $csv['keys'][$column] : $fallbackIndex;
    if ($idx === null || !isset($csv['row'][$idx])) return null;
    return $csv['row'][$idx];
}

function lnCsvTime($csv) {
    if ($csv === null) return array(null, null);
    $row = $csv['row'];
    $min = (isset($row[2], $row[3]) && is_numeric($row[2]) && is_numeric($row[3])) ? ((int)$row[2] * 60 + (int)$row[3]) : null;
    $fecha = explode('/', isset($row[0]) ? (string)$row[0] : '');
    $label = (isset($fecha[2], $fecha[1]) ? $fecha[2] . '/' . $fecha[1] . ' ' : '') .
        ($min !== null ? sprintf('%02d:%02d', (int)$row[2], (int)$row[3]) : '');
    return array($min, trim($label) === '' ? null : trim($label));
}

function chTime(&$item, $row) {
    $item['status'] = lnStatus(lnMinutes(isset($row['Hora']) ? $row['Hora'] : ''));
    $u = trim((isset($row['Fecha']) ? $row['Fecha'] : '') . ' ' . (isset($row['Hora']) ? $row['Hora'] : ''));
    $item['updated'] = $u === '' ? null : $u;
}

$mina = lnTable('mina');
$poniente = lnTable('poniente');
$items = array();
$wells = array(1, 4, 5, 7, 8, 9, 10, 12, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 27);
$total = 0; $on = 0;
foreach ($wells as $n) {
    $code = sprintf('PMINA%03d', $n);
    $item = lnEmpty($code);
    if (isset($mina[$code])) {
        $r = $mina[$code];
        chTime($item, $r);
        $f = lnNumber(isset($r['Flujo']) ? $r['Flujo'] : null);
        if ($f !== null && $n == 17) $f = $f / 10;
        if ($f !== null && $f > 5000) $f = null;
        $item['flow'] = $f === null ? null : round($f, 2);
        $ed = isset($r['ED_SD']) && is_numeric($r['ED_SD']) ? (int)$r['ED_SD'] : 0;
        $isOn = ($ed & 1) ? true : false;
        $item['pumps'] = array(array('name' => 'Equipo 1', 'on' => $isOn));
        if ($n == 20 && isset($r['Disp_3']) && is_numeric($r['Disp_3'])) lnExtra($item, 'Batería', $r['Disp_3'] / 1000, 'V');
        if ($item['flow'] !== null) $total += $item['flow'];
        if ($isOn) $on++;
    }
    $items[$code] = $item;
}

$item = lnEmpty('ACUEM001');
if (isset($mina['ACUEM001'])) {
    chTime($item, $mina['ACUEM001']);
    $item['flow'] = lnNumber(isset($mina['ACUEM001']['Flujo']) ? $mina['ACUEM001']['Flujo'] : null);
}
$csv = lnReadCsv('ACUEMP01');
$p = $csv !== null ? lnNumber(isset($csv['row'][4]) ? $csv['row'][4] : null) : null;
if ($p === null && isset($poniente['SPECMN01']['Presion'])) { $p = lnNumber($poniente['SPECMN01']['Presion']); if ($p !== null) $p = $p / 1000; }
if ($p !== null) lnExtra($item, 'Presión', $p, 'kg/cm²');
lnExtra($item, 'Pozos operando', $on, '');
lnExtra($item, 'Extracción pozos', round($total, 1), 'LPS');
$items['ACUEM001'] = $item;

$item = lnEmpty('ACUEM002');
if (isset($mina['ACUEM002'])) {
    chTime($item, $mina['ACUEM002']);
    $f = lnNumber(isset($mina['ACUEM002']['Flujo']) ? $mina['ACUEM002']['Flujo'] : null);
    $item['flow'] = ($f !== null && $f >= 1200) ? 0 : $f;
}
$items['ACUEM002'] = $item;

$item = lnEmpty('SPECMN01');
if (isset($poniente['SPECMN01'])) {
    $r = $poniente['SPECMN01']; chTime($item, $r);
    lnExtra($item, 'Presión arriba', isset($r['Presion']) ? $r['Presion'] : null, 'kg/cm²');
    lnExtra($item, 'Presión abajo', isset($r['Disp_1']) ? $r['Disp_1'] : null, 'kg/cm²');
    $b = lnNumber(isset($r['Disp_2']) ? $r['Disp_2'] : null);
    if ($b !== null) lnExtra($item, 'Batería', abs($b) >= 100 ? $b / 10 : $b, 'V');
}
$items['SPECMN01'] = $item;

$item = lnEmpty('SPECMN02');
if (isset($poniente['SPECMN02'])) {
    $r = $poniente['SPECMN02']; chTime($item, $r);
    lnExtra($item, 'Presión', isset($r['Disp_1']) ? $r['Disp_1'] : null, 'kg/cm²');
}
$items['SPECMN02'] = $item;

$readings = 0;
foreach ($items as $it) if ($it['status'] !== 'sin_datos') $readings++;
$out = array('ok' => true, 'items' => $items, 'updated' => date('Y-m-d H:i:s'), 'available' => $readings > 0, 'source' => 'mina/poniente/lecturas');
if (isset($_GET['debug'])) $out['debug'] = array('php' => PHP_VERSION, 'base' => $lnBase, 'fecha' => $S, 'filas_mina' => count($mina), 'filas_poniente' => count($poniente));
echo defined('JSON_UNESCAPED_UNICODE') ? json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : json_encode($out);
