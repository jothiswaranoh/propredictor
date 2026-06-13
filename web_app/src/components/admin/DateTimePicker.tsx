import { CalendarIcon, Clock } from 'lucide-react';
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

  const timeValueString = value ? (() => {
    const parts = getISTParts(new Date(value));
    const hh = String(parts.hour).padStart(2, '0');
    const mm = String(parts.minute).padStart(2, '0');
    return `${hh}:${mm}`;
  })() : '';

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

  const handleTimeChange = (time: string) => {
    if (!time) return;
    const [hours, minutes] = time.split(':').map(Number);
    const currentIST = value ? getISTParts(new Date(value)) : getISTParts(new Date());
    const utcIso = getUtcIsoString(
      currentIST.year,
      currentIST.month,
      currentIST.day,
      hours,
      minutes
    );
    onChange(utcIso);
  };

  return (
    <div className={className}>
      <Popover>
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
          className="w-auto p-3 bg-gray-900 border-white/10"
          align="start"
        >
          <Calendar
            mode="single"
            selected={localDateForCalendar}
            onSelect={handleDateChange}
            initialFocus
          />

          <div className="mt-3 border-t border-white/10 pt-3">
            <label className="mb-2 flex items-center gap-2 text-sm text-gray-300">
              <Clock className="h-4 w-4" />
              Time <span className="text-gray-500 text-xs">(IST)</span>
            </label>

            <input
              type="time"
              value={timeValueString}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="
                w-full rounded-lg
                bg-white/5 border border-white/10
                px-3 py-2 text-white
                [color-scheme:dark]
              "
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}