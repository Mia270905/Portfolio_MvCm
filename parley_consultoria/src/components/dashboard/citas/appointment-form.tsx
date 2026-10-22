"use client";

import { useEffect, useState } from "react";
import { format, parse } from "date-fns";

export type AppointmentFormValues = {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm a - hora actual para agregar
  notes: string;
};

type TimeSlot = {
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

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]); // Lista de horas agregadas
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDateChangeDialog, setShowDateChangeDialog] = useState(false);
  const [pendingDate, setPendingDate] = useState<string | null>(null);

  // Agregar una hora a la lista
  const handleAddTime = () => {
    const { date, time } = values;
    
    if (!date || !time) {
      setErrors(prev => ({ ...prev, time: "Selecciona fecha y hora" }));
      return;
    }

    // Parsear la hora en formato 24h
    const parsedTime = parse(time, 'HH:mm', new Date());
    const display = format(parsedTime, 'hh:mm a');

    // Crear datetime en UTC
    const localDateTime = new Date(`${date}T${time}:00`);
    const datetime = localDateTime.toISOString().replace(/\.\d{3}Z$/, '');

    // Verificar que no exista ya en la lista
    const alreadyExists = timeSlots.some(slot => slot.datetime === datetime);
    if (alreadyExists) {
      setErrors(prev => ({ ...prev, time: "Esta hora ya está en la lista" }));
      return;
    }

    // Agregar nuevo slot
    const newSlot: TimeSlot = {
      datetime,
      display,
      available: true,
    };

    const updatedSlots = [...timeSlots, newSlot];
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
    
    // Si está cambiando la fecha y ya hay horas agregadas, mostrar confirmación
    if (name === "date" && value !== values.date && timeSlots.length > 0) {
      setPendingDate(value);
      setShowDateChangeDialog(true);
      return;
    }
    
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleConfirmDateChange = () => {
    if (!pendingDate) return;

    // Adaptar todas las horas al nuevo día
    const updatedSlots = timeSlots.map(slot => {
      // Convertir datetime UTC a hora local
      const utcDateTime = new Date(slot.datetime + 'Z');
      const localTime = utcDateTime; // Ya es local al crear Date con Z
      const time24 = format(localTime, 'HH:mm');
      const display = format(localTime, 'hh:mm a');

      // Crear nuevo datetime en UTC
      const newLocalDateTime = new Date(`${pendingDate}T${time24}:00`);
      const newDatetime = newLocalDateTime.toISOString().replace(/\.\d{3}Z$/, '');

      return {
        datetime: newDatetime,
        display,
        available: true, // Se volverá a validar
      };
    });

    setTimeSlots(updatedSlots);
    setValues(prev => ({ ...prev, date: pendingDate }));
    setShowDateChangeDialog(false);
    setPendingDate(null);

    // Re-validar disponibilidad con el nuevo día
    if (onCheckAvailability) {
      checkSlotsAvailability(updatedSlots);
    }
  };

  const handleCancelDateChange = () => {
    setShowDateChangeDialog(false);
    setPendingDate(null);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    
    if (!values.date) {
      next.date = "La fecha es obligatoria";
    } else {
      const selectedDate = new Date(values.date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        next.date = "Debe ser una fecha presente o futura";
      }
    }

    // Verificar que haya al menos un slot
    if (timeSlots.length === 0) {
      next.general = "Debes agregar al menos una hora";
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

  return (
    <>
      {/* Diálogo de confirmación de cambio de fecha */}
      {showDateChangeDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#f5efe6] rounded-xl p-6 max-w-md w-full space-y-4 shadow-lg">
            <h3 className="text-lg font-serif font-medium text-neutral-900">
              ¿Cambiar fecha?
            </h3>
            <p className="text-sm text-neutral-600">
              Ya tienes {timeSlots.length} hora{timeSlots.length !== 1 ? 's' : ''} agregada{timeSlots.length !== 1 ? 's' : ''}. 
              Si cambias la fecha, estas horas se adaptarán al nuevo día y se volverá a verificar su disponibilidad.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancelDateChange}
                className="px-4 py-2 bg-white text-neutral-700 rounded-lg border border-[#e6dcc9] hover:bg-[#faf8f3] transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDateChange}
                className="px-4 py-2 bg-[#c6a365] hover:bg-[#b59555] text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-lg hover:shadow-[#c6a365]/25"
              >
                Cambiar fecha
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-[#f5efe6] rounded-xl p-6 shadow-sm">
        {/* Fecha */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">
            Fecha *
          </label>
          <div className="relative">
            <input
              type="date"
              name="date"
              value={values.date}
              onChange={handleChange}
              min={todayStr}
              max={maxDateStr}
              className="w-full bg-[#faf8f3] border border-[#e6dcc9] rounded-lg px-4 py-3 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:border-[#c6a365] transition-all appearance-none"
              style={{ WebkitAppearance: 'none' }}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          {errors.date && (
            <p className="text-sm text-[#c62828] mt-2">{errors.date}</p>
          )}
        </div>

        {/* Agregar hora */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">
            Agregar hora
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
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
                className="w-full bg-[#faf8f3] border border-[#e6dcc9] rounded-lg px-4 py-3 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:border-[#c6a365] transition-all appearance-none pr-10"
                style={{ WebkitAppearance: 'none' }}
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddTime}
              disabled={!values.date || !values.time}
              className="px-6 py-3 bg-[#c6a365] hover:bg-[#b59555] text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-lg hover:shadow-[#c6a365]/25"
            >
              Agregar
            </button>
          </div>
          {errors.time && (
            <p className="text-sm text-[#c62828] mt-2">{errors.time}</p>
          )}
        </div>

        {/* Mostrar horas agregadas */}
        {timeSlots.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-neutral-700">
                Horas agregadas
              </label>
              <span className="text-sm font-medium text-neutral-900">
                {timeSlots.filter(s => s.available).length} disponibles
                {timeSlots.filter(s => !s.available).length > 0 && (() => {
                  const count = timeSlots.filter(s => !s.available).length;
                  return (
                    <span className="text-[#c62828] ml-2">
                      ({count} ocupada{count !== 1 ? 's' : ''})
                    </span>
                  );
                })()}
              </span>
            </div>

            <div className="bg-[#faf8f3] border border-[#e6dcc9] rounded-lg p-4 space-y-2 max-h-80 overflow-y-auto">
              {checkingAvailability ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#c6a365]"></div>
                  <p className="text-sm text-neutral-600 ml-3">
                    Verificando disponibilidad...
                  </p>
                </div>
              ) : (
                timeSlots.map((slot, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                      slot.available 
                        ? 'bg-[#e8f5e9] border border-[#c8e6c9]' 
                        : 'bg-[#fdeaea] border border-[#ffcdd2]'
                    }`}
                  >
                    <span className={`text-sm font-medium ${
                      slot.available ? 'text-[#2e7d32]' : 'text-[#c62828] line-through'
                    }`}>
                      {slot.display}
                    </span>
                    <div className="flex items-center gap-2">
                      {!slot.available && (
                        <span className="text-xs text-[#c62828]">
                          (Ya ocupada)
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveTime(slot.datetime)}
                        className="text-[#c62828] hover:text-[#b71c1c] transition-colors p-1 hover:bg-[#fdeaea] rounded"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Notas */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">Notas</label>
          <textarea
            name="notes"
            rows={4}
            value={values.notes}
            onChange={handleChange}
            className="w-full bg-[#faf8f3] border border-[#e6dcc9] rounded-lg px-4 py-3 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:border-[#c6a365] transition-all resize-none"
            placeholder="Notas que se aplicarán a todos los espacios creados..."
          />
        </div>

        {errors.general && (
          <div className="text-sm text-[#c62828] bg-[#fdeaea] border border-[#ffcdd2] p-3 rounded-lg">
            {errors.general}
          </div>
        )}

        {serverError && (
          <div className="text-sm text-[#c62828] bg-[#fdeaea] border border-[#ffcdd2] p-3 rounded-lg">
            {serverError}
          </div>
        )}

        <div className="flex justify-end border-t border-[#f5efe6] pt-6">
          <button
            type="submit"
            disabled={loading || checkingAvailability || timeSlots.filter(s => s.available).length === 0}
            className="px-6 py-3 bg-[#c6a365] hover:bg-[#b59555] text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-lg hover:shadow-[#c6a365]/25 flex items-center gap-2"
          >
            {loading 
              ? "Creando espacios..." 
              : checkingAvailability 
                ? "Verificando..." 
                : `Crear ${timeSlots.filter(s => s.available).length} espacio${timeSlots.filter(s => s.available).length !== 1 ? 's' : ''}`
            }
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
          </button>
        </div>
      </form>
    </>
  );
}