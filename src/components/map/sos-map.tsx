'use client';

import { useEffect, useRef } from 'react';
import type { SosAlert } from '@/types/safety';

interface SosMapProps {
  alerts: SosAlert[];
}

function parseAlertCoords(alert: SosAlert): { latitude: number; longitude: number } | null {
  if (alert.latitude && alert.longitude) {
    return { latitude: alert.latitude, longitude: alert.longitude };
  }
  if (alert.location) {
    try {
      const parsed = JSON.parse(alert.location);
      if (parsed.latitude && parsed.longitude) {
        return { latitude: parsed.latitude, longitude: parsed.longitude };
      }
    } catch {
      // location is a plain text description, not coordinates
    }
  }
  return null;
}

export function SosMap({ alerts }: SosMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    // Carregar Leaflet dinamicamente apenas no cliente
    import('leaflet').then((L) => {
      // Importar CSS do Leaflet
      // @ts-ignore
      import('leaflet/dist/leaflet.css');

      // Se já existe uma instância do mapa, removê-la
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Configurar ícones do Leaflet (fix para ícones padrão)
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Centro da Amazônia (Manaus aproximadamente)
      const center: [number, number] = [-3.1190, -60.0217];

      // Verificar se mapRef.current existe
      if (!mapRef.current) return;

      // Criar mapa
      const map = L.map(mapRef.current).setView(center, 11);

      // Adicionar camada de tiles (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Adicionar marcadores para cada alerta
      alerts.forEach((alert) => {
        const coords = parseAlertCoords(alert);
        if (coords) {
          // Criar ícone customizado baseado no status
          const iconColor = alert.status === 'active' ? 'red' : 'gray';

          const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `
              <div style="position: relative;">
                <div style="
                  width: 32px;
                  height: 32px;
                  background-color: ${iconColor};
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 16px;
                ">⚠️</div>
                ${alert.status === 'active' ? `
                  <div style="
                    position: absolute;
                    top: -4px;
                    left: -4px;
                    width: 40px;
                    height: 40px;
                    border: 2px solid ${iconColor};
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                  "></div>
                ` : ''}
              </div>
              <style>
                @keyframes pulse {
                  0% {
                    opacity: 1;
                    transform: scale(1);
                  }
                  100% {
                    opacity: 0;
                    transform: scale(1.5);
                  }
                }
              </style>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          const marker = L.marker([coords.latitude, coords.longitude], {
            icon: customIcon,
          }).addTo(map);

          // Popup com informações do alerta
          marker.bindPopup(`
            <div style="min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">
                ${alert.type === 'emergency' ? '🚨 Emergência' : '⚠️ Alerta'}
              </h3>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Usuário:</strong> ${alert.user.name}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Status:</strong>
                <span style="
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-size: 11px;
                  font-weight: bold;
                  background-color: ${alert.status === 'active' ? '#fee' : '#eee'};
                  color: ${alert.status === 'active' ? '#c00' : '#666'};
                ">
                  ${alert.status === 'active' ? 'Ativo' : 'Resolvido'}
                </span>
              </p>
              ${alert.description ? `<p style="margin: 4px 0; font-size: 12px; color: #666;">${alert.description}</p>` : ''}
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #999;">
                ${new Date(alert.createdAt).toLocaleString('pt-BR')}
              </p>
              ${alert.status === 'active' ? `
                <a href="tel:${alert.user.phone}" style="
                  display: inline-block;
                  margin-top: 8px;
                  padding: 6px 12px;
                  background-color: #e74c3c;
                  color: white;
                  text-decoration: none;
                  border-radius: 4px;
                  font-size: 12px;
                  font-weight: bold;
                ">📞 Ligar para ${alert.user.name}</a>
              ` : ''}
            </div>
          `);
        }
      });

      // Se houver alertas, ajustar o zoom para mostrar todos
      const alertsWithCoords = alerts.map(a => parseAlertCoords(a)).filter(Boolean) as { latitude: number; longitude: number }[];
      if (alertsWithCoords.length > 0) {
        const bounds = L.latLngBounds(
          alertsWithCoords.map(c => [c.latitude, c.longitude] as [number, number])
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }

      mapInstanceRef.current = map;
    });

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [alerts]);

  return (
    <div
      ref={mapRef}
      className="h-[500px] w-full rounded-lg border border-border shadow-sm"
      style={{ zIndex: 0 }}
    />
  );
}
