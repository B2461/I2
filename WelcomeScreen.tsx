
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Card from './Card';
import { useAppContext } from '../App';

interface WelcomeScreenProps {
    onStart: () => void;
}

const promoSlides = [
    { id: 8, icon: '👟', title: 'ट्रेंडी जूते और फुटवियर', desc: 'लेडीज, जेंट्स और बच्चों के लिए आरामदायक और स्टाइलिश जूतों का विशाल कलेक्शन।', category: 'FOOTWEAR', color: 'from-orange-950 to-black' },
    { id: 1, icon: '📚', title: 'ई-बुक सेलिंग बिजनेस', desc: 'हमारी प्रीमियम ई-बुक्स खरीदें और उन्हें आगे बेचकर अपना ऑनलाइन बिजनेस शुरू करें।', category: 'RESELLING KIT', color: 'from-indigo-950 to-black' },
    { id: 2, icon: '🎧', title: 'प्रीमियम ऑडियो गैजेट्स', desc: 'बेहतरीन वायरलेस इयरबड्स और हेडफोन्स - महसूस करें हर धुन को असली गहराई में।', category: 'ELECTRONICS', color: 'from-blue-950 to-black' },
    { id: 10, icon: '💻', title: 'प्रोफेशनल कंप्यूटर कोर्स', desc: 'बेसिक से एडवांस लेवल तक कंप्यूटर सीखें और आईटी के क्षेत्र में अपना भविष्य बनाएं।', category: 'SKILLS', color: 'from-slate-900 to-black' },
    { id: 14, icon: '📽️', title: '500+ वायरल रील बंडल', desc: 'सोशल मीडिया पर छा जाने के लिए तैयार रील बंडल। आज ही खरीदें और फॉलोअर्स बढ़ाएं।', category: 'DIGITAL ASSETS', color: 'from-pink-950 to-black' },
    { id: 5, icon: '💎', title: 'सिद्ध रत्न भंडार', desc: 'अपनी राशि के अनुसार 100% असली और प्राण प्रतिष्ठित रत्न प्राप्त करें।', category: 'GEMS', color: 'from-amber-950 to-black' },
    { id: 6, icon: '👜', title: 'लक्ज़री लेडीज हैंडबैग्स', desc: 'प्रीमियम डिजाइन और टिकाऊ क्वालिटी। आपकी पर्सनालिटी को दे एक नया और रॉयल लुक।', category: 'FASHION', color: 'from-rose-950 to-black' },
    { id: 7, icon: '🛠️', title: 'मोबाइल रिपेयरिंग कोर्स', desc: 'मोबाइल रिपेयरिंग मास्टर कोर्स और खुद की दुकान शुरू करने का सुनहरा मौका पाएं।', category: 'INDEPENDENT SKILL', color: 'from-cyan-950 to-black' },
    { id: 9, icon: '📜', title: 'तंत्र मंत्र रहस्य PDF', desc: 'प्राचीन गोपनीय विद्याएं और सिद्ध मंत्रों का असली खजाना अब आपके स्मार्टफोन में।', category: 'PDF E-BOOKS', color: 'from-purple-950 to-black' },
    { id: 11, icon: '🏘️', title: 'रियल एस्टेट मास्टर गाइड', desc: 'जमीन खरीदना और बेचना सीखें। प्रॉपर्टी डीलिंग का सफल बिजनेस शुरू करने की पूरी जानकारी।', category: 'BUSINESS', color: 'from-emerald-950 to-black' },
    { id: 12, icon: '🕴️', title: 'जेंट्स बेल्ट और वॉलेट', desc: 'असली लेदर और प्रीमियम लुक। जेंट्स के लिए स्टाइल और मजबूती का बेहतरीन संगम।', category: 'ACCESSORIES', color: 'from-zinc-900 to-black' },
    { id: 13, icon: '🕉️', title: 'वास्तु शास्त्र फुल कोर्स', desc: 'अपने घर और ऑफिस को वास्तु अनुसार बदलें। सुख और शांति लाने का वैदिक मार्ग सीखें।', category: 'VEDIC KNOWLEDGE', color: 'from-yellow-950 to-black' },
    { id: 15, icon: '🚩', title: 'शुद्ध पूजन सामग्री', desc: 'हर अनुष्ठान के लिए शुद्ध और सात्विक पूजन सामग्री। घर लाएं सकारात्मक ऊर्जा।', category: 'SPIRITUAL', color: 'from-red-950 to-black' },
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
    const { t } = useAppContext();
    const [currentSlide, setCurrentSlide] = useState(0);

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
    }, []);

    useEffect(() => {
        const timer = setInterval(nextSlide, 4000); 
        return () => clearInterval(timer);
    }, [nextSlide]);
    
    return (
        <div className="flex flex-col items-center justify-start text-center animate-fade-in min-h-screen pt-12 pb-24 px-4 bg-[#050200]">
            
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-900/20 border border-orange-500/30 rounded-full mb-4 animate-bounce">
                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
                    ✨ Explore All Categories ✨
                </span>
            </div>

            {/* Main Greeting */}
            <h1 className="text-4xl sm:text-5xl font-hindi font-black text-white mb-2 tracking-tight">
                {t('welcome_greeting')}
            </h1>
            
            {/* Sub Tags */}
            <div className="flex items-center justify-center gap-3 text-orange-500/80 font-hindi font-bold text-xs sm:text-sm mb-10 tracking-wide">
                <span>प्रीमियम स्टोर</span>
                <span className="text-[8px] opacity-40">•</span>
                <span>100% सुरक्षित</span>
                <span className="text-[8px] opacity-40">•</span>
                <span>तेज़ डिलीवरी</span>
            </div>

            {/* Main Slider Card */}
            <div className="max-w-md w-full aspect-[4/5] rounded-[2.5rem] overflow-hidden mb-10 relative group shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5">
                <div key={currentSlide} className={`absolute inset-0 bg-gradient-to-b ${promoSlides[currentSlide].color} transition-all duration-1000 flex flex-col items-center justify-center p-8 gap-6 animate-slide-content`}>
                    
                    {/* Icon Container */}
                    <div className="w-32 h-32 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center relative backdrop-blur-md shadow-2xl">
                        <span className="text-6xl drop-shadow-2xl">
                            {promoSlides[currentSlide].icon}
                        </span>
                    </div>

                    <div className="text-center relative z-10">
                        <span className="inline-block px-4 py-1 bg-black/40 border border-white/10 text-orange-400 text-[10px] font-black rounded-full mb-4 tracking-[0.2em] uppercase">
                            ★ {promoSlides[currentSlide].category} ★
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black text-white font-hindi mb-3 leading-tight">
                            {promoSlides[currentSlide].title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-400 font-hindi leading-relaxed opacity-90 px-4">
                            {promoSlides[currentSlide].desc}
                        </p>
                    </div>
                </div>

                {/* Dots Navigation - Adjusted for more dots */}
                <div className="absolute bottom-8 left-0 right-0 flex justify-center flex-wrap gap-1.5 z-20 px-6">
                    {promoSlides.map((_, i) => (
                        <button 
                            key={i} 
                            onClick={() => setCurrentSlide(i)}
                            className={`h-1 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-6 bg-orange-500' : 'w-1 bg-white/20'}`}
                        ></button>
                    ))}
                </div>
            </div>

            {/* Legal Info */}
            <p className="text-[10px] text-gray-500 font-hindi mb-6">
                खरीदारी शुरू करने पर आप हमारे नियमों से सहमत होते हैं:
                <div className="flex justify-center gap-4 mt-1">
                    <Link to="/terms" className="text-gray-400 font-black uppercase tracking-widest hover:text-white transition">Terms & Conditions</Link>
                    <span className="opacity-20">|</span>
                    <Link to="/privacy" className="text-gray-400 font-black uppercase tracking-widest hover:text-white transition">Privacy Policy</Link>
                </div>
            </p>

            {/* Main CTA Button - GREEN */}
            <button 
                onClick={onStart}
                className="group relative w-full max-w-sm py-5 bg-gradient-to-r from-emerald-600 to-green-500 text-black font-hindi font-black text-xl rounded-full shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 border-t border-white/20"
            >
                <span className="drop-shadow-sm">अभी खरीदारी शुरू करें</span>
                <span className="text-2xl group-hover:translate-x-2 transition-transform">➔</span>
            </button>

            {/* Powered By Box */}
            <div className="mt-12 w-full max-w-sm p-4 bg-black border border-orange-900/30 rounded-3xl flex flex-col items-center justify-center shadow-2xl">
                <p className="text-[8px] font-black text-orange-500/60 uppercase tracking-[0.3em] mb-1">Powered By</p>
                <h3 className="text-2xl font-black text-orange-500 uppercase tracking-tighter">
                    OK-E-STORE
                </h3>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">Technology</p>
            </div>

            {/* Bottom Trust Badges */}
            <div className="flex items-center justify-center gap-6 mt-12 opacity-60">
                <div className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" /></svg>
                    <span className="text-[9px] font-black uppercase text-white tracking-widest">Secure</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-xs">🚚</span>
                    <span className="text-[9px] font-black uppercase text-white tracking-widest">Fast</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-yellow-400">✨</span>
                    <span className="text-[9px] font-black uppercase text-white tracking-widest">Original</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-xs">🤝</span>
                    <span className="text-[9px] font-black uppercase text-white tracking-widest">Support</span>
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;
