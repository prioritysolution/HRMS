export const DEACTIVATE_CONFIRM_MESSAGE = 'This will set "{name}" to Inactive.';
export const ACTIVATE_CONFIRM_MESSAGE = 'This will set "{name}" to Active.';

export function formatConfirmMessage(template: string, name: string): string {
  return template.replace(/\{name\}/g, name);
}

export function getDeactivateConfirmMessage(name: string): string {
  return formatConfirmMessage(DEACTIVATE_CONFIRM_MESSAGE, name);
}

export function getActivateConfirmMessage(name: string): string {
  return formatConfirmMessage(ACTIVATE_CONFIRM_MESSAGE, name);
}
