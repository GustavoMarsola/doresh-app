import React from 'react';
import { WEEKDAYS, type Weekday } from '@/lib/readingPlans';
import { cn } from '@/lib/utils';

/** Dias da semana em que a pessoa lê, com atalhos "Todos os dias" e "Só dias úteis". */
export const WeekdayPicker: React.FC<{ value: Weekday[]; onChange: (value: Weekday[]) => void }> = ({ value, onChange }) => {
  const toggle = (day: Weekday) =>
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day].sort((a, b) => a - b));

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium leading-none">Dias de leitura</legend>
      <div className="flex flex-wrap gap-2 pt-1">
        {WEEKDAYS.map((day) => {
          const active = value.includes(day.value);
          return (
            <button
              key={day.value}
              type="button"
              aria-pressed={active}
              aria-label={day.long}
              title={day.long}
              onClick={() => toggle(day.value)}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground',
              )}
            >
              {day.short}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-sm">
        <button type="button" className="font-medium text-primary hover:underline" onClick={() => onChange([1, 2, 3, 4, 5, 6, 7])}>
          Todos os dias
        </button>
        <button type="button" className="font-medium text-primary hover:underline" onClick={() => onChange([1, 2, 3, 4, 5])}>
          Só dias úteis
        </button>
      </div>
    </fieldset>
  );
};
