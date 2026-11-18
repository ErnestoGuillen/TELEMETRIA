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

function saDiv($v, $d) { $n = lnNumber($v); return $n === null ? null : $n / $d; }

function saRow($rows, $code) { return isset($rows[$code]) ? $rows[$code] : null; }

function saFromRow($code, $row, $flowField, $flowDiv, $levelUnit) {
    $item = lnEmpty($code);
    if ($row === null) return $item;
    $item['status'] = lnStatus(lnMinutes(isset($row['Hora']) ? $row['Hora'] : ''));
    $u = trim((isset($row['Fecha']) ? $row['Fecha'] : '') . ' ' . (isset($row['Hora']) ? $row['Hora'] : ''));
    $item['updated'] = $u === '' ? null : $u;
    if ($levelUnit !== 'none') $item['level'] = lnLevel(isset($row['Nivel']) ? $row['Nivel'] : null, $levelUnit);
    $f = lnNumber(isset($row[$flowField]) ? $row[$flowField] : null);
    $item['flow'] = $f === null ? null : round($f / $flowDiv, 2);
    $mn = lnNumber(isset($row['Minimo']) ? $row['Minimo'] : null); $mx = lnNumber(isset($row['Maximo']) ? $row['Maximo'] : null);
    if ($mn !== null && $mn > 0) $item['minimum'] = $mn;
    if ($mx !== null && $mx > 0) $item['maximum'] = $mx;
    if ($item['level'] !== null && $mx !== null && $mx > 0 && $item['level'] >= $mx) $item['observation'] = true;
    return $item;
}

function saFromCsv($code, $flowIndex) {
    $item = lnEmpty($code);
    $csv = lnReadCsv($code);
    if ($csv === null) return $item;
    $t = lnCsvTime($csv);
    if ($t[1] !== null) $item['updated'] = $t[1];
    $item['status'] = $t[0] !== null ? lnStatus($t[0]) : 'operando';
    $item['flow'] = lnNumber(isset($csv['row'][$flowIndex]) ? $csv['row'][$flowIndex] : null);
    return $item;
}

$santiago = lnTable('santiago');
$sur = lnTable('sur');
$pozosmetro = lnTable('pozosmetro');
$items = array();
$readings = 0;

$items['TSFCO001'] = saFromRow('TSFCO001', saRow($santiago, 'TSFCO001'), 'Flujo', 1, 'none');
if (($r = saRow($santiago, 'TSFCO001')) !== null) lnExtra($items['TSFCO001'], 'Turbiedad', saDiv(isset($r['Disp_1']) ? $r['Disp_1'] : null, 1000), 'NTU');
if (($r = saRow($santiago, 'TSFCOMNM')) !== null) lnExtra($items['TSFCO001'], 'San Francisco (MNM)', isset($r['Flujo']) ? $r['Flujo'] : null, 'LPS');
foreach (array('TCDC0001', 'TCDC0002') as $code) {
    $items[$code] = saFromRow($code, saRow($santiago, $code), 'Flujo', 1, 'none');
    if (($r = saRow($santiago, $code)) !== null) lnExtra($items[$code], 'Turbiedad', saDiv(isset($r['Disp_1']) ? $r['Disp_1'] : null, 1000), 'NTU');
}
$items['PEST0001'] = saFromRow('PEST0001', saRow($sur, 'PEST0001'), 'Flujo', 10, 'none');
$items['EST30001'] = saFromRow('EST30001', saRow($santiago, 'EST30001'), 'Flujo', 1, 'cm');
if (($r = saRow($santiago, 'EST30001')) !== null) lnExtra($items['EST30001'], 'Flujo 2', isset($r['Disp_1']) ? $r['Disp_1'] : null, 'LPS');
$items['ACSI0001'] = saFromRow('ACSI0001', saRow($santiago, 'ACSI0001'), 'Flujo', 1, 'none');
$items['ACSII002'] = saFromRow('ACSII002', saRow($santiago, 'ACSII002'), 'Disp_1', 1, 'none');
$items['ACSI0002'] = saFromRow('ACSI0002', saRow($pozosmetro, 'ACSI0002'), 'Flujo', 1, 'none');
$items['ACSII001'] = saFromRow('ACSII001', saRow($pozosmetro, 'ACSII001'), 'Flujo', 1, 'none');

function saPumps(&$item, $row, $bits) {
    if ($row === null || !isset($row['ED_SD']) || !is_numeric($row['ED_SD'])) return;
    $v = (int)$row['ED_SD']; $item['pumps'] = array();
    foreach ($bits as $i => $b) $item['pumps'][] = array('name' => 'Equipo ' . ($i + 1), 'on' => (($v & $b) ? true : false));
}
$r = saRow($santiago, 'PTAR');
$items['PTAR'] = saFromRow('PTAR', $r, 'Flujo', 1, 'none');
if ($r !== null) {
    lnExtra($items['PTAR'], 'Presión', saDiv(isset($r['Presion']) ? $r['Presion'] : null, 100), 'kg/cm²');
    saPumps($items['PTAR'], $r, array(1, 2, 4, 8, 16, 32, 64));
    if (isset($r['ED_SD']) && is_numeric($r['ED_SD'])) $items['PTAR']['extra'][] = array('label' => 'CFE', 'value' => (((int)$r['ED_SD']) & 128) ? 'Activo' : 'Inactivo', 'unit' => '');
}
$r = saRow($santiago, 'BATLCH01');
$items['BATLCH01'] = saFromRow('BATLCH01', $r, 'Flujo', 1, 'cm');
if ($r !== null) {
    lnExtra($items['BATLCH01'], 'Flujo 2', isset($r['Disp_1']) ? $r['Disp_1'] : null, 'LPS');
    lnExtra($items['BATLCH01'], 'Presión', saDiv(isset($r['Presion']) ? $r['Presion'] : null, 10), 'kg/cm²');
    saPumps($items['BATLCH01'], $r, array(1, 2));
}
$r = saRow($santiago, 'FAISAS');
$items['FAISAS'] = saFromRow('FAISAS', $r, 'Flujo', 1, 'cm');
$items['FAISAS']['flow'] = null;
if ($r !== null) {
    lnExtra($items['FAISAS'], 'Presión', saDiv(isset($r['Presion']) ? $r['Presion'] : null, 10), 'kg/cm²');
    saPumps($items['FAISAS'], $r, array(1, 2, 4));
}
$items['MCDC0010'] = saFromCsv('MCDC0010', 4);
if (($csv = lnReadCsv('MCDC0010')) !== null && isset($csv['row'][5]) && trim((string)$csv['row'][5]) !== '') $items['MCDC0010']['extra'][] = array('label' => 'Acumulado', 'value' => trim((string)$csv['row'][5]), 'unit' => '');
$items['TQLILU01'] = saFromCsv('TQLILU01', 99);
if (($csv = lnReadCsv('TQLILU01')) !== null) $items['TQLILU01']['level'] = lnLevel(isset($csv['row'][4]) ? $csv['row'][4] : null, 'cm');

$pp = lnEmpty('PPLBOCA');
$parts = array('PPLBCLA1' => array('Clarificador 1', 4), 'PPLBCLA2' => array('Clarificador 2', 4), 'PPLTAC02' => array('Estación Bombeo 2', 5), 'PPLTAC2A' => array('Estación Bombeo 2A', 5));
$total = null;
foreach ($parts as $code => $info) {
    $it = saFromCsv($code, $info[1]);
    if ($it['flow'] !== null) {
        lnExtra($pp, $info[0], $it['flow'], 'LPS');
        if ($code === 'PPLTAC02' || $code === 'PPLTAC2A') $total = ($total === null ? 0 : $total) + $it['flow'];
    }
    if ($it['updated'] !== null && ($pp['updated'] === null || $it['status'] === 'operando')) { $pp['updated'] = $it['updated']; $pp['status'] = $it['status']; }
}
$pp['flow'] = $total === null ? null : round($total, 2);
$csv = lnReadCsv('BOBTO001');
if ($csv !== null) {
    $txt = strtoupper(trim((string)(isset($csv['row'][4]) ? $csv['row'][4] : '')));
    $pp['extra'][] = array('label' => 'Bombeo obra de toma', 'value' => $txt === 'BAJO NIVEL' ? 'Bajo nivel' : 'Alto nivel', 'unit' => '');
}
$items['PPLBOCA'] = $pp;

$presa = lnEmpty('PRESALB');
foreach (lnDirs('lab') as $dir) {
    foreach (array('/presas.CSV', '/presas.csv') as $name) {
        if (!is_file($dir . $name) || !is_readable($dir . $name)) continue;
        $fp = @fopen($dir . $name, 'r');
        if (!$fp) continue;
        $last = null;
        while (($data = fgetcsv($fp, 4000, ',')) !== false) {
            foreach ($data as $c) { if (trim((string)$c) !== '') { $last = $data; break; } }
        }
        fclose($fp);
        if ($last !== null) {
            lnExtra($presa, 'Almacenamiento', isset($last[3]) ? $last[3] : null, 'Mm³');
            lnExtra($presa, 'Llenado', isset($last[4]) ? $last[4] : null, '%');
            if (count($presa['extra'])) $presa['status'] = 'operando';
        }
        break 2;
    }
}
$items['PRESALB'] = $presa;

foreach ($items as $it) if ($it['status'] !== 'sin_datos' || $it['flow'] !== null || $it['level'] !== null || count($it['extra'])) $readings++;
$out = array('ok' => true, 'items' => $items, 'updated' => date('Y-m-d H:i:s'),
    'available' => $readings > 0, 'source' => 'santiago/sur/pozosmetro/lecturas/lab');
if (isset($_GET['debug'])) {
    $out['debug'] = array('php' => PHP_VERSION, 'base' => $lnBase, 'fecha' => $S, 'lecturas' => lnDirs('lecturas'), 'lab' => lnDirs('lab'),
        'filas_santiago' => count($santiago), 'filas_sur' => count($sur), 'filas_pozosmetro' => count($pozosmetro));
}
echo defined('JSON_UNESCAPED_UNICODE') ? json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : json_encode($out);
