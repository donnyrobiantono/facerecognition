document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const captureButton = document.getElementById('capture');
    const nameInput = document.getElementById('name');

    Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('models'),
        faceapi.nets.ssdMobilenetv1.loadFromUri('models')
    ]).then(startVideo);

    function startVideo() {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => {
                video.srcObject = stream;
            })
            .catch(err => console.error(err));
    }

    captureButton.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        if (!name) {
            alert('Please enter your name');
            return;
        }
        const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
        if (!detections) {
            alert('No face detected. Please try again.');
            return;
        }
        const descriptor = detections.descriptor;
        saveFaceData(name, descriptor);
    });

    async function saveFaceData(name, descriptor) {
        const response = await fetch('backend/save-face-data.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, descriptor: Array.from(descriptor) }),
        });

        if (response.ok) {
            alert('Face data saved successfully!');
        } else {
            alert('Failed to save face data.');
        }
    }
});
