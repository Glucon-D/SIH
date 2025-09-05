import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Pencil, MapPin, Loader2, X } from "lucide-react";
import { weatherService } from "../../services/weather";

const WeatherWidget = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null); // { ui, raw, dateKey, city }
  const [editCity, setEditCity] = useState("");
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);

  const todayIconUrl = useMemo(() => data?.ui?.today?.iconUrl, [data]);
  const cityLabel = useMemo(() => data?.ui?.city || data?.city || "", [data]);

  const load = async (city) => {
    setLoading(true);
    setError("");
    try {
      const payload = await weatherService.getForecast(city);
      setData(payload);
      setEditCity(payload.city);
      setEditing(false);
    } catch (e) {
      setError(e.message || "Failed to load weather");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    load();
  }, []);

  const handleSaveCity = async () => {
    await load(editCity.trim());
  };

  return (
    <>
      <div className="">
        <button
          onClick={() => setOpen(true)}
          className="hidden sm:flex relative p-2 rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 hover:bg-white/90 dark:hover:bg-gray-800 transition"
          aria-label="Open 7-day forecast"
          title={cityLabel ? `Weather • ${cityLabel}` : "Weather"}
        >
          {todayIconUrl ? (
            <img
              src={todayIconUrl}
              alt="Weather"
              className="w-7 h-7 shrink-0"
            />
          ) : loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          ) : (
            <span className="text-xs">N/A</span>
          )}
        </button>

        {open &&
          mounted &&
          createPortal(
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-md"
              onClick={() => setOpen(false)}
            >
              <div
                className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-semibold">7-Day Forecast</div>
                      <div className="text-xs text-gray-500">{cityLabel}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editing ? (
                      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-2 py-1">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <input
                          className="bg-transparent outline-none text-sm w-40"
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          placeholder="City name"
                        />
                        <button
                          onClick={handleSaveCity}
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditing(false);
                            setEditCity(data?.city || editCity);
                          }}
                          className="p-1 text-xs rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2 px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Pencil className="w-4 h-4" /> Edit City
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  {loading ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                    </div>
                  ) : error ? (
                    <div className="text-red-600 text-sm">{error}</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                      {data?.ui?.days?.map((d) => (
                        <div
                          key={d.dateKey}
                          className="flex flex-col items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 p-2 bg-gray-50/50 dark:bg-gray-800/50"
                        >
                          <div className="text-xs text-gray-500">{d.label}</div>
                          <img
                            src={d.iconUrl}
                            alt={d.description}
                            className="w-12 h-12"
                          />
                          <div className="text-sm font-medium">
                            {Math.round(d.max)}° / {Math.round(d.min)}°C
                          </div>
                          <div className="text-[11px] text-gray-500 capitalize">
                            {d.main}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-right">
                  <button
                    onClick={() => setOpen(false)}
                    className="px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    </>
  );
};

export default WeatherWidget;
