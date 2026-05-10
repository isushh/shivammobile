"use client";

import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

const markerIcon = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const markerShadow = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const ShopIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/610/610365.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface StaffTrackerMapProps {
  shopLoc: { lat: number; lng: number };
  staffAttendance: any[];
}

export default function StaffTrackerMap({ shopLoc, staffAttendance }: StaffTrackerMapProps) {
  return (
    <div style={{ height: '350px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
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
        <Marker position={[shopLoc.lat, shopLoc.lng]} icon={ShopIcon}>
          <Popup>Shivam Mobile Care (Fixed)</Popup>
        </Marker>

        {/* 1km Geofence */}
        <Circle 
          center={[shopLoc.lat, shopLoc.lng]} 
          radius={1000} 
          pathOptions={{ color: '#2DD4BF', fillColor: '#2DD4BF', fillOpacity: 0.1 }} 
        />

        {/* Staff Attendance Markers */}
        {staffAttendance?.map((record, idx) => {
          if (!record.latitude || !record.longitude) return null;
          const name = record.profiles?.full_name || 'Staff Member';
          const isPunchIn = record.type === 'IN';

          return (
            <Marker key={idx} position={[record.latitude, record.longitude]}>
              <Popup>
                <div style={{ fontSize: '.75rem', minWidth: '120px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <b style={{ color: '#2DD4BF' }}>{name}</b>
                    <span style={{ 
                        fontSize: '.6rem', 
                        padding: '1px 4px', 
                        borderRadius: '2px',
                        background: isPunchIn ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: isPunchIn ? '#10b981' : '#f59e0b',
                        fontWeight: 'bold'
                    }}>
                        {record.type}
                    </span>
                  </div>
                  <div style={{ color: '#888' }}>
                    Time: {new Date(record.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ color: '#888', textTransform: 'capitalize' }}>
                    Status: {record.status || 'Active'}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
