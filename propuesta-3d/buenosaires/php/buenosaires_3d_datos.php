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

function baTime($row) {
    $item = lnEmpty('');
    $item['status'] = lnStatus(lnMinutes(isset($row['Hora']) ? $row['Hora'] : ''));
    $u = trim((isset($row['Fecha']) ? $row['Fecha'] : '') . ' ' . (isset($row['Hora']) ? $row['Hora'] : ''));
    $item['updated'] = $u === '' ? null : $u;
    return $item;
}

$ba = lnTable('buenosaires');
$fama = lnTable('fama');
$items = array();
$total = 0; $hasTotal = false; $wellsOn = 0;

$acc = array('BAPZ0001' => 1000, 'BAPZ0002' => 1000, 'BAPZ0004' => 1000, 'BAPZ0005' => 1000, 'BAPZ0006' => 1000, 'BAPZ0008' => 1000, 'BAPZ0010' => 10000, 'BAPZ0013' => 10000, 'BAPZ0014' => 10000, 'BAPZ0017' => 1000, 'BAPZ0018' => 1000, 'BAPZ0019' => 1000, 'BAPZ019B' => 1000, 'BAPZ0025' => 1000, 'BAPZ0028' => 1000, 'BAPZ0030' => 10000, 'BAPZ0033' => 1000, 'BAPZ0039' => 1000);
foreach ($acc as $code => $mul) {
    $item = lnEmpty($code);
    if (isset($ba[$code])) {
        $r = $ba[$code];
        $t = baTime($r); $item['status'] = $t['status']; $item['updated'] = $t['updated'];
        $item['flow'] = lnNumber(isset($r['Flujo']) ? $r['Flujo'] : null);
        $ed = isset($r['ED_SD']) && is_numeric($r['ED_SD']) ? (int)$r['ED_SD'] : 0;
        $on = ($ed & 1) ? true : false;
        $item['pumps'] = array(array('name' => 'Equipo', 'on' => $on));
        $d1 = lnNumber(isset($r['Disp_1']) ? $r['Disp_1'] : null); $d2 = lnNumber(isset($r['Disp_2']) ? $r['Disp_2'] : null);
        if ($d1 !== null || $d2 !== null) lnExtra($item, 'Acumulado', ($d1 === null ? 0 : $d1) * $mul + ($d2 === null ? 0 : $d2), 'm³');
        if ($item['flow'] !== null) { $total += $item['flow']; $hasTotal = true; }
        if ($on) $wellsOn++;
    }
    $items[$code] = $item;
}

$item = lnEmpty('BAPZ0040');
$csv = lnReadCsv('BAPZ0040');
if ($csv !== null) {
    $t = lnCsvTime($csv);
    if ($t[1] !== null) $item['updated'] = $t[1];
    $item['status'] = $t[0] !== null ? lnStatus($t[0]) : 'operando';
    $item['flow'] = lnNumber(isset($csv['row'][4]) ? $csv['row'][4] : null);
    $on = strtoupper(trim((string)(isset($csv['row'][6]) ? $csv['row'][6] : 'OFF'))) === 'ON';
    $item['pumps'] = array(array('name' => 'Equipo', 'on' => $on));
    if (isset($csv['row'][5]) && trim((string)$csv['row'][5]) !== '') lnExtra($item, 'Acumulado', $csv['row'][5], 'm³');
    if ($item['flow'] !== null) { $total += $item['flow']; $hasTotal = true; }
    if ($on) $wellsOn++;
}
$items['BAPZ0040'] = $item;

$item = lnEmpty('BACEM001');
if (isset($ba['BACEM001'])) {
    $r = $ba['BACEM001'];
    $t = baTime($r); $item['status'] = $t['status']; $item['updated'] = $t['updated'];
    $ed = isset($r['ED_SD']) && is_numeric($r['ED_SD']) ? (int)$r['ED_SD'] : 0;
    $item['pumps'] = array(array('name' => 'Equipo 1', 'on' => ($ed & 1) ? true : false), array('name' => 'Equipo 2', 'on' => ($ed & 2) ? true : false));
    $item['extra'][] = array('label' => 'CFE', 'value' => ($ed & 128) ? 'Activo' : 'Inactivo', 'unit' => '');
}
$items['BACEM001'] = $item;

$item = lnEmpty('MMH001');
if (isset($ba['MMH001'])) { $r = $ba['MMH001']; $t = baTime($r); $item['status'] = $t['status']; $item['updated'] = $t['updated']; $item['flow'] = lnNumber(isset($r['Flujo']) ? $r['Flujo'] : null); }
$items['MMH001'] = $item;

$item = lnEmpty('PAHU0001');
if (isset($fama['PAHU0001'])) {
    $r = $fama['PAHU0001']; $t = baTime($r); $item['status'] = $t['status']; $item['updated'] = $t['updated'];
    $item['flow'] = lnNumber(isset($r['Flujo']) ? $r['Flujo'] : null);
    $d1 = lnNumber(isset($r['Disp_1']) ? $r['Disp_1'] : null); $d2 = lnNumber(isset($r['Disp_2']) ? $r['Disp_2'] : null);
    if ($d1 !== null || $d2 !== null) lnExtra($item, 'Acumulado (x10 m³)', ($d1 === null ? 0 : $d1) * 10000 + ($d2 === null ? 0 : $d2), '');
}
$items['PAHU0001'] = $item;

foreach (array('MAFLSC02', 'VALLEP01', 'MMDT001') as $code) {
    $item = lnEmpty($code);
    $csv = lnReadCsv($code);
    if ($csv !== null) {
        $t = lnCsvTime($csv);
        if ($t[1] !== null) $item['updated'] = $t[1];
        $item['status'] = $t[0] !== null ? lnStatus($t[0]) : 'operando';
        $item['flow'] = lnNumber(isset($csv['row'][4]) ? $csv['row'][4] : null);
        if ($code === 'VALLEP01' && isset($csv['row'][5]) && trim((string)$csv['row'][5]) !== '') lnExtra($item, 'Voltaje', $csv['row'][5], 'V');
    }
    $items[$code] = $item;
}

$tot = lnEmpty('BATOTAL');
if ($hasTotal) {
    $tot['flow'] = round($total, 2);
    $tot['status'] = 'operando';
    $tot['extra'][] = array('label' => 'Pozos operando', 'value' => $wellsOn . ' de 19', 'unit' => '');
}
$items['BATOTAL'] = $tot;

$readings = 0;
foreach ($items as $it) if ($it['status'] !== 'sin_datos') $readings++;
$out = array('ok' => true, 'items' => $items, 'updated' => date('Y-m-d H:i:s'), 'available' => $readings > 0, 'source' => 'buenosaires/fama/lecturas');
if (isset($_GET['debug'])) $out['debug'] = array('php' => PHP_VERSION, 'base' => $lnBase, 'fecha' => $S, 'lecturas' => lnDirs('lecturas'), 'filas_buenosaires' => count($ba), 'filas_fama' => count($fama));
echo defined('JSON_UNESCAPED_UNICODE') ? json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : json_encode($out);
