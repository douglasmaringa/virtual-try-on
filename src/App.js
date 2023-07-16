import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/face-landmarks-detection';
import Webcam from 'react-webcam';

function App() {
  const webcamRef = useRef(null);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [face, setFace] = useState(null);
  const [currentWigIndex, setCurrentWigIndex] = useState(0);

  const wigPaths = ['./wig.png', './wig2.png'];

  const handleNextWig = () => {
    setCurrentWigIndex((prevIndex) => (prevIndex + 1) % wigPaths.length);
  };

  const handlePrevWig = () => {
    setCurrentWigIndex((prevIndex) => (prevIndex - 1 + wigPaths.length) % wigPaths.length);
  };

  const loadFaceMeshModel = async () => {
    setLoading(true);
    try {
      const loadedModel = await facemesh.load(facemesh.SupportedPackages.mediapipeFacemesh);
      setModel(loadedModel);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load face mesh model:', error);
    }
  };

  const handleVideoLoadedData = () => {
    setVideoLoaded(true);
  };

  const trackFace = async () => {
    if (model && videoLoaded) {
      const video = webcamRef.current.video;
      const predictions = await model.estimateFaces({ input: video });

      if (predictions.length > 0) {
        const face = predictions[0].scaledMesh;
        setFace(face);
        console.log('Face coordinates:', face);
      }
    }
  };

  useEffect(() => {
    loadFaceMeshModel();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      trackFace();
    }, 100);

    return () => clearInterval(interval);
  }, [model, videoLoaded]);

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', marginBottom: '5px' }}>
        <button
          style={{ marginRight: '10px' }}
          onClick={handlePrevWig}
          disabled={currentWigIndex === 0}
        >
          Previous
        </button>
        <button
          onClick={handleNextWig}
          disabled={currentWigIndex === wigPaths.length - 1}
        >
          Next
        </button>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <div
          className="App"
          style={{
            position: 'relative',
            width: '640px',
            height: '480px',
          }}
        >
          {loading ? (
            <div>Loading...</div>
          ) : (
            <Webcam
              ref={webcamRef}
              mirrored
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 9,
                width: '640px',
                height: '480px',
              }}
              onLoadedData={handleVideoLoadedData}
            />
          )}
          {face && <WigOverlay face={face} wigPath={wigPaths[currentWigIndex]} />}
        </div>
      </div>
    </div>
  );
}

function WigOverlay({ face, wigPath }) {
  const webcamVideo = document.querySelector('.App video');
  const webcamSize = {
    width: webcamVideo.videoWidth,
    height: webcamVideo.videoHeight,
  };

  const videoWidth = 640; // Adjust the video width according to your setup
  const videoHeight = 480; // Adjust the video height according to your setup

  const leftEar = face[234]; // Left ear landmark
  const rightEar = face[454]; // Right ear landmark
  const distance = Math.sqrt(
    Math.pow(rightEar[0] - leftEar[0], 2) + Math.pow(rightEar[1] - leftEar[1], 2)
  ); // Distance between the left and right ear landmarks

  const wigWidth = distance * 2; // Adjust the width of the wig as needed
  const wigAspectRatio = 1.5; // Adjust the aspect ratio of the wig as needed

  const wigHeight = wigWidth / wigAspectRatio; // Calculate the height proportionally

  const nose = face[6]; // Nose landmark
  const wigPositionX = (nose[0] / webcamSize.width) * videoWidth - wigWidth / 2;
  const wigPositionY = (nose[1] / webcamSize.height) * videoHeight - wigHeight / 1.4;

  return (
    <div className="wig-outline">
      <img
        style={{
          border: '2px solid red',
          boxSizing: 'border-box',
          position: 'absolute',
          left: `${videoWidth - wigPositionX - wigWidth}px`, // Invert the X-axis direction
          top: `${wigPositionY}px`,
          width: `${wigWidth}px`,
          height: 'auto', // Set the height to 'auto' to maintain the aspect ratio
          zIndex: 10, // Set a higher value to appear above the video
        }}
        src={wigPath}
        alt="Wig"
        className="wig-image"
      />
    </div>
  );
}


export default App;
