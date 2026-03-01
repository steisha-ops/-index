
import { useState, useEffect, useMemo, memo } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { api } from '../lib/api';
import { Navigation, List, X, MapPin, AlertTriangle, Clock, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TutorialOverlay from '../components/TutorialOverlay';
import { tutorialData } from '../lib/tutorialData';

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

const MarkerCard = memo(({ marker, onClick, theme }) => (
    <motion.div 
        whileHover={{y: -4}}
        whileTap={{scale: 0.95}}
        onClick={onClick}
        className={`p-4 rounded-[20px] border cursor-pointer transition-all backdrop-blur-md ${theme==='dark'?'bg-gradient-to-br from-white/12 to-white/5 border-white/20 hover:from-white/18 hover:to-white/8 hover:shadow-lg hover:shadow-red-500/30':'bg-gradient-to-br from-black/5 to-black/2 border-black/10 hover:shadow-lg hover:shadow-red-500/20'}`}
    >
        <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl flex-shrink-0 ${theme==='dark'?'bg-red-500/20':'bg-red-500/10'}`}>
                <AlertTriangle size={20} className="text-red-500"/>
            </div>
            <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-sm mb-2 truncate ${theme==='dark'?'text-white':'text-black'}`}>{marker.desc}</h3>
                <div className={`flex items-center gap-2 text-xs ${theme==='dark'?'text-gray-400':'text-gray-600'}`}>
                    <MapPin size={14} className="flex-shrink-0"/>
                    <span className="truncate">Показать</span>
                </div>
            </div>
            <Navigation size={16} className={`flex-shrink-0 ${theme==='dark'?'text-blue-400':'text-blue-600'}`}/>
        </div>
    </motion.div>
));
MarkerCard.displayName = 'MarkerCard';

const MapPage = ({ theme }) => {
    const [markers, setMarkers] = useState([]);
    const [center, setCenter] = useState({ lat: 55.75, lng: 37.61 });
    const [zoom, setZoom] = useState(10);
    const [showList, setShowList] = useState(false);
    const [selectedMarker, setSelectedMarker] = useState(null);
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
        setSelectedMarker(m);
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
            <div className={`h-screen w-full flex items-center justify-center ${theme==='dark'?'bg-red-900/30':'bg-red-100'} text-white p-4`}>
                <div className="text-center">
                    <AlertTriangle size={48} className="mx-auto mb-4 text-red-500"/>
                    <p className="text-lg font-bold">Ошибка загрузки карты</p>
                    <p className="text-sm opacity-75 mt-2">Возможно, проблема с API ключом</p>
                </div>
            </div>
        );
    }

    if (GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
        return (
            <div className={`h-screen w-full flex items-center justify-center ${theme==='dark'?'bg-gray-900':'bg-gray-100'} p-4`}>
                <div className="text-center max-w-sm">
                    <Info size={48} className="mx-auto mb-4 text-blue-500"/>
                    <h2 className={`text-2xl font-bold mb-4 ${theme==='dark'?'text-white':'text-black'}`}>Требуется API Ключ</h2>
                    <p className={`text-sm ${theme==='dark'?'text-gray-400':'text-gray-600'}`}>
                        Получите бесплатный API-ключ в Google Cloud Console и вставьте его в файл src/pages/Map.jsx
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen w-full relative bg-gray-900 overflow-hidden">
            <TutorialOverlay pageId="map" tutorials={tutorialData.map} theme={theme} />
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
                    <div className="text-center">
                        <motion.div 
                            animate={{rotate: 360}}
                            transition={{duration: 2, repeat: Infinity, ease: "linear"}}
                            className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full mx-auto mb-4"
                        />
                        <p className="text-gray-400">Загрузка карты...</p>
                    </div>
                </div>
            )}
            
            {/* Top Controls Bar */}
            <div className={`absolute top-4 left-4 right-4 z-[1000] pointer-events-none flex justify-between items-center gap-3 ${window.innerWidth < 640 ? 'flex-col items-stretch' : ''}`}>
                <motion.button 
                    whileTap={{scale: 0.95}}
                    onClick={() => setShowList(true)} 
                    className={`pointer-events-auto flex items-center justify-center gap-2 p-3.5 rounded-2xl shadow-xl backdrop-blur-xl border transition-all ${theme==='dark'?'bg-black/70 text-white border-white/20 hover:bg-black/80':'bg-white/80 text-black border-white/40 hover:bg-white/90'}`}
                >
                    <List size={22}/>
                    <span className="text-sm font-bold hidden sm:inline">Список</span>
                </motion.button>
                <motion.div 
                    animate={{scale: [1, 1.05, 1]}}
                    transition={{duration: 2, repeat: Infinity}}
                    className={`px-5 py-3 rounded-full flex items-center gap-2.5 backdrop-blur-xl shadow-xl border pointer-events-auto ${theme==='dark'?'bg-black/70 border-white/20':'bg-white/80 border-white/40'}`}
                >
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50"></span>
                    <span className={`text-sm font-bold tracking-widest ${theme==='dark'?'text-red-400':'text-red-600'}`}>LIVE</span>
                </motion.div>
            </div>

            {/* Sidebar with Places List */}
            <AnimatePresence>
                {showList && (
                    <>
                        <motion.div 
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                            onClick={() => setShowList(false)}
                            className="absolute inset-0 z-[999] bg-black/20 backdrop-blur-sm md:hidden"
                        />
                        <motion.div 
                            initial={{x: -400, opacity: 0}} 
                            animate={{x: 0, opacity: 1}} 
                            exit={{x: -400, opacity: 0}}
                            transition={{type: 'spring', damping: 20}}
                            className={`absolute top-0 left-0 bottom-0 w-full max-w-sm z-[1000] p-5 pt-20 shadow-2xl backdrop-blur-2xl border-r overflow-y-auto ${theme==='dark'?'bg-gradient-to-b from-black/90 via-black/80 to-black/70 border-white/10':'bg-gradient-to-b from-white/95 via-white/90 to-white/85 border-black/10'}`}
                        >
                            <button 
                                onClick={() => setShowList(false)} 
                                className={`absolute top-5 right-5 p-2.5 rounded-full transition ${theme==='dark'?'hover:bg-white/10':'hover:bg-black/10'}`}
                            >
                                <X size={24} className={theme==='dark'?'text-white':'text-black'}/>
                            </button>
                            
                            <div className="mb-8">
                                <h2 className={`text-2xl font-black tracking-tighter mb-2 ${theme==='dark'?'text-white':'text-black'}`}>ЗОНЫ</h2>
                                <p className={`text-xs font-medium opacity-60 ${theme==='dark'?'text-gray-400':'text-gray-600'}`}>{markers.length} мест{markers.length === 1 ? 'о' : 'а'}</p>
                            </div>
                            
                            <div className="space-y-3">
                                {markers.length > 0 ? (
                                    markers.map(m => (
                                        <MarkerCard key={m.id} marker={m} onClick={() => handleFlyTo(m)} theme={theme}/>
                                    ))
                                ) : (
                                    <div className={`text-center py-12 text-sm ${theme==='dark'?'text-gray-500':'text-gray-400'}`}>Нет опасных зон</div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Selected Marker Info Panel */}
            <AnimatePresence>
                {selectedMarker && (
                    <motion.div 
                        initial={{y: 400, opacity: 0}}
                        animate={{y: 0, opacity: 1}}
                        exit={{y: 400, opacity: 0}}
                        transition={{type: 'spring', damping: 25}}
                        className={`absolute bottom-24 left-0 right-0 z-[999] p-6 rounded-t-[32px] shadow-2xl backdrop-blur-2xl border-t ${theme==='dark'?'bg-gradient-to-t from-black to-black/80 border-white/10':'bg-gradient-to-t from-white to-white/80 border-white/40'}`}
                    >
                        <button 
                            onClick={() => setSelectedMarker(null)}
                            className="absolute top-5 right-5"
                        >
                            <X size={24} className={theme==='dark'?'text-white':'text-black'}/>
                        </button>

                        <motion.div 
                            initial={{scale: 0, opacity: 0}}
                            animate={{scale: 1, opacity: 1}}
                            transition={{delay: 0.1}}
                        >
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${theme==='dark'?'bg-red-500/20 text-red-400':'bg-red-500/10 text-red-600'}`}>
                                <AlertTriangle size={16}/>
                                <span className="text-xs font-bold">ОПАСНАЯ ЗОНА</span>
                            </div>

                            <h3 className={`text-2xl font-black mb-4 tracking-tight ${theme==='dark'?'text-white':'text-black'}`}>{selectedMarker.desc}</h3>

                            <div className={`space-y-3 text-sm mb-6 ${theme==='dark'?'text-gray-300':'text-gray-700'}`}>
                                <div className="flex items-center gap-3">
                                    <MapPin size={18} className="text-blue-500 flex-shrink-0"/>
                                    <span>Lat: {selectedMarker.lat.toFixed(4)}, Lng: {selectedMarker.lng.toFixed(4)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <AlertTriangle size={18} className="text-red-500 flex-shrink-0"/>
                                    <span>Статус: Активна</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock size={18} className="text-yellow-500 flex-shrink-0"/>
                                    <span>Последнее обновление: Сейчас</span>
                                </div>
                            </div>

                            <motion.button 
                                whileTap={{scale: 0.95}}
                                onClick={() => {
                                    if (map) {
                                        map.panTo({ lat: selectedMarker.lat, lng: selectedMarker.lng });
                                        map.setZoom(16);
                                    }
                                }}
                                className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-3 rounded-xl transition hover:shadow-lg hover:shadow-red-500/50"
                            >
                                ЦЕНТРИРОВАТЬ НА КАРТЕ
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
export default MapPage;
