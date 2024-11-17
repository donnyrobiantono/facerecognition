let video = document.getElementById("video");
let canvas = document.body.appendChild(document.createElement("canvas"));
let ctx = canvas.getContext("2d");
let displaySize;

let width = 1280;
let height = 720;

const startSteam = () => {
    console.log("----- START STEAM ------");
    navigator.mediaDevices.getUserMedia({
        video: { width, height },
        audio: false
    }).then((steam) => { video.srcObject = steam });
}

console.log(faceapi.nets);

console.log("----- START LOAD MODEL ------");
Promise.all([
    faceapi.nets.ageGenderNet.loadFromUri('models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('models'),
    faceapi.nets.tinyFaceDetector.loadFromUri('models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('models'),
    faceapi.nets.faceExpressionNet.loadFromUri('models')
]).then(startSteam);

const expressionTranslation = {
    neutral: "Netral",
    happy: "Bahagia",
    sad: "Sedih",
    angry: "Marah",
    fearful: "Takut",
    disgusted: "Jijik",
    surprised: "Terkejut"
};

async function detect() {
    const detections = await faceapi.detectAllFaces(video)
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender();

    ctx.clearRect(0, 0, width, height);
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

    resizedDetections.forEach(result => {
        const { age, gender, genderProbability, expressions, detection } = result;

        // Translate expressions and get top expressions
        const topExpressions = Object.entries(expressions)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);  // Take top 3 expressions

        // Draw translated expressions
        const textField = new faceapi.draw.DrawTextField(
            topExpressions.map(([expression, probability]) =>
                `${expressionTranslation[expression]}: ${(probability * 100).toFixed(2)}%`
            ),
            detection.box.bottomRight
        );

        textField.draw(canvas);

        new faceapi.draw.DrawTextField([
            `${Math.round(age)} Tahun`,
            `${gender} ${Math.round(genderProbability * 100)}%`
        ],
            detection.box.bottomLeft
        ).draw(canvas);
    });

    console.log(resizedDetections);
}

video.addEventListener('play', () => {
    displaySize = { width, height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(detect, 100);
});
