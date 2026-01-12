import type { Field } from 'payload'

/**
 * Payload does not have a native `uuid` field type. The recommended approach is to use a
 * `text` field with UUID validation. This helper returns a reusable UUID field definition.
 */
export function uuidField(params: {
  name: string
  label?: string
  required?: boolean
  description?: string
}): Field {
  const { name, label, required = true, description = 'UUID (validated as RFC4122)'} = params
  return {
    name,
    type: 'text',
    required,
    label,
    admin: { description },
    validate: (val: unknown) => {
      if (typeof val !== 'string') return 'Must be a string'
      // relaxed RFC4122 UUID regex covering versions 1-5
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      return uuidRegex.test(val) || 'Must be a valid UUID'
    },
  }
}
