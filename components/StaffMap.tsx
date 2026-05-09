"use client";

import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

const markerIcon = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const markerShadow = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

// Custom icons
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface StaffMapProps {
  staffLoc: { lat: number; lng: number } | null;
  shopLoc: { lat: number; lng: number };
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 16);
  }, [center, map]);
  return null;
}

export default function StaffMap({ staffLoc, shopLoc }: StaffMapProps) {
  return (
    <div style={{ height: '250px', width: '100%', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
      <MapContainer 
        center={[shopLoc.lat, shopLoc.lng]} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        />
        
        {/* Shop Marker */}
        <Marker position={[shopLoc.lat, shopLoc.lng]}>
          <Popup>Shivam Mobile Care (Shop)</Popup>
        </Marker>

        {/* 1km Geofence Circle */}
        <Circle 
          center={[shopLoc.lat, shopLoc.lng]} 
          radius={1000} 
          pathOptions={{ color: '#2DD4BF', fillColor: '#2DD4BF', fillOpacity: 0.1 }} 
        />

        {/* Staff Marker */}
        {staffLoc && (
          <>
            <Marker position={[staffLoc.lat, staffLoc.lng]}>
              <Popup>You Are Here</Popup>
            </Marker>
            <ChangeView center={[staffLoc.lat, staffLoc.lng]} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
