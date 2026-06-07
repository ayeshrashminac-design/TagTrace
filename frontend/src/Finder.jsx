import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function Finder() {
  const { id } = useParams(); // Get the unique ID from the URL (e.g., /track/a1b2c3d4)
  const [statusMessage, setStatusMessage] = useState('Requesting your location to notify the owner...');
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if the browser supports Geolocation API
    if (!navigator.geolocation) {
      setStatusMessage('Geolocation is not supported by your browser.');
      return;
    }

    // Automatically ask for location when the page loads
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setStatusMessage('Location found! Sending details to the owner securely...');

        try {
          // Send the GPS coordinates to our Backend Update Location API
          const response = await fetch(`https://stumble-aptly-agreeing.ngrok-free.dev/api/assets/track/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude }) // FIXED: Clean shorthand property usage
          });

          // FIXED: Safe JSON parsing fallback to prevent HTML error parsing crashes
          let data = {};
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            data = await response.json();
          }

          if (!response.ok) {
            throw new Error(data.message || `Server responded with status ${response.status}`);
          }

          // If success, display owner details to the finder
          setStatusMessage('✅ Owner has been notified with your location!');
          setOwnerInfo(data);

        } catch (err) {
          console.error('Fetch error:', err);
          setError(err.message);
          setStatusMessage('Failed to notify the owner automatically.');
        }
      },
      (geoError) => {
        console.error('Geolocation error:', geoError); // FIXED: Prevented unused variable lint error
        setError('Location access denied. Please enable location or share contact details manually.');
        setStatusMessage('Could not get your location.');
      }
    );
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700 text-center">
        <h1 className="text-3xl font-extrabold text-blue-500 mb-2">TagTrace Finder</h1>
        <p className="text-sm text-gray-400 mb-6">You found a lost item! Thank you for your kindness.</p>

        {/* Status Indicator */}
        <div className="bg-gray-700/50 p-4 rounded-xl mb-6 border border-gray-600">
          <p className="text-sm font-medium text-gray-200">{statusMessage}</p>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>

        {/* Display Owner Info once location is sent successfully */}
        {ownerInfo && (
          <div className="space-y-4 text-left animate-fadeIn">
            <h2 className="text-xl font-bold text-green-400 border-b border-gray-700 pb-2 text-center">
              Item Details: {ownerInfo.assetName}
            </h2>
            <p className="text-sm text-gray-300">
              Please contact the owner using the information below to return the item:
            </p>
            
            <div className="bg-gray-900 p-4 rounded-lg space-y-2">
              <p className="text-sm">
                <span className="text-gray-400">Phone:</span>{' '}
                <a href={`tel:${ownerInfo.ownerPhone}`} className="text-blue-400 font-bold hover:underline">
                  {ownerInfo.ownerPhone}
                </a>
              </p>
              <p className="text-sm">
                <span className="text-gray-400">Email:</span>{' '}
                <a href={`mailto:${ownerInfo.ownerEmail}`} className="text-blue-400 hover:underline">
                  {ownerInfo.ownerEmail}
                </a>
              </p>
            </div>

            <div className="pt-2">
              <a 
                href={`tel:${ownerInfo.ownerPhone}`}
                className="w-full block bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg text-center transition duration-200 shadow-lg shadow-green-600/20"
              >
                Call Owner Now
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Finder;