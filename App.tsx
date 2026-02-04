
import React, { useState, useCallback, useEffect, useRef, createContext, useContext, useMemo } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { DivinationType, CartItem, Order, CustomerDetails, Product, Notification, VerificationRequest, SupportTicket, SocialMediaPost, SubscriptionPlan, UserProfile, SavedReading, SocialLink } from './types';
import { products as initialProducts } from './products';
import { ebooks } from './ebooks';
import { toolCategories, showcaseTools } from './tools';
import {
    subscribeToAuthChanges, loginUser, registerUser, logoutUser, getFirestoreProducts,
    saveUserProfile, updateFirestoreOrder, deleteFirestoreVerification,
    addVerificationRequest, addSupportTicket, addSocialPost, deleteSocialPost,
    updateSupportTicketStatus, getUserProfile, subscribeToUserReadings, deleteSavedReading,
    subscribeToUserOrders, getUserByEmail, subscribeToUserProfile, getUserByPhone,
    subscribeToProducts, incrementUserDownloads, subscribeToSocialLinks
} from './firebaseService';

// Components
import WelcomeScreen from './WelcomeScreen';
import SelectionScreen from './SelectionScreen';
import SettingsScreen from './SettingsScreen';
import PujanSamagriStore from './PujanSamagriStore';
import ProductDetailScreen from './ProductDetailScreen';
import ShoppingCartScreen from './ShoppingCartScreen';
import CheckoutScreen from './CheckoutScreen';
import OrderConfirmationScreen from './OrderConfirmationScreen';
import NotificationBell from './NotificationBell';
import AdminScreen from './AdminScreen';
import TermsAndConditions from './TermsAndConditions';
import PrivacyPolicy from './PrivacyPolicy';
import ProfileScreen from './ProfileScreen';
import BottomNavBar from './BottomNavBar';
import LoginScreen from './LoginScreen';
import OrderHistoryScreen from './OrderHistoryScreen';
import SupportTicketScreen from './SupportTicketScreen';
import SearchModal from './SearchModal';
import PremiumScreen from './PremiumScreen';
import SubscriptionPaymentScreen from './SubscriptionPaymentScreen';
import SubscriptionConfirmationScreen from './SubscriptionConfirmationScreen';
import WishlistScreen from './WishlistScreen';
import DivinationScreen from './DivinationScreen';
import CommunityChatScreen from './CommunityChatScreen';
import AccountSettingsScreen from './AccountSettingsScreen';
import FAQScreen from './FAQScreen';
import PastReadingsScreen from './PastReadingsScreen';

// --- Global Icons ---
function SocialIcon({ isActive }: { isActive: boolean }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
    );
}

function CartIcon({ isActive }: { isActive: boolean }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    );
}

function OrderIcon({ isActive }: { isActive: boolean }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-colors ${isActive ? 'text-black' : 'text-current'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
    );
}

function SearchIcon({ isActive }: { isActive: boolean }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

function HeartIcon({ isActive }: { isActive: boolean }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-colors ${isActive ? 'text-pink-500 fill-pink-500' : 'text-current'}`} fill={isActive ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 0 : 2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    );
}

const translations = {
  hi: {
    terms_and_conditions: 'नियम और शर्तें',
    privacy_policy: 'गोपनीयता नीति',
    copyright: `© ${new Date().getFullYear()} Ok-E-store. सर्वाधिकार सुरक्षित।`,
    settings: 'सेटिंग्स',
    back: 'वापस',
    my_orders: 'मेरे ऑर्डर',
    welcome_notification_title: 'आपका स्वागत है!',
    welcome_notification_message: 'Ok-E-store in स्वागत है। खरीदारी शुरू करें!',
    special_offer_title: 'विशेष पेशकश!',
    special_offer_message: 'हमारी नई पूजन सामग्री स्टोर देखें।',
    music: 'संगीत',
    admin: 'एडमिन',
    notifications: 'Alert',
    profile: 'प्रोफ़ाइल',
    cart: 'कार्ट',
    search: 'खोज',
    login: 'लॉगिन',
    wishlist: 'पसंद',
    welcome_greeting: 'Ok-E-store में आपका स्वागत है',
    welcome_subtitle: 'आध्यात्मिक और आधुनिक जीवनशैली की खरीदारी करें',
    welcome_intro: 'यह ऐप पूजन सामग्री, ई-पुस्तकें, मोबाइल एक्सेसरीज़ और बहुत कुछ खरीदने के लिए आपकी वन-स्टॉप-शॉप है।',
    start_journey: 'खरीदारी शुरू करें',
    agree_to_terms_privacy_part1: 'मैं',
    agree_to_terms_privacy_part2: 'और',
    agree_to_terms_privacy_part3: 'से सहमत हूँ।',
    select_language: 'भाषा चुनें',
    select_theme: 'थीम चुनें',
    spiritual_store: 'आध्यात्मिक स्टोर',
    shopping: 'शॉपिंग',
    admin_tools: 'एडमिन उपकरण',
    support_and_help: 'सहायता और समर्थन',
    raise_ticket: 'टिकट बनाएं',
    ticket_category: 'समस्या की श्रेणी',
    describe_issue: 'अपनी समस्या का विस्तार से वर्णन करें',
    submit_ticket: 'टिकट जमा करें',
    ticket_submitted_success_title: 'टिकट सफलतापूर्वक जमा किया गया!',
    ticket_submitted_success_message: 'हमारी टीम जल्द ही आपसे दिए गए मोबाइल नंबर पर संपर्क करेगी।',
    support_ticket_manager: 'सहायता टिकट प्रबंधक',
    ticket_status_open: 'खुला',
    ticket_status_closed: 'बंद',
    mark_as_resolved: 'हल के रूप में चिह्नित करें',
    reopen_ticket: 'टिकट फिर से खोलें',
    social_media_manager: 'सोशल मीडिया मैनेजर',
    create_new_post: 'नई पोस्ट बनाएं',
    post_content: 'पोस्ट कंटेंट',
    post_image: 'पोस्ट इमेज (वैकल्पिक)',
    platforms: 'प्लेटफार्म',
    generate_post: 'पोस्ट बनाएं',
    update_post: 'पोस्ट अपडेट करें',
    recent_posts: 'हाल की पोस्ट्स',
    premium_unlock_title: 'प्रीमियम अनलॉक करें',
    premium_unlock_subtitle: 'सभी तंत्र मंत्र यंत्र ई-बुक्स तक असीमित पहुंच प्राप्त करें।',
    premium_trial_banner_title: 'ई-बुक्स का खजाना!',
    premium_trial_banner_desc: 'अभी सब्सक्राइब करें और सभी PDF सीधे डाउनलोड करें।',
    premium_monthly_plan: 'मासिक प्लान',
    premium_yearly_plan: 'वार्षिक प्लान',
    premium_choose_plan: 'प्लान चुनें',
    payment_title: 'भुगतान',
    payment_your_name: 'आपका नाम',
    payment_your_phone: 'आपका फोन नंबर',
    payment_enter_txn_id: '12-अंकीय लेनदेन आईडी दर्ज करें',
    payment_paid_button: 'भुगतान हो गया',
    payment_verifying_title: 'सत्यापन जारी है',
    payment_verifying_subtitle: 'हम आपके भुगतान की पुष्टि कर रहे हैं।',
    payment_after_instruction: 'भुगतान के बाद, ट्रांजेक्शन आईडी दर्ज करें और स्क्रीनशॉट अपलोड करें।',
    payment_invalid_txn_id: 'अमान्य ट्रांजेक्शन आईडी।',
    sub_confirm_title: 'सदस्यता अनुरोध प्राप्त हुआ!',
    sub_confirm_message: 'आपका अनुरोध प्रक्रियाधीन है। भुगतान सत्यापित होने के बाद प्रीमियम सुविधाएं सक्रिय हो जाएंगी।',
    sub_confirm_button: 'होम पर जाएं',
  },
  en: {
    terms_and_conditions: 'Terms & Conditions',
    privacy_policy: 'Privacy Policy',
    copyright: `© ${new Date().getFullYear()} Ok-E-store. All rights reserved.`,
    settings: 'Settings',
    back: 'Back',
    my_orders: 'My Orders',
    welcome_notification_title: 'Welcome!',
    welcome_notification_message: 'Welcome to Ok-E-store. Start shopping!',
    special_offer_title: 'Special Offer!',
    special_offer_message: 'Check out our new spiritual items store.',
    music: 'Music',
    admin: 'Admin',
    notifications: 'Alert',
    profile: 'Profile',
    cart: 'Cart',
    search: 'Search',
    login: 'Login',
    wishlist: 'Wishlist',
    welcome_greeting: 'Welcome to Ok-E-store',
    welcome_subtitle: 'Shop for spiritual and modern lifestyle products',
    welcome_intro: 'This app is your one-stop-shop for spiritual items, e-books, mobile accessories, and more.',
    start_journey: 'Start Shopping',
    agree_to_terms_privacy_part1: 'I agree to the',
    agree_to_terms_privacy_part2: 'and',
    agree_to_terms_privacy_part3: '.',
    select_language: 'Select Language',
    select_theme: 'Select Theme',
    spiritual_store: 'Spiritual Store',
    shopping: 'Shopping',
    admin_tools: 'Admin Tools',
    support_and_help: 'Support & Help',
    raise_ticket: 'Raise a Ticket',
    ticket_category: 'Issue Category',
    describe_issue: 'Describe your issue in detail',
    submit_ticket: 'Submit Ticket',
    ticket_submitted_success_title: 'Ticket Submitted Successfully!',
    ticket_submitted_success_message: 'Our team will contact you shortly on the mobile number provided.',
    support_ticket_manager: 'Support Ticket Manager',
    ticket_status_open: 'Open',
    ticket_status_closed: 'Closed',
    mark_as_resolved: 'Mark as Resolved',
    reopen_ticket: 'Re-open Ticket',
    social_media_manager: 'Social Media Manager',
    create_new_post: 'Create New Post',
    post_content: 'Post Content',
    post_image: 'Post Image (optional)',
    platforms: 'Platforms',
    generate_post: 'Generate Post',
    update_post: 'Update Post',
    recent_posts: 'Recent Posts',
    premium_unlock_title: 'Unlock Premium',
    premium_unlock_subtitle: 'Get unlimited access to all Astrology and AI tools.',
    premium_trial_banner_title: 'Free Trial Available!',
    premium_trial_banner_desc: 'Sign up today and get 3 days free.',
    premium_monthly_plan: 'Monthly Plan',
    premium_yearly_plan: 'Yearly Plan',
    premium_choose_plan: 'Choose Plan',
    payment_title: 'Payment',
    payment_your_name: 'Your Name',
    payment_your_phone: 'Your Phone Number',
    payment_enter_txn_id: 'Enter 12-digit Transaction ID',
    payment_paid_button: 'I Have Paid',
    payment_verifying_title: 'Verifying Payment',
    payment_verifying_subtitle: 'We are verifying your payment details.',
    payment_after_instruction: 'After payment, enter Transaction ID and upload screenshot.',
    payment_invalid_txn_id: 'Invalid Transaction ID.',
    sub_confirm_title: 'Subscription Request Received!',
    sub_confirm_message: 'Your request is processing. Premium features will be activated once payment is verified.',
    sub_confirm_button: 'Go to Home',
  },
};

export const divinationTypeTranslations: Record<string, string> = {
    'पूजन सामग्री': 'Worship Items',
    'तंत्र मंत्र यन्त्र PDF E-book': 'Tantra Mantra Yantra PDF E-book',
    'रत्न आभूषण': 'Gems & Jewelry',
    'मोबाइल एक्सेसरीज': 'Mobile Accessories',
    'लेडीज जेंट्स एंड बेबी शूज': 'Ladies, Gents & Baby Shoes',
    'लेडीज एंड जेंट्स पर्स बैग बेल्ट चाबी का गुच्छा': 'Ladies & Gents Accessories',
    'कंप्यूटर कोर्स (बेसिक-एडवांस्ड)': 'Computer Course (Basic-Advanced)',
    'मोबाइल रिपेयरिंग कोर्स (बेसिक-एडवांस्ड)': 'Mobile Repairing Course (Basic-Advanced)',
    'एडमिन पैनल': 'Admin Panel',
    'आध्यात्मिक स्टोर': 'Spiritual Store',
    'शॉपिंग': 'Shopping',
    'स्थानीय विपणन': 'Local Marketing',
};

interface AppContextType {
    language: 'hi' | 'en';
    setLanguage: (lang: 'hi' | 'en') => void;
    theme: string;
    setTheme: (theme: string) => void;
    t: (key: string, options?: Record<string, string | number>) => string;
    tDiv: (type: DivinationType) => { en: string; hi: string };
    isAuthenticated: boolean;
    currentUser: UserProfile | null;
    showAuth: (onSuccess?: () => void) => void;
    handleLogin: (email: string, password: string) => Promise<string | null>;
    handleSignup: (profileData: UserProfile) => Promise<boolean>;
    logout: () => void;
    deleteCurrentUser: () => void;
    updateProfile: (profile: Partial<UserProfile>) => void;
    wishlist: string[];
    toggleWishlist: (productId: string) => void;
    isPremiumActive: boolean;
    setExtendedProfiles: React.Dispatch<React.SetStateAction<Record<string, UserProfile>>>;
    extendedProfiles: Record<string, UserProfile>;
    setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
    orders: Order[];
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    supportTickets: SupportTicket[];
    setSupportTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
    loadProducts: () => Promise<void>;
    refreshTrigger: number;
    trackDownload: () => Promise<void>;
    incrementChatCount: () => void;
    savedReadings: SavedReading[];
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<'hi' | 'en'>(() => (localStorage.getItem('okFutureZoneLanguage') as 'hi' | 'en') || 'en');
    const [theme, setTheme] = useState(() => localStorage.getItem('okFutureZoneTheme') || 'cosmic');
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [extendedProfiles, setExtendedProfiles] = useState<Record<string, UserProfile>>(() => {
        try { const saved = localStorage.getItem('okFutureZoneExtendedProfiles'); return saved ? JSON.parse(saved) : {}; } catch { return {}; }
    });
    
    const [orders, setOrders] = useState<Order[]>(() => {
        try { const saved = localStorage.getItem('okFutureZoneOrders'); return saved ? JSON.parse(saved) : []; } catch { return []; }
    });
    const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
        try { const saved = localStorage.getItem('okFutureZoneSupportTickets'); return saved ? JSON.parse(saved) : []; } catch { return []; }
    });
    
    // Initialize wishlist/cart from LocalStorage, but will overwrite with Cloud data on login
    const [wishlist, setWishlist] = useState<string[]>(() => {
        try { const saved = localStorage.getItem('okFutureZoneWishlist'); return saved ? JSON.parse(saved) : []; } catch { return []; }
    });

    const [savedReadings, setSavedReadings] = useState<SavedReading[]>([]);

    const [isAuthVisible, setIsAuthVisible] = useState(false);
    const [authSuccessCallback, setAuthSuccessCallback] = useState<(() => void) | null>(null);

    const isPremiumActive = useMemo(() => {
        if (!currentUser?.subscriptionExpiry) return false;
        return new Date(currentUser.subscriptionExpiry) > new Date();
    }, [currentUser]);

    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const loadProducts = useCallback(async () => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    // --- CLOUD SYNC SHIELD: Load Data on Login ---
    useEffect(() => {
        let unsubscribeReadings: (() => void) | undefined;
        let unsubscribeOrders: (() => void) | undefined;
        let unsubscribeProfile: (() => void) | undefined;

        const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
            if (unsubscribeProfile) { unsubscribeProfile(); unsubscribeProfile = undefined; }

            if (firebaseUser) {
                const email = firebaseUser.email || '';
                
                // Subscribe to Profile Changes Real-time
                unsubscribeProfile = subscribeToUserProfile(firebaseUser.uid, (cloudProfile) => {
                    const baseProfile: UserProfile = cloudProfile || {
                        uid: firebaseUser.uid, 
                        name: firebaseUser.displayName || '',
                        email: email,
                        phone: '',
                        signupDate: new Date().toISOString(),
                    };

                    if (baseProfile.wishlist) setWishlist(baseProfile.wishlist);
                    
                    setCurrentUser(baseProfile);
                    setIsAuthenticated(true);
                });

                // Subscribe to Saved Readings
                unsubscribeReadings = subscribeToUserReadings(firebaseUser.uid, (readings) => {
                    setSavedReadings(readings);
                });

                // Subscribe to User Orders
                if (email) {
                    unsubscribeOrders = subscribeToUserOrders(email, (syncedOrders) => {
                        setOrders(syncedOrders);
                    });
                }

            } else {
                setCurrentUser(null);
                setIsAuthenticated(false);
                setWishlist([]);
                setSavedReadings([]);
                setOrders([]);
                localStorage.removeItem('okFutureZoneCartItems');
                localStorage.removeItem('okFutureZoneWishlist');
                
                if (unsubscribeReadings) unsubscribeReadings();
                if (unsubscribeOrders) unsubscribeOrders();
                if (unsubscribeProfile) unsubscribeProfile();
            }
        });
        return () => {
            unsubscribe();
            if (unsubscribeReadings) unsubscribeReadings();
            if (unsubscribeOrders) unsubscribeOrders();
            if (unsubscribeProfile) unsubscribeProfile();
        };
    }, []);

    // --- CLOUD SYNC SHIELD: Auto-Save Wishlist ---
    const cloudWishlist = currentUser?.wishlist;
    const uid = currentUser?.uid;
    
    useEffect(() => {
        localStorage.setItem('okFutureZoneWishlist', JSON.stringify(wishlist));
        if (uid) {
            const localStr = JSON.stringify(wishlist);
            const cloudStr = JSON.stringify(cloudWishlist || []);
            if (localStr !== cloudStr) {
                saveUserProfile(uid, { wishlist: wishlist });
            }
        }
    }, [wishlist, uid, cloudWishlist]);

    useEffect(() => { localStorage.setItem('okFutureZoneLanguage', language); document.documentElement.lang = language; }, [language]);
    useEffect(() => { localStorage.setItem('okFutureZoneTheme', theme); document.body.setAttribute('data-theme', theme); }, [theme]);
    useEffect(() => { localStorage.setItem('okFutureZoneExtendedProfiles', JSON.stringify(extendedProfiles)); }, [extendedProfiles]);
    useEffect(() => { if(!isAuthenticated) localStorage.setItem('okFutureZoneOrders', JSON.stringify(orders)); }, [orders, isAuthenticated]);
    useEffect(() => { localStorage.setItem('okFutureZoneSupportTickets', JSON.stringify(supportTickets)); }, [supportTickets]);

    const t = useCallback((key: string, options?: Record<string, string | number>): string => {
        let translation = translations[language][key as keyof typeof translations.hi] || key;
        if (options) { Object.keys(options).forEach(optionKey => { translation = translation.replace(`{${optionKey}}`, String(options[optionKey])); }); }
        return translation;
    }, [language]);

    const tDiv = useCallback((type: DivinationType): { en: string; hi: string } => {
        const englishName = divinationTypeTranslations[type] || type;
        return { en: englishName, hi: type };
    }, []);

    const showAuth = (onSuccess?: () => void) => {
        setIsAuthVisible(true);
        if (onSuccess) { setAuthSuccessCallback(() => onSuccess); }
    };

    const handleLoginLogic = async (email: string, password: string): Promise<string | null> => {
        try {
            await loginUser(email, password);
            setIsAuthVisible(false);
            if (authSuccessCallback) { authSuccessCallback(); setAuthSuccessCallback(null); }
            return null;
        } catch (error: any) {
            return 'लॉगिन विफल। कृपया पुनः प्रयास करें।';
        }
    };
    
    const handleSignupLogic = async (profileData: UserProfile): Promise<boolean> => {
        if (!profileData.email || !profileData.password) return false;
        try {
            await registerUser(profileData.email, profileData.password, profileData.name || '');
            setIsAuthVisible(false);
            if (authSuccessCallback) { authSuccessCallback(); setAuthSuccessCallback(null); }
            return true;
        } catch (error) {
             return false;
        }
    };

    const logout = async () => {
        await logoutUser();
        setIsAuthenticated(false);
        setCurrentUser(null);
    };

    const updateProfile = async (updatedProfile: Partial<UserProfile>) => {
        if (currentUser?.email) {
            const newProfile = { ...currentUser, ...updatedProfile };
            setCurrentUser(newProfile);
            if (currentUser.uid) {
                await saveUserProfile(currentUser.uid, updatedProfile);
            }
        }
    };

    const deleteCurrentUser = async () => {
        if (currentUser?.email) {
            const emailToDelete = currentUser.email;
            setExtendedProfiles(prev => { const newProfiles = { ...prev }; delete newProfiles[emailToDelete]; return newProfiles; });
            await logout();
        }
    };

    const toggleWishlist = (productId: string) => {
        setWishlist(prev => {
            const newList = prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId];
            return newList;
        });
    };

    const trackDownload = async () => {
        if (currentUser?.uid) {
            await incrementUserDownloads(currentUser.uid);
        }
    };

    const incrementChatCount = () => {
        if (currentUser?.uid) {
            const currentCount = currentUser.chatMessagesSent || 0;
            const updatedProfile = { ...currentUser, chatMessagesSent: currentCount + 1 };
            setCurrentUser(updatedProfile);
            saveUserProfile(currentUser.uid, { chatMessagesSent: currentCount + 1 });
        }
    };
    
    const value = useMemo(() => ({
        language, setLanguage, theme, setTheme, t, tDiv, isAuthenticated, currentUser, showAuth, logout, deleteCurrentUser, updateProfile, 
        handleLogin: handleLoginLogic, handleSignup: handleSignupLogic,
        wishlist, toggleWishlist, isPremiumActive, setExtendedProfiles, extendedProfiles, setCurrentUser,
        orders, setOrders, supportTickets, setSupportTickets, loadProducts, refreshTrigger, trackDownload, incrementChatCount,
        savedReadings
    }), [language, theme, isAuthenticated, currentUser, t, tDiv, wishlist, isPremiumActive, orders, supportTickets, loadProducts, refreshTrigger, extendedProfiles, savedReadings]);

    return (
        <AppContext.Provider value={value as any}>
            {children}
            {isAuthVisible && <LoginScreen onClose={() => setIsAuthVisible(false)} onLogin={handleLoginLogic} onSignup={handleSignupLogic} />}
        </AppContext.Provider>
    );
};

const AppComp: React.FC = () => {
    const appContext = useAppContext() as any;
    const { currentUser, t, isAuthenticated, showAuth, wishlist, orders, setOrders, refreshTrigger, setTheme, theme, setExtendedProfiles, extendedProfiles, isPremiumActive, savedReadings, setCurrentUser } = appContext;
    
    const navigate = useNavigate();
    const location = useLocation();
    
    const [products, setProducts] = useState<Product[]>([]);
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    const [cartItems, setCartItems] = useState<CartItem[]>(() => { try { const saved = localStorage.getItem('okFutureZoneCartItems'); return saved ? JSON.parse(saved) : []; } catch { return []; } });
    const [notifications, setNotifications] = useState<Notification[]>(() => { try { const saved = localStorage.getItem('okFutureZoneNotifications'); return saved ? JSON.parse(saved) : []; } catch { return []; } });
    const [pendingVerifications, setPendingVerifications] = useState<VerificationRequest[]>(() => { try { const saved = localStorage.getItem('okFutureZonePendingVerifications'); return saved ? JSON.parse(saved) : []; } catch { return []; } });
    const [socialMediaPosts, setSocialMediaPosts] = useState<SocialMediaPost[]>(() => { try { const saved = localStorage.getItem('okFutureZoneSocialMediaPosts'); return saved ? JSON.parse(saved) : []; } catch { return []; } });
    
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [selectedSubscriptionPlan, setSelectedSubscriptionPlan] = useState<any>(null);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    const [flashCart, setFlashCart] = useState(false);
    const [flashOrder, setFlashOrder] = useState(false);
    const [flashNotif, setFlashNotif] = useState(false);
    const [flashWishlist, setFlashWishlist] = useState(false);

    const prevCartLength = useRef(cartItems.length);
    const prevOrderLength = useRef(orders.length);
    const prevNotifLength = useRef(notifications.length);
    const prevWishlistLength = useRef(wishlist.length);

    const cloudCart = currentUser?.cart;
    const isCartLoaded = useRef(false);

    // --- DAILY AUTOMATED NOTIFICATIONS ---
    useEffect(() => {
        const lastNotifDate = localStorage.getItem('ok_daily_notif_date');
        const todayStr = new Date().toDateString();

        if (lastNotifDate !== todayStr) {
            const dailyNotifs = [
                { icon: '💰', title: 'कमाई शुरू करें!', message: 'हमारी प्रीमियम ई-बुक्स को रीसेल करें और आज ही अपना ऑनलाइन बिजनेस शुरू करें।' },
                { icon: '📦', title: 'नया स्टॉक अलर्ट!', message: 'लेटेस्ट मोबाइल एक्सेसरीज और ट्रेंडी जूतों पर आज 50% तक की भारी छूट है।' },
                { icon: '🎓', title: 'कौशल विकसित करें!', message: 'कंप्यूटर और मोबाइल रिपेयरिंग मास्टर कोर्स के साथ आत्मनिर्भर बनें। कोर्सेज अपडेटेड हैं।' },
                { icon: '⚡', title: 'सीमित समय ऑफर!', message: 'आज की पूजन सामग्री खरीदारी पर पाएं फ्री ई-बुक कूपन कोड। चेकआउट करें।' },
                { icon: '📢', title: 'डिजिटल लाइब्रेरी!', message: '100+ गुप्त तंत्र मंत्र यंत्र PDF अब मोबाइल में। एक बार खरीदें, बार-बार बेचें।' }
            ];

            const dayOfMonth = new Date().getDate();
            const selected = dailyNotifs[dayOfMonth % dailyNotifs.length];

            const newNotif: Notification = {
                id: `daily-${Date.now()}`,
                icon: selected.icon,
                title: selected.title,
                message: selected.message,
                timestamp: new Date().toISOString(),
                read: false
            };

            setNotifications(prev => [newNotif, ...prev]);
            localStorage.setItem('ok_daily_notif_date', todayStr);
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated) { isCartLoaded.current = false; }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated && cloudCart && !isCartLoaded.current) {
            setCartItems(cloudCart);
            isCartLoaded.current = true;
        }
    }, [isAuthenticated, cloudCart]);

    useEffect(() => {
        const unsubscribe = subscribeToSocialLinks(setSocialLinks);
        return () => unsubscribe();
    }, []);

    const uid = currentUser?.uid;
    useEffect(() => {
        localStorage.setItem('okFutureZoneCartItems', JSON.stringify(cartItems));
        if (uid) {
            const localCartStr = JSON.stringify(cartItems);
            const cloudCartStr = JSON.stringify(cloudCart || []);
            if (localCartStr !== cloudCartStr) {
                saveUserProfile(uid, { cart: cartItems });
            }
        }
    }, [cartItems, uid, cloudCart]);

    useEffect(() => { localStorage.setItem('okFutureZoneNotifications', JSON.stringify(notifications)); }, [notifications]);
    useEffect(() => { localStorage.setItem('okFutureZonePendingVerifications', JSON.stringify(pendingVerifications)); }, [pendingVerifications]);
    useEffect(() => { localStorage.setItem('okFutureZoneSocialMediaPosts', JSON.stringify(socialMediaPosts)); }, [socialMediaPosts]);

    useEffect(() => { 
        if (cartItems.length > prevCartLength.current) { setFlashCart(true); setTimeout(() => setFlashCart(false), 1000); }
        prevCartLength.current = cartItems.length; 
    }, [cartItems]);

    useEffect(() => { 
        if (orders.length > prevOrderLength.current) { setFlashOrder(true); setTimeout(() => setFlashOrder(false), 1000); }
        prevOrderLength.current = orders.length; 
    }, [orders]);

    useEffect(() => { 
        if (notifications.length > prevNotifLength.current) { setFlashNotif(true); setTimeout(() => setFlashNotif(false), 1000); }
        prevNotifLength.current = notifications.length; 
    }, [notifications]);

    useEffect(() => { 
        if (wishlist.length > prevWishlistLength.current) { setFlashWishlist(true); setTimeout(() => setFlashWishlist(false), 1000); }
        prevWishlistLength.current = wishlist.length; 
    }, [wishlist]);

    useEffect(() => {
        const unsubscribe = subscribeToProducts((firestoreProds) => {
            const firestoreMap = new Map(firestoreProds.map(p => [p.id, p]));
            const staticList = [...initialProducts, ...ebooks];
            const merged = staticList.map(staticProd => {
                if (firestoreMap.has(staticProd.id)) {
                    const fsProd = firestoreMap.get(staticProd.id)!;
                    firestoreMap.delete(staticProd.id); 
                    return fsProd;
                }
                return staticProd;
            });
            const all = [...Array.from(firestoreMap.values()), ...merged];
            setProducts(all);
            if (firestoreProds.length > 0) { localStorage.setItem('ok_e_store_db_has_data_flag', 'true'); }
        });
        return () => unsubscribe();
    }, []);

    const handleProtectedLink = (path: string) => { if (isAuthenticated) navigate(path); else showAuth(() => navigate(path)); };

    const handleSelectDivinationType = (type: DivinationType) => {
        switch (type) {
            case DivinationType.PUJAN_SAMAGRI: navigate('/store/pujan-samagri'); break;
            case DivinationType.TANTRA_MANTRA_YANTRA_EBOOK: navigate('/store/ebooks'); break;
            case DivinationType.GEMS_JEWELRY: navigate('/store/gems-jewelry'); break;
            case DivinationType.MOBILE_ACCESSORIES: navigate('/store/mobile-accessories'); break;
            case DivinationType.LADIES_GENTS_BABY_SHOES: navigate('/store/shoes'); break;
            case DivinationType.LADIES_GENTS_ACCESSORIES: navigate('/store/accessories'); break;
            case DivinationType.COMPUTER_COURSE: navigate('/store/computer-course'); break;
            case DivinationType.MOBILE_REPAIRING_COURSE: navigate('/store/mobile-repairing'); break;
            default: break;
        }
    };
    
    const addToCart = (product: Product, quantity: number, color: string, size?: string) => {
        setCartItems(prev => {
            const existingItem = prev.find(item => item.id === product.id && item.selectedColor === color && item.selectedSize === size);
            if (existingItem) return prev.map(item => item.id === product.id && item.selectedColor === color && item.selectedSize === size ? { ...item, quantity: item.quantity + quantity } : item);
            return [...prev, { ...product, quantity, selectedColor: color, selectedSize: size }];
        });
    };
    
    const onUpdateCartQuantity = (productId: string, color: string, newQuantity: number, size?: string) => { 
        setCartItems(prev => prev.map(item => item.id === productId && item.selectedColor === color && item.selectedSize === size ? { ...item, quantity: newQuantity > 0 ? newQuantity : 1 } : item)); 
    };
    const onRemoveCartItem = (productId: string, color: string, size?: string) => { 
        setCartItems(prev => prev.filter(item => !(item.id === productId && item.selectedColor === color && item.selectedSize === size))); 
    };

    const activeProducts = useMemo(() => {
        return products.filter(p => {
            const deleted = p.isDeleted === true || (p.isDeleted as any) === "true";
            const hidden = p.isHidden === true || (p.isHidden as any) === "true";
            const hardDeleted = p.isHardDeleted === true || (p.isHardDeleted as any) === "true";
            const hasImage = p.imageUrl1 && p.imageUrl1.trim().length > 10; 
            return !deleted && !hidden && !hardDeleted && hasImage;
        });
    }, [products]);

    const activeSocialLinks = useMemo(() => socialLinks.filter(l => l.isActive), [socialLinks]);
    
    return (
        <div className="min-h-screen text-white p-4 pt-24 pb-32">
            {isSearchVisible && <SearchModal products={activeProducts} onClose={() => setIsSearchVisible(false)} />}
            
            {isSocialModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsSocialModalOpen(false)}>
                    <div className="bg-slate-900 border border-orange-500/30 p-6 rounded-[2rem] w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-hindi font-black text-center mb-6 uppercase tracking-wider">सोशल लिंक्स</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {activeSocialLinks.length === 0 ? (
                                <p className="col-span-2 text-center text-gray-500 text-xs py-4">कोई सोशल लिंक उपलब्ध नहीं है।</p>
                            ) : (
                                activeSocialLinks.map(link => (
                                    <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-orange-500/10 hover:border-orange-500 transition-all group">
                                        <span className="text-3xl group-hover:scale-110 transition-transform">{link.icon}</span>
                                        <span className="text-[10px] font-black uppercase text-gray-300">{link.label}</span>
                                    </a>
                                ))
                            )}
                        </div>
                        <button onClick={() => setIsSocialModalOpen(false)} className="w-full mt-6 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/10">बंद करें</button>
                    </div>
                </div>
            )}
            
            <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-900 via-black to-orange-900 h-12 flex items-center justify-between px-3 border-b border-orange-700/50 shadow-lg transition-all">
                <div className="flex items-center gap-1 w-full justify-around">
                    <button onClick={() => setIsSocialModalOpen(true)} className={`flex flex-col items-center justify-center w-12 py-1 rounded-lg transition-all ${isSocialModalOpen ? 'bg-orange-600 text-white shadow-inner' : 'text-white'}`}>
                        <SocialIcon isActive={isSocialModalOpen} />
                        <span className="text-[8px] sm:text-xs text-center font-bold mt-1 uppercase tracking-tight">Social</span>
                    </button>

                    <button onClick={() => setIsSearchVisible(true)} className={`flex flex-col items-center justify-center w-12 py-1 rounded-lg transition-all ${isSearchVisible ? 'bg-yellow-400 text-black shadow-inner' : 'text-white'}`}>
                        <SearchIcon isActive={isSearchVisible} />
                        <span className="text-[8px] sm:text-xs text-center font-bold mt-1 uppercase tracking-tight">{t('search')}</span>
                    </button>

                    <Link to="/wishlist" className={`relative flex flex-col items-center justify-center w-12 py-1 rounded-lg transition-all ${location.pathname.startsWith('/wishlist') ? 'bg-yellow-400 text-black' : (flashWishlist ? 'bg-pink-600 text-white animate-icon-feedback' : 'text-white')}`}>
                        <div className="relative">
                            <HeartIcon isActive={location.pathname.startsWith('/wishlist')} />
                            {wishlist.length > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[8px] font-bold rounded-full h-3 w-3 flex items-center justify-center border border-black">{wishlist.length}</span>}
                        </div>
                        <span className="text-[8px] sm:text-xs text-center font-bold mt-1 uppercase tracking-tight">{t('wishlist')}</span>
                    </Link>

                    <button onClick={() => { handleProtectedLink('/orders'); }} className={`relative flex flex-col items-center justify-center w-12 py-1 rounded-lg transition-all ${location.pathname.startsWith('/orders') ? 'bg-yellow-400 text-black' : (flashOrder ? 'bg-orange-600 text-white animate-icon-feedback' : 'text-white')}`}>
                        <OrderIcon isActive={location.pathname.startsWith('/orders')} />
                        <span className="text-[8px] sm:text-xs text-center font-bold mt-1 uppercase tracking-tight">{t('my_orders')}</span>
                    </button>

                    <Link to="/cart" className={`relative flex flex-col items-center justify-center w-12 py-1 rounded-lg transition-all ${location.pathname.startsWith('/cart') ? 'bg-yellow-400 text-black' : (flashCart ? 'bg-green-600 text-white animate-icon-feedback' : 'text-white')}`}>
                        <div className="relative">
                            <CartIcon isActive={location.pathname.startsWith('/cart')} />
                            {cartItems.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full h-3 w-3 flex items-center justify-center border border-black">{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</span>}
                        </div>
                        <span className="text-[8px] sm:text-xs font-bold mt-1 uppercase tracking-tight">{t('cart')}</span>
                    </Link>

                    <div className={`relative flex flex-col items-center justify-center w-12 py-1 text-center rounded-lg transition-all ${isNotifOpen ? 'bg-yellow-400 text-black' : (flashNotif ? 'bg-blue-600 text-white animate-vibrate' : 'text-white')}`}>
                        <NotificationBell notifications={notifications} onOpen={() => { setNotifications(prev => prev.map(n => ({ ...n, read: true }))); }} onClear={() => setNotifications([])} isOpen={isNotifOpen} onToggle={setIsNotifOpen} />
                        <span className="text-[8px] sm:text-xs font-bold mt-1 uppercase tracking-tight">{t('notifications')}</span>
                    </div>
                </div>
            </header>

            <div className="fixed top-12 left-0 right-0 z-[49] h-8 bg-black flex items-center overflow-hidden border-b border-white/5 shadow-md">
                <div className="animate-marquee-custom text-[10px] font-bold px-4 text-yellow-400 uppercase">हमारे ऐप में आपका स्वागत है बहुत सारे pdf E-book डाउनलोड करें और इन pdf E-book को बेचकर कमाई शुरू करें समय-समय पर हम कोर्स अपडेट करते रहते हैं इसलिए ऊपर दिए गए सभी सोशल मीडिया अकाउंट को फॉलो और सब्सक्राइब कर लें धन्यवाद</div>
            </div>

            <div className="container mx-auto max-w-7xl">
                <Routes>
                    <Route path="/" element={<WelcomeScreen onStart={() => navigate('/home')} />} />
                    <Route path="/home" element={<SelectionScreen onSelect={handleSelectDivinationType} isPremiumActive={isPremiumActive} products={activeProducts} categoryVisibility={{}} />} />
                    <Route path="/store" element={<PujanSamagriStore products={activeProducts} />} />
                    <Route path="/store/:categoryUrl" element={<PujanSamagriStore products={activeProducts} />} />
                    <Route path="/product/:productId" element={<ProductDetailScreen products={activeProducts} addToCart={addToCart} />} />
                    <Route path="/cart" element={<ShoppingCartScreen cartItems={cartItems} onUpdateQuantity={onUpdateCartQuantity} onRemoveItem={onRemoveCartItem} />} />
                    <Route path="/checkout" element={<CheckoutScreen cartItems={cartItems} onPlaceOrder={(det, total, met, id, screenshot, txnId) => {
                        const newOrder: Order = { 
                            id, 
                            items: cartItems, 
                            customer: det, 
                            total, 
                            date: new Date().toISOString(), 
                            status: met === 'PREPAID' ? 'Verification Pending' : 'Processing', 
                            paymentMethod: met, 
                            paymentStatus: met === 'PREPAID' ? 'VERIFICATION_PENDING' : 'PENDING',
                            screenshotDataUrl: screenshot,
                            transactionId: txnId
                        };
                        setOrders((prev: Order[]) => [...prev, newOrder]); setCartItems([]);
                    }} onVerificationRequest={(req) => {
                        setPendingVerifications((prev: any) => [...prev, { ...req, id: `vr-${Date.now()}`, requestDate: new Date().toISOString() } as any]);
                    }} />} />
                    <Route path="/orders" element={<OrderHistoryScreen orders={orders} />} />
                    <Route path="/orders/:orderId" element={<OrderConfirmationScreen orders={orders} />} />
                    <Route path="/profile" element={<ProfileScreen />} />
                    <Route path="/profile/edit" element={<AccountSettingsScreen />} />
                    <Route path="/faq" element={<FAQScreen />} />
                    <Route path="/settings" element={<SettingsScreen audioRef={audioRef} />} />
                    <Route path="/community" element={<CommunityChatScreen />} />
                    <Route path="/support" element={<SupportTicketScreen onCreateTicket={(ticket) => appContext.setSupportTickets((prev: any) => [...prev, { ...ticket, id: `st-${Date.now()}`, status: 'Open', createdAt: new Date().toISOString() }])} onVerificationRequest={(req) => {
                        setPendingVerifications((prev: any) => [...prev, { ...req, id: `vr-${Date.now()}`, requestDate: new Date().toISOString() } as any]);
                    }} />} />
                    <Route path="/admin" element={<AdminScreen products={products} onUpdateProducts={setProducts} orders={orders} onUpdateOrders={setOrders} pendingVerifications={pendingVerifications} onApproveVerification={async (id) => {
                         const req = pendingVerifications.find(r => r.id === id);
                         if (!req) return;
                         
                         if (req.type === 'PRODUCT' && req.orderId) {
                             setOrders((prev: Order[]) => prev.map(o => {
                                 if (o.id === req.orderId) { return { ...o, status: 'Processing', paymentStatus: 'COMPLETED' }; }
                                 return o;
                             }));
                             updateFirestoreOrder(req.orderId, { status: 'Processing', paymentStatus: 'COMPLETED' });
                         } else if (req.type === 'SUBSCRIPTION') {
                             let targetUid: string | undefined;
                             const userEmail = req.userEmail;
                             const userPhone = req.userPhone;
                             if (userEmail) { const user = await getUserByEmail(userEmail); if (user) targetUid = user.uid; }
                             if (!targetUid && userPhone) { const user = await getUserByPhone(userPhone); if (user) targetUid = user.uid; }
                             if (targetUid) {
                                 const expiry = new Date(); let dLimit = 0; let duration = 30;
                                 if (req.planName.includes('Weekly')) { duration = 7; dLimit = 12; }
                                 else if (req.planName.includes('Fortnight')) { duration = 15; dLimit = 25; }
                                 else if (req.planName.includes('Monthly')) { duration = 30; dLimit = 60; }
                                 else if (req.planName.includes('Quarterly')) { duration = 90; dLimit = 100; }
                                 else if (req.planName.includes('Half-Yearly')) { duration = 180; dLimit = 200; }
                                 else if (req.planName.includes('Yearly')) { duration = 365; dLimit = 999999; }
                                 expiry.setDate(expiry.getDate() + duration);
                                 await saveUserProfile(targetUid, { isPremium: true, subscriptionPlan: req.planName, subscriptionExpiry: expiry.toISOString(), downloadsLimit: dLimit });
                             }
                         } else if (req.type === 'SUPPORT_CHAT') {
                             let targetUid: string | undefined;
                             const userEmail = req.userEmail;
                             const userPhone = req.userPhone;
                             if (userEmail) { const user = await getUserByEmail(userEmail); if (user) targetUid = user.uid; }
                             if (!targetUid && userPhone) { const user = await getUserByPhone(userPhone); if (user) targetUid = user.uid; }
                             if (targetUid) {
                                 const expiry = new Date(); expiry.setDate(expiry.getDate() + 7);
                                 await saveUserProfile(targetUid, { whatsappSupportExpiry: expiry.toISOString() });
                             }
                         }
                         setPendingVerifications((prev: any) => prev.filter((r: any) => r.id !== id));
                         deleteFirestoreVerification(id); 
                    }} supportTickets={appContext.supportTickets} onUpdateTicket={(t) => appContext.setSupportTickets((p: any) => p.map((x: any) => x.id === t.id ? t : x))} socialMediaPosts={socialMediaPosts} onCreatePost={(post) => setSocialMediaPosts((p: any) => [...p, {...post, id: `sm-${Date.now()}`, createdAt: new Date().toISOString()} as any])} onUpdatePost={(post) => setSocialMediaPosts((p: any) => p.map((x: any) => x.id === post.id ? post : x))} onDeletePost={(postId) => setSocialMediaPosts((p: any) => p.filter((x: any) => x.id !== postId))} categoryVisibility={{}} onUpdateCategoryVisibility={() => {}} socialVisibility={{}} onUpdateSocialVisibility={() => {}} />} />
                    <Route path="/wishlist" element={<WishlistScreen products={activeProducts} />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsAndConditions />} />
                    <Route path="/premium" element={<PremiumScreen onSelectPlan={(plan) => { setSelectedSubscriptionPlan(plan); navigate('/subscribe'); }} isTrialAvailable={true} onBack={() => navigate('/home')} />} />
                    <Route path="/subscribe" element={<SubscriptionPaymentScreen plan={selectedSubscriptionPlan} userProfile={currentUser} onVerificationRequest={(req) => { setPendingVerifications((prev: any) => [...prev, { ...req, id: `vr-${Date.now()}`, requestDate: new Date().toISOString() } as any]); navigate('/subscription-confirmed'); }} onBack={() => navigate('/premium')} />} />
                    <Route path="/subscription-confirmed" element={<SubscriptionConfirmationScreen expiryDate={null} />} />
                    <Route path="/divination/:toolType" element={<DivinationScreen />} />
                </Routes>
            </div>

            <audio ref={audioRef} src="https://aistudio.google.com/static/sounds/background_music.mp3" loop autoPlay />
            <BottomNavBar cartItemCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)} />

            <footer className="text-center text-xs text-orange-400/60 mt-12 pb-24 sm:pb-8 relative z-10">
                <div className="flex justify-center items-center gap-2 opacity-30 mt-6">
                    <div className="w-16 h-[1px] bg-white"></div>
                    <div className="w-2 h-2 rounded-full border border-white"></div>
                    <div className="w-16 h-[1px] bg-white"></div>
                </div>

                <p className="mt-4 text-[10px] uppercase tracking-[0.2em]">{t('copyright')}</p>
            </footer>
        </div>
    );
};

export default AppComp;
