<?php
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING & ~E_DEPRECATED);
$requestPath = isset($_SERVER['REQUEST_URI'])
  ? parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH)
  : '';

if (strcasecmp($requestPath, '/Telemetria/php/anillotvcompleto.php') === 0) {
  header('Location: /anillo-tv', true, 302);
  exit;
}

header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');
header('Expires: 0');
require_once("../../CambioHorario/horario.php");
require_once("../../lol/includes/connection2.php");
set_time_limit(300);
$hhh = ((date("H") * 60) + date("i")) - 30;
$hhs = ((date("H") * 60) + date("i")) + 60;
$im = 0;

$Tabla = "garcia";
$DATOS = @mysql_query("select * from " . $Tabla);
while ($trabaja = mysql_fetch_array($DATOS)) {
  $data2[$trabaja['Codigo']] = $trabaja;
}
$S = date("ymd00");
$p = 0;
$trendverde = 0;
$trendrojo = 0;

$commAlerts = array();

function commMinutesFromHour($hora)
{
  $hora = trim((string) $hora);
  if ($hora === '')
    return null;

  if (preg_match('/^(\d{1,2}):(\d{1,2})/', $hora, $m)) {
    return ((int) $m[1] * 60) + (int) $m[2];
  }

  if (is_numeric($hora)) {
    return (int) $hora;
  }

  return null;
}

function commOutOfRange($hora, $hhh, $hhs)
{
  $minutos = commMinutesFromHour($hora);
  if ($minutos === null) {
    return 1;
  }
  return ($minutos < $hhh || $minutos > $hhs) ? 1 : 0;
}

function lpsNumeroAnillo($valor)
{
  $valor = trim((string) $valor);
  if ($valor === '') {
    return 0;
  }

  $valor = str_replace(',', '', $valor);
  $valor = preg_replace('/[^0-9.\-]/', '', $valor);

  if ($valor === '' || $valor === '-' || $valor === '.') {
    return 0;
  }

  return (float) $valor;
}

$var = "TSF00001";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_TSF00001.CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TSF00001 = array($Nivel, 0, $trend, $trendFlecha, $color);
$commAlerts['TSF00001'] = commOutOfRange($hr, $hhh, $hhs);

$Tabla = "mtyv";
$DATOS = @mysql_query("select * from " . $Tabla);
while ($trabaja = mysql_fetch_array($DATOS)) {
  $data2[$trabaja['Codigo']] = $trabaja;
}

$var = "TFR00004";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TFR00004 = array($Nivel, 0, $trend, $trendFlecha, $color);
$commAlerts['TFR00004'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TFR00005";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TFR00005 = array($Nivel, 0, $trend, $trendFlecha, $color);
$commAlerts['TFR00005'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TBFR0003";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TBFR0003 = array($Nivel, 0, $trend, $trendFlecha, $color);
$commAlerts['TBFR0003'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TBMNAS01";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TBMNAS01 = array($Nivel, 0, $trend, $trendFlecha, $color);
$commAlerts['TBMNAS01'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TBGA0002";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Flujo'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TBGA0002 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color);
$commAlerts['TBGA0002'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TBGC0001";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Flujo'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TBGC0001 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color);
$commAlerts['TBGC0001'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TBEF0002";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Flujo'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TBEF0002 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color);
$commAlerts['TBEF0002'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TBEF0001";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Flujo'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TBEF0001 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color);
$commAlerts['TBEF0001'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TBALR001";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Flujo'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TBALR001 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color);
$commAlerts['TBALR001'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TNVAC001";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Flujo'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TNVAC001 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color);
$commAlerts['TNVAC001'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TNVAC003";
$var2 = "TNVACR03";
$hr = $data2[$var2]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var2]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var2]['Disp_2'];
$FLUJOaNC1A = $data2[$var2]['Flujo'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }

  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde++;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo++;
  }

  fclose($fp);
  unset($data1);
}
$TNVACR03 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color, $FLUJOaNC1A);
$commAlerts['TNVACR03'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TNVAC003";
$var2 = "TNVACR03";
$hr = $data2[$var2]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var2]['Disp_1'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data1[] = $data[5];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }

  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde++;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo++;
  }

  fclose($fp);
  unset($data1);
}
$TNVAC003 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color);
$commAlerts['TNVAC003'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TBSR0002";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Flujo'];
$FLUJOPES = $data2[$var]['Disp_2'];
$FLUJOSAL = $data2[$var]['Disp_1'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TBSR0002 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color, $FLUJOSAL, $FLUJOPES);
$commAlerts['TBSR0002'] = commOutOfRange($hr, $hhh, $hhs);

$Tabla = "anillo";
$DATOS = @mysql_query("select * from " . $Tabla);
while ($trabaja = mysql_fetch_array($DATOS)) {
  $data2[$trabaja['Codigo']] = $trabaja;
}

$var = "TBSMA001";
$var2 = "MAFU106";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Disp_3'];
$FLUJOPENAL_SM = $data2[$var2]['Flujo'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TBSMA001 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color, $FLUJOPENAL_SM);
$commAlerts['TBSMA001'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TBSBR01";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Flujo'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$trendTanque = 0;
$trendTanqueFlecha = "down";
$trendTanqueColor = "red";

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if ($fp) {
  $data1 = array();
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data1[] = $data[4];
  }
  fclose($fp);

  $CUANTOS = count($data1);
  if ($CUANTOS > 1) {
    if (($CUANTOS - 12) > 1) {
      $trendTanque = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
    } else {
      $trendTanque = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
    }
  }

  if ($trendTanque > 0) {
    $trendTanqueFlecha = "up";
    $trendTanqueColor = "green";
    $trendverde++;
  } else {
    $trendTanqueFlecha = "down";
    $trendTanqueColor = "red";
    $trendrojo++;
  }

  unset($data1);
}

$TBSBR01 = array($Nivel, $FLUJO, $trendTanque, $trendTanqueFlecha, $trendTanqueColor);
$commAlerts['TBSBR01'] = commOutOfRange($hr, $hhh, $hhs);

$trendSBRRect = 0;
$trendSBRRectFlecha = "down";
$trendSBRRectColor = "red";

$fp = @fopen("../../lecturas/$S" . "_MMAFU109.CSV", "r");
if ($fp) {
  $dataTrendRect = array();
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $dataTrendRect[] = $data[4];
  }
  fclose($fp);

  $CUANTOS = count($dataTrendRect);
  if ($CUANTOS > 1) {
    if (($CUANTOS - 12) > 1) {
      $trendSBRRect = number_format(($dataTrendRect[$CUANTOS - 1] - $dataTrendRect[$CUANTOS - 12]) / 100, 2, '.', '');
    } else {
      $trendSBRRect = number_format(($dataTrendRect[$CUANTOS - 1] - $dataTrendRect[1]) / 100, 2, '.', '');
    }
  }

  if ($trendSBRRect > 0) {
    $trendSBRRectFlecha = "up";
    $trendSBRRectColor = "green";
  } else {
    $trendSBRRectFlecha = "down";
    $trendSBRRectColor = "red";
  }

  unset($dataTrendRect);
}

$SBRRECT_VIS = array($trendSBRRect, $trendSBRRectFlecha, $trendSBRRectColor);

$var = "TBSBC01";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Flujo'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TBSBC01 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color);
$commAlerts['TBSBC01'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TBPENA01";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Flujo'];
$FLUJOaRED = $data2[$var]['Disp_1'];
$FLUJOaSB = $data2[$var]['Disp_2'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TBPENA01 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color, $FLUJOaRED, $FLUJOaSB);
$commAlerts['TBPENA01'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TBESCO01";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Flujo'];
$FLUJOaRED = $data2[$var]['Disp_1'];
$FLUJOaCAN = $data2[$var]['Disp_2'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TBESCO01 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color, $FLUJOaRED, $FLUJOaCAN);
$commAlerts['TBESCO01'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TBAPO001";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Flujo'];
$FLUJOaRED = $data2[$var]['Disp_1'];
$FLUJOaCAN = $data2[$var]['Disp_2'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TBAPO001 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color, $FLUJOaRED, $FLUJOaCAN);
$commAlerts['TBAPO001'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TBMAL001";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Flujo'];
$FLUJOaRED = $data2[$var]['Disp_1'];
$FLUJOaCAN = $data2[$var]['Disp_2'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TBMAL001 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color, $FLUJOaRED, $FLUJOaCAN);
$commAlerts['TBMAL001'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TOBISP01";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Flujo'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_TOBISPD1.CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TOBISP01 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color);
$commAlerts['TOBISP01'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TBLL0001";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Disp_1'];
$FLUJOob = $data2[$var]['Disp_2'];
$FLUJOVALL = $data2[$var]['Disp_3'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TBLL0001 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color, $FLUJOob, $FLUJOVALL);
$commAlerts['TBLL0001'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TBSU0001";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Flujo'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }
  fclose($fp);
  unset($data1);
}
$TBSU0001 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color);
$commAlerts['TBSU0001'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TVALLE02";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Flujo'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TVALLE02 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color);
$commAlerts['TVALLE02'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TBVAL004";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Flujo'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TBVAL004 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color);
$commAlerts['TBVAL004'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TBSILLA1";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Disp_3'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TBSILLA1 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color);
$commAlerts['TBSILLA1'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TBALTA02";
$var2 = "MALTR001";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var2]['Flujo'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TBALTA02 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color);
$commAlerts['TBALTA02'] = commOutOfRange($hr, $hhh, $hhs);

$Tabla = "sannicolas";
$DATOS = @mysql_query("select * from " . $Tabla);
while ($trabaja = mysql_fetch_array($DATOS)) {
  $data2[$trabaja['Codigo']] = $trabaja;
}

$var = "TBTOP001";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');

$dataTopFlow = array();
$fp = @fopen("../../lecturas/$S" . "_MMFTOP01.CSV", "r");
if ($fp) {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $dataTopFlow = $data;
  }
  fclose($fp);

  if (isset($dataTopFlow[4])) {
    $FLUJO = $dataTopFlow[4];
  }
}

$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$dataTrend = array();
$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $dataTrend[] = $data[4];
  }
  fclose($fp);

  $CUANTOS = count($dataTrend);
  if ($CUANTOS > 1) {
    if (($CUANTOS - 12) > 1) {
      $trend = number_format(($dataTrend[$CUANTOS - 1] - $dataTrend[$CUANTOS - 12]) / 100, 2, '.', '');
    } else {
      $trend = number_format(($dataTrend[$CUANTOS - 1] - $dataTrend[1]) / 100, 2, '.', '');
    }
  } else {
    $trend = 0;
  }

  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }
}
$TBTOP001 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color);
$commAlerts['TBTOP001'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TBCND001";
$var2 = "STBCN001";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var2]['Flujo'];
$FLUJO36 = $data2[$var2]['Flujo'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TBCND001 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color, $FLUJO36);
$commAlerts['TBCND001'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TBSNC001";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Flujo'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TBSNC001 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color);
$commAlerts['TBSNC001'] = commOutOfRange($hr, $hhh, $hhs);

$Tabla = "guadalupe";
$DATOS = @mysql_query("select * from " . $Tabla);
while ($trabaja = mysql_fetch_array($DATOS)) {
  $data2[$trabaja['Codigo']] = $trabaja;
}
$var2 = "TBSRQA01";
$var = "TLAP0001";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Flujo'];
$FLUJOSR_ESC = $data2[$var2]['Disp_1'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TLAP0001 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color, $FLUJOSR_ESC);
$commAlerts['TLAP0001'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TLAP0002";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Flujo'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TLAP0002 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color);
$commAlerts['TLAP0002'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TBSRO003";
$var2 = "ALNTE000";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var2]['Flujo'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TBSRO003 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color);
$commAlerts['TBSRO003'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TJUA0001";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Flujo'];
$FLUJO_salida = $data2[$var]['Disp_1'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TJUA0001 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color, $FLUJO_salida);
$commAlerts['TJUA0001'] = commOutOfRange($hr, $hhh, $hhs);

$var = "TARB0002";
$hr = $data2[$var]['Hora'];
$hora = explode(":", $hr);
$Nivel = number_format($data2[$var]['Nivel'] / 100, 2, '.', '');
$FLUJO = $data2[$var]['Flujo'];
$FLUJO_ARB3 = $data2[$var]['Disp_2'];
$mn = $hora[1];
$minutos = ($hr * 60) + $mn;
if ($minutos < $hhh || $minutos > $hhs) {
} else {
}

$fp = @fopen("../../lecturas/$S" . "_" . $var . ".CSV", "r");
if (!$fp) {
  $trend = 0;
  $trendFlecha = "down";
  $color = "red";
} else {
  while (($data = fgetcsv($fp, 1000, ",")) !== FALSE) {
    $data3 = $data;
    $data1[] = $data[4];
  }
  $CUANTOS = count($data1);
  if (($CUANTOS - 12) > 1) {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[$CUANTOS - 12]) / 100, 2, '.', '');
  } else {
    $trend = number_format(($data1[$CUANTOS - 1] - $data1[1]) / 100, 2, '.', '');
  }
  if ($trend > 0) {
    $trendFlecha = "up";
    $color = "green";
    $trendverde = $trendverde + 1;
  } else {
    $trendFlecha = "down";
    $color = "red";
    $trendrojo = $trendrojo + 1;
  }

  fclose($fp);
  unset($data1);
}
$TARB0002 = array($Nivel, $FLUJO, $trend, $trendFlecha, $color, $FLUJO_ARB3);
$commAlerts['TARB0002'] = commOutOfRange($hr, $hhh, $hhs);

$Tabla = "sur";
$DATOS = @mysql_query("select * from " . $Tabla);
while ($trabaja = mysql_fetch_array($DATOS)) {
  $data2[$trabaja['Codigo']] = $trabaja;
}
$var = "SATSUR01";
$STSUR036 = $data2[$var]['Flujo'];
$STSUR024 = $data2[$var]['Disp_1'];

$Tabla = "mina";
$DATOS = @mysql_query("select * from " . $Tabla);
while ($trabaja = mysql_fetch_array($DATOS)) {
  $data2[$trabaja['Codigo']] = $trabaja;
}
$var = "ACUEM001";
$MINA1 = $data2[$var]['Flujo'];
$var = "ACUEM002";
$MINA2 = $data2[$var]['Flujo'];

$Tabla = "santiago";
$DATOS = @mysql_query("select * from " . $Tabla);
while ($trabaja = mysql_fetch_array($DATOS)) {
  $data2[$trabaja['Codigo']] = $trabaja;
}
$var = "ACSI0001";
$FLUJOACSTGO1 = $data2[$var]['Flujo'];
$var = "ACSII002";
$FLUJOACSTGO2 = $data2[$var]['Disp_1'];
$var = "TC1000";
$CLARIFICADOR1 = $data2[$var]['Flujo'];
$var = "PPLBCLA2";
$CLARIFICADOR2 = $data2[$var]['Flujo'];
$CLARIFICADORES = $CLARIFICADOR1 + $CLARIFICADOR2;

$Tabla = "pozosmetro";
$DATOS = @mysql_query("select * from " . $Tabla);
while ($trabaja = mysql_fetch_array($DATOS)) {
  $data2[$trabaja['Codigo']] = $trabaja;
}
$var = "ACSI0002";
$FLUJOACSTGO1SAT = $data2[$var]['Flujo'];
$var = "ACSII001";
$FLUJOACSTGO2CON = $data2[$var]['Disp_1'];

$Tabla = "sanroque";
$DATOS = @mysql_query("select * from " . $Tabla);
while ($trabaja = mysql_fetch_array($DATOS)) {
  $data2[$trabaja['Codigo']] = $trabaja;
}
$var = "MMAFU158";
$FLUJOMEDIDORBRECHA = $data2[$var]['Flujo'];
$var = "MMAFU176";
$FLUJOMTYV = $data2[$var]['Flujo'];
$DERIVACIONESMTYV = lpsNumeroAnillo($FLUJOMTYV) - lpsNumeroAnillo(isset($TBSR0002[1]) ? $TBSR0002[1] : 0);
if ($DERIVACIONESMTYV < 0) {
  $DERIVACIONESMTYV = 0;
}
$DERIVACIONESMTYV = number_format($DERIVACIONESMTYV, 0, '.', ',');
$var = "CHIPB000";
$FLUJOPB01 = $data2[$var]['Flujo'];
$var = "CHIPB200";
$FLUJOPB02 = $data2[$var]['Flujo'];
$var = "LINPB004";
$FLUJOaPB5 = $data2[$var]['Flujo'];
$var = "LINPB004";
$FLUJOaRompedor = $data2[$var]['Disp_3'];
$FLUJOaLB = $data2[$var]['Disp_9'];
$FLUJOdeLB = $data2[$var]['Disp_6'];

$Tabla = "linares";
$DATOS = @mysql_query("select * from " . $Tabla);
while ($trabaja = mysql_fetch_array($DATOS)) {
  $data2[$trabaja['Codigo']] = $trabaja;
}
$var = "LINPB001";
$FLUJOLPB1 = $data2[$var]['Flujo'];

$Tabla = "fama";
$DATOS = @mysql_query("select * from " . $Tabla);
while ($trabaja = mysql_fetch_array($DATOS)) {
  $data2[$trabaja['Codigo']] = $trabaja;
}
$var = "MAFLSC02";
$FLUJOLQUIN = $data2[$var]['Flujo'];
$hr = isset($data2[$var]['Hora']) ? $data2[$var]['Hora'] : "00:00";
$commAlerts['MAFLSC02'] = commOutOfRange($hr, $hhh, $hhs);
$var = "MMDT001";
$FLUJOLDAL = $data2[$var]['Flujo'];
$var = "VALLEP01";
$FLUJOLVAPO = $data2[$var]['Flujo'];

$Tabla = "buenosaires";
$DATOS = @mysql_query("select * from " . $Tabla);
while ($trabaja = mysql_fetch_array($DATOS)) {
  $data2[$trabaja['Codigo']] = $trabaja;
}
$var = "MMH001";
$FLUJOLHOR = $data2[$var]['Flujo'];

$tanqueDefiniciones = json_decode(<<<'JSON_TANQUES'
[
  [
    "LA CRUZ",
    "TSF00001",
    "TSF00001"
  ],
  [
    "FRAILE 5",
    "TFR00005",
    "TFR00005"
  ],
  [
    "GARCÍA 2",
    "TBGA0002",
    "TBGA0002"
  ],
  [
    "GARCÍA 1",
    "TBGC0001",
    "TBGC0001"
  ],
  [
    "FRAILE 2",
    "TBEF0002",
    "TBEF0002"
  ],
  [
    "FRAILE 4",
    "TFR00004",
    "TFR00004"
  ],
  [
    "FRAILE 3",
    "TBFR0003",
    "TBFR0003"
  ],
  [
    "FRAILE 1",
    "TBEF0001",
    "TBEF0001"
  ],
  [
    "REAL DE MINA",
    "TBMNAS01",
    "TBMNAS01"
  ],
  [
    "ALIANZA REAL",
    "TBALR001",
    "TBALR001"
  ],
  [
    "NUEVA CASTILLA AMP",
    "TNVAC001",
    "TNVAC001"
  ],
  [
    "NUEVA CASTILLA 3 RECTANGULAR",
    "TNVACR03",
    "TNVACR03"
  ],
  [
    "NUEVA CASTILLA 3 CIRCULAR",
    "TNVAC003",
    "TNVAC003"
  ],
  [
    "SANTA ROSA 2",
    "TBSR0002",
    "TBSR0002"
  ],
  [
    "ESCOBEDO",
    "TBESCO01",
    "TBESCO01"
  ],
  [
    "APODACA",
    "TBAPO001",
    "TBAPO001"
  ],
  [
    "MIGUEL ALEMÁN",
    "TBMAL001",
    "TBMAL001"
  ],
  [
    "LA PAZ 2",
    "TLAP0002",
    "TLAP0002"
  ],
  [
    "LA PAZ 1",
    "TLAP0001",
    "TLAP0001"
  ],
  [
    "SAN ROQUE OTE",
    "TBSRO003",
    "TBSRO003"
  ],
  [
    "CAÑADA",
    "TBCND001",
    "TBCND001"
  ],
  [
    "SAN NICOLÁS",
    "TBSNC001",
    "TBSNC001"
  ],
  [
    "PENAL",
    "TBPENA01",
    "TBPENA01"
  ],
  [
    "TOPO CHICO",
    "TBTOP001",
    "TBTOP001"
  ],
  [
    "SAN MARTÍN 1",
    "TBSMA001",
    "TBSMA001"
  ],
  [
    "SAN BERNABÉ RECTANGULAR",
    "TBSBR01",
    "TBSBR01"
  ],
  [
    "SAN BERNABÉ CIRCULAR",
    "TBSBC01",
    "TBSBC01"
  ],
  [
    "OBISPADO",
    "TOBISP01",
    "TOBISP01"
  ],
  [
    "VALLE 2",
    "TVALLE02",
    "TVALLE02"
  ],
  [
    "VALLE 4",
    "TBVAL004",
    "TBVAL004"
  ],
  [
    "LOMA LARGA",
    "TBLL0001",
    "TBLL0001"
  ],
  [
    "SUR",
    "TBSU0001",
    "TBSU0001"
  ],
  [
    "ALTAMIRA 2",
    "TBALTA02",
    "TBALTA02"
  ],
  [
    "LA SILLA 1",
    "TBSILLA1",
    "TBSILLA1"
  ],
  [
    "JUÁREZ",
    "TJUA0001",
    "TJUA0001"
  ],
  [
    "ARBOLEDAS 2",
    "TARB0002",
    "TARB0002"
  ]
]
JSON_TANQUES
, true);
$flujoDefiniciones = json_decode(<<<'JSON_FLUJOS'
[
  [
    "lps_escobedo_red_down_2",
    "TBESCO01",
    5
  ],
  [
    "lps_penal_bottom_manual",
    "TBPENA01",
    6
  ],
  [
    "lps_LL_A_PENAL",
    "TBPENA01",
    1
  ],
  [
    "lps_san_bern_rect_zero",
    "TBSBR01",
    1
  ],
  [
    "lps_la_silla1_down_manual",
    "TBSILLA1",
    1
  ],
  [
    "lps_la_paz2_down_zero",
    "TLAP0002",
    1
  ],
  [
    "lps_la_paz1_down_zero",
    "TLAP0001",
    1
  ],
  [
    "lps_SR_A_ESCOBEDO",
    "TLAP0001",
    5
  ],
  [
    "lps_penal-sanmartin",
    "TBSMA001",
    5
  ],
  [
    "lps_5116",
    "MINA2",
    null
  ],
  [
    "lps_4176",
    "MINA1",
    null
  ],
  [
    "lps_267",
    "TNVACR03",
    1
  ],
  [
    "lps_139",
    "TNVAC003",
    1
  ],
  [
    "lps_211",
    "TBSR0002",
    6
  ],
  [
    "lps_8766",
    "TBSR0002",
    1
  ],
  [
    "lps_derivaciones_mtyv",
    "DERIVACIONESMTYV",
    null
  ],
  [
    "lps_3013",
    "FLUJOMTYV",
    null
  ],
  [
    "lps_167",
    "TBGA0002",
    1
  ],
  [
    "lps_0a",
    "TBGC0001",
    1
  ],
  [
    "redSB_circular",
    "TBSBC01",
    1
  ],
  [
    "lps_red_SanMartin",
    "TBSMA001",
    1
  ],
  [
    "lps_0c",
    "TBTOP001",
    1
  ],
  [
    "lps_0d",
    "TBEF0002",
    1
  ],
  [
    "lps_salida_fraile1",
    "TBEF0001",
    1
  ],
  [
    "lps_542",
    "TBALR001",
    1
  ],
  [
    "lps_santa_rosa2_salida",
    "TBSR0002",
    5
  ],
  [
    "lps_nva_cast_3_down",
    "TNVACR03",
    5
  ],
  [
    "lps_908",
    "TNVAC001",
    1
  ],
  [
    "lps_304a",
    "TBAPO001",
    1
  ],
  [
    "lps_304b",
    "TBESCO01",
    5
  ],
  [
    "lps_304c",
    "TBCND001",
    1
  ],
  [
    "lps_304d",
    "TBCND001",
    5
  ],
  [
    "lps_miguel_aleman_0",
    "TBMAL001",
    1
  ],
  [
    "lps_alimentador_norte_red",
    "TBSRO003",
    1
  ],
  [
    "SantaCatarinaQuintas",
    "FLUJOLQUIN",
    null
  ],
  [
    "ACHuasteca",
    "FLUJOLDAL",
    null
  ],
  [
    "lps_1731",
    "FLUJOLHOR",
    null
  ],
  [
    "lps_560",
    "FLUJOLVAPO",
    null
  ],
  [
    "lps_lomalargared",
    "TBLL0001",
    1
  ],
  [
    "lps_lomalargaobispado",
    "TBLL0001",
    5
  ],
  [
    "lps_lomalargavalle",
    "TBLL0001",
    6
  ],
  [
    "lps_llegadajuarez",
    "TJUA0001",
    1
  ],
  [
    "lps_salidajuarez",
    "TJUA0001",
    5
  ],
  [
    "lps_sur-red36",
    "STSUR036",
    null
  ],
  [
    "lps_sur-red24",
    "STSUR024",
    null
  ],
  [
    "lps_1198b",
    "FLUJOACSTGO1SAT",
    null
  ],
  [
    "lps_santiago_cero_nuevo",
    "FLUJOACSTGO1",
    null
  ],
  [
    "lps_a_alltamira3",
    "TBALTA02",
    1
  ],
  [
    "lps_santiago2_cero_arriba",
    "FLUJOACSTGO2CON",
    null
  ],
  [
    "lps_304e",
    "FLUJOACSTGO2",
    null
  ],
  [
    "lps_791",
    "CLARIFICADORES",
    null
  ],
  [
    "lps_1140",
    "FLUJOaLB",
    null
  ],
  [
    "lps_MEDIDORBRECHA",
    "FLUJOMEDIDORBRECHA",
    null
  ],
  [
    "arb2-salido-arb3",
    "TARB0002",
    1
  ],
  [
    "extraccion_dela_boca",
    "FLUJOdeLB",
    null
  ],
  [
    "lps_4236",
    "FLUJOaPB5",
    null
  ],
  [
    "lps_4583",
    "FLUJOLPB1",
    null
  ],
  [
    "lps_4271",
    "FLUJOPB01",
    null
  ],
  [
    "lps_2451",
    "FLUJOPB02",
    null
  ]
]
JSON_FLUJOS
, true);
function tv3dNumero($valor) {
  if (is_int($valor) || is_float($valor)) return is_finite((float)$valor) ? (float)$valor : null;
  if (!is_string($valor)) return null;
  $valor = trim(str_replace(',', '', $valor));
  return is_numeric($valor) ? (float)$valor : null;
}
function tv3dEstado($hora) {
  if (!preg_match('/^(\d{1,2}):(\d{2})/', trim((string)$hora), $m)) return 'sin_datos';
  $hh = (int)$m[1]; $mm = (int)$m[2];
  if ($hh > 23 || $mm > 59) return 'sin_datos';
  $now = (int)date('G')*60 + (int)date('i');
  $then = $hh*60 + $mm;
  $difference = ($now-$then+1440)%1440;
  return $difference > 30 ? 'sin_comunicacion' : 'actual';
}
$tanques = array(); $flujos = array(); $validos = 0; $sinCom = 0;
foreach ($tanqueDefiniciones as $item) {
  list($name, $variable, $code) = $item;
  $row = isset($data2[$code]) ? $data2[$code] : null;
  $array = isset($$variable) && is_array($$variable) ? $$variable : null;
  $nivel = $row && isset($row['Nivel']) ? tv3dNumero($row['Nivel']) : null;
  $nivel = $nivel === null ? null : round($nivel / 100, 2);
  $delta = $array && isset($array[2]) && $row ? tv3dNumero($array[2]) : null;
  $hora = $row && isset($row['Hora']) ? (string)$row['Hora'] : null;
  $estado = $row ? tv3dEstado($hora) : 'sin_datos';
  if ($nivel !== null) $validos++;
  if ($estado === 'sin_comunicacion') $sinCom++;
  $limiteAlto = null;
  $limiteBajo = null;
  if ($row && is_array($row)) {
    $maximo = isset($row['Maximo']) ? tv3dNumero($row['Maximo']) : null;
    $minimo = isset($row['Minimo']) ? tv3dNumero($row['Minimo']) : null;
    if ($maximo !== null && $maximo > 0) {
      $limiteAlto = $maximo > 30 ? $maximo / 100 : $maximo;
    }
    if ($minimo !== null && $minimo > 0) $limiteBajo = $minimo > 30 ? $minimo / 100 : $minimo;
  }
  $observacion = null;
  if ($estado === 'actual' && $nivel !== null && ($limiteAlto !== null || $limiteBajo !== null)) {
    $observacion = ($limiteAlto !== null && $nivel >= $limiteAlto) || ($limiteBajo !== null && $nivel <= $limiteBajo);
  }
  $tanques[$name] = array('nivel_m'=>$nivel, 'tendencia_m'=>$delta, 'hora'=>$hora, 'estado'=>$estado, 'en_observacion'=>$observacion, 'capacidad_cm'=>null);
}
foreach ($flujoDefiniciones as $item) {
  list($id, $variable, $index) = $item;
  $value = isset($$variable) ? $$variable : null;
  if ($index !== null) $value = is_array($value) && array_key_exists($index, $value) ? $value[$index] : null;
  $number = tv3dNumero($value);
  $flujos[$id] = array('lps'=>$number, 'estado'=>$number === null ? 'sin_datos' : 'actual');
}
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
echo json_encode(array('ok'=>true, 'sistema'=>'ANILLO TV', 'consultado'=>date('Y-m-d H:i:s'), 'tanques'=>$tanques, 'flujos'=>$flujos, 'bombas'=>array(), 'total_tanques_con_lectura'=>$validos, 'tanques_sin_comunicacion'=>$sinCom), (defined('JSON_UNESCAPED_UNICODE') ? JSON_UNESCAPED_UNICODE : 0) | (defined('JSON_INVALID_UTF8_SUBSTITUTE') ? JSON_INVALID_UTF8_SUBSTITUTE : 0));
