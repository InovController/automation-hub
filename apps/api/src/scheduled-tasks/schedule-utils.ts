import { BadRequestException } from '@nestjs/common';
import { ScheduleFrequency } from '@prisma/client';

export function parseTimeOfDay(value?: string | null) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    return null;
  }

  const [hour, minute] = value.split(':').map(Number);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return { hour, minute };
}

export function computeNextRunAt(input: {
  frequency: ScheduleFrequency;
  timeOfDay: string;
  startDate?: Date | null;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  from?: Date;
}) {
  const parsedTime = parseTimeOfDay(input.timeOfDay);
  if (!parsedTime) {
    throw new BadRequestException('Horario invalido.');
  }

  const from = input.from ?? new Date();
  const base = new Date(from);
  base.setSeconds(0, 0);

  const startDate = input.startDate ? new Date(input.startDate) : null;
  if (startDate) {
    startDate.setHours(parsedTime.hour, parsedTime.minute, 0, 0);
  }

  if (input.frequency === ScheduleFrequency.once || input.frequency === ScheduleFrequency.daily) {
    const candidate = startDate ? new Date(startDate) : new Date(base);
    if (!startDate) {
      candidate.setHours(parsedTime.hour, parsedTime.minute, 0, 0);
    }

    if (input.frequency === ScheduleFrequency.once) {
      if (candidate <= from) {
        throw new BadRequestException('Agendamento de uma vez deve estar no futuro.');
      }

      return candidate;
    }

    // Avança quantos dias forem necessários: com startDate no passado, um único
    // incremento devolvia nextRunAt no passado e a tarefa disparava em loop.
    while (candidate <= from) {
      candidate.setDate(candidate.getDate() + 1);
    }

    return candidate;
  }

  if (input.frequency === ScheduleFrequency.weekly) {
    if (
      input.dayOfWeek === undefined ||
      input.dayOfWeek === null ||
      !Number.isInteger(input.dayOfWeek) ||
      input.dayOfWeek < 0 ||
      input.dayOfWeek > 6
    ) {
      throw new BadRequestException('Dia da semana invalido.');
    }

    const candidate = new Date(base);
    candidate.setHours(parsedTime.hour, parsedTime.minute, 0, 0);

    const currentDay = candidate.getDay();
    let delta = input.dayOfWeek - currentDay;
    if (delta < 0 || (delta === 0 && candidate <= from)) {
      delta += 7;
    }

    candidate.setDate(candidate.getDate() + delta);
    return candidate;
  }

  if (
    input.dayOfMonth === undefined ||
    input.dayOfMonth === null ||
    !Number.isInteger(input.dayOfMonth) ||
    input.dayOfMonth < 1 ||
    input.dayOfMonth > 31
  ) {
    throw new BadRequestException('Dia do mes invalido.');
  }

  let year = base.getFullYear();
  let month = base.getMonth();

  while (true) {
    const maxDay = new Date(year, month + 1, 0).getDate();
    const day = Math.min(input.dayOfMonth, maxDay);
    const candidate = new Date(
      year,
      month,
      day,
      parsedTime.hour,
      parsedTime.minute,
      0,
      0,
    );
    if (candidate > from) {
      return candidate;
    }

    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
}

export function computeNextRunAtMultiple(input: {
  frequency: ScheduleFrequency;
  timesOfDay: string[];
  startDate?: Date | null;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  from?: Date;
}): Date {
  const { timesOfDay, ...rest } = input;
  const candidates = timesOfDay
    .map((timeOfDay) => {
      try {
        return computeNextRunAt({ ...rest, timeOfDay });
      } catch {
        return null;
      }
    })
    .filter((d): d is Date => d !== null);

  if (candidates.length === 0) {
    throw new BadRequestException('Nenhum horário válido encontrado.');
  }

  return candidates.reduce((min, d) => (d < min ? d : min));
}

export function frequencyLabel(value: ScheduleFrequency) {
  return {
    once: 'Uma vez',
    daily: 'Diario',
    weekly: 'Semanal',
    monthly: 'Mensal',
  }[value];
}
