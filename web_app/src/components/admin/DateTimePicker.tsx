
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateTimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  className = '',
  disabled = false,
}: DateTimePickerProps) {
  const selectedDate = value ? new Date(value) : undefined;

  const handleDateChange = (date?: Date) => {
    if (!date) return;

    const current = selectedDate || new Date();

    date.setHours(current.getHours());
    date.setMinutes(current.getMinutes());

    onChange(date.toISOString());
  };

  const handleTimeChange = (time: string) => {
    if (!selectedDate) return;

    const [hours, minutes] = time.split(':').map(Number);

    const updated = new Date(selectedDate);
    updated.setHours(hours);
    updated.setMinutes(minutes);

    onChange(updated.toISOString());
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

            {selectedDate
              ? format(selectedDate, 'dd MMM yyyy, hh:mm a')
              : 'Select date & time'}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-auto p-3 bg-gray-900 border-white/10"
          align="start"
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateChange}
            initialFocus
          />

          <div className="mt-3 border-t border-white/10 pt-3">
            <label className="mb-2 flex items-center gap-2 text-sm text-gray-300">
              <Clock className="h-4 w-4" />
              Time
            </label>

            <input
              type="time"
              value={
                selectedDate
                  ? format(selectedDate, 'HH:mm')
                  : ''
              }
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