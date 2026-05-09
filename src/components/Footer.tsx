import { Link, useLocation } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Github, Mail, Phone, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Footer() {
  const { profile } = useAuth();
  const location = useLocation();
  const isAuth = location.pathname === '/auth';

  if (isAuth) return null;

  return (
    <footer className="bg-white text-gray-900 pt-32 pb-16 overflow-hidden relative border-t border-gray-100">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          {/* Brand Info */}
          <div className="space-y-10">
            <Link to="/" className="flex items-center space-x-4 group">
              <div className="w-14 h-14 bg-brand rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-all duration-500 shadow-2xl shadow-brand/20">
                 <span className="text-white font-black text-3xl italic mt-0.5">A</span>
              </div>
              <span className="text-3xl font-black tracking-tighter text-gray-900 italic uppercase">Awaa Express</span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed font-medium italic pr-8">
              Transforming the way you eat. We bring the city's finest kitchens directly to your doorstep with unmatched speed and care.
            </p>
            <div className="flex gap-4">
              <SocialIcon icon={Facebook} />
              <SocialIcon icon={Twitter} />
              <SocialIcon icon={Instagram} />
              <SocialIcon icon={Github} />
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col">
            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.4em] mb-10 opacity-30">Navigation</h4>
            <ul className="space-y-6 text-gray-600 text-[11px] font-black uppercase tracking-[0.2em]">
              <li><Link to="/" className="hover:text-brand transition-all hover:translate-x-1 inline-block">Discover</Link></li>
              <li><Link to="/orders" className="hover:text-brand transition-all hover:translate-x-1 inline-block">Your Orders</Link></li>
              <li><Link to="/profile" className="hover:text-brand transition-all hover:translate-x-1 inline-block">Account</Link></li>
              {!profile?.isDriver && (
                <li><Link to="/profile" className="text-brand hover:underline transition-all hover:translate-x-1 inline-block">Become a Courier</Link></li>
              )}
              {profile?.isDriver && (
                <li><Link to="/driver" className="hover:text-brand transition-all hover:translate-x-1 inline-block text-brand">Driver Logistics</Link></li>
              )}
              {profile?.isAdmin && (
                <li><Link to="/admin" className="hover:text-brand transition-all hover:translate-x-1 inline-block text-emerald-500">Admin Console</Link></li>
              )}
            </ul>
          </div>

          {/* Support */}
          <div className="flex flex-col">
            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.4em] mb-10 opacity-30">Resources</h4>
            <ul className="space-y-6 text-gray-600 text-[11px] font-black uppercase tracking-[0.2em]">
              <li><a href="#" className="hover:text-brand transition-all hover:translate-x-1 inline-block">Help Center</a></li>
              <li><a href="#" className="hover:text-brand transition-all hover:translate-x-1 inline-block">Partners</a></li>
              <li><a href="#" className="hover:text-brand transition-all hover:translate-x-1 inline-block">Privacy Policies</a></li>
              <li><a href="#" className="hover:text-brand transition-all hover:translate-x-1 inline-block">Terms of Service</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col">
            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.4em] mb-10 opacity-30">Get In Touch</h4>
            <ul className="space-y-8">
              <li className="flex items-start space-x-5 group">
                <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-brand group-hover:text-white transition-all border border-gray-100">
                  <MapPin className="w-5 h-5 shrink-0" />
                </div>
                <div>
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Global HQ</p>
                   <span className="text-gray-700 text-sm font-medium">123 Delivery Lane, Food City, FC 12345</span>
                </div>
              </li>
              <li className="flex items-start space-x-5 group">
                <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-brand group-hover:text-white transition-all border border-gray-100">
                  <Mail className="w-5 h-5 shrink-0" />
                </div>
                <div>
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Support</p>
                   <span className="text-gray-700 text-sm font-medium">concierge@awaaexpress.com</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-16 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center space-x-8 text-[9px] font-black text-gray-300 uppercase tracking-[0.5em]">
            <span>© {new Date().getFullYear()} Awaa Express Inc.</span>
            <span className="hidden sm:inline">Crafted with Excellence</span>
          </div>
          <div className="flex space-x-10 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            <a href="#" className="hover:text-brand transition-colors">Availability</a>
            <a href="#" className="hover:text-brand transition-colors">Cookie Settings</a>
            <a href="#" className="hover:text-brand transition-colors">Legal Disclosure</a>
          </div>
        </div>
      </div>
      
      {/* Decorative Aura */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/3 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/3 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand/3 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/4" />
    </footer>
  );
}

function SocialIcon({ icon: Icon }: { icon: any }) {
  return (
    <a 
      href="#" 
      className="w-11 h-11 rounded-2xl bg-white/[0.02] flex items-center justify-center text-gray-500 hover:bg-brand hover:text-white transition-all transform hover:-translate-y-1 ring-1 ring-white/5 shadow-2xl"
    >
      <Icon className="w-5 h-5" />
    </a>
  );
}
