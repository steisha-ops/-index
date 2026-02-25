
import { useState, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { api } from '../lib/api';
import { Navigation, List, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDdiE5mKLaeTwR58iHtxMVusmcdGltazzI'; // <-- ВСТАВЬТЕ СВОЙ КЛЮЧ СЮДА

const mapStyles = {
    width: '100%',
    height: '100%',
};

// Стили для темной темы
const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b9a76" }],
    },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }],
    },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1f2835" }],
    },
    {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#f3d19c" }],
    },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
    {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#515c6d" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#17263c" }],
    },
];

const MapPage = ({ theme }) => {
    const [markers, setMarkers] = useState([]);
    const [center, setCenter] = useState({ lat: 55.75, lng: 37.61 });
    const [zoom, setZoom] = useState(10);
    const [showList, setShowList] = useState(false);
    const [map, setMap] = useState(null);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY
    });

    useEffect(() => {
        api.getMarkers().then(setMarkers);
        const local = localStorage.getItem('user_region_data');
        if (local) {
            const parsed = JSON.parse(local);
            setCenter({ lat: parsed.lat, lng: parsed.lng });
            setZoom(parsed.zoom);
        }
    }, []);

    const handleFlyTo = (m) => {
        if (map) {
            map.panTo({ lat: m.lat, lng: m.lng });
            map.setZoom(14);
        }
        setShowList(false);
    };

    const mapOptions = useMemo(() => ({
        disableDefaultUI: true,
        styles: theme === 'dark' ? darkMapStyle : [],
    }), [theme]);

    const markersMemo = useMemo(() => markers.map(m => (
        <MarkerF 
            key={m.id} 
            position={{ lat: m.lat, lng: m.lng }} 
            onClick={() => handleFlyTo(m)}
        />
    )), [markers, map]);

    if (loadError) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-red-900 text-white p-4">
                Ошибка загрузки карты. Возможно, проблема с API ключом.
            </div>
        );
    }

    if (GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white p-8 text-center">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Требуется API Ключ Google Карт</h2>
                    <p className="max-w-md mx-auto">
                        Пожалуйста, получите бесплатный API-ключ в Google Cloud Console и вставьте его в файл <code>src/pages/Map.jsx</code>.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen w-full relative bg-gray-900 overflow-hidden">
            {isLoaded ? (
                <GoogleMap
                    mapContainerStyle={mapStyles}
                    center={center}
                    zoom={zoom}
                    options={mapOptions}
                    onLoad={setMap}
                >
                    {markersMemo}
                </GoogleMap>
            ) : (
                <div className="h-screen w-full flex items-center justify-center bg-gray-900">
                    Загрузка карты...
                </div>
            )}
            
            {/* Controls */}
            <div className="absolute top-12 left-4 right-4 z-[1000] pointer-events-none flex justify-between items-start">
                <button onClick={() => setShowList(true)} className={`pointer-events-auto p-3 rounded-2xl shadow-lg backdrop-blur-md border transition active:scale-95 ${theme==='dark'?'bg-black/60 text-white border-white/10':'bg-white/80 text-black border-black/5'}`}>
                    <List size={20}/>
                </button>
                <div className={`px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-md shadow-lg border pointer-events-auto ${theme==='dark'?'bg-black/60 text-white border-white/10':'bg-white/80 text-black border-black/5'}`}>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]"></span>
                    <span className="text-xs font-bold tracking-widest">LIVE</span>
                </div>
            </div>

            {/* Places List Modal */}
            <AnimatePresence>
                {showList && (
                    <motion.div initial={{x: -300, opacity: 0}} animate={{x: 0, opacity: 1}} exit={{x: -300, opacity: 0}} className={`absolute top-0 left-0 bottom-0 w-64 z-[1000] p-6 pt-20 shadow-2xl backdrop-blur-xl border-r ${theme==='dark'?'bg-black/80 border-white/10 text-white':'bg-white/90 border-black/5 text-black'}`}>
                        <button onClick={() => setShowList(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-500/20"><X size={20}/></button>
                        <h2 className="text-xl font-black mb-6">ОПАСНЫЕ ЗОНЫ</h2>
                        <div className="space-y-3 overflow-y-auto max-h-full pb-20">
                            {markers.map(m => (
                                <div key={m.id} onClick={() => handleFlyTo(m)} className={`p-4 rounded-xl border cursor-pointer active:scale-95 transition ${theme==='dark'?'bg-white/5 border-white/5 hover:bg-white/10':'bg-black/5 border-black/5 hover:bg-black/10'}`}>
                                    <div className="font-bold text-sm">{m.desc}</div>
                                    <div className="text-[10px] opacity-50 mt-1 flex items-center gap-1"><Navigation size={10}/> Показать</div>
                                </div>
                            ))}
                            {markers.length === 0 && <div className="text-sm opacity-50">Нет меток</div>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
export default MapPage;
