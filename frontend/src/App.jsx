import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet default marker rendering configuration patch
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function App() {
  const [assets, setAssets] = useState([]); // Default safe array initialization
  const [assetName, setAssetName] = useState(''); // FIXED: name -> assetName
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);

  const BACKEND_URL = `${import.meta.env.VITE_API_URL}/api/assets`;

  // FIXED: Memoized fetch handler to satisfy ESLint hook dependencies safely
  const fetchAssets = useCallback(async () => {
    try {
      const response = await fetch(BACKEND_URL);
      const data = await response.json();
      
      // FIXED: Defensive condition to prevent fatal TypeError .map() crashes from Object responses
      if (Array.isArray(data)) {
        setAssets(data);
        if (data.length > 0 && !selectedAsset) {
          setSelectedAsset(data[0]);
        }
      } else {
        setAssets([]);
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
      setAssets([]); // Graceful structural degradation fallback
    }
  }, [selectedAsset]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]); // FIXED: Included fetchAssets safely with hook stabilization

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assetName || !ownerPhone || !ownerEmail) return;

    try {
      // FIXED: URL endpoint path corrected to match router mapping
      const response = await fetch(`${BACKEND_URL}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetName, ownerPhone, ownerEmail }), // FIXED
      });

      if (response.ok) {
        setAssetName('');
        setOwnerPhone('');
        setOwnerEmail('');
        fetchAssets();
      }
    } catch (err) {
      console.error('Error creating asset:', err);
    }
  };

  // FIXED: Helper function to extract coordinates from structured internal logging array
  const getLatestLocation = (asset) => {
    if (asset && asset.locations && asset.locations.length > 0) {
      return asset.locations[asset.locations.length - 1]; // Pulls latest recorded log trace object
    }
    return null;
  };

  const currentLoc = getLatestLocation(selectedAsset);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <header className="border-b border-gray-800 pb-4 flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-blue-500 tracking-wide">TagTrace <span className="text-sm font-normal text-gray-400">Owner Dashboard</span></h1>
          <button onClick={fetchAssets} className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-xl text-sm font-medium transition border border-gray-700">
            🔄 Refresh Live Data
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6 lg:col-span-1">
            
            {/* Form */}
            <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-xl">
              <h2 className="text-lg font-bold mb-4 text-gray-200">Register New Item</h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input 
                  type="text" placeholder="Item Name (e.g., Keys, Wallet)" value={assetName} onChange={(e) => setAssetName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-white"
                />
                <input 
                  type="text" placeholder="Owner Phone Number" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-white"
                />
                <input 
                  type="email" placeholder="Owner Email Address" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-white"
                />
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition text-sm shadow-lg shadow-blue-600/20">
                  Generate QR Tracking Tag
                </button>
              </form>
            </div>

            {/* List */}
            <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-xl max-h-[400px] overflow-y-auto">
              <h2 className="text-lg font-bold mb-3 text-gray-200">My Tracked Items</h2>
              {assets.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No items registered yet.</p>
              ) : (
                <div className="space-y-2">
                  {assets.map((asset) => {
                    const hasLoc = asset.locations && asset.locations.length > 0; // FIXED: Bound context state to array length
                    return (
                      <div 
                        key={asset._id} 
                        onClick={() => setSelectedAsset(asset)}
                        className={`p-3 rounded-xl cursor-pointer border transition flex justify-between items-center ${selectedAsset?._id === asset._id ? 'bg-blue-600/10 border-blue-500' : 'bg-gray-900 border-gray-700 hover:border-gray-600'}`}
                      >
                        <div>
                          <h4 className="font-bold text-sm text-white">{asset.assetName}</h4> {/* FIXED */}
                          <p className="text-xs text-gray-400 mt-0.5">
                            Status: {hasLoc ? <span className="text-green-400 font-medium">📍 Location Found</span> : <span className="text-amber-400 font-medium">⏳ Pending Scan</span>}
                          </p>
                        </div>
                        {asset.qrCodeImage && ( // FIXED
                          <img src={asset.qrCodeImage} alt="QR Code" className="w-10 h-10 bg-white p-0.5 rounded-lg shadow-md" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-2 flex flex-col space-y-4">
            <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-xl flex-1 flex flex-col min-h-[450px]">
              <div className="mb-3">
                <h2 className="text-lg font-bold text-gray-200">Live GPS Tracking Map</h2>
                {selectedAsset ? (
                  <p className="text-xs text-gray-400">Viewing location for: <span className="text-blue-400 font-semibold">{selectedAsset.assetName}</span></p>
                ) : (
                  <p className="text-xs text-gray-400">Select an item to view its current location on the map.</p>
                )}
              </div>

              <div className="w-full flex-1 rounded-xl overflow-hidden border border-gray-700 z-0 bg-gray-900 min-h-[350px]">
                <MapContainer center={[6.9271, 79.8612]} zoom={12} scrollWheelZoom={true} className="h-full w-full">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {/* FIXED: Formatted to safely fetch the embedded nested matrix properties */}
                  {currentLoc && (
                    <Marker position={[currentLoc.latitude, currentLoc.longitude]}>
                      <Popup>
                        <div className="text-gray-900 font-sans p-1">
                          <h3 className="font-bold text-sm">{selectedAsset?.assetName}</h3>
                          <p className="text-xs text-gray-600 mt-0.5">Scanned on: {new Date(currentLoc.scannedAt).toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400 mt-1">Lat: {currentLoc.latitude.toFixed(4)}, Lng: {currentLoc.longitude.toFixed(4)}</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;