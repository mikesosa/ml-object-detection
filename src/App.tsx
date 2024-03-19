import React, { useEffect, useState, useRef } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import "./App.css";

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<cocoSsd.ObjectDetection>();

  const [isModelLoading, setIsModelLoading] = useState(true);

  useEffect(() => {
    loadModel();
  }, []);

  const loadModel = async () => {
    try {
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
      setIsModelLoading(false);
    } catch (error) {
      console.error("Failed to load the model", error);
    }
  };

  // const handleImageClick = async (
  //   event: React.MouseEvent<HTMLImageElement>
  // ) => {
  //   if (!model) {
  //     console.log("Model is not loaded yet");
  //     return;
  //   }
  //   const predictions = await model.detect(event.currentTarget);
  //   console.log(predictions);
  //   // Here, you can further process the predictions
  // };

  const enableWebcam = async () => {
    if (!model || !videoRef.current) {
      console.log("Model is not loaded yet or webcam is not available");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play();
        predictWebcam();
      };
    } catch (error) {
      console.error("Error accessing the webcam", error);
    }
  };

  const drawPredictions = (predictions: cocoSsd.DetectedObject[]) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear previous drawings
      predictions.forEach((prediction) => {
        // Draw the bounding box
        ctx.strokeRect(...prediction.bbox);

        // Draw the label background
        ctx.fillStyle = "#00FFFF";
        ctx.fillRect(
          prediction.bbox[0],
          prediction.bbox[1] - 20,
          ctx.measureText(
            prediction.class + ": " + Math.round(prediction.score * 100) + "%"
          ).width,
          20
        );

        // Set the font for the label
        ctx.font = "16px Arial";

        // Draw the label text
        ctx.fillStyle = "#000000";
        ctx.fillText(
          prediction.class + ": " + Math.round(prediction.score * 100) + "%",
          prediction.bbox[0],
          prediction.bbox[1] - 5
        );
      });
    }
  };

  const predictWebcam = async () => {
    if (!model || !videoRef.current) return;

    const predictions = await model.detect(videoRef.current);

    drawPredictions(predictions);

    window.requestAnimationFrame(predictWebcam);
  };

  return (
    <div>
      <h1>
        Multiple object detection using pre trained model in TensorFlow.js
      </h1>

      <section className={isModelLoading ? "invisible" : ""}>
        <div className="videoView">
          <video ref={videoRef} autoPlay muted width="640" height="480"></video>
          <canvas
            ref={canvasRef}
            width="640"
            height="480"
            style={{ position: "absolute", top: 0, left: 0 }}
          ></canvas>
        </div>
      </section>
      <button onClick={enableWebcam} disabled={isModelLoading}>
        Enable Webcam
      </button>
    </div>
  );
};

export default App;
