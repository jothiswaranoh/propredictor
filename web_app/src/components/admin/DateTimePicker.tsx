import { CalendarIcon, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateTimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

// Helper to get IST date/time parts independent of browser timezone
const getISTParts = (date: Date) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(date);
  const year = Number(parts.find(p => p.type === 'year')?.value);
  const month = Number(parts.find(p => p.type === 'month')?.value);
  const day = Number(parts.find(p => p.type === 'day')?.value);
  let hour = Number(parts.find(p => p.type === 'hour')?.value);
  const minute = Number(parts.find(p => p.type === 'minute')?.value);
  
  if (hour === 24) hour = 0;
  
  return { year, month, day, hour, minute };
};

// Helper to construct UTC ISO string from IST parts
const getUtcIsoString = (year: number, month: number, day: number, hour: number, minute: number): string => {
  const utcMs = Date.UTC(year, month - 1, day, hour - 5, minute - 30);
  return new Date(utcMs).toISOString();
};

// Helper to format UTC ISO string directly to IST formatted string
const formatToISTDisplay = (isoString: string): string => {
  return new Date(isoString).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export function DateTimePicker({
  value,
  onChange,
  className = '',
  disabled = false,
}: DateTimePickerProps) {

  // Calendar component requires a Date in local browser timezone that matches the calendar date digits of IST
  const localDateForCalendar = value ? (() => {
    const parts = getISTParts(new Date(value));
    return new Date(parts.year, parts.month - 1, parts.day);
  })() : undefined;

  // Get 12-hour format parts for adjustments
  const get12HourParts = (hour24: number): { hour12: number; ampm: 'AM' | 'PM' } => {
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    let hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12;
    return { hour12, ampm };
  };

  const { hour12, ampm } = value ? get12HourParts(getISTParts(new Date(value)).hour) : { hour12: 12, ampm: 'AM' as const };
  const minuteVal = value ? getISTParts(new Date(value)).minute : 0;

  const handleDateChange = (date?: Date) => {
    if (!date) return;
    const currentIST = value ? getISTParts(new Date(value)) : getISTParts(new Date());
    const utcIso = getUtcIsoString(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      currentIST.hour,
      currentIST.minute
    );
    onChange(utcIso);
  };

  const handle12HourTimeChange = (h12: number, min: number, am_pm: 'AM' | 'PM') => {
    let h24 = h12;
    if (am_pm === 'PM' && h12 < 12) h24 += 12;
    if (am_pm === 'AM' && h12 === 12) h24 = 0;

    const currentIST = value ? getISTParts(new Date(value)) : getISTParts(new Date());
    const utcIso = getUtcIsoString(
      currentIST.year,
      currentIST.month,
      currentIST.day,
      h24,
      min
    );
    onChange(utcIso);
  };

  const adjustHour = (amount: number) => {
    let nextHour = hour12 + amount;
    if (nextHour > 12) nextHour = 1;
    if (nextHour < 1) nextHour = 12;
    handle12HourTimeChange(nextHour, minuteVal, ampm);
  };

  const adjustMinute = (amount: number) => {
    let nextMinute = minuteVal + amount;
    if (nextMinute >= 60) nextMinute = 0;
    if (nextMinute < 0) nextMinute = 59;
    handle12HourTimeChange(hour12, nextMinute, ampm);
  };

  return (
    <div className={className}>
      <Popover modal={false}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="
              w-full justify-start text-left font-normal
              bg-white/5 border-white/10 text-white
              hover:bg-white/10 hover:border-white/20
            "
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
            {value
              ? formatToISTDisplay(value)
              : 'Select date & time'}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-900 border border-white/10 text-white rounded-xl w-auto shadow-2xl max-h-[80vh] sm:max-h-none overflow-y-auto"
          align="start"
        >
          <div>
            <Calendar
              mode="single"
              selected={localDateForCalendar}
              onSelect={handleDateChange}
              initialFocus
            />
          </div>

          <div className="sm:border-l sm:border-white/10 sm:pl-4 flex flex-col items-center justify-center min-w-[140px] pt-3 sm:pt-0">
            <span className="text-xs text-gray-400 font-semibold mb-3 flex items-center gap-1.5 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-green-400" /> Time (IST)
            </span>

            <div className="flex items-center gap-3">
              {/* Hours adjuster */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => adjustHour(1)}
                  className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                <span className="text-2xl font-bold font-mono text-white select-none">
                  {String(hour12).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  onClick={() => adjustHour(-1)}
                  className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>

              <span className="text-xl font-bold text-gray-500 mb-1">:</span>

              {/* Minutes adjuster */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => adjustMinute(1)}
                  className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                <span className="text-2xl font-bold font-mono text-white select-none">
                  {String(minuteVal).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  onClick={() => adjustMinute(-1)}
                  className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>

              {/* AM/PM Toggle */}
              <div className="flex flex-col gap-1.5 ml-1">
                <button
                  type="button"
                  onClick={() => handle12HourTimeChange(hour12, minuteVal, 'AM')}
                  className={`px-2 py-1 text-xs font-bold rounded transition-all border ${
                    ampm === 'AM'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'text-gray-500 hover:text-white border-transparent'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => handle12HourTimeChange(hour12, minuteVal, 'PM')}
                  className={`px-2 py-1 text-xs font-bold rounded transition-all border ${
                    ampm === 'PM'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'text-gray-500 hover:text-white border-transparent'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}