/**
 * Convert value to booelan, used for `Input()` declarition w/o the need to supply a boolean value
 * @param value - The value
 */
export function toBoolean(value: any): boolean {
  return value != null && `${value}` !== 'false';
}
