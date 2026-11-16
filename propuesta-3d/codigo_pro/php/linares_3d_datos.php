<?php
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');
date_default_timezone_set('America/Monterrey');

$definitions = array(
    'LINPB001' => array('table' => 'linares', 'pumps' => array(1, 2, 4, 8)),
    'LINPB002' => array('table' => 'sanroque', 'pumps' => array(1, 2, 4, 8, 16)),
    'LINPB02A' => array('table' => 'sanroque', 'pumps' => array(1, 2, 4, 8, 16)),
    'LINPB003' => array('table' => 'sanroque', 'pumps' => array(1, 2, 4, 8, 16)),
    'TGRP0001' => array('table' => 'sanroque'),
    'ROMPE001' => array('table' => 'csv'),
    'LINPB004' => array('table' => 'sanroque', 'pumps' => array(2, 4, 8, 16, 32)),
    'PPLLN001' => array('table' => 'sanroque'),
    'PBSRQ005' => array('table' => 'sanroque', 'pumps' => array(1, 2, 4, 8, 16, 32)),
    'TACPSR01' => array('table' => 'sanroque'),
    'TACPSR02' => array('table' => 'sanroque')
);

function lnNumber($value) {
    if ($value === null || is_array($value)) return null;
    $s = trim((string)$value);
    if ($s === '' || $s === '-' || strcasecmp($s, 'N/D') === 0) return null;
    if (strpos($s, ',') !== false && strpos($s, '.') !== false) $s = str_replace(',', '', $s);
    elseif (strpos($s, ',') !== false) $s = str_replace(',', '.', $s);
    if (!is_numeric($s)) return null;
    $f = (float)$s;
    return is_finite($f) && abs($f) < 10000000 ? $f : null;
}

function lnStamp($date, $hour) {
    $d = trim((string)$date);
    $h = trim((string)$hour);
    if ($h !== '' && preg_match('/^\d{1,2}:\d{2}$/', $h)) $h .= ':00';
    $zone = new DateTimeZone('America/Monterrey');
    if (preg_match('/^(\d{1,2})[\/-](\d{1,2})$/', $d, $m) && $h !== '') {
        $now = new DateTimeImmutable('now', $zone);
        $dt = DateTimeImmutable::createFromFormat('!d/m/Y H:i:s', sprintf('%02d/%02d/%04d', (int)$m[1], (int)$m[2], (int)$now->format('Y')) . ' ' . $h, $zone);
        if ($dt && $dt->getTimestamp() > $now->getTimestamp() + 300) $dt = $dt->modify('-1 year');
        if ($dt) return $dt->getTimestamp();
    }
    foreach (array('Y-m-d', 'Y/m/d', 'y/m/d', 'd/m/Y', 'd-m-Y', 'y-m-d', 'd/m/y') as $f) {
        if ($d === '' || $h === '') continue;
        $dt = DateTimeImmutable::createFromFormat('!' . $f . ' H:i:s', $d . ' ' . $h, $zone);
        if ($dt && $dt->format($f . ' H:i:s') === $d . ' ' . $h) return $dt->getTimestamp();
    }
    if ($d !== '') return null;
    if (preg_match('/^(\d{1,2}):(\d{2})(?::\d{2})?$/', $h, $m)) {
        $dt = new DateTimeImmutable('today', $zone);
        $dt = $dt->setTime((int)$m[1], (int)$m[2]);
        if ($dt->getTimestamp() > time() + 300) $dt = $dt->modify('-1 day');
        return $dt->getTimestamp();
    }
    return null;
}

function lnEmpty($code) {
    return array('code' => $code, 'level' => null, 'flow' => null,
        'updated' => null, 'status' => 'sin_datos', 'minimum' => null,
        'maximum' => null, 'observation' => false, 'pumps' => null, 'extra' => array());
}

function lnExtra(&$item, $label, $value, $unit) {
    $v = lnNumber($value);
    if ($v !== null) $item['extra'][] = array('label' => $label, 'value' => $v, 'unit' => $unit);
}

function lnDbRows($table, $codes) {
    $rows = array();
    $query = "SELECT * FROM " . $table . " WHERE Codigo IN ('" . implode("','", $codes) . "')";
    if (function_exists('mysql_query') && function_exists('mysql_fetch_assoc')) {
        $result = @mysql_query($query);
        if ($result) while ($row = @mysql_fetch_assoc($result)) $rows[strtoupper(trim((string)$row['Codigo']))] = $row;
        return $rows;
    }
    foreach (array('mysqli', 'conn', 'conexion', 'connection', 'con', 'link') as $variable) {
        if (!isset($GLOBALS[$variable]) || !($GLOBALS[$variable] instanceof mysqli)) continue;
        $result = @$GLOBALS[$variable]->query($query);
        if ($result) while ($row = @$result->fetch_assoc()) $rows[strtoupper(trim((string)$row['Codigo']))] = $row;
        break;
    }
    return $rows;
}

function lnRoots($sub) {
    $bases = array(dirname(dirname(__DIR__)), dirname(__DIR__), realpath(getcwd() . '/../..'),
        isset($_SERVER['DOCUMENT_ROOT']) ? $_SERVER['DOCUMENT_ROOT'] : '');
    $out = array();
    foreach ($bases as $b) {
        if (!$b) continue;
        foreach (array($sub, ucfirst($sub)) as $s) $out[] = rtrim($b, '/\\') . '/' . $s;
    }
    return $out;
}

function lnCsvRoot() {
    foreach (lnRoots('lecturas') as $root) {
        if (is_dir($root) && is_readable($root)) return $root;
    }
    return '';
}

function lnLastRow($file) {
    if (!is_file($file) || !is_readable($file)) return null;
    $f = @fopen($file, 'r');
    if (!$f) return null;
    $last = null;
    while (($row = fgetcsv($f, 8192, ',')) !== false) {
        foreach ($row as $cell) { if (trim((string)$cell) !== '') { $last = $row; break; } }
    }
    fclose($f);
    return $last;
}

/* Presa Cerro Prieto: elevación (lecturas/ymd00_OBTO0002.CSV, ELEV0001 o columna 4)
   y almacenamiento / porcentaje (lab/presas.CSV columnas 5 y 6), igual que presas.php y presamapa.php */
function lnReadPresaCerroPrieto() {
    $out = array('elevation' => null, 'timestamp' => null, 'storage' => null, 'percent' => null);
    $root = lnCsvRoot();
    if ($root !== '') {
        $zone = new DateTimeZone('America/Monterrey');
        for ($i = 0; $i <= 1 && $out['elevation'] === null; $i++) {
            $day = (new DateTimeImmutable('today', $zone))->modify('-' . $i . ' day');
            foreach (array('.CSV', '.csv') as $ext) {
                $file = $root . '/' . $day->format('ymd') . '00_OBTO0002' . $ext;
                if (!is_readable($file)) continue;
                $f = @fopen($file, 'r');
                if (!$f) continue;
                $headers = fgetcsv($f, 8192, ',');
                $col = 4;
                if (is_array($headers)) foreach ($headers as $k => $h) if (strtoupper(trim((string)preg_replace('/^\xEF\xBB\xBF/', '', $h))) === 'ELEV0001') $col = $k;
                while (($row = fgetcsv($f, 8192, ',')) !== false) {
                    $v = isset($row[$col]) ? lnNumber($row[$col]) : null;
                    if ($v === null || $v <= 0) continue;
                    $hour = isset($row[2], $row[3]) && is_numeric($row[2]) && is_numeric($row[3]) ? sprintf('%02d:%02d:00', (int)$row[2], (int)$row[3]) : (isset($row[1]) ? $row[1] : '');
                    $ts = lnStamp(isset($row[0]) ? $row[0] : '', $hour);
                    $out['elevation'] = $v;
                    if ($ts !== null) $out['timestamp'] = $ts;
                }
                fclose($f);
                break;
            }
        }
    }
    foreach (lnRoots('lab') as $lab) {
        $row = lnLastRow($lab . '/presas.CSV');
        if ($row === null) $row = lnLastRow($lab . '/presas.csv');
        if ($row === null) continue;
        $out['storage'] = isset($row[5]) ? lnNumber($row[5]) : null;
        $out['percent'] = isset($row[6]) ? lnNumber(str_replace('%', '', (string)$row[6])) : null;
        break;
    }
    return $out;
}

function lnReadRompedor() {
    $root = lnCsvRoot();
    if ($root === '') return null;
    $zone = new DateTimeZone('America/Monterrey');
    for ($i = 0; $i <= 1; $i++) {
        $day = (new DateTimeImmutable('today', $zone))->modify('-' . $i . ' day');
        $file = null;
        foreach (array('.CSV', '.csv') as $ext) {
            $candidate = $root . '/' . $day->format('ymd') . '00_ROMPE001' . $ext;
            if (is_readable($candidate)) { $file = $candidate; break; }
        }
        if ($file === null) continue;
        $f = @fopen($file, 'r');
        if (!$f) continue;
        $headers = fgetcsv($f, 8192, ',');
        if (!$headers) { fclose($f); continue; }
        $keys = array();
        foreach ($headers as $col => $h) $keys[strtoupper(trim((string)preg_replace('/^\xEF\xBB\xBF/', '', $h)))] = $col;
        $latest = null;
        while (($row = fgetcsv($f, 8192, ',')) !== false) {
            $date = isset($row[0]) ? $row[0] : '';
            $hour = isset($row[2], $row[3]) ? sprintf('%02d:%02d:00', (int)$row[2], (int)$row[3]) : (isset($row[1]) ? $row[1] : '');
            $ts = lnStamp($date, $hour);
            if ($ts === null || $ts > time() + 60) continue;
            if ($latest === null || $ts >= $latest['timestamp']) {
                $latest = array('timestamp' => $ts);
                foreach (array('FL0000001', 'FL0000002', 'PRES001', 'PRES002') as $key)
                    $latest[$key] = isset($keys[$key], $row[$keys[$key]]) ? lnNumber($row[$keys[$key]]) : null;
            }
        }
        fclose($f);
        if ($latest !== null) return $latest;
    }
    return null;
}

$items = array();
foreach ($definitions as $code => $definition) $items[$code] = lnEmpty($code);
$connectionFile = __DIR__ . '/../../lol/includes/connection2.php';
if (is_file($connectionFile)) { ob_start(); @include_once $connectionFile; ob_end_clean(); }
$rowsByTable = array(
    'linares' => lnDbRows('linares', array('LINPB001')),
    'sanroque' => lnDbRows('sanroque', array('LINPB002', 'LINPB02A', 'LINPB003', 'LINPB004', 'PPLLN001', 'PBSRQ005', 'TACPSR01', 'TACPSR02', 'TGRP0001'))
);
$readings = 0;
foreach ($definitions as $code => $definition) {
    if ($code === 'ROMPE001') continue;
    $table = $definition['table'];
    if (!isset($rowsByTable[$table][$code])) continue;
    $row = $rowsByTable[$table][$code];
    $item = $items[$code];
    $stamp = lnStamp(isset($row['Fecha']) ? $row['Fecha'] : '', isset($row['Hora']) ? $row['Hora'] : '');
    if ($stamp !== null) {
        $item['updated'] = date('Y-m-d H:i:s', $stamp);
        $item['status'] = time() - $stamp > 1800 ? 'sin_comunicacion' : 'operando';
    }
    $rawLevel = isset($row['Nivel']) ? lnNumber($row['Nivel']) : null;
    if ($rawLevel !== null && $rawLevel > 0 && $rawLevel < 9000)
        $item['level'] = round($rawLevel / 100, 3);
    $rawFlow = isset($row['Flujo']) ? lnNumber($row['Flujo']) : null;
    $item['flow'] = $rawFlow;
    $min = isset($row['Minimo']) ? lnNumber($row['Minimo']) : null;
    $max = isset($row['Maximo']) ? lnNumber($row['Maximo']) : null;
    $item['minimum'] = $min !== null && $min > 25 ? round($min / 100, 3) : $min;
    $item['maximum'] = $max !== null && $max > 25 ? round($max / 100, 3) : $max;
    if ($item['status'] === 'operando' && $item['level'] !== null && $item['minimum'] !== null && $item['maximum'] !== null && $item['maximum'] > $item['minimum'])
        $item['observation'] = $item['level'] < $item['minimum'] || $item['level'] > $item['maximum'];
    if ($item['status'] === 'operando' && isset($definition['pumps']) && isset($row['ED_SD']) && is_numeric($row['ED_SD'])) {
        $bits = (int)$row['ED_SD'];
        $item['pumps'] = array();
        foreach ($definition['pumps'] as $i => $bit) {
            $item['pumps'][] = array('name' => 'Equipo ' . ($i + 1), 'on' => (bool)($bits & $bit));
        }
    }
    if ($code === 'LINPB002') {
        if (isset($row['Presion'])) lnExtra($item, 'Presión succión', lnNumber($row['Presion']) === null ? null : (float)$row['Presion'] / 1000, 'kg/cm²');
        if (isset($row['Disp_1'])) lnExtra($item, 'Presión descarga', lnNumber($row['Disp_1']) === null ? null : (float)$row['Disp_1'] / 1000, 'kg/cm²');
    } elseif ($code === 'LINPB02A') {
        if (isset($row['Presion'])) lnExtra($item, 'Presión descarga', lnNumber($row['Presion']) === null ? null : (float)$row['Presion'] / 1000, 'kg/cm²');
    } elseif ($code === 'LINPB003') {
        if (isset($row['Presion'])) lnExtra($item, 'Presión descarga', lnNumber($row['Presion']) === null ? null : (float)$row['Presion'] / 100, 'kg/cm²');
    } elseif ($code === 'LINPB004') {
        if (isset($row['Disp_3'])) lnExtra($item, 'Llegada Rompedor', $row['Disp_3'], 'LPS');
        if (isset($row['Disp_6'])) lnExtra($item, 'Extracción La Boca', $row['Disp_6'], 'LPS');
        if (isset($row['Disp_9'])) lnExtra($item, 'Aportación La Boca', $row['Disp_9'], 'LPS');
    }
    $items[$code] = $item;
    $readings++;
}
function lnReadGarrapatasCsv() {
    $root = lnCsvRoot();
    if ($root === '') return null;
    $zone = new DateTimeZone('America/Monterrey');
    $now = new DateTimeImmutable('now', $zone);
    for ($dayOffset = 0; $dayOffset <= 1; $dayOffset++) {
        $day = $now->modify('-' . $dayOffset . ' day');
        $file = null;
        foreach (array('.CSV', '.csv') as $ext) {
            $candidate = $root . '/' . $day->format('ymd') . '00_TGRP0001' . $ext;
            if (is_file($candidate) && is_readable($candidate)) { $file = $candidate; break; }
        }
        if ($file === null) continue;
        $handle = @fopen($file, 'r');
        if (!$handle) continue;
        $headers = fgetcsv($handle, 16384, ',');
        if (!is_array($headers)) { fclose($handle); continue; }
        $keys = array();
        foreach ($headers as $i => $field) {
            $key = strtoupper(trim((string)preg_replace('/^\xEF\xBB\xBF/', '', $field)));
            if ($key !== '') $keys[$key] = $i;
        }
        if (!isset($keys['NI0000001'])) { fclose($handle); continue; }
        $column = $keys['NI0000001'];
        $latest = null;
        while (($row = fgetcsv($handle, 16384, ',')) !== false) {
            if (!isset($row[$column])) continue;
            $raw = lnNumber($row[$column]);
            if ($raw === null || $raw < 0 || $raw >= 9000) continue;
            $date = isset($row[0]) ? $row[0] : '';
            $hour = isset($row[2], $row[3]) && is_numeric($row[2]) && is_numeric($row[3])
                ? sprintf('%02d:%02d:00', (int)$row[2], (int)$row[3])
                : (isset($row[1]) ? trim((string)$row[1]) : '');
            $stamp = lnStamp($date, $hour);
            if ($stamp === null || $stamp > time() + 60) continue;
            if ($latest === null || $stamp >= $latest['timestamp'])
                $latest = array('timestamp' => $stamp, 'level' => round($raw / 100, 3));
        }
        fclose($handle);
        if ($latest !== null) return $latest;
    }
    return null;
}

$garrapatasCsv = lnReadGarrapatasCsv();
if ($garrapatasCsv !== null) {
    $item = $items['TGRP0001'];
    $item['level'] = $garrapatasCsv['level'];
    $item['updated'] = date('Y-m-d H:i:s', $garrapatasCsv['timestamp']);
    $item['status'] = (time() - $garrapatasCsv['timestamp'] > 1800) ? 'sin_comunicacion' : 'operando';
    $item['source'] = 'CSV NI0000001';
    $items['TGRP0001'] = $item;
    $readings++;
}
$rompedor = lnReadRompedor();
if ($rompedor !== null) {
    $item = $items['ROMPE001'];
    $item['flow'] = $rompedor['FL0000001'];
    $item['updated'] = date('Y-m-d H:i:s', $rompedor['timestamp']);
    $item['status'] = time() - $rompedor['timestamp'] > 1800 ? 'sin_comunicacion' : 'operando';
    lnExtra($item, 'Conducción 42"', $rompedor['FL0000002'], 'LPS');
    lnExtra($item, 'Presión entrada', $rompedor['PRES002'], 'kg/cm²');
    lnExtra($item, 'Presión salida', $rompedor['PRES001'], 'kg/cm²');
    $items['ROMPE001'] = $item;
    $readings++;
}
$presa = lnReadPresaCerroPrieto();
$item = lnEmpty('PRESACP');
$item['level'] = $presa['elevation'];
if ($presa['timestamp'] !== null) {
    $item['updated'] = date('Y-m-d H:i:s', $presa['timestamp']);
    $item['status'] = time() - $presa['timestamp'] > 1800 ? 'sin_comunicacion' : 'operando';
} elseif ($presa['elevation'] !== null || $presa['percent'] !== null) {
    $item['status'] = 'operando';
}
lnExtra($item, 'Almacenamiento', $presa['storage'], 'Mm³');
lnExtra($item, 'Llenado', $presa['percent'], '%');
$items['PRESACP'] = $item;
if ($presa['elevation'] !== null || $presa['percent'] !== null) $readings++;

echo json_encode(array('ok' => true, 'items' => $items, 'updated' => date('Y-m-d H:i:s'),
    'available' => $readings > 0, 'source' => 'linares/sanroque/lecturas'), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
