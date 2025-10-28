import { useEffect, useState } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  TrafficLayer,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";

interface Gasto {
  id: string;
  categoria: string;
  monto: number;
  empresa: string;
  estatus: string;
  geo?: { lat: number; lng: number };
}

interface Props {
  gastos: Gasto[];
  origen?: { lat: number; lng: number };
  destino?: { lat: number; lng: number };
}

const containerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "12px",
};

export default function MapaGoogle({ gastos, destino }: Props) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, // ⚠️ usa tu .env
  });

  const [selected, setSelected] = useState<Gasto | null>(null);
  const [directions] = useState<any>(null);

  useEffect(() => {
  
  }, [isLoaded]);

  if (!isLoaded)
    return <p style={{ textAlign: "center" }}>Cargando mapa de Google...</p>;

  const center =
    gastos.length > 0 && gastos[0].geo
      ? gastos[0].geo
      : destino || { lat: 19.4326, lng: -99.1332 };

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={6}
      options={{
        mapTypeId: "roadmap",
        streetViewControl: false,
        mapTypeControl: true,
      }}
    >
      <TrafficLayer />

      {/* Ruta entre origen y destino */}
      {directions && <DirectionsRenderer directions={directions} />}

      {/* Marcadores de gastos */}
      {gastos.map(
        (g) =>
          g.geo && (
            <Marker
              key={g.id}
              position={g.geo}
              label={g.categoria[0]}
              onClick={() => setSelected(g)}
            />
          )
      )}

      {/* InfoWindow al hacer clic */}
      {selected && (
        <InfoWindow
          position={selected.geo}
          onCloseClick={() => setSelected(null)}
        >
          <div>
            <strong>{selected.categoria}</strong>
            <br />
            Empresa: {selected.empresa}
            <br />
            Monto: ${selected.monto}
            <br />
            Estado: {selected.estatus}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
