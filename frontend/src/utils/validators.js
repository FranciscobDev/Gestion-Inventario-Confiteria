/**
 * Utilidades de tipado estricto para inputs numéricos y de formato.
 */

const ALLOWED_CONTROL_KEYS = new Set([
  'Backspace',
  'Delete',
  'Tab',
  'Escape',
  'Enter',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
]);

/**
 * Elimina cualquier carácter que no sea dígito (0-9). Impide strings, signos y decimales.
 */
export function onlyIntegers(value) {
  return String(value ?? '').replace(/\D/g, '');
}

/**
 * Bloquea en tiempo real teclas no numéricas (letras, 'e', '+', '-', '.', ',') en inputs enteros.
 */
export function blockNonIntegerKeys(e) {
  if (e.ctrlKey || e.metaKey || e.altKey || ALLOWED_CONTROL_KEYS.has(e.key)) {
    return;
  }
  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
  }
}

/**
 * Sanitiza teléfonos permitiendo solo dígitos, '+', '-' y espacios.
 */
export function onlyPhoneChars(value) {
  return String(value ?? '').replace(/[^\d+\-\s]/g, '');
}

/**
 * Sanitiza RUT chileno permitiendo dígitos, puntos, guion y K/k.
 */
export function onlyRutChars(value) {
  return String(value ?? '').replace(/[^\dkK.\-]/g, '').toUpperCase();
}

/**
 * Valida requisitos de seguridad para contraseñas de registro:
 * Mínimo 8 caracteres, al menos una mayúscula y al menos un símbolo.
 */
export function validatePasswordStrength(pwd) {
  if (!pwd || pwd.length < 8) {
    return { ok: false, error: 'La contraseña debe tener al menos 8 caracteres.' };
  }
  if (!/[A-Z]/.test(pwd)) {
    return { ok: false, error: 'La contraseña debe incluir al menos una letra mayúscula.' };
  }
  if (!/[^A-Za-z0-9]/.test(pwd)) {
    return { ok: false, error: 'La contraseña debe incluir al menos un símbolo (ej: !@#$%&*).' };
  }
  return { ok: true };
}

/**
 * Props reutilizables para un input estrictamente entero.
 */
export function integerInputProps(value, onValidChange, { min = 0 } = {}) {
  return {
    type: 'text',
    inputMode: 'numeric',
    pattern: '[0-9]*',
    value: value ?? '',
    onKeyDown: blockNonIntegerKeys,
    onChange: (e) => {
      const clean = onlyIntegers(e.target.value);
      if (clean === '') {
        onValidChange('');
        return;
      }
      const num = parseInt(clean, 10);
      onValidChange(String(Math.max(min, num)));
    },
  };
}
