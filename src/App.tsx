import { FormEvent, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

type Screen = "register" | "parking" | "ticket";

type Vehicle = {
  plate: string;
  model: string;
  color: string;
};

type ParkingSpot = {
  id: string;
  occupied: boolean;
};

const blocks = ["A", "B", "C", "D"].map((block) => ({
  name: `Bloque ${block}`,
  spots: Array.from({ length: 8 }, (_, index): ParkingSpot => ({
    id: `${block}-${String(index + 1).padStart(2, "0")}`,
    occupied: [
      "A-02",
      "A-05",
      "A-08",
      "B-01",
      "B-04",
      "B-06",
      "C-03",
      "C-04",
      "C-07",
      "D-02",
      "D-05",
    ].includes(`${block}-${String(index + 1).padStart(2, "0")}`),
  })),
}));

const emptyVehicle: Vehicle = { plate: "", model: "", color: "" };

function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: "car" | "map" | "ticket" | "clock" | "arrow" | "check" | "logout" | "parking";
  size?: number;
  className?: string;
}) {
  const paths = {
    car: (
      <>
        <path d="m5 17-1 2v1h2v-2h12v2h2v-1l-1-2" />
        <path d="M3 13h18v5H3zM5 13l2-6h10l2 6M6.5 15.5h.01M17.5 15.5h.01" />
      </>
    ),
    map: (
      <>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15" />
      </>
    ),
    ticket: (
      <>
        <path d="M3 7a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-3a2 2 0 0 0 0-4z" />
        <path d="M13 5v2M13 10v4M13 17v2" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    arrow: <path d="m9 18 6-6-6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    logout: (
      <>
        <path d="M10 17l5-5-5-5M15 12H3M14 4h4a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-4" />
      </>
    ),
    parking: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="3" />
        <path d="M9 17V7h4a3 3 0 0 1 0 6H9M9 13h4" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width={size}
    >
      {paths[name]}
    </svg>
  );
}

function Header({ onReset }: { onReset: () => void }) {
  return (
    <header className="app-header">
      <button className="brand" onClick={onReset} type="button" aria-label="Volver al inicio">
        <img
          className="brand-logo"
          src="/assets/fcaei-logo.png"
          alt="Facultad de Contaduría, Administración e Informática"
        />
        <span className="brand-copy">
          <strong>Estacionamiento</strong>
          <small>Acceso vehicular universitario</small>
        </span>
      </button>
      <span className="uaem-label">UAEM</span>
    </header>
  );
}

function Progress({ screen }: { screen: Screen }) {
  const active = screen === "register" ? 1 : screen === "parking" ? 2 : 3;
  return (
    <div className="progress" aria-label={`Paso ${active} de 3`}>
      {[
        ["car", "Vehículo"],
        ["map", "Lugar"],
        ["ticket", "Ticket"],
      ].map(([icon, label], index) => (
        <div className={`progress-step ${active >= index + 1 ? "active" : ""}`} key={label}>
          <span className="progress-icon">
            <Icon name={icon as "car" | "map" | "ticket"} size={18} />
          </span>
          <span>{label}</span>
          {index < 2 && <i />}
        </div>
      ))}
    </div>
  );
}

function VehicleForm({
  value,
  onChange,
  onContinue,
}: {
  value: Vehicle;
  onChange: (vehicle: Vehicle) => void;
  onContinue: () => void;
}) {
  const [errors, setErrors] = useState<Partial<Vehicle>>({});

  function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Partial<Vehicle> = {};
    if (!/^[A-Z0-9-]{5,10}$/.test(value.plate)) nextErrors.plate = "Ingresa una placa válida";
    if (value.model.trim().length < 2) nextErrors.model = "Ingresa el modelo del vehículo";
    if (value.color.trim().length < 2) nextErrors.color = "Ingresa el color del vehículo";
    setErrors(nextErrors);
    if (!Object.keys(nextErrors).length) onContinue();
  }

  return (
    <section className="screen-card form-card">
      <div className="eyebrow">
        <span />
        ACCESO VEHICULAR
      </div>
      <h1>Registra tu vehículo</h1>
      <p className="lead">Captura los datos del vehículo que ingresará al estacionamiento.</p>

      <form onSubmit={submit}>
        <label>
          Placa
          <span className="input-shell">
            <Icon name="car" size={19} />
            <input
              autoCapitalize="characters"
              maxLength={10}
              onChange={(event) =>
                onChange({
                  ...value,
                  plate: event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""),
                })
              }
              placeholder="Ej. ABC-123"
              value={value.plate}
            />
          </span>
          {errors.plate && <small className="error">{errors.plate}</small>}
        </label>

        <div className="field-grid">
          <label>
            Modelo
            <span className="input-shell">
              <input
                onChange={(event) => onChange({ ...value, model: event.target.value })}
                placeholder="Ej. Nissan Versa"
                value={value.model}
              />
            </span>
            {errors.model && <small className="error">{errors.model}</small>}
          </label>
          <label>
            Color
            <span className="input-shell">
              <input
                onChange={(event) => onChange({ ...value, color: event.target.value })}
                placeholder="Ej. Blanco"
                value={value.color}
              />
            </span>
            {errors.color && <small className="error">{errors.color}</small>}
          </label>
        </div>

        <button className="primary-button" type="submit">
          Ver lugares disponibles
          <Icon name="arrow" size={19} />
        </button>
      </form>

      <div className="security-note">
        <Icon name="check" size={17} />
        <span>
          <strong>Acceso seguro</strong>
          Tus datos se utilizan únicamente durante tu estancia.
        </span>
      </div>
    </section>
  );
}

function ParkingMap({
  selected,
  onSelect,
  onContinue,
  onBack,
}: {
  selected: string;
  onSelect: (id: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const available = blocks.flatMap((block) => block.spots).filter((spot) => !spot.occupied).length;

  return (
    <section className="parking-screen">
      <div className="screen-heading">
        <div>
          <div className="eyebrow">
            <span />
            MAPA EN TIEMPO REAL
          </div>
          <h1>Selecciona un lugar</h1>
          <p className="lead">Elige cualquiera de los espacios disponibles.</p>
        </div>
        <div className="availability-pill">
          <strong>{available}</strong>
          <span>lugares disponibles</span>
        </div>
      </div>

      <div className="legend">
        <span>
          <i className="available-dot" /> Disponible
        </span>
        <span>
          <i className="occupied-dot" /> Ocupado
        </span>
        <span>
          <i className="selected-dot" /> Seleccionado
        </span>
      </div>

      <div className="parking-blocks">
        {blocks.map((block) => (
          <div className="parking-block" key={block.name}>
            <div className="block-header">
              <strong>{block.name}</strong>
              <span>{block.spots.filter((spot) => !spot.occupied).length} libres</span>
            </div>
            <div className="spots-grid">
              {block.spots.map((spot) => (
                <button
                  aria-label={`${spot.id}, ${spot.occupied ? "ocupado" : "disponible"}`}
                  className={`parking-spot ${spot.occupied ? "occupied" : ""} ${selected === spot.id ? "selected" : ""}`}
                  disabled={spot.occupied}
                  key={spot.id}
                  onClick={() => onSelect(spot.id)}
                  type="button"
                >
                  <Icon name="car" size={25} />
                  <span>{spot.id}</span>
                  {selected === spot.id && (
                    <b>
                      <Icon name="check" size={12} />
                    </b>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="map-actions">
        <button className="text-button" onClick={onBack} type="button">
          Volver
        </button>
        <button
          className="primary-button compact"
          disabled={!selected}
          onClick={onContinue}
          type="button"
        >
          {selected ? `Confirmar lugar ${selected}` : "Selecciona un lugar"}
          <Icon name="arrow" size={19} />
        </button>
      </div>
    </section>
  );
}

function Ticket({
  vehicle,
  spot,
  entryTime,
  onFinish,
}: {
  vehicle: Vehicle;
  spot: string;
  entryTime: Date;
  onFinish: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  const [qr, setQr] = useState("");
  const [paidAt, setPaidAt] = useState<number | null>(null);
  const ticketId = useMemo(
    () => `FCAEI-${entryTime.getFullYear()}-${String(entryTime.getTime()).slice(-6)}`,
    [entryTime],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const data = JSON.stringify({
      ticket: ticketId,
      placa: vehicle.plate,
      lugar: spot,
      entrada: entryTime.toISOString(),
    });
    QRCode.toDataURL(data, {
      width: 320,
      margin: 1,
      color: { dark: "#16352b", light: "#ffffff" },
    }).then(setQr);
  }, [entryTime, spot, ticketId, vehicle.plate]);

  const elapsed = Math.max(0, (paidAt ?? now) - entryTime.getTime());
  const hours = Math.floor(elapsed / 3_600_000);
  const minutes = Math.floor((elapsed % 3_600_000) / 60_000);
  const seconds = Math.floor((elapsed % 60_000) / 1000);
  const time = [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
  const dateLabel = new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(entryTime);

  return (
    <section className="ticket-screen">
      <div className="success-heading">
        <span className="success-icon">
          <Icon name="check" size={25} />
        </span>
        <div>
          <div className="eyebrow">
            <span />
            REGISTRO COMPLETADO
          </div>
          <h1>Tu lugar está listo</h1>
          <p className="lead">Conserva este ticket para registrar tu salida.</p>
        </div>
      </div>

      <div className="ticket-paper">
        <div className="ticket-top">
          <div className="ticket-logo">
            <img
              src="/assets/fcaei-logo.png"
              alt="Facultad de Contaduría, Administración e Informática"
            />
            <div>
              <strong>Estacionamiento FCAeI</strong>
              <small>UNIVERSIDAD AUTÓNOMA DEL ESTADO DE MORELOS</small>
            </div>
          </div>
          <span className={`ticket-status ${paidAt ? "paid" : ""}`}>
            {paidAt ? "PAGO CONFIRMADO" : "ESTANCIA ACTIVA"}
          </span>
        </div>

        <div className="ticket-main">
          <div className="ticket-data">
            <span className="data-label">LUGAR ASIGNADO</span>
            <strong className="spot-number">{spot}</strong>
            <div className="vehicle-data">
              <div>
                <span>PLACA</span>
                <strong>{vehicle.plate}</strong>
              </div>
              <div>
                <span>VEHÍCULO</span>
                <strong>{vehicle.model}</strong>
              </div>
              <div>
                <span>COLOR</span>
                <strong>{vehicle.color}</strong>
              </div>
              <div>
                <span>ENTRADA</span>
                <strong>{dateLabel}</strong>
              </div>
            </div>
          </div>

          <div className="qr-panel">
            {qr ? (
              <img alt={`Código QR del ticket ${ticketId}`} src={qr} />
            ) : (
              <div className="qr-loading" />
            )}
            <span>Escanea al salir</span>
          </div>
        </div>

        <div className="ticket-cut">
          <i />
          <span />
          <i />
        </div>

        <div className="timer-panel">
          <div>
            <span className="pulse" />
            <span>
              <small>TIEMPO DE ESTANCIA</small>
              <strong>{time}</strong>
            </span>
          </div>
          <span className="timer-units">HRS&nbsp;&nbsp; MIN&nbsp;&nbsp; SEG</span>
        </div>

        <div className="ticket-id">FOLIO: {ticketId}</div>
      </div>

      {!paidAt ? (
        <div className="payment-box">
          <div className="payment-copy">
            <span className="payment-icon">
              <Icon name="check" size={20} />
            </span>
            <span>
              <strong>¿Tu pago ya fue realizado?</strong>
              Confírmalo para liberar el lugar y autorizar tu salida.
            </span>
          </div>
          <button className="paid-button" onClick={() => setPaidAt(Date.now())} type="button">
            <Icon name="check" size={19} />
            Ya pagué
          </button>
        </div>
      ) : (
        <div className="exit-authorization" role="status">
          <span className="exit-check">
            <Icon name="check" size={28} />
          </span>
          <div>
            <span>SALIDA AUTORIZADA</span>
            <strong>Pago confirmado correctamente</strong>
            <p>Presenta el código QR en la pluma de salida. Tu lugar {spot} será liberado.</p>
          </div>
          <button className="primary-button compact" onClick={onFinish} type="button">
            Finalizar y salir
            <Icon name="logout" size={19} />
          </button>
        </div>
      )}

      <div className="ticket-actions">
        <button className="secondary-button" onClick={() => window.print()} type="button">
          <Icon name="ticket" size={19} />
          Guardar ticket
        </button>
      </div>
    </section>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("register");
  const [vehicle, setVehicle] = useState<Vehicle>(emptyVehicle);
  const [selectedSpot, setSelectedSpot] = useState("");
  const [entryTime, setEntryTime] = useState(new Date());

  function reset() {
    setVehicle(emptyVehicle);
    setSelectedSpot("");
    setScreen("register");
  }

  function createTicket() {
    setEntryTime(new Date());
    setScreen("ticket");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className={`app-shell ${screen}-view`}>
      <Header onReset={reset} />
      <main>
        <Progress screen={screen} />
        {screen === "register" && (
          <VehicleForm
            onChange={setVehicle}
            onContinue={() => setScreen("parking")}
            value={vehicle}
          />
        )}
        {screen === "parking" && (
          <ParkingMap
            onBack={() => setScreen("register")}
            onContinue={createTicket}
            onSelect={setSelectedSpot}
            selected={selectedSpot}
          />
        )}
        {screen === "ticket" && (
          <Ticket entryTime={entryTime} onFinish={reset} spot={selectedSpot} vehicle={vehicle} />
        )}
      </main>
      <footer>
        <span>Facultad de Contaduría, Administración e Informática</span>
        <span>Universidad Autónoma del Estado de Morelos</span>
      </footer>
    </div>
  );
}
