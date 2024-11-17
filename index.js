document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    let displaySize;
    let width = 1280;
    let height = 720;

    Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('models'),
        faceapi.nets.ssdMobilenetv1.loadFromUri('models')
    ]).then(startVideo);

    function startVideo() {
        navigator.mediaDevices.getUserMedia({ video: {width, height} })
            .then(stream => {
                video.srcObject = stream;
                
            })
            .catch(err => console.error(err));
    }

    video.addEventListener('play', async () => {
        const canvas = faceapi.createCanvasFromMedia(video);
        document.body.append(canvas);
        const displaySize = { width: canvas.width, height: canvas.height }; // Menggunakan lebar dan tinggi kanvas
        faceapi.matchDimensions(canvas, displaySize);

        const labeledFaceDescriptors = await loadLabeledImages();
        if (labeledFaceDescriptors.length === 0) {
            alert('No face data found. Please register faces first.');
            return;
        }

        const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

            const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));
            results.forEach((result, i) => {
                const box = resizedDetections[i].detection.box;
                const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
                drawBox.draw(canvas);
            });
        }, 100);
    });

    async function loadLabeledImages() {
        const response = await fetch('backend/faceData.json');
        const faceData = await response.json();
        const labels = Object.keys(faceData);
        return Promise.all(
            labels.map(async label => {
                const descriptions = faceData[label].map(desc => new Float32Array(desc));
                return new faceapi.LabeledFaceDescriptors(label, descriptions);
            })
        );
    }
});
