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

$definitions = array(
    'CHIPB000' => array('table' => 'sanroque', 'pumps' => array(1, 2, 4, 8, 16, 32), 'level' => 'none'),
    'CHIPB001' => array('table' => 'sanroque', 'pumps' => array(1, 2, 4, 8, 16, 32), 'level' => 'none'),
    'CHIPB002' => array('table' => 'sanroque', 'pumps' => array(1, 2, 4, 8, 16, 32), 'level' => 'none'),
    'CHIPB003' => array('table' => 'sanroque', 'pumps' => array(1, 2, 4, 8, 16, 32), 'level' => 'none'),
    'CHIPB004' => array('table' => 'sanroque', 'pumps' => array(1, 2, 4, 8, 16, 32), 'level' => 'cm'),
    'CHIPB200' => array('table' => 'sanroque', 'pumps' => array(1, 2, 4, 8, 16), 'level' => 'none'),
    'CHIPB201' => array('table' => 'sanroque', 'pumps' => array(1, 2, 4, 8, 16), 'level' => 'none'),
    'CHIPB202' => array('table' => 'sanroque', 'pumps' => array(1, 2, 4, 8, 16), 'level' => 'none'),
    'CHIPB203' => array('table' => 'sanroque', 'pumps' => array(1, 2, 4, 8, 16), 'level' => 'none'),
    'CHIPB204' => array('table' => 'sanroque', 'pumps' => array(1, 2, 4, 8, 16), 'level' => 'none'),
    'PBSRQ005' => array('table' => 'sanroque', 'pumps' => array(1, 2, 4, 8, 16, 32), 'level' => 'none'),
    'PPLCH001' => array('table' => 'sanroque', 'level' => 'none'),
    'TSACII01' => array('table' => 'csv', 'level' => 'cm'),
    'TSACII02' => array('table' => 'csv', 'level' => 'cm'),
    'TSACII03' => array('table' => 'csv', 'level' => 'cm'),
    'TSACII04' => array('table' => 'csv', 'level' => 'cm')
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

$items = array();
foreach ($definitions as $code => $def) $items[$code] = lnEmpty($code);
$tables = array('sanroque' => lnTable('sanroque'));
$readings = 0;

foreach ($definitions as $code => $def) {
    if ($def['table'] !== 'sanroque' || !isset($tables['sanroque'][$code])) continue;
    $row = $tables['sanroque'][$code];
    $item = $items[$code];
    $item['status'] = lnStatus(lnMinutes(isset($row['Hora']) ? $row['Hora'] : ''));
    $item['updated'] = trim((isset($row['Fecha']) ? $row['Fecha'] : '') . ' ' . (isset($row['Hora']) ? $row['Hora'] : ''));
    if ($item['updated'] === '') $item['updated'] = null;
    $item['level'] = lnLevel(isset($row['Nivel']) ? $row['Nivel'] : null, $def['level']);
    $item['flow'] = lnNumber(isset($row['Flujo']) ? $row['Flujo'] : null);

    if (isset($def['pumps']) && isset($row['ED_SD']) && is_numeric($row['ED_SD']) && (substr($code, 0, 6) !== 'CHIPB2' || (int)$row['ED_SD'] > 0)) {
        $bits = (int)$row['ED_SD'];
        $item['pumps'] = array();
        foreach ($def['pumps'] as $i => $bit) $item['pumps'][] = array('name' => 'Equipo ' . ($i + 1), 'on' => (($bits & $bit) ? true : false));
    }
    if ($code === 'CHIPB003' && isset($row['Disp_3'])) lnExtra($item, 'Pemex', $row['Disp_3'], 'LPS');
    if ($code === 'CHIPB004' && isset($row['Disp_3'])) lnExtra($item, 'Llegada', $row['Disp_3'], 'LPS');
    $items[$code] = $item;
    $readings++;
}

if ($items['PPLCH001']['flow'] !== null) lnExtra($items['PBSRQ005'], 'Llegada Ac. China I', $items['PPLCH001']['flow'], 'LPS');

foreach (array('TSACII01', 'TSACII02', 'TSACII03', 'TSACII04') as $code) {
    $csv = lnReadCsv($code);
    if ($csv === null) continue;
    $t = lnCsvTime($csv);
    $item = $items[$code];
    $item['level'] = lnLevel(lnCsvValue($csv, 'NI0000001', null), 'cm');
    if ($t[1] !== null) $item['updated'] = $t[1];
    if ($t[0] !== null) $item['status'] = lnStatus($t[0]);
    $items[$code] = $item;
    $readings++;
}

$item = lnEmpty('PRESACU');
$csv = lnReadCsv('OBTO003');
if ($csv !== null) {
    $elev = lnNumber(lnCsvValue($csv, 'ELEV0001', 4));
    if ($elev !== null && $elev > 0) $item['level'] = round($elev / 100, 2);
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
            lnExtra($item, 'Almacenamiento', isset($last[1]) ? $last[1] : null, 'Mm³');
            lnExtra($item, 'Llenado', isset($last[2]) ? $last[2] : null, '%');
            if ($item['status'] === 'sin_datos') $item['status'] = 'operando';
        }
        break 2;
    }
}
$csv = lnReadCsv('CHIPB015');
if ($csv !== null) lnExtra($item, 'Extracción total', lnCsvValue($csv, 'FL0000001', null), 'LPS');
$items['PRESACU'] = $item;
if ($item['level'] !== null || count($item['extra'])) $readings++;

$out = array('ok' => true, 'items' => $items, 'updated' => date('Y-m-d H:i:s'),
    'available' => $readings > 0, 'source' => 'sanroque/lecturas/lab');
if (isset($_GET['debug'])) {
    $out['debug'] = array('php' => PHP_VERSION, 'base' => $lnBase, 'cwd' => getcwd(), 'fecha' => $S,
        'lecturas' => lnDirs('lecturas'), 'lab' => lnDirs('lab'), 'filas_sanroque' => count($tables['sanroque']),
        'csv_ts1' => ($c = lnReadCsv('TSACII01')) ? $c['file'] : null, 'csv_presa' => ($c = lnReadCsv('OBTO003')) ? $c['file'] : null);
}
echo defined('JSON_UNESCAPED_UNICODE') ? json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : json_encode($out);
