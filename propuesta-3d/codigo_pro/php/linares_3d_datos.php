<?php
/* Linares 3D - lecturas en tiempo real.
   Compatible con PHP 5.x (mysql_*), lee los datos igual que sanroque.php:
   - Tablas "sanroque" y "linares" de la base de datos
   - lecturas/AAMMDD00_TGRP0001.CSV (Tanque Garrapatas, NI0000001 en cm)
   - lecturas/AAMMDD00_ROMPE001.CSV (Rompedor: FL0000001, FL0000002, PRES001, PRES002)
   - lecturas/AAMMDD00_OBTO0002.CSV (Presa Cerro Prieto: ELEV0001)
   - lab/presas.CSV (Cerro Prieto: almacenamiento col 5, porcentaje col 6) */
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

/* Misma ventana de comunicación que sanroque.php (últimos 30 min) */
$hhh = ((date('H') * 60) + date('i')) - 30;
$hhs = ((date('H') * 60) + date('i')) + 60;
$S = date('ymd00');

$definitions = array(
    'LINPB001' => array('table' => 'linares', 'pumps' => array(1, 2, 4, 8), 'level' => 'none'),
    'LINPB002' => array('table' => 'sanroque', 'pumps' => array(1, 2, 4, 8, 16), 'level' => 'm'),
    'LINPB02A' => array('table' => 'sanroque', 'pumps' => array(1, 2, 4, 8, 16), 'level' => 'cm'),
    'LINPB003' => array('table' => 'sanroque', 'pumps' => array(1, 2, 4, 8, 16), 'level' => 'cm'),
    'TGRP0001' => array('table' => 'sanroque', 'level' => 'cm'),
    'ROMPE001' => array('table' => 'csv', 'level' => 'none'),
    'LINPB004' => array('table' => 'sanroque', 'pumps' => array(2, 4, 8, 16, 32), 'level' => 'none'),
    'PPLLN001' => array('table' => 'sanroque', 'level' => 'none'),
    'PBSRQ005' => array('table' => 'sanroque', 'pumps' => array(1, 2, 4, 8, 16, 32), 'level' => 'none'),
    'TACPSR01' => array('table' => 'sanroque', 'level' => 'cm'),
    'TACPSR02' => array('table' => 'sanroque', 'level' => 'cm')
);

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

/* Lee toda la tabla como sanroque.php */
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

/* Carpetas posibles (igual que sanroque.php: ../../lecturas y ../../lab) */
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

/* Abre lecturas/AAMMDD00_CODIGO.CSV y devuelve encabezados + última fila con datos (como sanroque.php) */
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

/* Fecha y hora de una fila CSV: "16/11 15:24" como en sanroque.php */
function lnCsvTime($csv) {
    if ($csv === null) return array(null, null);
    $row = $csv['row'];
    $min = (isset($row[2], $row[3]) && is_numeric($row[2]) && is_numeric($row[3])) ? ((int)$row[2] * 60 + (int)$row[3]) : null;
    $fecha = explode('/', isset($row[0]) ? (string)$row[0] : '');
    $label = (isset($fecha[2], $fecha[1]) ? $fecha[2] . '/' . $fecha[1] . ' ' : '') .
        ($min !== null ? sprintf('%02d:%02d', (int)$row[2], (int)$row[3]) : '');
    return array($min, trim($label) === '' ? null : trim($label));
}

$items = array();
foreach ($definitions as $code => $def) $items[$code] = lnEmpty($code);
$tables = array('sanroque' => lnTable('sanroque'), 'linares' => lnTable('linares'));
$readings = 0;

foreach ($definitions as $code => $def) {
    if ($def['table'] === 'csv') continue;
    if (!isset($tables[$def['table']][$code])) continue;
    $row = $tables[$def['table']][$code];
    $item = $items[$code];
    $min = lnMinutes(isset($row['Hora']) ? $row['Hora'] : '');
    $item['status'] = lnStatus($min);
    $item['updated'] = trim((isset($row['Fecha']) ? $row['Fecha'] : '') . ' ' . (isset($row['Hora']) ? $row['Hora'] : ''));
    if ($item['updated'] === '') $item['updated'] = null;
    $item['level'] = lnLevel(isset($row['Nivel']) ? $row['Nivel'] : null, $def['level']);
    $item['flow'] = lnNumber(isset($row['Flujo']) ? $row['Flujo'] : null);
    $mn = lnNumber(isset($row['Minimo']) ? $row['Minimo'] : null);
    $mx = lnNumber(isset($row['Maximo']) ? $row['Maximo'] : null);
    $item['minimum'] = ($mn !== null && $mn > 25) ? round($mn / 100, 3) : $mn;
    $item['maximum'] = ($mx !== null && $mx > 25) ? round($mx / 100, 3) : $mx;
    if ($item['status'] === 'operando' && $item['level'] !== null && $item['minimum'] !== null && $item['maximum'] !== null && $item['maximum'] > $item['minimum'])
        $item['observation'] = ($item['level'] < $item['minimum'] || $item['level'] > $item['maximum']);
    if (isset($def['pumps']) && isset($row['ED_SD']) && is_numeric($row['ED_SD'])) {
        $bits = (int)$row['ED_SD'];
        $item['pumps'] = array();
        foreach ($def['pumps'] as $i => $bit) $item['pumps'][] = array('name' => 'Equipo ' . ($i + 1), 'on' => (($bits & $bit) ? true : false));
    }
    if ($code === 'LINPB002') {
        if (isset($row['Presion']) && lnNumber($row['Presion']) !== null) lnExtra($item, 'Presión succión', lnNumber($row['Presion']) / 1000, 'kg/cm²');
        if (isset($row['Disp_1']) && lnNumber($row['Disp_1']) !== null) lnExtra($item, 'Presión descarga', lnNumber($row['Disp_1']) / 1000, 'kg/cm²');
    } elseif ($code === 'LINPB02A') {
        if (isset($row['Presion']) && lnNumber($row['Presion']) !== null) lnExtra($item, 'Presión descarga', lnNumber($row['Presion']) / 1000, 'kg/cm²');
    } elseif ($code === 'LINPB003') {
        if (isset($row['Presion']) && lnNumber($row['Presion']) !== null) lnExtra($item, 'Presión descarga', lnNumber($row['Presion']) / 100, 'kg/cm²');
    } elseif ($code === 'LINPB004') {
        if (isset($row['Disp_3'])) lnExtra($item, 'Llegada Rompedor', $row['Disp_3'], 'LPS');
        if (isset($row['Disp_6'])) lnExtra($item, 'Extracción La Boca', $row['Disp_6'], 'LPS');
        if (isset($row['Disp_9'])) lnExtra($item, 'Aportación La Boca', $row['Disp_9'], 'LPS');
    }
    $items[$code] = $item;
    $readings++;
}

/* Tanque Garrapatas: igual que sanroque.php (CSV, NI0000001 en cm) */
$csv = lnReadCsv('TGRP0001');
if ($csv !== null) {
    $lvl = lnLevel(lnCsvValue($csv, 'NI0000001', null), 'cm');
    $t = lnCsvTime($csv);
    $item = $items['TGRP0001'];
    if ($lvl !== null) $item['level'] = $lvl;
    if ($t[1] !== null) $item['updated'] = $t[1];
    if ($t[0] !== null) $item['status'] = lnStatus($t[0]);
    $item['source'] = 'CSV NI0000001';
    $items['TGRP0001'] = $item;
    $readings++;
}

/* Rompedor de carga: igual que sanroque.php */
$csv = lnReadCsv('ROMPE001');
if ($csv !== null) {
    $t = lnCsvTime($csv);
    $item = $items['ROMPE001'];
    $item['flow'] = lnNumber(lnCsvValue($csv, 'FL0000001', null));
    if ($t[1] !== null) $item['updated'] = $t[1];
    if ($t[0] !== null) $item['status'] = lnStatus($t[0]);
    lnExtra($item, 'Conducción 42"', lnCsvValue($csv, 'FL0000002', null), 'LPS');
    lnExtra($item, 'Presión entrada', lnCsvValue($csv, 'PRES002', null), 'kg/cm²');
    lnExtra($item, 'Presión salida', lnCsvValue($csv, 'PRES001', null), 'kg/cm²');
    $items['ROMPE001'] = $item;
    $readings++;
}

/* Presa Cerro Prieto: igual que presas.php / presamapa.php */
$item = lnEmpty('PRESACP');
$csv = lnReadCsv('OBTO0002');
if ($csv !== null) {
    $elev = lnNumber(lnCsvValue($csv, 'ELEV0001', 4));
    if ($elev !== null && $elev > 0) $item['level'] = $elev;
    $t = lnCsvTime($csv);
    if ($t[1] !== null) $item['updated'] = $t[1];
    if ($t[0] !== null) $item['status'] = lnStatus($t[0]);
}
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
            lnExtra($item, 'Almacenamiento', isset($last[5]) ? $last[5] : null, 'Mm³');
            lnExtra($item, 'Llenado', isset($last[6]) ? $last[6] : null, '%');
            if ($item['status'] === 'sin_datos') $item['status'] = 'operando';
        }
        break 2;
    }
}
$items['PRESACP'] = $item;
if ($item['level'] !== null || count($item['extra'])) $readings++;

$out = array('ok' => true, 'items' => $items, 'updated' => date('Y-m-d H:i:s'),
    'available' => $readings > 0, 'source' => 'linares/sanroque/lecturas');
if (isset($_GET['debug'])) {
    $out['debug'] = array('php' => PHP_VERSION, 'base' => $lnBase, 'cwd' => getcwd(), 'fecha' => $S,
        'lecturas' => lnDirs('lecturas'), 'lab' => lnDirs('lab'),
        'filas_sanroque' => count($tables['sanroque']), 'filas_linares' => count($tables['linares']),
        'csv_garrapatas' => ($c = lnReadCsv('TGRP0001')) ? $c['file'] : null);
}
echo defined('JSON_UNESCAPED_UNICODE') ? json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : json_encode($out);
