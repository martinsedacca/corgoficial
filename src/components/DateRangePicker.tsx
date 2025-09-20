import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onDateChange: (startDate: string, endDate: string) => void;
}

export function DateRangePicker({ startDate, endDate, onDateChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-AR');
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Días del mes anterior para completar la primera semana
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }
    
    // Días del mes siguiente para completar la última semana
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false });
    }
    
    return days;
  };

  const handleDateClick = (date: Date) => {
    const dateStr = formatDateForInput(date);
    
    if (selectingStart) {
      setTempStartDate(dateStr);
      setTempEndDate('');
      setSelectingStart(false);
    } else {
      const startDateObj = new Date(tempStartDate);
      if (date < startDateObj) {
        // Si la fecha final es anterior a la inicial, intercambiar
        setTempStartDate(dateStr);
        setTempEndDate(tempStartDate);
      } else {
        setTempEndDate(dateStr);
      }
      
      // Aplicar el rango seleccionado
      const finalStartDate = date < startDateObj ? dateStr : tempStartDate;
      const finalEndDate = date < startDateObj ? tempStartDate : dateStr;
      
      onDateChange(finalStartDate, finalEndDate);
      setIsOpen(false);
      setSelectingStart(true);
    }
  };

  const isDateInRange = (date: Date) => {
    if (!tempStartDate || !tempEndDate) return false;
    const dateStr = formatDateForInput(date);
    return dateStr >= tempStartDate && dateStr <= tempEndDate;
  };

  const isDateSelected = (date: Date) => {
    const dateStr = formatDateForInput(date);
    return dateStr === tempStartDate || dateStr === tempEndDate;
  };

  const isDateStart = (date: Date) => {
    const dateStr = formatDateForInput(date);
    return dateStr === tempStartDate;
  };

  const isDateEnd = (date: Date) => {
    const dateStr = formatDateForInput(date);
    return dateStr === tempEndDate;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const clearDates = () => {
    setTempStartDate('');
    setTempEndDate('');
    onDateChange('', '');
    setSelectingStart(true);
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Fecha Desde
          </label>
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              setSelectingStart(true);
              setTempStartDate(startDate);
              setTempEndDate(endDate);
            }}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
          >
            <span className={startDate ? 'text-gray-900' : 'text-gray-500'}>
              {startDate ? formatDisplayDate(startDate) : 'Seleccionar'}
            </span>
            <Calendar className="h-4 w-4 text-gray-400" />
          </button>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Fecha Hasta
          </label>
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              setSelectingStart(false);
              setTempStartDate(startDate);
              setTempEndDate(endDate);
            }}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
          >
            <span className={endDate ? 'text-gray-900' : 'text-gray-500'}>
              {endDate ? formatDisplayDate(endDate) : 'Seleccionar'}
            </span>
            <Calendar className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80">
          {/* Header del calendario */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Instrucciones */}
          <div className="mb-3 text-center">
            <p className="text-sm text-gray-600">
              {selectingStart ? 'Selecciona la fecha de inicio' : 'Selecciona la fecha de fin'}
            </p>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const isInRange = isDateInRange(day.date);
              const isSelected = isDateSelected(day.date);
              const isStart = isDateStart(day.date);
              const isEnd = isDateEnd(day.date);
              const isToday = formatDateForInput(day.date) === formatDateForInput(new Date());

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateClick(day.date)}
                  className={`
                    h-8 w-8 text-sm rounded transition-colors relative
                    ${!day.isCurrentMonth 
                      ? 'text-gray-300 hover:bg-gray-50' 
                      : isSelected
                        ? isStart
                          ? 'bg-primary-600 text-white'
                          : 'bg-primary-600 text-white'
                        : isInRange
                          ? 'bg-primary-100 text-primary-700'
                          : isToday
                            ? 'bg-blue-100 text-blue-700 font-semibold'
                            : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {day.date.getDate()}
                  {isToday && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Botones de acción */}
          <div className="flex justify-between mt-4 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={clearDates}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Limpiar fechas
            </button>
            
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-sm bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}