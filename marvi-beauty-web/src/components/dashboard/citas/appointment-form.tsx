"use client";

import { useEffect, useState } from "react";
import { format, parse, eachDayOfInterval, addDays } from "date-fns";
import { es } from "date-fns/locale";

export type AppointmentFormValues = {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm a - hora actual para agregar
  notes: string;
};

type TimeSlot = {
  date: string; // YYYY-MM-DD - fecha a la que pertenece
  datetime: string; // YYYY-MM-DDTHH:mm:ss
  display: string; // HH:mm a - para display
  available: boolean;
};

type Props = {
  initialValues?: Partial<AppointmentFormValues>;
  loading?: boolean;
  serverError?: string | null;
  onSubmit: (values: AppointmentFormValues, availableSlots: TimeSlot[]) => void;
  onCheckAvailability?: (datetimes: string[]) => Promise<string[]>; // Retorna array de datetimes ocupados
};

export function AppointmentForm({
  initialValues = {},
  serverError = null,
  loading = false,
  onSubmit,
  onCheckAvailability,
}: Props) {
  const [values, setValues] = useState<AppointmentFormValues>({
    date: initialValues.date || "",
    time: initialValues.time || "",
    notes: initialValues.notes || "",
  });

  const [selectedDates, setSelectedDates] = useState<string[]>([]); // Array de fechas seleccionadas
  const [rangeStart, setRangeStart] = useState<string>("");
  const [rangeEnd, setRangeEnd] = useState<string>("");
  const [singleDate, setSingleDate] = useState<string>("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]); // Lista de horas agregadas
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dateSelectionMode, setDateSelectionMode] = useState<'range' | 'multiple'>('multiple'); // 'range' o 'multiple'

  // Agregar fecha individual
  const handleAddSingleDate = () => {
    if (!singleDate) {
      setErrors(prev => ({ ...prev, singleDate: "Selecciona una fecha" }));
      return;
    }

    // Verificar si la fecha ya está seleccionada
    if (selectedDates.includes(singleDate)) {
      setErrors(prev => ({ ...prev, singleDate: "Esa fecha ya está seleccionada" }));
      return;
    }

    setSelectedDates(prev => [...prev, singleDate].sort());
    setSingleDate("");
    setErrors(prev => {
      const next = { ...prev };
      delete next.singleDate;
      return next;
    });
  };

  // Agregar rango de fechas
  const handleAddDateRange = () => {
    if (!rangeStart || !rangeEnd) {
      setErrors(prev => ({ ...prev, range: "Selecciona ambas fechas" }));
      return;
    }

    const start = new Date(rangeStart + 'T00:00:00');
    const end = new Date(rangeEnd + 'T00:00:00');

    if (start > end) {
      setErrors(prev => ({ ...prev, range: "La fecha de inicio debe ser anterior a la fecha de fin" }));
      return;
    }

    // Generar todas las fechas del rango
    const datesInRange = eachDayOfInterval({ start, end })
      .map(date => format(date, 'yyyy-MM-dd'));

    // Filtrar fechas que no estén ya seleccionadas
    const newDates = datesInRange.filter(date => !selectedDates.includes(date));

    if (newDates.length === 0) {
      setErrors(prev => ({ ...prev, range: "Todas las fechas del rango ya están seleccionadas" }));
      return;
    }

    setSelectedDates(prev => [...prev, ...newDates].sort());
    setRangeStart("");
    setRangeEnd("");
    setErrors(prev => {
      const next = { ...prev };
      delete next.range;
      return next;
    });
  };

  // Agregar una hora a todas las fechas seleccionadas
  const handleAddTime = () => {
    const { time } = values;
    
    if (selectedDates.length === 0) {
      setErrors(prev => ({ ...prev, time: "Primero debes agregar al menos una fecha" }));
      return;
    }

    if (!time) {
      setErrors(prev => ({ ...prev, time: "Selecciona una hora" }));
      return;
    }

    // Parsear la hora en formato 24h
    const parsedTime = parse(time, 'HH:mm', new Date());
    const display = format(parsedTime, 'hh:mm a');

    // Crear slots para todas las fechas seleccionadas
    const newSlots: TimeSlot[] = [];
    
    for (const date of selectedDates) {
      // Crear datetime en UTC
      const localDateTime = new Date(`${date}T${time}:00`);
      const datetime = localDateTime.toISOString().replace(/\.\d{3}Z$/, '');

      // Verificar que no exista ya en la lista
      const alreadyExists = timeSlots.some(slot => slot.datetime === datetime);
      if (!alreadyExists) {
        newSlots.push({
          date,
          datetime,
          display,
          available: true,
        });
      }
    }

    if (newSlots.length === 0) {
      setErrors(prev => ({ ...prev, time: "Esta hora ya está agregada en todas las fechas" }));
      return;
    }

    const updatedSlots = [...timeSlots, ...newSlots].sort((a, b) => 
      a.datetime.localeCompare(b.datetime)
    );
    setTimeSlots(updatedSlots);
    
    // Limpiar campo de hora y error
    setValues(prev => ({ ...prev, time: "" }));
    setErrors(prev => {
      const next = { ...prev };
      delete next.time;
      return next;
    });

    // Verificar disponibilidad de todos los slots
    if (onCheckAvailability) {
      checkSlotsAvailability(updatedSlots);
    }
  };

  // Eliminar una hora de la lista
  const handleRemoveTime = (datetime: string) => {
    const updatedSlots = timeSlots.filter(slot => slot.datetime !== datetime);
    setTimeSlots(updatedSlots);
  };

  // Eliminar una fecha completa con todas sus horas
  const handleRemoveDate = (date: string) => {
    // Eliminar la fecha de selectedDates
    setSelectedDates(prev => prev.filter(d => d !== date));
    // Eliminar todos los slots de esa fecha
    const updatedSlots = timeSlots.filter(slot => slot.date !== date);
    setTimeSlots(updatedSlots);
  };

  // Verificar disponibilidad de los slots
  const checkSlotsAvailability = async (slots: TimeSlot[]) => {
    if (!onCheckAvailability || slots.length === 0) return;

    setCheckingAvailability(true);
    try {
      const datetimes = slots.map(slot => slot.datetime);
      const occupiedDatetimes = await onCheckAvailability(datetimes);
      
      // Actualizar disponibilidad
      setTimeSlots(slots.map(slot => ({
        ...slot,
        available: !occupiedDatetimes.includes(slot.datetime)
      })));
    } catch (error) {
      console.error("Error verificando disponibilidad:", error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};

    // Verificar que haya al menos una fecha seleccionada con horas
    const datesWithSlots = new Set(timeSlots.map(slot => slot.date));
    if (datesWithSlots.size === 0) {
      next.general = "Debes agregar al menos una fecha con horas";
    } else {
      // Verificar que haya al menos un slot disponible
      const availableSlots = timeSlots.filter(slot => slot.available);
      if (availableSlots.length === 0) {
        next.general = "Todas las horas agregadas ya están ocupadas";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    // Filtrar solo los slots disponibles
    const availableSlots = timeSlots.filter(slot => slot.available);
    onSubmit(values, availableSlots);
  };

  // Calcular fechas mínima y máxima
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  // Agrupar slots por fecha
  const groupedSlots = timeSlots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  // Ordenar fechas
  const sortedDates = Object.keys(groupedSlots).sort();

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 bg-custom-bg-secondary border border-custom-border-secondary rounded-lg p-4 md:p-6">
        
        {/* Pestañas de selección de fechas */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-custom-border-primary">           
            <button
              type="button"
              onClick={() => setDateSelectionMode('multiple')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                dateSelectionMode === 'multiple'
                  ? 'text-custom-accent-primary border-b-2 border-custom-accent-primary'
                  : 'text-custom-text-tertiary hover:text-custom-text-secondary'
              }`}
            >
              Selección individual
            </button>
            <button
              type="button"
              onClick={() => setDateSelectionMode('range')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                dateSelectionMode === 'range'
                  ? 'text-custom-accent-primary border-b-2 border-custom-accent-primary'
                  : 'text-custom-text-tertiary hover:text-custom-text-secondary'
              }`}
            >
              Selección por rango
            </button>
          </div>

          {/* Contenido según pestaña seleccionada */}
          {dateSelectionMode === 'range' ? (
            // Primera pestaña: Rango de fechas
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-custom-text-secondary">
                  Fecha de inicio *
                </label>
                <input
                  type="date"
                  value={rangeStart}
                  onChange={(e) => {
                    setRangeStart(e.target.value);
                    if (errors.range) {
                      setErrors(prev => {
                        const next = { ...prev };
                        delete next.range;
                        return next;
                      });
                    }
                  }}
                  min={todayStr}
                  max={maxDateStr}
                  className="w-full bg-custom-bg-tertiary border border-custom-border-primary rounded-lg px-4 py-4 text-custom-text-primary text-base md:text-sm md:py-3 focus:outline-none focus:ring-2 focus:ring-custom-accent-primary/50 focus:border-custom-accent-primary/50 transition-all"
                  style={{ minHeight: '56px' }}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-custom-text-secondary">
                  Fecha de fin *
                </label>
                <input
                  type="date"
                  value={rangeEnd}
                  onChange={(e) => {
                    setRangeEnd(e.target.value);
                    if (errors.range) {
                      setErrors(prev => {
                        const next = { ...prev };
                        delete next.range;
                        return next;
                      });
                    }
                  }}
                  min={rangeStart || todayStr}
                  max={maxDateStr}
                  className="w-full bg-custom-bg-tertiary border border-custom-border-primary rounded-lg px-4 py-4 text-custom-text-primary text-base md:text-sm md:py-3 focus:outline-none focus:ring-2 focus:ring-custom-accent-primary/50 focus:border-custom-accent-primary/50 transition-all"
                  style={{ minHeight: '56px' }}
                />
              </div>
              {errors.range && (
                <p className="text-sm text-red-400">{errors.range}</p>
              )}
              <button
                type="button"
                onClick={handleAddDateRange}
                disabled={!rangeStart || !rangeEnd}
                className="w-full px-4 py-3 bg-custom-accent-primary hover:bg-custom-accent-secondary text-gray-900 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Agregar rango
              </button>
            </div>
          ) : (
            // Segunda pestaña: Fechas múltiples
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-custom-text-secondary">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={singleDate}
                  onChange={(e) => {
                    setSingleDate(e.target.value);
                    if (errors.singleDate) {
                      setErrors(prev => {
                        const next = { ...prev };
                        delete next.singleDate;
                        return next;
                      });
                    }
                  }}
                  min={todayStr}
                  max={maxDateStr}
                  className="w-full bg-custom-bg-tertiary border border-custom-border-primary rounded-lg px-4 py-4 text-custom-text-primary text-base md:text-sm md:py-3 focus:outline-none focus:ring-2 focus:ring-custom-accent-primary/50 focus:border-custom-accent-primary/50 transition-all"
                  style={{ minHeight: '56px' }}
                />
                {errors.singleDate && (
                  <p className="text-sm text-red-400 mt-2">{errors.singleDate}</p>
                )}
              </div>
              
              {/* Botón agregar fecha */}
              <button
                type="button"
                onClick={handleAddSingleDate}
                disabled={!singleDate}
                className="w-full px-4 py-3 bg-custom-accent-primary hover:bg-custom-accent-secondary text-gray-900 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Agregar fecha
              </button>
            </div>
          )}
        </div>

        {/* Mostrar fechas seleccionadas */}
        {selectedDates.length > 0 && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-custom-text-secondary">
              Fechas seleccionadas ({selectedDates.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedDates.map(date => {
                const dateObj = new Date(date + 'T00:00:00');
                const formatted = format(dateObj, 'dd MMM yyyy', { locale: es });
                const slotsCount = timeSlots.filter(slot => slot.date === date).length;
                
                return (
                  <div
                    key={date}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-custom-accent-primary/10 border border-custom-accent-primary/30 rounded-lg"
                  >
                    <span className="text-sm text-custom-text-primary font-medium">
                      {formatted}
                      {slotsCount > 0 && (
                        <span className="ml-1 text-xs text-custom-text-tertiary">
                          ({slotsCount} hora{slotsCount !== 1 ? 's' : ''})
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDate(date)}
                      className="text-red-400 hover:text-red-300 transition-colors p-0.5"
                      title="Eliminar fecha"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Agregar hora */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-custom-text-secondary">
          Agregar hora {selectedDates.length > 0 && (
            <span className="text-xs text-custom-text-tertiary ml-1">
              (se aplicará a {selectedDates.length} fecha{selectedDates.length !== 1 ? 's' : ''})
            </span>
          )}
        </label>
        <div className="flex gap-2">
          <input
            type="time"
            name="time"
            value={values.time}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTime();
              }
            }}
            className="flex-1 bg-custom-bg-tertiary border border-custom-border-primary rounded-lg px-4 py-4 text-custom-text-primary text-base md:text-sm md:py-3 focus:outline-none focus:ring-2 focus:ring-custom-accent-primary/50 focus:border-custom-accent-primary/50 transition-all"
            style={{ minHeight: '56px' }}
          />
          <button
            type="button"
            onClick={handleAddTime}
            disabled={selectedDates.length === 0 || !values.time}
            className="px-6 py-4 md:py-3 bg-custom-accent-primary hover:bg-custom-accent-secondary text-gray-900 rounded-lg font-medium text-base md:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ minHeight: '56px' }}
          >
            Agregar
          </button>
        </div>
        {errors.time && (
          <p className="text-sm text-red-400 mt-2">{errors.time}</p>
        )}
      </div>

      {/* Mostrar horas agregadas agrupadas por fecha */}
      {timeSlots.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-custom-text-secondary">
              Horas agregadas
            </label>
            <span className="text-sm font-medium text-custom-text-primary">
              {timeSlots.filter(s => s.available).length} disponibles
              {timeSlots.filter(s => !s.available).length > 0 && (() => {
                const count = timeSlots.filter(s => !s.available).length;
                return (
                  <span className="text-red-400 ml-2">
                    ({count} ocupada{count !== 1 ? 's' : ''})
                  </span>
                );
              })()}
            </span>
          </div>

          <div className="bg-custom-bg-tertiary border border-custom-border-primary rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
            {checkingAvailability ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-custom-accent-primary"></div>
                <p className="text-sm text-custom-text-tertiary ml-3">
                  Verificando disponibilidad...
                </p>
              </div>
            ) : (
              sortedDates.map((date) => {
                const dateSlots = groupedSlots[date];
                const dateObj = new Date(date + 'T00:00:00');
                const formatted = format(dateObj, 'EEEE, dd MMMM yyyy', { locale: es });
                const availableCount = dateSlots.filter(s => s.available).length;
                
                return (
                  <div key={date} className="space-y-2">
                    {/* Encabezado de fecha */}
                    <div className="flex items-center justify-between py-2 border-b border-custom-border-primary">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-custom-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-semibold text-custom-text-primary capitalize">
                          {formatted}
                        </span>
                      </div>
                      <span className="text-xs text-custom-text-tertiary">
                        {availableCount} de {dateSlots.length} disponible{dateSlots.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Horas de esta fecha */}
                    <div className="space-y-2 pl-2">
                      {dateSlots.map((slot, index) => (
                        <div
                          key={slot.datetime}
                          className={`flex items-center justify-between p-2.5 rounded-lg transition-all ${
                            slot.available 
                              ? 'bg-green-500/10 border border-green-500/30' 
                              : 'bg-red-500/10 border border-red-500/30'
                          }`}
                        >
                          <span className={`text-sm font-medium ${
                            slot.available ? 'text-custom-text-primary' : 'text-red-400 line-through'
                          }`}>
                            {slot.display}
                          </span>
                          <div className="flex items-center gap-2">
                            {!slot.available && (
                              <span className="text-xs text-red-400">
                                (Ya ocupada)
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveTime(slot.datetime)}
                              className="text-red-400 hover:text-red-300 transition-colors p-1"
                              title="Eliminar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Notas */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-custom-text-secondary">Notas</label>
        <textarea
          name="notes"
          rows={4}
          value={values.notes}
          onChange={handleChange}
          className="w-full bg-custom-bg-tertiary border border-custom-border-primary rounded-lg px-4 py-4 text-custom-text-primary text-base md:text-sm md:py-3 focus:outline-none focus:ring-2 focus:ring-custom-accent-primary/50 focus:border-custom-accent-primary/50 transition-all resize-none"
          placeholder="Notas que se aplicarán a todos los espacios creados..."
          style={{ minHeight: '120px' }}
        />
      </div>

      {errors.general && (
        <div className="text-sm text-red-400 bg-red-500/10 p-3 rounded">
          {errors.general}
        </div>
      )}

      {serverError && (
        <div className="text-sm text-red-400 bg-red-500/10 p-3 rounded">
          {serverError}
        </div>
      )}

      <div className="flex justify-end border-t border-custom-border-secondary pt-6">
        <button
          type="submit"
          disabled={loading || checkingAvailability || timeSlots.filter(s => s.available).length === 0}
          className="w-full md:w-auto px-6 py-4 md:py-3 bg-custom-accent-primary hover:bg-custom-accent-secondary text-gray-900 rounded-lg font-medium text-base md:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-[0.98]"
          style={{ minHeight: '56px' }}
        >
          {loading 
            ? "Creando espacios..." 
            : checkingAvailability 
              ? "Verificando..." 
              : `Crear ${timeSlots.filter(s => s.available).length} espacio${timeSlots.filter(s => s.available).length !== 1 ? 's' : ''}`
          }
        </button>
      </div>
    </form>
    </>
  );
}