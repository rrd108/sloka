<?php

ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start();

require __DIR__ . '/vendor/autoload.php';

$urlBase = 'http://pandit.hu/app/';
$curl = new Curl\Curl();

if (!$_SESSION['cookie'] || $_GET['url'] == 'auth/authenticate') {
    login($urlBase . 'auth/authenticate', $curl);
} elseif (isset($_GET['url'])) {
    callUrl($urlBase . $_GET['url'], $curl);
}

function callUrl($url, $curl)
{
    foreach ($_SESSION['cookie'] as $cookie) {
        $curl->setCookie($cookie['key'], $cookie['val']);
    }
    $curl->get($url . $_GET['url']);
    echo $curl->response;
}

function login($url, $curl)
{
    $curl->post(
        $url,
        [
            'email' => $_POST['email'],
            'password' => $_POST['password']
        ]
    );
    foreach ($curl->response_headers as $h) {
        if (preg_match('/^Set-Cookie:\s*([^;]*)/i', $h, $matches)) {
            unset($_SESSION['cookie']);
            parse_str($matches[1], $cookie);
            $_SESSION['cookie'][] = [
                'key' => key($cookie),
                'val' => current($cookie)
            ];
        }
    }
    echo $curl->response;
}

