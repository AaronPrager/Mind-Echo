import { useCallback, useState } from 'react';
import { ErrorScreen } from './screens/ErrorScreen';
import { LandingScreen } from './screens/LandingScreen';
import { MindMapScreen } from './screens/MindMapScreen';
import { ProcessingScreen } from './screens/ProcessingScreen';

const SCREENS = {
  LANDING: 'LANDING',
  PROCESSING: 'PROCESSING',
  MAP: 'MAP',
  ERROR: 'ERROR',
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.LANDING);
  const [mapData, setMapData] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [landingKey, setLandingKey] = useState(0);

  const handleRecordingComplete = useCallback((blob) => {
    setAudioBlob(blob);
    setScreen(SCREENS.PROCESSING);
  }, []);

  const handleProcessingSuccess = useCallback((data) => {
    setMapData(data);
    setScreen(SCREENS.MAP);
  }, []);

  const handleProcessingError = useCallback((msg) => {
    setErrorMessage(msg);
    setScreen(SCREENS.ERROR);
  }, []);

  const handleNewRecording = useCallback(() => {
    setMapData(null);
    setAudioBlob(null);
    setErrorMessage('');
    setLandingKey((k) => k + 1);
    setScreen(SCREENS.LANDING);
  }, []);

  const handleErrorRetry = useCallback(() => {
    setErrorMessage('');
    setAudioBlob(null);
    setLandingKey((k) => k + 1);
    setScreen(SCREENS.LANDING);
  }, []);

  if (screen === SCREENS.LANDING) {
    return (
      <LandingScreen key={landingKey} onRecordingComplete={handleRecordingComplete} />
    );
  }

  if (screen === SCREENS.PROCESSING && audioBlob) {
    return (
      <ProcessingScreen
        audioBlob={audioBlob}
        onSuccess={handleProcessingSuccess}
        onError={handleProcessingError}
      />
    );
  }

  if (screen === SCREENS.ERROR) {
    return <ErrorScreen message={errorMessage} onRetry={handleErrorRetry} />;
  }

  if (screen === SCREENS.MAP && mapData) {
    return <MindMapScreen mapData={mapData} onNewRecording={handleNewRecording} />;
  }

  return <LandingScreen key={landingKey} onRecordingComplete={handleRecordingComplete} />;
}
