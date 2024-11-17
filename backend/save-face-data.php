<?php
header('Content-Type: application/json');

// Mendapatkan data POST
$data = json_decode(file_get_contents('php://input'), true);

$name = $data['name'];
$descriptor = $data['descriptor'];

if (!$name || !$descriptor) {
    http_response_code(400);
    echo json_encode(['error' => 'Name and descriptor are required.']);
    exit;
}

$filename = 'faceData.json';
$faceData = [];

if (file_exists($filename)) {
    $faceData = json_decode(file_get_contents($filename), true);
}

if (!isset($faceData[$name])) {
    $faceData[$name] = [];
}

$faceData[$name][] = $descriptor;

file_put_contents($filename, json_encode($faceData, JSON_PRETTY_PRINT));

echo json_encode(['success' => 'Face data saved successfully.']);
?>
