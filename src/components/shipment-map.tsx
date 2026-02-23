'use client';

import { useEffect, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';

interface ShipmentMapProps {
  latitude: number;
  longitude: number;
  shipmentCode: string;
}

export function ShipmentMap({ latitude, longitude, shipmentCode }: ShipmentMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Importar Leaflet dinamicamente (client-side only)
    if (typeof window !== 'undefined' && containerRef.current) {
      import('leaflet').then((L) => {
        // @ts-expect-error - CSS module import has no type declarations
        import('leaflet/dist/leaflet.css');

        try {
          // Limpar qualquer mapa existente no container
          if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
          }

          // Verificar se o container já tem um mapa Leaflet
          const container = containerRef.current;
          if (!container) return;

          if ((container as HTMLDivElement & { _leaflet_id?: unknown })._leaflet_id) {
            // Container já tem um mapa, remover
            delete (container as HTMLDivElement & { _leaflet_id?: unknown })._leaflet_id;
          }

          // Criar novo mapa
          const newMap = L.map(container).setView([latitude, longitude], 13);

        // Adicionar camada do OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(newMap);

        // Criar ícone customizado para o marcador
        const boatIcon = L.divIcon({
          className: 'custom-boat-marker',
          html: `
            <div style="
              background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
              width: 40px;
              height: 40px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid white;
              box-shadow: 0 4px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <svg style="transform: rotate(45deg); width: 20px; height: 20px; fill: white;" viewBox="0 0 24 24">
                <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v-2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.32-.42-.58-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.46.26-.58.5s-.15.52-.06.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z"/>
              </svg>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40],
        });

        // Adicionar marcador
        const marker = L.marker([latitude, longitude], { icon: boatIcon }).addTo(newMap);

        // Adicionar popup
        marker.bindPopup(`
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1e40af;">🚢 Encomenda em Trânsito</h3>
            <p style="margin: 0 0 4px 0;"><strong>Código:</strong> ${shipmentCode}</p>
            <p style="margin: 0 0 4px 0;"><strong>Localização:</strong></p>
            <p style="margin: 0; font-family: monospace; font-size: 12px; color: #4b5563;">
              ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
            </p>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">
              📡 Atualizado em tempo real
            </p>
          </div>
        `).openPopup();

          // Adicionar círculo de precisão
          L.circle([latitude, longitude], {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            radius: 500, // 500 metros de raio
          }).addTo(newMap);

          mapRef.current = newMap;
        } catch (error: unknown) {
          // Silenciar erro de "Map container is already initialized"
          if ((error as { message?: string }).message?.includes('Map container is already initialized')) {
            console.log('Mapa já inicializado, ignorando...');
          } else {
            console.error('Erro ao inicializar mapa:', error);
          }
        }
      });
    }

    // Cleanup ao desmontar
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude]);

  return (
    <div ref={containerRef} className="w-full h-80 z-0" />
  );
}
