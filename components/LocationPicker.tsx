"use client";

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet default icon issues in Next.js
const markerIcon = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const markerShadow = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  initialPos: { lat: number; lng: number };
  onLocationSelect: (lat: number, lng: number) => void;
}

export default function LocationPicker({ initialPos, onLocationSelect }: LocationPickerProps) {
  const [position, setPosition] = useState(initialPos);

  function LocationMarker() {
    useMapEvents({
      click(e) {
        setPosition(e.latlng);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      },
    });

    return (
      <Marker
        position={position}
        draggable={true}
        eventHandlers={{
          dragend: (e: any) => {
            const marker = e.target;
            const pos = marker.getLatLng();
            setPosition(pos);
            onLocationSelect(pos.lat, pos.lng);
          },
        }}
      />
    );
  }

  return (
    <div style={{ height: '300px', width: '100%', position: 'relative', zIndex: 1, borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
      <MapContainer
        center={initialPos}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        />
        <LocationMarker />
      </MapContainer>
    </div>
  );
}
