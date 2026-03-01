import { useState, useRef } from 'react';
import { api } from '../lib/api';
import { Camera, Send, ShieldCheck, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TutorialOverlay from '../components/TutorialOverlay';
import { tutorialData } from '../lib/tutorialData';

const ReportPage = ({ theme = 'dark' }) => {
    const [text, setText] = useState('');
    const [image, setImage] = useState(null);
    const [sent, setSent] = useState(false);
    const fileInputRef = useRef(null);

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(event.target.result);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const submit = async () => {
        if (!text && !image) return;
        // FIX: Pass arguments correctly, not as a single object
        await api.sendReport(text, image);
        setSent(true);
    };

    if (sent) {
        return (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center gap-4 text-[var(--text-primary)]">
                <ShieldCheck size={64} className="text-green-500" />
                <h2 className="text-2xl font-bold">ОТЧЕТ ОТПРАВЛЕН</h2>
                <p className="text-[var(--text-dim)]">Спасибо за вашу помощь!</p>
            </motion.div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-main)] pt-16 px-6 font-sans text-[var(--text-primary)] pb-40">
            <TutorialOverlay pageId="report" tutorials={tutorialData.report} theme={theme} />
            <div className="max-w-md mx-auto">
                <h1 className="text-3xl font-black mb-2">СООБЩИТЬ ОБ ОБЛАВЕ</h1>
                <p className="text-[var(--text-dim)] text-sm mb-8 flex items-center gap-2"><ShieldCheck size={16} className="text-green-500"/> Ваш отчет полностью анонимен</p>
                
                <div className="glass-card p-1 mb-4">
                    <textarea 
                        value={text} 
                        onChange={e=>setText(e.target.value)} 
                        placeholder="Опишите ситуацию: что, где и когда произошло? Любые детали важны."
                        className="w-full h-40 bg-transparent p-5 outline-none resize-none text-[var(--text-primary)] placeholder-[var(--text-dim)]"
                    />
                </div>

                <AnimatePresence>
                {image && (
                    <motion.div initial={{opacity:0, height: 0}} animate={{opacity:1, height: 'auto'}} exit={{opacity:0, height: 0}} className="relative mb-4 w-full rounded-2xl overflow-hidden border border-[var(--border)]">
                        <img src={image} className="w-full h-auto object-cover" />
                        <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white">
                            <XCircle size={20} />
                        </button>
                    </motion.div>
                )}
                </AnimatePresence>

                <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                    className="hidden" 
                />

                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => fileInputRef.current.click()} className="glass-card flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold">
                        <Camera size={20}/>
                        <span>Фото</span>
                    </button>
                    <button onClick={submit} className="bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3">
                        <span>ОТПРАВИТЬ</span>
                        <Send size={18}/>
                    </button>
                </div>
            </div>
        </div>
    );
};
export default ReportPage;
