
import React, { useState, FormEvent, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Order, UserProfile, SupportTicket, SocialMediaPost, VerificationRequest, SocialLink } from './types';
import Card from './Card';
import { useAppContext } from './App';
import { 
    addFirestoreProduct, 
    updateFirestoreProduct, 
    deleteFirestoreProduct, 
    subscribeToAllUsers,
    updateFirestoreOrder,
    updateSupportTicketStatus,
    subscribeToAllOrders,
    subscribeToSocialLinks,
    addSocialLink,
    updateSocialLink,
    deleteSocialLink
} from './firebaseService';
import { uploadToSupabase } from './supabaseService';
import { products as staticProducts } from './products';
import { ebooks as staticEbooks } from './ebooks';

interface AdminPanelProps {
    products: Product[];
    onUpdateProducts: (products: Product[]) => void;
    orders: Order[];
    onUpdateOrders: (orders: Order[]) => void;
    pendingVerifications: VerificationRequest[];
    onApproveVerification: (id: string) => void;
    supportTickets: SupportTicket[];
    onUpdateTicket: (ticket: SupportTicket) => void;
    socialMediaPosts: SocialMediaPost[];
    onCreatePost: (post: any) => void;
    onDeletePost: (id: string) => void;
}

const OrderCardItem: React.FC<{ 
    order: Order; 
    expandedOrderId: string | null; 
    setExpandedOrderId: (id: string | null) => void;
    handleOrderStatusUpdate: (id: string, status: string) => void;
    openTrackingModal: (id: string) => void;
}> = ({ order, expandedOrderId, setExpandedOrderId, handleOrderStatusUpdate, openTrackingModal }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-6 relative">
        <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[10px] px-2 py-1 rounded font-black uppercase ${order.status === 'Processing' ? 'bg-blue-600' : order.status === 'Shipped' ? 'bg-green-600' : order.status === 'Out for Delivery' ? 'bg-yellow-600' : order.status === 'Delivered' || order.status === 'Completed' ? 'bg-emerald-600' : order.status === 'Refunded' ? 'bg-pink-600' : order.status === 'Cancelled' ? 'bg-red-600' : 'bg-gray-600'}`}>{order.status}</span>
                    <span className="text-gray-400 text-xs font-mono">#{order.id.slice(-8)}</span>
                    <span className="text-[10px] text-gray-500">{new Date(order.date).toLocaleString('hi-IN')}</span>
                </div>
                <h4 className="text-lg font-bold text-white mb-1">{order.customer.name}</h4>
                <p className="text-sm text-gray-400 font-bold">{order.customer.phone}</p>
                <div className="flex gap-2 mt-1">
                    <span className="text-[10px] bg-blue-900/30 text-blue-200 px-2 py-0.5 rounded border border-blue-500/30">
                        📧 {order.customer.email}
                    </span>
                </div>
                <button onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)} className="text-orange-400 text-xs font-bold mt-2 underline">{expandedOrderId === order.id ? 'विवरण छिपाएं' : 'पूरा विवरण देखें (पता & पेमेंट)'}</button>
            </div>
            <div className="flex flex-col gap-3 min-w-[180px] items-end">
                <p className="text-2xl font-black text-white text-right">₹{order.total}</p>
                <div className="text-right">
                    <span className={`text-[10px] font-black px-2 py-1 rounded ${order.paymentMethod === 'PREPAID' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>{order.paymentMethod}</span>
                </div>
                
                <div className="w-full mt-2">
                    <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Set Status</label>
                    <select
                        value={order.status}
                        onChange={(e) => handleOrderStatusUpdate(order.id, e.target.value)}
                        className="w-full bg-black/40 border border-white/20 text-white text-xs p-2 rounded-lg outline-none focus:border-orange-500 cursor-pointer"
                    >
                        <option value="Verification Pending">Verification Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Refunded">Refunded</option>
                    </select>
                </div>

                {order.status !== 'Cancelled' && order.status !== 'Completed' && order.status !== 'Refunded' && (
                    <button onClick={() => openTrackingModal(order.id)} className="bg-blue-600 text-white text-xs font-bold py-2 px-4 rounded hover:bg-blue-700 w-full shadow-lg">+ Add/Edit Tracking</button>
                )}
            </div>
        </div>
        {expandedOrderId === order.id && (
            <div className="mt-4 pt-4 border-t border-white/10 grid md:grid-cols-2 gap-6 animate-fade-in bg-black/20 p-4 rounded-xl">
                <div>
                    <h5 className="text-xs font-black text-orange-400 uppercase mb-2">शिपिंग पता (Shipping Address)</h5>
                    <p className="text-sm text-white font-bold">{order.customer.name}</p>
                    <p className="text-sm text-white">{order.customer.address}</p>
                    {order.customer.landmark && <p className="text-sm text-white">Landmark: {order.customer.landmark}</p>}
                    <p className="text-sm text-white">{order.customer.city}, {order.customer.state} - {order.customer.pincode}</p>
                    <p className="text-sm text-white">{order.customer.country}</p>
                    <p className="text-sm text-blue-300 mt-1">📞 {order.customer.phone}</p>
                    <h5 className="text-xs font-black text-orange-400 uppercase mt-4 mb-2">सामान (Items)</h5>
                    <div className="space-y-1">{order.items.map((item, idx) => (<p key={idx} className="text-xs text-white">• {item.name} (x{item.quantity}) {item.selectedColor !== 'N/A' && `[${item.selectedColor}]`} {item.selectedSize && `(${item.selectedSize})`}</p>))}</div>
                </div>
                <div>
                    <h5 className="text-xs font-black text-green-400 uppercase mb-2">पेमेंट प्रूफ (Payment Proof)</h5>
                    {order.transactionId && <p className="text-xs text-white font-mono mt-1">Txn ID: <span className="bg-white/10 px-1 rounded">{order.transactionId}</span></p>}
                    {order.screenshotDataUrl ? (
                        <div className="mt-2 w-full h-40 bg-black rounded-lg overflow-hidden border border-white/10 relative group"><img src={order.screenshotDataUrl} className="w-full h-full object-contain" alt="Proof" /><a href={order.screenshotDataUrl} target="_blank" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold underline transition-opacity">बड़ा करके देखें</a></div>
                    ) : (<p className="text-xs text-red-400 mt-2">No Screenshot</p>)}
                </div>
            </div>
        )}
    </div>
);

const AdminPanel: React.FC<AdminPanelProps> = (props) => {
    const { 
        products,
        pendingVerifications = [], 
        onApproveVerification,
        supportTickets = [],
        onUpdateTicket,
        socialMediaPosts = [],
        onCreatePost,
        onDeletePost
    } = props;
    
    const { loadProducts, currentUser } = useAppContext() as any;
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'history' | 'verifications' | 'users' | 'support' | 'social' | 'analytics' | 'bin' | 'socialLinks'>('inventory');
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [globalOrders, setGlobalOrders] = useState<Order[]>([]);
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    
    const [isUploading, setIsUploading] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    
    // Social Links Form State
    const [newSocialLink, setNewSocialLink] = useState<Omit<SocialLink, 'id'>>({
        platform: 'WhatsApp', url: '', label: '', icon: '💬', isActive: true
    });
    const [editingSocialLink, setEditingSocialLink] = useState<SocialLink | null>(null);

    // Tracking Modal State
    const [trackingModalOpen, setTrackingModalOpen] = useState(false);
    const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
    const [courierInput, setCourierInput] = useState('');
    const [trackingIdInput, setTrackingIdInput] = useState('');

    // Social Media State
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostImage, setNewPostImage] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    // Product State
    const [sizeInput, setSizeInput] = useState('');
    const [colorInput, setColorInput] = useState('');
    const [ytThumbOptions, setYtThumbOptions] = useState<string[]>([]);
    const [pType, setPType] = useState<'PHYSICAL' | 'DIGITAL'>('PHYSICAL');
    const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
        name: '', description: '', mrp: 0, discountPercentage: 0, 
        colors: [], sizes: [], imageUrl1: '', imageUrl2: '', 
        category: 'Pujan Samagri', productType: 'PHYSICAL', 
        reviewVideoUrl: '', googleDriveLink: '', isTrending: false,
        isHidden: false, isDeleted: false
    });

    useEffect(() => {
        if (loadProducts) loadProducts();
        const unsubUsers = subscribeToAllUsers(setAllUsers);
        const unsubOrders = subscribeToAllOrders(setGlobalOrders);
        const unsubSocial = subscribeToSocialLinks(setSocialLinks);

        return () => { 
            unsubUsers(); 
            unsubOrders();
            unsubSocial();
        };
    }, []);

    const handleSaveSocialLink = async (e: FormEvent) => {
        e.preventDefault();
        try {
            if (editingSocialLink) {
                await updateSocialLink(editingSocialLink.id, newSocialLink);
            } else {
                await addSocialLink(newSocialLink);
            }
            setNewSocialLink({ platform: 'WhatsApp', url: '', label: '', icon: '💬', isActive: true });
            setEditingSocialLink(null);
            alert("Social Link Saved!");
        } catch (err) { alert("Error saving link"); }
    };

    const handleEditSocialLink = (link: SocialLink) => {
        setEditingSocialLink(link);
        setNewSocialLink(link);
    };

    const handleDeleteSocialLink = async (id: string) => {
        if (confirm("Delete this link?")) await deleteSocialLink(id);
    };

    // --- ENHANCED YOUTUBE THUMBNAIL LOGIC ---
    useEffect(() => {
        if (newProduct.reviewVideoUrl) {
            const ytMatch = newProduct.reviewVideoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
            if (ytMatch && ytMatch[1]) {
                const videoId = ytMatch[1];
                const options = [
                    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                    `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
                    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                ];
                setYtThumbOptions(options);
                if (!newProduct.imageUrl1) setNewProduct(prev => ({ ...prev, imageUrl1: options[0] }));
            } else setYtThumbOptions([]);
        } else setYtThumbOptions([]);
    }, [newProduct.reviewVideoUrl]);

    const handleTypeChange = (type: 'PHYSICAL' | 'DIGITAL') => {
        setPType(type);
        setNewProduct(prev => ({ ...prev, productType: type, category: type === 'DIGITAL' ? 'Tantra Mantra Yantra E-book' : 'Pujan Samagri' }));
    };

    const handleSaveProduct = async (e: FormEvent) => {
        e.preventDefault();
        setIsUploading(true);
        try {
            const productPayload = { ...newProduct, productType: pType, sizes: sizeInput.split(',').map(s => s.trim()).filter(s => s), colors: colorInput.split(',').map(c => c.trim()).filter(c => c) };
            if (editingProduct) { await updateFirestoreProduct(editingProduct.id, productPayload); alert("Updated!"); } else { await addFirestoreProduct(productPayload as any); alert("Created!"); }
            resetForm(); 
            if (loadProducts) loadProducts();
        } catch (err) { alert("Error saving."); } finally { setIsUploading(false); }
    };

    const resetForm = () => {
        setNewProduct({ name: '', description: '', mrp: 0, discountPercentage: 0, colors: [], sizes: [], imageUrl1: '', imageUrl2: '', category: 'Pujan Samagri', productType: 'PHYSICAL', reviewVideoUrl: '', googleDriveLink: '', isTrending: false, isHidden: false, isDeleted: false });
        setPType('PHYSICAL'); setSizeInput(''); setColorInput(''); setEditingProduct(null); setYtThumbOptions([]);
    };

    const handleEditClick = (p: Product) => {
        setEditingProduct(p); setNewProduct(p); setPType(p.productType); setSizeInput(p.sizes?.join(', ') || ''); setColorInput(p.colors?.join(', ') || ''); setActiveTab('inventory'); window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
        await updateFirestoreOrder(orderId, { status: newStatus as any }); 
    };

    const openTrackingModal = (orderId: string) => { setTrackingOrderId(orderId); setCourierInput(''); setTrackingIdInput(''); setTrackingModalOpen(true); };

    const submitTracking = async () => {
        if(!trackingOrderId) return;
        if(!courierInput.trim() || !trackingIdInput.trim()) { alert("Enter Courier & Tracking ID."); return; }
        await updateFirestoreOrder(trackingOrderId, { carrier: courierInput, trackingId: trackingIdInput, status: 'Shipped' });
        alert("Tracking Updated & Order Shipped!");
        setTrackingModalOpen(false);
    };

    const handleSocialPostSubmit = async (e: FormEvent) => { 
        e.preventDefault(); 
        if(!newPostContent) return; 
        setIsPosting(true);
        try {
            await onCreatePost({ content: newPostContent, imageUrl: newPostImage, platforms: ['Facebook', 'Instagram'] }); 
            setNewPostContent(''); 
            setNewPostImage(''); 
            alert("Post Live!"); 
        } catch(e) {
            alert("Failed to post");
        } finally {
            setIsPosting(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsUploading(true);
            try {
                const url = await uploadToSupabase(e.target.files[0]);
                setNewPostImage(url);
            } catch (err) {
                alert("Upload failed");
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleTicketStatus = async (ticket: SupportTicket) => {
        const newStatus = ticket.status === 'Open' ? 'Closed' : 'Open';
        await updateSupportTicketStatus(ticket.id, newStatus);
        onUpdateTicket({ ...ticket, status: newStatus });
    };

    const handleMarkRefunded = async (e: React.MouseEvent, ticket: SupportTicket) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("Confirm Refund?")) return;
        let orderId = ticket.refundOrderId || "";
        const input = prompt("Confirm Order ID to refund:", orderId);
        if (input !== null) orderId = input.trim();
        if (orderId) {
            try {
                await updateFirestoreOrder(orderId, { status: 'Refunded' as any, paymentStatus: 'REFUNDED' as any });
                alert(`Order #${orderId} set to REFUNDED.`);
            } catch (err: any) {
                alert(`Warning: Failed to update Order.`);
            }
        }
        try {
            await updateSupportTicketStatus(ticket.id, 'Refunded' as any); 
            onUpdateTicket({ ...ticket, status: 'Refunded' });
            alert("Ticket Refunded.");
        } catch (err: any) { alert("Error updating Ticket."); }
    };

    const handleRestoreProduct = async (product: Product) => {
        if(confirm("Restore this product?")) {
            await updateFirestoreProduct(product.id, { ...product, isDeleted: false });
            if (loadProducts) loadProducts();
        }
    };

    const handlePermanentDelete = async (product: Product) => {
        if (confirm("Permanently delete?")) {
            const isStatic = staticProducts.some(p => p.id === product.id) || staticEbooks.some(e => e.id === product.id);
            if (isStatic) await updateFirestoreProduct(product.id, { ...product, isHardDeleted: true, isDeleted: true, isHidden: true });
            else await deleteFirestoreProduct(product.id);
            if (loadProducts) loadProducts();
        }
    };

    const salesData = useMemo(() => {
        const stats: Record<string, number> = {};
        globalOrders.forEach(o => {
            if (o.status !== 'Cancelled' && o.status !== 'Refunded' && (o.paymentStatus === 'COMPLETED' || o.paymentMethod === 'COD')) { 
                 if (o.status === 'Delivered' || o.status === 'Completed' || o.paymentStatus === 'COMPLETED') {
                    const date = new Date(o.date);
                    const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                    stats[key] = (stats[key] || 0) + o.total;
                 }
            }
        });
        return stats;
    }, [globalOrders]);

    const liveItems = useMemo(() => products.filter(p => !p.isDeleted && !p.isHardDeleted && p.imageUrl1 && p.imageUrl1.trim() !== ''), [products]);
    const binItems = useMemo(() => products.filter(p => p.isDeleted === true && !p.isHardDeleted && p.imageUrl1 && p.imageUrl1.trim() !== ''), [products]);
    const sizeTags = useMemo(() => sizeInput.split(',').map(s => s.trim()).filter(s => s !== ''), [sizeInput]);
    const colorTags = useMemo(() => colorInput.split(',').map(c => c.trim()).filter(c => c !== ''), [colorInput]);
    const activeGlobalOrders = useMemo(() => globalOrders.filter(o => o.status !== 'Completed' && o.status !== 'Delivered' && o.status !== 'Cancelled' && o.status !== 'Refunded'), [globalOrders]);
    const historyGlobalOrders = useMemo(() => globalOrders.filter(o => o.status === 'Completed' || o.status === 'Delivered' || o.status === 'Cancelled' || o.status === 'Refunded'), [globalOrders]);

    return (
        <div className="animate-fade-in w-full max-w-7xl mx-auto space-y-6 pb-24 text-left p-1 sm:p-4">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/40 p-4 sm:p-6 rounded-3xl sm:rounded-[2rem] border border-white/5 shadow-2xl">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-hindi font-black text-white tracking-tighter">Ok-Command Center</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-orange-400 font-bold uppercase tracking-widest">Master Admin v10.10</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-900/40 border border-red-600/50 rounded-full">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]"></span>
                            <span className="text-[9px] text-red-300 font-mono font-bold">GOD VIEW ACTIVE</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { if(loadProducts) loadProducts(); }} className="p-3 bg-white/5 rounded-full border border-white/10 text-xl hover:rotate-180 transition-all duration-500 text-white">🔄</button>
                    <button onClick={() => navigate(-1)} className="px-6 py-2 bg-orange-600 rounded-full font-black text-white text-xs uppercase shadow-lg shadow-orange-900/40 hover:bg-orange-500 transition-colors">Exit</button>
                </div>
            </header>

            <div className="flex overflow-x-auto gap-2 sm:gap-4 pb-2 no-scrollbar px-1">
                {[
                    { id: 'inventory', label: 'इन्वेंट्री', icon: '📦' }, 
                    { id: 'orders', label: 'ऑर्डर्स', icon: '🛒', count: activeGlobalOrders.length }, 
                    { id: 'history', label: 'इतिहास', icon: '📜', count: historyGlobalOrders.length }, 
                    { id: 'analytics', label: 'सेल्स', icon: '📊' },
                    { id: 'verifications', label: 'पेमेंट', icon: '✅', count: pendingVerifications.length }, 
                    { id: 'users', label: 'ग्राहक', icon: '👥' }, 
                    { id: 'support', label: 'टिकट', icon: '🎫', count: supportTickets.filter(t => t.status === 'Open').length }, 
                    { id: 'social', label: 'सोशल', icon: '📢' }, 
                    { id: 'socialLinks', label: 'सोशल लिंक', icon: '🔗' },
                    { id: 'bin', label: 'बिन', icon: '🗑️', count: binItems.length }
                ].map(tab => (
                    <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id as any)} className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 sm:px-8 sm:py-4 rounded-full whitespace-nowrap font-black transition-all border text-[10px] sm:text-sm ${activeTab === tab.id ? 'bg-orange-600 border-orange-400 text-white scale-105 shadow-xl' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'}`}><span>{tab.icon}</span> {tab.label}{tab.count !== undefined && tab.count > 0 && <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded-full ml-1 shadow-lg">{tab.count}</span>}</button>
                ))}
            </div>

            {/* Social Links Tab */}
            {activeTab === 'socialLinks' && (
                <div className="space-y-6 animate-fade-in">
                    <Card className="!bg-[#0d0d0d] border-orange-500/20 p-6 rounded-[2rem]">
                        <h3 className="text-xl font-hindi font-black text-white mb-6">{editingSocialLink ? 'Edit Social Link ✏️' : 'Add Social Link 🔗'}</h3>
                        <form onSubmit={handleSaveSocialLink} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div><label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-1 block">Platform Name</label><input placeholder="Ex: WhatsApp, Instagram" value={newSocialLink.platform} onChange={e => setNewSocialLink({...newSocialLink, platform: e.target.value})} className="w-full bg-black/50 p-3 rounded-xl border border-white/10 text-white" required /></div>
                                <div><label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-1 block">Button Label</label><input placeholder="Ex: Contact Support, Follow Us" value={newSocialLink.label} onChange={e => setNewSocialLink({...newSocialLink, label: e.target.value})} className="w-full bg-black/50 p-3 rounded-xl border border-white/10 text-white" required /></div>
                            </div>
                            <div className="space-y-4">
                                <div><label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-1 block">Icon (Emoji)</label><input placeholder="Ex: 💬, 📸, 📺" value={newSocialLink.icon} onChange={e => setNewSocialLink({...newSocialLink, icon: e.target.value})} className="w-full bg-black/50 p-3 rounded-xl border border-white/10 text-white" required /></div>
                                <div><label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-1 block">URL</label><input placeholder="https://..." value={newSocialLink.url} onChange={e => setNewSocialLink({...newSocialLink, url: e.target.value})} className="w-full bg-black/50 p-3 rounded-xl border border-white/10 text-white" required /></div>
                            </div>
                            <div className="col-span-full pt-4 flex gap-4">
                                <button type="submit" className="flex-grow py-4 bg-orange-600 text-white font-black rounded-xl uppercase tracking-widest">{editingSocialLink ? 'Update Link' : 'Add Link'}</button>
                                {editingSocialLink && <button type="button" onClick={() => { setEditingSocialLink(null); setNewSocialLink({ platform: 'WhatsApp', url: '', label: '', icon: '💬', isActive: true }); }} className="px-6 py-4 bg-white/5 text-gray-400 font-bold rounded-xl uppercase">Cancel</button>}
                            </div>
                        </form>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {socialLinks.map(link => (
                            <div key={link.id} className={`p-4 rounded-2xl border ${link.isActive ? 'bg-white/5 border-white/10' : 'bg-red-900/10 border-red-500/20 opacity-60'} flex items-center justify-between`}>
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{link.icon}</span>
                                    <div>
                                        <p className="text-sm font-bold text-white leading-tight">{link.label}</p>
                                        <p className="text-[10px] text-gray-500 truncate max-w-[150px]">{link.platform}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => updateSocialLink(link.id, { isActive: !link.isActive })} className={`p-2 rounded-lg text-xs font-black ${link.isActive ? 'bg-green-600' : 'bg-orange-600'} text-white`}>{link.isActive ? 'On' : 'Off'}</button>
                                    <button onClick={() => handleEditSocialLink(link)} className="p-2 bg-blue-600 rounded-lg text-white">✏️</button>
                                    <button onClick={() => handleDeleteSocialLink(link.id)} className="p-2 bg-red-600 rounded-lg text-white">🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'inventory' && (
                <div className="space-y-6 sm:space-y-12 animate-fade-in">
                    <Card className="!bg-[#0d0d0d] border-orange-500/20 !p-3 sm:!p-8 !rounded-2xl sm:!rounded-[3rem] shadow-2xl relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-8 border-b border-white/5 pb-4 gap-3">
                            <h3 className="text-lg sm:text-2xl font-hindi font-black text-white">{editingProduct ? 'Edit Product ✏️' : 'Add New Product ➕'}</h3>
                            <div className="flex bg-black p-1 sm:p-2 rounded-xl sm:rounded-2xl border border-white/10 w-full sm:w-auto shadow-inner">
                                <button type="button" onClick={() => handleTypeChange('PHYSICAL')} className={`flex-1 px-4 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[9px] sm:text-[11px] font-black transition-all duration-300 ${pType === 'PHYSICAL' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>PHYSICAL</button>
                                <button type="button" onClick={() => handleTypeChange('DIGITAL')} className={`flex-1 px-4 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[9px] sm:text-[11px] font-black transition-all duration-300 ${pType === 'DIGITAL' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>DIGITAL</button>
                            </div>
                        </div>
                        <form onSubmit={handleSaveProduct} className="grid md:grid-cols-2 gap-4 sm:gap-10">
                            <div className="space-y-3 sm:space-y-5">
                                <div><label className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase ml-1 mb-1 block">Product Name</label><input placeholder="Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-black/50 p-2.5 sm:p-4 rounded-xl border border-white/10 text-white text-xs sm:text-base focus:border-orange-500 outline-none" required /></div>
                                <div><label className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase ml-1 mb-1 block">Description</label><textarea placeholder="Description..." value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full bg-black/50 p-2.5 sm:p-4 rounded-xl border border-white/10 text-white h-20 sm:h-24 outline-none resize-none text-xs sm:text-base" required /></div>
                                <div className="grid grid-cols-2 gap-2 sm:gap-4"><div><label className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase ml-1 mb-1 block">MRP ₹</label><input type="number" value={newProduct.mrp || ''} onChange={e => setNewProduct({...newProduct, mrp: Number(e.target.value)})} className="w-full bg-black/50 p-2.5 sm:p-4 rounded-xl border border-white/10 text-white text-xs sm:text-base" required /></div><div><label className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase ml-1 mb-1 block">Discount %</label><input type="number" value={newProduct.discountPercentage || ''} onChange={e => setNewProduct({...newProduct, discountPercentage: Number(e.target.value)})} className="w-full bg-black/50 p-2.5 sm:p-4 rounded-xl border border-white/10 text-white text-xs sm:text-base" /></div></div>
                                {pType === 'PHYSICAL' ? (
                                    <div className="grid grid-cols-2 gap-2 sm:gap-4 animate-slide-in">
                                        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                                            <label className="text-[9px] font-black text-gray-400 uppercase ml-1 mb-2 block">Sizes</label>
                                            <input placeholder="S, M, L" value={sizeInput} onChange={e => setSizeInput(e.target.value)} className="w-full bg-black/50 p-2.5 rounded-lg border border-white/10 text-white text-xs outline-none focus:border-orange-500" />
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                                            <label className="text-[9px] font-black text-gray-400 uppercase ml-1 mb-2 block">Colors</label>
                                            <input placeholder="Red, Blue" value={colorInput} onChange={e => setColorInput(e.target.value)} className="w-full bg-black/50 p-2.5 rounded-lg border border-white/10 text-white text-xs outline-none focus:border-orange-500" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="animate-fade-in space-y-4"><div><label className="text-[9px] font-black text-blue-400 uppercase ml-1 mb-1 block">Drive Link</label><input placeholder="PDF Link..." value={newProduct.googleDriveLink} onChange={e => setNewProduct({...newProduct, googleDriveLink: e.target.value})} className="w-full bg-blue-900/10 p-2.5 sm:p-4 rounded-xl border border-blue-500/30 text-white text-xs font-mono" required={pType === 'DIGITAL'} /></div></div>
                                )}
                            </div>
                            <div className="space-y-3 sm:space-y-5">
                                <div className="bg-orange-500/5 p-3 sm:p-5 rounded-2xl border border-orange-500/10 relative">
                                    <label className="text-[9px] font-black text-orange-400 uppercase mb-2 block">YouTube Link</label>
                                    <input placeholder="Link..." value={newProduct.reviewVideoUrl} onChange={e => setNewProduct({...newProduct, reviewVideoUrl: e.target.value})} className="w-full bg-black p-2.5 sm:p-4 rounded-xl border border-white/10 text-white outline-none font-mono text-[10px] sm:text-xs" />
                                    {ytThumbOptions.length > 0 && (
                                        <div className="mt-3 animate-fade-in">
                                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                                {ytThumbOptions.map((thumb, idx) => (
                                                    <button key={idx} type="button" onClick={() => setNewProduct({...newProduct, imageUrl1: thumb})} className={`w-24 sm:w-32 aspect-[9/16] rounded-xl border-2 flex-shrink-0 overflow-hidden shadow-lg transition-all ${newProduct.imageUrl1 === thumb ? 'border-orange-500 scale-105' : 'border-white/10'}`}>
                                                        <img src={thumb} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3 items-center"><div className="flex-grow"><label className="text-[9px] font-black text-gray-500 uppercase ml-1 mb-1 block">Image URL</label><input placeholder="Image Link" value={newProduct.imageUrl1} onChange={e => setNewProduct({...newProduct, imageUrl1: e.target.value})} className="w-full bg-black/50 p-2.5 sm:p-4 rounded-xl border border-white/10 text-white text-xs" required /></div>{newProduct.imageUrl1 && <div className="w-16 sm:w-24 aspect-[9/16] rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-black shadow-xl"><img src={newProduct.imageUrl1} className="w-full h-full object-cover" alt="Preview" /></div>}</div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-500 uppercase ml-1 mb-1 block">Category</label>
                                    <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value as any})} className="w-full bg-black/50 p-2.5 sm:p-4 rounded-xl border border-white/10 text-white outline-none text-xs sm:text-sm">
                                        <option value="Pujan Samagri">Pujan Samagri</option>
                                        <option value="Tantra Mantra Yantra E-book">Digital E-books</option>
                                        <option value="Gems & Jewelry">Gems & Jewelry</option>
                                        <option value="Mobile Accessories">Mobile Accessories</option>
                                        <option value="Shoes">Shoes</option>
                                        <option value="Accessories">Accessories</option>
                                        <option value="Computer Course">Computer Course</option>
                                        <option value="Mobile Repairing Course">Mobile Repairing</option>
                                        <option value="Skill Learning">Skill Learning</option>
                                        <option value="Business Motivation">Business Motivation</option>
                                        <option value="Audio Story">Audio Story</option>
                                    </select>
                                </div>
                                <div className="flex gap-2 sm:gap-4 pt-2 sm:pt-4"><button type="submit" disabled={isUploading} className="flex-grow py-3 sm:py-5 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-[10px] sm:text-sm">{isUploading ? '...' : editingProduct ? 'UPDATE' : 'PUBLISH'}</button>{editingProduct && <button type="button" onClick={() => resetForm()} className="px-4 sm:px-8 py-3 sm:py-5 bg-white/5 border border-white/10 rounded-2xl text-gray-400 font-bold uppercase text-[10px] sm:text-xs">CANCEL</button>}</div>
                            </div>
                        </form>
                    </Card>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">{liveItems.map(p => (<Card key={p.id} className={`flex flex-col bg-black/60 border-white/5 p-3 sm:p-4 rounded-[1.5rem] transition-all relative overflow-hidden group ${p.isHidden ? 'opacity-40 grayscale' : ''}`}><div className="w-full aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-white/10 mb-3 relative flex items-center justify-center p-1"><img src={p.imageUrl1} className="w-full h-full object-cover rounded-xl" alt={p.name} /></div><div className="flex-grow min-w-0"><h4 className="font-bold text-white truncate text-xs">{p.name}</h4><p className="text-sm font-black text-pink-500 mt-1">₹{p.mrp}</p><div className="flex flex-wrap gap-2 mt-3"><button type="button" onClick={() => handleEditClick(p)} className="text-[9px] font-black text-blue-400 uppercase">Edit</button><button type="button" onClick={() => updateFirestoreProduct(p.id, { ...p, isHidden: !p.isHidden }).then(() => { if(loadProducts) loadProducts(); })} className={`text-[9px] font-black uppercase ${p.isHidden ? 'text-green-400' : 'text-orange-400'}`}>{p.isHidden ? 'Show' : 'Hide'}</button><button type="button" onClick={() => { if(confirm("Del?")) updateFirestoreProduct(p.id, { ...p, isDeleted: true }).then(() => { if(loadProducts) loadProducts(); }); }} className="text-[9px] font-black text-red-500 uppercase">Bin</button></div></div></Card>))}</div>
                </div>
            )}

            {activeTab === 'orders' && (
                <div className="space-y-6 animate-fade-in">
                    <h3 className="text-2xl font-hindi font-black text-white px-2">Global Running Orders</h3>
                    {activeGlobalOrders.length === 0 ? <p className="text-gray-500 px-4">कोई रनिंग ऑर्डर नहीं है।</p> : (
                        <div className="space-y-4">
                            {activeGlobalOrders.map(order => (
                                <OrderCardItem key={order.id} order={order} expandedOrderId={expandedOrderId} setExpandedOrderId={setExpandedOrderId} handleOrderStatusUpdate={handleOrderStatusUpdate} openTrackingModal={openTrackingModal} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="space-y-6 animate-fade-in">
                    <h3 className="text-2xl font-hindi font-black text-white px-2">Global History</h3>
                    {historyGlobalOrders.length === 0 ? <p className="text-gray-500 px-4">इतिहास खाली है।</p> : (
                        <div className="space-y-4">
                            {historyGlobalOrders.map(order => (
                                <OrderCardItem key={order.id} order={order} expandedOrderId={expandedOrderId} setExpandedOrderId={setExpandedOrderId} handleOrderStatusUpdate={handleOrderStatusUpdate} openTrackingModal={openTrackingModal} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'analytics' && (
                <div className="space-y-6 animate-fade-in">
                    <h3 className="text-2xl font-hindi font-black text-white px-2">सेल्स रिपोर्ट</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(salesData).map(([month, amount]) => (
                            <div key={month} className="bg-gradient-to-br from-gray-900 to-black border border-white/10 p-6 rounded-3xl shadow-xl flex flex-col justify-between h-40 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
                                <div>
                                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Revenue</p>
                                    <h4 className="text-2xl font-bold text-white mt-1">{month}</h4>
                                </div>
                                <div><p className="text-4xl font-black text-green-400">₹{new Intl.NumberFormat('en-IN').format(amount as number)}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'verifications' && (
                <div className="space-y-6 animate-fade-in">
                    <h3 className="text-2xl font-hindi font-black text-white px-2">Pending Approvals</h3>
                    {pendingVerifications.length === 0 ? <p className="text-gray-500 text-center py-10">All clear!</p> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingVerifications.map(req => (
                                <div key={req.id} className="bg-gray-900 border border-orange-500/30 rounded-3xl overflow-hidden flex flex-col">
                                    <div className="h-40 bg-black flex items-center justify-center border-b border-white/10 relative group">{req.screenshotDataUrl ? <img src={req.screenshotDataUrl} className="h-full w-full object-contain" alt="Proof" /> : <span className="text-gray-600">No Image</span>}<div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><a href={req.screenshotDataUrl} target="_blank" className="text-white font-bold underline">View Proof</a></div></div>
                                    <div className="p-5 flex-grow">
                                        <div className="flex justify-between items-start mb-2"><h4 className="font-bold text-white text-lg">{req.userName}</h4><span className="text-green-400 font-black">₹{req.planPrice}</span></div>
                                        <p className="text-xs text-gray-400 mb-1">Type: {req.type}</p>
                                        <p className="text-xs text-white font-mono bg-white/5 p-1 rounded inline-block mb-2">Txn: {req.transactionId}</p>
                                        {req.orderId && <p className="text-[10px] text-blue-300">Link Order: #{req.orderId.slice(-6)}</p>}
                                    </div>
                                    <div className="p-4 bg-white/5 border-t border-white/10 flex gap-2">
                                        <button onClick={() => onApproveVerification(req.id)} className="flex-grow bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-xl text-xs uppercase shadow-lg">Approve & Process</button>
                                        <a href={`https://wa.me/${req.userPhone}`} target="_blank" className="bg-green-800 text-white p-2 rounded-xl">💬</a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'users' && (
                <div className="space-y-6 animate-fade-in">
                    <h3 className="text-2xl font-hindi font-black text-white px-2">पंजीकृत ग्राहक ({allUsers.length})</h3>
                    <div className="overflow-x-auto bg-white/5 border border-white/10 rounded-2xl">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-black/40 text-xs uppercase font-black text-white">
                                <tr>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Contact</th>
                                    <th className="p-4">Plan</th>
                                    <th className="p-4">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allUsers.map(user => (
                                    <tr key={user.uid} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-bold text-white">{user.name}</td>
                                        <td className="p-4"><div>{user.email}</div><div className="text-xs text-gray-500">{user.phone}</div></td>
                                        <td className="p-4">{user.isPremium ? <span className="text-yellow-400 font-bold">Premium</span> : 'Free'}</td>
                                        <td className="p-4 text-xs">{new Date(user.signupDate || '').toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'support' && (
                <div className="space-y-6 animate-fade-in">
                    <h3 className="text-2xl font-hindi font-black text-white px-2">ग्राहक सहायता टिकट ({supportTickets.filter(t => t.status === 'Open').length} Open)</h3>
                    <div className="grid gap-4">
                        {supportTickets.map(ticket => (
                            <div key={ticket.id} className={`p-6 rounded-2xl border ${ticket.status === 'Open' ? 'bg-red-900/10 border-red-500/30' : (ticket.status === 'Refunded' ? 'bg-purple-900/10 border-purple-500/30' : 'bg-green-900/10 border-green-500/30')} flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${ticket.status === 'Open' ? 'bg-red-500 text-white' : (ticket.status === 'Refunded' ? 'bg-purple-500 text-white' : 'bg-green-500 text-white')}`}>{ticket.status}</span>
                                        <span className="text-gray-400 text-xs font-mono">#{ticket.id.slice(-6)}</span>
                                        <span className="text-gray-500 text-xs">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="text-lg font-bold text-white">{ticket.category}</h4>
                                    <p className="text-sm text-gray-300 mt-1 mb-2">{ticket.description}</p>
                                    {ticket.bankDetails && (
                                        <div className="bg-black/40 p-3 rounded-lg border border-red-500/30 mt-2">
                                            <p className="text-[10px] text-gray-300">Target Order: <span className="text-yellow-400 font-bold">{ticket.refundOrderId}</span></p>
                                            <p className="text-[10px] text-gray-300">Name: <span className="text-white">{ticket.bankDetails.accountHolderName}</span></p>
                                            <p className="text-[10px] text-gray-300">Bank: <span className="text-white">{ticket.bankDetails.bankName}</span></p>
                                            <p className="text-[10px] text-gray-300">A/C: <span className="text-white font-mono">{ticket.bankDetails.accountNumber}</span></p>
                                            <p className="text-[10px] text-gray-300">IFSC: <span className="text-white font-mono">{ticket.bankDetails.ifscCode}</span></p>
                                        </div>
                                    )}
                                    <p className="text-xs text-blue-300 font-bold">{ticket.userName} • {ticket.userPhone}</p>
                                </div>
                                <div className="flex gap-2">
                                    <a href={`https://wa.me/${ticket.userPhone}`} target="_blank" className="px-4 py-2 bg-green-700 text-white text-xs font-bold rounded-xl uppercase">WhatsApp</a>
                                    {ticket.status !== 'Refunded' && <button onClick={() => handleTicketStatus(ticket)} className="px-4 py-2 text-xs font-bold rounded-xl uppercase border border-white/20 text-white">{ticket.status === 'Open' ? 'Mark Closed' : 'Re-open'}</button>}
                                    {ticket.category.includes('Refund') && ticket.status !== 'Refunded' && <button onClick={(e) => handleMarkRefunded(e, ticket)} className="px-4 py-2 bg-yellow-600 text-black text-xs font-bold rounded-xl uppercase">Confirm Refund</button>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'social' && (
                <div className="space-y-8 animate-fade-in">
                    <Card className="!bg-black/40 border-purple-500/20 p-6 rounded-[2rem]">
                        <h3 className="text-xl font-hindi font-black text-white mb-6">नई पोस्ट बनाएं 📢</h3>
                        <form onSubmit={handleSocialPostSubmit} className="space-y-4">
                            <textarea value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder="Write something amazing..." className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white h-24 focus:border-purple-500 outline-none" />
                            <div className="flex gap-4 items-center">
                                <div className="flex-grow"><input type="text" value={newPostImage} onChange={(e) => setNewPostImage(e.target.value)} placeholder="Image URL (optional)" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm outline-none" /></div>
                                <button type="button" onClick={() => galleryInputRef.current?.click()} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-purple-300 font-bold text-xs">Upload 📤</button>
                                <input type="file" ref={galleryInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                            </div>
                            <button type="submit" disabled={isPosting || !newPostContent} className="w-full py-4 bg-purple-600 text-white font-black rounded-xl uppercase shadow-lg disabled:opacity-50">{isPosting ? 'Posting...' : 'Publish Post 🚀'}</button>
                        </form>
                    </Card>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {socialMediaPosts.map(post => (
                            <div key={post.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4">
                                {post.imageUrl && <img src={post.imageUrl} className="w-24 h-24 object-cover rounded-xl bg-black" alt="Post" />}
                                <div className="flex-grow">
                                    <p className="text-white text-sm mb-2 line-clamp-3">{post.content}</p>
                                    <div className="flex justify-between items-end"><p className="text-[10px] text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p><button onClick={() => onDeletePost(post.id)} className="text-red-400 text-xs font-bold uppercase">Delete</button></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'bin' && (
                <div className="space-y-6 animate-fade-in">
                    <h3 className="text-2xl font-hindi font-black text-white px-2">Recycle Bin ({binItems.length})</h3>
                    {binItems.length === 0 ? <p className="text-gray-500 text-center py-10">Bin is empty.</p> : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {binItems.map(p => (
                                <Card key={p.id} className="flex flex-col bg-red-900/10 border-red-500/20 p-4 rounded-[2rem] opacity-75 grayscale hover:grayscale-0 transition-all">
                                    <div className="w-full aspect-[9/16] rounded-2xl overflow-hidden bg-black mb-3"><img src={p.imageUrl1} className="w-full h-full object-cover" alt={p.name} /></div>
                                    <h4 className="font-bold text-white truncate text-xs">{p.name}</h4>
                                    <div className="flex flex-col gap-2 mt-3">
                                        <button onClick={() => handleRestoreProduct(p)} className="text-[9px] font-black uppercase bg-green-600 text-white py-1 rounded w-full">Restore</button>
                                        <button onClick={() => handlePermanentDelete(p)} className="text-[9px] font-black uppercase bg-red-600 text-white py-1 rounded w-full">Delete Forever</button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {trackingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-gray-900 border border-white/20 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative">
                        <button onClick={() => setTrackingModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
                        <h3 className="text-xl font-bold text-white mb-6 font-hindi">शिपिंग ट्रैकिंग डालें</h3>
                        <div className="space-y-4">
                            <div><label className="text-xs text-gray-400 block mb-1">कूरियर कंपनी</label><input value={courierInput} onChange={(e) => setCourierInput(e.target.value)} placeholder="Ex: Delhivery" className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-white outline-none" /></div>
                            <div><label className="text-xs text-gray-400 block mb-1">ट्रैकिंग नंबर</label><input value={trackingIdInput} onChange={(e) => setTrackingIdInput(e.target.value)} placeholder="Ex: 1234567890" className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-white font-mono outline-none" /></div>
                            <button type="button" onClick={() => submitTracking()} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl mt-2">Save & Mark Shipped 🚚</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
