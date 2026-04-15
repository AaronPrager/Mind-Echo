import { useCallback, useState } from 'react';
import { ErrorScreen } from './screens/ErrorScreen';
import { LandingScreen } from './screens/LandingScreen';
import { MindMapScreen } from './screens/MindMapScreen';
import { ProcessingScreen } from './screens/ProcessingScreen';
import { USER_TEXT } from './userTranscript';

const SCREENS = {
  LANDING: 'LANDING',
  PROCESSING: 'PROCESSING',
  MAP: 'MAP',
  ERROR: 'ERROR',
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.LANDING);
  const [mapData, setMapData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [landingKey, setLandingKey] = useState(0);

  const handleGenerateMindMap = useCallback(() => {
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

  const handleStartOver = useCallback(() => {
    setMapData(null);
    setErrorMessage('');
    setLandingKey((k) => k + 1);
    setScreen(SCREENS.LANDING);
  }, []);

  const handleErrorRetry = useCallback(() => {
    setErrorMessage('');
    setLandingKey((k) => k + 1);
    setScreen(SCREENS.LANDING);
  }, []);

  if (screen === SCREENS.LANDING) {
    return <LandingScreen key={landingKey} onGenerateMindMap={handleGenerateMindMap} />;
  }

  if (screen === SCREENS.PROCESSING) {
    return (
      <ProcessingScreen
        text={USER_TEXT}
        onSuccess={handleProcessingSuccess}
        onError={handleProcessingError}
      />
    );
  }

  if (screen === SCREENS.ERROR) {
    return <ErrorScreen message={errorMessage} onRetry={handleErrorRetry} />;
  }

  if (screen === SCREENS.MAP && mapData) {
    return <MindMapScreen mapData={mapData} onStartOver={handleStartOver} />;
  }

  return <LandingScreen key={landingKey} onGenerateMindMap={handleGenerateMindMap} />;
}
