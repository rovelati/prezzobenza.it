import nationalStats from '../data/national-stats.json';

const isoDate = nationalStats.lastUpdated || new Date().toISOString();
const d = new Date(isoDate);

export const lastUpdatedFull = `${d.toLocaleDateString('it-IT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Rome',
})} alle ore ${d.toLocaleTimeString('it-IT', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Rome',
})}`;

export const lastUpdatedShort = d.toLocaleDateString('it-IT', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Europe/Rome',
});

export const lastUpdatedISO = isoDate;
