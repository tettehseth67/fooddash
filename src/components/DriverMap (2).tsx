import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { Order } from '../types';
import { Navigation as NavIcon, MapPin, Package, User } from 'lucide-react';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface DriverMapProps {
  availableOrders: Order[];
  activeOrders: Order[];
}

interface MarkerWithInfoProps {
  position: { lat: number, lng: number };
  title: string;
  type: 'pickup' | 'delivery' | 'driver';
  order?: Order;
}

const MarkerWithInfo: React.FC<MarkerWithInfoProps> = ({ position, title, type, order }) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoWindowShown, setInfoWindowShown] = useState(false);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={position}
        onClick={() => setInfoWindowShown(true)}
      >
        <Pin 
          background={type === 'driver' ? '#10b981' : type === 'pickup' ? '#ff4b33' : '#3b82f6'} 
          glyphColor="#fff"
        >
          {type === 'driver' ? <User className="w-4 h-4 text-white" /> : type === 'pickup' ? <MapPin className="w-4 h-4 text-white" /> : <Package className="w-4 h-4 text-white" />}
        </Pin>
      </AdvancedMarker>
      {infoWindowShown && (
        <InfoWindow anchor={marker} onCloseClick={() => setInfoWindowShown(false)}>
          <div className="p-2 min-w-[150px]">
             <h4 className="font-black uppercase italic tracking-tighter text-[12px] mb-1">{title}</h4>
             <p className="text-[10px] text-gray-500 uppercase tracking-widest">{type === 'pickup' ? 'Pick-up Point' : type === 'delivery' ? 'Customer Destination' : 'Your Location'}</p>
             {order && (
               <div className="mt-2 pt-2 border-t border-gray-100">
                 <p className="text-[9px] font-bold text-brand uppercase">Order #{order.id.slice(-6).toUpperCase()}</p>
               </div>
             )}
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export function DriverMap({ availableOrders, activeOrders }: DriverMapProps) {
  const [driverPos, setDriverPos] = useState({ lat: 5.6037, lng: -0.1870 }); // Default Accra center

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setDriverPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.error("Geolocation error:", err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  if (!hasValidKey) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-[2.5rem] flex items-center justify-center border border-dashed border-gray-200 p-8 text-center">
        <div>
          <h2 className="text-xl font-black uppercase italic tracking-tighter mb-4">Google Maps API Key Required</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 max-w-sm mx-auto mb-6">
            Please add GOOGLE_MAPS_PLATFORM_KEY to your Secrets in Settings to enable the live marketplace map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border-4 border-white">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={driverPos}
          defaultZoom={13}
          mapId="DRIVER_DASHBOARD_MAP"
          disableDefaultUI={true}
          zoomControl={true}
          gestureHandling={'greedy'}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Driver Position */}
          <MarkerWithInfo 
            position={driverPos} 
            title="You" 
            type="driver" 
          />

          {/* Available Jobs (Pickups) */}
          {availableOrders.map(order => (
            order.restaurantLat && order.restaurantLng && (
              <MarkerWithInfo 
                key={`avail-${order.id}`}
                position={{ lat: order.restaurantLat, lng: order.restaurantLng }}
                title={order.restaurantName || "Restaurant"}
                type="pickup"
                order={order}
              />
            )
          ))}

          {/* Active Jobs (Delivery points) */}
          {activeOrders.map(order => (
            <React.Fragment key={`active-group-${order.id}`}>
               {order.restaurantLat && order.restaurantLng && order.status === 'assigned' && (
                 <MarkerWithInfo 
                   position={{ lat: order.restaurantLat, lng: order.restaurantLng }}
                   title={`Pickup: ${order.restaurantName}`}
                   type="pickup"
                   order={order}
                 />
               )}
               {order.lat && order.lng && order.status === 'delivering' && (
                 <MarkerWithInfo 
                   position={{ lat: order.lat, lng: order.lng }}
                   title="Delivery point"
                   type="delivery"
                   order={order}
                 />
               )}
            </React.Fragment>
          ))}
        </Map>
      </APIProvider>
      <div className="absolute top-6 left-6 z-10 bg-[#191919]/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
         <p className="text-[8px] font-black uppercase tracking-widest text-brand flex items-center gap-2">
           <div className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
           Live Logistics Feed
         </p>
      </div>
    </div>
  );
}
